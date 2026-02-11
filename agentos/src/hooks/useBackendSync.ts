import { useEffect, useRef } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { seedMockData, getEvents, getAgents } from '@/lib/tauri';
import type { AgentEvent } from '@/types';

/**
 * Hook to synchronize frontend state with the Tauri backend.
 * Replaces useMockSimulation with real backend integration.
 */
export function useBackendSync() {
  const { setAgents, addActivity, agents } = useAgentStore();
  const isInitialized = useRef(false);

  // Initialize agents from backend on mount
  useEffect(() => {
    async function initializeBackend() {
      if (isInitialized.current) return;
      
      try {
        // Try to load existing agents first
        let loadedAgents = await getAgents();
        
        // If no agents exist, seed with mock data
        if (loadedAgents.length === 0) {
          console.log('[Backend] No agents found, seeding mock data...');
          loadedAgents = await seedMockData();
          console.log('[Backend] Seeded', loadedAgents.length, 'agents');
        } else {
          console.log('[Backend] Loaded', loadedAgents.length, 'existing agents');
        }
        
        setAgents(loadedAgents);
        
        // Load recent events
        const events = await getEvents(50);
        console.log('[Backend] Loaded', events.length, 'events');
        
        // Convert AgentEvents to Activities and add to store
        events.reverse().forEach((event: AgentEvent) => {
          const agent = loadedAgents.find(a => a.id === event.agentId);
          addActivity({
            id: event.id,
            agentId: event.agentId,
            agentName: agent?.config.name || event.agentName,
            type: event.eventType,
            eventType: event.eventType,
            content: event.message,
            message: event.message,
            timestamp: event.timestamp,
          });
        });
        
        isInitialized.current = true;
      } catch (error) {
        console.error('[Backend] Failed to initialize:', error);
      }
    }

    initializeBackend();
  }, [setAgents, addActivity]);

  // Poll for new events every 3 seconds
  useEffect(() => {
    if (!isInitialized.current) return;

    const interval = setInterval(async () => {
      try {
        // Get latest events
        const events = await getEvents(10);
        
        // Add new events to activity feed
        events.forEach((event: AgentEvent) => {
          const agent = agents.find(a => a.id === event.agentId);
          addActivity({
            id: event.id,
            agentId: event.agentId,
            agentName: agent?.config.name || event.agentName,
            type: event.eventType,
            eventType: event.eventType,
            content: event.message,
            message: event.message,
            timestamp: event.timestamp,
          });
        });

        // Refresh agents to get updated status
        const updatedAgents = await getAgents();
        setAgents(updatedAgents);
      } catch (error) {
        console.error('[Backend] Failed to poll events:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [agents, addActivity, setAgents]);
}
