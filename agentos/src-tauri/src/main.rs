// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod models;
mod storage;
mod mock;

use std::sync::Arc;
use commands::AppState;

fn main() {
    // Initialize storage
    let storage = Arc::new(storage::Storage::new().expect("Failed to initialize storage"));
    
    // Seed demo data on first run
    let _ = storage.seed_demo_agents();
    
    let app_state = AppState {
        storage,
        mock_service: Arc::new(mock::MockAgentService::new()),
    };

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::get_agents,
            commands::get_agent,
            commands::create_agent,
            commands::update_agent,
            commands::delete_agent,
            commands::dispatch_task,
            commands::get_task,
            commands::get_agent_tasks,
            commands::get_events,
            commands::get_agent_events,
            commands::seed_mock_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
