use crate::db::Database;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

// ── Response wrapper ────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct ApiResponse<T: Serialize> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T: Serialize> ApiResponse<T> {
    pub fn ok(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }
    pub fn err(msg: &str) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(msg.to_string()),
        }
    }
}

// ── Data models (returned to frontend) ──────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub description: String,
    pub status: String,
    pub framework: String,
    pub model: String,
    pub max_tokens: i64,
    pub temperature: f64,
    pub system_prompt: String,
    pub tools: String,
    pub current_task: Option<String>,
    pub tokens_used: i64,
    pub estimated_cost: f64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentFile {
    pub id: String,
    pub agent_id: String,
    pub name: String,
    pub path: String,
    pub file_type: String,
    pub content: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Schedule {
    pub id: String,
    pub agent_id: String,
    pub name: String,
    pub cron_expression: String,
    pub timezone: String,
    pub enabled: bool,
    pub last_run_at: Option<String>,
    pub next_run_at: Option<String>,
    pub description: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Environment {
    pub id: String,
    pub agent_id: String,
    pub name: String,
    pub env_type: String,
    pub variables: String,
    pub docker_image: Option<String>,
    pub status: String,
    pub deployed_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiKey {
    pub id: String,
    pub agent_id: String,
    pub name: String,
    pub key_prefix: String,
    pub permissions: String,
    pub expires_at: Option<String>,
    pub last_used_at: Option<String>,
    pub is_active: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditLogEntry {
    pub id: String,
    pub agent_id: Option<String>,
    pub action: String,
    pub entity_type: String,
    pub entity_id: String,
    pub details: String,
    pub performed_by: String,
    pub created_at: String,
}

// ── Input types ─────────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAgentInput {
    pub name: String,
    pub description: Option<String>,
    pub framework: Option<String>,
    pub model: Option<String>,
    pub system_prompt: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAgentInput {
    pub name: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub framework: Option<String>,
    pub model: Option<String>,
    pub max_tokens: Option<i64>,
    pub temperature: Option<f64>,
    pub system_prompt: Option<String>,
    pub tools: Option<String>,
    pub current_task: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateFileInput {
    pub agent_id: String,
    pub name: String,
    pub path: String,
    pub file_type: Option<String>,
    pub content: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFileInput {
    pub name: Option<String>,
    pub content: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateScheduleInput {
    pub agent_id: String,
    pub name: String,
    pub cron_expression: String,
    pub timezone: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateScheduleInput {
    pub name: Option<String>,
    pub cron_expression: Option<String>,
    pub timezone: Option<String>,
    pub enabled: Option<bool>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateEnvironmentInput {
    pub agent_id: String,
    pub name: String,
    pub env_type: Option<String>,
    pub variables: Option<String>,
    pub docker_image: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateEnvironmentInput {
    pub name: Option<String>,
    pub env_type: Option<String>,
    pub variables: Option<String>,
    pub docker_image: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateApiKeyInput {
    pub agent_id: String,
    pub name: String,
    pub key_hash: String,
    pub key_prefix: String,
    pub permissions: Option<String>,
    pub expires_at: Option<String>,
}

// ── Helper: audit logging ───────────────────────────────────────────────

fn log_audit(
    db: &Database,
    agent_id: Option<&str>,
    action: &str,
    entity_type: &str,
    entity_id: &str,
    details: &str,
) {
    let conn = db.conn.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO audit_log (id, agent_id, action, entity_type, entity_id, details) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, agent_id, action, entity_type, entity_id, details],
    )
    .ok();
}

// ══════════════════════════════════════════════════════════════════════════
// AGENTS
// ══════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub fn list_agents(db: State<Database>) -> ApiResponse<Vec<Agent>> {
    let conn = db.conn.lock().unwrap();
    let mut stmt = match conn.prepare(
        "SELECT id, name, description, status, framework, model, max_tokens, temperature, system_prompt, tools, current_task, tokens_used, estimated_cost, created_at, updated_at FROM agents ORDER BY created_at DESC",
    ) {
        Ok(s) => s,
        Err(e) => return ApiResponse::err(&e.to_string()),
    };
    let rows = stmt.query_map([], |row| {
        Ok(Agent {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            status: row.get(3)?,
            framework: row.get(4)?,
            model: row.get(5)?,
            max_tokens: row.get(6)?,
            temperature: row.get(7)?,
            system_prompt: row.get(8)?,
            tools: row.get(9)?,
            current_task: row.get(10)?,
            tokens_used: row.get(11)?,
            estimated_cost: row.get(12)?,
            created_at: row.get(13)?,
            updated_at: row.get(14)?,
        })
    });
    match rows {
        Ok(iter) => {
            let agents: Vec<Agent> = iter.filter_map(|r| r.ok()).collect();
            ApiResponse::ok(agents)
        }
        Err(e) => ApiResponse::err(&e.to_string()),
    }
}

#[tauri::command]
pub fn get_agent(db: State<Database>, id: String) -> ApiResponse<Agent> {
    let conn = db.conn.lock().unwrap();
    let result = conn.query_row(
        "SELECT id, name, description, status, framework, model, max_tokens, temperature, system_prompt, tools, current_task, tokens_used, estimated_cost, created_at, updated_at FROM agents WHERE id = ?1",
        params![id],
        |row| {
            Ok(Agent {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                status: row.get(3)?,
                framework: row.get(4)?,
                model: row.get(5)?,
                max_tokens: row.get(6)?,
                temperature: row.get(7)?,
                system_prompt: row.get(8)?,
                tools: row.get(9)?,
                current_task: row.get(10)?,
                tokens_used: row.get(11)?,
                estimated_cost: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            })
        },
    );
    match result {
        Ok(agent) => ApiResponse::ok(agent),
        Err(e) => ApiResponse::err(&e.to_string()),
    }
}

#[tauri::command]
pub fn create_agent(db: State<Database>, input: CreateAgentInput) -> ApiResponse<Agent> {
    let id = Uuid::new_v4().to_string();
    let conn = db.conn.lock().unwrap();
    let result = conn.execute(
        "INSERT INTO agents (id, name, description, framework, model, system_prompt) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            id,
            input.name,
            input.description.unwrap_or_default(),
            input.framework.unwrap_or_else(|| "custom".to_string()),
            input.model.unwrap_or_else(|| "gpt-4-turbo".to_string()),
            input.system_prompt.unwrap_or_else(|| "You are a helpful AI assistant.".to_string()),
        ],
    );
    drop(conn);
    match result {
        Ok(_) => {
            log_audit(&db, Some(&id), "create", "agent", &id, "{}");
            get_agent(db, id)
        }
        Err(e) => ApiResponse::err(&e.to_string()),
    }
}

#[tauri::command]
pub fn update_agent(
    db: State<Database>,
    id: String,
    input: UpdateAgentInput,
) -> ApiResponse<Agent> {
    let conn = db.conn.lock().unwrap();
    let mut sets: Vec<String> = vec![];
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = vec![];

    macro_rules! push_field {
        ($field:expr, $col:expr) => {
            if let Some(val) = $field {
                sets.push(format!("{} = ?{}", $col, values.len() + 1));
                values.push(Box::new(val));
            }
        };
    }

    push_field!(input.name, "name");
    push_field!(input.description, "description");
    push_field!(input.status, "status");
    push_field!(input.framework, "framework");
    push_field!(input.model, "model");
    push_field!(input.max_tokens, "max_tokens");
    push_field!(input.temperature, "temperature");
    push_field!(input.system_prompt, "system_prompt");
    push_field!(input.tools, "tools");
    push_field!(input.current_task, "current_task");

    if sets.is_empty() {
        drop(conn);
        return get_agent(db, id);
    }

    sets.push(format!("updated_at = datetime('now')"));
    let sql = format!("UPDATE agents SET {} WHERE id = ?{}", sets.join(", "), values.len() + 1);
    values.push(Box::new(id.clone()));

    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|b| b.as_ref()).collect();
    let result = conn.execute(&sql, params_refs.as_slice());
    drop(conn);

    match result {
        Ok(_) => {
            log_audit(&db, Some(&id), "update", "agent", &id, "{}");
            get_agent(db, id)
        }
        Err(e) => ApiResponse::err(&e.to_string()),
    }
}

#[tauri::command]
pub fn delete_agent(db: State<Database>, id: String) -> ApiResponse<bool> {
    let conn = db.conn.lock().unwrap();
    let result = conn.execute("DELETE FROM agents WHERE id = ?1", params![id]);
    drop(conn);
    match result {
        Ok(count) if count > 0 => {
            log_audit(&db, Some(&id), "delete", "agent", &id, "{}");
            ApiResponse::ok(true)
        }
        Ok(_) => ApiResponse::err("Agent not found"),
        Err(e) => ApiResponse::err(&e.to_string()),
    }
}

// ══════════════════════════════════════════════════════════════════════════
// FILES
// ══════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub fn list_files(db: State<Database>, agent_id: String) -> ApiResponse<Vec<AgentFile>> {
    let conn = db.conn.lock().unwrap();
    let mut stmt = match conn.prepare(
        "SELECT id, agent_id, name, path, file_type, content, created_at, updated_at FROM files WHERE agent_id = ?1 ORDER BY path ASC",
    ) {
        Ok(s) => s,
        Err(e) => return ApiResponse::err(&e.to_string()),
    };
    let rows = stmt.query_map(params![agent_id], |row| {
        Ok(AgentFile {
            id: row.get(0)?,
            agent_id: row.get(1)?,
            name: row.get(2)?,
            path: row.get(3)?,
            file_type: row.get(4)?,
            content: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        })
    });
    match rows {
        Ok(iter) => ApiResponse::ok(iter.filter_map(|r| r.ok()).collect()),
        Err(e) => ApiResponse::err(&e.to_string()),
    }
}

#[tauri::command]
pub fn create_file(db: State<Database>, input: CreateFileInput) -> ApiResponse<AgentFile> {
    let id = Uuid::new_v4().to_string();
    let conn = db.conn.lock().unwrap();
    let result = conn.execute(
        "INSERT INTO files (id, agent_id, name, path, file_type, content) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            id,
            input.agent_id,
            input.name,
            input.path,
            input.file_type.unwrap_or_else(|| "markdown".to_string()),
            input.content.unwrap_or_default(),
        ],
    );
    drop(conn);
    match result {
        Ok(_) => {
            log_audit(&db, Some(&input.agent_id), "create", "file", &id, "{}");
            // Re-query to get the created file
            let conn = db.conn.lock().unwrap();
            let file = conn.query_row(
                "SELECT id, agent_id, name, path, file_type, content, created_at, updated_at FROM files WHERE id = ?1",
                params![id],
                |row| Ok(AgentFile {
                    id: row.get(0)?,
                    agent_id: row.get(1)?,
                    name: row.get(2)?,
                    path: row.get(3)?,
                    file_type: row.get(4)?,
                    content: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                }),
            );
            match file {
                Ok(f) => ApiResponse::ok(f),
                Err(e) => ApiResponse::err(&e.to_string()),
            }
        }
        Err(e) => ApiResponse::err(&e.to_string()),
    }
}

#[tauri::command]
pub fn update_file(
    db: State<Database>,
    id: String,
    input: UpdateFileInput,
) -> ApiResponse<AgentFile> {
    let conn = db.conn.lock().unwrap();
    let mut sets: Vec<String> = vec![];
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = vec![];

    if let Some(name) = input.name {
        sets.push(format!("name = ?{}", values.len() + 1));
        values.push(Box::new(name));
    }
    if let Some(content) = input.content {
        sets.push(format!("content = ?{}", values.len() + 1));
        values.push(Box::new(content));
    }

    if sets.is_empty() {
        drop(conn);
        let conn = db.conn.lock().unwrap();
        let file = conn.query_row(
            "SELECT id, agent_id, name, path, file_type, content, created_at, updated_at FROM files WHERE id = ?1",
            params![id],
            |row| Ok(AgentFile {
                id: row.get(0)?,
                agent_id: row.get(1)?,
                name: row.get(2)?,
                path: row.get(3)?,
                file_type: row.get(4)?,
                content: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            }),
        );
        return match file {
            Ok(f) => ApiResponse::ok(f),
            Err(e) => ApiResponse::err(&e.to_string()),
        };
    }

    sets.push(format!("updated_at = datetime('now')"));
    let sql = format!("UPDATE files SET {} WHERE id = ?{}", sets.join(", "), values.len() + 1);
    values.push(Box::new(id.clone()));

    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|b| b.as_ref()).collect();
    let result = conn.execute(&sql, params_refs.as_slice());
    drop(conn);

    match result {
        Ok(_) => {
            let conn = db.conn.lock().unwrap();
            let file = conn.query_row(
                "SELECT id, agent_id, name, path, file_type, content, created_at, updated_at FROM files WHERE id = ?1",
                params![id],
                |row| Ok(AgentFile {
                    id: row.get(0)?,
                    agent_id: row.get(1)?,
                    name: row.get(2)?,
                    path: row.get(3)?,
                    file_type: row.get(4)?,
                    content: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                }),
            );
            match file {
                Ok(f) => ApiResponse::ok(f),
                Err(e) => ApiResponse::err(&e.to_string()),
            }
        }
        Err(e) => ApiResponse::err(&e.to_string()),
    }
}

#[tauri::command]
pub fn delete_file(db: State<Database>, id: String) -> ApiResponse<bool> {
    let conn = db.conn.lock().unwrap();
    let result = conn.execute("DELETE FROM files WHERE id = ?1", params![id]);
    match result {
        Ok(count) if count > 0 => ApiResponse::ok(true),
        Ok(_) => ApiResponse::err("File not found"),
        Err(e) => ApiResponse::err(&e.to_string()),
    }
}

// ══════════════════════════════════════════════════════════════════════════
// SCHEDULES
// ══════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub fn list_schedules(db: State<Database>, agent_id: String) -> ApiResponse<Vec<Schedule>> {
    let conn = db.conn.lock().unwrap();
    let mut stmt = match conn.prepare(
        "SELECT id, agent_id, name, cron_expression, timezone, enabled, last_run_at, next_run_at, description, created_at, updated_at FROM schedules WHERE agent_id = ?1 ORDER BY created_at DESC",
    ) {
        Ok(s) => s,
        Err(e) => return ApiResponse::err(&e.to_string()),
    };
    let rows = stmt.query_map(params![agent_id], |row| {
        Ok(Schedule {
            id: row.get(0)?,
            agent_id: row.get(1)?,
            name: row.get(2)?,
            cron_expression: row.get(3)?,
            timezone: row.get(4)?,
            enabled: row.get(5)?,
            last_run_at: row.get(6)?,
            next_run_at: row.get(7)?,
            description: row.get(8)?,
            created_at: row.get(9)?,
            updated_at: row.get(10)?,
        })
    });
    match rows {
        Ok(iter) => ApiResponse::ok(iter.filter_map(|r| r.ok()).collect()),
        Err(e) => ApiResponse::err(&e.to_string()),
    }
}

#[tauri::command]
pub fn create_schedule(db: State<Database>, input: CreateScheduleInput) -> ApiResponse<Schedule> {
    let id = Uuid::new_v4().to_string();
    let conn = db.conn.lock().unwrap();
    let result = conn.execute(
        "INSERT INTO schedules (id, agent_id, name, cron_expression, timezone, description) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            id,
            input.agent_id,
            input.name,
            input.cron_expression,
            input.timezone.unwrap_or_else(|| "UTC".to_string()),
            input.description.unwrap_or_default(),
        ],
    );
    drop(conn);
    match result {
        Ok(_) => {
            log_audit(&db, Some(&input.agent_id), "create", "schedule", &id, "{}");
            let conn = db.conn.lock().unwrap();
            let schedule = conn.query_row(
                "SELECT id, agent_id, name, cron_expression, timezone, enabled, last_run_at, next_run_at, description, created_at, updated_at FROM schedules WHERE id = ?1",
                params![id],
                |row| Ok(Schedule {
                    id: row.get(0)?,
                    agent_id: row.get(1)?,
                    name: row.get(2)?,
                    cron_expression: row.get(3)?,
                    timezone: row.get(4)?,
                    enabled: row.get(5)?,
                    last_run_at: row.get(6)?,
                    next_run_at: row.get(7)?,
                    description: row.get(8)?,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                }),
            );
            match schedule {
                Ok(s) => ApiResponse::ok(s),
                Err(e) => ApiResponse::err(&e.to_string()),
            }
        }
        Err(e) => ApiResponse::err(&e.to_string()),
    }
}

#[tauri::command]
pub fn update_schedule(
    db: State<Database>,
    id: String,
    input: UpdateScheduleInput,
) -> ApiResponse<Schedule> {
    let conn = db.conn.lock().unwrap();
    let mut sets: Vec<String> = vec![];
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = vec![];

    macro_rules! push_field {
        ($field:expr, $col:expr) => {
            if let Some(val) = $field {
                sets.push(format!("{} = ?{}", $col, values.len() + 1));
                values.push(Box::new(val));
            }
        };
    }
    push_field!(input.name, "name");
    push_field!(input.cron_expression, "cron_expression");
    push_field!(input.timezone, "timezone");
    push_field!(input.enabled, "enabled");
    push_field!(input.description, "description");

    if sets.is_empty() {
        drop(conn);
        let conn = db.conn.lock().unwrap();
        let s = conn.query_row(
            "SELECT id, agent_id, name, cron_expression, timezone, enabled, last_run_at, next_run_at, description, created_at, updated_at FROM schedules WHERE id = ?1",
            params![id],
            |row| Ok(Schedule {
                id: row.get(0)?, agent_id: row.get(1)?, name: row.get(2)?, cron_expression: row.get(3)?,
                timezone: row.get(4)?, enabled: row.get(5)?, last_run_at: row.get(6)?, next_run_at: row.get(7)?,
                description: row.get(8)?, created_at: row.get(9)?, updated_at: row.get(10)?,
            }),
        );
        return match s { Ok(s) => ApiResponse::ok(s), Err(e) => ApiResponse::err(&e.to_string()) };
    }

    sets.push(format!("updated_at = datetime('now')"));
    let sql = format!("UPDATE schedules SET {} WHERE id = ?{}", sets.join(", "), values.len() + 1);
    values.push(Box::new(id.clone()));
    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|b| b.as_ref()).collect();
    let result = conn.execute(&sql, params_refs.as_slice());
    drop(conn);

    match result {
        Ok(_) => {
            let conn = db.conn.lock().unwrap();
            let s = conn.query_row(
                "SELECT id, agent_id, name, cron_expression, timezone, enabled, last_run_at, next_run_at, description, created_at, updated_at FROM schedules WHERE id = ?1",
                params![id],
                |row| Ok(Schedule {
                    id: row.get(0)?, agent_id: row.get(1)?, name: row.get(2)?, cron_expression: row.get(3)?,
                    timezone: row.get(4)?, enabled: row.get(5)?, last_run_at: row.get(6)?, next_run_at: row.get(7)?,
                    description: row.get(8)?, created_at: row.get(9)?, updated_at: row.get(10)?,
                }),
            );
            match s { Ok(s) => ApiResponse::ok(s), Err(e) => ApiResponse::err(&e.to_string()) }
        }
        Err(e) => ApiResponse::err(&e.to_string()),
    }
}

