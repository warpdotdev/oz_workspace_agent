/// Mock agent service for simulating agent responses
/// This will be replaced with real framework integrations in v1

use std::collections::HashMap;

pub struct MockAgentService {
    responses: HashMap<String, Vec<String>>,
}

impl MockAgentService {
    pub fn new() -> Self {
        let mut responses = HashMap::new();
        
        // Research-related responses
        responses.insert("research".to_string(), vec![
            "Analyzed 25 documents and identified 3 key themes: market trends, competitor analysis, and user feedback patterns.".to_string(),
            "Research complete. Found 12 relevant citations supporting the hypothesis. Summary report generated.".to_string(),
            "Completed literature review. Synthesized findings from 18 papers into actionable insights.".to_string(),
        ]);
        
        // Code-related responses
        responses.insert("code".to_string(), vec![
            "Code review complete. Found 2 potential issues: null pointer risk on line 45, and unused variable on line 72. Suggestions provided.".to_string(),
            "Analysis complete. The function has O(n²) complexity - recommend using a hash map for O(n) performance.".to_string(),
            "Refactoring suggestions ready. Identified 5 opportunities to extract reusable functions.".to_string(),
        ]);
        
        // Data-related responses
        responses.insert("data".to_string(), vec![
            "Pipeline health check complete. All 8 jobs running normally. Average latency: 234ms.".to_string(),
            "Data quality report generated. 99.7% accuracy across 1.2M records. 3 anomalies flagged for review.".to_string(),
            "ETL optimization complete. Processing time reduced by 40% through parallel execution.".to_string(),
        ]);
        
        // Default responses
        responses.insert("default".to_string(), vec![
            "Task completed successfully. Results are ready for review.".to_string(),
            "Processing complete. Generated output based on the provided instructions.".to_string(),
            "Analysis finished. Key findings have been compiled and are available.".to_string(),
        ]);

        Self { responses }
    }

    pub fn process_task(&self, instruction: &str) -> String {
        let instruction_lower = instruction.to_lowercase();
        
        let category = if instruction_lower.contains("research") || instruction_lower.contains("analyze") || instruction_lower.contains("review document") {
            "research"
        } else if instruction_lower.contains("code") || instruction_lower.contains("review") || instruction_lower.contains("refactor") {
            "code"
        } else if instruction_lower.contains("data") || instruction_lower.contains("pipeline") || instruction_lower.contains("etl") {
            "data"
        } else {
            "default"
        };

        let responses = self.responses.get(category).unwrap_or(
            self.responses.get("default").unwrap()
        );
        
        // Simple rotation based on instruction length to add variety
        let index = instruction.len() % responses.len();
        responses[index].clone()
    }
}

impl Default for MockAgentService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_research_task() {
        let service = MockAgentService::new();
        let result = service.process_task("Please research the market trends");
        assert!(result.contains("document") || result.contains("Research") || result.contains("literature"));
    }

    #[test]
    fn test_code_task() {
        let service = MockAgentService::new();
        let result = service.process_task("Review this code for issues");
        assert!(result.contains("Code") || result.contains("Analysis") || result.contains("Refactoring"));
    }

    #[test]
    fn test_default_task() {
        let service = MockAgentService::new();
        let result = service.process_task("Do something random");
        assert!(result.contains("Task") || result.contains("Processing") || result.contains("Analysis"));
    }
}
