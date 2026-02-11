//! AgentOS - Mission Control for AI Agent Teams
//!
//! A MacOS desktop application for managing autonomous AI agents.

pub mod ipc;
pub mod models;
pub mod storage;
pub mod task_dispatch;

use ipc::AppState;
use std::sync::Arc;
use storage::Storage;
use task_dispatch::TaskDispatcher;
use tokio::sync::RwLock;

/// Initialize the application state
async fn init_state() -> Result<AppState, Box<dyn std::error::Error + Send + Sync>> {
    println!("[AgentOS] Initializing application state...");
    
    // Initialize storage
    let storage = Storage::new().await?;
    println!("[AgentOS] Storage initialized");
    
    // Initialize task dispatcher
    let dispatcher = TaskDispatcher::new(storage.clone());
    println!("[AgentOS] Task dispatcher initialized");
    
    Ok(AppState {
        storage,
        dispatcher: Arc::new(RwLock::new(dispatcher)),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    println!("[AgentOS] Starting AgentOS v{}", env!("CARGO_PKG_VERSION"));
    
    // Create the Tokio runtime for async operations
    let rt = tokio::runtime::Runtime::new().expect("Failed to create Tokio runtime");
    
    // Initialize application state
    let state = rt.block_on(async {
        init_state().await.expect("Failed to initialize application state")
    });
    
    println!("[AgentOS] Application state initialized successfully");
    
    // Build and run the Tauri application
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            ipc::create_agent,
            ipc::get_agent,
            ipc::get_all_agents,
            ipc::update_agent,
            ipc::delete_agent,
            ipc::set_agent_status,
            ipc::dispatch_task,
            ipc::execute_task,
            ipc::cancel_task,
            ipc::get_task,
            ipc::get_agent_tasks,
            ipc::get_all_tasks,
            ipc::pause_agent,
            ipc::resume_agent,
            ipc::reset_agent,
            ipc::get_agent_events,
            ipc::get_recent_events,
            ipc::clear_events,
            ipc::get_storage_stats,
            ipc::export_data,
            ipc::import_data,
            ipc::reset_storage,
            ipc::execute_quick_command,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running AgentOS");
}
