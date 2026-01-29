from __future__ import annotations

import csv
import io
import math
import re
from pathlib import Path
from enum import Enum
from typing import Dict, List, Protocol

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

VOWELS = set("aeıioöuü")


class AnalyzeRequest(BaseModel):
    text: str = Field(..., description="Turkish text to analyze")


class WordInfo(BaseModel):
    word: str
    syllable_count: int


class SentenceInfo(BaseModel):
    sentence_index: int
    sentence_text: str
    words: List[WordInfo]


class Statistics(BaseModel):
    total_sentences: int
    total_words: int
    total_syllables: int
    syllable_distribution: dict
    yod_value: float


class AnalyzeResponse(BaseModel):
    sentences: List[SentenceInfo]
    statistics: Statistics


class ExportFormat(str, Enum):
    csv = "csv"
    txt = "txt"
    pdf = "pdf"


class ExportRequest(BaseModel):
    text: str = Field(..., description="Turkish text to analyze")
    format: ExportFormat = Field(..., description="Export format")


class Exporter(Protocol):
    format: ExportFormat
    content_type: str
    extension: str

    def export(self, analysis: AnalyzeResponse) -> bytes:
        ...


def split_sentences(text: str) -> List[str]:
    # Split on ., ?, ! with optional trailing whitespace.
    parts = re.split(r"[.!?]+\s*", text.strip())
    return [p for p in (part.strip() for part in parts) if p]


def extract_words(sentence: str) -> List[str]:
    # Match Turkish letters and standard ASCII letters.
    return re.findall(r"[A-Za-zÇĞİÖŞÜçğıöşü]+", sentence)


def count_syllables(word: str) -> int:
    return sum(1 for ch in word.lower() if ch in VOWELS)


def analyze_text(text: str) -> AnalyzeResponse:
    if not isinstance(text, str):
        raise ValueError("text must be a string")
    cleaned = text.strip()
    if not cleaned:
        raise ValueError("text cannot be empty")

    sentences_raw = split_sentences(cleaned)
    total_sentences = len(sentences_raw)
    total_words = 0
    total_syllables = 0
    syllable_counts = {}

    sentences: List[SentenceInfo] = []

    for idx, sentence in enumerate(sentences_raw, start=1):
        words_raw = extract_words(sentence)
        words: List[WordInfo] = []
        for word in words_raw:
            syllables = count_syllables(word)
            total_words += 1
            total_syllables += syllables
            syllable_counts[syllables] = syllable_counts.get(syllables, 0) + 1
            words.append(WordInfo(word=word, syllable_count=syllables))

        sentences.append(
            SentenceInfo(
                sentence_index=idx,
                sentence_text=sentence,
                words=words,
            )
        )

    if total_sentences == 0:
        oks = 0.0
    else:
        oks = total_words / total_sentences

    def ratio_for(count: int) -> float:
        if total_sentences == 0:
            return 0.0
        return syllable_counts.get(count, 0) / total_sentences

    h3 = ratio_for(3)
    h4 = ratio_for(4)
    h5 = ratio_for(5)
    h6 = ratio_for(6)

    yod_value = math.sqrt(oks * ((h3 * 0.84) + (h4 * 1.5) + (h5 * 3.5) + (h6 * 26.25)))

    stats = Statistics(
        total_sentences=total_sentences,
        total_words=total_words,
        total_syllables=total_syllables,
        syllable_distribution={
            3: h3,
            4: h4,
            5: h5,
            6: h6,
        },
        yod_value=yod_value,
    )

    return AnalyzeResponse(sentences=sentences, statistics=stats)


def _build_text_lines(analysis: AnalyzeResponse) -> List[str]:
    stats = analysis.statistics
    lines = [
        "Metin Analizi",
        "================",
        f"Toplam Cümle: {stats.total_sentences}",
        f"Toplam Kelime: {stats.total_words}",
        f"Toplam Hece: {stats.total_syllables}",
        f"H3: {stats.syllable_distribution[3]:.4f}",
        f"H4: {stats.syllable_distribution[4]:.4f}",
        f"H5: {stats.syllable_distribution[5]:.4f}",
        f"H6: {stats.syllable_distribution[6]:.4f}",
        f"YOD: {stats.yod_value:.4f}",
        "",
        "Cümleler",
        "--------",
    ]
    for sentence in analysis.sentences:
        lines.append(f"{sentence.sentence_index}. {sentence.sentence_text}")
        for word in sentence.words:
            lines.append(f"  - {word.word} ({word.syllable_count} hece)")
        lines.append("")
    return lines


