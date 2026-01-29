from __future__ import annotations

import math
import re
from typing import List

from fastapi import FastAPI, HTTPException
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


app = FastAPI(title="Metin Analiz API")


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_endpoint(payload: AnalyzeRequest) -> AnalyzeResponse:
    try:
        return analyze_text(payload.text)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
