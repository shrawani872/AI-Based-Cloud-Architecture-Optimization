# Defect Register

| Defect ID | Date | Component | Endpoint | Status | Severity | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | Oct 02, 2026 | AI Service | `POST /forecast` | **OPEN** | High | AI model pickling incompatibility (`ModuleNotFoundError: No module named '_loss'`) during valid inference payload. (Reproduced during regression). |
| **BUG-02** | Oct 02, 2026 | Backend | `POST /api/v1/forecast` | **OBSOLETE** | Med | Missing validation allowed empty payloads to insert 1970 mock data. *Status update: The backend endpoint has been stubbed out and intentionally returns `501 Not Implemented` for all requests. The bug is no longer applicable.* |
| **BUG-03** | Oct 02, 2026 | Backend | `POST /api/v1/recommendations/:id/approve` | **FIXED** | Med | Approving a nonexistent recommendation ID returned `500 Internal Server Error` instead of 404. *Status update: Verified fixed. Now correctly returns `404 Not Found`.* |
| **BUG-04** | Oct 02, 2026 | Backend | `POST /api/v1/recommendations/:id/reject` | **FIXED** | Med | Rejecting a nonexistent recommendation ID returned `500 Internal Server Error` instead of 404. *Status update: Verified fixed. Now correctly returns `404 Not Found`.* |

## Detailed Records

### BUG-01: AI Forecast Model Loading Error (STILL OPEN)
- **Preconditions**: AI service running on port 8000.
- **Steps**: Send valid payload (>= 13 data points) to `http://localhost:8000/forecast`
- **Expected**: `200 OK` with JSON forecast predictions.
- **Actual**: `500 Internal Server Error`
- **Error Trace**: `ModuleNotFoundError: No module named '_loss'`

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
