#!/usr/bin/env python3
"""Send a POST request to a specified URL with JSON data."""

import argparse
import json
import sys
import urllib.request
import urllib.error


def send_post_request(url: str, data: dict, headers: dict | None = None) -> dict:
    """Send a POST request with JSON data.
    
    Args:
        url: The URL to send the request to.
        data: Dictionary of data to send as JSON body.
        headers: Optional dictionary of additional headers.
    
    Returns:
        Dictionary with 'status_code', 'headers', and 'body' keys.
    """
    request_headers = {"Content-Type": "application/json"}
    if headers:
        request_headers.update(headers)
    
    json_data = json.dumps(data).encode("utf-8")
    
    req = urllib.request.Request(
        url,
        data=json_data,
        headers=request_headers,
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            body = response.read().decode("utf-8")
            try:
                body = json.loads(body)
            except json.JSONDecodeError:
                pass
            return {
                "status_code": response.status,
                "headers": dict(response.headers),
                "body": body
            }
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            body = json.loads(body)
        except json.JSONDecodeError:
            pass
        return {
            "status_code": e.code,
            "headers": dict(e.headers),
            "body": body,
            "error": str(e.reason)
        }
    except urllib.error.URLError as e:
        return {
            "status_code": None,
            "error": str(e.reason)
        }


def main():
    parser = argparse.ArgumentParser(description="Send a POST request with JSON data")
    parser.add_argument("url", help="URL to send the POST request to")
    parser.add_argument("--data", "-d", required=True, help="JSON data to send (as string)")
    parser.add_argument("--header", "-H", action="append", dest="headers",
                        help="Additional header in 'Key: Value' format (can be repeated)")
    
    args = parser.parse_args()
    
    try:
        data = json.loads(args.data)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON data: {e}", file=sys.stderr)
        sys.exit(1)
    
    headers = {}
    if args.headers:
        for header in args.headers:
            if ": " in header:
                key, value = header.split(": ", 1)
                headers[key] = value
            else:
                print(f"Warning: Skipping invalid header format: {header}", file=sys.stderr)
    
    result = send_post_request(args.url, data, headers if headers else None)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
