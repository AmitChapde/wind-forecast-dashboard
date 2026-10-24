
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL 
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function getJson(path, { signal } = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      "Unable to connect to the backend. Check that the API server is running."
    );
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;

    try {
      const body = await response.json();
      if (typeof body.detail === "string") {
        message = body.detail;
      }
    } catch {
      // Keep the fallback message if the response isn't JSON.
    }

    throw new ApiError(message, response.status);
  }

  try {
    return await response.json();
  } catch {
    throw new ApiError("The backend returned an invalid JSON response.");
  }
}
