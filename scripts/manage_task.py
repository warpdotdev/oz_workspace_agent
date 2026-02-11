#!/usr/bin/env python3
import argparse
import json
import sys
import requests

def create_task(base_url, api_key, room_id, title, description, status, priority, created_by):
    """Create a new task"""
    url = f"{base_url}/api/tasks"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    data = {
        "roomId": room_id,
        "title": title,
        "description": description,
        "status": status,
        "priority": priority,
        "createdBy": created_by
    }
    
    response = requests.post(url, headers=headers, json=data)
    print(json.dumps({
        "status_code": response.status_code,
        "body": response.json() if response.ok else response.text
    }, indent=2))
    return response.status_code == 201

def update_task(base_url, api_key, task_id, **kwargs):
    """Update an existing task"""
    url = f"{base_url}/api/tasks/{task_id}"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    
    # Only include non-None values
    data = {k: v for k, v in kwargs.items() if v is not None}
    
    response = requests.patch(url, headers=headers, json=data)
    print(json.dumps({
        "status_code": response.status_code,
        "body": response.json() if response.ok else response.text
    }, indent=2))
    return response.ok

def list_tasks(base_url, api_key, room_id):
    """List all tasks for a room"""
    url = f"{base_url}/api/tasks?roomId={room_id}"
    headers = {
        "Authorization": f"Bearer {api_key}"
    }
    
    response = requests.get(url, headers=headers)
    if response.ok:
        tasks = response.json()
        print(json.dumps(tasks, indent=2))
    else:
        print(json.dumps({
            "status_code": response.status_code,
            "error": response.text
        }, indent=2))
    return response.ok

def main():
    parser = argparse.ArgumentParser(description="Manage tasks on the Kanban board")
    parser.add_argument("base_url", help="Base URL of the API")
    parser.add_argument("--api-key", required=True, help="API key for authentication")
    
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # Create command
    create_parser = subparsers.add_parser("create", help="Create a new task")
    create_parser.add_argument("--room-id", required=True, help="Room ID")
    create_parser.add_argument("--title", required=True, help="Task title")
    create_parser.add_argument("--description", required=True, help="Task description")
    create_parser.add_argument("--status", required=True, choices=["backlog", "in_progress", "done"], help="Task status")
    create_parser.add_argument("--priority", required=True, choices=["low", "medium", "high"], help="Task priority")
    create_parser.add_argument("--created-by", required=True, help="Agent ID that created the task")
    
    # Update command
    update_parser = subparsers.add_parser("update", help="Update an existing task")
    update_parser.add_argument("--task-id", required=True, help="Task ID to update")
    update_parser.add_argument("--title", help="New task title")
    update_parser.add_argument("--description", help="New task description")
    update_parser.add_argument("--status", choices=["backlog", "in_progress", "done"], help="New task status")
    update_parser.add_argument("--priority", choices=["low", "medium", "high"], help="New task priority")
    update_parser.add_argument("--assignee-id", help="Agent ID to assign the task to")
    
    # List command
    list_parser = subparsers.add_parser("list", help="List all tasks for a room")
    list_parser.add_argument("--room-id", required=True, help="Room ID")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    try:
        if args.command == "create":
            success = create_task(
                args.base_url,
                args.api_key,
                args.room_id,
                args.title,
                args.description,
                args.status,
                args.priority,
                args.created_by
            )
        elif args.command == "update":
            success = update_task(
                args.base_url,
                args.api_key,
                args.task_id,
                title=args.title,
                description=args.description,
                status=args.status,
                priority=args.priority,
                assigneeId=args.assignee_id
            )
        elif args.command == "list":
            success = list_tasks(args.base_url, args.api_key, args.room_id)
        
        sys.exit(0 if success else 1)
    except Exception as e:
        print(json.dumps({"error": str(e)}, indent=2), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
