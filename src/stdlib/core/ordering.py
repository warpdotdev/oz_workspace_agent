"""
Ordering type and comparison traits
"""

from dataclasses import dataclass


@dataclass
class OrderingTypeDefinition:
    """Ordering enum for comparisons"""
    
    def get_type_definition(self) -> dict:
        return {
            'kind': 'enum',
            'name': 'Ordering',
            'type_params': [],
            'variants': [
                {'name': 'Less', 'fields': []},
                {'name': 'Equal', 'fields': []},
                {'name': 'Greater', 'fields': []},
            ],
            'methods': [],
        }


# Singleton instance
ORDERING_TYPE = OrderingTypeDefinition()
