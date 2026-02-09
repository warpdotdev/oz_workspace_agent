#!/usr/bin/env python3
"""Manage tasks on the room Kanban board via the oz-desktop API."""

import argparse
import json
import sys
import urllib.request
import urllib.error


def api_request(url: str, method: str = "GET", data: dict | None = None, api_key: str | None = None) -> dict:
    """Make an API request and return the parsed response."""
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["X-Agent-Key"] = api_key
    body = json.dumps(data).encode("utf-8") if data else None

    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode("utf-8"))
            return {"status_code": response.status, "body": result}
    except urllib.error.HTTPError as e:
        body_text = e.read().decode("utf-8")
        try:
            body_parsed = json.loads(body_text)
        except json.JSONDecodeError:
            body_parsed = body_text
        return {"status_code": e.code, "body": body_parsed, "error": str(e.reason)}
    except urllib.error.URLError as e:
        return {"status_code": None, "error": str(e.reason)}


def create_task(base_url: str, args: argparse.Namespace) -> dict:
    """Create a new task."""
    data: dict = {
        "roomId": args.room_id,
        "title": args.title,
    }
    if args.description:
        data["description"] = args.description
    if args.status:
        data["status"] = args.status
    if args.priority:
        data["priority"] = args.priority
    if args.assignee_id:
        data["assigneeId"] = args.assignee_id
    if args.created_by:
        data["createdBy"] = args.created_by

    return api_request(f"{base_url}/api/agent/tasks", method="POST", data=data, api_key=args.api_key)


def update_task(base_url: str, args: argparse.Namespace) -> dict:
    """Update an existing task."""
    data: dict = {}
    if args.title:
        data["title"] = args.title
    if args.description:
        data["description"] = args.description
    if args.status:
        data["status"] = args.status
    if args.priority:
        data["priority"] = args.priority
    if args.assignee_id:
        data["assigneeId"] = args.assignee_id

    if not data:
        return {"error": "No fields to update. Provide at least one of: --title, --description, --status, --priority, --assignee-id"}

    return api_request(f"{base_url}/api/agent/tasks/{args.task_id}", method="PATCH", data=data, api_key=args.api_key)


def list_tasks(base_url: str, args: argparse.Namespace) -> dict:
    """List all tasks for a room."""
    return api_request(f"{base_url}/api/agent/tasks?roomId={args.room_id}", api_key=args.api_key)


def main():
    parser = argparse.ArgumentParser(description="Manage tasks on the room Kanban board")
    parser.add_argument("base_url", help="Base URL of the oz-desktop server (e.g. https://oz-desktop.vercel.app)")
    parser.add_argument("--api-key", required=True, help="Agent API key for authentication")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Create
    create_parser = subparsers.add_parser("create", help="Create a new task")
    create_parser.add_argument("--room-id", required=True, help="Room ID")
    create_parser.add_argument("--title", required=True, help="Task title")
    create_parser.add_argument("--description", help="Task description")
    create_parser.add_argument("--status", choices=["backlog", "in_progress", "done"], help="Task status")
    create_parser.add_argument("--priority", choices=["low", "medium", "high"], help="Task priority")
    create_parser.add_argument("--assignee-id", help="Agent ID to assign the task to")
    create_parser.add_argument("--created-by", help="Agent ID of the creator")

    # Update
    update_parser = subparsers.add_parser("update", help="Update an existing task")
    update_parser.add_argument("--task-id", required=True, help="Task ID to update")
    update_parser.add_argument("--title", help="New title")
    update_parser.add_argument("--description", help="New description")
    update_parser.add_argument("--status", choices=["backlog", "in_progress", "done"], help="New status")
    update_parser.add_argument("--priority", choices=["low", "medium", "high"], help="New priority")
    update_parser.add_argument("--assignee-id", help="New assignee agent ID")

    # List
    list_parser = subparsers.add_parser("list", help="List tasks for a room")
    list_parser.add_argument("--room-id", required=True, help="Room ID")

    args = parser.parse_args()

    if args.command == "create":
        result = create_task(args.base_url, args)
    elif args.command == "update":
        result = update_task(args.base_url, args)
    elif args.command == "list":
        result = list_tasks(args.base_url, args)
    else:
        print(f"Unknown command: {args.command}", file=sys.stderr)
        sys.exit(1)

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
