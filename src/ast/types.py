"""Type AST nodes for the Veritas language."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Optional, List, TYPE_CHECKING

from ..span import Span

if TYPE_CHECKING:
    from .nodes import Expression


class PrimitiveKind(Enum):
    """Primitive type kinds."""
    I8 = auto()
    I16 = auto()
    I32 = auto()
    I64 = auto()
    I128 = auto()
    U8 = auto()
    U16 = auto()
    U32 = auto()
    U64 = auto()
    U128 = auto()
    F32 = auto()
    F64 = auto()
    BOOL = auto()
    CHAR = auto()
    STR = auto()
    
    @classmethod
    def from_string(cls, s: str) -> Optional["PrimitiveKind"]:
        mapping = {
            "i8": cls.I8, "i16": cls.I16, "i32": cls.I32, "i64": cls.I64, "i128": cls.I128,
            "u8": cls.U8, "u16": cls.U16, "u32": cls.U32, "u64": cls.U64, "u128": cls.U128,
            "f32": cls.F32, "f64": cls.F64,
            "bool": cls.BOOL, "char": cls.CHAR, "str": cls.STR,
        }
        return mapping.get(s)


@dataclass
class Type(ABC):
    """Base class for all type AST nodes."""
    span: Span
    
    @abstractmethod
    def __str__(self) -> str:
        pass


@dataclass
class PrimitiveType(Type):
    """Primitive type (i32, u64, bool, etc.)."""
    kind: PrimitiveKind
    
    def __str__(self) -> str:
        return self.kind.name.lower()


@dataclass
class PathType(Type):
    """A type path (std::collections::HashMap, Result, Option)."""
    segments: List[str]
    generic_args: List[Type] = field(default_factory=list)
    
    def __str__(self) -> str:
        path = "::".join(self.segments)
        if self.generic_args:
            args = ", ".join(str(a) for a in self.generic_args)
            return f"{path}<{args}>"
        return path


@dataclass
class BrandedType(Type):
    """Branded type (type UserId = u64 as UserId)."""
    base_type: Type
    brand_name: str
    
    def __str__(self) -> str:
        return f"{self.base_type} as {self.brand_name}"


@dataclass
class GenericType(Type):
    """Generic type instantiation (List<T>, Map<K, V>)."""
    name: str
    args: List[Type]
    
    def __str__(self) -> str:
        args = ", ".join(str(a) for a in self.args)
        return f"{self.name}<{args}>"


@dataclass
class FunctionType(Type):
    """Function type (fn(i32, i32) -> i32 !IO)."""
    params: List[Type]
    return_type: Optional[Type]
    effects: List["Effect"] = field(default_factory=list)
    
    def __str__(self) -> str:
        params = ", ".join(str(p) for p in self.params)
        ret = f" -> {self.return_type}" if self.return_type else ""
        effects = ""
        if self.effects:
            effects = " !" + " + ".join(str(e) for e in self.effects)
        return f"fn({params}){ret}{effects}"


@dataclass  
class ReferenceType(Type):
    """Reference type (&T, &mut T, &'a T)."""
    inner: Type
    mutable: bool = False
    lifetime: Optional[str] = None
    
    def __str__(self) -> str:
        lt = f"'{self.lifetime} " if self.lifetime else ""
        mut = "mut " if self.mutable else ""
        return f"&{lt}{mut}{self.inner}"


@dataclass
class TupleType(Type):
    """Tuple type ((i32, String, bool))."""
    elements: List[Type]
    
    def __str__(self) -> str:
        elems = ", ".join(str(e) for e in self.elements)
        return f"({elems})"


@dataclass
class ArrayType(Type):
    """Array type ([T; N])."""
    element: Type
    size: Optional["Expression"] = None  # None for slices [T]
    
    def __str__(self) -> str:
        if self.size:
            return f"[{self.element}; {self.size}]"
        return f"[{self.element}]"


class EffectKind(Enum):
    """Effect kinds."""
    IO = auto()
    STATE = auto()
    ERROR = auto()
    ASYNC = auto()


@dataclass
class Effect:
    """An effect annotation (!IO, !State<T>, !Error<E>, !Async)."""
    kind: EffectKind
    span: Span
    type_arg: Optional[Type] = None  # For State<T> and Error<E>
    
    def __str__(self) -> str:
        if self.type_arg:
            return f"{self.kind.name.title()}<{self.type_arg}>"
        return self.kind.name
