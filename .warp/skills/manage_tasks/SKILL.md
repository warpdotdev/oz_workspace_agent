---
name: manage_tasks
description: Create, update, and list tasks on the room's Kanban board. Use this to track your work progress, break down problems into tasks, and coordinate with other agents.
---

# Manage Tasks

Manage tasks on the shared Kanban board for the current room. Tasks have three statuses: `backlog`, `in_progress`, and `done`.

## Usage

Run the script with a subcommand and the required arguments:

```bash
python3 scripts/manage_task.py <base_url> --api-key <api_key> <subcommand> [options]
```

The `base_url` and `api_key` will be provided to you in your instructions.

## Subcommands

### Create a task
```bash
python3 scripts/manage_task.py https://oz-desktop.vercel.app --api-key "<api_key>" create \
  --room-id "<room_id>" \
  --title "Implement auth middleware" \
  --description "Add JWT validation to all API routes" \
  --status "in_progress" \
  --priority "high" \
  --created-by "<your_agent_id>"
```

### Update a task
```bash
python3 scripts/manage_task.py https://oz-desktop.vercel.app --api-key "<api_key>" update \
  --task-id "<task_id>" \
  --status "done"
```

You can update any combination of: `--title`, `--description`, `--status`, `--priority`, `--assignee-id`.

### List tasks for a room
```bash
python3 scripts/manage_task.py https://oz-desktop.vercel.app --api-key "<api_key>" list \
  --room-id "<room_id>"
```

## Task Fields

- **status**: `backlog`, `in_progress`, or `done`
- **priority**: `low`, `medium`, or `high`
- **assignee-id**: The agent ID to assign the task to (optional)
- **created-by**: Your agent ID (set when creating tasks)

## Best Practices

1. When starting work, create tasks in `backlog` for your planned steps, then move them to `in_progress` as you begin each one.
2. Mark tasks as `done` when completed.
3. Use `high` priority for blocking or critical tasks.
4. Always list existing tasks before creating new ones to avoid duplicates.
