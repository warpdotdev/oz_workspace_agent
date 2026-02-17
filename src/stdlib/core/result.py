"""
Result<T, E> type definition for Veritas

Represents success or failure. Errors are values, not exceptions.
"""

from dataclasses import dataclass


@dataclass
class ResultTypeDefinition:
    """Type definition for Result<T, E> enum"""
    
    def get_type_definition(self) -> dict:
        """Returns the AST representation of Result<T, E> type"""
        return {
            'kind': 'enum',
            'name': 'Result',
            'type_params': ['T', 'E'],
            'variants': [
                {'name': 'Ok', 'fields': [{'type': 'T'}]},
                {'name': 'Err', 'fields': [{'type': 'E'}]},
            ],
            'methods': [
                {
                    'name': 'is_ok',
                    'params': [{'name': 'self', 'type': '&Self'}],
                    'return_type': 'Bool',
                    'effects': [],
                },
                {
                    'name': 'is_err',
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
                    'name': 'unwrap_err',
                    'params': [{'name': 'self', 'type': 'Self'}],
                    'return_type': 'E',
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
                    'name': 'map',
                    'params': [
                        {'name': 'self', 'type': 'Self'},
                        {'name': 'f', 'type': 'F'},
                    ],
                    'type_params': ['U', 'F: Fn(T) -> U'],
                    'return_type': 'Result<U, E>',
                    'effects': [],
                },
                {
                    'name': 'map_err',
                    'params': [
                        {'name': 'self', 'type': 'Self'},
                        {'name': 'f', 'type': 'G'},
                    ],
                    'type_params': ['F', 'G: Fn(E) -> F'],
                    'return_type': 'Result<T, F>',
                    'effects': [],
                },
                {
                    'name': 'and_then',
                    'params': [
                        {'name': 'self', 'type': 'Self'},
                        {'name': 'f', 'type': 'F'},
                    ],
                    'type_params': ['U', 'F: Fn(T) -> Result<U, E>'],
                    'return_type': 'Result<U, E>',
                    'effects': [],
                },
                {
                    'name': 'ok',
                    'params': [{'name': 'self', 'type': 'Self'}],
                    'return_type': 'Option<T>',
                    'effects': [],
                },
                {
                    'name': 'err',
                    'params': [{'name': 'self', 'type': 'Self'}],
                    'return_type': 'Option<E>',
                    'effects': [],
                },
            ],
        }


# Singleton instance
RESULT_TYPE = ResultTypeDefinition()
