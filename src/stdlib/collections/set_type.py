"""
Set<T> type definition - Hash set for unique values
"""

from dataclasses import dataclass


@dataclass
class SetTypeDefinition:
    """Type definition for Set<T> struct"""
    
    def get_type_definition(self) -> dict:
        return {
            'kind': 'struct',
            'name': 'Set',
            'type_params': ['T'],
            'bounds': ['T: Hash + Eq'],
            'fields': [],  # Private - backed by Map<T, ()>
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
                # Modification
                {
                    'name': 'insert',
                    'params': [
                        {'name': 'self', 'type': '&mut Self'},
                        {'name': 'value', 'type': 'T'},
                    ],
                    'return_type': 'Bool',  # Returns true if new
                    'effects': [],
                },
                {
                    'name': 'remove',
                    'params': [
                        {'name': 'self', 'type': '&mut Self'},
                        {'name': 'value', 'type': '&T'},
                    ],
                    'return_type': 'Bool',
                    'effects': [],
                },
                {
                    'name': 'clear',
                    'params': [{'name': 'self', 'type': '&mut Self'}],
                    'return_type': '()',
                    'effects': [],
                },
                # Query
                {
                    'name': 'contains',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'value', 'type': '&T'},
                    ],
                    'return_type': 'Bool',
                    'effects': [],
                },
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
                # Set operations
                {
                    'name': 'union',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'other', 'type': '&Self'},
                    ],
                    'return_type': 'Set<T>',
                    'effects': [],
                },
                {
                    'name': 'intersection',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'other', 'type': '&Self'},
                    ],
                    'return_type': 'Set<T>',
                    'effects': [],
                },
                {
                    'name': 'difference',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'other', 'type': '&Self'},
                    ],
                    'return_type': 'Set<T>',
                    'effects': [],
                },
                {
                    'name': 'symmetric_difference',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'other', 'type': '&Self'},
                    ],
                    'return_type': 'Set<T>',
                    'effects': [],
                },
                {
                    'name': 'is_subset',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'other', 'type': '&Self'},
                    ],
                    'return_type': 'Bool',
                    'effects': [],
                },
                {
                    'name': 'is_superset',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'other', 'type': '&Self'},
                    ],
                    'return_type': 'Bool',
                    'effects': [],
                },
            ],
        }


SET_TYPE = SetTypeDefinition()
