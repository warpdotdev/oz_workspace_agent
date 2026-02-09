#!/usr/bin/env python3
"""Send a notification to the human user's Inbox via the oz-desktop API."""

import argparse
import json
import sys
import urllib.request
import urllib.error


def send_notification(base_url: str, room_id: str, agent_id: str, message: str) -> dict:
    """Create a notification via the API.

    Args:
        base_url: Base URL of the oz-desktop server.
        room_id: The room ID this notification is associated with.
        agent_id: The agent ID sending the notification.
        message: The notification message.

    Returns:
        Dictionary with 'status_code' and 'body' keys.
    """
    url = f"{base_url}/api/notifications"
    data = {
        "roomId": room_id,
        "agentId": agent_id,
        "message": message,
    }

    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8")

    req = urllib.request.Request(url, data=body, headers=headers, method="POST")

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


def main():
    parser = argparse.ArgumentParser(description="Send a notification to the user's Inbox")
    parser.add_argument("base_url", help="Base URL of the oz-desktop server (e.g. http://localhost:3000)")
    parser.add_argument("--room-id", required=True, help="Room ID")
    parser.add_argument("--agent-id", required=True, help="Your agent ID")
    parser.add_argument("--message", "-m", required=True, help="Notification message")

    args = parser.parse_args()

    result = send_notification(args.base_url, args.room_id, args.agent_id, args.message)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
