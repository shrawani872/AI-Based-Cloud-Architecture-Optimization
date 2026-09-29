# AI-Based Cloud Architecture Optimization - Backend

## Overview

This is the backend service for the AI-Based Cloud Architecture Optimization project.

The backend provides REST APIs for:

- AWS resource and metric information
- PostgreSQL-backed telemetry
- Anomaly data
- Cost-optimization recommendations
- Recommendation approval and rejection
- Recommendation history
- Dashboard summary
- Forecast data retrieval
- System and service health checks

The backend uses PostgreSQL through Prisma and provides APIs for frontend and ML-service integration.

## Backend Stack

- Node.js
- Express.js
- PostgreSQL / Supabase
- Prisma ORM
- Zod validation
- Helmet security middleware
- CORS

## Project Structure

backend/
  prisma/
    schema.prisma
  scripts/
    ensure-db.js
    seed-db.js
    test-api-e2e.js
    test-crud-all-models.js
    verify-db.js
  src/
    config/
    controllers/
    middleware/
    providers/
    repositories/
    routes/
    services/
    utils/
    validators/
  .env.example
  package.json
  README.md

## Setup

From the backend directory:

    npm install

Create the local environment file:

    Copy-Item .env.example .env

Update .env with the PostgreSQL connection string provided for the development environment.

Example:

    DATABASE_URL=postgresql://username:password@host:5432/database
    PORT=5000

Do not commit .env to Git.

Generate the Prisma client:

    npx prisma generate

Start the backend:

    npm start

The default backend port is 5000.

## API Base URL

    /api/v1

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /health | Backend and database health |
| GET | /system/health | Overall system health |
| GET | /aws/status | AWS provider status |
| GET | /ai/status | AI provider status |
| GET | /dashboard/summary | Dashboard summary |
| GET | /telemetry/metrics | PostgreSQL-backed AWS metrics |
| GET | /telemetry/resources | Resource information |
| GET | /anomalies | Anomaly records |
| GET | /forecasts | Stored forecast records |
| POST | /forecast | Forecast trigger delegated to ML |
| GET | /recommendations | Retrieve recommendations |
| GET | /recommendations/:id | Retrieve one recommendation |
| POST | /recommendations/:id/approve | Approve an active recommendation |
| POST | /recommendations/:id/reject | Reject an active recommendation |
| POST | /recommendation | Validate a recommendation request |
| GET | /history | Retrieve system history |

## Recommendation Workflow

Recommendations are stored in PostgreSQL.

An active recommendation can move to:

    ACTIVE -> APPROVED

or:

    ACTIVE -> REJECTED

Approval or rejection also creates a system history log.

Recommendations that are already approved or rejected cannot be processed again.

## Telemetry

Telemetry metrics are retrieved from PostgreSQL.

Supported ranges:

- 1h
- 6h
- 24h
- 7d

Example:

    GET /api/v1/telemetry/metrics?range=24h

An optional resource filter can be supplied:

    GET /api/v1/telemetry/metrics?resourceId=<resource-id>&range=24h

Invalid ranges return HTTP 400.

## Forecast Responsibility

The backend stores and retrieves forecast records.

Forecast generation belongs to the ML service.

Therefore:

    POST /api/v1/forecast

returns HTTP 501 because forecast generation is intentionally handled by the ML service.

## Validation and Error Handling

Recommendation input is validated using Zod.

- Invalid requests return HTTP 400.
- Missing records return HTTP 404.
- Invalid state transitions return HTTP 409.
- Unexpected server errors return HTTP 500 with a generic error message.

## Database

The backend uses PostgreSQL through Prisma.

The Prisma schema contains five models:

- AwsMetric
- Anomaly
- Forecast
- Recommendation
- SystemLog

The Prisma client is centralized through:

    src/config/db.js

Repositories and services use the centralized Prisma client.

## Testing

Run the API end-to-end test suite:

    npm.cmd test

Run PostgreSQL/Prisma CRUD verification:

    node scripts/test-crud-all-models.js

The CRUD test verifies all five Prisma models.

## Environment Variables

| Variable | Purpose |
|---|---|
| DATABASE_URL | PostgreSQL connection string |
| PORT | Backend HTTP port |

Use .env.example as the configuration template.

Never commit credentials or .env files.

## Backend Responsibility

This backend is responsible for:

- REST API endpoints
- Request validation
- Business logic
- PostgreSQL persistence
- Prisma database access
- Recommendation approval and rejection
- Recommendation history
- Telemetry retrieval
- Anomaly retrieval
- Dashboard summary data
- Health checks
- Error handling
- API testing

Forecast generation and ML processing remain responsibilities of the ML service.

Frontend implementation and full-system integration are handled separately.

## Integration Handoff

The backend provides the API layer for integration with the frontend and ML service.

The API base path is:

    /api/v1

The backend should be running before integration testing begins.

## Security Notes

- Do not commit .env.
- Do not place database credentials in source code.
- Use .env.example for configuration documentation.
- Helmet is enabled for HTTP security headers.
- Unexpected server errors return a generic 500 response.

## Current Verification

The backend has been verified with:

- PostgreSQL connectivity
- Prisma CRUD verification for all five models
- API end-to-end tests
- Recommendation approval and rejection workflows
- Recommendation history
- Invalid telemetry range handling
- Invalid recommendation handling
- Invalid recommendation state-transition handling
- Git working-tree verification
