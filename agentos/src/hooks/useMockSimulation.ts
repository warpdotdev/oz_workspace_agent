import { useEffect } from 'react';
import { useAgentStore } from '../store';
import { mockAgents, mockActivities, generateRandomActivity } from '../lib';
import type { Activity, ActivityEvent } from '../types';

// Convert ActivityEvent to Activity format
function toActivity(event: ActivityEvent): Activity {
  return {
    id: event.id,
    agentId: event.agentId,
    agentName: event.agentName,
    type: event.type,
    content: event.message,
    timestamp: event.timestamp,
    metadata: event.metadata,
  };
}

export function useMockSimulation() {
  const { setAgents, addActivity, agents } = useAgentStore();

  // Initialize with mock data on mount
  useEffect(() => {
    setAgents(mockAgents);
    
    // Add initial activities
    mockActivities.forEach((event) => {
      addActivity(toActivity(event));
    });
  }, [setAgents, addActivity]);

  // Simulate activity generation every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent = generateRandomActivity(agents);
      if (newEvent) {
        addActivity(toActivity(newEvent));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [agents, addActivity]);
}
