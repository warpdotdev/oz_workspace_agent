"""AgentMesh Examples - Specialized agent implementations."""
try:
    from agent_mesh.examples.specialized_agents import (
        ResearchAgent,
        CodeAgent,
        WritingAgent,
        OrchestratorAgent,
        DataAnalystAgent
    )
except ImportError:
    from .specialized_agents import (
        ResearchAgent,
        CodeAgent,
        WritingAgent,
        OrchestratorAgent,
        DataAnalystAgent
    )

__all__ = [
    "ResearchAgent",
    "CodeBot",
    "WritingAgent", 
    "OrchestratorAgent",
    "DataAnalystAgent"
]
