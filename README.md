# oz_workspace_agent

Skills and configuration for AI agents running in [oz-workspace](https://github.com/warpdotdev/oz-workspace).

## Repository Structure

```
.
├── AGENTS.md                    # System prompt for agents (loaded automatically)
└── .warp/
    └── skills/
        ├── manage_tasks/        # Kanban board task management
        ├── send_notification/   # Send alerts to user inbox
        └── send_message/        # HTTP POST requests to external APIs
```

## Skills

| Skill | Description |
|-------|-------------|
| `manage_tasks` | Create, update, and list tasks on the room's Kanban board (`backlog` → `in_progress` → `done`) |
| `send_notification` | Alert the human user about task completions, errors, or items needing review |
| `send_message` | Send POST requests with JSON payloads to webhooks or external APIs |

See each skill's `SKILL.md` for detailed usage and examples.

## Adding to an Oz Environment

1. **Create a Warp environment** with this repository:

   Using the CLI:
   ```bash
   oz-dev environment create \
     --name "oz-workspace-agent" \
     --repo "https://github.com/warpdotdev/oz_workspace_agent"
   ```

   Or use the `/create-environment` slash command in Warp.

2. **Copy the environment ID** from the output (e.g., `UA17BXYZ`).

3. **Configure your agent** in oz-workspace by setting the `environmentId` field to the ID from step 2.

When the agent runs, it will have access to the skills defined in `.warp/skills/` and receive the instructions from `AGENTS.md`.

## Creating New Skills

1. Create a new directory under `.warp/skills/` with your skill name
2. Add a `SKILL.md` file with frontmatter (`name`, `description`) and usage instructions
3. Add any scripts to a `scripts/` subdirectory
4. Update `AGENTS.md` to document the new skill for agents

Example skill structure:
```
.warp/skills/my_skill/
├── SKILL.md
└── scripts/
    └── my_script.py
```
