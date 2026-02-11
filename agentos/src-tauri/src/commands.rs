use tauri::State;
use std::sync::Arc;
use chrono::Utc;

use crate::models::{
    Agent, AgentConfig, AgentEvent, AgentStatus, EventType, Task, TaskStatus,
    CreateAgentRequest, UpdateAgentRequest, DispatchTaskRequest,
};
use crate::storage::Storage;
use crate::mock::MockAgentService;

/// Application state shared across commands
pub struct AppState {
    pub storage: Arc<Storage>,
    pub mock_service: Arc<MockAgentService>,
}

// Error type for command results
#[derive(Debug, serde::Serialize)]
pub struct CommandError {
    pub message: String,
}

impl From<crate::storage::StorageError> for CommandError {
    fn from(e: crate::storage::StorageError) -> Self {
        CommandError {
            message: e.to_string(),
        }
    }
}

type CommandResult<T> = Result<T, CommandError>;

// Agent commands

#[tauri::command]
pub fn get_agents(state: State<AppState>) -> CommandResult<Vec<Agent>> {
    let configs = state.storage.list_agents()?;
    let agents: Vec<Agent> = configs.into_iter().map(Agent::from_config).collect();
    Ok(agents)
}

#[tauri::command]
pub fn get_agent(state: State<AppState>, id: String) -> CommandResult<Agent> {
    let config = state.storage.get_agent(&id)?;
    Ok(Agent::from_config(config))
}

#[tauri::command]
pub fn create_agent(state: State<AppState>, request: CreateAgentRequest) -> CommandResult<Agent> {
    let mut config = AgentConfig::new(
        request.name,
        request.description,
        request.framework,
    );
    
    if let Some(model) = request.model {
        config.model = model;
    }
    if let Some(max_tokens) = request.max_tokens {
        config.max_tokens = max_tokens;
    }
    if let Some(temperature) = request.temperature {
        config.temperature = temperature;
    }
    config.system_prompt = request.system_prompt;
    if let Some(tools) = request.tools {
        config.tools = tools;
    }

    state.storage.create_agent(&config)?;
    
    // Create an event for agent creation
    let event = AgentEvent::new(
        config.id.clone(),
        config.name.clone(),
        EventType::StatusChange,
        format!("Agent '{}' created", config.name),
    );
    let _ = state.storage.create_event(&event);

    Ok(Agent::from_config(config))
}

#[tauri::command]
pub fn update_agent(state: State<AppState>, id: String, request: UpdateAgentRequest) -> CommandResult<Agent> {
    let mut config = state.storage.get_agent(&id)?;
    
    if let Some(name) = request.name {
        config.name = name;
    }
    if let Some(description) = request.description {
        config.description = description;
    }
    if let Some(model) = request.model {
        config.model = model;
    }
    if let Some(max_tokens) = request.max_tokens {
        config.max_tokens = max_tokens;
    }
    if let Some(temperature) = request.temperature {
        config.temperature = temperature;
    }
    if request.system_prompt.is_some() {
        config.system_prompt = request.system_prompt;
    }
    if let Some(tools) = request.tools {
        config.tools = tools;
    }
    config.updated_at = Utc::now().to_rfc3339();

    state.storage.update_agent(&id, &config)?;
    Ok(Agent::from_config(config))
}

#[tauri::command]
pub fn delete_agent(state: State<AppState>, id: String) -> CommandResult<()> {
    let config = state.storage.get_agent(&id)?;
    state.storage.delete_agent(&id)?;
    
    // Create an event for agent deletion
    let event = AgentEvent::new(
        id.clone(),
        config.name.clone(),
        EventType::StatusChange,
        format!("Agent '{}' deleted", config.name),
    );
    let _ = state.storage.create_event(&event);
    
    Ok(())
}

// Task commands

