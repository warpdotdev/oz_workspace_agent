#!/usr/bin/env python3
"""
Manage tasks on the Kanban board via the REST API.
"""
import argparse
import json
import sys
import requests

def create_task(base_url, api_key, room_id, title, description, status, priority, created_by):
    """Create a new task."""
    url = f"{base_url}/api/tasks"
    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key
    }
    data = {
        "roomId": room_id,
        "title": title,
        "description": description,
        "status": status,
        "priority": priority,
        "createdBy": created_by
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        result = {
            "status_code": response.status_code,
            "body": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
        }
        print(json.dumps(result, indent=2))
        return result
    except Exception as e:
        error_result = {"error": str(e)}
        print(json.dumps(error_result, indent=2), file=sys.stderr)
        sys.exit(1)

def update_task(base_url, api_key, task_id, title=None, description=None, status=None, priority=None, assignee_id=None):
    """Update an existing task."""
    url = f"{base_url}/api/tasks/{task_id}"
    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key
    }
    data = {}
    if title is not None:
        data["title"] = title
    if description is not None:
        data["description"] = description
    if status is not None:
        data["status"] = status
    if priority is not None:
        data["priority"] = priority
    if assignee_id is not None:
        data["assigneeId"] = assignee_id
    
    try:
        response = requests.patch(url, headers=headers, json=data)
        result = {
            "status_code": response.status_code,
            "body": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
        }
        print(json.dumps(result, indent=2))
        return result
    except Exception as e:
        error_result = {"error": str(e)}
        print(json.dumps(error_result, indent=2), file=sys.stderr)
        sys.exit(1)

def list_tasks(base_url, api_key, room_id):
    """List all tasks for a room."""
    url = f"{base_url}/api/tasks?roomId={room_id}"
    headers = {
        "x-api-key": api_key
    }
    
    try:
        response = requests.get(url, headers=headers)
        result = {
            "status_code": response.status_code,
            "body": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
        }
        print(json.dumps(result, indent=2))
        return result
    except Exception as e:
        error_result = {"error": str(e)}
        print(json.dumps(error_result, indent=2), file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Manage tasks on the Kanban board")
    parser.add_argument("base_url", help="Base URL of the API")
    parser.add_argument("--api-key", required=True, help="API key for authentication")
    
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # Create task
    create_parser = subparsers.add_parser("create", help="Create a new task")
    create_parser.add_argument("--room-id", required=True, help="Room ID")
    create_parser.add_argument("--title", required=True, help="Task title")
    create_parser.add_argument("--description", required=True, help="Task description")
    create_parser.add_argument("--status", required=True, choices=["backlog", "in_progress", "done"], help="Task status")
    create_parser.add_argument("--priority", required=True, choices=["low", "medium", "high"], help="Task priority")
    create_parser.add_argument("--created-by", required=True, help="Agent ID creating the task")
    
    # Update task
    update_parser = subparsers.add_parser("update", help="Update an existing task")
    update_parser.add_argument("--task-id", required=True, help="Task ID to update")
    update_parser.add_argument("--title", help="New task title")
    update_parser.add_argument("--description", help="New task description")
    update_parser.add_argument("--status", choices=["backlog", "in_progress", "done"], help="New task status")
    update_parser.add_argument("--priority", choices=["low", "medium", "high"], help="New task priority")
    update_parser.add_argument("--assignee-id", help="Agent ID to assign task to")
    
    # List tasks
    list_parser = subparsers.add_parser("list", help="List tasks for a room")
    list_parser.add_argument("--room-id", required=True, help="Room ID")
    
    args = parser.parse_args()
    
    if args.command == "create":
        create_task(args.base_url, args.api_key, args.room_id, args.title, 
                   args.description, args.status, args.priority, args.created_by)
    elif args.command == "update":
        update_task(args.base_url, args.api_key, args.task_id, args.title,
                   args.description, args.status, args.priority, args.assignee_id)
    elif args.command == "list":
        list_tasks(args.base_url, args.api_key, args.room_id)
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    main()
