"""
JSON serialization
"""

JSON_FUNCTIONS = [
    {
        'name': 'to_string',
        'params': [{'name': 'value', 'type': '&JsonValue'}],
        'return_type': 'String',
        'effects': [],
    },
    {
        'name': 'to_string_pretty',
        'params': [{'name': 'value', 'type': '&JsonValue'}],
        'return_type': 'String',
        'effects': [],
    },
]
