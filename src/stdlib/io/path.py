"""
File system path type
"""

PATH_TYPE = {
    'kind': 'struct',
    'name': 'Path',
    'fields': [],
    'methods': [
        {
            'name': 'new',
            'params': [{'name': 's', 'type': '&str'}],
            'return_type': 'Self',
            'effects': [],
        },
        {
            'name': 'exists',
            'params': [{'name': 'self', 'type': '&Self'}],
            'return_type': 'Bool',
            'effects': ['IO'],
        },
        {
            'name': 'is_file',
            'params': [{'name': 'self', 'type': '&Self'}],
            'return_type': 'Bool',
            'effects': ['IO'],
        },
        {
            'name': 'is_dir',
            'params': [{'name': 'self', 'type': '&Self'}],
            'return_type': 'Bool',
            'effects': ['IO'],
        },
    ],
}
