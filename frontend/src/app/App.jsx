import React from 'react';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Sparkles, ShieldCheck, CheckCircle2, Cpu, BarChart3, Bell, ArrowRight } from 'lucide-react';

export function App() {
  const tokenList = [
    { name: 'Accent', class: 'bg-accent text-white', hex: 'var(--accent)' },
    { name: 'Success', class: 'bg-success text-white', hex: 'var(--success)' },
    { name: 'Warning', class: 'bg-warning text-white', hex: 'var(--warning)' },
    { name: 'Critical', class: 'bg-critical text-white', hex: 'var(--critical)' },
    { name: 'Info', class: 'bg-info text-white', hex: 'var(--info)' },
  ];

  return (
    <main className="min-h-screen flex items-center justify-center p-3 bg-bg text-text selection:bg-accent selection:text-white">
      <div className="w-full max-w-xl bg-surface border border-border rounded-card p-4 shadow-sm transition-colors duration-normal">
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-input bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Cpu className="w-2 h-2" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-text">
                AI Cloud Optimizer — Setup OK
              </h1>
              <p className="text-xs text-textMuted">
                Module 1: Bootstrap & Design Tokens
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Status Indicator */}
        <div className="mt-3 p-2 bg-bg border border-border rounded-input flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-2 h-2 text-success" />
            <span className="text-xs font-medium text-text">System Status: Ready</span>
          </div>
          <span className="text-xs px-1 py-0.5 rounded-input bg-success/10 text-success border border-success/20 font-medium">
            Active
          </span>
        </div>

        {/* Feature Pipeline Grid */}
        <div className="mt-3">
          <h2 className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-1">
            Core Architecture Pipeline
          </h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-input bg-bg border border-border">
              <div className="flex items-center gap-1 font-medium text-text mb-1">
                <Cpu className="w-2 h-2 text-accent" />
                AWS Telemetry
              </div>
              <p className="text-textMuted text-xs">
                Live CloudWatch ingestion & metrics
              </p>
            </div>
            <div className="p-2 rounded-input bg-bg border border-border">
              <div className="flex items-center gap-1 font-medium text-text mb-1">
                <BarChart3 className="w-2 h-2 text-accent" />
                Forecasting
              </div>
              <p className="text-textMuted text-xs">
                Capacity & cost projection models
              </p>
            </div>
            <div className="p-2 rounded-input bg-bg border border-border">
              <div className="flex items-center gap-1 font-medium text-text mb-1">
                <Bell className="w-2 h-2 text-warning" />
                Anomaly Detection
              </div>
              <p className="text-textMuted text-xs">
                Z-score & multi-variate incident logs
              </p>
            </div>
            <div className="p-2 rounded-input bg-bg border border-border">
              <div className="flex items-center gap-1 font-medium text-text mb-1">
                <ShieldCheck className="w-2 h-2 text-success" />
                Human Review
              </div>
              <p className="text-textMuted text-xs">
                Explicit 2-step approval safeguards
              </p>
            </div>
          </div>
        </div>

        {/* Token Swatch Preview */}
        <div className="mt-3">
          <h2 className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-1">
            Active Color Palette Tokens
          </h2>
          <div className="grid grid-cols-5 gap-1">
            {tokenList.map((token) => (
              <div
                key={token.name}
                className="flex flex-col items-center p-1 rounded-input border border-border bg-bg"
              >
                <div
                  className={`w-full h-3 rounded-input ${token.class} flex items-center justify-center text-[10px] font-semibold mb-1 shadow-sm`}
                >
                  Aa
                </div>
                <span className="text-[11px] font-medium text-text">{token.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Specs */}
        <div className="mt-3 pt-2 border-t border-border flex flex-wrap items-center justify-between text-xs text-textMuted gap-1">
          <div className="flex items-center gap-2">
            <span>Inter (14px)</span>
            <span>•</span>
            <span>Strict 8px Grid</span>
            <span>•</span>
            <span>WCAG AA</span>
          </div>
          <div className="flex items-center gap-1 text-accent font-medium">
            <span>Ready for Module 2</span>
            <ArrowRight className="w-1.5 h-1.5" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
