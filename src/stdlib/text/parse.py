"""
Text parsing utilities
"""

# Parsing trait for types that can be parsed from strings
PARSE_TRAIT = {
    'kind': 'trait',
    'name': 'Parse',
    'methods': [
        {
            'name': 'parse',
            'params': [{'name': 's', 'type': '&str'}],
            'return_type': 'Result<Self, ParseError>',
            'effects': [],
        },
    ],
}