#[tauri::command]
pub fn delete_schedule(db: State<Database>, id: String) -> ApiResponse<bool> {
    let conn = db.conn.lock().unwrap();
    match conn.execute("DELETE FROM schedules WHERE id = ?1", params![id]) {
        Ok(count) if count > 0 => ApiResponse::ok(true),
        Ok(_) => ApiResponse::err("Schedule not found"),
        Err(e) => ApiResponse::err(&e.to_string()),
    }
}

// ══════════════════════════════════════════════════════════════════════════
// ENVIRONMENTS
// ══════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub fn list_environments(db: State<Database>, agent_id: String) -> ApiResponse<Vec<Environment>> {
    let conn = db.conn.lock().unwrap();
    let mut stmt = match conn.prepare(
        "SELECT id, agent_id, name, env_type, variables, docker_image, status, deployed_at, created_at, updated_at FROM environments WHERE agent_id = ?1 ORDER BY created_at ASC",
    ) {
        Ok(s) => s,
        Err(e) => return ApiResponse::err(&e.to_string()),
    };
    let rows = stmt.query_map(params![agent_id], |row| {
        Ok(Environment {
            id: row.get(0)?,
            agent_id: row.get(1)?,
            name: row.get(2)?,
            env_type: row.get(3)?,
            variables: row.get(4)?,
            docker_image: row.get(5)?,
            status: row.get(6)?,
            deployed_at: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
        })
    });
    match rows {
        Ok(iter) => ApiResponse::ok(iter.filter_map(|r| r.ok()).collect()),
        Err(e) => ApiResponse::err(&e.to_string()),
    }
}

