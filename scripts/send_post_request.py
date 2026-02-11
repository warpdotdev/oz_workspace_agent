#!/usr/bin/env python3
import argparse
import json
import sys
import requests

def main():
    parser = argparse.ArgumentParser(description="Send POST request with JSON data")
    parser.add_argument("url", help="URL to send POST request to")
    parser.add_argument("--data", required=True, help="JSON data to send in the request body")
    parser.add_argument("--header", action="append", help="Custom headers (format: 'Key: Value')")
    
    args = parser.parse_args()
    
    # Parse JSON data
    try:
        data = json.loads(args.data)
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON: {str(e)}"}), file=sys.stderr)
        sys.exit(1)
    
    # Parse headers
    headers = {"Content-Type": "application/json"}
    if args.header:
        for header in args.header:
            if ": " in header:
                key, value = header.split(": ", 1)
                headers[key] = value
    
    # Send request
    try:
        response = requests.post(args.url, json=data, headers=headers)
        
        # Try to parse response as JSON
        try:
            body = response.json()
        except:
            body = response.text
        
        result = {
            "status_code": response.status_code,
            "headers": dict(response.headers),
            "body": body
        }
        
        print(json.dumps(result, indent=2))
        sys.exit(0 if response.ok else 1)
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
