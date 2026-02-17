"""
Random number generation
"""

RNG_TYPE = {
    'kind': 'struct',
    'name': 'Rng',
    'fields': [],  # Private: seed state
    'methods': [
        {
            'name': 'new',
            'params': [],
            'return_type': 'Rng',
            'effects': ['IO'],  # Seeded from system entropy
        },
        {
            'name': 'from_seed',
            'params': [{'name': 'seed', 'type': 'u64'}],
            'return_type': 'Rng',
            'effects': [],  # Deterministic
        },
        {
            'name': 'next_u64',
            'params': [{'name': 'self', 'type': '&mut Self'}],
            'return_type': 'u64',
            'effects': [],
        },
        {
            'name': 'next_f64',
            'params': [{'name': 'self', 'type': '&mut Self'}],
            'return_type': 'f64',
            'effects': [],
        },
    ],
}
