# WindScope — Wind Forecast Performance Dashboard

A full-stack dashboard for comparing forecast wind generation with actual wind generation in Great Britain during January 2026.

The application uses **React, Vite, Recharts, Python, FastAPI, and Elexon BMRS data**. It presents forecast performance through summary metrics and time-series charts.

## Features

- Retrieve actual wind-generation records from Elexon BMRS.
- Retrieve wind forecast records for January 2026 delivery intervals.
- Select the latest eligible forecast published before the configured decision cutoff.
- Match forecasts and actuals by exact delivery timestamp.
- Calculate mean absolute error (MAE) and forecast bias.
- Visualize forecast versus actual generation.
- Visualize forecast error over time.
- Display loading, error, and empty states.
- Centralize frontend HTTP requests and error handling.
- Use reusable React components and CSS Modules.
- Support containerized development with Docker.

## Technology stack

### Frontend

- React
- Vite
- Recharts
- CSS Modules
- Lucide React (installed for icons; the current dashboard also uses simple text symbols)

### Backend

- Python
- FastAPI
- HTTPX
- Python `zoneinfo` with `tzdata` for timezone support on Windows and other environments as needed

### Data source

- Elexon BMRS API

### Containerization

- Docker
- Docker Compose

## Architecture

```text
Browser
  |
  v
React Dashboard
  |
  v
Frontend API layer
  |
  v
FastAPI backend
  |
  +--> Elexon FUELHH: actual wind generation
  |
  +--> Elexon WINDFOR: wind forecasts
  |
  v
Forecast selection and accuracy calculations
  |
  v
JSON response
  |
  v
Metric cards and Recharts visualizations
```

The backend owns data retrieval and analytical calculations. The frontend is responsible for requesting the report and presenting it to the user.

## Project structure

```text
wind-forecast-dashboard/
├── backend/
│   ├── .env.example
│   ├── main.py
│   ├── services.py
│   ├── analytics.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── http.js
│   │   │   └── windApi.js
│   │   ├── components/
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── ErrorBoundary.module.css
│   │   │   ├── MetricCard.jsx
│   │   │   ├── MetricCard.module.css
│   │   │   ├── ChartPanel.jsx
│   │   │   ├── ChartPanel.module.css
│   │   │   ├── StateMessage.jsx
│   │   │   └── StateMessage.module.css
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   └── Dashboard.module.css
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Data sources

The application uses two Elexon BMRS datasets.

### FUELHH — actual generation

Used to retrieve actual wind generation, filtered by the wind fuel type.

Fields used:

- `startTime`
- `generation`
- `fuelType`
- `publishTime` where available in the returned records

### WINDFOR — wind forecast

Used to retrieve forecast generation.

Fields used:

- `startTime`: delivery timestamp being forecast
- `publishTime`: timestamp when the forecast was published
- `generation`: predicted generation in MW

The publication time and delivery time are different concepts and are used for different parts of the analysis.

## Analytical methodology

### Reporting period

January 1 through January 31, 2026, inclusive.

The actual-generation filter uses an exclusive end boundary of February 1, 2026, to avoid including February 1 records.

### Forecast selection

The project uses this explicit analytical assumption:

**Select the latest forecast published strictly before 09:00 UK local time on the day before delivery.**

For each delivery timestamp:

1. Determine the delivery date in the `Europe/London` timezone.
2. Calculate 09:00 on the previous calendar day.
3. Exclude forecasts published at or after that cutoff.
4. Among the eligible forecasts for that delivery timestamp, retain the latest publication.

This is a documented modeling assumption, not a verified claim that the cutoff corresponds to an actual market trading deadline.

### Matching

Selected forecasts are matched to actual-generation records using exact delivery timestamps.

The source records contain half-hourly actual readings, while the examined forecast data appears to have hourly timestamps. Consequently, the current report contains fewer matched intervals than actual records.

The application does not duplicate or interpolate forecast values into missing half-hourly intervals.

### Forecast error

The signed error is defined as:

```text
error = forecast generation - actual generation
```

- Positive error: overforecasting.
- Negative error: underforecasting.
- Zero error: forecast equals actual.

### Mean Absolute Error (MAE)

```text
MAE = sum(abs(forecast - actual)) / matched intervals
```

MAE measures the average absolute error in MW.

### Forecast bias

```text
Bias = sum(forecast - actual) / matched intervals
```

Positive bias indicates overforecasting on average; negative bias indicates underforecasting.

## Current analysis

The current local API response reports:

| Metric | Value |
|---|---:|
| Reporting period | January 2026 |
| Actual-generation records | 1,488 |
| Exact timestamp matches | 744 |
| MAE | 2,127.48 MW |
| Bias | +1,851.53 MW |

These figures reflect the current implementation and data returned by the API. Validate the selection logic and coverage before using them as final business conclusions.

The positive bias indicates that selected forecasts were higher than actual generation on average across the matched sample.

This project does not calculate procurement volume, financial loss, or electricity-market costs because demand, price, and contractual position data are not included.

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Backend health check |
| GET | `/api/wind/actuals` | Actual wind-generation records |
| GET | `/api/wind/forecasts` | Filtered wind forecasts |
| GET | `/api/wind/accuracy` | Matched records and accuracy metrics |
| GET | `/docs` | Interactive FastAPI documentation |

The actual-generation endpoint accepts `start_date` and `end_date` query parameters in `YYYY-MM-DD` format.

Example:

```text
/api/wind/actuals?start_date=2026-01-01&end_date=2026-02-01
```

## Local setup

### Prerequisites

- Python 3.12 or a compatible Python version
- Node.js and npm
- Git
- Internet access for the Elexon API

### 1. Clone the repository

```bash
git clone <YOUR_PUBLIC_GITHUB_REPOSITORY_URL>
cd wind-forecast-dashboard
```

### 2. Start the backend

```bash
cd backend
python -m venv .venv
```

Activate the environment.

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies and start the development server:

```bash
pip install -r requirements.txt
fastapi dev main.py
```

The backend should be available at `http://127.0.0.1:8000`.

