"""
String formatting
"""

FORMAT_FUNCTION = {
    'name': 'format',
    'params': [
        {'name': 'template', 'type': '&str'},
        {'name': 'args', 'type': '...'},  # Variadic
    ],
    'return_type': 'String',
    'effects': [],
}
