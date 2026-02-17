"""
File I/O types - all operations are effectful and return Result
"""

IO_ERROR_TYPE = {
    'kind': 'struct',
    'name': 'IoError',
    'fields': [
        {'name': 'kind', 'type': 'IoErrorKind'},
        {'name': 'message', 'type': 'String'},
    ],
}

FILE_TYPE = {
    'kind': 'struct',
    'name': 'File',
    'fields': [],  # Private: OS handle
    'methods': [
        {
            'name': 'open',
            'params': [{'name': 'path', 'type': '&Path'}],
            'return_type': 'Result<File, IoError>',
            'effects': ['IO'],
        },
        {
            'name': 'create',
            'params': [{'name': 'path', 'type': '&Path'}],
            'return_type': 'Result<File, IoError>',
            'effects': ['IO'],
        },
    ],
}

# Functions for common file operations
FILE_FUNCTIONS = [
    {
        'name': 'read_to_string',
        'params': [{'name': 'path', 'type': '&Path'}],
        'return_type': 'Result<String, IoError>',
        'effects': ['IO'],
    },
    {
        'name': 'write_string',
        'params': [
            {'name': 'path', 'type': '&Path'},
            {'name': 'content', 'type': '&str'},
        ],
        'return_type': 'Result<(), IoError>',
        'effects': ['IO'],
    },
]
