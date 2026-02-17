"""Type environment for tracking variable types during type checking."""

from dataclasses import dataclass, field
from typing import Optional, Dict, Set

from .types import TypeScheme, InferredType


@dataclass
class TypeEnvironment:
    """Type environment mapping variable names to type schemes.
    
    Supports scoping with parent environments for nested blocks.
    """
    bindings: Dict[str, TypeScheme] = field(default_factory=dict)
    parent: Optional["TypeEnvironment"] = None
    
    def lookup(self, name: str) -> Optional[TypeScheme]:
        """Look up a variable's type scheme."""
        if name in self.bindings:
            return self.bindings[name]
        if self.parent:
            return self.parent.lookup(name)
        return None
    
    def bind(self, name: str, scheme: TypeScheme) -> None:
        """Bind a variable to a type scheme in this environment."""
        self.bindings[name] = scheme
    
    def extend(self, name: str, scheme: TypeScheme) -> "TypeEnvironment":
        """Create a new environment extending this one with a new binding."""
        child = TypeEnvironment(parent=self)
        child.bind(name, scheme)
        return child
    
    def free_vars(self) -> Set[str]:
        """Get all free type variables in the environment."""
        result = set()
        for scheme in self.bindings.values():
            # Only include free vars from the body that aren't quantified
            body_free = scheme.body.free_vars()
            quantified = set(scheme.quantified_vars)
            result |= (body_free - quantified)
        if self.parent:
            result |= self.parent.free_vars()
        return result
    
    def __repr__(self) -> str:
        items = [f"{name}: {scheme}" for name, scheme in self.bindings.items()]
        return f"TypeEnv({', '.join(items)})"
