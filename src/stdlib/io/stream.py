"""
Stream traits for reading and writing
"""

READ_TRAIT = {
    'kind': 'trait',
    'name': 'Read',
    'methods': [
        {
            'name': 'read',
            'params': [
                {'name': 'self', 'type': '&mut Self'},
                {'name': 'buf', 'type': '&mut [u8]'},
            ],
            'return_type': 'Result<Usize, IoError>',
            'effects': ['IO'],
        },
    ],
}

WRITE_TRAIT = {
    'kind': 'trait',
    'name': 'Write',
    'methods': [
        {
            'name': 'write',
            'params': [
                {'name': 'self', 'type': '&mut Self'},
                {'name': 'buf', 'type': '&[u8]'},
            ],
            'return_type': 'Result<Usize, IoError>',
            'effects': ['IO'],
        },
        {
            'name': 'flush',
            'params': [{'name': 'self', 'type': '&mut Self'}],
            'return_type': 'Result<(), IoError>',
            'effects': ['IO'],
        },
    ],
}
