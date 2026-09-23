import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { mockStore, SCENARIOS } from '../lib/mockData';
import { USE_MOCK } from '../lib/api';

/**
 * useMockScenario Hook
 * Provides reactive access to current mock evaluation scenario and switcher method.
 */
export function useMockScenario() {
  const queryClient = useQueryClient();
  const [currentScenario, setCurrentScenario] = useState(() => mockStore.getScenario());

  useEffect(() => {
    const unsubscribe = mockStore.subscribeScenario((scenarioId) => {
      setCurrentScenario(scenarioId);
    });
    return unsubscribe;
  }, []);

  const switchScenario = useCallback(
    async (scenarioId) => {
      mockStore.setScenario(scenarioId);
      // Immediately invalidate all queries so pages and widgets refresh with scenario data
      await queryClient.invalidateQueries();
    },
    [queryClient]
  );

  return {
    isMockEnabled: USE_MOCK,
    currentScenario,
    scenarioInfo: SCENARIOS[currentScenario] || SCENARIOS.normal,
    allScenarios: Object.values(SCENARIOS),
    switchScenario,
    isAiUnavailable: currentScenario === 'ai_unavailable',
    isAwsUnavailable: currentScenario === 'aws_unavailable',
  };
}

export default useMockScenario;
