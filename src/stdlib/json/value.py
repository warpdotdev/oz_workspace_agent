"""
JSON value type - Native JSON support for AI agent tool calling
"""

from dataclasses import dataclass


@dataclass
class JsonValueTypeDefinition:
    """Type definition for JsonValue enum"""
    
    def get_type_definition(self) -> dict:
        return {
            'kind': 'enum',
            'name': 'JsonValue',
            'variants': [
                {'name': 'Null', 'fields': []},
                {'name': 'Bool', 'fields': [{'type': 'Bool'}]},
                {'name': 'Number', 'fields': [{'type': 'f64'}]},
                {'name': 'String', 'fields': [{'type': 'String'}]},
                {'name': 'Array', 'fields': [{'type': 'List<JsonValue>'}]},
                {'name': 'Object', 'fields': [{'type': 'Map<String, JsonValue>'}]},
            ],
            'methods': [
                {
                    'name': 'is_null',
                    'params': [{'name': 'self', 'type': '&Self'}],
                    'return_type': 'Bool',
                    'effects': [],
                },
                {
                    'name': 'as_bool',
                    'params': [{'name': 'self', 'type': '&Self'}],
                    'return_type': 'Option<Bool>',
                    'effects': [],
                },
                {
                    'name': 'as_number',
                    'params': [{'name': 'self', 'type': '&Self'}],
                    'return_type': 'Option<f64>',
                    'effects': [],
                },
                {
                    'name': 'as_string',
                    'params': [{'name': 'self', 'type': '&Self'}],
                    'return_type': 'Option<&str>',
                    'effects': [],
                },
                {
                    'name': 'get',
                    'params': [
                        {'name': 'self', 'type': '&Self'},
                        {'name': 'key', 'type': '&str'},
                    ],
                    'return_type': 'Option<&JsonValue>',
                    'effects': [],
                },
            ],
        }


JSON_VALUE_TYPE = JsonValueTypeDefinition()
