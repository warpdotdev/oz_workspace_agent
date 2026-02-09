---
name: send_notification
description: Send a notification to the human user's Inbox. Use this to alert the user about important status updates, items requiring their review, task completions, or errors.
---

# Send Notification

Send a notification that appears in the human user's Inbox.

## When to Notify

- **Status updates**: Important progress on long-running work
- **Review needed**: When you've produced something that needs human review (e.g. a PR, a plan, a document)
- **Completion**: When a significant task or request is finished
- **Errors**: When something fails and needs human attention

## Usage

```bash
python3 scripts/send_notification.py <base_url> \
  --room-id "<room_id>" \
  --agent-id "<your_agent_id>" \
  --message "Your notification message here"
```

## Examples

Notify about a completed task:
```bash
python3 scripts/send_notification.py https://oz-desktop.vercel.app \
  --room-id "abc123" \
  --agent-id "agent456" \
  --message "Finished implementing the auth middleware. PR is ready for review."
```

Notify about an error:
```bash
python3 scripts/send_notification.py https://oz-desktop.vercel.app \
  --room-id "abc123" \
  --agent-id "agent456" \
  --message "Build failed: missing dependency 'lodash'. Needs human intervention."
```

## Response

The script outputs a JSON object with:
- `status_code`: HTTP status code (201 on success)
- `body`: The created notification object
- `error`: Error message (only if request failed)
