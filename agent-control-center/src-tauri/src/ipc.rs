//! Tauri IPC command handlers for frontend-backend communication
//!
//! This module defines all the commands that can be invoked from the frontend
//! via Tauri's IPC mechanism. Each command is exposed to the frontend and
//! provides access to the backend services.

use crate::models::{
    ActivityEvent, Agent, AgentStatus, CreateAgentRequest, DispatchTaskRequest,
    DispatchTaskResponse, Task, UpdateAgentRequest,
};
use crate::storage::{Storage, StorageStats};
use crate::task_dispatch::TaskDispatcher;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;
use tracing::{debug, info};
use uuid::Uuid;

/// Application state shared across all commands
pub struct AppState {
    pub storage: Storage,
    pub dispatcher: Arc<RwLock<TaskDispatcher>>,
}

/// Error type for IPC commands
#[derive(Debug, Serialize)]
pub struct IpcError {
    pub code: String,
    pub message: String,
}

impl From<crate::storage::StorageError> for IpcError {
    fn from(err: crate::storage::StorageError) -> Self {
        IpcError {
            code: "STORAGE_ERROR".to_string(),
            message: err.to_string(),
        }
    }
}

impl From<crate::task_dispatch::DispatchError> for IpcError {
    fn from(err: crate::task_dispatch::DispatchError) -> Self {
        IpcError {
            code: "DISPATCH_ERROR".to_string(),
            message: err.to_string(),
        }
    }
}

/// Result type for IPC commands
pub type IpcResult<T> = Result<T, IpcError>;

// ==================== Agent Commands ====================

/// Create a new agent
#[tauri::command]
pub async fn create_agent(
    state: State<'_, AppState>,
    request: CreateAgentRequest,
) -> IpcResult<Agent> {
    debug!("Creating agent: {}", request.name);
    
    let mut agent = Agent::new(request.name, request.framework);
    agent.description = request.description;
    agent.model = request.model;
    if let Some(config) = request.config {
        agent.config = config;
    }
    
    let agent = state.storage.create_agent(agent).await?;
    info!("Agent created: {} ({})", agent.name, agent.id);
    
    Ok(agent)
}

/// Get an agent by ID
#[tauri::command]
pub async fn get_agent(
    state: State<'_, AppState>,
    id: String,
) -> IpcResult<Agent> {
    let id = parse_uuid(&id)?;
    let agent = state.storage.get_agent(id).await?;
    Ok(agent)
}

/// Get all agents
#[tauri::command]
pub async fn get_all_agents(
    state: State<'_, AppState>,
) -> IpcResult<Vec<Agent>> {
    let agents = state.storage.get_all_agents().await?;
    Ok(agents)
}

/// Update an agent
#[tauri::command]
pub async fn update_agent(
    state: State<'_, AppState>,
    id: String,
    request: UpdateAgentRequest,
) -> IpcResult<Agent> {
    let id = parse_uuid(&id)?;
    let mut agent = state.storage.get_agent(id).await?;
    
    if let Some(name) = request.name {
        agent.name = name;
    }
    if let Some(description) = request.description {
        agent.description = Some(description);
    }
    if let Some(model) = request.model {
        agent.model = Some(model);
    }
    if let Some(config) = request.config {
        agent.config = config;
    }
    
    let agent = state.storage.update_agent(agent).await?;
    info!("Agent updated: {} ({})", agent.name, agent.id);
    
    Ok(agent)
}

/// Delete an agent
#[tauri::command]
pub async fn delete_agent(
    state: State<'_, AppState>,
    id: String,
) -> IpcResult<()> {
    let id = parse_uuid(&id)?;
    state.storage.delete_agent(id).await?;
    info!("Agent deleted: {}", id);
    Ok(())
}

/// Update agent status
#[tauri::command]
pub async fn set_agent_status(
    state: State<'_, AppState>,
    id: String,
    status: AgentStatus,
) -> IpcResult<Agent> {
    let id = parse_uuid(&id)?;
    let mut agent = state.storage.get_agent(id).await?;
    agent.status = status;
    agent.last_activity = Some(chrono::Utc::now());
    let agent = state.storage.update_agent(agent).await?;
    info!("Agent {} status set to {:?}", id, status);
    Ok(agent)
}

// ==================== Task Commands ====================

/// Dispatch a task to an agent
#[tauri::command]
pub async fn dispatch_task(
    state: State<'_, AppState>,
    request: DispatchTaskRequest,
) -> IpcResult<DispatchTaskResponse> {
    debug!("Dispatching task: {}", request.title);
    let dispatcher = state.dispatcher.read().await;
    let response = dispatcher.dispatch(request).await?;
    Ok(response)
}

/// Execute a task (runs simulation)
#[tauri::command]
pub async fn execute_task(
    state: State<'_, AppState>,
    task_id: String,
) -> IpcResult<Task> {
    let task_id = parse_uuid(&task_id)?;
    let dispatcher = state.dispatcher.read().await;
    let task = dispatcher.simulate_execution(task_id).await?;
    Ok(task)
}

