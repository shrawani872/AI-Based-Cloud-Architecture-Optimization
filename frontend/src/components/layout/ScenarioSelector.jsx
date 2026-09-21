import React from 'react';
import { FlaskConical, ChevronDown } from 'lucide-react';
import { useMockScenario } from '../../hooks/useMockScenario';

/**
 * ScenarioSelector Component
 * Dev-only mock scenario switcher visible exclusively when VITE_USE_MOCK=true.
 * Enables live toggling between the 6 core architectural evaluation states.
 */
export function ScenarioSelector() {
  const { isMockEnabled, currentScenario, allScenarios, switchScenario, scenarioInfo } =
    useMockScenario();

  if (!isMockEnabled) {
    return null;
  }

  const handleChange = (e) => {
    switchScenario(e.target.value);
  };

  return (
    <div
      className="relative inline-flex items-center"
      title={`Demo Scenario: ${scenarioInfo.description}`}
    >
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-input bg-surface border border-border hover:border-accent focus-within:ring-2 focus-within:ring-accent transition-colors shadow-xs">
        <FlaskConical className="w-1.5 h-1.5 text-accent flex-shrink-0" aria-hidden="true" />
        <label htmlFor="dev-scenario-select" className="sr-only">
          Dev Scenario
        </label>
        <span className="text-[10px] font-bold text-textMuted uppercase hidden lg:inline tracking-wider">
          Scenario:
        </span>
        <select
          id="dev-scenario-select"
          value={currentScenario}
          onChange={handleChange}
          aria-label="Select demonstration scenario"
          className="bg-transparent text-xs font-semibold text-text focus:outline-none cursor-pointer pr-4 appearance-none -mr-3"
        >
          {allScenarios.map((sc) => (
            <option
              key={sc.id}
              value={sc.id}
              className="bg-surface text-text font-medium py-1"
            >
              {sc.name} ({sc.badge})
            </option>
          ))}
        </select>
        <ChevronDown className="w-1.5 h-1.5 text-textMuted pointer-events-none shrink-0" />
      </div>
    </div>
  );
}

export default ScenarioSelector;
