"""Veritas Type Checker and Type System Implementation.

This module implements:
- Hindley-Milner type inference with constraints
- Branded type checking
- Effect system validation
- Pattern exhaustiveness checking
- Contract verification
"""

from .checker import TypeChecker, TypeCheckError
from .types import InferredType, TypeVariable, TypeScheme
from .env import TypeEnvironment
from .constraints import Constraint, ConstraintSolver

__all__ = [
    "TypeChecker",
    "TypeCheckError",
    "InferredType",
    "TypeVariable",
    "TypeScheme",
    "TypeEnvironment",
    "Constraint",
    "ConstraintSolver",
]
