"""Token definitions for the Veritas lexer.

Based on the EBNF grammar from Phase 2 syntax specification.
"""

from dataclasses import dataclass
from enum import Enum, auto
from typing import Optional, Any

from ..span import Span


class TokenKind(Enum):
    """All token types in the Veritas language."""
    
    # End of file
    EOF = auto()
    
    # Literals
    INT_LITERAL = auto()      # 42, 0xFF, 0b1010
    FLOAT_LITERAL = auto()    # 3.14, 1e-10
    STRING_LITERAL = auto()   # "hello"
    CHAR_LITERAL = auto()     # 'a'
    BOOL_LITERAL = auto()     # true, false
    
    # Identifiers
    IDENT = auto()            # foo, bar_baz, FooBar
    LIFETIME = auto()         # 'a, 'static
    
    # Keywords - Functions
    FN = auto()               # fn
    RETURN = auto()           # return
    
    # Keywords - Types and Structs
    STRUCT = auto()           # struct
    ENUM = auto()             # enum
    TYPE = auto()             # type
    IMPL = auto()             # impl
    TRAIT = auto()            # trait
    AS = auto()               # as (for branded types and casts)
    
    # Keywords - Variables
    LET = auto()              # let
    MUT = auto()              # mut
    CONST = auto()            # const
    
    # Keywords - Control Flow
    IF = auto()               # if
    ELSE = auto()             # else
    MATCH = auto()            # match
    FOR = auto()              # for
    WHILE = auto()            # while
    LOOP = auto()             # loop
    BREAK = auto()            # break
    CONTINUE = auto()         # continue
    IN = auto()               # in
    
    # Keywords - Modules
    MOD = auto()              # mod
    PUB = auto()              # pub
    IMPORT = auto()           # import
    CRATE = auto()            # crate
    SUPER = auto()            # super
    SELF = auto()             # self
    SELF_TYPE = auto()        # Self
    
    # Keywords - Effects
    EFFECT = auto()           # effect marker (!)
    IO = auto()               # IO effect
    STATE = auto()            # State effect
    ERROR = auto()            # Error effect
    ASYNC = auto()            # Async effect
    AWAIT = auto()            # await
    
    # Keywords - Contracts
    REQUIRES = auto()         # requires
    ENSURES = auto()          # ensures
    INVARIANT = auto()        # invariant
    
    # Keywords - Memory/Ownership
    MOVE = auto()             # move (explicit)
    REF = auto()              # ref
    BOX = auto()              # Box
    
    # Primitive Types
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
    
    # Delimiters
    LPAREN = auto()           # (
    RPAREN = auto()           # )
    LBRACE = auto()           # {
    RBRACE = auto()           # }
    LBRACKET = auto()         # [
    RBRACKET = auto()         # ]
    
    # Punctuation
    COMMA = auto()            # ,
    SEMICOLON = auto()        # ;
    COLON = auto()            # :
    DOUBLE_COLON = auto()     # ::
    DOT = auto()              # .
    DOTDOT = auto()           # ..
    DOTDOTEQ = auto()         # ..=
    ARROW = auto()            # ->
    FAT_ARROW = auto()        # =>
    QUESTION = auto()         # ?
    AT = auto()               # @
    HASH = auto()             # #
    UNDERSCORE = auto()       # _ (wildcard)
    
    # Operators - Arithmetic
    PLUS = auto()             # +
    MINUS = auto()            # -
    STAR = auto()             # *
    SLASH = auto()            # /
    PERCENT = auto()          # %
    
    # Operators - Comparison
    EQ = auto()               # ==
    NE = auto()               # !=
    LT = auto()               # <
    GT = auto()               # >
    LE = auto()               # <=
    GE = auto()               # >=
    
    # Operators - Logical
    AND = auto()              # &&
    OR = auto()               # ||
    NOT = auto()              # ! (unary)
    
    # Operators - Bitwise
    AMPERSAND = auto()        # & (also reference)
    PIPE = auto()             # |
    CARET = auto()            # ^
    SHL = auto()              # <<
    SHR = auto()              # >>
    
    # Assignment
    ASSIGN = auto()           # =
    PLUS_ASSIGN = auto()      # +=
    MINUS_ASSIGN = auto()     # -=
    STAR_ASSIGN = auto()      # *=
    SLASH_ASSIGN = auto()     # /=
    PERCENT_ASSIGN = auto()   # %=
    AND_ASSIGN = auto()       # &=
    OR_ASSIGN = auto()        # |=
    CARET_ASSIGN = auto()     # ^=
    SHL_ASSIGN = auto()       # <<=
    SHR_ASSIGN = auto()       # >>=
    
    # Special
    LEXER_ERROR = auto()      # Lexer error token
    COMMENT = auto()          # Comment (usually skipped)


