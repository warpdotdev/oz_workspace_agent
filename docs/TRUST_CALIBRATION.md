# Trust Calibration System

## Overview

The trust calibration system enables human reviewers to provide feedback on agent decisions, creating a learning loop that improves confidence scoring over time.

## Schema Fields

### Task Model

**Confidence Tracking:**
- `confidenceScore` (0.0-1.0): Agent's confidence in task completion
- `reasoningLog`: Structured log of agent's decision-making process
- `executionSteps`: Step-by-step timeline of task execution
- `requiresReview`: Auto-flagged when confidence < 0.5

**Human Review:**
- `reviewedAt`: Timestamp of human review
- `reviewedById`: User ID who performed review
- `reviewNotes`: Free-text feedback from reviewer
- `wasOverridden`: Boolean flag when human changes agent decision
- `calibrationFeedback`: Structured feedback for confidence model improvement

**Retry Tracking:**
- `firstAttemptAt`: Initial attempt timestamp
- `retryCount`: Number of retry attempts

## UI Display Guidelines (from design-lead)

### Confidence Score Presentation

Never show raw decimals (0.73). Instead use:

**Visual Indicators:**
- High (0.8-1.0): Green dot/ring, minimal prominence
- Medium (0.5-0.79): Amber dot/ring, show reasoning preview
- Low (<0.5): Red dot/ring, prominent review flag

**Semantic Labels:**
```typescript
function getConfidenceLabel(score: number): string {
  if (score >= 0.8) return "High confidence"
  if (score >= 0.5) return "Medium confidence"
  return "Low confidence - Review needed"
}
```

**Contextual Explanations:**
- "Agent is uncertain about this approach"
- "High confidence based on similar past tasks"
- "Low confidence - recommend human verification"

### Reasoning Log Display

**Progressive Disclosure:**
```
[Summary View]
✓ Analyzed requirements
✓ Selected approach: REST API integration
⚠ Uncertainty: rate limiting strategy

[Expandable Detail]
→ Step 1: Analyzed API documentation
→ Step 2: Identified authentication method
→ Step 3: Uncertain about rate limits (confidence: 0.4)
```

**Timeline View for executionSteps:**
```
09:15:23 - Task started
09:15:45 - API endpoint selected
09:16:02 - Authentication configured
09:16:30 - ⚠ Rate limit calculation uncertain
09:16:45 - Task completed (requires review)
```

### Review Interface

**Required Actions:**
- ✓ Approve (agent was correct)
- ✗ Reject (agent was wrong)
- ✎ Modify (agent partially correct)

**Calibration Feedback Structure:**
```json
{
  "reviewAction": "approve" | "reject" | "modify",
  "confidenceAlignment": "accurate" | "overconfident" | "underconfident",
  "specificFeedback": "Free text explanation",
  "correctApproach": "What the agent should have done",
  "confidenceSignal": {
    "agentScore": 0.45,
    "humanAssessment": "should_be_high",
    "reasoning": "Similar pattern to task #1234 which succeeded"
  }
}
```

## Calibration Learning Loops

### Positive Signals (Improve Confidence)
- User approves low-confidence task → Agent was too cautious
- Pattern: Task similar to previously successful tasks
- Update: Increase confidence for this task pattern

### Negative Signals (Reduce Confidence)
- User rejects high-confidence task → Agent was overconfident
- Pattern: Task type with frequent overrides
- Update: Decrease confidence for this task pattern

### Example Calibration Workflow

1. **Agent completes task with low confidence (0.4)**
   - Sets `requiresReview = true`
   - Populates `reasoningLog` with uncertainty points

2. **Human reviewer examines task**
   - Reviews execution steps
   - Reads agent reasoning
   - Decides: "Agent was actually correct"

3. **Human provides calibration feedback:**
```json
{
  "reviewAction": "approve",
  "confidenceAlignment": "underconfident",
  "specificFeedback": "Agent correctly identified the API pattern. This is a standard OAuth2 flow.",
  "confidenceSignal": {
    "agentScore": 0.4,
    "humanAssessment": "should_be_high",
    "reasoning": "Standard pattern, well-documented API"
  }
}
```

4. **System learns:**
   - Future OAuth2 tasks → higher confidence
   - Well-documented APIs → higher confidence
   - This agent's API integration skills → more trusted

## Implementation Notes

### Auto-Review Flagging
```typescript
// In task completion handler
if (confidenceScore < 0.5) {
  task.requiresReview = true
  // Optionally notify human reviewers
}
```

### False Confidence Rate (Trust Metric)
```typescript
// Tasks where agent was confident but wrong
const falseConfidenceRate = tasksWithHighConfidenceAndOverride / totalHighConfidenceTasks
```

### Review Velocity (Trust Metric)
```typescript
// Time from failure to successful retry
const retryVelocity = completedAt - firstAttemptAt
```

## UI Component Recommendations

### ConfidenceBadge Component
```tsx
<ConfidenceBadge 
  score={0.73}
  showLabel={true}
  onReasoningClick={() => showReasoningModal()}
/>
// Renders: [🟡 Medium confidence]
```

### ReviewModal Component
```tsx
<ReviewModal
  task={task}
  onApprove={(feedback) => submitReview('approve', feedback)}
  onReject={(feedback) => submitReview('reject', feedback)}
  onModify={(changes, feedback) => submitReview('modify', feedback, changes)}
/>
```

### CalibrationFeedbackForm
```tsx
<CalibrationFeedbackForm
  agentConfidence={0.45}
  onSubmit={(feedback) => {
    // feedback includes:
    // - confidenceAlignment
    // - specificFeedback
    // - correctApproach (if modified)
  }}
/>
```

## API Endpoints

**Review a task:**
```
PATCH /api/tasks/:id/review
{
  "reviewNotes": "Agent correctly identified the pattern",
  "wasOverridden": false,
  "calibrationFeedback": { ... }
}
```

**Get tasks requiring review:**
```
GET /api/tasks?requiresReview=true
```

**Get trust metrics:**
```
GET /api/metrics/trust
{
  "falseConfidenceRate": 0.12,
  "reviewRate": 0.23,
  "averageRetryVelocity": "4.5 minutes"
}
```

## Best Practices

1. **Make review easy**: Pre-fill likely feedback based on task outcome
2. **Provide context**: Show similar past tasks and their outcomes
3. **Track patterns**: Identify task types with high override rates
4. **Reward accuracy**: Highlight agents with well-calibrated confidence
5. **Progressive improvement**: Use feedback to tune confidence algorithms

## Future Enhancements

- **Confidence prediction model**: ML model trained on calibration feedback
- **Automatic recalibration**: Adjust confidence thresholds based on review patterns
- **Agent-specific confidence**: Per-agent confidence calibration profiles
- **Task similarity matching**: Compare to similar tasks for confidence hints
