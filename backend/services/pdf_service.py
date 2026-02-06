"""
PDF Service
PDF dosya işlemleri için servis modülü.
"""
from __future__ import annotations

import asyncio
import hashlib
import os
import re
import shutil
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import aiofiles
import aiofiles.os

# PDF conversion library
try:
    from pdf2docx import Converter
    PDF2DOCX_AVAILABLE = True
except ImportError:
    PDF2DOCX_AVAILABLE = False

# PDF merge library
try:
    from pypdf import PdfReader, PdfWriter
    PYPDF_AVAILABLE = True
except ImportError:
    PYPDF_AVAILABLE = False

# Environment configuration
PDF_MAX_FILE_SIZE_MB = int(os.getenv("PDF_MAX_FILE_SIZE_MB", "50"))
PDF_MAX_FILES_PER_REQUEST = int(os.getenv("PDF_MAX_FILES_PER_REQUEST", "10"))
PDF_TEMP_DIR = os.getenv("PDF_TEMP_DIR", "temp/pdf_processing")
PDF_CLEANUP_INTERVAL_MINUTES = int(os.getenv("PDF_CLEANUP_INTERVAL_MINUTES", "30"))
PDF_FILE_RETENTION_MINUTES = int(os.getenv("PDF_FILE_RETENTION_MINUTES", "15"))

# Constants
PDF_MAGIC_BYTES = b"%PDF-"
ALLOWED_MIME_TYPES = {"application/pdf"}


class PDFValidationError(Exception):
    """PDF doğrulama hatası."""
    pass


class PDFConversionError(Exception):
    """PDF dönüştürme hatası."""
    pass


class PDFValidationResult:
    """PDF doğrulama sonucu."""

    def __init__(
        self,
        is_valid: bool,
        file_name: str,
        file_size: int,
        page_count: int | None = None,
        error: str | None = None,
    ):
        self.is_valid = is_valid
        self.file_name = file_name
        self.file_size = file_size
        self.page_count = page_count
        self.error = error

    def to_dict(self) -> dict[str, Any]:
        return {
            "is_valid": self.is_valid,
            "file_name": self.file_name,
            "file_size": self.file_size,
            "page_count": self.page_count,
            "error": self.error,
        }


class ConversionResult:
    """Dönüştürme sonucu."""

    def __init__(
        self,
        success: bool,
        file_id: str,
        original_name: str,
        output_name: str | None = None,
        error: str | None = None,
    ):
        self.success = success
        self.file_id = file_id
        self.original_name = original_name
        self.output_name = output_name
        self.error = error

    def to_dict(self) -> dict[str, Any]:
        return {
            "success": self.success,
            "file_id": self.file_id,
            "original_name": self.original_name,
            "output_name": self.output_name,
            "error": self.error,
        }


class MergeResult:
    """PDF birleştirme sonucu."""

    def __init__(
        self,
        success: bool,
        file_id: str,
        output_name: str | None = None,
        total_pages: int = 0,
        merged_count: int = 0,
        error: str | None = None,
    ):
        self.success = success
        self.file_id = file_id
        self.output_name = output_name
        self.total_pages = total_pages
        self.merged_count = merged_count
        self.error = error

    def to_dict(self) -> dict[str, Any]:
        return {
            "success": self.success,
            "file_id": self.file_id,
            "output_name": self.output_name,
            "total_pages": self.total_pages,
            "merged_count": self.merged_count,
            "error": self.error,
        }