#[tauri::command]
pub fn create_environment(db: State<Database>, input: CreateEnvironmentInput) -> ApiResponse<Environment> {
    let id = Uuid::new_v4().to_string();
    let conn = db.conn.lock().unwrap();
    let result = conn.execute(
        "INSERT INTO environments (id, agent_id, name, env_type, variables, docker_image) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            id,
            input.agent_id,
            input.name,
            input.env_type.unwrap_or_else(|| "development".to_string()),
            input.variables.unwrap_or_else(|| "{}".to_string()),
            input.docker_image,
        ],
    );
    drop(conn);
    match result {
        Ok(_) => {
            log_audit(&db, Some(&input.agent_id), "create", "environment", &id, "{}");
            let conn = db.conn.lock().unwrap();
            let env = conn.query_row(
                "SELECT id, agent_id, name, env_type, variables, docker_image, status, deployed_at, created_at, updated_at FROM environments WHERE id = ?1",
                params![id],
                |row| Ok(Environment {
                    id: row.get(0)?, agent_id: row.get(1)?, name: row.get(2)?, env_type: row.get(3)?,
                    variables: row.get(4)?, docker_image: row.get(5)?, status: row.get(6)?,
                    deployed_at: row.get(7)?, created_at: row.get(8)?, updated_at: row.get(9)?,
                }),
            );
            match env { Ok(e) => ApiResponse::ok(e), Err(e) => ApiResponse::err(&e.to_string()) }
        }
        Err(e) => ApiResponse::err(&e.to_string()),
    }
}

