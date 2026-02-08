#!/usr/bin/env python3
"""
AgentMesh - Example Specialized Agents

This module demonstrates how to create specialized agents that can
collaborate through the AgentMesh network. Each agent has specific
capabilities and can delegate tasks to others.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.agent import Agent, Capability, Message, MessageType


class ResearchAgent(Agent):
    """
    An agent specialized in research and information gathering.
    """
    
    def __init__(self):
        super().__init__(
            name="ResearchBot",
            description="I gather and synthesize information from various sources"
        )
        
        self.add_capability(Capability(
            name="research",
            description="Research topics and gather information",
            confidence=0.95
        ))
        self.add_capability(Capability(
            name="summarize",
            description="Summarize long documents or information",
            confidence=0.85
        ))
        self.add_capability(Capability(
            name="fact_check",
            description="Verify facts and check information accuracy",
            confidence=0.80
        ))
        
        # Custom task handler
        self.register_handler(MessageType.TASK_REQUEST, self._handle_research_task)
    
    def _handle_research_task(self, message: Message) -> Message:
        task_data = message.payload.get("task_data", {})
        topic = task_data.get("topic", "unknown")
        
        # Simulate research (in real implementation, this would call APIs, scrape web, etc.)
        result = {
            "topic": topic,
            "findings": [
                f"Key insight 1 about {topic}",
                f"Key insight 2 about {topic}",
                f"Important trend regarding {topic}"
            ],
            "sources": ["research_db", "web_search", "knowledge_base"],
            "confidence": 0.85
        }
        
        return Message(
            type=MessageType.TASK_RESPONSE,
            sender_id=self.id,
            recipient_id=message.sender_id,
            payload={"success": True, "result": result},
            in_reply_to=message.id
        )


class CodeAgent(Agent):
    """
    An agent specialized in code generation and analysis.
    """
    
    def __init__(self):
        super().__init__(
            name="CodeBot",
            description="I write, analyze, and debug code"
        )
        
        self.add_capability(Capability(
            name="code_generation",
            description="Generate code in various programming languages",
            confidence=0.90
        ))
        self.add_capability(Capability(
            name="code_review",
            description="Review code for bugs, security issues, and best practices",
            confidence=0.88
        ))
        self.add_capability(Capability(
            name="debugging",
            description="Debug and fix code issues",
            confidence=0.85
        ))
        self.add_capability(Capability(
            name="refactoring",
            description="Improve code structure and readability",
            confidence=0.87
        ))
        
        self.register_handler(MessageType.TASK_REQUEST, self._handle_code_task)
    
    def _handle_code_task(self, message: Message) -> Message:
        task_data = message.payload.get("task_data", {})
        task_type = task_data.get("type", "generate")
        language = task_data.get("language", "python")
        description = task_data.get("description", "")
        
        # Simulate code generation/analysis
        if task_type == "generate":
            result = {
                "code": f"# Generated {language} code for: {description}\ndef solution():\n    pass",
                "language": language,
                "explanation": f"This code addresses: {description}"
            }
        elif task_type == "review":
            result = {
                "issues": [],
                "suggestions": ["Consider adding type hints", "Add error handling"],
                "score": 8.5
            }
        else:
            result = {"message": f"Handled {task_type} request"}
        
        return Message(
            type=MessageType.TASK_RESPONSE,
            sender_id=self.id,
            recipient_id=message.sender_id,
            payload={"success": True, "result": result},
            in_reply_to=message.id
        )


class WritingAgent(Agent):
    """
    An agent specialized in content creation and writing.
    """
    
    def __init__(self):
        super().__init__(
            name="WriterBot",
            description="I create written content, documentation, and communications"
        )
        
        self.add_capability(Capability(
            name="writing",
            description="Write articles, blog posts, and general content",
            confidence=0.92
        ))
        self.add_capability(Capability(
            name="documentation",
            description="Create technical documentation and guides",
            confidence=0.88
        ))
        self.add_capability(Capability(
            name="editing",
            description="Edit and improve existing written content",
            confidence=0.90
        ))
        self.add_capability(Capability(
            name="translation",
            description="Translate content between languages",
            confidence=0.75
        ))
        
        self.register_handler(MessageType.TASK_REQUEST, self._handle_writing_task)
    
    def _handle_writing_task(self, message: Message) -> Message:
        task_data = message.payload.get("task_data", {})
        content_type = task_data.get("type", "article")
        topic = task_data.get("topic", "")
        tone = task_data.get("tone", "professional")
        
        result = {
            "content": f"# {topic}\n\nThis is a {tone} {content_type} about {topic}...",
            "word_count": 250,
            "reading_time": "2 min"
        }
        
        return Message(
            type=MessageType.TASK_RESPONSE,
            sender_id=self.id,
            recipient_id=message.sender_id,
            payload={"success": True, "result": result},
            in_reply_to=message.id
        )


class OrchestratorAgent(Agent):
    """
    A coordinator agent that can break down complex tasks and delegate
    to specialized agents. Unlike traditional orchestrators, this one
    is just another peer in the network!
    """
    
    def __init__(self):
        super().__init__(
            name="Orchestrator",
            description="I coordinate complex multi-step tasks by delegating to specialists"
        )
        
        self.add_capability(Capability(
            name="task_planning",
            description="Break down complex tasks into subtasks",
            confidence=0.90
        ))
        self.add_capability(Capability(
            name="coordination",
            description="Coordinate multiple agents working on a task",
            confidence=0.88
        ))
        
        self.register_handler(MessageType.TASK_REQUEST, self._handle_orchestration)
    
    def _handle_orchestration(self, message: Message) -> Message:
        task_data = message.payload.get("task_data", {})
        complex_task = task_data.get("task", "")
        
        # Break down the task
        subtasks = self._plan_subtasks(complex_task)
        
        # Execute subtasks by delegating to other agents
        results = []
        for subtask in subtasks:
            response = self.request_task(
                subtask["capability_needed"],
                subtask["task_data"]
            )
            if response:
                results.append({
                    "subtask": subtask["name"],
                    "result": response.payload
                })
        
        return Message(
            type=MessageType.TASK_RESPONSE,
            sender_id=self.id,
            recipient_id=message.sender_id,
            payload={
                "success": True,
                "task": complex_task,
                "subtasks_completed": len(results),
                "results": results
            },
            in_reply_to=message.id
        )
    
    def _plan_subtasks(self, task: str) -> list[dict]:
        """Simple task planning - in reality, this would use LLM reasoning."""
        # This is a simplified example
        if "blog" in task.lower() or "article" in task.lower():
            return [
                {
                    "name": "research",
                    "capability_needed": "research",
                    "task_data": {"topic": task}
                },
                {
                    "name": "write",
                    "capability_needed": "writing",
                    "task_data": {"type": "article", "topic": task}
                }
            ]
        elif "code" in task.lower() or "build" in task.lower():
            return [
                {
                    "name": "generate_code",
                    "capability_needed": "code_generation",
                    "task_data": {"type": "generate", "description": task}
                },
                {
                    "name": "document",
                    "capability_needed": "documentation",
                    "task_data": {"type": "documentation", "topic": task}
                }
            ]
        else:
            return [
                {
                    "name": "research",
                    "capability_needed": "research",
                    "task_data": {"topic": task}
                }
            ]


class DataAnalystAgent(Agent):
    """
    An agent specialized in data analysis and visualization.
    """
    
    def __init__(self):
        super().__init__(
            name="DataBot",
            description="I analyze data and create insights"
        )
        
        self.add_capability(Capability(
            name="data_analysis",
            description="Analyze datasets and extract insights",
            confidence=0.92
        ))
        self.add_capability(Capability(
            name="visualization",
            description="Create charts and visual representations of data",
            confidence=0.85
        ))
        self.add_capability(Capability(
            name="statistical_analysis",
            description="Perform statistical tests and analysis",
            confidence=0.88
        ))
        
        self.register_handler(MessageType.TASK_REQUEST, self._handle_data_task)
    
    def _handle_data_task(self, message: Message) -> Message:
        task_data = message.payload.get("task_data", {})
        analysis_type = task_data.get("type", "general")
        
        result = {
            "analysis_type": analysis_type,
            "insights": [
                "Key finding 1",
                "Key finding 2",
                "Recommendation based on data"
            ],
            "confidence": 0.87
        }
        
        return Message(
            type=MessageType.TASK_RESPONSE,
            sender_id=self.id,
            recipient_id=message.sender_id,
            payload={"success": True, "result": result},
            in_reply_to=message.id
        )
