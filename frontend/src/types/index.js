/**
 * JSDoc definitions and constants for domain models:
 * Telemetry, Forecast, Anomaly, Recommendation, ApprovalStatus
 */

/**
 * @typedef {'PENDING' | 'APPROVED' | 'REJECTED'} ApprovalStatus
 * @typedef {'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'} SeverityLevel
 */

export const SEVERITY_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const APPROVAL_STATUSES = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};
