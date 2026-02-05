"""
Earthquake Cache Service
USGS API için caching mekanizması sağlar.
"""
from __future__ import annotations

import hashlib
import json
import re
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any, Iterable

import httpx
from cachetools import TTLCache


class EarthquakeCache:
    """
    USGS Earthquake API için cache servisi.
    TTLCache kullanarak API yanıtlarını önbelleğe alır.
    """

    USGS_BASE_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"
    KANDILLI_URL = "http://www.koeri.boun.edu.tr/scripts/lst9.asp"
    KANDILLI_FALLBACK_URL = "https://www.koeri.boun.edu.tr/scripts/sondepremler.asp"
    EMSC_BASE_URL = "https://www.seismicportal.eu/fdsnws/event/1/query"
    DEFAULT_TTL = 60  # 60 seconds cache
    MAX_CACHE_SIZE = 20
    SOURCE_TIMEOUT_SECONDS = 3
    TIME_TOLERANCE_MS = 5 * 60 * 1000
    COORD_TOLERANCE_DEG = 0.2
    MAG_TOLERANCE = 0.3

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
        source_status: dict[str, dict[str, Any]] = {"USGS": {"ok": True}}

        # Fetch from Kandilli (official) and EMSC with per-source timeout
        kandilli_task = self._fetch_with_timeout(
            self._get_kandilli_features(
                start_time=start_time,
                end_time=end_time,
                min_magnitude=min_magnitude,
                max_magnitude=max_magnitude,
            )
        )
        emsc_task = self._fetch_with_timeout(
            self._get_emsc_features(
                start_time=start_time,
                end_time=end_time,
                min_magnitude=min_magnitude,
                max_magnitude=max_magnitude,
                limit=limit,
            )
        )

        kandilli_result, emsc_result = await asyncio.gather(
            kandilli_task,
            emsc_task,
            return_exceptions=True,
        )

        kandilli_features = []
        if isinstance(kandilli_result, Exception):
            source_status["Kandilli"] = {"ok": False, "error": str(kandilli_result)}
        else:
            kandilli_features = kandilli_result or []
            source_status["Kandilli"] = {"ok": True}

        emsc_features = []
        if isinstance(emsc_result, Exception):
            source_status["EMSC"] = {"ok": False, "error": str(emsc_result)}
        else:
            emsc_features = emsc_result or []
            source_status["EMSC"] = {"ok": True}

        merged_features = self._merge_features(
            base_features=data.get("features", []),
            incoming_features=kandilli_features,
        )
        merged_features = self._merge_features(
            base_features=merged_features,
            incoming_features=emsc_features,
        )
        data["features"] = merged_features
        if "metadata" in data:
            data["metadata"]["count"] = len(merged_features)
            data["metadata"]["sources"] = source_status

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

    async def _get_kandilli_features(
        self,
        start_time: datetime,
        end_time: datetime,
        min_magnitude: float,
        max_magnitude: float | None,
    ) -> list[dict[str, Any]]:
        text = await self._fetch_kandilli_text()

        features = self._parse_kandilli_text(text)
        if not features:
            return []

        start_ms = self._to_utc_ms(start_time)
        end_ms = self._to_utc_ms(end_time)

        filtered: list[dict[str, Any]] = []
        for feature in features:
            props = feature.get("properties", {})
            mag = props.get("mag")
            time_ms = props.get("time")

            if mag is None or time_ms is None:
                continue
            if time_ms < start_ms or time_ms > end_ms:
                continue
            if mag < min_magnitude:
                continue
            if max_magnitude is not None and mag > max_magnitude:
                continue
            filtered.append(feature)

        return filtered

    async def _get_emsc_features(
        self,
        start_time: datetime,
        end_time: datetime,
        min_magnitude: float,
        max_magnitude: float | None,
        limit: int,
    ) -> list[dict[str, Any]]:
        params = {
            "format": "json",
            "starttime": self._format_fdsn_time(start_time),
            "endtime": self._format_fdsn_time(end_time),
            "minmagnitude": min_magnitude,
            "limit": limit,
        }
        if max_magnitude is not None:
            params["maxmagnitude"] = max_magnitude

        data = await self._fetch_from_emsc(params)

        features = data.get("features", [])
        normalized: list[dict[str, Any]] = []
        for feature in features:
            props = feature.get("properties", {})
            geom = feature.get("geometry", {})
            coords = geom.get("coordinates", [None, None, None])
            lon, lat, depth = coords[0], coords[1], coords[2]

            mag = props.get("mag")
            if mag is None or lat is None or lon is None:
                continue

            time_str = props.get("time")
            time_ms = self._parse_iso_to_ms(time_str) if time_str else None
            if time_ms is None:
                continue

            place = props.get("flynn_region") or ""
            mag_type = props.get("magtype") or ""
            event_id = props.get("unid") or feature.get("id") or ""
            if event_id:
                event_id = f"emsc-{event_id}"
            else:
                event_id = f"emsc-{time_ms}-{lat:.4f}-{lon:.4f}"

            normalized.append({
                "type": "Feature",
                "properties": {
                    "mag": mag,
                    "place": place,
                    "time": time_ms,
                    "updated": time_ms,
                    "tz": 0,
                    "url": "",
                    "detail": "",
                    "felt": None,
                    "cdi": None,
                    "mmi": None,
                    "alert": None,
                    "status": "emsc",
                    "tsunami": 0,
                    "sig": 0,
                    "net": "EMSC",
                    "code": event_id,
                    "ids": event_id,
                    "sources": "EMSC",
                    "types": "origin",
                    "nst": None,
                    "dmin": None,
                    "rms": None,
                    "gap": None,
                    "magType": mag_type,
                    "type": "earthquake",
                    "title": f"M{mag:.1f} - {place}" if place else f"M{mag:.1f}",
                    "source": "EMSC",
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [lon, lat, depth if depth is not None else 0.0],
                },
                "id": event_id,
            })

        return normalized

    async def _fetch_kandilli_text(self) -> str:
        client = await self._get_client()
        try:
            response = await client.get(self.KANDILLI_URL)
            response.raise_for_status()
            text = response.content.decode("windows-1254", errors="replace")
        except Exception:
            response = await client.get(self.KANDILLI_FALLBACK_URL)
            response.raise_for_status()
            text = response.text

        match = re.search(r"<pre[^>]*>(.*?)</pre>", text, re.S | re.I)
        return match.group(1) if match else text

    async def _fetch_from_emsc(self, params: dict[str, Any]) -> dict[str, Any]:
        client = await self._get_client()
        response = await client.get(self.EMSC_BASE_URL, params=params)
        response.raise_for_status()
        return response.json()

    def _parse_kandilli_text(self, text: str) -> list[dict[str, Any]]:
        features: list[dict[str, Any]] = []
        if not text:
            return features

        lines = text.splitlines()
        for line in lines:
            line = line.strip()
            if not line:
                continue
            if not re.match(r"^\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2}:\d{2}", line):
                continue

            parts = line.split()
            if len(parts) < 6:
                continue

            date_str, time_str = parts[0], parts[1]
            lat = self._to_float(parts[2])
            lon = self._to_float(parts[3])
            depth = self._to_float(parts[4])
            if lat is None or lon is None or depth is None:
                continue

            # Kandilli typically provides 3 magnitude columns (Md, Ml, Mw)
            mag_values = parts[5:8]
            mag_types = ["md", "ml", "mw"]
            mag = None
            mag_type = None
            for idx, value in enumerate(mag_values):
                parsed = self._to_float(value)
                if parsed is not None:
                    mag = parsed
                    mag_type = mag_types[idx] if idx < len(mag_types) else None
                    break

            # Fallback: first numeric token after depth
            if mag is None:
                for value in parts[5:]:
                    parsed = self._to_float(value)
                    if parsed is not None:
                        mag = parsed
                        break

            if mag is None:
                continue

            place_tokens_start = 5 + len(mag_values)
            if place_tokens_start > len(parts):
                place_tokens_start = 5
            place = " ".join(parts[place_tokens_start:]).strip()

            try:
                dt_local = datetime.strptime(
                    f"{date_str} {time_str}",
                    "%Y.%m.%d %H:%M:%S",
                ).replace(tzinfo=timezone(timedelta(hours=3)))
            except ValueError:
                continue

            time_ms = int(dt_local.timestamp() * 1000)
            event_id = f"kandilli-{date_str}-{time_str}-{lat:.4f}-{lon:.4f}"

            feature = {
                "type": "Feature",
                "properties": {
                    "mag": mag,
                    "place": place,
                    "time": time_ms,
                    "updated": time_ms,
                    "tz": 180,
                    "url": "",
                    "detail": "",
                    "felt": None,
                    "cdi": None,
                    "mmi": None,
                    "alert": None,
                    "status": "kandilli",
                    "tsunami": 0,
                    "sig": 0,
                    "net": "KOERI",
                    "code": event_id,
                    "ids": event_id,
                    "sources": "KOERI",
                    "types": "origin",
                    "nst": None,
                    "dmin": None,
                    "rms": None,
                    "gap": None,
                    "magType": mag_type or "",
                    "type": "earthquake",
                    "title": f"M{mag:.1f} - {place}" if place else f"M{mag:.1f}",
                    "source": "Kandilli",
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [lon, lat, depth],
                },
                "id": event_id,
            }
            features.append(feature)

        return features

    def _merge_features(
        self,
        base_features: Iterable[dict[str, Any]],
        incoming_features: Iterable[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        merged: list[dict[str, Any]] = []
        for feature in base_features:
            feature.setdefault("properties", {}).setdefault("source", "USGS")
            merged.append(feature)

        group_counter = 1
        for feature in incoming_features:
            match = self._find_match(feature, merged)
            if match is not None:
                group_id = match.get("properties", {}).get("match_group")
                if not group_id:
                    group_id = f"match-{group_counter}"
                    match.setdefault("properties", {})["match_group"] = group_id
                    group_counter += 1
                feature.setdefault("properties", {})["match_group"] = group_id
            merged.append(feature)

        return merged

    def _find_match(
        self,
        candidate: dict[str, Any],
        existing: Iterable[dict[str, Any]],
    ) -> dict[str, Any] | None:
        candidate_id = candidate.get("id")
        if candidate_id:
            for item in existing:
                if item.get("id") == candidate_id:
                    return item

        cand_props = candidate.get("properties", {})
        cand_time = cand_props.get("time")
        cand_mag = cand_props.get("mag")
        cand_coords = candidate.get("geometry", {}).get("coordinates", [None, None, None])
        cand_lon, cand_lat = cand_coords[0], cand_coords[1]

        if cand_time is None or cand_mag is None or cand_lat is None or cand_lon is None:
            return None

        for item in existing:
            props = item.get("properties", {})
            item_time = props.get("time")
            item_mag = props.get("mag")
            coords = item.get("geometry", {}).get("coordinates", [None, None, None])
            item_lon, item_lat = coords[0], coords[1]

            if item_time is None or item_mag is None or item_lat is None or item_lon is None:
                continue

            if abs(item_time - cand_time) > self.TIME_TOLERANCE_MS:
                continue
            if abs(item_mag - cand_mag) > self.MAG_TOLERANCE:
                continue
            if abs(item_lat - cand_lat) > self.COORD_TOLERANCE_DEG:
                continue
            if abs(item_lon - cand_lon) > self.COORD_TOLERANCE_DEG:
                continue
            return item

        return None

    @staticmethod
    def _to_float(value: str) -> float | None:
        if not value:
            return None
        if value in {"-.-", "--", "---"}:
            return None
        try:
            return float(value.replace(",", "."))
        except ValueError:
            return None

    @staticmethod
    def _parse_iso_to_ms(value: str) -> int | None:
        try:
            if value.endswith("Z"):
                value = value.replace("Z", "+00:00")
            dt = datetime.fromisoformat(value)
            return int(dt.timestamp() * 1000)
        except Exception:
            return None

    @staticmethod
    def _to_utc_ms(value: datetime) -> int:
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        else:
            value = value.astimezone(timezone.utc)
        return int(value.timestamp() * 1000)

    @staticmethod
    def _format_fdsn_time(value: datetime) -> str:
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        else:
            value = value.astimezone(timezone.utc)
        return value.strftime("%Y-%m-%dT%H:%M:%S")

    async def _fetch_with_timeout(self, coro: Any) -> Any:
        try:
            return await asyncio.wait_for(coro, timeout=self.SOURCE_TIMEOUT_SECONDS)
        except asyncio.TimeoutError as exc:
            raise RuntimeError("Timeout after 3s") from exc

    def clear_cache(self) -> None:
        """Cache'i temizler."""
        self._cache.clear()


# Global cache instance
earthquake_cache = EarthquakeCache()
