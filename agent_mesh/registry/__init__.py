"""AgentMesh Registry - Agent discovery and message routing."""
try:
    from agent_mesh.registry.registry import AgentRegistry, DistributedRegistry
except ImportError:
    from .registry import AgentRegistry, DistributedRegistry

__all__ = ["AgentRegistry", "DistributedRegistry"]
