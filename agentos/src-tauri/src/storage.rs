//! Local storage for persisting agent configurations
//!
//! This module provides file-based JSON storage for agents, tasks, and events.
//! Data is stored in the user's application data directory.

use crate::models::{ActivityEvent, Agent, Task};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use thiserror::Error;
use tokio::sync::RwLock;
use uuid::Uuid;

/// Errors that can occur during storage operations
#[derive(Error, Debug)]
pub enum StorageError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    #[error("Agent not found: {0}")]
    AgentNotFound(Uuid),
    #[error("Task not found: {0}")]
    TaskNotFound(Uuid),
    #[error("Storage not initialized")]
    NotInitialized,
}

/// Result type for storage operations
pub type StorageResult<T> = Result<T, StorageError>;

/// In-memory cache of all data with file persistence
#[derive(Debug, Default, Serialize, Deserialize)]
struct StorageData {
    agents: HashMap<Uuid, Agent>,
    tasks: HashMap<Uuid, Task>,
    events: Vec<ActivityEvent>,
}

/// Local storage manager for the application
#[derive(Clone)]
pub struct Storage {
    data: Arc<RwLock<StorageData>>,
    data_path: PathBuf,
}

impl Storage {
    /// Create a new storage instance
    pub async fn new() -> StorageResult<Self> {
        let data_dir = Self::get_data_dir()?;
        std::fs::create_dir_all(&data_dir)?;
        
        let data_path = data_dir.join("data.json");
        
        let data = if data_path.exists() {
            let content = std::fs::read_to_string(&data_path)?;
            serde_json::from_str(&content).unwrap_or_default()
        } else {
            StorageData::default()
        };
        
        println!("[Storage] Initialized at {:?}", data_path);
        
        Ok(Self {
            data: Arc::new(RwLock::new(data)),
            data_path,
        })
    }
    
    /// Get the application data directory
    fn get_data_dir() -> StorageResult<PathBuf> {
        let base_dir = dirs::data_dir()
            .unwrap_or_else(|| PathBuf::from("."));
        Ok(base_dir.join("agentos"))
    }
    
    /// Persist data to disk
    async fn persist(&self) -> StorageResult<()> {
        let data = self.data.read().await;
        let content = serde_json::to_string_pretty(&*data)?;
        std::fs::write(&self.data_path, content)?;
        Ok(())
    }
    
    // ==================== Agent Operations ====================
    
    /// Create a new agent
    pub async fn create_agent(&self, agent: Agent) -> StorageResult<Agent> {
        let mut data = self.data.write().await;
        data.agents.insert(agent.id, agent.clone());
        drop(data);
        self.persist().await?;
        println!("[Storage] Created agent: {} ({})", agent.name, agent.id);
        Ok(agent)
    }
    
    /// Get an agent by ID
    pub async fn get_agent(&self, id: Uuid) -> StorageResult<Agent> {
        let data = self.data.read().await;
        data.agents
            .get(&id)
            .cloned()
            .ok_or(StorageError::AgentNotFound(id))
    }
    
    /// Get all agents
    pub async fn get_all_agents(&self) -> StorageResult<Vec<Agent>> {
        let data = self.data.read().await;
        Ok(data.agents.values().cloned().collect())
    }
    
    /// Update an agent
    pub async fn update_agent(&self, agent: Agent) -> StorageResult<Agent> {
        let mut data = self.data.write().await;
        if !data.agents.contains_key(&agent.id) {
            return Err(StorageError::AgentNotFound(agent.id));
        }
        data.agents.insert(agent.id, agent.clone());
        drop(data);
        self.persist().await?;
        println!("[Storage] Updated agent: {} ({})", agent.name, agent.id);
        Ok(agent)
    }
    
    /// Delete an agent
    pub async fn delete_agent(&self, id: Uuid) -> StorageResult<()> {
        let mut data = self.data.write().await;
        if data.agents.remove(&id).is_none() {
            return Err(StorageError::AgentNotFound(id));
        }
        // Also delete associated tasks
        data.tasks.retain(|_, task| task.agent_id != id);
        drop(data);
        self.persist().await?;
        println!("[Storage] Deleted agent: {}", id);
        Ok(())
    }
    
    // ==================== Task Operations ====================
    
    /// Create a new task
    pub async fn create_task(&self, task: Task) -> StorageResult<Task> {
        let mut data = self.data.write().await;
        // Verify agent exists
        if !data.agents.contains_key(&task.agent_id) {
            return Err(StorageError::AgentNotFound(task.agent_id));
        }
        data.tasks.insert(task.id, task.clone());
        drop(data);
        self.persist().await?;
        println!("[Storage] Created task: {} ({})", task.title, task.id);
        Ok(task)
    }
    
