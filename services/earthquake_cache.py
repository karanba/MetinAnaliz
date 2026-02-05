"""
Earthquake Cache Service
USGS API için caching mekanizması sağlar.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timedelta
from typing import Any

import httpx
from cachetools import TTLCache


class EarthquakeCache:
    """
    USGS Earthquake API için cache servisi.
    TTLCache kullanarak API yanıtlarını önbelleğe alır.
    """

    USGS_BASE_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"
    DEFAULT_TTL = 60  # 60 seconds cache
    MAX_CACHE_SIZE = 20

    def __init__(self, ttl: int = DEFAULT_TTL, max_size: int = MAX_CACHE_SIZE):
        self._cache: TTLCache = TTLCache(maxsize=max_size, ttl=ttl)
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Lazy initialization of async client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    def _build_cache_key(self, params: dict[str, Any]) -> str:
        """
        Parametre hash'i ile cache key oluşturur.
        """
        # Sort params for consistent hashing
        sorted_params = json.dumps(params, sort_keys=True, default=str)
        return hashlib.md5(sorted_params.encode()).hexdigest()

    async def get_earthquakes(
        self,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
        min_magnitude: float = 2.5,
        max_magnitude: float | None = None,
        limit: int = 1000,
    ) -> dict[str, Any]:
        """
        USGS'ten deprem verilerini çeker (cache'li).

        Args:
            start_time: Başlangıç zamanı (default: 24 saat önce)
            end_time: Bitiş zamanı (default: şimdi)
            min_magnitude: Minimum büyüklük (default: 2.5)
            max_magnitude: Maximum büyüklük (opsiyonel)
            limit: Sonuç limiti (default: 1000, max: 5000)

        Returns:
            USGS GeoJSON response
        """
        # Set defaults
        if end_time is None:
            end_time = datetime.utcnow()
        if start_time is None:
            start_time = end_time - timedelta(hours=24)

        # Clamp limit
        limit = min(max(1, limit), 5000)

        # Build params
        params = {
            "format": "geojson",
            "starttime": start_time.isoformat(),
            "endtime": end_time.isoformat(),
            "minmagnitude": min_magnitude,
            "limit": limit,
            "orderby": "time",
        }

        if max_magnitude is not None:
            params["maxmagnitude"] = max_magnitude

        # Check cache
        cache_key = self._build_cache_key(params)
        if cache_key in self._cache:
            return self._cache[cache_key]

        # Fetch from USGS
        data = await self._fetch_from_usgs(params)

        # Cache the result
        self._cache[cache_key] = data

        return data

    async def _fetch_from_usgs(self, params: dict[str, Any]) -> dict[str, Any]:
        """
        USGS API'den veri çeker.
        """
        client = await self._get_client()

        try:
            response = await client.get(self.USGS_BASE_URL, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.TimeoutException as e:
            # Return cached data if available on timeout
            cache_key = self._build_cache_key(params)
            if cache_key in self._cache:
                return self._cache[cache_key]
            raise RuntimeError(f"USGS API timeout: {e}") from e
        except httpx.HTTPStatusError as e:
            raise RuntimeError(f"USGS API error: {e.response.status_code}") from e
        except Exception as e:
            raise RuntimeError(f"Failed to fetch earthquake data: {e}") from e

    def clear_cache(self) -> None:
        """Cache'i temizler."""
        self._cache.clear()


# Global cache instance
earthquake_cache = EarthquakeCache()
