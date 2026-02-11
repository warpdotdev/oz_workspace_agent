use rusqlite::{Connection, params};
use std::sync::Mutex;
use std::path::PathBuf;
use thiserror::Error;

use crate::models::{AgentConfig, AgentFramework, Task, TaskStatus, AgentEvent, EventType};

#[derive(Error, Debug)]
pub enum StorageError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("Agent not found: {0}")]
    AgentNotFound(String),
    #[error("Task not found: {0}")]
    TaskNotFound(String),
    #[error("Lock error")]
    LockError,
}

pub struct Storage {
    conn: Mutex<Connection>,
}

impl Storage {
    /// Create a new storage instance with the given database path
    pub fn new(db_path: PathBuf) -> Result<Self, StorageError> {
        let conn = Connection::open(&db_path)?;
        let storage = Self {
            conn: Mutex::new(conn),
        };
        storage.initialize()?;
        Ok(storage)
    }

    /// Create an in-memory storage for testing
    #[allow(dead_code)]
    pub fn in_memory() -> Result<Self, StorageError> {
        let conn = Connection::open_in_memory()?;
        let storage = Self {
            conn: Mutex::new(conn),
        };
        storage.initialize()?;
        Ok(storage)
    }

    /// Initialize database schema
    fn initialize(&self) -> Result<(), StorageError> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockError)?;
        
        conn.execute_batch(r#"
            CREATE TABLE IF NOT EXISTS agents (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                framework TEXT NOT NULL,
                model TEXT NOT NULL,
                max_tokens INTEGER NOT NULL DEFAULT 4096,
                temperature REAL NOT NULL DEFAULT 0.7,
                system_prompt TEXT,
                tools TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                agent_id TEXT NOT NULL,
                instruction TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                result TEXT,
                error TEXT,
                created_at TEXT NOT NULL,
                completed_at TEXT,
                FOREIGN KEY (agent_id) REFERENCES agents(id)
            );

            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                agent_id TEXT NOT NULL,
                agent_name TEXT NOT NULL,
                event_type TEXT NOT NULL,
                message TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                metadata TEXT,
                FOREIGN KEY (agent_id) REFERENCES agents(id)
            );

            CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON tasks(agent_id);
            CREATE INDEX IF NOT EXISTS idx_events_agent_id ON events(agent_id);
            CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
        "#)?;

        Ok(())
    }

    // Agent CRUD operations

    pub fn create_agent(&self, config: &AgentConfig) -> Result<(), StorageError> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockError)?;
        let tools_json = serde_json::to_string(&config.tools).unwrap_or_else(|_| "[]".to_string());
        
        conn.execute(
            r#"INSERT INTO agents (id, name, description, framework, model, max_tokens, temperature, system_prompt, tools, created_at, updated_at)
               VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)"#,
            params![
                config.id,
                config.name,
                config.description,
                config.framework.to_string(),
                config.model,
                config.max_tokens,
                config.temperature,
                config.system_prompt,
                tools_json,
                config.created_at,
                config.updated_at,
            ],
        )?;

        Ok(())
    }

    pub fn get_agent(&self, id: &str) -> Result<AgentConfig, StorageError> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockError)?;
        
        let mut stmt = conn.prepare(
            "SELECT id, name, description, framework, model, max_tokens, temperature, system_prompt, tools, created_at, updated_at FROM agents WHERE id = ?1"
        )?;

        let config = stmt.query_row([id], |row| {
            let tools_json: String = row.get(8)?;
            let tools: Vec<String> = serde_json::from_str(&tools_json).unwrap_or_default();
            let framework_str: String = row.get(3)?;
            
            Ok(AgentConfig {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                framework: AgentFramework::from(framework_str),
                model: row.get(4)?,
                max_tokens: row.get(5)?,
                temperature: row.get(6)?,
                system_prompt: row.get(7)?,
                tools,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        }).map_err(|_| StorageError::AgentNotFound(id.to_string()))?;

        Ok(config)
    }

    pub fn list_agents(&self) -> Result<Vec<AgentConfig>, StorageError> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockError)?;
        
        let mut stmt = conn.prepare(
            "SELECT id, name, description, framework, model, max_tokens, temperature, system_prompt, tools, created_at, updated_at FROM agents ORDER BY created_at DESC"
        )?;

        let configs = stmt.query_map([], |row| {
            let tools_json: String = row.get(8)?;
            let tools: Vec<String> = serde_json::from_str(&tools_json).unwrap_or_default();
            let framework_str: String = row.get(3)?;
            
            Ok(AgentConfig {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                framework: AgentFramework::from(framework_str),
                model: row.get(4)?,
                max_tokens: row.get(5)?,
                temperature: row.get(6)?,
                system_prompt: row.get(7)?,
                tools,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?;

        Ok(configs)
    }

    pub fn update_agent(&self, id: &str, config: &AgentConfig) -> Result<(), StorageError> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockError)?;
        let tools_json = serde_json::to_string(&config.tools).unwrap_or_else(|_| "[]".to_string());
        
        let rows = conn.execute(
            r#"UPDATE agents SET name = ?1, description = ?2, model = ?3, max_tokens = ?4, 
               temperature = ?5, system_prompt = ?6, tools = ?7, updated_at = ?8 WHERE id = ?9"#,
            params![
                config.name,
                config.description,
                config.model,
                config.max_tokens,
                config.temperature,
                config.system_prompt,
                tools_json,
                config.updated_at,
                id,
            ],
        )?;

        if rows == 0 {
            return Err(StorageError::AgentNotFound(id.to_string()));
        }

        Ok(())
    }

    pub fn delete_agent(&self, id: &str) -> Result<(), StorageError> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockError)?;
        
        // Delete related events and tasks first
        conn.execute("DELETE FROM events WHERE agent_id = ?1", [id])?;
        conn.execute("DELETE FROM tasks WHERE agent_id = ?1", [id])?;
        
        let rows = conn.execute("DELETE FROM agents WHERE id = ?1", [id])?;
        
        if rows == 0 {
            return Err(StorageError::AgentNotFound(id.to_string()));
        }

        Ok(())
    }

    // Task operations

    pub fn create_task(&self, task: &Task) -> Result<(), StorageError> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockError)?;
        
        conn.execute(
            r#"INSERT INTO tasks (id, agent_id, instruction, status, result, error, created_at, completed_at)
               VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"#,
            params![
                task.id,
                task.agent_id,
                task.instruction,
                task.status.to_string(),
                task.result,
                task.error,
                task.created_at,
                task.completed_at,
            ],
        )?;

        Ok(())
    }

    pub fn get_task(&self, id: &str) -> Result<Task, StorageError> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockError)?;
        
        let mut stmt = conn.prepare(
            "SELECT id, agent_id, instruction, status, result, error, created_at, completed_at FROM tasks WHERE id = ?1"
        )?;

        let task = stmt.query_row([id], |row| {
            let status_str: String = row.get(3)?;
            
            Ok(Task {
                id: row.get(0)?,
                agent_id: row.get(1)?,
                instruction: row.get(2)?,
                status: TaskStatus::from(status_str),
                result: row.get(4)?,
                error: row.get(5)?,
                created_at: row.get(6)?,
                completed_at: row.get(7)?,
            })
        }).map_err(|_| StorageError::TaskNotFound(id.to_string()))?;

        Ok(task)
    }

    pub fn list_tasks_for_agent(&self, agent_id: &str) -> Result<Vec<Task>, StorageError> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockError)?;
        
        let mut stmt = conn.prepare(
            "SELECT id, agent_id, instruction, status, result, error, created_at, completed_at FROM tasks WHERE agent_id = ?1 ORDER BY created_at DESC"
        )?;

        let tasks = stmt.query_map([agent_id], |row| {
            let status_str: String = row.get(3)?;
            
            Ok(Task {
                id: row.get(0)?,
                agent_id: row.get(1)?,
                instruction: row.get(2)?,
                status: TaskStatus::from(status_str),
                result: row.get(4)?,
                error: row.get(5)?,
                created_at: row.get(6)?,
                completed_at: row.get(7)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?;

        Ok(tasks)
    }

    pub fn update_task(&self, task: &Task) -> Result<(), StorageError> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockError)?;
        
        let rows = conn.execute(
            r#"UPDATE tasks SET status = ?1, result = ?2, error = ?3, completed_at = ?4 WHERE id = ?5"#,
            params![
                task.status.to_string(),
                task.result,
                task.error,
                task.completed_at,
                task.id,
            ],
        )?;

        if rows == 0 {
            return Err(StorageError::TaskNotFound(task.id.clone()));
        }

        Ok(())
    }

    // Event operations

    pub fn create_event(&self, event: &AgentEvent) -> Result<(), StorageError> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockError)?;
        let metadata_json = event.metadata.as_ref().map(|m| m.to_string());
        
        conn.execute(
            r#"INSERT INTO events (id, agent_id, agent_name, event_type, message, timestamp, metadata)
               VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)"#,
            params![
                event.id,
                event.agent_id,
                event.agent_name,
                event.event_type.to_string(),
                event.message,
                event.timestamp,
                metadata_json,
            ],
        )?;

        Ok(())
    }

    pub fn list_events(&self, limit: Option<i32>) -> Result<Vec<AgentEvent>, StorageError> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockError)?;
        let limit = limit.unwrap_or(100);
        
        let mut stmt = conn.prepare(
            "SELECT id, agent_id, agent_name, event_type, message, timestamp, metadata FROM events ORDER BY timestamp DESC LIMIT ?1"
        )?;

        let events = stmt.query_map([limit], |row| {
            let event_type_str: String = row.get(3)?;
            let metadata_str: Option<String> = row.get(6)?;
            let metadata = metadata_str.and_then(|s| serde_json::from_str(&s).ok());
            
            let event_type = match event_type_str.as_str() {
                "status_change" => EventType::StatusChange,
                "thought" => EventType::Thought,
                "action" => EventType::Action,
                "error" => EventType::Error,
                "task_complete" => EventType::TaskComplete,
                _ => EventType::Action,
            };
            
            Ok(AgentEvent {
                id: row.get(0)?,
                agent_id: row.get(1)?,
                agent_name: row.get(2)?,
                event_type,
                message: row.get(4)?,
                timestamp: row.get(5)?,
                metadata,
            })
        })?.collect::<Result<Vec<_>, _>>()?;

        Ok(events)
    }

    pub fn list_events_for_agent(&self, agent_id: &str, limit: Option<i32>) -> Result<Vec<AgentEvent>, StorageError> {
        let conn = self.conn.lock().map_err(|_| StorageError::LockError)?;
        let limit = limit.unwrap_or(100);
        
        let mut stmt = conn.prepare(
            "SELECT id, agent_id, agent_name, event_type, message, timestamp, metadata FROM events WHERE agent_id = ?1 ORDER BY timestamp DESC LIMIT ?2"
        )?;

        let events = stmt.query_map(params![agent_id, limit], |row| {
            let event_type_str: String = row.get(3)?;
            let metadata_str: Option<String> = row.get(6)?;
            let metadata = metadata_str.and_then(|s| serde_json::from_str(&s).ok());
            
            let event_type = match event_type_str.as_str() {
                "status_change" => EventType::StatusChange,
                "thought" => EventType::Thought,
                "action" => EventType::Action,
                "error" => EventType::Error,
                "task_complete" => EventType::TaskComplete,
                _ => EventType::Action,
            };
            
            Ok(AgentEvent {
                id: row.get(0)?,
                agent_id: row.get(1)?,
                agent_name: row.get(2)?,
                event_type,
                message: row.get(4)?,
                timestamp: row.get(5)?,
                metadata,
            })
        })?.collect::<Result<Vec<_>, _>>()?;

        Ok(events)
    }
}
