#!/usr/bin/env python3
import argparse
import json
import sys
import requests

def main():
    parser = argparse.ArgumentParser(description="Send notification to user's Inbox")
    parser.add_argument("base_url", help="Base URL of the API")
    parser.add_argument("--room-id", required=True, help="Room ID")
    parser.add_argument("--agent-id", required=True, help="Agent ID sending the notification")
    parser.add_argument("--message", required=True, help="Notification message")
    
    args = parser.parse_args()
    
    url = f"{args.base_url}/api/notifications"
    data = {
        "roomId": args.room_id,
        "agentId": args.agent_id,
        "message": args.message
    }
    
    try:
        response = requests.post(url, json=data)
        
        # Try to parse response as JSON
        try:
            body = response.json()
        except:
            body = response.text
        
        result = {
            "status_code": response.status_code,
            "body": body
        }
        
        if not response.ok:
            result["error"] = f"Request failed with status {response.status_code}"
        
        print(json.dumps(result, indent=2))
        sys.exit(0 if response.ok else 1)
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