class CsvExporter:
    format = ExportFormat.csv
    content_type = "text/csv; charset=utf-8"
    extension = "csv"

    def export(self, analysis: AnalyzeResponse) -> bytes:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["sentence_index", "sentence_text", "word", "syllable_count"])
        for sentence in analysis.sentences:
            if not sentence.words:
                writer.writerow([sentence.sentence_index, sentence.sentence_text, "", ""])
                continue
            for word in sentence.words:
                writer.writerow(
                    [
                        sentence.sentence_index,
                        sentence.sentence_text,
                        word.word,
                        word.syllable_count,
                    ]
                )
        return output.getvalue().encode("utf-8")


class TxtExporter:
    format = ExportFormat.txt
    content_type = "text/plain; charset=utf-8"
    extension = "txt"

    def export(self, analysis: AnalyzeResponse) -> bytes:
        return "\n".join(_build_text_lines(analysis)).encode("utf-8")


class PdfExporter:
    format = ExportFormat.pdf
    content_type = "application/pdf"
    extension = "pdf"

    def export(self, analysis: AnalyzeResponse) -> bytes:
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.pdfbase import pdfmetrics
            from reportlab.pdfbase.ttfonts import TTFont
            from reportlab.pdfgen import canvas
        except Exception as exc:  # pragma: no cover
            raise RuntimeError("PDF export requires reportlab") from exc

        font_path = _resolve_pdf_font_path()
        if font_path is None:
            raise RuntimeError(
                "PDF export requires a Unicode-capable TTF font. "
                "Place a font at fonts/NotoSans-Regular.ttf or ensure a system font is available."
            )

        pdfmetrics.registerFont(TTFont("UnicodeFont", str(font_path)))
        buffer = io.BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        x = 40
        y = height - 40
        line_height = 14
        pdf.setFont("UnicodeFont", 11)
        for line in _build_text_lines(analysis):
            if y <= 40:
                pdf.showPage()
                y = height - 40
                pdf.setFont("UnicodeFont", 11)
            pdf.drawString(x, y, line)
            y -= line_height
        pdf.save()
        return buffer.getvalue()


def _resolve_pdf_font_path() -> Path | None:
    candidates = [
        Path(__file__).resolve().parent / "fonts" / "NotoSans-Regular.ttf",
        Path("fonts") / "NotoSans-Regular.ttf",
        Path(__file__).resolve().parent / "fonts" / "DejaVuSans.ttf",
        Path("fonts") / "DejaVuSans.ttf",
        Path(r"C:\Windows\Fonts\arial.ttf"),
        Path(r"C:\Windows\Fonts\SegoeUI.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"),
        Path("/System/Library/Fonts/Supplemental/Arial Unicode.ttf"),
        Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


EXPORTERS: Dict[ExportFormat, Exporter] = {
    ExportFormat.csv: CsvExporter(),
    ExportFormat.txt: TxtExporter(),
    ExportFormat.pdf: PdfExporter(),
}


app = FastAPI(title="Metin Analiz API")


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_endpoint(payload: AnalyzeRequest) -> AnalyzeResponse:
    try:
        return analyze_text(payload.text)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/export")
def export_endpoint(payload: ExportRequest):
    try:
        analysis = analyze_text(payload.text)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    exporter = EXPORTERS.get(payload.format)
    if exporter is None:
        raise HTTPException(status_code=400, detail="unsupported export format")

    try:
        content = exporter.export(analysis)
    except RuntimeError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc

    filename = f"metin-analiz.{exporter.extension}"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return Response(content=content, media_type=exporter.content_type, headers=headers)
