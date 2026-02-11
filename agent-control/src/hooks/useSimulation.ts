import { useEffect, useCallback } from 'react';
import { useAgentStore } from '../store/agentStore';

/**
 * Hook to manage the agent simulation lifecycle.
 * Automatically starts/stops simulation and provides controls.
 */
export const useSimulation = (autoStart: boolean = true) => {
  const { 
    isSimulationRunning, 
    startSimulation, 
    stopSimulation 
  } = useAgentStore();

  // Auto-start simulation on mount if enabled
  useEffect(() => {
    if (autoStart && !isSimulationRunning) {
      startSimulation();
    }

    // Cleanup on unmount
    return () => {
      stopSimulation();
    };
  }, [autoStart, startSimulation, stopSimulation, isSimulationRunning]);

  const toggle = useCallback(() => {
    if (isSimulationRunning) {
      stopSimulation();
    } else {
      startSimulation();
    }
  }, [isSimulationRunning, startSimulation, stopSimulation]);

  return {
    isRunning: isSimulationRunning,
    start: startSimulation,
    stop: stopSimulation,
    toggle,
  };
};

export default useSimulation;