class PDFService:
    """
    PDF işlemleri servisi.
    Dosya doğrulama, dönüştürme ve temizleme işlemlerini yönetir.
    """

    def __init__(self):
        self._temp_dir = Path(PDF_TEMP_DIR)
        self._cleanup_task: asyncio.Task | None = None
        self._file_registry: dict[str, dict[str, Any]] = {}  # file_id -> metadata

    async def initialize(self) -> None:
        """Servisi başlat ve geçici dizini oluştur."""
        await aiofiles.os.makedirs(self._temp_dir, exist_ok=True)
        # Start cleanup task
        self._cleanup_task = asyncio.create_task(self._scheduled_cleanup())

    async def shutdown(self) -> None:
        """Servisi kapat ve tüm geçici dosyaları temizle."""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass

        # Clean all temp files
        await self._cleanup_all_files()

    def sanitize_filename(self, filename: str) -> str:
        """
        Dosya adını güvenli hale getir.

        - Path traversal karakterlerini kaldır
        - Özel karakterleri temizle
        - Maksimum uzunluğu sınırla
        """
        # Remove path separators
        filename = os.path.basename(filename)

        # Remove null bytes and control characters
        filename = re.sub(r'[\x00-\x1f\x7f]', '', filename)

        # Replace potentially dangerous characters
        filename = re.sub(r'[<>:"/\\|?*]', '_', filename)

        # Limit length
        name, ext = os.path.splitext(filename)
        if len(name) > 100:
            name = name[:100]

        return f"{name}{ext}"

    async def validate_pdf(
        self,
        content: bytes,
        filename: str,
        content_type: str | None = None,
    ) -> PDFValidationResult:
        """
        PDF dosyasını doğrula.

        Kontroller:
        1. Dosya boyutu
        2. MIME type
        3. Magic bytes (%PDF-)
        4. Sayfa sayısı (opsiyonel)
        """
        safe_filename = self.sanitize_filename(filename)
        file_size = len(content)

        # Check file size
        max_size_bytes = PDF_MAX_FILE_SIZE_MB * 1024 * 1024
        if file_size > max_size_bytes:
            return PDFValidationResult(
                is_valid=False,
                file_name=safe_filename,
                file_size=file_size,
                error=f"Dosya boyutu {PDF_MAX_FILE_SIZE_MB}MB sınırını aşıyor",
            )

        if file_size == 0:
            return PDFValidationResult(
                is_valid=False,
                file_name=safe_filename,
                file_size=file_size,
                error="Dosya boş",
            )

        # Check MIME type if provided
        if content_type and content_type not in ALLOWED_MIME_TYPES:
            return PDFValidationResult(
                is_valid=False,
                file_name=safe_filename,
                file_size=file_size,
                error=f"Geçersiz dosya tipi: {content_type}",
            )

        # Check magic bytes
        if not content.startswith(PDF_MAGIC_BYTES):
            return PDFValidationResult(
                is_valid=False,
                file_name=safe_filename,
                file_size=file_size,
                error="Geçersiz PDF formatı (magic bytes)",
            )

        # Try to get page count
        page_count = await self._get_page_count(content)

        return PDFValidationResult(
            is_valid=True,
            file_name=safe_filename,
            file_size=file_size,
            page_count=page_count,
        )

    async def _get_page_count(self, content: bytes) -> int | None:
        """PDF sayfa sayısını al (basit yöntem)."""
        try:
            # Simple regex-based page count (not 100% accurate but fast)
            count = content.count(b"/Type /Page") - content.count(b"/Type /Pages")
            return max(1, count) if count > 0 else None
        except Exception:
            return None

    async def convert_to_word(
        self,
        content: bytes,
        filename: str,
        start_page: int = 0,
        end_page: int | None = None,
    ) -> ConversionResult:
        """
        PDF'i Word (DOCX) formatına dönüştür.

        Args:
            content: PDF dosya içeriği
            filename: Orijinal dosya adı
            start_page: Başlangıç sayfası (0-indexed)
            end_page: Bitiş sayfası (None = tüm sayfalar)

        Returns:
            ConversionResult with file_id for download
        """
        if not PDF2DOCX_AVAILABLE:
            return ConversionResult(
                success=False,
                file_id="",
                original_name=filename,
                error="pdf2docx kütüphanesi yüklü değil",
            )

        # Generate unique file ID
        file_id = str(uuid.uuid4())
        safe_filename = self.sanitize_filename(filename)
        base_name = os.path.splitext(safe_filename)[0]
        output_name = f"{base_name}.docx"

        # Create file paths
        input_path = self._temp_dir / f"{file_id}_input.pdf"
        output_path = self._temp_dir / f"{file_id}_output.docx"

        try:
            # Save input file
            async with aiofiles.open(input_path, "wb") as f:
                await f.write(content)

            # Convert in thread pool (pdf2docx is sync)
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                self._sync_convert_pdf_to_docx,
                str(input_path),
                str(output_path),
                start_page,
                end_page,
            )

            # Verify output exists
            if not output_path.exists():
                raise PDFConversionError("Dönüştürme başarısız - çıktı dosyası oluşturulamadı")

            # Register file for cleanup
            self._file_registry[file_id] = {
                "input_path": str(input_path),
                "output_path": str(output_path),
                "output_name": output_name,
                "created_at": datetime.utcnow(),
            }

            return ConversionResult(
                success=True,
                file_id=file_id,
                original_name=safe_filename,
                output_name=output_name,
            )

        except Exception as e:
            # Cleanup on error
            for path in [input_path, output_path]:
                try:
                    if path.exists():
                        await aiofiles.os.remove(path)
                except Exception:
                    pass

            return ConversionResult(
                success=False,
                file_id=file_id,
                original_name=safe_filename,
                error=str(e),
            )

    def _sync_convert_pdf_to_docx(
        self,
        input_path: str,
        output_path: str,
        start_page: int,
        end_page: int | None,
    ) -> None:
        """Senkron PDF -> DOCX dönüşümü (thread pool'da çalışır)."""
        cv = Converter(input_path)
        try:
            cv.convert(output_path, start=start_page, end=end_page)
        finally:
            cv.close()

    async def merge_pdfs(
        self,
        files: list[tuple[bytes, str]],
        output_name: str = "merged.pdf",
    ) -> MergeResult:
        """
        Birden fazla PDF dosyasını birleştir.

        Args:
            files: Liste of (content, filename) tuples
            output_name: Çıktı dosya adı

        Returns:
            MergeResult with file_id for download
        """
        if not PYPDF_AVAILABLE:
            return MergeResult(
                success=False,
                file_id="",
                error="pypdf kütüphanesi yüklü değil",
            )

        # Check file count limit
        if len(files) > PDF_MAX_FILES_PER_REQUEST:
            return MergeResult(
                success=False,
                file_id="",
                error=f"En fazla {PDF_MAX_FILES_PER_REQUEST} dosya birleştirilebilir",
            )

        if len(files) < 2:
            return MergeResult(
                success=False,
                file_id="",
                error="En az 2 dosya gerekli",
            )

        # Generate unique file ID
        file_id = str(uuid.uuid4())
        safe_output_name = self.sanitize_filename(output_name)
        if not safe_output_name.lower().endswith('.pdf'):
            safe_output_name += '.pdf'

        # Create file paths for inputs
        input_paths: list[Path] = []
        output_path = self._temp_dir / f"{file_id}_merged.pdf"

        try:
            # Save input files
            for idx, (content, filename) in enumerate(files):
                input_path = self._temp_dir / f"{file_id}_input_{idx}.pdf"
                async with aiofiles.open(input_path, "wb") as f:
                    await f.write(content)
                input_paths.append(input_path)

            # Merge in thread pool (pypdf is sync)
            loop = asyncio.get_event_loop()
            total_pages = await loop.run_in_executor(
                None,
                self._sync_merge_pdfs,
                [str(p) for p in input_paths],
                str(output_path),
            )

            # Verify output exists
            if not output_path.exists():
                raise PDFConversionError("Birleştirme başarısız - çıktı dosyası oluşturulamadı")

            # Register file for cleanup
            self._file_registry[file_id] = {
                "input_paths": [str(p) for p in input_paths],
                "output_path": str(output_path),
                "output_name": safe_output_name,
                "created_at": datetime.utcnow(),
            }

            return MergeResult(
                success=True,
                file_id=file_id,
                output_name=safe_output_name,
                total_pages=total_pages,
                merged_count=len(files),
            )

        except Exception as e:
            # Cleanup on error
            for path in input_paths + [output_path]:
                try:
                    if path.exists():
                        await aiofiles.os.remove(path)
                except Exception:
                    pass

            return MergeResult(
                success=False,
                file_id=file_id,
                error=str(e),
            )

    def _sync_merge_pdfs(
        self,
        input_paths: list[str],
        output_path: str,
    ) -> int:
        """Senkron PDF birleştirme (thread pool'da çalışır)."""
        writer = PdfWriter()
        total_pages = 0

        for input_path in input_paths:
            reader = PdfReader(input_path)
            for page in reader.pages:
                writer.add_page(page)
                total_pages += 1

        with open(output_path, "wb") as f:
            writer.write(f)

        return total_pages

    async def get_converted_file(self, file_id: str) -> tuple[bytes, str] | None:
        """
        Dönüştürülmüş dosyayı al.

        Returns:
            (content, filename) veya None
        """
        if file_id not in self._file_registry:
            return None

        metadata = self._file_registry[file_id]
        output_path = Path(metadata["output_path"])

        if not output_path.exists():
            return None

        async with aiofiles.open(output_path, "rb") as f:
            content = await f.read()

        return content, metadata["output_name"]

    async def delete_converted_file(self, file_id: str) -> bool:
        """Dönüştürülmüş dosyayı sil."""
        if file_id not in self._file_registry:
            return False

        metadata = self._file_registry.pop(file_id)

        # Handle single input_path (conversion)
        if "input_path" in metadata:
            path = Path(metadata["input_path"])
            try:
                if path.exists():
                    await aiofiles.os.remove(path)
            except Exception:
                pass

        # Handle multiple input_paths (merge)
        if "input_paths" in metadata:
            for input_path in metadata["input_paths"]:
                path = Path(input_path)
                try:
                    if path.exists():
                        await aiofiles.os.remove(path)
                except Exception:
                    pass

        # Delete output file
        if "output_path" in metadata:
            path = Path(metadata["output_path"])
            try:
                if path.exists():
                    await aiofiles.os.remove(path)
            except Exception:
                pass

        return True

    async def cleanup_expired_files(self) -> int:
        """Süresi dolmuş dosyaları temizle."""
        cutoff = datetime.utcnow() - timedelta(minutes=PDF_FILE_RETENTION_MINUTES)
        expired_ids = []

        for file_id, metadata in self._file_registry.items():
            if metadata["created_at"] < cutoff:
                expired_ids.append(file_id)

        for file_id in expired_ids:
            await self.delete_converted_file(file_id)

        return len(expired_ids)

    async def _cleanup_all_files(self) -> None:
        """Tüm geçici dosyaları temizle."""
        file_ids = list(self._file_registry.keys())
        for file_id in file_ids:
            await self.delete_converted_file(file_id)

        # Also clean any orphaned files in temp dir
        try:
            if self._temp_dir.exists():
                for file in self._temp_dir.iterdir():
                    try:
                        await aiofiles.os.remove(file)
                    except Exception:
                        pass
        except Exception:
            pass

    async def _scheduled_cleanup(self) -> None:
        """Zamanlanmış temizleme görevi."""
        interval = PDF_CLEANUP_INTERVAL_MINUTES * 60
        while True:
            try:
                await asyncio.sleep(interval)
                count = await self.cleanup_expired_files()
                if count > 0:
                    print(f"PDF cleanup: {count} expired file(s) removed")
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"PDF cleanup error: {e}")

    def get_stats(self) -> dict[str, Any]:
        """Servis istatistiklerini al."""
        return {
            "active_files": len(self._file_registry),
            "temp_dir": str(self._temp_dir),
            "max_file_size_mb": PDF_MAX_FILE_SIZE_MB,
            "retention_minutes": PDF_FILE_RETENTION_MINUTES,
        }


# Global service instance
pdf_service = PDFService()