#[tauri::command]
pub fn update_environment(db: State<Database>, id: String, input: UpdateEnvironmentInput) -> ApiResponse<Environment> {
    let conn = db.conn.lock().unwrap();
    let mut sets: Vec<String> = vec![];
    let mut values: Vec<Box<dyn rusqlite::types::ToSql>> = vec![];

    macro_rules! push_field {
        ($field:expr, $col:expr) => {
            if let Some(val) = $field {
                sets.push(format!("{} = ?{}", $col, values.len() + 1));
                values.push(Box::new(val));
            }
        };
    }
    push_field!(input.name, "name");
    push_field!(input.env_type, "env_type");
    push_field!(input.variables, "variables");
    push_field!(input.docker_image, "docker_image");
    push_field!(input.status, "status");

    if sets.is_empty() {
        drop(conn);
        let conn = db.conn.lock().unwrap();
        let env = conn.query_row(
            "SELECT id, agent_id, name, env_type, variables, docker_image, status, deployed_at, created_at, updated_at FROM environments WHERE id = ?1",
            params![id],
            |row| Ok(Environment {
                id: row.get(0)?, agent_id: row.get(1)?, name: row.get(2)?, env_type: row.get(3)?,
                variables: row.get(4)?, docker_image: row.get(5)?, status: row.get(6)?,
                deployed_at: row.get(7)?, created_at: row.get(8)?, updated_at: row.get(9)?,
            }),
        );
        return match env { Ok(e) => ApiResponse::ok(e), Err(e) => ApiResponse::err(&e.to_string()) };
    }

    sets.push(format!("updated_at = datetime('now')"));
    let sql = format!("UPDATE environments SET {} WHERE id = ?{}", sets.join(", "), values.len() + 1);
    values.push(Box::new(id.clone()));
    let params_refs: Vec<&dyn rusqlite::types::ToSql> = values.iter().map(|b| b.as_ref()).collect();
    let result = conn.execute(&sql, params_refs.as_slice());
    drop(conn);

    match result {
        Ok(_) => {
            let conn = db.conn.lock().unwrap();
            let env = conn.query_row(
                "SELECT id, agent_id, name, env_type, variables, docker_image, status, deployed_at, created_at, updated_at FROM environments WHERE id = ?1",
                params![id],
                |row| Ok(Environment {
                    id: row.get(0)?, agent_id: row.get(1)?, name: row.get(2)?, env_type: row.get(3)?,
                    variables: row.get(4)?, docker_image: row.get(5)?, status: row.get(6)?,
                    deployed_at: row.get(7)?, created_at: row.get(8)?, updated_at: row.get(9)?,
                }),
            );
            match env { Ok(e) => ApiResponse::ok(e), Err(e) => ApiResponse::err(&e.to_string()) }
        }
        Err(e) => ApiResponse::err(&e.to_string()),
    }
}

