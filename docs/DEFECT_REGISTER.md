# Defect Register

| Defect ID | Date | Component | Endpoint | Status | Severity | Description | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | Oct 02, 2026 | AI Service | `POST /forecast` | **OPEN** | High | AI model pickling incompatibility (`ModuleNotFoundError: No module named '_loss'`). Probable root cause: serialized model/runtime compatibility mismatch. | AI/ML owner |
| **BUG-02** | Oct 02, 2026 | Backend | `POST /api/v1/forecast` | **OBSOLETE** | Med | Missing validation. (Endpoint was stubbed, now integrated). | Backend |
| **BUG-03** | Oct 02, 2026 | Backend | `POST /api/v1/recommendations/:id/approve` | **FIXED** | Med | Approving nonexistent recommendation returned 500. Now 404. | Backend |
| **BUG-04** | Oct 02, 2026 | Backend | `POST /api/v1/recommendations/:id/reject` | **FIXED** | Med | Rejecting nonexistent recommendation returned 500. Now 404. | Backend |
| **TEST-01** | Oct 05, 2026 | Testing | `POST /api/v1/recommendations/*` | **FIXED** | Med | Local dev DB lacks required REC-001 and REC-002 records for E2E testing reproducibility. | Testing + Documentation |
| **BUG-05** | Oct 05, 2026 | Frontend ↔ Backend | `POST /forecast/run` | **OPEN** | CRITICAL | Frontend forecast trigger uses mismatched endpoint (`/forecast/run` instead of `/api/v1/forecast`), blocking integration when mock mode is disabled. | Frontend ↔ Backend Integration |
| **BUG-06** | Oct 05, 2026 | Backend | `POST /api/v1/forecast` | **OPEN** | MEDIUM | Generic error handler masks AI provider HTTP 502/503/504 errors by converting all 5xx errors to a generic HTTP 500 response. | Backend |

## Detailed Records

### BUG-01: AI Forecast Model Loading Error (OPEN)
- **Component**: AI Service (app/model_registry.py -> joblib.load)
- **Expected**: Valid forecast request should produce a prediction.
- **Actual**: AI service returns HTTP 500 during model deserialization.
- **Backend behavior**: AI HTTP 500 is mapped to HTTP 502 Bad Gateway.
- **Error Trace**: `ModuleNotFoundError: No module named '_loss'`
- **Probable root cause**: Serialized model/runtime compatibility mismatch. The exact original training environment cannot be confirmed because dependency versions were not pinned (requirements.txt) and model metadata is unavailable.
- **Recommended resolution**: Identify a compatible dependency environment and pin versions, OR retrain/regenerate the model artifacts in the supported environment. Either approach requires validation of model behavior before acceptance.

### BUG-02: Backend Forecast Missing Validation (OBSOLETE)
- **Status Change**: As of commit `028a59c`, this endpoint has been intentionally stubbed out. It now returns `501 Not Implemented` indicating the AI integration is pending. The original validation bug is obsolete as the code path is removed.

### BUG-03: Recommendation Approve Returns 500 (FIXED)
- **Regression Test**: Sent `POST /api/v1/recommendations/nonexistent-test-id/approve`
- **Current Result**: `404 Not Found`
- **Response**: `{"status":"error","message":"Recommendation not found"}`
- **Conclusion**: Fixed by recent teammate commit.

### BUG-04: Recommendation Reject Returns 500 (FIXED)
- **Regression Test**: Sent `POST /api/v1/recommendations/nonexistent-test-id/reject`
- **Current Result**: `404 Not Found`
- **Response**: `{"status":"error","message":"Recommendation not found"}`
- **Conclusion**: Fixed by recent teammate commit.

### TEST-01: REC-001 / REC-002 Test Data Missing (FIXED)
- **Payload**: `{"user": "test-admin"}` sent to `/recommendations/REC-001/approve` and `/recommendations/REC-002/reject`
- **Expected**: HTTP 200 with status becoming APPROVED or REJECTED.
- **Actual before test setup**: HTTP 404 Recommendation not found.
- **Root cause**: The local development database did not contain the required REC-001 and REC-002 records prior to E2E test execution. The application correctly returned 404.
- **Existing solution discovered**: `backend/scripts/seed-db.js` creates REC-001 and REC-002.
- **Classification**: Testing / Test Environment / Test Data Setup issue (NOT an application defect).
- **Resolution**: Updated `seed-db.js` to be idempotent and added programmatic execution of `seed-db.js` directly within `test-api-e2e.js` prior to running the test suite. Retest passed successfully.

### BUG-05: Frontend Forecast Endpoint Mismatch (OPEN)
- **Current frontend behavior**: `frontend/src/hooks/useForecast.js` currently calls `POST /forecast/run`.
- **Integrated backend endpoint**: `POST /api/v1/forecast`.
- **Impact**: When mock mode is disabled, the frontend forecast trigger cannot correctly reach the integrated backend forecast endpoint, blocking live frontend forecast integration.
- **Classification**: Frontend ↔ Backend Integration Dependency (CRITICAL).
- **Required Action**: Frontend teammate must update the forecast API call to the integrated backend endpoint. (The frontend API client uses `/api/v1` as base, so it should call `/forecast`).

### BUG-06: Backend Upstream Error Status Masking (OPEN)
- **Problem**: The AI provider correctly maps an AI Service HTTP 500 response to HTTP 502. However, the generic backend error handler (`errorHandler.js`) subsequently converts errors with status >= 500 into a generic HTTP 500 response.
- **Impact**: The backend API loses meaningful upstream error classification and cannot reliably distinguish 502 Bad Gateway, 503 Service Unavailable, or 504 Gateway Timeout from a generic backend 500 error. This is a non-blocking error classification issue.
- **Classification**: Backend (MEDIUM).
- **Required Action**: Backend teammate should update `errorHandler.js` to respect upstream 5xx status codes when available instead of defaulting to 500.
