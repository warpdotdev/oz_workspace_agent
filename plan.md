# Add Health-Check Endpoint to Node.js Express Server

## Problem
The Express server currently has no health-check endpoint, making it difficult for load balancers, orchestrators (e.g. Kubernetes), and monitoring tools to determine service availability.

## Proposed Changes

### 1. Add `GET /healthz` endpoint
- Return `200 OK` with a JSON body: `{ "status": "ok", "uptime": <seconds> }`.
- No authentication required — the endpoint must be publicly accessible.

### 2. (Optional) Add `GET /readyz` readiness probe
- Return `200` only when downstream dependencies (e.g. database) are reachable.
- Return `503 Service Unavailable` otherwise.

### 3. Register middleware early
- Mount the health routes **before** auth and body-parsing middleware so they remain fast and dependency-free.

### 4. Tests
- Add a unit/integration test that asserts `/healthz` returns `200` with the expected shape.
- Add a test for `/readyz` covering both healthy and unhealthy dependency states.

## File Changes
- `src/routes/health.js` — new route module.
- `src/app.js` (or server entry point) — import and mount the health routes.
- `tests/health.test.js` — new test file.