#[tauri::command]
pub fn delete_environment(db: State<Database>, id: String) -> ApiResponse<bool> {
    let conn = db.conn.lock().unwrap();
    match conn.execute("DELETE FROM environments WHERE id = ?1", params![id]) {
        Ok(count) if count > 0 => ApiResponse::ok(true),
        Ok(_) => ApiResponse::err("Environment not found"),
        Err(e) => ApiResponse::err(&e.to_string()),
    }
}

// ══════════════════════════════════════════════════════════════════════════
// API KEYS
// ══════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub fn list_api_keys(db: State<Database>, agent_id: String) -> ApiResponse<Vec<ApiKey>> {
    let conn = db.conn.lock().unwrap();
    let mut stmt = match conn.prepare(
        "SELECT id, agent_id, name, key_prefix, permissions, expires_at, last_used_at, is_active, created_at FROM api_keys WHERE agent_id = ?1 ORDER BY created_at DESC",
    ) {
        Ok(s) => s,
        Err(e) => return ApiResponse::err(&e.to_string()),
    };
    let rows = stmt.query_map(params![agent_id], |row| {
        Ok(ApiKey {
            id: row.get(0)?,
            agent_id: row.get(1)?,
            name: row.get(2)?,
            key_prefix: row.get(3)?,
            permissions: row.get(4)?,
            expires_at: row.get(5)?,
            last_used_at: row.get(6)?,
            is_active: row.get(7)?,
            created_at: row.get(8)?,
        })
    });
    match rows {
        Ok(iter) => ApiResponse::ok(iter.filter_map(|r| r.ok()).collect()),
        Err(e) => ApiResponse::err(&e.to_string()),
    }
}

