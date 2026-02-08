#!/usr/bin/env python3
"""
AgentMesh Demo - Watch Agents Collaborate!

This demo shows how multiple specialized agents can discover each other
and work together to accomplish tasks - without a centralized orchestrator.
"""

import sys
import json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.agent import Agent, Capability, Message, MessageType
from registry.registry import AgentRegistry
from examples.specialized_agents import (
    ResearchAgent,
    CodeAgent, 
    WritingAgent,
    OrchestratorAgent,
    DataAnalystAgent
)


def print_header(title: str):
    """Print a formatted header."""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def print_agents(registry: AgentRegistry):
    """Print all registered agents and their capabilities."""
    print("\n📋 Registered Agents:")
    for agent in registry.agents.values():
        print(f"  🤖 {agent.name}")
        for cap in agent.capabilities:
            print(f"      - {cap.name}: {cap.description}")


def print_message(msg: Message, prefix: str = ""):
    """Pretty print a message."""
    print(f"{prefix}📨 Message [{msg.type.value}]")
    print(f"{prefix}   From: {msg.sender_id[:8]}...")
    print(f"{prefix}   To: {msg.recipient_id[:8]}...")
    if msg.payload:
        payload_str = json.dumps(msg.payload, indent=2)
        # Indent payload
        for line in payload_str.split('\n'):
            print(f"{prefix}   {line}")


def demo_basic_discovery():
    """Demonstrate basic agent discovery."""
    print_header("Demo 1: Agent Discovery")
    
    # Create a registry
    registry = AgentRegistry("demo-mesh")
    
    # Create and register agents
    research_agent = ResearchAgent()
    code_agent = CodeAgent()
    writing_agent = WritingAgent()
    data_agent = DataAnalystAgent()
    
    registry.register(research_agent)
    registry.register(code_agent)
    registry.register(writing_agent)
    registry.register(data_agent)
    
    print_agents(registry)
    
    # Demonstrate capability search
    print("\n🔍 Searching for agents that can 'write code'...")
    results = registry.find_agents_by_capability("write code")
    for agent, score in results:
        print(f"   Found: {agent.name} (score: {score:.2f})")
    
    print("\n🔍 Searching for agents that can 'analyze data'...")
    results = registry.find_agents_by_capability("analyze data")
    for agent, score in results:
        print(f"   Found: {agent.name} (score: {score:.2f})")
    
    print("\n🔍 Searching for agents that can 'research'...")
    results = registry.find_agents_by_capability("research")
    for agent, score in results:
        print(f"   Found: {agent.name} (score: {score:.2f})")
    
    return registry


def demo_direct_communication(registry: AgentRegistry):
    """Demonstrate direct agent-to-agent communication."""
    print_header("Demo 2: Direct Agent Communication")
    
    # Get two agents
    agents = list(registry.agents.values())
    sender = agents[0]
    
    # Find an agent that can help with research
    candidates = registry.find_agents_by_capability("research")
    if candidates:
        receiver, _ = candidates[0]
        
        print(f"\n📤 {sender.name} is sending a task request to {receiver.name}...")
        
        # Send a task request
        response = sender.send_message(
            receiver.id,
            MessageType.TASK_REQUEST,
            {
                "task_data": {
                    "topic": "AI agents and multi-agent systems"
                }
            }
        )
        
        if response:
            print(f"\n📥 {receiver.name} responded:")
            result = response.payload.get("result", {})
            print(f"   Topic: {result.get('topic')}")
            print(f"   Findings: {result.get('findings')}")
            print(f"   Confidence: {result.get('confidence')}")


def demo_task_delegation(registry: AgentRegistry):
    """Demonstrate task delegation between agents."""
    print_header("Demo 3: Task Delegation")
    
    # Create an orchestrator and add to registry
    orchestrator = OrchestratorAgent()
    registry.register(orchestrator)
    
    print(f"\n🎯 {orchestrator.name} received a complex task:")
    print('   "Write a blog article about AI trends"')
    
    # The orchestrator will:
    # 1. Break down the task
    # 2. Find agents that can help
    # 3. Delegate subtasks
    # 4. Combine results
    
    msg = Message(
        type=MessageType.TASK_REQUEST,
        sender_id="user",
        recipient_id=orchestrator.id,
        payload={
            "task_data": {
                "task": "Write a blog article about AI trends"
            }
        }
    )
    
    response = orchestrator.receive_message(msg)
    
    if response:
        print(f"\n✅ Task completed!")
        print(f"   Subtasks completed: {response.payload.get('subtasks_completed')}")
        print("\n   Results:")
        for result in response.payload.get("results", []):
            print(f"   - {result['subtask']}: ✓")


