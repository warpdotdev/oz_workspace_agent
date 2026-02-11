use crate::database::Database;
use crate::models::{Agent, Activity, Task, AgentStats, DispatchTaskRequest, UpdateAgentStatusRequest};
use tauri::State;
use std::sync::Arc;
use uuid::Uuid;
use chrono::Utc;

pub struct AppState {
    pub db: Arc<Database>,
}

#[tauri::command]
pub fn get_agents(state: State<AppState>) -> Result<Vec<Agent>, String> {
    state.db
        .get_all_agents()
        .map_err(|e| format!("Failed to get agents: {}", e))
}

#[tauri::command]
pub fn get_agent(state: State<AppState>, id: String) -> Result<Option<Agent>, String> {
    state.db
        .get_agent(&id)
        .map_err(|e| format!("Failed to get agent: {}", e))
}

#[tauri::command]
pub fn get_activities(
    state: State<AppState>,
    agent_id: Option<String>,
    limit: Option<i32>,
) -> Result<Vec<Activity>, String> {
    let limit = limit.unwrap_or(50);
    state.db
        .get_activities(agent_id.as_deref(), limit)
        .map_err(|e| format!("Failed to get activities: {}", e))
}

#[tauri::command]
pub fn get_tasks(state: State<AppState>, agent_id: String) -> Result<Vec<Task>, String> {
    state.db
        .get_tasks(&agent_id)
        .map_err(|e| format!("Failed to get tasks: {}", e))
}

#[tauri::command]
pub fn dispatch_task(
    state: State<AppState>,
    request: DispatchTaskRequest,
) -> Result<Task, String> {
    let task = Task {
        id: Uuid::new_v4().to_string(),
        agent_id: request.agent_id.clone(),
        description: request.description.clone(),
        status: "pending".to_string(),
        created_at: Utc::now(),
        completed_at: None,
    };

    state.db
        .create_task(&task)
        .map_err(|e| format!("Failed to create task: {}", e))?;

    // Update agent's current task
    state.db
        .update_agent_task(&request.agent_id, Some(request.description.clone()))
        .map_err(|e| format!("Failed to update agent task: {}", e))?;

    // Create activity for task dispatch
    let activity = Activity {
        id: Uuid::new_v4().to_string(),
        agent_id: request.agent_id.clone(),
        activity_type: crate::models::ActivityType::Task,
        message: format!("Task dispatched: {}", request.description),
        details: None,
        timestamp: Utc::now(),
    };

    state.db
        .create_activity(&activity)
        .map_err(|e| format!("Failed to create activity: {}", e))?;

    Ok(task)
}

#[tauri::command]
pub fn update_agent_status(
    state: State<AppState>,
    request: UpdateAgentStatusRequest,
) -> Result<(), String> {
    state.db
        .update_agent_status(&request.agent_id, request.status.clone())
        .map_err(|e| format!("Failed to update agent status: {}", e))?;

    // Create activity for status change
    let activity = Activity {
        id: Uuid::new_v4().to_string(),
        agent_id: request.agent_id.clone(),
        activity_type: crate::models::ActivityType::Status,
        message: format!("Status changed to {}", request.status.as_str()),
        details: None,
        timestamp: Utc::now(),
    };

    state.db
        .create_activity(&activity)
        .map_err(|e| format!("Failed to create activity: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn get_agent_stats(state: State<AppState>) -> Result<AgentStats, String> {
    state.db
        .get_agent_stats()
        .map_err(|e| format!("Failed to get agent stats: {}", e))
}
