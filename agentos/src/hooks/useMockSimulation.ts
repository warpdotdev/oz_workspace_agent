import { useEffect } from 'react';
import { useAgentStore } from '../store';
import { mockAgents, mockActivities, generateRandomActivity } from '../lib';

export function useMockSimulation() {
  const { setAgents, addActivity, agents } = useAgentStore();

  // Initialize with mock data on mount
  useEffect(() => {
    setAgents(mockAgents);
    
    // Add initial activities
    mockActivities.forEach((activity) => {
      addActivity(activity);
    });
  }, [setAgents, addActivity]);

  // Simulate activity generation every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const newActivity = generateRandomActivity(agents);
      if (newActivity) {
        addActivity(newActivity);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [agents, addActivity]);
}
