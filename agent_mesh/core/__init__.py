"""AgentMesh Core - Agent and Message definitions."""
try:
    from agent_mesh.core.agent import Agent, Capability, Message, MessageType
except ImportError:
    from .agent import Agent, Capability, Message, MessageType

__all__ = ["Agent", "Capability", "Message", "MessageType"]
