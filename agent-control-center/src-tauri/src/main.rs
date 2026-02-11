//! Agent Control Center - Main entry point
//!
//! Mission Control for AI Agent Teams
//! A MacOS desktop application for managing autonomous AI agents.
//!
//! This is the main entry point for the Tauri application. It initializes
//! the backend services and registers the IPC command handlers.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ipc;
mod models;
mod storage;
mod task_dispatch;

use ipc::AppState;
use std::sync::Arc;
use storage::Storage;
use task_dispatch::TaskDispatcher;
use tokio::sync::RwLock;
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

/// Initialize the logging system
fn init_logging() {
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::DEBUG)
        .with_target(true)
        .with_thread_names(true)
        .pretty()
        .init();
}

/// Initialize the application state
async fn init_state() -> Result<AppState, Box<dyn std::error::Error>> {
    info!("Initializing application state...");
    
    // Initialize storage
    let storage = Storage::new().await?;
    info!("Storage initialized");
    
    // Initialize task dispatcher
    let dispatcher = TaskDispatcher::new(storage.clone());
    info!("Task dispatcher initialized");
    
    Ok(AppState {
        storage,
        dispatcher: Arc::new(RwLock::new(dispatcher)),
    })
}

fn main() {
    // Initialize logging
    init_logging();
    
    info!("Starting Agent Control Center v{}", env!("CARGO_PKG_VERSION"));
    
    // Create the Tokio runtime for async operations
    let rt = tokio::runtime::Runtime::new().expect("Failed to create Tokio runtime");
    
    // Initialize application state
    let state = rt.block_on(async {
        init_state().await.expect("Failed to initialize application state")
    });
    
    info!("Application state initialized successfully");
    
// Build and run the Tauri application
    tauri::Builder::default()
        .manage(state)
        .invoke_handler(ipc_handlers!())
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
