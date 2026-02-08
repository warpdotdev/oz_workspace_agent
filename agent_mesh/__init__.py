"""
AgentMesh - A Social Network for AI Agents

AgentMesh enables peer-to-peer agent collaboration without centralized orchestration.
Agents can discover each other's capabilities, communicate directly, share context,
and delegate tasks - forming a true mesh network of collaborating AI agents.

Key Components:
- Agent: The base class for all agents with capabilities, messaging, and delegation
- Registry: Enables agent discovery and message routing
- Capability: Describes what an agent can do

Example:
    from agent_mesh import Agent, Capability, AgentRegistry
    
    # Create an agent with capabilities
    my_agent = Agent("MyBot", "I do cool things")
    my_agent.add_capability(Capability("task", "Does a specific task"))
    
    # Register with the mesh
    registry = AgentRegistry("my-mesh")
    registry.register(my_agent)
    
    # Find other agents that can help
    helpers = registry.find_agents_by_capability("research")
"""

try:
    from agent_mesh.core.agent import Agent, Capability, Message, MessageType
    from agent_mesh.registry.registry import AgentRegistry, DistributedRegistry
except ImportError:
    from .core.agent import Agent, Capability, Message, MessageType
    from .registry.registry import AgentRegistry, DistributedRegistry

__version__ = "0.1.0"
__all__ = [
    "Agent",
    "Capability", 
    "Message",
    "MessageType",
    "AgentRegistry",
    "DistributedRegistry"
]
