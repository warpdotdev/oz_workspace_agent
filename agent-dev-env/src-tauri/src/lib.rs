mod commands;
mod db;

use db::Database;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = Database::new().expect("Failed to initialize database");
    
    tauri::Builder::default()
        .manage(db)
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::list_agents,
            commands::get_agent,
            commands::create_agent,
            commands::update_agent,
            commands::delete_agent,
            commands::list_files,
            commands::create_file,
            commands::update_file,
            commands::delete_file,
            commands::list_schedules,
            commands::create_schedule,
            commands::update_schedule,
            commands::delete_schedule,
            commands::list_environments,
            commands::create_environment,
            commands::update_environment,
            commands::delete_environment,
            commands::list_api_keys,
            commands::create_api_key,
            commands::update_api_key,
            commands::delete_api_key,
            commands::list_audit_log,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
