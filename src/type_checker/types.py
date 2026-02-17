"""Type representations for type inference.

Implements type variables, type schemes, and inferred types used during
Hindley-Milner type inference.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Set, Dict, Any
from abc import ABC, abstractmethod

from ..ast.types import Type, Effect, EffectKind
from ..span import Span, dummy_span


class InferredType(ABC):
    """Base class for inferred types during type checking."""
    
    @abstractmethod
    def free_vars(self) -> Set[str]:
        """Get free type variables in this type."""
        pass
    
    @abstractmethod
    def substitute(self, subst: Dict[str, "InferredType"]) -> "InferredType":
        """Apply substitution to this type."""
        pass
    
    @abstractmethod
    def to_ast_type(self) -> Optional[Type]:
        """Convert to AST type if fully resolved."""
        pass


@dataclass
class TypeVariable(InferredType):
    """A type variable (α, β, etc.) used in type inference."""
    name: str
    
    def free_vars(self) -> Set[str]:
        return {self.name}
    
    def substitute(self, subst: Dict[str, InferredType]) -> InferredType:
        return subst.get(self.name, self)
    
    def to_ast_type(self) -> Optional[Type]:
        return None  # Unresolved
    
    def __str__(self) -> str:
        return f"'{self.name}"
    
    def __hash__(self) -> int:
        return hash(self.name)


@dataclass
class ConcreteType(InferredType):
    """A concrete AST type."""
    ast_type: Type
    
    def free_vars(self) -> Set[str]:
        return set()
    
    def substitute(self, subst: Dict[str, InferredType]) -> InferredType:
        return self
    
    def to_ast_type(self) -> Optional[Type]:
        return self.ast_type
    
    def __str__(self) -> str:
        return str(self.ast_type)


@dataclass
class FunctionInferredType(InferredType):
    """Inferred function type with effects."""
    param_types: List[InferredType]
    return_type: InferredType
    effects: List[Effect] = field(default_factory=list)
    
    def free_vars(self) -> Set[str]:
        result = set()
        for param in self.param_types:
            result |= param.free_vars()
        result |= self.return_type.free_vars()
        return result
    
    def substitute(self, subst: Dict[str, InferredType]) -> InferredType:
        return FunctionInferredType(
            param_types=[p.substitute(subst) for p in self.param_types],
            return_type=self.return_type.substitute(subst),
            effects=self.effects,
        )
    
    def to_ast_type(self) -> Optional[Type]:
        from ..ast.types import FunctionType
        param_asts = [p.to_ast_type() for p in self.param_types]
        ret_ast = self.return_type.to_ast_type()
        if any(p is None for p in param_asts) or ret_ast is None:
            return None
        # Create a dummy span for the inferred type
        span = dummy_span()
        return FunctionType(
            params=param_asts,
            return_type=ret_ast,
            effects=self.effects,
            span=span,
        )
    
    def __str__(self) -> str:
        params = ", ".join(str(p) for p in self.param_types)
        effects_str = ""
        if self.effects:
            effects_str = " with " + ", ".join(str(e) for e in self.effects)
        return f"fn({params}) -> {self.return_type}{effects_str}"


@dataclass
class GenericInferredType(InferredType):
    """Generic type with type arguments (e.g., List<T>, Option<U>)."""
    name: str
    args: List[InferredType]
    
    def free_vars(self) -> Set[str]:
        result = set()
        for arg in self.args:
            result |= arg.free_vars()
        return result
    
    def substitute(self, subst: Dict[str, InferredType]) -> InferredType:
        return GenericInferredType(
            name=self.name,
            args=[arg.substitute(subst) for arg in self.args],
        )
    
    def to_ast_type(self) -> Optional[Type]:
        from ..ast.types import PathType
        arg_asts = [arg.to_ast_type() for arg in self.args]
        if any(a is None for a in arg_asts):
            return None
        span = dummy_span()
        return PathType(
            segments=[self.name],
            generic_args=arg_asts,
            span=span,
        )
    
    def __str__(self) -> str:
        if self.args:
            args = ", ".join(str(a) for a in self.args)
            return f"{self.name}<{args}>"
        return self.name


@dataclass
class BrandedInferredType(InferredType):
    """Branded type wrapping a base type."""
    brand_name: str
    base_type: InferredType
    
    def free_vars(self) -> Set[str]:
        return self.base_type.free_vars()
    
    def substitute(self, subst: Dict[str, InferredType]) -> InferredType:
        return BrandedInferredType(
            brand_name=self.brand_name,
            base_type=self.base_type.substitute(subst),
        )
    
    def to_ast_type(self) -> Optional[Type]:
        from ..ast.types import BrandedType
        base_ast = self.base_type.to_ast_type()
        if base_ast is None:
            return None
        span = dummy_span()
        return BrandedType(
            base_type=base_ast,
            brand_name=self.brand_name,
            span=span,
        )
    
    def __str__(self) -> str:
        return f"{self.brand_name}({self.base_type})"


@dataclass
class TypeScheme:
    """Polymorphic type scheme (∀α.τ) for let-polymorphism."""
    quantified_vars: List[str]
    body: InferredType
    
    def instantiate(self, fresh_var_generator) -> InferredType:
        """Instantiate type scheme with fresh type variables."""
        subst = {var: TypeVariable(fresh_var_generator()) for var in self.quantified_vars}
        return self.body.substitute(subst)
    
    def __str__(self) -> str:
        if self.quantified_vars:
            vars_str = " ".join(self.quantified_vars)
            return f"∀{vars_str}. {self.body}"
        return str(self.body)


def generalize(type_env_free_vars: Set[str], inferred_type: InferredType) -> TypeScheme:
    """Generalize a type into a type scheme by quantifying free variables.
    
    Only quantifies variables not free in the type environment (let-polymorphism).
    """
    free_in_type = inferred_type.free_vars()
    quantified = free_in_type - type_env_free_vars
    return TypeScheme(
        quantified_vars=sorted(list(quantified)),
        body=inferred_type,
    )
