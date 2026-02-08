---
name: send_message
description: Send HTTP POST requests with JSON payloads. Use when you need to make API calls, send data to webhooks, or communicate with web services via POST requests.
---

# Send Message

Send POST requests with JSON data to any URL.

## Usage

Run the script with a URL and JSON data:

```bash
python3 scripts/send_post_request.py <url> --data '<json>'
```

## Examples

Basic POST request:
```bash
python3 scripts/send_post_request.py https://httpbin.org/post --data '{"message": "hello"}'
```

With custom headers:
```bash
python3 scripts/send_post_request.py https://api.example.com/endpoint \
  --data '{"key": "value"}' \
  --header "Authorization: Bearer $TOKEN" \
  --header "X-Custom-Header: custom-value"
```

## Response

The script outputs a JSON object with:
- `status_code`: HTTP status code
- `headers`: Response headers
- `body`: Response body (parsed as JSON if possible)
- `error`: Error message (only if request failed)