# Keyword mappings
KEYWORDS: dict[str, TokenKind] = {
    # Functions
    "fn": TokenKind.FN,
    "return": TokenKind.RETURN,
    
    # Types
    "struct": TokenKind.STRUCT,
    "enum": TokenKind.ENUM,
    "type": TokenKind.TYPE,
    "impl": TokenKind.IMPL,
    "trait": TokenKind.TRAIT,
    "as": TokenKind.AS,
    
    # Variables
    "let": TokenKind.LET,
    "mut": TokenKind.MUT,
    "const": TokenKind.CONST,
    
    # Control flow
    "if": TokenKind.IF,
    "else": TokenKind.ELSE,
    "match": TokenKind.MATCH,
    "for": TokenKind.FOR,
    "while": TokenKind.WHILE,
    "loop": TokenKind.LOOP,
    "break": TokenKind.BREAK,
    "continue": TokenKind.CONTINUE,
    "in": TokenKind.IN,
    
    # Modules
    "mod": TokenKind.MOD,
    "pub": TokenKind.PUB,
    "import": TokenKind.IMPORT,
    "crate": TokenKind.CRATE,
    "super": TokenKind.SUPER,
    "self": TokenKind.SELF,
    "Self": TokenKind.SELF_TYPE,
    
    # Effects
    "IO": TokenKind.IO,
    "State": TokenKind.STATE,
    "Error": TokenKind.ERROR,
    "Async": TokenKind.ASYNC,
    "await": TokenKind.AWAIT,
    
    # Contracts
    "requires": TokenKind.REQUIRES,
    "ensures": TokenKind.ENSURES,
    "invariant": TokenKind.INVARIANT,
    
    # Memory
    "move": TokenKind.MOVE,
    "ref": TokenKind.REF,
    "Box": TokenKind.BOX,
    
    # Primitive types
    "i8": TokenKind.I8,
    "i16": TokenKind.I16,
    "i32": TokenKind.I32,
    "i64": TokenKind.I64,
    "i128": TokenKind.I128,
    "u8": TokenKind.U8,
    "u16": TokenKind.U16,
    "u32": TokenKind.U32,
    "u64": TokenKind.U64,
    "u128": TokenKind.U128,
    "f32": TokenKind.F32,
    "f64": TokenKind.F64,
    "bool": TokenKind.BOOL,
    "char": TokenKind.CHAR,
    "str": TokenKind.STR,
    
    # Literals
    "true": TokenKind.BOOL_LITERAL,
    "false": TokenKind.BOOL_LITERAL,
}


@dataclass
class Token:
    """A token from the Veritas lexer."""
    
    kind: TokenKind
    span: Span
    value: Optional[Any] = None  # Literal value for literals, text for identifiers
    
    def __str__(self) -> str:
        if self.value is not None:
            return f"{self.kind.name}({self.value})"
        return self.kind.name
    
    def __repr__(self) -> str:
        return f"Token({self.kind.name}, {self.span}, {self.value!r})"
    
    @property
    def text(self) -> Optional[str]:
        """Get text value for identifiers and keywords."""
        if self.kind == TokenKind.IDENT or self.kind == TokenKind.LIFETIME:
            return self.value
        return None
    
    def is_keyword(self) -> bool:
        """Check if this token is a keyword."""
        return self.kind in KEYWORDS.values()
    
    def is_literal(self) -> bool:
        """Check if this token is a literal."""
        return self.kind in (
            TokenKind.INT_LITERAL,
            TokenKind.FLOAT_LITERAL,
            TokenKind.STRING_LITERAL,
            TokenKind.CHAR_LITERAL,
            TokenKind.BOOL_LITERAL,
        )
    
    def is_operator(self) -> bool:
        """Check if this token is an operator."""
        return self.kind in (
            TokenKind.PLUS, TokenKind.MINUS, TokenKind.STAR, TokenKind.SLASH,
            TokenKind.PERCENT, TokenKind.EQ, TokenKind.NE, TokenKind.LT,
            TokenKind.GT, TokenKind.LE, TokenKind.GE, TokenKind.AND,
            TokenKind.OR, TokenKind.NOT, TokenKind.AMPERSAND, TokenKind.PIPE,
            TokenKind.CARET, TokenKind.SHL, TokenKind.SHR,
        )
