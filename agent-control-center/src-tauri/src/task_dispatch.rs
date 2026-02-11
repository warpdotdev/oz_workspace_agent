//! Task dispatch module for handling agent task instructions
//!
//! This module simulates dispatching tasks to agents and generating
//! mock responses for the v0 demo. In production, this would integrate
//! with actual agent frameworks (CrewAI, LangChain, OpenAI Agents SDK).

use crate::models::{
    ActivityEvent, Agent, AgentStatus, DispatchTaskRequest, DispatchTaskResponse, EventType,
    Task, TaskPriority, TaskStatus,
};
use crate::storage::Storage;
use chrono::Utc;
use thiserror::Error;
use tokio::sync::broadcast;
use tracing::{error, info, warn};
use uuid::Uuid;

/// Errors that can occur during task dispatch
#[derive(Error, Debug)]
pub enum DispatchError {
    #[error("Storage error: {0}")]
    Storage(#[from] crate::storage::StorageError),
    #[error("Agent not available: {0}")]
    AgentNotAvailable(String),
    #[error("Invalid task: {0}")]
    InvalidTask(String),
    #[error("Task execution failed: {0}")]
    ExecutionFailed(String),
}

/// Result type for dispatch operations
pub type DispatchResult<T> = Result<T, DispatchError>;

/// Event emitted during task execution
#[derive(Debug, Clone)]
pub enum TaskEvent {
    Started { task_id: Uuid, agent_id: Uuid },
    Progress { task_id: Uuid, message: String, progress_pct: u8 },
    ThoughtLog { task_id: Uuid, thought: String },
    ApiCall { task_id: Uuid, endpoint: String, duration_ms: u64 },
    Completed { task_id: Uuid, result: String },
    Failed { task_id: Uuid, error: String },
}

/// Task dispatcher service
pub struct TaskDispatcher {
    storage: Storage,
    event_sender: broadcast::Sender<TaskEvent>,
}

impl TaskDispatcher {
    /// Create a new task dispatcher
    pub fn new(storage: Storage) -> Self {
        let (event_sender, _) = broadcast::channel(100);
        Self {
            storage,
            event_sender,
        }
    }

    /// Subscribe to task events
    pub fn subscribe(&self) -> broadcast::Receiver<TaskEvent> {
        self.event_sender.subscribe()
    }

    /// Dispatch a task to an agent
    pub async fn dispatch(&self, request: DispatchTaskRequest) -> DispatchResult<DispatchTaskResponse> {
        // Validate agent exists and is available
        let mut agent = self.storage.get_agent(request.agent_id).await?;
        
        if agent.status == AgentStatus::Running {
            return Err(DispatchError::AgentNotAvailable(
                "Agent is already running a task".to_string(),
            ));
        }
        
        if agent.status == AgentStatus::Error {
            warn!("Dispatching to agent in error state: {}", agent.id);
        }
        
        // Validate task
        if request.instruction.trim().is_empty() {
            return Err(DispatchError::InvalidTask(
                "Task instruction cannot be empty".to_string(),
            ));
        }
        
        // Create the task
        let mut task = Task::new(
            request.agent_id,
            request.title.clone(),
            request.instruction.clone(),
        );
        task.priority = request.priority.unwrap_or(TaskPriority::Medium);
        
        // Save the task
        let task = self.storage.create_task(task).await?;
        
        // Update agent status
        agent.status = AgentStatus::Running;
        agent.current_task_id = Some(task.id);
        agent.last_activity = Some(Utc::now());
        self.storage.update_agent(agent.clone()).await?;
        
        // Log the task start event
        let event = ActivityEvent::new(
            request.agent_id,
            EventType::TaskStarted,
            format!("Task started: {}", request.title),
        )
        .with_task(task.id)
        .with_details(request.instruction.clone());
        self.storage.add_event(event).await?;
        
        // Emit task started event
        let _ = self.event_sender.send(TaskEvent::Started {
            task_id: task.id,
            agent_id: request.agent_id,
        });
        
        info!("Dispatched task {} to agent {}", task.id, request.agent_id);
        
        Ok(DispatchTaskResponse {
            task,
            message: "Task dispatched successfully".to_string(),
        })
    }

