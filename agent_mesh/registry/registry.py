#!/usr/bin/env python3
"""
AgentMesh - Registry Module

The registry is the discovery layer of AgentMesh. It allows agents to:
- Register themselves and their capabilities
- Discover other agents by capability
- Route messages between agents

Unlike centralized orchestrators, the registry doesn't control agents -
it simply facilitates discovery and communication.
"""

import json
from typing import Optional
from pathlib import Path
from datetime import datetime

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from core.agent import Agent, Message, Capability


class AgentRegistry:
    """
    A registry for agent discovery and message routing.
    
    The registry maintains a directory of agents and their capabilities,
    enabling peer-to-peer discovery without centralized control.
    """
    
    def __init__(self, name: str = "default"):
        self.name = name
        self.agents: dict[str, Agent] = {}
        self.capability_index: dict[str, list[str]] = {}  # capability_name -> [agent_ids]
        self.message_log: list[dict] = []
        self._created_at = datetime.utcnow().isoformat()
    
    def register(self, agent: Agent) -> "AgentRegistry":
        """
        Register an agent with the registry.
        Returns self for chaining.
        """
        self.agents[agent.id] = agent
        agent.registry = self
        
        # Index capabilities for fast lookup
        for capability in agent.capabilities:
            if capability.name not in self.capability_index:
                self.capability_index[capability.name] = []
            if agent.id not in self.capability_index[capability.name]:
                self.capability_index[capability.name].append(agent.id)
        
        return self
    
    def unregister(self, agent_id: str) -> bool:
        """Remove an agent from the registry."""
        if agent_id not in self.agents:
            return False
        
        agent = self.agents[agent_id]
        
        # Remove from capability index
        for capability in agent.capabilities:
            if capability.name in self.capability_index:
                self.capability_index[capability.name] = [
                    aid for aid in self.capability_index[capability.name]
                    if aid != agent_id
                ]
        
        # Remove agent reference to registry
        agent.registry = None
        del self.agents[agent_id]
        
        return True
    
    def get_agent(self, agent_id: str) -> Optional[Agent]:
        """Get an agent by ID."""
        return self.agents.get(agent_id)
    
    def find_agents_by_capability(self, query: str) -> list[tuple[Agent, float]]:
        """
        Find agents that can handle a given capability query.
        Returns a list of (agent, score) tuples, sorted by score descending.
        """
        results = []
        
        for agent in self.agents.values():
            best_score = 0.0
            for capability in agent.capabilities:
                score = capability.matches(query)
                best_score = max(best_score, score)
            
            if best_score > 0:
                results.append((agent, best_score))
        
        # Sort by score descending
        results.sort(key=lambda x: x[1], reverse=True)
        return results
    
    def route_message(self, message: Message) -> Optional[Message]:
        """
        Route a message to its recipient and return the response.
        """
        recipient = self.agents.get(message.recipient_id)
        
        # Log the message
        self.message_log.append({
            "timestamp": message.timestamp,
            "from": message.sender_id,
            "to": message.recipient_id,
            "type": message.type.value,
            "delivered": recipient is not None
        })
        
        if not recipient:
            return None
        
        # Deliver message and get response
        response = recipient.receive_message(message)
        
        if response:
            self.message_log.append({
                "timestamp": response.timestamp,
                "from": response.sender_id,
                "to": response.recipient_id,
                "type": response.type.value,
                "delivered": True
            })
        
        return response
    
    def broadcast_capability_query(self, query: str, exclude_ids: list[str] = None) -> dict[str, list[dict]]:
        """
        Query all agents for their matching capabilities.
        Returns a dict of agent_id -> matching capabilities.
        """
        exclude_ids = exclude_ids or []
        results = {}
        
        for agent_id, agent in self.agents.items():
            if agent_id in exclude_ids:
                continue
            
            matching = []
            for cap in agent.capabilities:
                score = cap.matches(query)
                if score > 0:
                    matching.append({
                        "capability": cap.name,
                        "description": cap.description,
                        "score": score
                    })
            
            if matching:
                results[agent_id] = {
                    "agent_name": agent.name,
                    "capabilities": matching
                }
        
        return results
    
    def get_all_capabilities(self) -> list[dict]:
        """Get a list of all unique capabilities in the registry."""
        capabilities = {}
        
        for agent in self.agents.values():
            for cap in agent.capabilities:
                if cap.name not in capabilities:
                    capabilities[cap.name] = {
                        "name": cap.name,
                        "description": cap.description,
                        "agent_count": 0,
                        "agents": []
                    }
                capabilities[cap.name]["agent_count"] += 1
                capabilities[cap.name]["agents"].append(agent.name)
        
        return list(capabilities.values())
    
    def get_stats(self) -> dict:
        """Get registry statistics."""
        return {
            "name": self.name,
            "agent_count": len(self.agents),
            "capability_count": len(self.capability_index),
            "message_count": len(self.message_log),
            "created_at": self._created_at,
            "agents": [
                {
                    "id": agent.id,
                    "name": agent.name,
                    "capabilities": len(agent.capabilities)
                }
                for agent in self.agents.values()
            ]
        }
    
    def to_dict(self) -> dict:
        """Serialize registry to dictionary."""
        return {
            "name": self.name,
            "created_at": self._created_at,
            "agents": {
                agent_id: agent.to_dict()
                for agent_id, agent in self.agents.items()
            },
            "capability_index": self.capability_index,
            "message_log_size": len(self.message_log)
        }
    
    def save(self, filepath: str):
        """Save registry state to a JSON file."""
        with open(filepath, "w") as f:
            json.dump(self.to_dict(), f, indent=2)
    
    def __repr__(self):
        return f"AgentRegistry({self.name}, agents={len(self.agents)}, capabilities={len(self.capability_index)})"


class DistributedRegistry(AgentRegistry):
    """
    A distributed registry that can sync with other registries.
    
    This enables true peer-to-peer agent networks where multiple
    registries can share information about their agents.
    """
    
    def __init__(self, name: str = "distributed"):
        super().__init__(name)
        self.peer_registries: dict[str, dict] = {}  # registry_name -> info
    
    def add_peer(self, peer_name: str, peer_agents: dict):
        """Add a peer registry's agents to our index."""
        self.peer_registries[peer_name] = {
            "agents": peer_agents,
            "added_at": datetime.utcnow().isoformat()
        }
    
    def find_agents_by_capability(self, query: str) -> list[tuple[Agent, float]]:
        """
        Extended search that also checks peer registries.
        """
        # First, search local agents
        results = super().find_agents_by_capability(query)
        
        # TODO: Also search peer registries and return combined results
        # This would involve network calls in a real implementation
        
        return results
