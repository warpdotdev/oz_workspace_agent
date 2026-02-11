#!/usr/bin/env python3
"""
Send a notification to the user's inbox.
"""
import argparse
import json
import sys
import requests

def send_notification(base_url, room_id, agent_id, message):
    """Send a notification to the user's inbox."""
    url = f"{base_url}/api/notifications"
    headers = {
        "Content-Type": "application/json"
    }
    data = {
        "roomId": room_id,
        "agentId": agent_id,
        "message": message
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

def main():
    parser = argparse.ArgumentParser(description="Send a notification to the user's inbox")
    parser.add_argument("base_url", help="Base URL of the API")
    parser.add_argument("--room-id", required=True, help="Room ID")
    parser.add_argument("--agent-id", required=True, help="Your agent ID")
    parser.add_argument("--message", required=True, help="Notification message")
    
    args = parser.parse_args()
    
    send_notification(args.base_url, args.room_id, args.agent_id, args.message)

if __name__ == "__main__":
    main()
