# 🌐 AgentMesh

**A Social Network for AI Agents**

AgentMesh is a peer-to-peer collaboration framework that enables AI agents to discover each other, communicate directly, and work together without centralized orchestration.

## 🎯 The Problem

Current multi-agent systems suffer from:
- **Centralized orchestration** - A single "god" agent controls everything
- **Poor discoverability** - Agents can't find each other dynamically
- **Siloed context** - Agents don't share knowledge
- **Tight coupling** - Systems break when the orchestrator fails

## 💡 The Solution

AgentMesh creates a **mesh network** where agents are peers:

```
    ┌─────────┐     ┌─────────┐     ┌─────────┐
    │Research │◄───►│  Code   │◄───►│ Writing │
    │  Agent  │     │  Agent  │     │  Agent  │
    └────┬────┘     └────┬────┘     └────┬────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
                  ┌──────┴──────┐
                  │   Registry   │
                  │ (Discovery)  │
                  └─────────────┘
```

**Key principles:**
- **Peer-to-peer** - Any agent can talk to any other agent
- **Capability-based discovery** - Find agents by what they can do
- **Decentralized** - No single point of failure
- **Context sharing** - Agents share knowledge freely

## 🚀 Quick Start

```python
from agent_mesh import Agent, Capability, AgentRegistry

# Create agents with capabilities
researcher = Agent("ResearchBot", "I gather information")
researcher.add_capability(Capability("research", "Research any topic"))

coder = Agent("CodeBot", "I write code")
coder.add_capability(Capability("code", "Generate code"))

# Create a registry (discovery layer)
registry = AgentRegistry("my-mesh")
registry.register(researcher)
registry.register(coder)

# Agents can now discover each other
helpers = registry.find_agents_by_capability("research")
# Returns: [(researcher, 0.9)]

# And communicate directly
response = coder.request_task("research", {"topic": "AI trends"})
```

## 📦 Components

### Agent
The fundamental unit of the mesh. Each agent has:
- **Identity** - Unique ID, name, description
- **Capabilities** - What it can do
- **Message handlers** - How it responds to requests
- **Context** - Shared knowledge

### Capability
Describes what an agent can do:
```python
Capability(
    name="code_generation",
    description="Generate code in various languages",
    confidence=0.9  # How good the agent is at this
)
```

### Registry
The discovery layer (not a controller!):
- Agents register themselves
- Other agents query for capabilities
- Messages are routed between agents

### Message Types
- `TASK_REQUEST` - Ask another agent to do something
- `TASK_RESPONSE` - Response with results
- `CAPABILITY_QUERY` - Ask what an agent can do
- `CONTEXT_SHARE` - Share knowledge

## 🔧 Creating Custom Agents

```python
from agent_mesh import Agent, Capability, Message, MessageType

class MySpecialAgent(Agent):
    def __init__(self):
        super().__init__(
            name="SpecialBot",
            description="I do special things"
        )
        
        # Add capabilities
        self.add_capability(Capability(
            name="special_task",
            description="Perform a special task",
            confidence=0.95
        ))
        
        # Register custom handler
        self.register_handler(
            MessageType.TASK_REQUEST, 
            self._handle_special_task
        )
    
    def _handle_special_task(self, message: Message) -> Message:
        # Process the task
        result = do_something_special(message.payload)
        
        return Message(
            type=MessageType.TASK_RESPONSE,
            sender_id=self.id,
            recipient_id=message.sender_id,
            payload={"success": True, "result": result},
            in_reply_to=message.id
        )
```

## 🎮 Run the Demo

```bash
cd agent_mesh/examples
python demo.py
```

This will show you:
1. Agent discovery
2. Direct communication
3. Task delegation
4. Capability broadcasting
5. Context sharing
6. Network statistics

## 🏗️ Architecture

```
agent_mesh/
├── core/
│   └── agent.py      # Agent, Capability, Message classes
├── registry/
│   └── registry.py   # AgentRegistry for discovery
├── protocols/        # (Future) Communication protocols
├── examples/
│   ├── specialized_agents.py  # Example agents
│   └── demo.py                # Interactive demo
└── README.md
```

## 🔮 Future Vision

AgentMesh is the foundation for:

1. **Federated Agent Networks** - Multiple registries syncing across organizations
2. **Agent Marketplaces** - Publish and discover agent capabilities
3. **Protocol Standards** - Compatible with MCP, A2A, and future protocols
4. **Autonomous Swarms** - Self-organizing agent collectives

## 🤝 Philosophy

> "The best orchestration is no orchestration"

Instead of building smarter orchestrators, we should build smarter agents that can coordinate themselves. AgentMesh provides the infrastructure for emergent collaboration.

## 📊 Why This Matters

Based on industry research:
- Gartner: 1,445% surge in multi-agent system inquiries (Q1 2024 - Q2 2025)
- Market growth: $7.8B → $52B by 2030 (46% CAGR)
- 40% of enterprise apps will embed agents by end of 2026

The future is multi-agent. AgentMesh helps you build it.

---

Built with ❤️ for the agentic AI future.