#[tauri::command]
pub fn create_api_key(db: State<Database>, input: CreateApiKeyInput) -> ApiResponse<ApiKey> {
    let id = Uuid::new_v4().to_string();
    let conn = db.conn.lock().unwrap();
    let result = conn.execute(
        "INSERT INTO api_keys (id, agent_id, name, key_hash, key_prefix, permissions, expires_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            id,
            input.agent_id,
            input.name,
            input.key_hash,
            input.key_prefix,
            input.permissions.unwrap_or_else(|| "[]".to_string()),
            input.expires_at,
        ],
    );
    drop(conn);
    match result {
        Ok(_) => {
            log_audit(&db, Some(&input.agent_id), "create", "api_key", &id, "{}");
            let conn = db.conn.lock().unwrap();
            let key = conn.query_row(
                "SELECT id, agent_id, name, key_prefix, permissions, expires_at, last_used_at, is_active, created_at FROM api_keys WHERE id = ?1",
                params![id],
                |row| Ok(ApiKey {
                    id: row.get(0)?, agent_id: row.get(1)?, name: row.get(2)?, key_prefix: row.get(3)?,
                    permissions: row.get(4)?, expires_at: row.get(5)?, last_used_at: row.get(6)?,
                    is_active: row.get(7)?, created_at: row.get(8)?,
                }),
            );
            match key { Ok(k) => ApiResponse::ok(k), Err(e) => ApiResponse::err(&e.to_string()) }
        }
        Err(e) => ApiResponse::err(&e.to_string()),
    }
}