Check `http://127.0.0.1:8000/api/health` or open `http://127.0.0.1:8000/docs`.

### 3. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file from the example:

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

The example sets `VITE_API_BASE_URL=http://localhost:8000`. Update it if the backend runs at a different address.

Start Vite:

```bash
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

If you change frontend environment variables, restart Vite so it reads the updated values.

## Environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | Frontend | Base URL for the FastAPI server |

Variables prefixed with `VITE_` are embedded into browser-side code and are not secret. Do not put private keys or credentials in them.

The backend currently requires no environment variables. Its `.env.example` is included as a placeholder for future backend configuration.

## Docker

The repository includes separate Dockerfiles for the frontend and backend and a Docker Compose configuration.

Build and start the application from the repository root:

```bash
docker compose up --build
```

The frontend should be available at `http://localhost:3000`, and the backend at `http://localhost:8000`.

Stop the containers:

```bash
docker compose down
```

See the Dockerfiles and Compose configuration for port mappings and environment variables.

## Error handling

The backend converts upstream HTTP failures and connection failures into meaningful HTTP error responses.

The frontend centralizes request handling in `api/http.js`. It handles unsuccessful responses and network failures and provides readable error messages to the dashboard.

The React error boundary catches certain rendering errors and displays a fallback screen. It complements rather than replaces API error handling.

## Design decisions

- **FastAPI:** Provides a lightweight Python API and automatic interactive API documentation.
- **HTTPX:** Supports asynchronous requests to the external data source.
- **React:** Builds the user interface from reusable components.
- **Recharts:** Provides responsive time-series charts, axes, legends, and tooltips without extensive custom drawing code.
- **CSS Modules:** Keep component styles separate and reduce accidental style collisions.
- **Dedicated API layer:** Keeps HTTP details out of presentation components.
- **Python analytics module:** Keeps the forecast-selection and metric calculations in one place.
- **Error boundary and request states:** Improve recovery and feedback when the application encounters problems.
- **Docker:** Packages application dependencies and provides a repeatable way to run both services.

## Known limitations and future improvements

- Validate the cutoff assumption against authoritative business requirements.
- Add automated tests for cutoff boundaries, timezones, matching, MAE, and bias.
- Report coverage clearly in the API and UI.
- Investigate whether hourly forecast values are defined to apply to half-hourly settlement intervals before changing the matching method.
- Add date-range selection and more detailed filtering.
- Add deployment monitoring and production health checks.
- Consider caching or scheduled data refreshes if repeated external API calls become slow.
- Add financial or procurement analysis only when the required demand, price, and contract data is available.

## AI assistance

AI tools were used as development assistance for architecture discussions, implementation guidance, code explanations, debugging, and documentation. The implementation and analytical assumptions are reviewed and validated before deployment.


