"""AST node definitions for the Veritas language.

Covers all language constructs from the EBNF grammar.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Optional, List, Union, Any

from ..span import Span
from .types import Type, Effect


# ============================================================================
# Base Classes
# ============================================================================

@dataclass
class ASTNode(ABC):
    """Base class for all AST nodes."""
    span: Span


# ============================================================================
# Program Structure
# ============================================================================

@dataclass
class Program(ASTNode):
    """The root AST node representing a complete program."""
    items: List["ModuleItem"]


@dataclass
class ModuleItem(ASTNode):
    """Base class for module-level items."""
    pass


@dataclass
class ModuleDef(ModuleItem):
    """Module definition (mod foo { ... })."""
    name: str
    items: List[ModuleItem]
    visibility: Optional["Visibility"] = None


@dataclass
class Import(ModuleItem):
    """Import statement (import std::collections::HashMap)."""
    path: List[str]
    alias: Optional[str] = None
    items: Optional[List[str]] = None  # For {Item1, Item2} imports


class Visibility(Enum):
    """Visibility modifiers."""
    PRIVATE = auto()
    PUBLIC = auto()
    CRATE = auto()  # pub(crate)


# ============================================================================
# Definitions
# ============================================================================

@dataclass
class GenericParam:
    """Generic type parameter (T, T: Bound)."""
    name: str
    span: Span
    bounds: List[str] = field(default_factory=list)


@dataclass
class Parameter:
    """Function parameter (name: Type)."""
    name: str
    type: Type
    span: Span
    mutable: bool = False


@dataclass
class FunctionDef(ModuleItem):
    """Function definition."""
    name: str
    params: List[Parameter]
    return_type: Optional[Type] = None
    body: Optional["BlockExpr"] = None  # None for trait methods
    visibility: Optional[Visibility] = None
    generic_params: List[GenericParam] = field(default_factory=list)
    effects: List[Effect] = field(default_factory=list)
    contracts: List["Contract"] = field(default_factory=list)
    is_async: bool = False


@dataclass
class Field:
    """Struct field."""
    name: str
    type: Type
    span: Span
    visibility: Optional[Visibility] = None


@dataclass
class StructDef(ModuleItem):
    """Struct definition."""
    name: str
    fields: List[Field]
    visibility: Optional[Visibility] = None
    generic_params: List[GenericParam] = field(default_factory=list)


@dataclass
class Variant:
    """Enum variant."""
    name: str
    span: Span
    fields: Optional[List[Type]] = None  # Tuple variant fields
    named_fields: Optional[List[Field]] = None  # Struct variant fields


@dataclass
class EnumDef(ModuleItem):
    """Enum definition."""
    name: str
    variants: List[Variant]
    visibility: Optional[Visibility] = None
    generic_params: List[GenericParam] = field(default_factory=list)


@dataclass
class TypeAlias(ModuleItem):
    """Type alias (type UserId = u64 as UserId)."""
    name: str
    aliased_type: Type
    visibility: Optional[Visibility] = None
    generic_params: List[GenericParam] = field(default_factory=list)


@dataclass
class ConstDef(ModuleItem):
    """Constant definition (const MAX: i32 = 100)."""
    name: str
    type: Type
    value: "Expression"
    visibility: Optional[Visibility] = None


@dataclass
class TraitDef(ModuleItem):
    """Trait definition."""
    name: str
    methods: List[FunctionDef]
    visibility: Optional[Visibility] = None
    generic_params: List[GenericParam] = field(default_factory=list)
    super_traits: List[str] = field(default_factory=list)


@dataclass
class ImplBlock(ModuleItem):
    """Implementation block (impl T or impl Trait for T)."""
    target_type: Type
    methods: List[FunctionDef]
    trait_name: Optional[str] = None
    generic_params: List[GenericParam] = field(default_factory=list)


# ============================================================================
# Contracts
# ============================================================================

class ContractKind(Enum):
    """Contract kinds."""
    REQUIRES = auto()
    ENSURES = auto()
    INVARIANT = auto()


@dataclass
class Contract:
    """Contract clause (requires, ensures, invariant)."""
    kind: ContractKind
    condition: "Expression"
    span: Span


# ============================================================================
# Statements
# ============================================================================

@dataclass
class Statement(ASTNode):
    """Base class for statements."""
    pass


@dataclass
class LetStmt(Statement):
    """Let statement (let x: i32 = 42)."""
    name: str
    type: Optional[Type] = None
    value: Optional["Expression"] = None
    mutable: bool = False
    pattern: Optional["Pattern"] = None  # For pattern destructuring


@dataclass
class AssignStmt(Statement):
    """Assignment statement (x = 42)."""
    target: "Expression"
    value: "Expression"


@dataclass
class ExprStmt(Statement):
    """Expression statement."""
    expr: "Expression"


@dataclass
class ReturnStmt(Statement):
    """Return statement."""
    value: Optional["Expression"] = None


@dataclass
class BreakStmt(Statement):
    """Break statement."""
    value: Optional["Expression"] = None
    label: Optional[str] = None


@dataclass
class ContinueStmt(Statement):
    """Continue statement."""
    label: Optional[str] = None


# ============================================================================
# Expressions
# ============================================================================

@dataclass
class Expression(ASTNode):
    """Base class for expressions."""
    pass


class LiteralKind(Enum):
    """Literal kinds."""
    INT = auto()
    FLOAT = auto()
    STRING = auto()
    CHAR = auto()
    BOOL = auto()


@dataclass
class Literal(Expression):
    """Literal expression (42, 3.14, "hello", 'a', true)."""
    kind: LiteralKind
    value: Any
    suffix: Optional[str] = None  # Type suffix like 42u64


@dataclass
class Identifier(Expression):
    """Identifier expression."""
    name: str


@dataclass
class PathExpr(Expression):
    """Path expression (std::io::File, Self::method)."""
    segments: List[str]
    generic_args: Optional[List[Type]] = None


class BinaryOpKind(Enum):
    """Binary operator kinds."""
    # Arithmetic
    ADD = auto()      # +
    SUB = auto()      # -
    MUL = auto()      # *
    DIV = auto()      # /
    MOD = auto()      # %
    
    # Comparison
    EQ = auto()       # ==
    NE = auto()       # !=
    LT = auto()       # <
    GT = auto()       # >
    LE = auto()       # <=
    GE = auto()       # >=
    
    # Logical
    AND = auto()      # &&
    OR = auto()       # ||
    
    # Bitwise
    BIT_AND = auto()  # &
    BIT_OR = auto()   # |
    BIT_XOR = auto()  # ^
    SHL = auto()      # <<
    SHR = auto()      # >>


@dataclass
class BinaryOp(Expression):
    """Binary operation (a + b)."""
    op: BinaryOpKind
    left: Expression
    right: Expression


class UnaryOpKind(Enum):
    """Unary operator kinds."""
    NEG = auto()      # -
    NOT = auto()      # !
    DEREF = auto()    # *
    REF = auto()      # &
    REF_MUT = auto()  # &mut


@dataclass
class UnaryOp(Expression):
    """Unary operation (-x, !b, *p, &x)."""
    op: UnaryOpKind
    operand: Expression


@dataclass
class FunctionCall(Expression):
    """Function call (foo(a, b))."""
    function: Expression
    args: List[Expression]
    generic_args: Optional[List[Type]] = None


@dataclass
class MethodCall(Expression):
    """Method call (obj.method(a, b))."""
    object: Expression
    method: str
    args: List[Expression]
    generic_args: Optional[List[Type]] = None


@dataclass
class FieldAccess(Expression):
    """Field access (obj.field)."""
    object: Expression
    field: str


@dataclass
class IndexAccess(Expression):
    """Index access (arr[i])."""
    object: Expression
    index: Expression


@dataclass
class IfExpr(Expression):
    """If expression (if cond { ... } else { ... })."""
    condition: Expression
    then_branch: "BlockExpr"
    else_branch: Optional[Union["BlockExpr", "IfExpr"]] = None


@dataclass
class MatchArm:
    """A single arm in a match expression."""
    pattern: "Pattern"
    guard: Optional[Expression]
    body: Expression
    span: Span


@dataclass
class MatchExpr(Expression):
    """Match expression."""
    scrutinee: Expression
    arms: List[MatchArm]


@dataclass
class BlockExpr(Expression):
    """Block expression ({ stmt1; stmt2; expr })."""
    statements: List[Statement]
    expr: Optional[Expression] = None  # Final expression (no semicolon)


@dataclass
class LambdaExpr(Expression):
    """Lambda/closure expression (|x, y| x + y)."""
    params: List[Parameter]
    body: Expression
    return_type: Optional[Type] = None
    is_move: bool = False


@dataclass
class ForExpr(Expression):
    """For loop expression (for x in iter { ... })."""
    pattern: "Pattern"
    iterable: Expression
    body: BlockExpr
    label: Optional[str] = None


@dataclass
class WhileExpr(Expression):
    """While loop expression (while cond { ... })."""
    condition: Expression
    body: BlockExpr
    label: Optional[str] = None


@dataclass
class LoopExpr(Expression):
    """Infinite loop expression (loop { ... })."""
    body: BlockExpr
    label: Optional[str] = None


@dataclass
class RangeExpr(Expression):
    """Range expression (0..10, 0..=10, .., ..10)."""
    start: Optional[Expression]
    end: Optional[Expression]
    inclusive: bool = False


@dataclass
class StructExpr(Expression):
    """Struct instantiation (Point { x: 1, y: 2 })."""
    name: str
    path: Optional[List[str]] = None
    fields: List[tuple[str, Expression]] = field(default_factory=list)
    base: Optional[Expression] = None  # For ..other syntax


@dataclass
class TupleExpr(Expression):
    """Tuple expression ((1, "hello", true))."""
    elements: List[Expression]


@dataclass
class ArrayExpr(Expression):
    """Array expression ([1, 2, 3] or [0; 10])."""
    elements: List[Expression]
    repeat: Optional[Expression] = None  # For [value; count] syntax


@dataclass
class CastExpr(Expression):
    """Cast expression (x as i64)."""
    expr: Expression
    target_type: Type


@dataclass
class AwaitExpr(Expression):
    """Await expression (future.await)."""
    expr: Expression


@dataclass
class TryExpr(Expression):
    """Try expression (expr?)."""
    expr: Expression


# ============================================================================
# Patterns
# ============================================================================

@dataclass
class Pattern(ASTNode):
    """Base class for patterns."""
    pass


@dataclass
class LiteralPattern(Pattern):
    """Literal pattern (42, "hello")."""
    value: Literal


@dataclass
class IdentifierPattern(Pattern):
    """Identifier pattern (x, mut x, ref x)."""
    name: str
    mutable: bool = False
    is_ref: bool = False


@dataclass
class WildcardPattern(Pattern):
    """Wildcard pattern (_)."""
    pass


@dataclass
class TuplePattern(Pattern):
    """Tuple pattern ((a, b, c))."""
    elements: List[Pattern]


@dataclass
class FieldPattern:
    """Field in a struct pattern."""
    name: str
    pattern: Optional[Pattern]  # None means use field name as binding
    span: Span


@dataclass
class StructPattern(Pattern):
    """Struct pattern (Point { x, y })."""
    name: str
    path: Optional[List[str]] = None
    fields: List[FieldPattern] = field(default_factory=list)
    rest: bool = False  # Has .. at end


@dataclass
class EnumPattern(Pattern):
    """Enum pattern (Some(x), Err(e))."""
    name: str
    path: Optional[List[str]] = None
    fields: Optional[List[Pattern]] = None


@dataclass
class OrPattern(Pattern):
    """Or pattern (A | B | C)."""
    patterns: List[Pattern]


@dataclass
class RangePattern(Pattern):
    """Range pattern (0..10, 'a'..='z')."""
    start: Optional[Literal]
    end: Optional[Literal]
    inclusive: bool = False