    /// Simulate task execution (for v0 demo)
    /// In production, this would communicate with actual agent frameworks
    pub async fn simulate_execution(&self, task_id: Uuid) -> DispatchResult<Task> {
        let mut task = self.storage.get_task(task_id).await?;
        let agent_id = task.agent_id;
        
        // Start execution
        task.status = TaskStatus::Running;
        task.started_at = Some(Utc::now());
        self.storage.update_task(task.clone()).await?;
        
        // Simulate thinking process
        let thoughts = generate_mock_thoughts(&task.instruction);
        for (i, thought) in thoughts.iter().enumerate() {
            // Add thought log event
            let event = ActivityEvent::new(
                agent_id,
                EventType::ThoughtLog,
                thought.clone(),
            )
            .with_task(task_id);
            self.storage.add_event(event).await?;
            
            // Emit progress event
            let progress = ((i + 1) as f32 / thoughts.len() as f32 * 80.0) as u8;
            let _ = self.event_sender.send(TaskEvent::ThoughtLog {
                task_id,
                thought: thought.clone(),
            });
            let _ = self.event_sender.send(TaskEvent::Progress {
                task_id,
                message: format!("Processing: {}", thought),
                progress_pct: progress,
            });
            
            // Simulate processing time
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        }
        
        // Simulate API call
        let event = ActivityEvent::new(
            agent_id,
            EventType::ApiCall,
            "Called LLM API for response generation".to_string(),
        )
        .with_task(task_id)
        .with_details("POST /v1/chat/completions - 200 OK (1.2s)".to_string());
        self.storage.add_event(event).await?;
        
        let _ = self.event_sender.send(TaskEvent::ApiCall {
            task_id,
            endpoint: "/v1/chat/completions".to_string(),
            duration_ms: 1200,
        });
        
        // Simulate completion
        let result = generate_mock_result(&task.instruction);
        
        // Update task
        task.status = TaskStatus::Completed;
        task.completed_at = Some(Utc::now());
        task.result = Some(result.clone());
        let task = self.storage.update_task(task).await?;
        
        // Update agent
        let mut agent = self.storage.get_agent(agent_id).await?;
        agent.status = AgentStatus::Idle;
        agent.current_task_id = None;
        agent.last_activity = Some(Utc::now());
        agent.stats.tasks_completed += 1;
        agent.stats.total_api_calls += 1;
        agent.stats.estimated_cost_cents += 5; // Mock cost
        self.storage.update_agent(agent).await?;
        
        // Log completion event
        let event = ActivityEvent::new(
            agent_id,
            EventType::TaskCompleted,
            format!("Task completed: {}", task.title),
        )
        .with_task(task_id)
        .with_details(result.clone());
        self.storage.add_event(event).await?;
        
        // Emit completion event
        let _ = self.event_sender.send(TaskEvent::Completed {
            task_id,
            result,
        });
        
        info!("Task {} completed successfully", task_id);
        
        Ok(task)
    }

    /// Fail a task (for simulation or error recovery)
    pub async fn fail_task(&self, task_id: Uuid, error_message: String) -> DispatchResult<Task> {
        let mut task = self.storage.get_task(task_id).await?;
        let agent_id = task.agent_id;
        
        // Update task
        task.status = TaskStatus::Failed;
        task.completed_at = Some(Utc::now());
        task.error = Some(error_message.clone());
        let task = self.storage.update_task(task).await?;
        
        // Update agent
        let mut agent = self.storage.get_agent(agent_id).await?;
        agent.status = AgentStatus::Error;
        agent.current_task_id = None;
        agent.last_activity = Some(Utc::now());
        agent.stats.tasks_failed += 1;
        self.storage.update_agent(agent).await?;
        
        // Log failure event
        let event = ActivityEvent::new(
            agent_id,
            EventType::TaskFailed,
            format!("Task failed: {}", task.title),
        )
        .with_task(task_id)
        .with_details(error_message.clone());
        self.storage.add_event(event).await?;
        
        // Emit failure event
        let _ = self.event_sender.send(TaskEvent::Failed {
            task_id,
            error: error_message,
        });
        
        error!("Task {} failed", task_id);
        
        Ok(task)
    }

    /// Cancel a running task
    pub async fn cancel_task(&self, task_id: Uuid) -> DispatchResult<Task> {
        let mut task = self.storage.get_task(task_id).await?;
        let agent_id = task.agent_id;
        
        if task.status != TaskStatus::Running && task.status != TaskStatus::Pending {
            return Err(DispatchError::InvalidTask(
                "Can only cancel pending or running tasks".to_string(),
            ));
        }
        
        // Update task
        task.status = TaskStatus::Cancelled;
        task.completed_at = Some(Utc::now());
        let task = self.storage.update_task(task).await?;
        
        // Update agent if it was running this task
        let mut agent = self.storage.get_agent(agent_id).await?;
        if agent.current_task_id == Some(task_id) {
            agent.status = AgentStatus::Idle;
            agent.current_task_id = None;
            agent.last_activity = Some(Utc::now());
            self.storage.update_agent(agent).await?;
        }
        
        // Log cancellation event
        let event = ActivityEvent::new(
            agent_id,
            EventType::Info,
            format!("Task cancelled: {}", task.title),
        )
        .with_task(task_id);
        self.storage.add_event(event).await?;
        
        info!("Task {} cancelled", task_id);
        
        Ok(task)
    }

