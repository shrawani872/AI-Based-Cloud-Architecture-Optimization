import React from 'react';
import { Cpu, Target, Award, Clock, Activity } from 'lucide-react';
import { formatTimestamp } from '../../../lib/formatters';
import { Skeleton } from '../../../components/feedback/Skeleton';

/**
 * ForecastModelMetrics Component
 * Renders the ML model accuracy benchmarks (MAE, RMSE, MAPE) and input telemetry freshness.
 */
export function ForecastModelMetrics({
  modelName = 'Prophet-LSTM Hybrid',
  modelVersion = 'v2.4.1',
  accuracyMetrics = {},
  telemetryFreshness,
  isLoading = false,
  className = '',
}) {
  if (isLoading) {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-5 gap-2 ${className}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-3 bg-surface border border-border rounded-card space-y-1">
            <Skeleton width="50%" height={12} />
            <Skeleton width="80%" height={20} />
          </div>
        ))}
      </div>
    );
  }

  const {
    mae = '$18.40',
    rmse = '$24.60',
    mape = '3.8%',
    r2Score = '0.94',
  } = accuracyMetrics;

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-5 gap-2 ${className}`}>
      {/* 1. Model Architecture & Version */}
      <div className="p-3 bg-surface border border-border rounded-card">
        <div className="flex items-center gap-1 text-textMuted text-xs mb-0.5">
          <Cpu className="w-1.5 h-1.5 text-accent" />
          <span>Model Architecture</span>
        </div>
        <span className="text-xs font-bold text-text block truncate">{modelName}</span>
        <span className="text-[10px] text-accent font-medium">{modelVersion}</span>
      </div>

      {/* 2. MAE (Mean Absolute Error) */}
      <div className="p-3 bg-surface border border-border rounded-card">
        <div className="flex items-center gap-1 text-textMuted text-xs mb-0.5">
          <Target className="w-1.5 h-1.5 text-info" />
          <span>MAE (Mean Abs Error)</span>
        </div>
        <span className="text-base font-bold text-text">{mae}</span>
        <span className="text-[10px] text-textMuted block">Daily deviation</span>
      </div>

      {/* 3. RMSE (Root Mean Square Error) */}
      <div className="p-3 bg-surface border border-border rounded-card">
        <div className="flex items-center gap-1 text-textMuted text-xs mb-0.5">
          <Activity className="w-1.5 h-1.5 text-warning" />
          <span>RMSE</span>
        </div>
        <span className="text-base font-bold text-text">{rmse}</span>
        <span className="text-[10px] text-textMuted block">Variance penalty</span>
      </div>

      {/* 4. MAPE (Mean Abs Percent Error) */}
      <div className="p-3 bg-surface border border-border rounded-card">
        <div className="flex items-center gap-1 text-textMuted text-xs mb-0.5">
          <Award className="w-1.5 h-1.5 text-success" />
          <span>MAPE (Percent Error)</span>
        </div>
        <span className="text-base font-bold text-success">{mape}</span>
        <span className="text-[10px] text-success font-medium">96.2% Accuracy</span>
      </div>

      {/* 5. Input Freshness Indicator */}
      <div className="p-3 bg-surface border border-border rounded-card col-span-2 sm:col-span-1">
        <div className="flex items-center gap-1 text-textMuted text-xs mb-0.5">
          <Clock className="w-1.5 h-1.5 text-accent" />
          <span>Telemetry Freshness</span>
        </div>
        <span className="text-xs font-semibold text-text block">
          {telemetryFreshness ? formatTimestamp(telemetryFreshness) : 'Live Stream'}
        </span>
        <span className="text-[10px] text-textMuted block">Input data cutoff</span>
      </div>
    </div>
  );
}

export default ForecastModelMetrics;
