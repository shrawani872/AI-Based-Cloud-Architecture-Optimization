import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';

export default function RecommendationDetailPage() {
  const { id } = useParams();

  return (
    <div className="space-y-3">
      <PageHeader
        title={`Recommendation Detail — #${id || 'REC-001'}`}
        subtitle="Deep dive review, impact simulation, rollback plan, and human approval workflow."
        actions={
          <Link
            to="/recommendations"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-btn text-xs font-medium border border-border bg-surface text-text hover:bg-bg transition-colors"
          >
            <ArrowLeft className="w-2 h-2" />
            <span>Back to Recommendations</span>
          </Link>
        }
      />
      <div className="p-4 bg-surface border border-border rounded-card">
        <p className="text-textMuted text-xs">
          Detailed impact analysis, simulated metrics, and approve/reject confirmation modals will be loaded here.
        </p>
      </div>
    </div>
  );
}
