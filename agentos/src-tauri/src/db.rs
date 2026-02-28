use rusqlite::{params, Connection, Result as SqlResult};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new() -> SqlResult<Self> {
        let db_path = Self::db_path();
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).ok();
        }
        let conn = Connection::open(&db_path)?;
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
        let db = Self {
            conn: Mutex::new(conn),
        };
        db.run_migrations()?;
        Ok(db)
    }

    fn db_path() -> PathBuf {
        dirs::data_local_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("agentos")
            .join("agentos.db")
    }

    fn run_migrations(&self) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS agents (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'idle',
                framework TEXT NOT NULL DEFAULT 'custom',
                model TEXT NOT NULL DEFAULT 'gpt-4-turbo',
                max_tokens INTEGER NOT NULL DEFAULT 4096,
                temperature REAL NOT NULL DEFAULT 0.7,
                system_prompt TEXT NOT NULL DEFAULT 'You are a helpful AI assistant.',
                tools TEXT NOT NULL DEFAULT '[]',
                current_task TEXT,
                tokens_used INTEGER NOT NULL DEFAULT 0,
                estimated_cost REAL NOT NULL DEFAULT 0.0,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS files (
                id TEXT PRIMARY KEY,
                agent_id TEXT NOT NULL,
                name TEXT NOT NULL,
                path TEXT NOT NULL,
                file_type TEXT NOT NULL DEFAULT 'markdown',
                content TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS schedules (
                id TEXT PRIMARY KEY,
                agent_id TEXT NOT NULL,
                name TEXT NOT NULL,
                cron_expression TEXT NOT NULL,
                timezone TEXT NOT NULL DEFAULT 'UTC',
                enabled INTEGER NOT NULL DEFAULT 1,
                last_run_at TEXT,
                next_run_at TEXT,
                description TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS environments (
                id TEXT PRIMARY KEY,
                agent_id TEXT NOT NULL,
                name TEXT NOT NULL,
                env_type TEXT NOT NULL DEFAULT 'development',
                variables TEXT NOT NULL DEFAULT '{}',
                docker_image TEXT,
                status TEXT NOT NULL DEFAULT 'inactive',
                deployed_at TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS api_keys (
                id TEXT PRIMARY KEY,
                agent_id TEXT NOT NULL,
                name TEXT NOT NULL,
                key_hash TEXT NOT NULL,
                key_prefix TEXT NOT NULL,
                permissions TEXT NOT NULL DEFAULT '[]',
                expires_at TEXT,
                last_used_at TEXT,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS audit_log (
                id TEXT PRIMARY KEY,
                agent_id TEXT,
                action TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id TEXT NOT NULL,
                details TEXT NOT NULL DEFAULT '{}',
                performed_by TEXT NOT NULL DEFAULT 'system',
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
            );

            CREATE INDEX IF NOT EXISTS idx_files_agent_id ON files(agent_id);
            CREATE INDEX IF NOT EXISTS idx_schedules_agent_id ON schedules(agent_id);
            CREATE INDEX IF NOT EXISTS idx_environments_agent_id ON environments(agent_id);
            CREATE INDEX IF NOT EXISTS idx_api_keys_agent_id ON api_keys(agent_id);
            CREATE INDEX IF NOT EXISTS idx_audit_log_agent_id ON audit_log(agent_id);
            CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
            ",
        )?;
        Ok(())
    }
}
