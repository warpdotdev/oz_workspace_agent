"""
String type definition - UTF-8 encoded string
"""

from dataclasses import dataclass


@dataclass
class StringTypeDefinition:
    """Type definition for String struct"""
    
    def get_type_definition(self) -> dict:
        return {
            'kind': 'struct',
            'name': 'String',
            'type_params': [],
            'fields': [],  # Private: UTF-8 bytes
            'methods': [
                # Construction
                {
                    'name': 'new',
                    'params': [],
                    'return_type': 'Self',
                    'effects': [],
                },
                {
                    'name': 'from_str',
                    'params': [{'name': 's', 'type': '&str'}],
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
                    'name': 'as_str',
                    'params': [{'name': 'self', 'type': '&Self'}],
                    'return_type': '&str',
                    'effects': [],
                },
                {
                    'name': 'len',
                    'params': [{'name': 'self', 'type': '&Self'}],
                    'return_type': 'Usize',
                    'effects': [],
                },
                {
                    'name': 'char_count',
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
                # Modification
                {
                    'name': 'push',
                    'params': [
                        {'name': 'self', 'type': '&mut Self'},
                        {'name': 'c', 'type': 'Char'},
                    ],
                    'return_type': '()',
                    'effects': [],
                },
                {
                    'name': 'push_str',
                    'params': [
                        {'name': 'self', 'type': '&mut Self'},
                        {'name': 's', 'type': '&str'},
                    ],
                    'return_type': '()',
                    'effects': [],
                },
                {
                    'name': 'pop',
                    'params': [{'name': 'self', 'type': '&mut Self'}],
                    'return_type': 'Option<Char>',
                    'effects': [],
                },
                {
                    'name': 'clear',
                    'params': [{'name': 'self', 'type': '&mut Self'}],
                    'return_type': '()',
                    'effects': [],
                },
                {
                    'name': 'truncate',
                    'params': [
                        {'name': 'self', 'type': '&mut Self'},
                        {'name': 'new_len', 'type': 'Usize'},
                    ],
                    'return_type': '()',
                    'effects': [],
                },
                # Transformations
                {
                    'name': 'to_uppercase',
                    'params': [{'name': 'self', 'type': '&Self'}],
                    'return_type': 'String',
                    'effects': [],
                },
                {
                    'name': 'to_lowercase',
                    'params': [{'name': 'self', 'type': '&Self'}],
                    'return_type': 'String',
                    'effects': [],
                },
                {
                    'name': 'trim',
                    'params': [{'name': 'self', 'type': '&Self'}],
                    'return_type': '&str',
                    'effects': [],
                },
                {
                    'name': 'trim_start',
                    'params': [{'name': 'self', 'type': '&Self'}],
                    'return_type': '&str',
                    'effects': [],
                },
                {
                    'name': 'trim_end',
                    'params': [{'name': 'self', 'type': '&Self'}],
                    'return_type': '&str',
                    'effects': [],
                },
                # Search
                {
                    'name': 'contains',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'pattern', 'type': '&str'},
                    ],
                    'return_type': 'Bool',
                    'effects': [],
                },
                {
                    'name': 'starts_with',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'prefix', 'type': '&str'},
                    ],
                    'return_type': 'Bool',
                    'effects': [],
                },
                {
                    'name': 'ends_with',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'suffix', 'type': '&str'},
                    ],
                    'return_type': 'Bool',
                    'effects': [],
                },
                {
                    'name': 'find',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'pattern', 'type': '&str'},
                    ],
                    'return_type': 'Option<Usize>',
                    'effects': [],
                },
                # Replace
                {
                    'name': 'replace',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'from', 'type': '&str'},
                        {'name': 'to', 'type': '&str'},
                    ],
                    'return_type': 'String',
                    'effects': [],
                },
                {
                    'name': 'replace_first',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'from', 'type': '&str'},
                        {'name': 'to', 'type': '&str'},
                    ],
                    'return_type': 'String',
                    'effects': [],
                },
            ],
        }


STRING_TYPE = StringTypeDefinition()
