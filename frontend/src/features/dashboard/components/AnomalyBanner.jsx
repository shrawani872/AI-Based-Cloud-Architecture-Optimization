import React from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, ArrowRight, ShieldAlert } from 'lucide-react';

/**
 * AnomalyBanner Component
 * High-urgency alert banner rendered ONLY when HIGH or CRITICAL anomalies are detected.
 */
export function AnomalyBanner({ anomalies = [], className = '' }) {
  const highOrCriticalAnomalies = anomalies.filter(
    (a) => a.severity === 'CRITICAL' || a.severity === 'HIGH'
  );

  const criticalCount = highOrCriticalAnomalies.filter((a) => a.severity === 'CRITICAL').length;
  const primaryAnomaly = highOrCriticalAnomalies[0];

  return (
    <div aria-live="assertive" aria-atomic="true">
      {highOrCriticalAnomalies.length > 0 && (
        <div
          role="alert"
          className={`p-3 bg-critical/10 border border-critical/30 rounded-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-text transition-all duration-normal ${className}`}
        >
      <div className="flex items-start gap-2.5">
        <div className="w-5 h-5 rounded-input bg-critical/20 border border-critical/40 flex items-center justify-center text-critical flex-shrink-0 mt-0.5 sm:mt-0 animate-pulse">
          <AlertOctagon className="w-3 h-3" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xs font-bold text-critical">
              {highOrCriticalAnomalies.length} High-Severity Incident{highOrCriticalAnomalies.length > 1 ? 's' : ''} Detected
            </h3>
            {criticalCount > 0 && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-critical text-white rounded">
                {criticalCount} Critical
              </span>
            )}
          </div>
          <p className="text-xs text-textMuted mt-0.5 leading-snug">
            <strong className="text-text font-medium">{primaryAnomaly.title}</strong> — {primaryAnomaly.rootCause}
          </p>
        </div>
      </div>

      <Link
        to="/anomalies"
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-btn text-xs font-bold bg-critical hover:bg-critical/90 text-white flex-shrink-0 self-end sm:self-center transition-colors shadow-xs"
      >
        <span>View Incidents</span>
        <ArrowRight className="w-1.5 h-1.5" />
      </Link>
        </div>
      )}
    </div>
  );
}

export default AnomalyBanner;
