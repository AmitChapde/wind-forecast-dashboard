
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

UK_TIMEZONE = ZoneInfo("Europe/London")
DECISION_CUTOFF = time(9, 0)


def parse_datetime(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))

    if parsed.tzinfo is None:
        raise ValueError("Timestamp must include a timezone")

    return parsed.astimezone(UK_TIMEZONE)


def calculate_accuracy(actuals: list, forecasts: list) -> dict:
    forecasts_by_start_time = {}

    for forecast in forecasts:
        try:
            target_time = parse_datetime(forecast["startTime"])
            published_at = parse_datetime(forecast["publishTime"])
            generation = float(forecast["generation"])
        except (KeyError, ValueError, TypeError):
            continue

        # Decision cutoff: 09:00 UK time on the day before delivery.
        delivery_date = target_time.date()
        forecast_date = delivery_date - timedelta(days=1)

        cutoff = datetime.combine(
            forecast_date,
            DECISION_CUTOFF,
            tzinfo=UK_TIMEZONE,
        )

        # Forecasts published exactly at 09:00 are excluded.
        if published_at >= cutoff:
            continue

        existing = forecasts_by_start_time.get(target_time)

        if existing is None or published_at > existing["publishTime"]:
            forecasts_by_start_time[target_time] = {
                    "publishTime": published_at,
                    "generation": generation,
                    "decisionCutoff": cutoff,
                }
    comparisons = []

    for actual in actuals:
        try:
            target_time = parse_datetime(actual["startTime"])
            actual_generation = float(actual["generation"])
        except (KeyError, ValueError, TypeError):
            continue

        forecast = forecasts_by_start_time.get(target_time)

        if forecast is None:
            continue

        error = forecast["generation"] - actual_generation

        comparisons.append({
            "startTime": target_time.isoformat(),
            "publishTime": forecast["publishTime"].isoformat(),
            "decisionCutoff": forecast["decisionCutoff"].isoformat(),
            "forecastGeneration": forecast["generation"],
            "actualGeneration": actual_generation,
            "error": error,
            "absoluteError": abs(error),
        })

    if not comparisons:
        return {
            "matchedIntervals": 0,
            "mae": None,
            "bias": None,
            "data": [],
        }

    count = len(comparisons)

    mae = sum(item["absoluteError"] for item in comparisons) / count
    bias = sum(item["error"] for item in comparisons) / count

    return {
    "matchedIntervals": count,
    "actualIntervals": len(actuals),
    "forecastCoveragePercent": round(
        count / len(actuals) * 100, 2
    ) if actuals else 0,
    "mae": round(mae, 2),
    "bias": round(bias, 2),
    "data": comparisons,
}
