use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

/// Agent status enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AgentStatus {
    Running,
    Idle,
    Error,
    Paused,
}

impl ToString for AgentStatus {
    fn to_string(&self) -> String {
        match self {
            AgentStatus::Running => "running".to_string(),
            AgentStatus::Idle => "idle".to_string(),
            AgentStatus::Error => "error".to_string(),
            AgentStatus::Paused => "paused".to_string(),
        }
    }
}

impl From<String> for AgentStatus {
    fn from(s: String) -> Self {
        match s.as_str() {
            "running" => AgentStatus::Running,
            "idle" => AgentStatus::Idle,
            "error" => AgentStatus::Error,
            "paused" => AgentStatus::Paused,
            _ => AgentStatus::Idle,
        }
    }
}

/// Agent framework type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AgentFramework {
    CrewAI,
    LangChain,
    OpenAI,
    Custom,
}

impl ToString for AgentFramework {
    fn to_string(&self) -> String {
        match self {
            AgentFramework::CrewAI => "crewai".to_string(),
            AgentFramework::LangChain => "langchain".to_string(),
            AgentFramework::OpenAI => "openai".to_string(),
            AgentFramework::Custom => "custom".to_string(),
        }
    }
}

impl From<String> for AgentFramework {
    fn from(s: String) -> Self {
        match s.as_str() {
            "crewai" => AgentFramework::CrewAI,
            "langchain" => AgentFramework::LangChain,
            "openai" => AgentFramework::OpenAI,
            _ => AgentFramework::Custom,
        }
    }
}

/// Agent configuration stored in database
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentConfig {
    pub id: String,
    pub name: String,
    pub description: String,
    pub framework: AgentFramework,
    pub model: String,
    pub max_tokens: i32,
    pub temperature: f64,
    pub system_prompt: Option<String>,
    pub tools: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl AgentConfig {
    pub fn new(name: String, description: String, framework: AgentFramework) -> Self {
        let now = Utc::now().to_rfc3339();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            description,
            framework,
            model: "gpt-4".to_string(),
            max_tokens: 4096,
            temperature: 0.7,
            system_prompt: None,
            tools: vec![],
            created_at: now.clone(),
            updated_at: now,
        }
    }
}

/// Full agent state including runtime info
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Agent {
    pub id: String,
    pub config: AgentConfig,
    pub status: AgentStatus,
    pub current_task: Option<String>,
    pub runtime: i64,
    pub tokens_used: i64,
    pub last_activity: String,
    pub error_message: Option<String>,
}

impl Agent {
    pub fn from_config(config: AgentConfig) -> Self {
        Self {
            id: config.id.clone(),
            config,
            status: AgentStatus::Idle,
            current_task: None,
            runtime: 0,
            tokens_used: 0,
            last_activity: Utc::now().to_rfc3339(),
            error_message: None,
        }
    }
}

/// Task dispatched to an agent
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub agent_id: String,
    pub instruction: String,
    pub status: TaskStatus,
    pub result: Option<String>,
    pub error: Option<String>,
    pub created_at: String,
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    Pending,
    Running,
    Completed,
    Failed,
}

impl ToString for TaskStatus {
    fn to_string(&self) -> String {
        match self {
            TaskStatus::Pending => "pending".to_string(),
            TaskStatus::Running => "running".to_string(),
            TaskStatus::Completed => "completed".to_string(),
            TaskStatus::Failed => "failed".to_string(),
        }
    }
}

impl From<String> for TaskStatus {
    fn from(s: String) -> Self {
        match s.as_str() {
            "pending" => TaskStatus::Pending,
            "running" => TaskStatus::Running,
            "completed" => TaskStatus::Completed,
            "failed" => TaskStatus::Failed,
            _ => TaskStatus::Pending,
        }
    }
}

impl Task {
    pub fn new(agent_id: String, instruction: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            agent_id,
            instruction,
            status: TaskStatus::Pending,
            result: None,
            error: None,
            created_at: Utc::now().to_rfc3339(),
            completed_at: None,
        }
    }
}

/// Event types for activity feed
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum EventType {
    StatusChange,
    Thought,
    Action,
    Error,
    TaskComplete,
}

impl ToString for EventType {
    fn to_string(&self) -> String {
        match self {
            EventType::StatusChange => "status_change".to_string(),
            EventType::Thought => "thought".to_string(),
            EventType::Action => "action".to_string(),
            EventType::Error => "error".to_string(),
            EventType::TaskComplete => "task_complete".to_string(),
        }
    }
}

/// Agent event for activity feed
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentEvent {
    pub id: String,
    pub agent_id: String,
    pub agent_name: String,
    pub event_type: EventType,
    pub message: String,
    pub timestamp: String,
    pub metadata: Option<serde_json::Value>,
}

impl AgentEvent {
    pub fn new(agent_id: String, agent_name: String, event_type: EventType, message: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            agent_id,
            agent_name,
            event_type,
            message,
            timestamp: Utc::now().to_rfc3339(),
            metadata: None,
        }
    }
}

/// Request types for IPC commands
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAgentRequest {
    pub name: String,
    pub description: String,
    pub framework: AgentFramework,
    pub model: Option<String>,
    pub max_tokens: Option<i32>,
    pub temperature: Option<f64>,
    pub system_prompt: Option<String>,
    pub tools: Option<Vec<String>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAgentRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub model: Option<String>,
    pub max_tokens: Option<i32>,
    pub temperature: Option<f64>,
    pub system_prompt: Option<String>,
    pub tools: Option<Vec<String>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DispatchTaskRequest {
    pub agent_id: String,
    pub instruction: String,
}
