
import httpx

ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"


async def fetch_wind_actuals(
    start_date: str = "2026-01-01",
    end_date: str = "2026-02-01",
):
    url = f"{ELEXON_BASE_URL}/datasets/FUELHH/stream"

    params = {
        "settlementDateFrom": start_date,
        "settlementDateTo": end_date,
        "fuelType": "WIND",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()

    # Keep only wind records, even if the upstream API
    # returns additional fuel types.
    return [
    record
    for record in data
    if (
        record.get("fuelType") == "WIND"
        and start_date <= record.get("startTime", "")[:10] < end_date
    )
]



async def fetch_wind_forecasts(
    publish_from: str = "2025-12-31T00:00:00Z",
    publish_to: str = "2026-02-01T00:00:00Z",
):
    url = f"{ELEXON_BASE_URL}/datasets/WINDFOR/stream"

    params = {
        "publishDateTimeFrom": publish_from,
        "publishDateTimeTo": publish_to,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()

    # Keep forecasts whose target delivery time is in January 2026.
    return [
        record
        for record in data
        if record.get("startTime", "").startswith("2026-01")
    ]
