"""
Numeric operations and constants
"""

MATH_CONSTANTS = {
    'PI': 3.141592653589793,
    'E': 2.718281828459045,
    'TAU': 6.283185307179586,
}

MATH_FUNCTIONS = [
    {'name': 'abs', 'params': [{'name': 'x', 'type': 'T'}], 'return_type': 'T', 'type_params': ['T: Signed']},
    {'name': 'min', 'params': [{'name': 'a', 'type': 'T'}, {'name': 'b', 'type': 'T'}], 'return_type': 'T', 'type_params': ['T: Ord']},
    {'name': 'max', 'params': [{'name': 'a', 'type': 'T'}, {'name': 'b', 'type': 'T'}], 'return_type': 'T', 'type_params': ['T: Ord']},
    {'name': 'sqrt', 'params': [{'name': 'x', 'type': 'f64'}], 'return_type': 'f64'},
    {'name': 'pow', 'params': [{'name': 'base', 'type': 'f64'}, {'name': 'exp', 'type': 'f64'}], 'return_type': 'f64'},
    {'name': 'sin', 'params': [{'name': 'x', 'type': 'f64'}], 'return_type': 'f64'},
    {'name': 'cos', 'params': [{'name': 'x', 'type': 'f64'}], 'return_type': 'f64'},
]
