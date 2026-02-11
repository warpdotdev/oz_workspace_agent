use crate::database::Database;
use crate::models::{Agent, AgentStatus, Activity, ActivityType};
use chrono::{Utc, Duration};
use uuid::Uuid;

pub fn seed_mock_data(db: &Database) -> Result<(), String> {
    // Check if database already has agents
    if let Ok(agents) = db.get_all_agents() {
        if !agents.is_empty() {
            return Ok(()); // Already seeded
        }
    }

    let now = Utc::now();

    // Create mock agents
    let agents = vec![
        Agent {
            id: Uuid::new_v4().to_string(),
            name: "Data Analyzer".to_string(),
            status: AgentStatus::Running,
            current_task: Some("Processing customer data feed".to_string()),
            runtime_seconds: 3600,
            tokens_used: 125000,
            created_at: now - Duration::hours(2),
            updated_at: now - Duration::minutes(5),
        },
        Agent {
            id: Uuid::new_v4().to_string(),
            name: "Code Reviewer".to_string(),
            status: AgentStatus::Idle,
            current_task: None,
            runtime_seconds: 7200,
            tokens_used: 89000,
            created_at: now - Duration::hours(5),
            updated_at: now - Duration::minutes(15),
        },
        Agent {
            id: Uuid::new_v4().to_string(),
            name: "Test Runner".to_string(),
            status: AgentStatus::Running,
            current_task: Some("Running integration test suite".to_string()),
            runtime_seconds: 1800,
            tokens_used: 45000,
            created_at: now - Duration::hours(1),
            updated_at: now - Duration::minutes(2),
        },
        Agent {
            id: Uuid::new_v4().to_string(),
            name: "Documentation Bot".to_string(),
            status: AgentStatus::Error,
            current_task: Some("Failed to generate API docs".to_string()),
            runtime_seconds: 900,
            tokens_used: 12000,
            created_at: now - Duration::minutes(30),
            updated_at: now - Duration::minutes(1),
        },
    ];

    for agent in &agents {
        db.create_agent(agent)
            .map_err(|e| format!("Failed to seed agent: {}", e))?;
    }

    // Create mock activities
    let activities = vec![
        Activity {
            id: Uuid::new_v4().to_string(),
            agent_id: agents[0].id.clone(),
            activity_type: ActivityType::Thought,
            message: "Analyzing data patterns in customer behavior".to_string(),
            details: Some("Found 3 distinct customer segments based on purchase history".to_string()),
            timestamp: now - Duration::minutes(3),
        },
        Activity {
            id: Uuid::new_v4().to_string(),
            agent_id: agents[0].id.clone(),
            activity_type: ActivityType::Status,
            message: "Status changed to running".to_string(),
            details: None,
            timestamp: now - Duration::minutes(10),
        },
        Activity {
            id: Uuid::new_v4().to_string(),
            agent_id: agents[2].id.clone(),
            activity_type: ActivityType::Task,
            message: "Task dispatched: Running integration test suite".to_string(),
            details: None,
            timestamp: now - Duration::minutes(2),
        },
        Activity {
            id: Uuid::new_v4().to_string(),
            agent_id: agents[2].id.clone(),
            activity_type: ActivityType::Thought,
            message: "Executing test suite for payment processing module".to_string(),
            details: Some("Tests: 45/50 passed, 5 skipped".to_string()),
            timestamp: now - Duration::minutes(1),
        },
        Activity {
            id: Uuid::new_v4().to_string(),
            agent_id: agents[3].id.clone(),
            activity_type: ActivityType::Error,
            message: "Failed to access API specification file".to_string(),
            details: Some("Error: FileNotFoundError - openapi.yaml not found in docs/".to_string()),
            timestamp: now - Duration::minutes(1),
        },
        Activity {
            id: Uuid::new_v4().to_string(),
            agent_id: agents[1].id.clone(),
            activity_type: ActivityType::Status,
            message: "Status changed to idle".to_string(),
            details: None,
            timestamp: now - Duration::minutes(15),
        },
    ];

    for activity in &activities {
        db.create_activity(activity)
            .map_err(|e| format!("Failed to seed activity: {}", e))?;
    }

    Ok(())
}
