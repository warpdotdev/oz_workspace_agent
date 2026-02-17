"""
DateTime type for calendar dates and times
"""

DATETIME_TYPE = {
    'kind': 'struct',
    'name': 'DateTime',
    'fields': [
        {'name': 'year', 'type': 'i32'},
        {'name': 'month', 'type': 'u8'},
        {'name': 'day', 'type': 'u8'},
        {'name': 'hour', 'type': 'u8'},
        {'name': 'minute', 'type': 'u8'},
        {'name': 'second', 'type': 'u8'},
    ],
    'methods': [
        {
            'name': 'now_utc',
            'params': [],
            'return_type': 'DateTime',
            'effects': ['IO'],
        },
        {
            'name': 'to_iso8601',
            'params': [{'name': 'self', 'type': '&Self'}],
            'return_type': 'String',
            'effects': [],
        },
    ],
}
