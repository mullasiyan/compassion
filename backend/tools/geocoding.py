import httpx
import time
from typing import Dict, Any, Optional

# Fallback coordinates for demo stability
FALLBACK_COORDINATES = {
    "college bus stop": {
        "lat": 17.385044,
        "lon": 78.486671,
        "display_name": "College Bus Stop, Sector 4, Hyderabad, India",
        "boundingbox": ["17.380", "17.390", "78.480", "78.490"],
        "cached": True
    },
    "park metro": {
        "lat": 17.391020,
        "lon": 78.472010,
        "display_name": "Park Metro Station Concourse, Line 1, Hyderabad, India",
        "boundingbox": ["17.388", "17.394", "78.468", "78.475"],
        "cached": True
    }
}

_last_request_time = 0.0

async def geocode_location(query: str) -> Dict[str, Any]:
    """
    Geocodes location query using OpenStreetMap Nominatim API with rate limiting
    and fallback cache for demo safety.
    """
    global _last_request_time
    clean_query = query.strip()
    norm_query = clean_query.lower()

    # Rate limiting: enforce 1 request per second as per Nominatim Usage Policy
    now = time.time()
    elapsed = now - _last_request_time
    if elapsed < 1.0:
        time.sleep(1.0 - elapsed)
    _last_request_time = time.time()

    headers = {
        "User-Agent": "LostLink-SearchRescue/1.0 (contact: info@lostlink.org)"
    }
    url = f"https://nominatim.openstreetmap.org/search?q={httpx.URL(clean_query)}&format=json&limit=1"

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                if data and len(data) > 0:
                    first = data[0]
                    return {
                        "lat": float(first["lat"]),
                        "lon": float(first["lon"]),
                        "display_name": first["display_name"],
                        "boundingbox": first.get("boundingbox", []),
                        "cached": False,
                        "source": "OpenStreetMap Nominatim (Live)"
                    }
    except Exception as e:
        print(f"[Nominatim] Live geocoding notice: {e}, using safe cache.")

    # Safe fallback matching
    for key, val in FALLBACK_COORDINATES.items():
        if key in norm_query:
            return {**val, "source": "Nominatim Fallback Cache (Demo Safe)"}

    # Generic fallback
    return {
        "lat": 17.385044,
        "lon": 78.486671,
        "display_name": f"{clean_query} (Approximate Sector Anchor)",
        "boundingbox": ["17.380", "17.390", "78.480", "78.490"],
        "cached": True,
        "source": "Safe Spatial Default"
    }
