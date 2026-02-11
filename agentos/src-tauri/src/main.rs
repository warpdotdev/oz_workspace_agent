// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod agent;
mod storage;

use agent::{Agent, AgentStatus, Activity, Task};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

// Application state
pub struct AppState {
    agents: Mutex<Vec<Agent>>,
    activities: Mutex<Vec<Activity>>,
}

// IPC Response wrapper
#[derive(Serialize)]
pub struct IpcResponse<T> {
    success: bool,
    data: Option<T>,
    error: Option<String>,
}

impl<T> IpcResponse<T> {
    fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    fn error(message: &str) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message.to_string()),
        }
    }
}

// IPC Commands

#[tauri::command]
fn get_agents(state: State<AppState>) -> IpcResponse<Vec<Agent>> {
    let agents = state.agents.lock().unwrap();
    IpcResponse::success(agents.clone())
}

#[tauri::command]
fn get_agent(state: State<AppState>, agent_id: String) -> IpcResponse<Agent> {
    let agents = state.agents.lock().unwrap();
    match agents.iter().find(|a| a.id == agent_id) {
        Some(agent) => IpcResponse::success(agent.clone()),
        None => IpcResponse::error("Agent not found"),
    }
}

#[tauri::command]
fn create_agent(state: State<AppState>, name: String, framework: String) -> IpcResponse<Agent> {
    let mut agents = state.agents.lock().unwrap();
    let agent = Agent::new(name, framework);
    agents.push(agent.clone());
    IpcResponse::success(agent)
}

#[tauri::command]
fn update_agent_status(
    state: State<AppState>,
    agent_id: String,
    status: AgentStatus,
) -> IpcResponse<Agent> {
    let mut agents = state.agents.lock().unwrap();
    match agents.iter_mut().find(|a| a.id == agent_id) {
        Some(agent) => {
            agent.status = status;
            agent.last_heartbeat = chrono::Utc::now();
            IpcResponse::success(agent.clone())
        }
        None => IpcResponse::error("Agent not found"),
    }
}

#[tauri::command]
fn dispatch_task(
    state: State<AppState>,
    agent_id: String,
    instruction: String,
) -> IpcResponse<Task> {
    let mut agents = state.agents.lock().unwrap();
    match agents.iter_mut().find(|a| a.id == agent_id) {
        Some(agent) => {
            let task = Task::new(agent_id.clone(), instruction.clone());
            agent.current_task = Some(instruction);
            agent.status = AgentStatus::Running;
            
            // Add activity
            let mut activities = state.activities.lock().unwrap();
            let activity = Activity::user_input(
                agent_id,
                agent.name.clone(),
                format!("Task dispatched: {}", task.instruction),
            );
            activities.push(activity);
            
            IpcResponse::success(task)
        }
        None => IpcResponse::error("Agent not found"),
    }
}

#[tauri::command]
fn pause_agent(state: State<AppState>, agent_id: String) -> IpcResponse<Agent> {
    update_agent_status(state, agent_id, AgentStatus::Paused)
}

#[tauri::command]
fn resume_agent(state: State<AppState>, agent_id: String) -> IpcResponse<Agent> {
    update_agent_status(state, agent_id, AgentStatus::Running)
}

#[tauri::command]
fn stop_agent(state: State<AppState>, agent_id: String) -> IpcResponse<Agent> {
    let mut agents = state.agents.lock().unwrap();
    match agents.iter_mut().find(|a| a.id == agent_id) {
        Some(agent) => {
            agent.status = AgentStatus::Idle;
            agent.current_task = None;
            IpcResponse::success(agent.clone())
        }
        None => IpcResponse::error("Agent not found"),
    }
}

#[tauri::command]
fn delete_agent(state: State<AppState>, agent_id: String) -> IpcResponse<bool> {
    let mut agents = state.agents.lock().unwrap();
    let initial_len = agents.len();
    agents.retain(|a| a.id != agent_id);
    if agents.len() < initial_len {
        IpcResponse::success(true)
    } else {
        IpcResponse::error("Agent not found")
    }
}

#[tauri::command]
fn get_activities(
    state: State<AppState>,
    agent_id: Option<String>,
    limit: Option<usize>,
) -> IpcResponse<Vec<Activity>> {
    let activities = state.activities.lock().unwrap();
    let filtered: Vec<Activity> = activities
        .iter()
        .filter(|a| agent_id.as_ref().map_or(true, |id| &a.agent_id == id))
        .take(limit.unwrap_or(100))
        .cloned()
        .collect();
    IpcResponse::success(filtered)
}

#[tauri::command]
fn clear_activities(state: State<AppState>, agent_id: Option<String>) -> IpcResponse<bool> {
    let mut activities = state.activities.lock().unwrap();
    match agent_id {
        Some(id) => activities.retain(|a| a.agent_id != id),
        None => activities.clear(),
    }
    IpcResponse::success(true)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .manage(AppState {
            agents: Mutex::new(Vec::new()),
            activities: Mutex::new(Vec::new()),
        })
        .invoke_handler(tauri::generate_handler![
            get_agents,
            get_agent,
            create_agent,
            update_agent_status,
            dispatch_task,
            pause_agent,
            resume_agent,
            stop_agent,
            delete_agent,
            get_activities,
            clear_activities,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
