mod models;
mod storage;
mod commands;
mod mock;

use std::sync::Arc;
use tauri::Manager;

use commands::AppState;
use storage::Storage;
use mock::MockAgentService;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      // Get app data directory for database
      let app_data_dir = app.path().app_data_dir()
        .expect("Failed to get app data directory");
      
      // Create directory if it doesn't exist
      std::fs::create_dir_all(&app_data_dir).ok();
      
      let db_path = app_data_dir.join("agentos.db");
      
      // Initialize storage
      let storage = Storage::new(db_path)
        .expect("Failed to initialize database");
      
      // Initialize mock service
      let mock_service = MockAgentService::new();
      
      // Create app state
      let state = AppState {
        storage: Arc::new(storage),
        mock_service: Arc::new(mock_service),
      };
      
      app.manage(state);

      Ok(())
    })
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
