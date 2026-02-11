use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AgentStatus {
    Running,
    Error,
    Idle,
    Paused,
    Pending,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ActivityType {
    Thought,
    Action,
    Observation,
    StatusChange,
    Error,
    TaskComplete,
    UserInput,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    pub model: String,
    pub max_tokens: u32,
    pub temperature: f32,
    pub system_prompt: String,
    pub tools: Vec<String>,
}

impl Default for AgentConfig {
    fn default() -> Self {
        Self {
            model: "gpt-4-turbo".to_string(),
            max_tokens: 4096,
            temperature: 0.7,
            system_prompt: "You are a helpful AI assistant.".to_string(),
            tools: vec![
                "web_search".to_string(),
                "code_execution".to_string(),
                "file_access".to_string(),
            ],
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub status: AgentStatus,
    pub current_task: Option<String>,
    pub framework: String,
    pub started_at: Option<DateTime<Utc>>,
    pub tokens_used: u64,
    pub estimated_cost: f64,
    pub last_heartbeat: DateTime<Utc>,
    pub config: AgentConfig,
}

impl Agent {
    pub fn new(name: String, framework: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            status: AgentStatus::Idle,
            current_task: None,
            framework,
            started_at: None,
            tokens_used: 0,
            estimated_cost: 0.0,
            last_heartbeat: Utc::now(),
            config: AgentConfig::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Activity {
    pub id: String,
    pub agent_id: String,
    pub agent_name: String,
    #[serde(rename = "type")]
    pub activity_type: ActivityType,
    pub content: String,
    pub timestamp: DateTime<Utc>,
    pub metadata: Option<serde_json::Value>,
}

impl Activity {
    pub fn new(
        agent_id: String,
        agent_name: String,
        activity_type: ActivityType,
        content: String,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            agent_id,
            agent_name,
            activity_type,
            content,
            timestamp: Utc::now(),
            metadata: None,
        }
    }

    pub fn thought(agent_id: String, agent_name: String, content: String) -> Self {
        Self::new(agent_id, agent_name, ActivityType::Thought, content)
    }

    pub fn action(agent_id: String, agent_name: String, content: String) -> Self {
        Self::new(agent_id, agent_name, ActivityType::Action, content)
    }

    pub fn observation(agent_id: String, agent_name: String, content: String) -> Self {
        Self::new(agent_id, agent_name, ActivityType::Observation, content)
    }

    pub fn status_change(agent_id: String, agent_name: String, content: String) -> Self {
        Self::new(agent_id, agent_name, ActivityType::StatusChange, content)
    }

    pub fn error(agent_id: String, agent_name: String, content: String) -> Self {
        Self::new(agent_id, agent_name, ActivityType::Error, content)
    }

    pub fn task_complete(agent_id: String, agent_name: String, content: String) -> Self {
        Self::new(agent_id, agent_name, ActivityType::TaskComplete, content)
    }

    pub fn user_input(agent_id: String, agent_name: String, content: String) -> Self {
        Self::new(agent_id, agent_name, ActivityType::UserInput, content)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub agent_id: String,
    pub instruction: String,
    pub status: TaskStatus,
    pub result: Option<String>,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    Pending,
    Running,
    Completed,
    Failed,
}

impl Task {
    pub fn new(agent_id: String, instruction: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            agent_id,
            instruction,
            status: TaskStatus::Pending,
            result: None,
            created_at: Utc::now(),
            completed_at: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMetrics {
    pub agent_id: String,
    pub timestamp: DateTime<Utc>,
    pub tokens_per_minute: u32,
    pub tasks_completed: u32,
    pub error_rate: f32,
    pub average_response_time: f64,
}