def demo_capability_broadcast():
    """Demonstrate broadcasting capability queries."""
    print_header("Demo 4: Capability Broadcast")
    
    registry = AgentRegistry("broadcast-demo")
    
    # Register various agents
    registry.register(ResearchAgent())
    registry.register(CodeAgent())
    registry.register(WritingAgent())
    registry.register(DataAnalystAgent())
    
    print("\n📡 Broadcasting query: 'Who can help with content creation?'")
    results = registry.broadcast_capability_query("content writing documentation")
    
    print("\n📋 Responses:")
    for agent_id, info in results.items():
        print(f"\n   🤖 {info['agent_name']} can help:")
        for cap in info['capabilities']:
            print(f"      - {cap['capability']} (score: {cap['score']:.2f})")


def demo_context_sharing():
    """Demonstrate context sharing between agents."""
    print_header("Demo 5: Context Sharing")
    
    registry = AgentRegistry("context-demo")
    
    research_agent = ResearchAgent()
    writing_agent = WritingAgent()
    
    registry.register(research_agent)
    registry.register(writing_agent)
    
    # Research agent discovers something
    research_agent.context["discovered_trend"] = "Multi-agent systems are the future"
    
    print(f"\n🔬 {research_agent.name} discovered: '{research_agent.context['discovered_trend']}'")
    print(f"📤 Sharing context with {writing_agent.name}...")
    
    # Share context
    research_agent.share_context(
        writing_agent.id,
        "discovered_trend",
        research_agent.context["discovered_trend"]
    )
    
    # Check if writing agent received it
    shared_key = f"shared.{research_agent.id}.discovered_trend"
    if shared_key in writing_agent.context:
        print(f"✅ {writing_agent.name} received the context!")
        print(f"   Context: {writing_agent.context[shared_key]}")


def demo_registry_stats():
    """Show registry statistics."""
    print_header("Demo 6: Registry Statistics")
    
    registry = AgentRegistry("stats-demo")
    
    registry.register(ResearchAgent())
    registry.register(CodeAgent())
    registry.register(WritingAgent())
    registry.register(DataAnalystAgent())
    registry.register(OrchestratorAgent())
    
    stats = registry.get_stats()
    
    print(f"\n📊 Registry: {stats['name']}")
    print(f"   Agents: {stats['agent_count']}")
    print(f"   Unique capabilities: {stats['capability_count']}")
    print(f"   Messages routed: {stats['message_count']}")
    
    print("\n📋 All Capabilities in Network:")
    for cap in registry.get_all_capabilities():
        print(f"   - {cap['name']}: provided by {cap['agents']}")


def main():
    """Run all demos."""
    print("\n" + "🌐 " * 20)
    print("\n       Welcome to AgentMesh Demo!")
    print("       A Social Network for AI Agents")
    print("\n" + "🌐 " * 20)
    
    # Run demos
    registry = demo_basic_discovery()
    demo_direct_communication(registry)
    demo_task_delegation(registry)
    demo_capability_broadcast()
    demo_context_sharing()
    demo_registry_stats()
    
    print_header("Demo Complete!")
    print("""
    🎉 You've seen how AgentMesh enables:
    
    1. ✅ Agent Discovery - Find the right agent for any task
    2. ✅ Direct Communication - Agents talk peer-to-peer
    3. ✅ Task Delegation - Break down and distribute work
    4. ✅ Capability Broadcast - Query the whole network
    5. ✅ Context Sharing - Agents share knowledge
    6. ✅ Network Statistics - Monitor the mesh
    
    This is the foundation for building truly collaborative
    multi-agent systems without centralized orchestration!
    """)


if __name__ == "__main__":
    main()
