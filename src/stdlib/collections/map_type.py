"""
Map<K, V> type definition - Hash map
"""

from dataclasses import dataclass


@dataclass
class MapTypeDefinition:
    """Type definition for Map<K, V> struct"""
    
    def get_type_definition(self) -> dict:
        return {
            'kind': 'struct',
            'name': 'Map',
            'type_params': ['K', 'V'],
            'bounds': ['K: Hash + Eq'],
            'fields': [],  # Private
            'methods': [
                # Construction
                {
                    'name': 'new',
                    'params': [],
                    'return_type': 'Self',
                    'effects': [],
                },
                {
                    'name': 'with_capacity',
                    'params': [{'name': 'capacity', 'type': 'Usize'}],
                    'return_type': 'Self',
                    'effects': [],
                },
                # Access
                {
                    'name': 'get',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'key', 'type': '&K'},
                    ],
                    'return_type': 'Option<&V>',
                    'effects': [],
                },
                {
                    'name': 'get_mut',
                    'params': [
                        {'name': 'self', 'type': '&mut Self'},
                        {'name': 'key', 'type': '&K'},
                    ],
                    'return_type': 'Option<&mut V>',
                    'effects': [],
                },
                {
                    'name': 'contains_key',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'key', 'type': '&K'},
                    ],
                    'return_type': 'Bool',
                    'effects': [],
                },
                # Modification
                {
                    'name': 'insert',
                    'params': [
                        {'name': 'self', 'type': '&mut Self'},
                        {'name': 'key', 'type': 'K'},
                        {'name': 'value', 'type': 'V'},
                    ],
                    'return_type': 'Option<V>',
                    'effects': [],
                },
                {
                    'name': 'remove',
                    'params': [
                        {'name': 'self', 'type': '&mut Self'},
                        {'name': 'key', 'type': '&K'},
                    ],
                    'return_type': 'Option<V>',
                    'effects': [],
                },
                {
                    'name': 'clear',
                    'params': [{'name': 'self', 'type': '&mut Self'}],
                    'return_type': '()',
                    'effects': [],
                },
                # Info
                {
                    'name': 'len',
                    'params': [{'name': 'self', 'type': '&Self'}],
                    'return_type': 'Usize',
                    'effects': [],
                },
                {
                    'name': 'is_empty',
                    'params': [{'name': 'self', 'type': '&Self'}],
                    'return_type': 'Bool',
                    'effects': [],
                },
            ],
        }


MAP_TYPE = MapTypeDefinition()
