"""
Geocoding via Nominatim (OpenStreetMap) and routing via OSRM public API.
Falls back to straight-line (haversine) distance when OSRM is unavailable.
"""
import math
import requests
from typing import Optional, Tuple, Dict, Any

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OSRM_BASE     = "http://router.project-osrm.org/route/v1/driving"
HEADERS       = {"User-Agent": "SpotterELDPlanner/1.0 (assessment project)"}


def geocode(address: str) -> Optional[Tuple[float, float]]:
    """Return (lat, lon) for an address string, or None on failure."""
    try:
        resp = requests.get(
            NOMINATIM_URL,
            params={"q": address, "format": "json", "limit": 1, "countrycodes": "us"},
            headers=HEADERS,
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        if data:
            return float(data[0]["lat"]), float(data[0]["lon"])
        # retry without US restriction
        resp = requests.get(
            NOMINATIM_URL,
            params={"q": address, "format": "json", "limit": 1},
            headers=HEADERS,
            timeout=10,
        )
        data = resp.json()
        if data:
            return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception as exc:
        print(f"Geocoding error for '{address}': {exc}")
    return None


def haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in miles."""
    R = 3958.8
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi   = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def get_route(waypoints: list) -> Dict[str, Any]:
    """
    Get driving route from OSRM for a list of (lat, lon) waypoints.
    Returns dict with distance_miles, duration_hours, geometry (GeoJSON LineString).
    Falls back to haversine totals + None geometry on OSRM failure.
    """
    coords_str = ";".join(f"{lon},{lat}" for lat, lon in waypoints)
    try:
        resp = requests.get(
            f"{OSRM_BASE}/{coords_str}",
            params={"overview": "full", "geometries": "geojson", "steps": "false"},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()

        if data.get("code") == "Ok" and data.get("routes"):
            route = data["routes"][0]
            legs  = route.get("legs", [])
            leg_distances = []
            for leg in legs:
                leg_distances.append(leg["distance"] * 0.000621371)

            return {
                "distance_miles": route["distance"] * 0.000621371,
                "duration_hours": route["duration"] / 3600,
                "geometry":       route["geometry"],
                "leg_distances":  leg_distances,
            }
    except Exception as exc:
        print(f"OSRM routing error: {exc}")

    # haversine fallback
    total = sum(
        haversine_miles(*waypoints[i], *waypoints[i + 1])
        for i in range(len(waypoints) - 1)
    )
    leg_distances = [
        haversine_miles(*waypoints[i], *waypoints[i + 1])
        for i in range(len(waypoints) - 1)
    ]
    return {
        "distance_miles": total,
        "duration_hours": total / 55.0,
        "geometry":       None,
        "leg_distances":  leg_distances,
    }