    /// Pause an agent
    pub async fn pause_agent(&self, agent_id: Uuid) -> DispatchResult<Agent> {
        let mut agent = self.storage.get_agent(agent_id).await?;
        
        if agent.status == AgentStatus::Paused {
            return Ok(agent);
        }
        
        agent.status = AgentStatus::Paused;
        agent.last_activity = Some(Utc::now());
        let agent = self.storage.update_agent(agent).await?;
        
        // Log status change
        let event = ActivityEvent::new(
            agent_id,
            EventType::StatusChange,
            "Agent paused".to_string(),
        );
        self.storage.add_event(event).await?;
        
        info!("Agent {} paused", agent_id);
        
        Ok(agent)
    }

    /// Resume a paused agent
    pub async fn resume_agent(&self, agent_id: Uuid) -> DispatchResult<Agent> {
        let mut agent = self.storage.get_agent(agent_id).await?;
        
        if agent.status != AgentStatus::Paused {
            return Err(DispatchError::AgentNotAvailable(
                "Agent is not paused".to_string(),
            ));
        }
        
        agent.status = AgentStatus::Idle;
        agent.last_activity = Some(Utc::now());
        let agent = self.storage.update_agent(agent).await?;
        
        // Log status change
        let event = ActivityEvent::new(
            agent_id,
            EventType::StatusChange,
            "Agent resumed".to_string(),
        );
        self.storage.add_event(event).await?;
        
        info!("Agent {} resumed", agent_id);
        
        Ok(agent)
    }

    /// Reset an agent that's in error state
    pub async fn reset_agent(&self, agent_id: Uuid) -> DispatchResult<Agent> {
        let mut agent = self.storage.get_agent(agent_id).await?;
        
        agent.status = AgentStatus::Idle;
        agent.current_task_id = None;
        agent.last_activity = Some(Utc::now());
        let agent = self.storage.update_agent(agent).await?;
        
        // Log status change
        let event = ActivityEvent::new(
            agent_id,
            EventType::StatusChange,
            "Agent reset to idle state".to_string(),
        );
        self.storage.add_event(event).await?;
        
        info!("Agent {} reset", agent_id);
        
        Ok(agent)
    }
}

/// Generate mock thoughts based on the task instruction
fn generate_mock_thoughts(instruction: &str) -> Vec<String> {
    let keywords = extract_keywords(instruction);
    
    vec![
        format!("Analyzing task: {}", truncate(instruction, 50)),
        format!("Identifying key concepts: {}", keywords.join(", ")),
        "Formulating approach based on context...".to_string(),
        "Gathering relevant information...".to_string(),
        "Synthesizing response...".to_string(),
    ]
}

/// Generate a mock result based on the task instruction
fn generate_mock_result(instruction: &str) -> String {
    let instruction_lower = instruction.to_lowercase();
    
    if instruction_lower.contains("analyze") || instruction_lower.contains("review") {
        "Analysis complete. Key findings:\n\
         1. Identified 3 areas for improvement\n\
         2. Performance metrics within acceptable range\n\
         3. Recommendations documented for follow-up".to_string()
    } else if instruction_lower.contains("create") || instruction_lower.contains("build") {
        "Task completed successfully.\n\
         - Created requested components\n\
         - Validated output structure\n\
         - Ready for review".to_string()
    } else if instruction_lower.contains("fix") || instruction_lower.contains("resolve") {
        "Issue resolved.\n\
         - Root cause identified\n\
         - Applied fix to affected areas\n\
         - Verified solution".to_string()
    } else if instruction_lower.contains("test") || instruction_lower.contains("verify") {
        "Testing complete.\n\
         - All test cases passed\n\
         - No regressions detected\n\
         - Coverage report generated".to_string()
    } else {
        format!(
            "Task '{}' completed successfully.\n\
             The requested operation has been performed and results are available.",
            truncate(instruction, 30)
        )
    }
}

/// Extract keywords from text
fn extract_keywords(text: &str) -> Vec<String> {
    let stopwords = ["the", "a", "an", "is", "are", "to", "for", "and", "or", "of", "in", "on", "at"];
    
    text.split_whitespace()
        .filter(|w| w.len() > 2)
        .filter(|w| !stopwords.contains(&w.to_lowercase().as_str()))
        .take(5)
        .map(|s| s.to_string())
        .collect()
}

/// Truncate a string to a maximum length
fn truncate(s: &str, max_len: usize) -> &str {
    if s.len() <= max_len {
        s
    } else {
        &s[..max_len]
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_extract_keywords() {
        let text = "Please analyze the database performance metrics";
        let keywords = extract_keywords(text);
        assert!(!keywords.is_empty());
        assert!(keywords.contains(&"analyze".to_string()) || keywords.contains(&"database".to_string()));
    }
    
    #[test]
    fn test_generate_mock_result() {
        let result = generate_mock_result("Please analyze this code");
        assert!(result.contains("Analysis"));
        
        let result = generate_mock_result("Create a new component");
        assert!(result.contains("Created"));
    }
}