/// Cancel a task
#[tauri::command]
pub async fn cancel_task(
    state: State<'_, AppState>,
    task_id: String,
) -> IpcResult<Task> {
    let task_id = parse_uuid(&task_id)?;
    let dispatcher = state.dispatcher.read().await;
    let task = dispatcher.cancel_task(task_id).await?;
    Ok(task)
}

/// Get a task by ID
#[tauri::command]
pub async fn get_task(
    state: State<'_, AppState>,
    id: String,
) -> IpcResult<Task> {
    let id = parse_uuid(&id)?;
    let task = state.storage.get_task(id).await?;
    Ok(task)
}

/// Get all tasks for an agent
#[tauri::command]
pub async fn get_agent_tasks(
    state: State<'_, AppState>,
    agent_id: String,
) -> IpcResult<Vec<Task>> {
    let agent_id = parse_uuid(&agent_id)?;
    let tasks = state.storage.get_agent_tasks(agent_id).await?;
    Ok(tasks)
}

/// Get all tasks
#[tauri::command]
pub async fn get_all_tasks(
    state: State<'_, AppState>,
) -> IpcResult<Vec<Task>> {
    let tasks = state.storage.get_all_tasks().await?;
    Ok(tasks)
}

// ==================== Agent Control Commands ====================

/// Pause an agent
#[tauri::command]
pub async fn pause_agent(
    state: State<'_, AppState>,
    agent_id: String,
) -> IpcResult<Agent> {
    let agent_id = parse_uuid(&agent_id)?;
    let dispatcher = state.dispatcher.read().await;
    let agent = dispatcher.pause_agent(agent_id).await?;
    Ok(agent)
}

/// Resume a paused agent
#[tauri::command]
pub async fn resume_agent(
    state: State<'_, AppState>,
    agent_id: String,
) -> IpcResult<Agent> {
    let agent_id = parse_uuid(&agent_id)?;
    let dispatcher = state.dispatcher.read().await;
    let agent = dispatcher.resume_agent(agent_id).await?;
    Ok(agent)
}

/// Reset an agent to idle state
#[tauri::command]
pub async fn reset_agent(
    state: State<'_, AppState>,
    agent_id: String,
) -> IpcResult<Agent> {
    let agent_id = parse_uuid(&agent_id)?;
    let dispatcher = state.dispatcher.read().await;
    let agent = dispatcher.reset_agent(agent_id).await?;
    Ok(agent)
}

// ==================== Event Commands ====================

/// Get recent events for an agent
#[tauri::command]
pub async fn get_agent_events(
    state: State<'_, AppState>,
    agent_id: String,
    limit: Option<usize>,
) -> IpcResult<Vec<ActivityEvent>> {
    let agent_id = parse_uuid(&agent_id)?;
    let events = state.storage.get_agent_events(agent_id, limit).await?;
    Ok(events)
}

/// Get all recent events
#[tauri::command]
pub async fn get_recent_events(
    state: State<'_, AppState>,
    limit: Option<usize>,
) -> IpcResult<Vec<ActivityEvent>> {
    let events = state.storage.get_recent_events(limit).await?;
    Ok(events)
}

/// Clear all events
#[tauri::command]
pub async fn clear_events(
    state: State<'_, AppState>,
) -> IpcResult<()> {
    state.storage.clear_events().await?;
    Ok(())
}

// ==================== Storage Commands ====================

/// Get storage statistics
#[tauri::command]
pub async fn get_storage_stats(
    state: State<'_, AppState>,
) -> IpcResult<StorageStats> {
    let stats = state.storage.get_stats().await?;
    Ok(stats)
}

/// Export all data as JSON
#[tauri::command]
pub async fn export_data(
    state: State<'_, AppState>,
) -> IpcResult<String> {
    let data = state.storage.export_data().await?;
    Ok(data)
}

/// Import data from JSON
#[tauri::command]
pub async fn import_data(
    state: State<'_, AppState>,
    json: String,
) -> IpcResult<()> {
    state.storage.import_data(&json).await?;
    Ok(())
}

/// Reset storage to empty state
#[tauri::command]
pub async fn reset_storage(
    state: State<'_, AppState>,
) -> IpcResult<()> {
    state.storage.reset().await?;
    Ok(())
}

// ==================== Quick Commands (Cmd+K) ====================

/// Request payload for quick commands
#[derive(Debug, Deserialize)]
pub struct QuickCommandRequest {
    pub command: String,
    pub agent_id: Option<String>,
}

/// Response for quick commands
#[derive(Debug, Serialize)]
pub struct QuickCommandResponse {
    pub success: bool,
    pub message: String,
    pub data: Option<serde_json::Value>,
}

