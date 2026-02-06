"""
Earthquake Router
Deprem verileri için API endpoint'leri.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Query, HTTPException

from backend.services.earthquake_cache import earthquake_cache

router = APIRouter(prefix="/earthquakes", tags=["earthquakes"])


@router.get("")
async def get_earthquakes(
    start_time: datetime | None = Query(
        default=None,
        description="Başlangıç zamanı (ISO8601 format). Default: 24 saat önce"
    ),
    end_time: datetime | None = Query(
        default=None,
        description="Bitiş zamanı (ISO8601 format). Default: şimdi"
    ),
    min_magnitude: float = Query(
        default=2.5,
        ge=0,
        le=10,
        description="Minimum büyüklük (0-10)"
    ),
    max_magnitude: float | None = Query(
        default=None,
        ge=0,
        le=10,
        description="Maximum büyüklük (0-10)"
    ),
    limit: int = Query(
        default=1000,
        ge=1,
        le=5000,
        description="Sonuç limiti (max: 5000)"
    ),
) -> dict[str, Any]:
    """
    USGS'ten deprem verilerini getirir.

    Veriler GeoJSON formatında döner ve USGS Earthquake Catalog'dan alınır.
    Sonuçlar 60 saniye süreyle cache'lenir.

    Returns:
        GeoJSON FeatureCollection with earthquake data
    """
    try:
        data = await earthquake_cache.get_earthquakes(
            start_time=start_time,
            end_time=end_time,
            min_magnitude=min_magnitude,
            max_magnitude=max_magnitude,
            limit=limit,
        )
        return data
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {e}") from e


@router.get("/presets/today")
async def get_earthquakes_today(
    min_magnitude: float = Query(default=2.5, ge=0, le=10),
) -> dict[str, Any]:
    """Son 24 saatteki depremler."""
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=24)

    try:
        return await earthquake_cache.get_earthquakes(
            start_time=start_time,
            end_time=end_time,
            min_magnitude=min_magnitude,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e


@router.get("/presets/week")
async def get_earthquakes_week(
    min_magnitude: float = Query(default=4.0, ge=0, le=10),
) -> dict[str, Any]:
    """Son 7 gündeki depremler (default min mag: 4.0)."""
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=7)

    try:
        return await earthquake_cache.get_earthquakes(
            start_time=start_time,
            end_time=end_time,
            min_magnitude=min_magnitude,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e


@router.get("/presets/month")
async def get_earthquakes_month(
    min_magnitude: float = Query(default=5.0, ge=0, le=10),
) -> dict[str, Any]:
    """Son 30 gündeki depremler (default min mag: 5.0)."""
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=30)

    try:
        return await earthquake_cache.get_earthquakes(
            start_time=start_time,
            end_time=end_time,
            min_magnitude=min_magnitude,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
