"""
Option<T> type definition for Veritas

Represents an optional value. Replaces null/None in other languages.
"""

from dataclasses import dataclass
from typing import Optional, TypeVar, Callable, Generic

T = TypeVar('T')
U = TypeVar('U')


@dataclass
class OptionTypeDefinition:
    """Type definition for Option<T> enum"""
    
    def get_type_definition(self) -> dict:
        """Returns the AST representation of Option<T> type"""
        return {
            'kind': 'enum',
            'name': 'Option',
            'type_params': ['T'],
            'variants': [
                {'name': 'Some', 'fields': [{'type': 'T'}]},
                {'name': 'None', 'fields': []},
            ],
            'methods': [
                {
                    'name': 'is_some',
                    'params': [{'name': 'self', 'type': '&Self'}],
                    'return_type': 'Bool',
                    'effects': [],
                },
                {
                    'name': 'is_none',
                    'params': [{'name': 'self', 'type': '&Self'}],
                    'return_type': 'Bool',
                    'effects': [],
                },
                {
                    'name': 'unwrap',
                    'params': [{'name': 'self', 'type': 'Self'}],
                    'return_type': 'T',
                    'effects': [],
                },
                {
                    'name': 'unwrap_or',
                    'params': [
                        {'name': 'self', 'type': 'Self'},
                        {'name': 'default', 'type': 'T'},
                    ],
                    'return_type': 'T',
                    'effects': [],
                },
                {
                    'name': 'unwrap_or_else',
                    'params': [
                        {'name': 'self', 'type': 'Self'},
                        {'name': 'f', 'type': 'F'},
                    ],
                    'type_params': ['F: Fn() -> T'],
                    'return_type': 'T',
                    'effects': [],
                },
                {
                    'name': 'map',
                    'params': [
                        {'name': 'self', 'type': 'Self'},
                        {'name': 'f', 'type': 'F'},
                    ],
                    'type_params': ['U', 'F: Fn(T) -> U'],
                    'return_type': 'Option<U>',
                    'effects': [],
                },
                {
                    'name': 'and_then',
                    'params': [
                        {'name': 'self', 'type': 'Self'},
                        {'name': 'f', 'type': 'F'},
                    ],
                    'type_params': ['U', 'F: Fn(T) -> Option<U>'],
                    'return_type': 'Option<U>',
                    'effects': [],
                },
                {
                    'name': 'or',
                    'params': [
                        {'name': 'self', 'type': 'Self'},
                        {'name': 'other', 'type': 'Option<T>'},
                    ],
                    'return_type': 'Option<T>',
                    'effects': [],
                },
                {
                    'name': 'filter',
                    'params': [
                        {'name': 'self', 'type': 'Self'},
                        {'name': 'predicate', 'type': 'F'},
                    ],
                    'type_params': ['F: Fn(&T) -> Bool'],
                    'return_type': 'Option<T>',
                    'effects': [],
                },
                {
                    'name': 'ok_or',
                    'params': [
                        {'name': 'self', 'type': 'Self'},
                        {'name': 'err', 'type': 'E'},
                    ],
                    'type_params': ['E'],
                    'return_type': 'Result<T, E>',
                    'effects': [],
                },
            ],
        }


# Singleton instance
OPTION_TYPE = OptionTypeDefinition()
