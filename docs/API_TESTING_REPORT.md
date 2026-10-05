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
- **Passed**: 3
- **Failed**: 1 (BUG-01)
- **Pass Rate**: 75%

### Integration Tests
- **Status**: The Node.js backend successfully communicates with the FastAPI service.
  - **GET /api/v1/ai/status**: AI status reflects actual AI service health (HTTP 200 with connected AI status).
  - **POST /api/v1/forecast**: Backend successfully contacted AI service. Tested with payload `{"resourceId": "ec2_cpu_utilization_24ae8d", "horizon": 24}`. AI returned HTTP 422 (insufficient history), Backend correctly mapped this to HTTP 400.
  - **Note**: AI communication = PASS. Model execution = BUG-01. A valid forecast request with sufficient data will reach BUG-01 when model loading is attempted.

## 3. Defect Status (Regression)
- **BUG-01** (AI Model Pickling): **OPEN** - `/forecast` model deserialization fails. AI returns 500.

- **BUG-02** (Backend Forecast Validation): **OBSOLETE** - Endpoint was stubbed, now integrated.
- **BUG-03** (Backend Recommendation Approve 500): **FIXED** - Now correctly returns 404.
- **BUG-04** (Backend Recommendation Reject 500): **FIXED** - Now correctly returns 404.
- **TEST-01** (Missing Seed Data): **FIXED** - Test automation updated to run seed-db.js automatically.
- **BUG-05** (Frontend Endpoint Mismatch): **OPEN** - Frontend UI calls `/forecast/run` instead of integrated `/api/v1/forecast`.
- **BUG-06** (Backend Error Masking): **OPEN** - Backend `errorHandler.js` overrides 502/503/504 errors, returning generic 500.

## 4. Test Evidence
See `docs/TEST_EVIDENCE_INDEX.md` and `docs/DEFECT_REGISTER.md` for detailed logs and steps to reproduce.
