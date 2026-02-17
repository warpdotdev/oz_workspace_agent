"""
Core operator traits for Veritas
"""

from dataclasses import dataclass
from typing import List, Dict


@dataclass
class TraitDefinition:
    """Generic trait definition"""
    name: str
    methods: List[Dict]
    type_params: List[str] = None
    
    def __post_init__(self):
        if self.type_params is None:
            self.type_params = []


# Equality trait
EQ_TRAIT = TraitDefinition(
    name='Eq',
    methods=[
        {
            'name': 'eq',
            'params': [
                {'name': 'self', 'type': '&Self'},
                {'name': 'other', 'type': '&Self'},
            ],
            'return_type': 'Bool',
            'effects': [],
        },
        {
            'name': 'ne',
            'params': [
                {'name': 'self', 'type': '&Self'},
                {'name': 'other', 'type': '&Self'},
            ],
            'return_type': 'Bool',
            'effects': [],
            'default_impl': True,
        },
    ],
)

# Partial equality trait
PARTIAL_EQ_TRAIT = TraitDefinition(
    name='PartialEq',
    methods=[
        {
            'name': 'eq',
            'params': [
                {'name': 'self', 'type': '&Self'},
                {'name': 'other', 'type': '&Self'},
            ],
            'return_type': 'Bool',
            'effects': [],
        },
    ],
)

# Ordering trait
ORD_TRAIT = TraitDefinition(
    name='Ord',
    methods=[
        {
            'name': 'cmp',
            'params': [
                {'name': 'self', 'type': '&Self'},
                {'name': 'other', 'type': '&Self'},
            ],
            'return_type': 'Ordering',
            'effects': [],
        },
        {
            'name': 'lt',
            'params': [
                {'name': 'self', 'type': '&Self'},
                {'name': 'other', 'type': '&Self'},
            ],
            'return_type': 'Bool',
            'effects': [],
            'default_impl': True,
        },
        {
            'name': 'le',
            'params': [
                {'name': 'self', 'type': '&Self'},
                {'name': 'other', 'type': '&Self'},
            ],
            'return_type': 'Bool',
            'effects': [],
            'default_impl': True,
        },
        {
            'name': 'gt',
            'params': [
                {'name': 'self', 'type': '&Self'},
                {'name': 'other', 'type': '&Self'},
            ],
            'return_type': 'Bool',
            'effects': [],
            'default_impl': True,
        },
        {
            'name': 'ge',
            'params': [
                {'name': 'self', 'type': '&Self'},
                {'name': 'other', 'type': '&Self'},
            ],
            'return_type': 'Bool',
            'effects': [],
            'default_impl': True,
        },
    ],
)

# Hash trait
HASH_TRAIT = TraitDefinition(
    name='Hash',
    methods=[
        {
            'name': 'hash',
            'params': [
                {'name': 'self', 'type': '&Self'},
                {'name': 'state', 'type': '&mut H'},
            ],
            'type_params': ['H: Hasher'],
            'return_type': '()',
            'effects': [],
        },
    ],
)

# Clone trait
CLONE_TRAIT = TraitDefinition(
    name='Clone',
    methods=[
        {
            'name': 'clone',
            'params': [{'name': 'self', 'type': '&Self'}],
            'return_type': 'Self',
            'effects': [],
        },
    ],
)

# Default trait
DEFAULT_TRAIT = TraitDefinition(
    name='Default',
    methods=[
        {
            'name': 'default',
            'params': [],
            'return_type': 'Self',
            'effects': [],
        },
    ],
)

# Display trait
DISPLAY_TRAIT = TraitDefinition(
    name='Display',
    methods=[
        {
            'name': 'fmt',
            'params': [
                {'name': 'self', 'type': '&Self'},
                {'name': 'f', 'type': '&mut Formatter'},
            ],
            'return_type': 'Result<(), FmtError>',
            'effects': [],
        },
    ],
)

# Debug trait
DEBUG_TRAIT = TraitDefinition(
    name='Debug',
    methods=[
        {
            'name': 'fmt',
            'params': [
                {'name': 'self', 'type': '&Self'},
                {'name': 'f', 'type': '&mut Formatter'},
            ],
            'return_type': 'Result<(), FmtError>',
            'effects': [],
        },
    ],
)

# All core traits
ALL_TRAITS = [
    EQ_TRAIT,
    PARTIAL_EQ_TRAIT,
    ORD_TRAIT,
    HASH_TRAIT,
    CLONE_TRAIT,
    DEFAULT_TRAIT,
    DISPLAY_TRAIT,
    DEBUG_TRAIT,
]
