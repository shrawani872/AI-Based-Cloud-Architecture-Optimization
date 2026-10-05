# Defect Register

| Defect ID | Date | Component | Endpoint | Status | Severity | Description | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | Oct 02, 2026 | AI Service | `POST /forecast` | **OPEN** | High | AI model pickling incompatibility (`ModuleNotFoundError: No module named '_loss'`). Probable root cause: serialized model/runtime compatibility mismatch. | AI/ML owner |
| **BUG-02** | Oct 02, 2026 | Backend | `POST /api/v1/forecast` | **OBSOLETE** | Med | Missing validation. (Endpoint was stubbed, now integrated). | Backend |
| **BUG-03** | Oct 02, 2026 | Backend | `POST /api/v1/recommendations/:id/approve` | **FIXED** | Med | Approving nonexistent recommendation returned 500. Now 404. | Backend |
| **BUG-04** | Oct 02, 2026 | Backend | `POST /api/v1/recommendations/:id/reject` | **FIXED** | Med | Rejecting nonexistent recommendation returned 500. Now 404. | Backend |
| **TEST-01** | Oct 05, 2026 | Testing | `POST /api/v1/recommendations/*` | **OPEN** | Med | Local dev DB lacks required REC-001 and REC-002 records for E2E testing reproducibility. | Testing + Documentation |
| **FE-INT-01**| Oct 05, 2026 | Frontend/Backend | `POST /api/v1/forecast` | **OPEN** | High | Frontend hook `useForecast.js` calls mock endpoint `/forecast/run` instead of integrated backend `/api/v1/forecast`. | Frontend/Backend owner |

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

### TEST-01: REC-001 / REC-002 Test Data Missing (OPEN)
- **Payload**: `{"user": "test-admin"}` sent to `/recommendations/REC-001/approve` and `/recommendations/REC-002/reject`
- **Expected**: HTTP 200 with status becoming APPROVED or REJECTED.
- **Actual before test setup**: HTTP 404 Recommendation not found.
- **Root cause**: The local development database does not contain the required REC-001 and REC-002 records. The application correctly returns 404 when the record doesn't exist.
- **Existing solution discovered**: `backend/scripts/seed-db.js` creates REC-001 and REC-002, but the E2E test does not automatically invoke it.
- **Classification**: Testing / Test Environment / Test Data Setup issue (NOT an application defect).
- **Recommended resolution**: Wire the existing `seed-db.js` into the E2E test setup or create an appropriate dedicated test-fixture mechanism. (Do NOT change recommendation logic).

### FE-INT-01: Frontend/Backend Endpoint Mismatch (OPEN)
- **Current frontend behavior**: `frontend/src/hooks/useForecast.js` calls `POST /forecast/run`.
- **Integrated backend endpoint**: `POST /api/v1/forecast`.
- **Classification**: Frontend ↔ Backend Integration Dependency (BLOCKED FOR FULL END-TO-END FORECAST FLOW).
- **Required Action**: Frontend teammate must update the forecast API call to the integrated backend endpoint, remove/adjust mock-mode behavior, and handle the real backend response schema.
