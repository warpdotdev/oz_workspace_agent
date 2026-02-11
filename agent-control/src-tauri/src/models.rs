use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AgentStatus {
    Running,
    Idle,
    Error,
    Paused,
}

impl AgentStatus {
    pub fn as_str(&self) -> &str {
        match self {
            AgentStatus::Running => "running",
            AgentStatus::Idle => "idle",
            AgentStatus::Error => "error",
            AgentStatus::Paused => "paused",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "running" => Some(AgentStatus::Running),
            "idle" => Some(AgentStatus::Idle),
            "error" => Some(AgentStatus::Error),
            "paused" => Some(AgentStatus::Paused),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub status: AgentStatus,
    pub current_task: Option<String>,
    pub runtime_seconds: i64,
    pub tokens_used: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ActivityType {
    Thought,
    Status,
    Error,
    Task,
}

impl ActivityType {
    pub fn as_str(&self) -> &str {
        match self {
            ActivityType::Thought => "thought",
            ActivityType::Status => "status",
            ActivityType::Error => "error",
            ActivityType::Task => "task",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "thought" => Some(ActivityType::Thought),
            "status" => Some(ActivityType::Status),
            "error" => Some(ActivityType::Error),
            "task" => Some(ActivityType::Task),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Activity {
    pub id: String,
    pub agent_id: String,
    pub activity_type: ActivityType,
    pub message: String,
    pub details: Option<String>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub agent_id: String,
    pub description: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DispatchTaskRequest {
    pub agent_id: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateAgentStatusRequest {
    pub agent_id: String,
    pub status: AgentStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentStats {
    pub total_agents: i32,
    pub running: i32,
    pub idle: i32,
    pub error: i32,
}
