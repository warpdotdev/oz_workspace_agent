// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod agent;
mod commands;
mod db;
mod storage;

use db::Database;

fn main() {
    let database = Database::new().expect("Failed to initialize SQLite database");

    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .manage(database)
        .invoke_handler(tauri::generate_handler![
            // Agents
            commands::list_agents,
            commands::get_agent,
            commands::create_agent,
            commands::update_agent,
            commands::delete_agent,
            // Files
            commands::list_files,
            commands::create_file,
            commands::update_file,
            commands::delete_file,
            // Schedules
            commands::list_schedules,
            commands::create_schedule,
            commands::update_schedule,
            commands::delete_schedule,
            // Environments
            commands::list_environments,
            commands::create_environment,
            commands::update_environment,
            commands::delete_environment,
            // API Keys
            commands::list_api_keys,
            commands::create_api_key,
            commands::revoke_api_key,
            commands::delete_api_key,
            // Audit Log
            commands::list_audit_log,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
