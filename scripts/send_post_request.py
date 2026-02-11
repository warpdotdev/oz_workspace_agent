#!/usr/bin/env python3
"""
Send POST requests with JSON data to any URL.
"""
import argparse
import json
import sys
import requests

def send_post_request(url, data, headers=None):
    """Send a POST request with JSON data."""
    request_headers = {"Content-Type": "application/json"}
    
    if headers:
        for header in headers:
            key, value = header.split(":", 1)
            request_headers[key.strip()] = value.strip()
    
    try:
        # Parse the data string as JSON
        json_data = json.loads(data)
        
        response = requests.post(url, headers=request_headers, json=json_data)
        result = {
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "body": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
        }
        print(json.dumps(result, indent=2))
        return result
    except json.JSONDecodeError as e:
        error_result = {"error": f"Invalid JSON data: {str(e)}"}
        print(json.dumps(error_result, indent=2), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        error_result = {"error": str(e)}
        print(json.dumps(error_result, indent=2), file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Send POST requests with JSON data")
    parser.add_argument("url", help="URL to send the POST request to")
    parser.add_argument("--data", required=True, help="JSON data to send in the POST request")
    parser.add_argument("--header", action="append", dest="headers", help="Custom headers (can be specified multiple times)")
    
    args = parser.parse_args()
    
    send_post_request(args.url, args.data, args.headers)

if __name__ == "__main__":
    main()