    /// Get a task by ID
    pub async fn get_task(&self, id: Uuid) -> StorageResult<Task> {
        let data = self.data.read().await;
        data.tasks
            .get(&id)
            .cloned()
            .ok_or(StorageError::TaskNotFound(id))
    }
    
    /// Get all tasks for an agent
    pub async fn get_agent_tasks(&self, agent_id: Uuid) -> StorageResult<Vec<Task>> {
        let data = self.data.read().await;
        Ok(data
            .tasks
            .values()
            .filter(|t| t.agent_id == agent_id)
            .cloned()
            .collect())
    }
    
    /// Get all tasks
    pub async fn get_all_tasks(&self) -> StorageResult<Vec<Task>> {
        let data = self.data.read().await;
        Ok(data.tasks.values().cloned().collect())
    }
    
    /// Update a task
    pub async fn update_task(&self, task: Task) -> StorageResult<Task> {
        let mut data = self.data.write().await;
        if !data.tasks.contains_key(&task.id) {
            return Err(StorageError::TaskNotFound(task.id));
        }
        data.tasks.insert(task.id, task.clone());
        drop(data);
        self.persist().await?;
        println!("[Storage] Updated task: {} ({})", task.title, task.id);
        Ok(task)
    }
    
    /// Delete a task
    pub async fn delete_task(&self, id: Uuid) -> StorageResult<()> {
        let mut data = self.data.write().await;
        if data.tasks.remove(&id).is_none() {
            return Err(StorageError::TaskNotFound(id));
        }
        drop(data);
        self.persist().await?;
        println!("[Storage] Deleted task: {}", id);
        Ok(())
    }
    
    // ==================== Event Operations ====================
    
    /// Add an activity event
    pub async fn add_event(&self, event: ActivityEvent) -> StorageResult<ActivityEvent> {
        let mut data = self.data.write().await;
        data.events.push(event.clone());
        
        // Keep only the last 1000 events to prevent unbounded growth
        if data.events.len() > 1000 {
            let excess = data.events.len() - 1000;
            data.events.drain(0..excess);
        }
        
        drop(data);
        self.persist().await?;
        Ok(event)
    }
    
    /// Get events for an agent
    pub async fn get_agent_events(&self, agent_id: Uuid, limit: Option<usize>) -> StorageResult<Vec<ActivityEvent>> {
        let data = self.data.read().await;
        let mut events: Vec<_> = data
            .events
            .iter()
            .filter(|e| e.agent_id == agent_id)
            .cloned()
            .collect();
        
        // Sort by timestamp descending (most recent first)
        events.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        
        if let Some(limit) = limit {
            events.truncate(limit);
        }
        
        Ok(events)
    }
    
    /// Get all recent events
    pub async fn get_recent_events(&self, limit: Option<usize>) -> StorageResult<Vec<ActivityEvent>> {
        let data = self.data.read().await;
        let mut events: Vec<_> = data.events.clone();
        
        // Sort by timestamp descending (most recent first)
        events.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
        
        if let Some(limit) = limit {
            events.truncate(limit);
        }
        
        Ok(events)
    }
    
    /// Clear all events
    pub async fn clear_events(&self) -> StorageResult<()> {
        let mut data = self.data.write().await;
        data.events.clear();
        drop(data);
        self.persist().await?;
        println!("[Storage] Cleared all events");
        Ok(())
    }
    
    // ==================== Utility Operations ====================
    
    /// Get storage statistics
    pub async fn get_stats(&self) -> StorageResult<StorageStats> {
        let data = self.data.read().await;
        Ok(StorageStats {
            agent_count: data.agents.len(),
            task_count: data.tasks.len(),
            event_count: data.events.len(),
            data_path: self.data_path.to_string_lossy().to_string(),
        })
    }
    
    /// Export all data as JSON
    pub async fn export_data(&self) -> StorageResult<String> {
        let data = self.data.read().await;
        Ok(serde_json::to_string_pretty(&*data)?)
    }
    
    /// Import data from JSON
    pub async fn import_data(&self, json: &str) -> StorageResult<()> {
        let new_data: StorageData = serde_json::from_str(json)?;
        let mut data = self.data.write().await;
        *data = new_data;
        drop(data);
        self.persist().await?;
        println!("[Storage] Data imported successfully");
        Ok(())
    }
    
    /// Reset storage to empty state
    pub async fn reset(&self) -> StorageResult<()> {
        let mut data = self.data.write().await;
        *data = StorageData::default();
        drop(data);
        self.persist().await?;
        println!("[Storage] Reset to empty state");
        Ok(())
    }
}

/// Statistics about storage usage
#[derive(Debug, Clone, Serialize)]
pub struct StorageStats {
    pub agent_count: usize,
    pub task_count: usize,
    pub event_count: usize,
    pub data_path: String,
}
