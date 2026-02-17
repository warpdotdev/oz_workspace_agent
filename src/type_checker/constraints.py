"""Constraint generation and solving for type inference.

Implements the constraint-based approach to Hindley-Milner type inference.
"""

from dataclasses import dataclass
from typing import List, Dict, Optional
from enum import Enum, auto

from .types import (
    InferredType, TypeVariable, ConcreteType, FunctionInferredType,
    GenericInferredType, BrandedInferredType
)
from ..span import Span


class ConstraintKind(Enum):
    """Types of type constraints."""
    EQUALITY = auto()  # T1 = T2
    SUBTYPE = auto()   # T1 <: T2 (for branded types)


@dataclass
class Constraint:
    """A type constraint generated during type inference."""
    kind: ConstraintKind
    left: InferredType
    right: InferredType
    span: Span  # For error reporting
    
    def __str__(self) -> str:
        op = "=" if self.kind == ConstraintKind.EQUALITY else "<:"
        return f"{self.left} {op} {self.right}"


class UnificationError(Exception):
    """Error during type unification."""
    def __init__(self, message: str, span: Span):
        super().__init__(message)
        self.span = span


class ConstraintSolver:
    """Solves type constraints using unification.
    
    Implements the Robinson unification algorithm with occurs check.
    """
    
    def __init__(self):
        self.substitution: Dict[str, InferredType] = {}
    
    def solve(self, constraints: List[Constraint]) -> Dict[str, InferredType]:
        """Solve a list of constraints and return the unifying substitution."""
        for constraint in constraints:
            if constraint.kind == ConstraintKind.EQUALITY:
                self._unify(constraint.left, constraint.right, constraint.span)
            elif constraint.kind == ConstraintKind.SUBTYPE:
                self._check_subtype(constraint.left, constraint.right, constraint.span)
        
        return self.substitution
    
    def _unify(self, t1: InferredType, t2: InferredType, span: Span) -> None:
        """Unify two types, updating the substitution."""
        # Apply current substitution
        t1 = t1.substitute(self.substitution)
        t2 = t2.substitute(self.substitution)
        
        # Same type - already unified
        if self._types_equal(t1, t2):
            return
        
        # Variable unification
        if isinstance(t1, TypeVariable):
            self._unify_variable(t1.name, t2, span)
        elif isinstance(t2, TypeVariable):
            self._unify_variable(t2.name, t1, span)
        
        # Function type unification
        elif isinstance(t1, FunctionInferredType) and isinstance(t2, FunctionInferredType):
            if len(t1.param_types) != len(t2.param_types):
                raise UnificationError(
                    f"Cannot unify functions with different arities: {t1} and {t2}",
                    span
                )
            for p1, p2 in zip(t1.param_types, t2.param_types):
                self._unify(p1, p2, span)
            self._unify(t1.return_type, t2.return_type, span)
            # Check effects are compatible
            self._unify_effects(t1.effects, t2.effects, span)
        
        # Generic type unification
        elif isinstance(t1, GenericInferredType) and isinstance(t2, GenericInferredType):
            if t1.name != t2.name:
                raise UnificationError(
                    f"Cannot unify different generic types: {t1.name} and {t2.name}",
                    span
                )
            if len(t1.args) != len(t2.args):
                raise UnificationError(
                    f"Cannot unify {t1.name} with different numbers of type arguments",
                    span
                )
            for a1, a2 in zip(t1.args, t2.args):
                self._unify(a1, a2, span)
        
        # Branded type unification  
        elif isinstance(t1, BrandedInferredType) and isinstance(t2, BrandedInferredType):
            if t1.brand_name != t2.brand_name:
                raise UnificationError(
                    f"Cannot unify different branded types: {t1.brand_name} and {t2.brand_name}",
                    span
                )
            self._unify(t1.base_type, t2.base_type, span)
        
        # Concrete types
        elif isinstance(t1, ConcreteType) and isinstance(t2, ConcreteType):
            if not self._ast_types_equal(t1.ast_type, t2.ast_type):
                raise UnificationError(
                    f"Cannot unify different concrete types: {t1} and {t2}",
                    span
                )
        
        else:
            raise UnificationError(
                f"Cannot unify incompatible types: {t1} and {t2}",
                span
            )
    
    def _unify_variable(self, var_name: str, t: InferredType, span: Span) -> None:
        """Unify a type variable with a type."""
        # Occurs check - prevent infinite types like α = List<α>
        if var_name in t.free_vars():
            raise UnificationError(
                f"Occurs check failed: '{var_name} appears in {t}",
                span
            )
        
        # Add substitution
        self.substitution[var_name] = t
    
    def _types_equal(self, t1: InferredType, t2: InferredType) -> bool:
        """Check if two inferred types are equal."""
        if type(t1) != type(t2):
            return False
        
        if isinstance(t1, TypeVariable):
            return t1.name == t2.name
        elif isinstance(t1, ConcreteType):
            return self._ast_types_equal(t1.ast_type, t2.ast_type)
        elif isinstance(t1, FunctionInferredType):
            t2 = t2  # type hint
            return (
                len(t1.param_types) == len(t2.param_types) and
                all(self._types_equal(p1, p2) for p1, p2 in zip(t1.param_types, t2.param_types)) and
                self._types_equal(t1.return_type, t2.return_type)
            )
        elif isinstance(t1, GenericInferredType):
            t2 = t2  # type hint
            return (
                t1.name == t2.name and
                len(t1.args) == len(t2.args) and
                all(self._types_equal(a1, a2) for a1, a2 in zip(t1.args, t2.args))
            )
        elif isinstance(t1, BrandedInferredType):
            t2 = t2  # type hint
            return (
                t1.brand_name == t2.brand_name and
                self._types_equal(t1.base_type, t2.base_type)
            )
        
        return False
    
    def _ast_types_equal(self, t1, t2) -> bool:
        """Check if two AST types are equal."""
        # Simplified equality check - in production would need full comparison
        return str(t1) == str(t2)
    
    def _unify_effects(self, effects1, effects2, span: Span) -> None:
        """Check that effect lists are compatible."""
        # For now, require exact match of effects
        # In a full implementation, would check effect subsumption
        if len(effects1) != len(effects2):
            raise UnificationError(
                f"Incompatible effects: {effects1} and {effects2}",
                span
            )
        # Effect order doesn't matter, so convert to sets for comparison
        effect_kinds1 = {e.kind for e in effects1}
        effect_kinds2 = {e.kind for e in effects2}
        if effect_kinds1 != effect_kinds2:
            raise UnificationError(
                f"Incompatible effects: {effects1} and {effects2}",
                span
            )
    
    def _check_subtype(self, t1: InferredType, t2: InferredType, span: Span) -> None:
        """Check subtype relationship (for branded types, variance, etc.)."""
        # Apply current substitution
        t1 = t1.substitute(self.substitution)
        t2 = t2.substitute(self.substitution)
        
        # For now, branded types require exact match (nominal typing)
        # Could be extended for structural subtyping
        self._unify(t1, t2, span)