#[tauri::command]
pub fn revoke_api_key(db: State<Database>, id: String) -> ApiResponse<bool> {
    let conn = db.conn.lock().unwrap();
    match conn.execute("UPDATE api_keys SET is_active = 0 WHERE id = ?1", params![id]) {
        Ok(count) if count > 0 => {
            drop(conn);
            log_audit(&db, None, "revoke", "api_key", &id, "{}");
            ApiResponse::ok(true)
        }
        Ok(_) => ApiResponse::err("API key not found"),
        Err(e) => ApiResponse::err(&e.to_string()),
    }
}

#[tauri::command]
pub fn delete_api_key(db: State<Database>, id: String) -> ApiResponse<bool> {
    let conn = db.conn.lock().unwrap();
    match conn.execute("DELETE FROM api_keys WHERE id = ?1", params![id]) {
        Ok(count) if count > 0 => ApiResponse::ok(true),
        Ok(_) => ApiResponse::err("API key not found"),
        Err(e) => ApiResponse::err(&e.to_string()),
    }
}

// ══════════════════════════════════════════════════════════════════════════
// AUDIT LOG
// ══════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub fn list_audit_log(
    db: State<Database>,
    agent_id: Option<String>,
    limit: Option<u32>,
) -> ApiResponse<Vec<AuditLogEntry>> {
    let conn = db.conn.lock().unwrap();
    let limit = limit.unwrap_or(100);

    let (sql, params_vec): (String, Vec<Box<dyn rusqlite::types::ToSql>>) = match agent_id {
        Some(ref aid) => (
            "SELECT id, agent_id, action, entity_type, entity_id, details, performed_by, created_at FROM audit_log WHERE agent_id = ?1 ORDER BY created_at DESC LIMIT ?2".to_string(),
            vec![Box::new(aid.clone()) as Box<dyn rusqlite::types::ToSql>, Box::new(limit)],
        ),
        None => (
            "SELECT id, agent_id, action, entity_type, entity_id, details, performed_by, created_at FROM audit_log ORDER BY created_at DESC LIMIT ?1".to_string(),
            vec![Box::new(limit) as Box<dyn rusqlite::types::ToSql>],
        ),
    };

    let params_refs: Vec<&dyn rusqlite::types::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();
    let mut stmt = match conn.prepare(&sql) {
        Ok(s) => s,
        Err(e) => return ApiResponse::err(&e.to_string()),
    };
    let rows = stmt.query_map(params_refs.as_slice(), |row| {
        Ok(AuditLogEntry {
            id: row.get(0)?,
            agent_id: row.get(1)?,
            action: row.get(2)?,
            entity_type: row.get(3)?,
            entity_id: row.get(4)?,
            details: row.get(5)?,
            performed_by: row.get(6)?,
            created_at: row.get(7)?,
        })
    });
    match rows {
        Ok(iter) => ApiResponse::ok(iter.filter_map(|r| r.ok()).collect()),
        Err(e) => ApiResponse::err(&e.to_string()),
    }
}
