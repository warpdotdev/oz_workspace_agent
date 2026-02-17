"""
JSON deserialization
"""

JSON_PARSE_FUNCTION = {
    'name': 'parse',
    'params': [{'name': 'input', 'type': '&str'}],
    'return_type': 'Result<JsonValue, JsonError>',
    'effects': [],
}

JSON_ERROR_TYPE = {
    'kind': 'struct',
    'name': 'JsonError',
    'fields': [
        {'name': 'kind', 'type': 'JsonErrorKind'},
        {'name': 'line', 'type': 'Usize'},
        {'name': 'column', 'type': 'Usize'},
        {'name': 'message', 'type': 'String'},
    ],
}