/// Execute a quick command from the Cmd+K interface
#[tauri::command]
pub async fn execute_quick_command(
    state: State<'_, AppState>,
    request: QuickCommandRequest,
) -> IpcResult<QuickCommandResponse> {
    let command = request.command.to_lowercase();
    let parts: Vec<&str> = command.split_whitespace().collect();
    
    if parts.is_empty() {
        return Ok(QuickCommandResponse {
            success: false,
            message: "No command provided".to_string(),
            data: None,
        });
    }
    
    match parts[0] {
        "status" | "list" => {
            let agents = state.storage.get_all_agents().await?;
            let summary: Vec<_> = agents
                .iter()
                .map(|a| format!("{}: {:?}", a.name, a.status))
                .collect();
            Ok(QuickCommandResponse {
                success: true,
                message: format!("{} agents: {}", agents.len(), summary.join(", ")),
                data: Some(serde_json::to_value(&agents).unwrap_or_default()),
            })
        }
        "pause" => {
            if let Some(agent_id) = request.agent_id {
                let id = parse_uuid(&agent_id)?;
                let dispatcher = state.dispatcher.read().await;
                let agent = dispatcher.pause_agent(id).await?;
                Ok(QuickCommandResponse {
                    success: true,
                    message: format!("Agent {} paused", agent.name),
                    data: Some(serde_json::to_value(&agent).unwrap_or_default()),
                })
            } else {
                Ok(QuickCommandResponse {
                    success: false,
                    message: "No agent selected".to_string(),
                    data: None,
                })
            }
        }
        "resume" => {
            if let Some(agent_id) = request.agent_id {
                let id = parse_uuid(&agent_id)?;
                let dispatcher = state.dispatcher.read().await;
                let agent = dispatcher.resume_agent(id).await?;
                Ok(QuickCommandResponse {
                    success: true,
                    message: format!("Agent {} resumed", agent.name),
                    data: Some(serde_json::to_value(&agent).unwrap_or_default()),
                })
            } else {
                Ok(QuickCommandResponse {
                    success: false,
                    message: "No agent selected".to_string(),
                    data: None,
                })
            }
        }
        "reset" => {
            if let Some(agent_id) = request.agent_id {
                let id = parse_uuid(&agent_id)?;
                let dispatcher = state.dispatcher.read().await;
                let agent = dispatcher.reset_agent(id).await?;
                Ok(QuickCommandResponse {
                    success: true,
                    message: format!("Agent {} reset to idle", agent.name),
                    data: Some(serde_json::to_value(&agent).unwrap_or_default()),
                })
            } else {
                Ok(QuickCommandResponse {
                    success: false,
                    message: "No agent selected".to_string(),
                    data: None,
                })
            }
        }
        "run" | "dispatch" => {
            if parts.len() < 2 {
                return Ok(QuickCommandResponse {
                    success: false,
                    message: "Usage: run <task instruction>".to_string(),
                    data: None,
                });
            }
            
            if let Some(agent_id) = request.agent_id {
                let id = parse_uuid(&agent_id)?;
                let instruction = parts[1..].join(" ");
                let request = DispatchTaskRequest {
                    agent_id: id,
                    title: format!("Quick task: {}", truncate(&instruction, 30)),
                    instruction,
                    priority: None,
                };
                let dispatcher = state.dispatcher.read().await;
                let response = dispatcher.dispatch(request).await?;
                Ok(QuickCommandResponse {
                    success: true,
                    message: response.message,
                    data: Some(serde_json::to_value(&response.task).unwrap_or_default()),
                })
            } else {
                Ok(QuickCommandResponse {
                    success: false,
                    message: "No agent selected".to_string(),
                    data: None,
                })
            }
        }
        "help" => {
            Ok(QuickCommandResponse {
                success: true,
                message: "Available commands: status, list, pause, resume, reset, run <instruction>, help".to_string(),
                data: None,
            })
        }
        _ => {
            Ok(QuickCommandResponse {
                success: false,
                message: format!("Unknown command: {}. Type 'help' for available commands.", parts[0]),
                data: None,
            })
        }
    }
}

// ==================== Helper Functions ====================

/// Parse a UUID string
fn parse_uuid(s: &str) -> IpcResult<Uuid> {
    Uuid::parse_str(s).map_err(|_| IpcError {
        code: "INVALID_UUID".to_string(),
        message: format!("Invalid UUID: {}", s),
    })
}

/// Truncate a string to a maximum length
fn truncate(s: &str, max_len: usize) -> &str {
    if s.len() <= max_len {
        s
    } else {
        &s[..max_len]
    }
}

/// Generate the list of all IPC commands to register with Tauri
#[macro_export]
macro_rules! ipc_handlers {
    () => {
        tauri::generate_handler![
            crate::ipc::create_agent,
            crate::ipc::get_agent,
            crate::ipc::get_all_agents,
            crate::ipc::update_agent,
            crate::ipc::delete_agent,
            crate::ipc::set_agent_status,
            crate::ipc::dispatch_task,
            crate::ipc::execute_task,
            crate::ipc::cancel_task,
            crate::ipc::get_task,
            crate::ipc::get_agent_tasks,
            crate::ipc::get_all_tasks,
            crate::ipc::pause_agent,
            crate::ipc::resume_agent,
            crate::ipc::reset_agent,
            crate::ipc::get_agent_events,
            crate::ipc::get_recent_events,
            crate::ipc::clear_events,
            crate::ipc::get_storage_stats,
            crate::ipc::export_data,
            crate::ipc::import_data,
            crate::ipc::reset_storage,
            crate::ipc::execute_quick_command,
        ]
    };
}
