import React, { useState, useMemo, useEffect } from 'react';
import { DataTable } from '../../../components/ui/DataTable';
import { Pagination } from '../../../components/ui/Pagination';
import { StatusChip } from '../../../components/feedback/StatusChip';
import { formatTimestamp } from '../../../lib/formatters';
import { Table, Download } from 'lucide-react';

/**
 * Downsampling helper for large time-series telemetry sets
 * Groups adjacent points and takes average/peak.
 */
function downsamplePoints(points, maxPoints = 80) {
  if (!points || points.length <= maxPoints) return points;

  const bucketSize = Math.ceil(points.length / maxPoints);
  const downsampled = [];

  for (let i = 0; i < points.length; i += bucketSize) {
    const bucket = points.slice(i, i + bucketSize);
    const avgCpu = Math.round(bucket.reduce((acc, p) => acc + p.cpuUtilization, 0) / bucket.length);
    const avgMem = Math.round(bucket.reduce((acc, p) => acc + p.memoryUtilization, 0) / bucket.length);
    const avgReq = Math.round(bucket.reduce((acc, p) => acc + p.requestRate, 0) / bucket.length);
    const maxLat = Math.max(...bucket.map((p) => p.p95Latency));
    const maxErr = Math.max(...bucket.map((p) => p.errorRate));
    const avgNetIn = Math.round(bucket.reduce((acc, p) => acc + p.networkIn, 0) / bucket.length);
    const avgNetOut = Math.round(bucket.reduce((acc, p) => acc + p.networkOut, 0) / bucket.length);
    const avgCost = Number((bucket.reduce((acc, p) => acc + p.costRate, 0) / bucket.length).toFixed(2));
    const hasAnomaly = bucket.some((p) => p.isAnomaly);

    downsampled.push({
      timestamp: bucket[0].timestamp,
      cpuUtilization: avgCpu,
      memoryUtilization: avgMem,
      requestRate: avgReq,
      p95Latency: maxLat,
      errorRate: maxErr,
      networkIn: avgNetIn,
      networkOut: avgNetOut,
      costRate: avgCost,
      isAnomaly: hasAnomaly,
      anomalyReason: hasAnomaly ? bucket.find((p) => p.isAnomaly)?.anomalyReason : null,
    });
  }

  return downsampled;
}

/**
 * TelemetryDataTable Component
 * Raw metric observations table with client-side downsampling for long ranges and pagination.
 */
export function TelemetryDataTable({
  rawData = [],
  range = '24h',
  pageSize = 10,
  className = '',
}) {
  const [currentPage, setCurrentPage] = useState(1);

  // Memoize downsampling and log count to console per specification
  const processedData = useMemo(() => {
    const initialCount = rawData.length;
    const downsampled = downsamplePoints(rawData, 100);
    console.log(
      `[Telemetry Downsample] Range: ${range} | Original points: ${initialCount} -> Processed points: ${downsampled.length}`
    );
    return downsampled;
  }, [rawData, range]);

  // Reset page when dataset/range changes
  useEffect(() => {
    setCurrentPage(1);
  }, [range, rawData]);

  // Client-side pagination slicing
  const totalPages = Math.ceil(processedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize]);

  const columns = [
    {
      key: 'timestamp',
      header: 'Sample Timestamp',
      render: (item) => (
        <span className="font-mono text-text font-medium">
          {formatTimestamp(item.timestamp)}
        </span>
      ),
    },
    {
      key: 'cpuUtilization',
      header: 'CPU %',
      render: (item) => (
        <span className={`font-semibold ${item.cpuUtilization > 80 ? 'text-critical' : 'text-text'}`}>
          {item.cpuUtilization}%
        </span>
      ),
    },
    {
      key: 'memoryUtilization',
      header: 'Memory %',
      render: (item) => `${item.memoryUtilization}%`,
    },
    {
      key: 'requestRate',
      header: 'Requests',
      render: (item) => `${item.requestRate} req/s`,
    },
    {
      key: 'p95Latency',
      header: 'p95 Latency',
      render: (item) => (
        <span className={item.p95Latency > 12 ? 'text-critical font-semibold' : ''}>
          {item.p95Latency} ms
        </span>
      ),
    },
    {
      key: 'errorRate',
      header: 'Error %',
      render: (item) => (
        <span className={item.errorRate > 2.0 ? 'text-critical font-semibold' : 'text-textMuted'}>
          {item.errorRate}%
        </span>
      ),
    },
    {
      key: 'network',
      header: 'Network (In / Out)',
      render: (item) => `${item.networkIn} / ${item.networkOut} KB/s`,
    },
    {
      key: 'isAnomaly',
      header: 'Incident Flag',
      align: 'center',
      render: (item) => (
        item.isAnomaly ? (
          <StatusChip status="critical" label="Anomaly" />
        ) : (
          <span className="text-textMuted text-xs font-mono">—</span>
        )
      ),
    },
  ];

  return (
    <div className={`p-3 bg-surface border border-border rounded-card space-y-3 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-input bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Table className="w-2 h-2" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-text">Raw Telemetry Observations</h3>
            <p className="text-[11px] text-textMuted">
              Sampled CloudWatch metric records ({processedData.length} total points in view)
            </p>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginatedData}
        keyField="timestamp"
      />

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={processedData.length}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

export default TelemetryDataTable;
