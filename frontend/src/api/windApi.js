
import { getJson } from "./http";

export async function getWindAccuracy({ signal } = {}) {
  const result = await getJson("/api/wind/accuracy", { signal });

  if (!Array.isArray(result.data)) {
    throw new Error("The accuracy API returned an unexpected data format.");
  }

  return result;
}

export async function getWindActuals({
  startDate = "2026-01-01",
  endDate = "2026-02-01",
  signal,
} = {}) {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });

  return getJson(`/api/wind/actuals?${params}`, { signal });
}

export async function getWindForecasts({ signal } = {}) {
  return getJson("/api/wind/forecasts", { signal });
}
