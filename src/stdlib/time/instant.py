"""
Instant and Duration types for time measurement
"""

INSTANT_TYPE = {
    'kind': 'struct',
    'name': 'Instant',
    'fields': [{'name': 'nanos', 'type': 'u64'}],
    'methods': [
        {
            'name': 'now',
            'params': [],
            'return_type': 'Instant',
            'effects': ['IO'],
        },
        {
            'name': 'elapsed',
            'params': [{'name': 'self', 'type': '&Self'}],
            'return_type': 'Duration',
            'effects': ['IO'],
        },
    ],
}
