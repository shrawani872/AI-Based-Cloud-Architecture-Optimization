# API Testing Report

## 1. Environment Status
- Backend Node.js server: **Operational** (Port 5000)
- AI FastAPI service: **Operational** (Port 8000)
- PostgreSQL Database: **Operational** (Connected via Prisma)

## 2. Regression Testing Summary (Latest main)

### Backend APIs
- **Total Tests**: 23 requests
- **Passed**: 23
- **Failed**: 0
- **Pass Rate**: 100%
*(Note: The `/forecast` endpoint now dynamically integrates with the AI service. The Postman collection has been updated to reflect the new expected behavior of the latest code.)*

### AI Service APIs
- **Total Tests**: 4 requests
- **Passed**: 4
- **Failed**: 0
- **Pass Rate**: 100%

### Integration Tests
- **Status**: The Node.js backend successfully communicates with the FastAPI service.
  - **GET /api/v1/ai/status**: AI status reflects actual AI service health (HTTP 200 with connected AI status).
  - **POST /api/v1/forecast**: Backend successfully contacted AI service. Tested with payload `{"resourceId": "ec2_cpu_utilization_24ae8d", "horizon": 5}`. 
  - **Result**: AI successfully loaded the model (no `_loss` error), generated a prediction, and the backend persisted it successfully. The endpoint returned HTTP 200 with a valid forecast prediction and `forecastValue`. Invalid forecast validation correctly returns HTTP 422 mapped to HTTP 400.

## 3. Defect Status (Regression)
- **BUG-01** (AI Forecast Model Deserialization): **RESOLVED** - `/forecast` model deserialization succeeds after updating to `scikit-learn==1.5.1`. `ModuleNotFoundError: No module named '_loss'` no longer occurs. Backend → AI E2E forecast flow verified working (HTTP 200).

- **BUG-02** (Backend Forecast Validation): **OBSOLETE** - Endpoint was stubbed, now integrated.
- **BUG-03** (Backend Recommendation Approve 500): **FIXED** - Now correctly returns 404.
- **BUG-04** (Backend Recommendation Reject 500): **FIXED** - Now correctly returns 404.
- **TEST-01** (Missing Seed Data): **FIXED** - Test automation updated to run seed-db.js automatically.
- **BUG-05** (Frontend Endpoint Mismatch): **OPEN** - Frontend UI calls `/forecast/run` instead of integrated `/api/v1/forecast`.
- **BUG-06** (Backend Error Masking): **RESOLVED** - Backend `errorHandler.js` now preserves 502/503/504 errors instead of masking them as 500. Unexpected errors remain sanitized.

## 4. Test Evidence
See `docs/TEST_EVIDENCE_INDEX.md` and `docs/DEFECT_REGISTER.md` for detailed logs and steps to reproduce.
