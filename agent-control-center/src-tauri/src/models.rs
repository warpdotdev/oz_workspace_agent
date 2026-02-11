//! Core data models for the Agent Control Center
//!
//! This module defines the data structures used throughout the application
//! for representing agents, tasks, events, and related entities.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Status of an AI agent
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AgentStatus {
    /// Agent is actively running a task
    Running,
    /// Agent is idle and ready for work
    Idle,
    /// Agent is paused by user
    Paused,
    /// Agent encountered an error
    Error,
}

impl Default for AgentStatus {
    fn default() -> Self {
        Self::Idle
    }
}

/// Priority level for tasks
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TaskPriority {
    Low,
    Medium,
    High,
    Critical,
}

impl Default for TaskPriority {
    fn default() -> Self {
        Self::Medium
    }
}

/// Status of a task
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
}

impl Default for TaskStatus {
    fn default() -> Self {
        Self::Pending
    }
}

/// Type of event in the activity log
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EventType {
    StatusChange,
    TaskStarted,
    TaskCompleted,
    TaskFailed,
    ThoughtLog,
    DecisionTrace,
    ApiCall,
    Error,
    Warning,
    Info,
}

/// An AI agent managed by the control center
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    /// Unique identifier for the agent
    pub id: Uuid,
    /// Human-readable name
    pub name: String,
    /// Optional description of the agent's purpose
    pub description: Option<String>,
    /// Current status of the agent
    pub status: AgentStatus,
    /// Framework the agent uses (e.g., "crewai", "langchain", "openai")
    pub framework: String,
    /// Model being used (e.g., "gpt-4", "claude-3")
    pub model: Option<String>,
    /// Configuration parameters for the agent
    pub config: AgentConfig,
    /// Timestamp when the agent was created
    pub created_at: DateTime<Utc>,
    /// Timestamp of the last activity
    pub last_activity: Option<DateTime<Utc>>,
    /// Current task ID if running
    pub current_task_id: Option<Uuid>,
    /// Statistics about the agent's performance
    pub stats: AgentStats,
}

impl Agent {
    pub fn new(name: String, framework: String) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            description: None,
            status: AgentStatus::Idle,
            framework,
            model: None,
            config: AgentConfig::default(),
            created_at: Utc::now(),
            last_activity: None,
            current_task_id: None,
            stats: AgentStats::default(),
        }
    }
}

/// Configuration parameters for an agent
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct AgentConfig {
    /// API endpoint for the agent
    pub endpoint: Option<String>,
    /// Timeout for agent operations in seconds
    pub timeout_seconds: Option<u32>,
    /// Maximum retries for failed operations
    pub max_retries: Option<u32>,
    /// Custom environment variables
    pub environment: std::collections::HashMap<String, String>,
    /// Human-in-the-loop approval required
    pub requires_approval: bool,
    /// Tags for organizing agents
    pub tags: Vec<String>,
}

/// Statistics about an agent's performance
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct AgentStats {
    /// Total number of tasks completed
    pub tasks_completed: u32,
    /// Total number of tasks failed
    pub tasks_failed: u32,
    /// Average task duration in milliseconds
    pub avg_task_duration_ms: Option<u64>,
    /// Total API calls made
    pub total_api_calls: u32,
    /// Estimated cost in cents
    pub estimated_cost_cents: u32,
}

/// A task that can be dispatched to an agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    /// Unique identifier for the task
    pub id: Uuid,
    /// ID of the agent assigned to this task
    pub agent_id: Uuid,
    /// Human-readable title
    pub title: String,
    /// Natural language instruction for the agent
    pub instruction: String,
    /// Current status of the task
    pub status: TaskStatus,
    /// Priority level
    pub priority: TaskPriority,
    /// Timestamp when the task was created
    pub created_at: DateTime<Utc>,
    /// Timestamp when the task started executing
    pub started_at: Option<DateTime<Utc>>,
    /// Timestamp when the task completed
    pub completed_at: Option<DateTime<Utc>>,
    /// Result or output from the task
    pub result: Option<String>,
    /// Error message if the task failed
    pub error: Option<String>,
}

impl Task {
    pub fn new(agent_id: Uuid, title: String, instruction: String) -> Self {
        Self {
            id: Uuid::new_v4(),
            agent_id,
            title,
            instruction,
            status: TaskStatus::Pending,
            priority: TaskPriority::default(),
            created_at: Utc::now(),
            started_at: None,
            completed_at: None,
            result: None,
            error: None,
        }
    }
}

/// An event in the activity log
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityEvent {
    /// Unique identifier for the event
    pub id: Uuid,
    /// ID of the agent that generated the event
    pub agent_id: Uuid,
    /// Optional task ID associated with this event
    pub task_id: Option<Uuid>,
    /// Type of event
    pub event_type: EventType,
    /// Short summary of the event
    pub summary: String,
    /// Detailed description or log content
    pub details: Option<String>,
    /// Timestamp when the event occurred
    pub timestamp: DateTime<Utc>,
}

impl ActivityEvent {
    pub fn new(agent_id: Uuid, event_type: EventType, summary: String) -> Self {
        Self {
            id: Uuid::new_v4(),
            agent_id,
            task_id: None,
            event_type,
            summary,
            details: None,
            timestamp: Utc::now(),
        }
    }

    pub fn with_task(mut self, task_id: Uuid) -> Self {
        self.task_id = Some(task_id);
        self
    }

    pub fn with_details(mut self, details: String) -> Self {
        self.details = Some(details);
        self
    }
}

/// Request to create a new agent
#[derive(Debug, Clone, Deserialize)]
pub struct CreateAgentRequest {
    pub name: String,
    pub framework: String,
    pub description: Option<String>,
    pub model: Option<String>,
    pub config: Option<AgentConfig>,
}

/// Request to update an agent
#[derive(Debug, Clone, Deserialize)]
pub struct UpdateAgentRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub model: Option<String>,
    pub config: Option<AgentConfig>,
}

/// Request to dispatch a task
#[derive(Debug, Clone, Deserialize)]
pub struct DispatchTaskRequest {
    pub agent_id: Uuid,
    pub title: String,
    pub instruction: String,
    pub priority: Option<TaskPriority>,
}

/// Response from a task dispatch
#[derive(Debug, Clone, Serialize)]
pub struct DispatchTaskResponse {
    pub task: Task,
    pub message: String,
}
