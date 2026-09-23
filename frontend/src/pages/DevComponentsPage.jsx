import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusChip } from '../components/feedback/StatusChip';
import { Skeleton } from '../components/feedback/Skeleton';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { RetryButton } from '../components/feedback/RetryButton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Select } from '../components/ui/Select';
import { SearchInput } from '../components/ui/SearchInput';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { FilterBar } from '../components/ui/FilterBar';
import { Pagination } from '../components/ui/Pagination';
import { DataTable } from '../components/ui/DataTable';
import { useToast } from '../hooks/useToast';
import {
  useDashboardSummary,
  useRecommendations,
  useApproveRecommendation,
  useRejectRecommendation,
  useSystemHealth,
} from '../hooks';
import { formatCurrency } from '../lib/formatters';
import { Server, Database, Zap, HardDrive, Bell, Check, X as XIcon, RefreshCw } from 'lucide-react';


export default function DevComponentsPage() {
  const toast = useToast();

  // State for interactive component demos
  const [searchValue, setSearchValue] = useState('');
  const [selectedService, setSelectedService] = useState('ec2');
  const [dateRange, setDateRange] = useState({ preset: '24h' });
  const [currentPage, setCurrentPage] = useState(1);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmVariant, setConfirmVariant] = useState('accent');
  const [activeFilters, setActiveFilters] = useState([
    { key: 'region', label: 'Region', value: 'us-east-1' },
    { key: 'env', label: 'Environment', value: 'Production' },
  ]);

  // Sample data for DataTable demo
  const sampleTableData = [
    {
      id: 'i-0a8b9c1d2e3f4g5',
      name: 'api-gateway-worker-01',
      service: 'EC2',
      type: 'c5.2xlarge',
      cost: '$148.50/mo',
      cpu: '18%',
      status: 'warning',
      action: 'Downsize to c5.xlarge',
    },
    {
      id: 'vol-0123456789abcdef0',
      name: 'analytics-db-storage',
      service: 'EBS',
      type: 'io2 (5000 IOPS)',
      cost: '$320.00/mo',
      cpu: '—',
      status: 'critical',
      action: 'Convert to gp3',
    },
    {
      id: 'rds-prod-primary-01',
      name: 'customer-aurora-cluster',
      service: 'RDS',
      type: 'db.r6g.xlarge',
      cost: '$480.00/mo',
      cpu: '42%',
      status: 'healthy',
      action: 'Maintain config',
    },
    {
      id: 'fn-payment-processor',
      name: 'payment-webhook-handler',
      service: 'Lambda',
      type: '1024MB ARM64',
      cost: '$34.20/mo',
      cpu: '—',
      status: 'optimized',
      action: 'Provisioned Concurrency OK',
    },
  ];

  const tableColumns = [
    {
      key: 'name',
      header: 'Resource Name',
      render: (item) => (
        <div>
          <span className="font-semibold text-text block">{item.name}</span>
          <span className="text-[11px] text-textMuted font-mono">{item.id}</span>
        </div>
      ),
    },
    {
      key: 'service',
      header: 'Service',
      render: (item) => (
        <span className="px-1.5 py-0.5 rounded-input bg-bg border border-border text-[11px] font-medium">
          {item.service}
        </span>
      ),
    },
    { key: 'type', header: 'Type / Tier' },
    { key: 'cost', header: 'Monthly Cost', align: 'right' },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusChip status={item.status} />,
    },
    {
      key: 'action',
      header: 'Recommended Action',
      render: (item) => (
        <span className="text-accent font-medium text-xs">{item.action}</span>
      ),
    },
  ];

  const handleRemoveFilter = (key) => {
    setActiveFilters((prev) => prev.filter((f) => f.key !== key));
  };

  // Module 4 TanStack Query hooks test
  const summaryQuery = useDashboardSummary();
  const recommendationsQuery = useRecommendations();
  const healthQuery = useSystemHealth();
  const approveMutation = useApproveRecommendation();
  const rejectMutation = useRejectRecommendation();

  const handleApprove = async (id, title) => {
    try {
      await approveMutation.mutateAsync({ id, user: 'qa-tester@company.internal' });
      toast.success(`Approved recommendation: ${title}`);
    } catch (err) {
      toast.error(err.message || 'Approval failed');
    }
  };

  const handleReject = async (id, title) => {
    try {
      await rejectMutation.mutateAsync({ id, reason: 'Dismissed in visual QA test' });
      toast.warning(`Rejected recommendation: ${title}`);
    } catch (err) {
      toast.error(err.message || 'Rejection failed');
    }
  };


  return (
    <div className="space-y-4 pb-6">
      <PageHeader
        title="UI & Feedback Components Gallery"
        subtitle="Visual QA screen showcasing all pure reusable tokens, controls, modals, and responsive switches."
        badge={
          <span className="px-1.5 py-0.5 rounded-input bg-warning/10 border border-warning/20 text-warning text-xs font-semibold">
            Dev Only
          </span>
        }
      />

      {/* 1. Status Chips */}
      <section className="p-3 bg-surface border border-border rounded-card space-y-2">
        <h3 className="text-xs font-bold text-text uppercase tracking-wider">
          1. StatusChip Component (Icon + Label, Multiple Variants)
        </h3>
        <div className="space-y-2">
          <div>
            <span className="text-[11px] text-textMuted block mb-1">Subtle Variant (Default):</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <StatusChip status="success" label="Success" />
              <StatusChip status="approved" label="Approved" />
              <StatusChip status="healthy" label="Healthy" />
              <StatusChip status="warning" label="Warning" />
              <StatusChip status="pending" label="Pending Review" />
              <StatusChip status="critical" label="Critical Breached" />
              <StatusChip status="rejected" label="Rejected" />
              <StatusChip status="info" label="Telemetry Active" />
              <StatusChip status="neutral" label="Neutral State" />
              <StatusChip status="optimized" label="AI Optimized" />
            </div>
          </div>
          <div>
            <span className="text-[11px] text-textMuted block mb-1">Solid & Outline Variants:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <StatusChip status="success" variant="solid" label="Solid Success" />
              <StatusChip status="critical" variant="solid" label="Solid Critical" />
              <StatusChip status="warning" variant="solid" label="Solid Warning" />
              <StatusChip status="approved" variant="outline" label="Outline Approved" />
              <StatusChip status="critical" variant="outline" label="Outline Critical" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Toast System & Confirmation Modal */}
      <section className="p-3 bg-surface border border-border rounded-card space-y-2">
        <h3 className="text-xs font-bold text-text uppercase tracking-wider">
          2. Toast Feedback & ConfirmDialog (Human-in-the-Loop)
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => toast.success('Recommendation approved and queued for execution.')}
            className="px-2 py-1 rounded-btn text-xs font-semibold bg-success text-white"
          >
            Trigger Success Toast
          </button>
          <button
            type="button"
            onClick={() => toast.error('Failed to communicate with AWS CloudWatch API.')}
            className="px-2 py-1 rounded-btn text-xs font-semibold bg-critical text-white"
          >
            Trigger Error Toast
          </button>
          <button
            type="button"
            onClick={() => toast.warning('Telemetry anomaly detected in us-east-1.')}
            className="px-2 py-1 rounded-btn text-xs font-semibold bg-warning text-white"
          >
            Trigger Warning Toast
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmVariant('accent');
              setIsConfirmOpen(true);
            }}
            className="px-2 py-1 rounded-btn text-xs font-semibold bg-accent text-white"
          >
            Open Approval ConfirmDialog
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmVariant('critical');
              setIsConfirmOpen(true);
            }}
            className="px-2 py-1 rounded-btn text-xs font-semibold border border-critical text-critical hover:bg-critical/10"
          >
            Open Reject ConfirmDialog
          </button>
        </div>
      </section>

      {/* 3. ErrorState, RetryButton, and EmptyState */}
      <section className="p-3 bg-surface border border-border rounded-card space-y-2">
        <h3 className="text-xs font-bold text-text uppercase tracking-wider">
          3. ErrorState, RetryButton & EmptyState
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <ErrorState
            title="CloudWatch Stream Disconnected"
            message="Unable to ingest live EC2 metrics. Displaying last known cached data."
            isStale={true}
            onRetry={() => toast.info('Reconnecting to CloudWatch metrics stream...')}
          />
          <EmptyState
            title="No Anomaly Incidents"
            description="All metrics are currently operating within the expected baseline."
            action={
              <button
                type="button"
                onClick={() => toast.info('Checking telemetry stream...')}
                className="px-2 py-1 rounded-btn text-xs font-medium bg-bg border border-border text-text hover:bg-surface"
              >
                Scan Now
              </button>
            }
          />
        </div>
      </section>

      {/* 4. FilterBar, SearchInput, Select & DateRangePicker */}
      <section className="p-3 bg-surface border border-border rounded-card space-y-3">
        <h3 className="text-xs font-bold text-text uppercase tracking-wider">
          4. FilterBar, SearchInput (Debounced), Select & DateRangePicker
        </h3>
        <FilterBar
          searchSlot={
            <SearchInput
              placeholder="Search instances, clusters, alarms..."
              onSearch={(debounced) => setSearchValue(debounced)}
            />
          }
          filtersSlot={
            <>
              <Select
                value={selectedService}
                onChange={setSelectedService}
                options={[
                  { value: 'all', label: 'All AWS Services' },
                  { value: 'ec2', label: 'Amazon EC2' },
                  { value: 'ebs', label: 'Amazon EBS' },
                  { value: 'rds', label: 'Amazon RDS' },
                  { value: 'lambda', label: 'AWS Lambda' },
                ]}
              />
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </>
          }
          activeFilters={activeFilters}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={() => setActiveFilters([])}
        />
        <div className="p-2 bg-bg border border-border rounded-input text-xs text-textMuted flex items-center justify-between">
          <span>
            Debounced Search Query: <strong className="text-text font-mono">"{searchValue || '(none)'}"</strong>
          </span>
          <span>
            Active Preset: <strong className="text-accent font-semibold">{dateRange.preset}</strong>
          </span>
        </div>
      </section>

      {/* 5. Skeleton Shimmer Placeholders */}
      <section className="p-3 bg-surface border border-border rounded-card space-y-2">
        <h3 className="text-xs font-bold text-text uppercase tracking-wider">
          5. Skeleton Shimmer (with Reduced-Motion Support)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="p-2.5 bg-bg border border-border rounded-card space-y-2">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="rectangular" height={32} />
            <Skeleton variant="text" width="40%" />
          </div>
          <div className="p-2.5 bg-bg border border-border rounded-card flex items-center gap-2">
            <Skeleton variant="circular" width={36} height={36} />
            <div className="space-y-1 flex-1">
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="50%" />
            </div>
          </div>
          <div className="p-2.5 bg-bg border border-border rounded-card space-y-2">
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="90%" />
            <Skeleton variant="text" width="70%" />
          </div>
        </div>
      </section>

      {/* 6. DataTable & Pagination (Auto table -> stacked card under 640px) */}
      <section className="p-3 bg-surface border border-border rounded-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-text uppercase tracking-wider">
            6. DataTable & Pagination (Auto switches to stacked cards under 640px)
          </h3>
          <span className="text-xs text-textMuted">Resize window to test mobile card deck</span>
        </div>

        <DataTable
          columns={tableColumns}
          data={sampleTableData}
          onRowClick={(row) => toast.info(`Selected resource: ${row.name}`)}
        />

        <Pagination
          page={currentPage}
          totalPages={5}
          pageSize={4}
          totalItems={20}
          onPageChange={setCurrentPage}
        />
      </section>

      {/* 7. Module 4 Live TanStack Query & Mock Mutations Test */}
      <section className="p-3 bg-surface border border-border rounded-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
            <RefreshCw className="w-2 h-2 text-accent" />
            7. Module 4: Live TanStack Query & Mock Mutation Layer
          </h3>
          <span className="text-xs px-1.5 py-0.5 rounded-input bg-accent/10 text-accent font-medium border border-accent/20">
            Mock Mode: Active (300-600ms latency)
          </span>
        </div>

        {/* Live Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2.5 bg-bg border border-border rounded-input">
            <span className="text-xs text-textMuted block">Monthly Spend</span>
            <span className="text-sm font-bold text-text">
              {summaryQuery.isLoading ? '...' : formatCurrency(summaryQuery.data?.monthlySpend)}
            </span>
          </div>
          <div className="p-2.5 bg-bg border border-border rounded-input">
            <span className="text-xs text-textMuted block">Potential Savings</span>
            <span className="text-sm font-bold text-success">
              {summaryQuery.isLoading ? '...' : formatCurrency(summaryQuery.data?.potentialMonthlySavings)}
            </span>
          </div>
          <div className="p-2.5 bg-bg border border-border rounded-input">
            <span className="text-xs text-textMuted block">Pending Approvals</span>
            <span className="text-sm font-bold text-warning">
              {summaryQuery.isLoading ? '...' : summaryQuery.data?.pendingApprovalsCount}
            </span>
          </div>
          <div className="p-2.5 bg-bg border border-border rounded-input">
            <span className="text-xs text-textMuted block">System Health Score</span>
            <span className="text-sm font-bold text-accent">
              {healthQuery.isLoading ? '...' : `${healthQuery.data?.healthScore}%`}
            </span>
          </div>
        </div>

        {/* Live Recommendations List with Dynamic Approve / Reject Mutations */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-text block">
            Interactive AI Recommendations (Mutations invalidate & update in real-time):
          </span>

          {recommendationsQuery.isLoading ? (
            <div className="space-y-1.5">
              <Skeleton height={48} />
              <Skeleton height={48} />
            </div>
          ) : (
            <div className="space-y-1.5">
              {recommendationsQuery.data?.map((rec) => (
                <div
                  key={rec.id}
                  className="p-2.5 bg-bg border border-border rounded-input flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-xs text-text">{rec.title}</span>
                      <StatusChip status={rec.status} />
                      <span className="text-[11px] font-mono text-textMuted">{rec.resourceName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-textMuted">
                      <span>Savings: <strong className="text-success">{formatCurrency(rec.monthlySavings)}/mo</strong></span>
                      <span>•</span>
                      <span>Risk: <strong className="text-text">{rec.riskLevel} ({rec.riskScore}/10)</strong></span>
                      <span>•</span>
                      <span>Category: <strong className="text-text">{rec.category}</strong></span>
                    </div>
                  </div>

                  {rec.status === 'PENDING' && (
                    <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleApprove(rec.id, rec.title)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-btn text-xs font-semibold bg-success hover:bg-success/90 text-white disabled:opacity-50"
                      >
                        <Check className="w-1.5 h-1.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(rec.id, rec.title)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-btn text-xs font-semibold border border-critical text-critical hover:bg-critical/10 disabled:opacity-50"
                      >
                        <XIcon className="w-1.5 h-1.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>


      {/* Confirm Dialog Instance */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false);
          toast.success(`Action confirmed for ${confirmVariant === 'critical' ? 'Rejection' : 'Approval'}.`);
        }}
        variant={confirmVariant}
        title={confirmVariant === 'critical' ? 'Reject Recommendation?' : 'Confirm Architecture Change'}
        description={
          confirmVariant === 'critical'
            ? 'Are you sure you want to dismiss this recommendation? This action will be recorded in the audit history.'
            : 'Applying this optimization will modify the AWS instance type from c5.2xlarge to c5.xlarge. Explicit human confirmation is required.'
        }
        confirmText={confirmVariant === 'critical' ? 'Reject Suggestion' : 'Approve & Apply'}
      />
    </div>
  );
}
