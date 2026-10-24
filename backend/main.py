
from fastapi import FastAPI, HTTPException, Query
import httpx

from services import fetch_wind_actuals, fetch_wind_forecasts
from analytics import calculate_accuracy
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Wind Forecast Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://wind-forecast-dashboard.vercel.app"
    ],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "Wind Forecast Dashboard API is running",
    }


@app.get("/api/wind/actuals")
async def get_wind_actuals(
    start_date: str = Query(default="2026-01-01"),
    end_date: str = Query(default="2026-02-01"),
):
    try:
        records = await fetch_wind_actuals(start_date, end_date)
        return {
            "count": len(records),
            "startDate": start_date,
            "endDate": end_date,
            "data": records,
        }
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Elexon returned HTTP {exc.response.status_code}",
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to the Elexon API",
        )



@app.get("/api/wind/forecasts")
async def get_wind_forecasts():
    try:
        records = await fetch_wind_forecasts()

        return {
            "count": len(records),
            "data": records,
        }
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Elexon returned HTTP {exc.response.status_code}",
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to the Elexon API",
        )



@app.get("/api/wind/accuracy")
async def get_wind_accuracy():
    try:
        actuals = await fetch_wind_actuals(
            "2026-01-01",
            "2026-02-01",
        )

        forecasts = await fetch_wind_forecasts(
            "2025-12-31T00:00:00Z",
            "2026-02-01T00:00:00Z",
        )

        result = calculate_accuracy(actuals, forecasts)

        return {
            "period": "January 2026",
            "units": "MW",
            "errorConvention": "forecast - actual",
            "decisionCutoffAssumption": (
                "Latest forecast published before "
                "09:00 UK time on the day before delivery"
            ),
            **result,
        }

    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Elexon returned HTTP {exc.response.status_code}",
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Could not connect to the Elexon API",
        )
