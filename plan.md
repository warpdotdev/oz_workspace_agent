# Add Health-Check Endpoint to Node.js Express Server

## Problem

The Express server lacks a health-check endpoint, making it difficult for load balancers, orchestrators (e.g. Kubernetes), and monitoring tools to determine service availability.

## Proposed Changes

### 1. Add `GET /healthz` endpoint

- Return `200 OK` with a JSON body `{ "status": "ok", "uptime": <process.uptime()> }` when the server is healthy.
- Keep the handler lightweight — no database calls or heavy computation.

### 2. Optional: Add readiness probe at `GET /readyz`

- Returns `200` only after all critical dependencies (DB, cache) are connected.
- Returns `503 Service Unavailable` while dependencies are still initializing.

### 3. Tests

- Add a unit/integration test using the project's existing test framework (e.g. Jest + Supertest) to verify:
  - `/healthz` returns 200 with the expected shape.
  - `/readyz` returns 503 before dependencies are ready and 200 after.

### 4. Documentation

- Update the README or API docs to describe the new endpoints.
