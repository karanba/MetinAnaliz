"""
PDF Router
PDF dosya işlemleri için API endpoint'leri.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel

from services.pdf_service import (
    pdf_service,
    PDFValidationError,
    PDFConversionError,
    PDF_MAX_FILE_SIZE_MB,
)

router = APIRouter(prefix="/pdf", tags=["pdf"])


class ValidationResponse(BaseModel):
    is_valid: bool
    file_name: str
    file_size: int
    page_count: int | None = None
    error: str | None = None


class ConversionResponse(BaseModel):
    success: bool
    file_id: str
    original_name: str
    output_name: str | None = None
    error: str | None = None


class StatsResponse(BaseModel):
    active_files: int
    temp_dir: str
    max_file_size_mb: int
    retention_minutes: int


class CleanupResponse(BaseModel):
    cleaned_count: int
    message: str


@router.post("/validate", response_model=ValidationResponse)
async def validate_pdf(
    file: UploadFile = File(..., description="PDF dosyası"),
) -> ValidationResponse:
    """
    PDF dosyasını doğrula.

    Dosya boyutu, MIME tipi ve PDF formatı kontrol edilir.

    Returns:
        Doğrulama sonucu (is_valid, file_name, file_size, page_count, error)
    """
    # Check content type
    content_type = file.content_type

    # Read file content
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Dosya okunamadı: {e}") from e

    # Validate
    result = await pdf_service.validate_pdf(
        content=content,
        filename=file.filename or "unknown.pdf",
        content_type=content_type,
    )

    return ValidationResponse(**result.to_dict())


@router.post("/convert-to-word", response_model=ConversionResponse)
async def convert_to_word(
    file: UploadFile = File(..., description="PDF dosyası"),
    start_page: int = Form(default=0, ge=0, description="Başlangıç sayfası (0-indexed)"),
    end_page: int | None = Form(default=None, ge=0, description="Bitiş sayfası (None = tümü)"),
) -> ConversionResponse:
    """
    PDF dosyasını Word (DOCX) formatına dönüştür.

    Dosya önce doğrulanır, sonra dönüştürülür.
    Dönüştürülen dosyayı indirmek için /download/{file_id} endpoint'ini kullanın.

    Args:
        file: PDF dosyası
        start_page: Başlangıç sayfası (0-indexed, default: 0)
        end_page: Bitiş sayfası (None = tüm sayfalar)

    Returns:
        Dönüşüm sonucu (success, file_id, original_name, output_name, error)
    """
    content_type = file.content_type

    # Read file content
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Dosya okunamadı: {e}") from e

    # Validate first
    validation = await pdf_service.validate_pdf(
        content=content,
        filename=file.filename or "unknown.pdf",
        content_type=content_type,
    )

    if not validation.is_valid:
        return ConversionResponse(
            success=False,
            file_id="",
            original_name=validation.file_name,
            error=validation.error,
        )

    # Convert
    result = await pdf_service.convert_to_word(
        content=content,
        filename=file.filename or "unknown.pdf",
        start_page=start_page,
        end_page=end_page,
    )

    return ConversionResponse(**result.to_dict())


@router.get("/download/{file_id}")
async def download_converted_file(file_id: str) -> Response:
    """
    Dönüştürülmüş dosyayı indir.

    Args:
        file_id: Dönüşüm sonucu dönen file_id

    Returns:
        DOCX dosyası
    """
    result = await pdf_service.get_converted_file(file_id)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Dosya bulunamadı veya süresi dolmuş",
        )

    content, filename = result

    # Delete file after download (one-time download)
    await pdf_service.delete_converted_file(file_id)

    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


@router.get("/stats", response_model=StatsResponse)
async def get_stats() -> StatsResponse:
    """
    PDF servis istatistiklerini al.

    Returns:
        Servis durumu ve istatistikleri
    """
    stats = pdf_service.get_stats()
    return StatsResponse(**stats)


@router.delete("/cleanup", response_model=CleanupResponse)
async def cleanup_expired_files() -> CleanupResponse:
    """
    Süresi dolmuş dosyaları temizle.

    Bu endpoint admin kullanımı içindir.

    Returns:
        Temizlenen dosya sayısı
    """
    count = await pdf_service.cleanup_expired_files()
    return CleanupResponse(
        cleaned_count=count,
        message=f"{count} dosya temizlendi",
    )


@router.get("/config")
async def get_config() -> dict[str, Any]:
    """
    PDF işlemleri için yapılandırma bilgilerini al.

    Frontend'in boyut limitleri vb. bilgilere erişmesi için.
    """
    return {
        "max_file_size_mb": PDF_MAX_FILE_SIZE_MB,
        "max_file_size_bytes": PDF_MAX_FILE_SIZE_MB * 1024 * 1024,
        "allowed_types": ["application/pdf"],
        "allowed_extensions": [".pdf"],
    }
