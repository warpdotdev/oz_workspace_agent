"""
List<T> type definition - Growable, heap-allocated array
"""

from dataclasses import dataclass


@dataclass
class ListTypeDefinition:
    """Type definition for List<T> struct"""
    
    def get_type_definition(self) -> dict:
        return {
            'kind': 'struct',
            'name': 'List',
            'type_params': ['T'],
            'fields': [],  # Private implementation
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
                {
                    'name': 'from_array',
                    'params': [{'name': 'arr', 'type': '[T]'}],
                    'return_type': 'Self',
                    'effects': [],
                },
                # Access
                {
                    'name': 'get',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'index', 'type': 'Usize'},
                    ],
                    'return_type': 'Option<&T>',
                    'effects': [],
                },
                {
                    'name': 'get_mut',
                    'params': [
                        {'name': 'self', 'type': '&mut Self'},
                        {'name': 'index', 'type': 'Usize'},
                    ],
                    'return_type': 'Option<&mut T>',
                    'effects': [],
                },
                {
                    'name': 'at',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'index', 'type': 'Usize'},
                    ],
                    'return_type': '&T',
                    'effects': [],
                },
                {
                    'name': 'at_mut',
                    'params': [
                        {'name': 'self', 'type': '&mut Self'},
                        {'name': 'index', 'type': 'Usize'},
                    ],
                    'return_type': '&mut T',
                    'effects': [],
                },
                # Modification
                {
                    'name': 'push',
                    'params': [
                        {'name': 'self', 'type': '&mut Self'},
                        {'name': 'value', 'type': 'T'},
                    ],
                    'return_type': '()',
                    'effects': [],
                },
                {
                    'name': 'pop',
                    'params': [{'name': 'self', 'type': '&mut Self'}],
                    'return_type': 'Option<T>',
                    'effects': [],
                },
                {
                    'name': 'insert',
                    'params': [
                        {'name': 'self', 'type': '&mut Self'},
                        {'name': 'index', 'type': 'Usize'},
                        {'name': 'value', 'type': 'T'},
                    ],
                    'return_type': '()',
                    'effects': [],
                },
                {
                    'name': 'remove',
                    'params': [
                        {'name': 'self', 'type': '&mut Self'},
                        {'name': 'index', 'type': 'Usize'},
                    ],
                    'return_type': 'T',
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
                {
                    'name': 'capacity',
                    'params': [{'name': 'self', 'type': '&Self'}],
                    'return_type': 'Usize',
                    'effects': [],
                },
                # Transformations
                {
                    'name': 'map',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'f', 'type': 'F'},
                    ],
                    'type_params': ['U', 'F: Fn(&T) -> U'],
                    'return_type': 'List<U>',
                    'effects': [],
                },
                {
                    'name': 'filter',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'predicate', 'type': 'F'},
                    ],
                    'type_params': ['F: Fn(&T) -> Bool'],
                    'return_type': 'List<T>',
                    'effects': [],
                },
                {
                    'name': 'filter_map',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'f', 'type': 'F'},
                    ],
                    'type_params': ['U', 'F: Fn(&T) -> Option<U>'],
                    'return_type': 'List<U>',
                    'effects': [],
                },
                # Reductions
                {
                    'name': 'fold',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'init', 'type': 'U'},
                        {'name': 'f', 'type': 'F'},
                    ],
                    'type_params': ['U', 'F: Fn(U, &T) -> U'],
                    'return_type': 'U',
                    'effects': [],
                },
                {
                    'name': 'reduce',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'f', 'type': 'F'},
                    ],
                    'type_params': ['F: Fn(&T, &T) -> T'],
                    'return_type': 'Option<T>',
                    'effects': [],
                },
                # Search
                {
                    'name': 'find',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'predicate', 'type': 'F'},
                    ],
                    'type_params': ['F: Fn(&T) -> Bool'],
                    'return_type': 'Option<&T>',
                    'effects': [],
                },
                {
                    'name': 'position',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'predicate', 'type': 'F'},
                    ],
                    'type_params': ['F: Fn(&T) -> Bool'],
                    'return_type': 'Option<Usize>',
                    'effects': [],
                },
                {
                    'name': 'contains',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'value', 'type': '&T'},
                    ],
                    'bounds': ['T: Eq'],
                    'return_type': 'Bool',
                    'effects': [],
                },
                # Sorting
                {
                    'name': 'sort',
                    'params': [{'name': 'self', 'type': '&mut Self'}],
                    'bounds': ['T: Ord'],
                    'return_type': '()',
                    'effects': [],
                },
                {
                    'name': 'sort_by',
                    'params': [
                        {'name': 'self', 'type': '&mut Self'},
                        {'name': 'compare', 'type': 'F'},
                    ],
                    'type_params': ['F: Fn(&T, &T) -> Ordering'],
                    'return_type': '()',
                    'effects': [],
                },
            ],
        }


LIST_TYPE = ListTypeDefinition()
