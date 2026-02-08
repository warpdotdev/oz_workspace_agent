#!/usr/bin/env python3
"""
AgentMesh - Core Agent Module

The fundamental building block of AgentMesh. Each agent has:
- Identity (unique ID, name, description)
- Capabilities (what tasks it can handle)
- Communication (receive and send messages)
- Delegation (request help from other agents)
"""

import uuid
import json
from dataclasses import dataclass, field
from typing import Any, Callable, Optional
from datetime import datetime
from enum import Enum


class MessageType(Enum):
    """Types of messages agents can exchange."""
    TASK_REQUEST = "task_request"
    TASK_RESPONSE = "task_response"
    CAPABILITY_QUERY = "capability_query"
    CAPABILITY_RESPONSE = "capability_response"
    HEARTBEAT = "heartbeat"
    CONTEXT_SHARE = "context_share"


@dataclass
class Capability:
    """A skill or capability that an agent possesses."""
    name: str
    description: str
    input_schema: dict = field(default_factory=dict)
    output_schema: dict = field(default_factory=dict)
    confidence: float = 1.0  # How confident the agent is in this capability
    
    def matches(self, query: str) -> float:
        """Return a score (0-1) for how well this capability matches a query."""
        query_lower = query.lower()
        name_match = self.name.lower() in query_lower or query_lower in self.name.lower()
        desc_match = any(word in self.description.lower() for word in query_lower.split())
        
        if name_match:
            return 0.9 * self.confidence
        elif desc_match:
            return 0.6 * self.confidence
        return 0.0


@dataclass
class Message:
    """A message exchanged between agents."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    type: MessageType = MessageType.TASK_REQUEST
    sender_id: str = ""
    recipient_id: str = ""
    payload: dict = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    in_reply_to: Optional[str] = None
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "type": self.type.value,
            "sender_id": self.sender_id,
            "recipient_id": self.recipient_id,
            "payload": self.payload,
            "timestamp": self.timestamp,
            "in_reply_to": self.in_reply_to
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Message":
        return cls(
            id=data.get("id", str(uuid.uuid4())),
            type=MessageType(data.get("type", "task_request")),
            sender_id=data.get("sender_id", ""),
            recipient_id=data.get("recipient_id", ""),
            payload=data.get("payload", {}),
            timestamp=data.get("timestamp", datetime.utcnow().isoformat()),
            in_reply_to=data.get("in_reply_to")
        )


class Agent:
    """
    Base class for all agents in the AgentMesh network.
    
    Agents can:
    - Register capabilities they can perform
    - Receive and process messages from other agents
    - Discover and delegate tasks to other agents
    - Share context with collaborators
    """
    
    def __init__(
        self,
        name: str,
        description: str,
        agent_id: Optional[str] = None
    ):
        self.id = agent_id or str(uuid.uuid4())
        self.name = name
        self.description = description
        self.capabilities: list[Capability] = []
        self.message_handlers: dict[MessageType, Callable] = {}
        self.context: dict[str, Any] = {}  # Shared context
        self.registry = None  # Will be set when registered
        self._inbox: list[Message] = []
        
        # Set up default message handlers
        self._setup_default_handlers()
    
    def _setup_default_handlers(self):
        """Set up default handlers for standard message types."""
        self.message_handlers[MessageType.CAPABILITY_QUERY] = self._handle_capability_query
        self.message_handlers[MessageType.HEARTBEAT] = self._handle_heartbeat
        self.message_handlers[MessageType.CONTEXT_SHARE] = self._handle_context_share
    
    def add_capability(self, capability: Capability) -> "Agent":
        """Add a capability to this agent. Returns self for chaining."""
        self.capabilities.append(capability)
        return self
    
    def register_handler(self, message_type: MessageType, handler: Callable) -> "Agent":
        """Register a custom message handler. Returns self for chaining."""
        self.message_handlers[message_type] = handler
        return self
    
    def receive_message(self, message: Message) -> Optional[Message]:
        """
        Process an incoming message and optionally return a response.
        """
        self._inbox.append(message)
        
        handler = self.message_handlers.get(message.type)
        if handler:
            return handler(message)
        
        # Default: try to handle as a task request
        if message.type == MessageType.TASK_REQUEST:
            return self._handle_task_request(message)
        
        return None
    
    def send_message(self, recipient_id: str, message_type: MessageType, payload: dict) -> Message:
        """
        Create and send a message to another agent.
        """
        message = Message(
            type=message_type,
            sender_id=self.id,
            recipient_id=recipient_id,
            payload=payload
        )
        
        if self.registry:
            return self.registry.route_message(message)
        
        return message
    
    def request_task(self, capability_query: str, task_data: dict) -> Optional[Message]:
        """
        Find an agent that can handle a task and request it.
        This is the key collaboration method!
        """
        if not self.registry:
            return None
        
        # Find agents that can handle this capability
        candidates = self.registry.find_agents_by_capability(capability_query)
        
        # Filter out self
        candidates = [(agent, score) for agent, score in candidates if agent.id != self.id]
        
        if not candidates:
            return None
        
        # Pick the best candidate (highest score)
        best_agent, score = candidates[0]
        
        # Send task request
        return self.send_message(
            best_agent.id,
            MessageType.TASK_REQUEST,
            {
                "capability_query": capability_query,
                "task_data": task_data,
                "requester_context": self.context
            }
        )
    
    def share_context(self, recipient_id: str, context_key: str, context_value: Any):
        """Share a piece of context with another agent."""
        self.send_message(
            recipient_id,
            MessageType.CONTEXT_SHARE,
            {"key": context_key, "value": context_value}
        )
    
    # Default message handlers
    
    def _handle_capability_query(self, message: Message) -> Message:
        """Respond to capability queries."""
        query = message.payload.get("query", "")
        matching = []
        
        for cap in self.capabilities:
            score = cap.matches(query)
            if score > 0:
                matching.append({
                    "capability": cap.name,
                    "description": cap.description,
                    "score": score
                })
        
        return Message(
            type=MessageType.CAPABILITY_RESPONSE,
            sender_id=self.id,
            recipient_id=message.sender_id,
            payload={"capabilities": matching},
            in_reply_to=message.id
        )
    
    def _handle_heartbeat(self, message: Message) -> Message:
        """Respond to heartbeat/ping messages."""
        return Message(
            type=MessageType.HEARTBEAT,
            sender_id=self.id,
            recipient_id=message.sender_id,
            payload={"status": "alive", "capabilities_count": len(self.capabilities)},
            in_reply_to=message.id
        )
    
    def _handle_context_share(self, message: Message) -> None:
        """Handle shared context from another agent."""
        key = message.payload.get("key")
        value = message.payload.get("value")
        if key:
            self.context[f"shared.{message.sender_id}.{key}"] = value
    
    def _handle_task_request(self, message: Message) -> Message:
        """
        Default task request handler - override in subclasses.
        """
        return Message(
            type=MessageType.TASK_RESPONSE,
            sender_id=self.id,
            recipient_id=message.sender_id,
            payload={
                "success": False,
                "error": "No task handler implemented"
            },
            in_reply_to=message.id
        )
    
    def to_dict(self) -> dict:
        """Serialize agent to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "capabilities": [
                {
                    "name": cap.name,
                    "description": cap.description,
                    "confidence": cap.confidence
                }
                for cap in self.capabilities
            ]
        }
    
    def __repr__(self):
        return f"Agent({self.name}, capabilities={[c.name for c in self.capabilities]})"
