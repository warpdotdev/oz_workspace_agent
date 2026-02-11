use crate::agent::Agent;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct StorageData {
    pub agents: Vec<Agent>,
    pub version: String,
}

impl Default for StorageData {
    fn default() -> Self {
        Self {
            agents: Vec::new(),
            version: "0.1.0".to_string(),
        }
    }
}

pub struct Storage {
    path: PathBuf,
}

impl Storage {
    pub fn new() -> Self {
        let path = dirs::data_local_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("agentos")
            .join("data.json");
        Self { path }
    }

    pub fn load(&self) -> StorageData {
        if !self.path.exists() {
            return StorageData::default();
        }

        match fs::read_to_string(&self.path) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
            Err(_) => StorageData::default(),
        }
    }

    pub fn save(&self, data: &StorageData) -> Result<(), std::io::Error> {
        // Ensure directory exists
        if let Some(parent) = self.path.parent() {
            fs::create_dir_all(parent)?;
        }

        let content = serde_json::to_string_pretty(data)?;
        fs::write(&self.path, content)
    }

    pub fn save_agents(&self, agents: &[Agent]) -> Result<(), std::io::Error> {
        let data = StorageData {
            agents: agents.to_vec(),
            version: "0.1.0".to_string(),
        };
        self.save(&data)
    }

    pub fn load_agents(&self) -> Vec<Agent> {
        self.load().agents
    }
}

impl Default for Storage {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_storage_default() {
        let data = StorageData::default();
        assert!(data.agents.is_empty());
        assert_eq!(data.version, "0.1.0");
    }
}