#[tauri::command]
pub fn dispatch_task(state: State<AppState>, request: DispatchTaskRequest) -> CommandResult<Task> {
    // Verify agent exists
    let agent_config = state.storage.get_agent(&request.agent_id)?;
    
    // Create the task
    let mut task = Task::new(request.agent_id.clone(), request.instruction.clone());
    state.storage.create_task(&task)?;
    
    // Create an event for task dispatch
    let event = AgentEvent::new(
        request.agent_id.clone(),
        agent_config.name.clone(),
        EventType::Action,
        format!("Task dispatched: {}", request.instruction),
    );
    let _ = state.storage.create_event(&event);
    
    // Simulate task execution using mock service
    task.status = TaskStatus::Running;
    state.storage.update_task(&task)?;
    
    // Get mock result
    let mock_result = state.mock_service.process_task(&request.instruction);
    
    // Update task with result
    task.status = TaskStatus::Completed;
    task.result = Some(mock_result.clone());
    task.completed_at = Some(Utc::now().to_rfc3339());
    state.storage.update_task(&task)?;
    
    // Create completion event
    let completion_event = AgentEvent::new(
        request.agent_id,
        agent_config.name,
        EventType::TaskComplete,
        format!("Task completed: {}", mock_result),
    );
    let _ = state.storage.create_event(&completion_event);
    
    Ok(task)
}

#[tauri::command]
pub fn get_task(state: State<AppState>, id: String) -> CommandResult<Task> {
    let task = state.storage.get_task(&id)?;
    Ok(task)
}

#[tauri::command]
pub fn get_agent_tasks(state: State<AppState>, agent_id: String) -> CommandResult<Vec<Task>> {
    let tasks = state.storage.list_tasks_for_agent(&agent_id)?;
    Ok(tasks)
}

// Event commands

#[tauri::command]
pub fn get_events(state: State<AppState>, limit: Option<i32>) -> CommandResult<Vec<AgentEvent>> {
    let events = state.storage.list_events(limit)?;
    Ok(events)
}

#[tauri::command]
pub fn get_agent_events(state: State<AppState>, agent_id: String, limit: Option<i32>) -> CommandResult<Vec<AgentEvent>> {
    let events = state.storage.list_events_for_agent(&agent_id, limit)?;
    Ok(events)
}

// Mock data commands for demo purposes

#[tauri::command]
pub fn seed_mock_data(state: State<AppState>) -> CommandResult<Vec<Agent>> {
    // Create some sample agents
    let agents_data = vec![
        ("Research Agent", "Analyzes documents and extracts insights", crate::models::AgentFramework::OpenAI),
        ("Code Review Agent", "Reviews pull requests and suggests improvements", crate::models::AgentFramework::LangChain),
        ("Data Pipeline Agent", "Monitors and manages data processing pipelines", crate::models::AgentFramework::CrewAI),
    ];

    let mut agents = Vec::new();
    for (name, desc, framework) in agents_data {
        let config = AgentConfig::new(name.to_string(), desc.to_string(), framework);
        state.storage.create_agent(&config)?;
        
        // Create initial event
        let event = AgentEvent::new(
            config.id.clone(),
            config.name.clone(),
            EventType::StatusChange,
            format!("Agent '{}' initialized and ready", config.name),
        );
        let _ = state.storage.create_event(&event);
        
        agents.push(Agent::from_config(config));
    }

    // Add some sample events
    if let Some(first_agent) = agents.first() {
        let sample_events = vec![
            (EventType::Thought, "Analyzing input parameters..."),
            (EventType::Action, "Querying knowledge base for relevant context"),
            (EventType::Thought, "Found 15 relevant documents to process"),
            (EventType::Action, "Generating summary from extracted insights"),
        ];

        for (event_type, message) in sample_events {
            let event = AgentEvent::new(
                first_agent.id.clone(),
                first_agent.config.name.clone(),
                event_type,
                message.to_string(),
            );
            let _ = state.storage.create_event(&event);
        }
    }

    Ok(agents)
}
