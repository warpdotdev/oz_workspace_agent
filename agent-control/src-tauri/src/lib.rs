mod models;
mod database;
mod commands;
mod seed;

use commands::AppState;
use database::Database;
use std::sync::Arc;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize database
    let db_path = "agent_control.db";
    let db = Database::new(db_path)
        .expect("Failed to initialize database");
    
    // Seed with mock data if database is empty
    if let Err(e) = seed::seed_mock_data(&db) {
        eprintln!("Warning: Failed to seed mock data: {}", e);
    }

    let state = AppState {
        db: Arc::new(db),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            commands::get_agents,
            commands::get_agent,
            commands::get_activities,
            commands::get_tasks,
            commands::dispatch_task,
            commands::update_agent_status,
            commands::get_agent_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
