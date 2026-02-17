"""
Duration type for time spans
"""

DURATION_TYPE = {
    'kind': 'struct',
    'name': 'Duration',
    'fields': [
        {'name': 'secs', 'type': 'u64'},
        {'name': 'nanos', 'type': 'u32'},
    ],
    'methods': [
        {
            'name': 'from_secs',
            'params': [{'name': 'secs', 'type': 'u64'}],
            'return_type': 'Self',
            'effects': [],
        },
        {
            'name': 'as_secs',
            'params': [{'name': 'self', 'type': '&Self'}],
            'return_type': 'u64',
            'effects': [],
        },
    ],
}
