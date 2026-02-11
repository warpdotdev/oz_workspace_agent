use rusqlite::{Connection, Result as SqliteResult, params};
use crate::models::{Agent, AgentStatus, Activity, ActivityType, Task, AgentStats};
use chrono::Utc;
use std::sync::{Arc, Mutex};

pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    pub fn new(db_path: &str) -> SqliteResult<Self> {
        let conn = Connection::open(db_path)?;
        let db = Database {
            conn: Arc::new(Mutex::new(conn)),
        };
        db.init_schema()?;
        Ok(db)
    }

    fn init_schema(&self) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS agents (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                status TEXT NOT NULL,
                current_task TEXT,
                runtime_seconds INTEGER NOT NULL DEFAULT 0,
                tokens_used INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS activities (
                id TEXT PRIMARY KEY,
                agent_id TEXT NOT NULL,
                activity_type TEXT NOT NULL,
                message TEXT NOT NULL,
                details TEXT,
                timestamp TEXT NOT NULL,
                FOREIGN KEY(agent_id) REFERENCES agents(id)
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                agent_id TEXT NOT NULL,
                description TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                completed_at TEXT,
                FOREIGN KEY(agent_id) REFERENCES agents(id)
            )",
            [],
        )?;

        Ok(())
    }

    pub fn get_all_agents(&self) -> SqliteResult<Vec<Agent>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, status, current_task, runtime_seconds, tokens_used, created_at, updated_at 
             FROM agents ORDER BY created_at DESC"
        )?;

        let agents = stmt.query_map([], |row| {
            let status_str: String = row.get(2)?;
            let status = AgentStatus::from_str(&status_str).unwrap_or(AgentStatus::Idle);
            
            let created_at_str: String = row.get(6)?;
            let updated_at_str: String = row.get(7)?;
            
            Ok(Agent {
                id: row.get(0)?,
                name: row.get(1)?,
                status,
                current_task: row.get(3)?,
                runtime_seconds: row.get(4)?,
                tokens_used: row.get(5)?,
                created_at: created_at_str.parse().unwrap_or_else(|_| Utc::now()),
                updated_at: updated_at_str.parse().unwrap_or_else(|_| Utc::now()),
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        Ok(agents)
    }

    pub fn get_agent(&self, id: &str) -> SqliteResult<Option<Agent>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, status, current_task, runtime_seconds, tokens_used, created_at, updated_at 
             FROM agents WHERE id = ?"
        )?;

        let result = stmt.query_row(params![id], |row| {
            let status_str: String = row.get(2)?;
            let status = AgentStatus::from_str(&status_str).unwrap_or(AgentStatus::Idle);
            
            let created_at_str: String = row.get(6)?;
            let updated_at_str: String = row.get(7)?;
            
            Ok(Agent {
                id: row.get(0)?,
                name: row.get(1)?,
                status,
                current_task: row.get(3)?,
                runtime_seconds: row.get(4)?,
                tokens_used: row.get(5)?,
                created_at: created_at_str.parse().unwrap_or_else(|_| Utc::now()),
                updated_at: updated_at_str.parse().unwrap_or_else(|_| Utc::now()),
            })
        });

        match result {
            Ok(agent) => Ok(Some(agent)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn create_agent(&self, agent: &Agent) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO agents (id, name, status, current_task, runtime_seconds, tokens_used, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                agent.id,
                agent.name,
                agent.status.as_str(),
                agent.current_task,
                agent.runtime_seconds,
                agent.tokens_used,
                agent.created_at.to_rfc3339(),
                agent.updated_at.to_rfc3339(),
            ],
        )?;
        Ok(())
    }

    pub fn update_agent_status(&self, id: &str, status: AgentStatus) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE agents SET status = ?, updated_at = ? WHERE id = ?",
            params![status.as_str(), Utc::now().to_rfc3339(), id],
        )?;
        Ok(())
    }

    pub fn update_agent_task(&self, id: &str, task: Option<String>) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE agents SET current_task = ?, updated_at = ? WHERE id = ?",
            params![task, Utc::now().to_rfc3339(), id],
        )?;
        Ok(())
    }

    pub fn get_activities(&self, agent_id: Option<&str>, limit: i32) -> SqliteResult<Vec<Activity>> {
        let conn = self.conn.lock().unwrap();
        
        let query = if agent_id.is_some() {
            "SELECT id, agent_id, activity_type, message, details, timestamp 
             FROM activities WHERE agent_id = ? ORDER BY timestamp DESC LIMIT ?"
        } else {
            "SELECT id, agent_id, activity_type, message, details, timestamp 
             FROM activities ORDER BY timestamp DESC LIMIT ?"
        };

        let mut stmt = conn.prepare(query)?;

        let activities = if let Some(agent_id) = agent_id {
            stmt.query_map(params![agent_id, limit], |row| {
                let activity_type_str: String = row.get(2)?;
                let activity_type = ActivityType::from_str(&activity_type_str).unwrap_or(ActivityType::Thought);
                
                let timestamp_str: String = row.get(5)?;
                
                Ok(Activity {
                    id: row.get(0)?,
                    agent_id: row.get(1)?,
                    activity_type,
                    message: row.get(3)?,
                    details: row.get(4)?,
                    timestamp: timestamp_str.parse().unwrap_or_else(|_| Utc::now()),
                })
            })?
        } else {
            stmt.query_map(params![limit], |row| {
                let activity_type_str: String = row.get(2)?;
                let activity_type = ActivityType::from_str(&activity_type_str).unwrap_or(ActivityType::Thought);
                
                let timestamp_str: String = row.get(5)?;
                
                Ok(Activity {
                    id: row.get(0)?,
                    agent_id: row.get(1)?,
                    activity_type,
                    message: row.get(3)?,
                    details: row.get(4)?,
                    timestamp: timestamp_str.parse().unwrap_or_else(|_| Utc::now()),
                })
            })?
        };

        activities.collect::<Result<Vec<_>, _>>()
    }

    pub fn create_activity(&self, activity: &Activity) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO activities (id, agent_id, activity_type, message, details, timestamp)
             VALUES (?, ?, ?, ?, ?, ?)",
            params![
                activity.id,
                activity.agent_id,
                activity.activity_type.as_str(),
                activity.message,
                activity.details,
                activity.timestamp.to_rfc3339(),
            ],
        )?;
        Ok(())
    }

    pub fn create_task(&self, task: &Task) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO tasks (id, agent_id, description, status, created_at, completed_at)
             VALUES (?, ?, ?, ?, ?, ?)",
            params![
                task.id,
                task.agent_id,
                task.description,
                task.status,
                task.created_at.to_rfc3339(),
                task.completed_at.map(|dt| dt.to_rfc3339()),
            ],
        )?;
        Ok(())
    }

    pub fn get_tasks(&self, agent_id: &str) -> SqliteResult<Vec<Task>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, agent_id, description, status, created_at, completed_at 
             FROM tasks WHERE agent_id = ? ORDER BY created_at DESC"
        )?;

        let tasks = stmt.query_map(params![agent_id], |row| {
            let created_at_str: String = row.get(4)?;
            let completed_at_str: Option<String> = row.get(5)?;
            
            Ok(Task {
                id: row.get(0)?,
                agent_id: row.get(1)?,
                description: row.get(2)?,
                status: row.get(3)?,
                created_at: created_at_str.parse().unwrap_or_else(|_| Utc::now()),
                completed_at: completed_at_str.and_then(|s| s.parse().ok()),
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        Ok(tasks)
    }

    pub fn get_agent_stats(&self) -> SqliteResult<AgentStats> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running,
                SUM(CASE WHEN status = 'idle' THEN 1 ELSE 0 END) as idle,
                SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error
             FROM agents"
        )?;

        let stats = stmt.query_row([], |row| {
            Ok(AgentStats {
                total_agents: row.get(0)?,
                running: row.get(1)?,
                idle: row.get(2)?,
                error: row.get(3)?,
            })
        })?;

        Ok(stats)
    }
}
