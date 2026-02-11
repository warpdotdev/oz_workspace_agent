# Add Health-Check Endpoint to Node.js Express Server

## Problem

The Express server lacks a health-check endpoint, making it difficult for load balancers, orchestrators (e.g. Kubernetes), and monitoring tools to verify service availability.

## Proposed Changes

1. **Add `GET /healthz` route** – Returns `200 OK` with a JSON body `{ "status": "ok" }`. Registered before auth/business middleware so it's always reachable.
2. **Optional dependency checks** – Accept a `?verbose=true` query param that additionally reports database/cache connectivity and uptime.
3. **Tests** – Add integration tests using `supertest` to assert status code and response shape.
4. **Documentation** – Update the API docs/README with the new endpoint.

## File Changes

- `src/routes/health.ts` – New route module.
- `src/app.ts` – Import and mount the health route.
- `tests/health.test.ts` – Integration tests.
- `README.md` – Document the endpoint.
