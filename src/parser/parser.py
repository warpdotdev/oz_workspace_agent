"""Veritas Parser implementation.

A hand-written recursive descent parser with Pratt parsing for expressions.
"""

from dataclasses import dataclass
from typing import Optional, List, Callable, TypeVar

from ..span import Span, Position
from ..lexer import Lexer, Token, TokenKind
from ..ast.nodes import *
from ..ast.types import *

T = TypeVar('T')


@dataclass
class ParseError:
    """A parse error with location information."""
    message: str
    span: Span
    
    def __str__(self) -> str:
        return f"{self.span}: {self.message}"


# Operator precedence levels for Pratt parsing
class Precedence:
    NONE = 0
    ASSIGN = 1      # =
    OR = 2          # ||
    AND = 3         # &&
    BIT_OR = 4      # |
    BIT_XOR = 5     # ^
    BIT_AND = 6     # &
    EQUALITY = 7    # == !=
    COMPARISON = 8  # < > <= >=
    SHIFT = 9       # << >>
    TERM = 10       # + -
    FACTOR = 11     # * / %
    UNARY = 12      # - ! & *
    CALL = 13       # () . []
    PRIMARY = 14


# Binary operator precedence mapping
BINARY_PRECEDENCE = {
    TokenKind.OR: Precedence.OR,
    TokenKind.AND: Precedence.AND,
    TokenKind.PIPE: Precedence.BIT_OR,
    TokenKind.CARET: Precedence.BIT_XOR,
    TokenKind.AMPERSAND: Precedence.BIT_AND,
    TokenKind.EQ: Precedence.EQUALITY,
    TokenKind.NE: Precedence.EQUALITY,
    TokenKind.LT: Precedence.COMPARISON,
    TokenKind.GT: Precedence.COMPARISON,
    TokenKind.LE: Precedence.COMPARISON,
    TokenKind.GE: Precedence.COMPARISON,
    TokenKind.SHL: Precedence.SHIFT,
    TokenKind.SHR: Precedence.SHIFT,
    TokenKind.PLUS: Precedence.TERM,
    TokenKind.MINUS: Precedence.TERM,
    TokenKind.STAR: Precedence.FACTOR,
    TokenKind.SLASH: Precedence.FACTOR,
    TokenKind.PERCENT: Precedence.FACTOR,
}

# Token to binary operator kind mapping
BINARY_OP_MAP = {
    TokenKind.PLUS: BinaryOpKind.ADD,
    TokenKind.MINUS: BinaryOpKind.SUB,
    TokenKind.STAR: BinaryOpKind.MUL,
    TokenKind.SLASH: BinaryOpKind.DIV,
    TokenKind.PERCENT: BinaryOpKind.MOD,
    TokenKind.EQ: BinaryOpKind.EQ,
    TokenKind.NE: BinaryOpKind.NE,
    TokenKind.LT: BinaryOpKind.LT,
    TokenKind.GT: BinaryOpKind.GT,
    TokenKind.LE: BinaryOpKind.LE,
    TokenKind.GE: BinaryOpKind.GE,
    TokenKind.AND: BinaryOpKind.AND,
    TokenKind.OR: BinaryOpKind.OR,
    TokenKind.AMPERSAND: BinaryOpKind.BIT_AND,
    TokenKind.PIPE: BinaryOpKind.BIT_OR,
    TokenKind.CARET: BinaryOpKind.BIT_XOR,
    TokenKind.SHL: BinaryOpKind.SHL,
    TokenKind.SHR: BinaryOpKind.SHR,
}


class Parser:
    """Recursive descent parser for the Veritas language.
    
    Features:
    - Pratt parsing for expressions with operator precedence
    - Full source span tracking
    - Error recovery with synchronization
    - Supports all Veritas language constructs
    """
    
    def __init__(self, source: str, filename: Optional[str] = None):
        self.lexer = Lexer(source, filename)
        self.tokens: List[Token] = []
        self.pos = 0
        self.errors: List[ParseError] = []
        self.filename = filename
        
        # Pre-tokenize for lookahead
        self.tokens = self.lexer.tokenize()
    
    # ========================================================================
    # Token Management
    # ========================================================================
    
    def current(self) -> Token:
        """Get current token."""
        if self.pos >= len(self.tokens):
            return self.tokens[-1]  # EOF
        return self.tokens[self.pos]
    
    def previous(self) -> Token:
        """Get previous token."""
        if self.pos == 0:
            return self.tokens[0]
        return self.tokens[self.pos - 1]
    
    def peek(self, offset: int = 0) -> Token:
        """Peek at token at current position + offset."""
        idx = self.pos + offset
        if idx >= len(self.tokens):
            return self.tokens[-1]
        return self.tokens[idx]
    
    def is_at_end(self) -> bool:
        """Check if at end of input."""
        return self.current().kind == TokenKind.EOF
    
    def check(self, kind: TokenKind) -> bool:
        """Check if current token is of given kind."""
        return self.current().kind == kind
    
    def check_any(self, *kinds: TokenKind) -> bool:
        """Check if current token is any of the given kinds."""
        return self.current().kind in kinds
    
    def advance(self) -> Token:
        """Advance and return current token."""
        token = self.current()
        if not self.is_at_end():
            self.pos += 1
        return token
    
    def consume(self, kind: TokenKind, message: str) -> Token:
        """Consume token of expected kind or error."""
        if self.check(kind):
            return self.advance()
        self.error(message)
        return self.current()
    
    def match(self, *kinds: TokenKind) -> bool:
        """Check and advance if current token matches any kind."""
        for kind in kinds:
            if self.check(kind):
                self.advance()
                return True
        return False
    
    def error(self, message: str) -> None:
        """Record a parse error."""
        err = ParseError(message=message, span=self.current().span)
        self.errors.append(err)
    
    def synchronize(self) -> None:
        """Synchronize after error by skipping to next statement."""
        self.advance()
        
        while not self.is_at_end():
            if self.previous().kind == TokenKind.SEMICOLON:
                return
            
            if self.current().kind in (
                TokenKind.FN, TokenKind.STRUCT, TokenKind.ENUM,
                TokenKind.TYPE, TokenKind.CONST, TokenKind.MOD,
                TokenKind.IMPL, TokenKind.TRAIT, TokenKind.PUB,
                TokenKind.IMPORT, TokenKind.LET, TokenKind.FOR,
                TokenKind.WHILE, TokenKind.LOOP, TokenKind.IF,
                TokenKind.MATCH, TokenKind.RETURN,
            ):
                return
            
            self.advance()
    
    def make_span(self, start: Position) -> Span:
        """Create span from start to current position."""
        return Span(start=start, end=self.previous().span.end, source=self.filename)
    
    # ========================================================================
    # Program Parsing
    # ========================================================================
    
    def parse(self) -> Program:
        """Parse a complete program."""
        start = self.current().span.start
        items = []
        
        while not self.is_at_end():
            try:
                item = self.parse_module_item()
                if item:
                    items.append(item)
            except Exception as e:
                self.error(str(e))
                self.synchronize()
        
        return Program(span=self.make_span(start), items=items)
    
    def parse_module_item(self) -> Optional[ModuleItem]:
        """Parse a module-level item."""
        visibility = self.parse_visibility()
        
        if self.check(TokenKind.FN):
            return self.parse_function_def(visibility)
        elif self.check(TokenKind.STRUCT):
            return self.parse_struct_def(visibility)
        elif self.check(TokenKind.ENUM):
            return self.parse_enum_def(visibility)
        elif self.check(TokenKind.TYPE):
            return self.parse_type_alias(visibility)
        elif self.check(TokenKind.CONST):
            return self.parse_const_def(visibility)
        elif self.check(TokenKind.MOD):
            return self.parse_module_def(visibility)
        elif self.check(TokenKind.TRAIT):
            return self.parse_trait_def(visibility)
        elif self.check(TokenKind.IMPL):
            return self.parse_impl_block()
        elif self.check(TokenKind.IMPORT):
            return self.parse_import()
        else:
            self.error(f"Expected item, got {self.current().kind.name}")
            self.advance()
            return None
    
    def parse_visibility(self) -> Optional[Visibility]:
        """Parse visibility modifier."""
        if self.match(TokenKind.PUB):
            if self.match(TokenKind.LPAREN):
                if self.match(TokenKind.CRATE):
                    self.consume(TokenKind.RPAREN, "Expected ')' after 'crate'")
                    return Visibility.CRATE
                self.consume(TokenKind.RPAREN, "Expected 'crate' or ')'")
            return Visibility.PUBLIC
        return None
    
    # ========================================================================
    # Definition Parsing
    # ========================================================================
    
    def parse_function_def(self, visibility: Optional[Visibility] = None) -> FunctionDef:
        """Parse function definition."""
        start = self.current().span.start
        self.consume(TokenKind.FN, "Expected 'fn'")
        
        name = self.consume(TokenKind.IDENT, "Expected function name").value
        
        # Generic parameters
        generic_params = []
        if self.check(TokenKind.LT):
            generic_params = self.parse_generic_params()
        
        # Parameters
        self.consume(TokenKind.LPAREN, "Expected '(' after function name")
        params = self.parse_param_list()
        self.consume(TokenKind.RPAREN, "Expected ')' after parameters")
        
        # Return type
        return_type = None
        if self.match(TokenKind.ARROW):
            return_type = self.parse_type()
        
        # Effects
        effects = []
        if self.match(TokenKind.NOT):
            effects = self.parse_effect_list()
        
        # Contracts
        contracts = []
        while self.check_any(TokenKind.REQUIRES, TokenKind.ENSURES):
            contracts.append(self.parse_contract())
        
        # Body
        body = None
        if self.check(TokenKind.LBRACE):
            body = self.parse_block_expr()
        else:
            self.consume(TokenKind.SEMICOLON, "Expected ';' or function body")
        
        return FunctionDef(
            span=self.make_span(start),
            name=name,
            params=params,
            return_type=return_type,
            body=body,
            visibility=visibility,
            generic_params=generic_params,
            effects=effects,
            contracts=contracts,
        )
    
    def parse_param_list(self) -> List[Parameter]:
        """Parse function parameter list."""
        params = []
        
        if not self.check(TokenKind.RPAREN):
            params.append(self.parse_param())
            
            while self.match(TokenKind.COMMA):
                if self.check(TokenKind.RPAREN):
                    break  # Trailing comma
                params.append(self.parse_param())
        
        return params
    
    def parse_param(self) -> Parameter:
        """Parse a single parameter."""
        start = self.current().span.start
        
        mutable = self.match(TokenKind.MUT)
        
        # Handle self parameter
        if self.check(TokenKind.SELF):
            name = "self"
            self.advance()
            # self doesn't have explicit type
            return Parameter(
                name=name,
                type=PathType(span=self.make_span(start), segments=["Self"]),
                span=self.make_span(start),
                mutable=mutable,
            )
        
        # Handle &self and &mut self
        if self.check(TokenKind.AMPERSAND):
            self.advance()
            is_mut = self.match(TokenKind.MUT)
            if self.check(TokenKind.SELF):
                self.advance()
                inner = PathType(span=self.make_span(start), segments=["Self"])
                ref_type = ReferenceType(span=self.make_span(start), inner=inner, mutable=is_mut)
                return Parameter(
                    name="self",
                    type=ref_type,
                    span=self.make_span(start),
                    mutable=False,
                )
        
        name = self.consume(TokenKind.IDENT, "Expected parameter name").value
        self.consume(TokenKind.COLON, "Expected ':' after parameter name")
        param_type = self.parse_type()
        
        return Parameter(
            name=name,
            type=param_type,
            span=self.make_span(start),
            mutable=mutable,
        )
    
    def parse_generic_params(self) -> List[GenericParam]:
        """Parse generic type parameters."""
        params = []
        self.consume(TokenKind.LT, "Expected '<'")
        
        if not self.check(TokenKind.GT):
            params.append(self.parse_generic_param())
            
            while self.match(TokenKind.COMMA):
                if self.check(TokenKind.GT):
                    break
                params.append(self.parse_generic_param())
        
        self.consume(TokenKind.GT, "Expected '>'")
        return params
    
    def parse_generic_param(self) -> GenericParam:
        """Parse a single generic parameter."""
        start = self.current().span.start
        name = self.consume(TokenKind.IDENT, "Expected type parameter name").value
        
        bounds = []
        if self.match(TokenKind.COLON):
            bounds.append(self.consume(TokenKind.IDENT, "Expected bound").value)
            while self.match(TokenKind.PLUS):
                bounds.append(self.consume(TokenKind.IDENT, "Expected bound").value)
        
        return GenericParam(name=name, span=self.make_span(start), bounds=bounds)
    
    def parse_effect_list(self) -> List[Effect]:
        """Parse effect list (!IO + State<T> + Error<E>)."""
        effects = [self.parse_effect()]
        
        while self.match(TokenKind.PLUS):
            effects.append(self.parse_effect())
        
        return effects
    
    def parse_effect(self) -> Effect:
        """Parse a single effect."""
        start = self.current().span.start
        
        if self.match(TokenKind.IO):
            return Effect(kind=EffectKind.IO, span=self.make_span(start))
        elif self.match(TokenKind.ASYNC):
            return Effect(kind=EffectKind.ASYNC, span=self.make_span(start))
        elif self.match(TokenKind.STATE):
            self.consume(TokenKind.LT, "Expected '<' after 'State'")
            type_arg = self.parse_type()
            self.consume(TokenKind.GT, "Expected '>'")
            return Effect(kind=EffectKind.STATE, span=self.make_span(start), type_arg=type_arg)
        elif self.match(TokenKind.ERROR):
            self.consume(TokenKind.LT, "Expected '<' after 'Error'")
            type_arg = self.parse_type()
            self.consume(TokenKind.GT, "Expected '>'")
            return Effect(kind=EffectKind.ERROR, span=self.make_span(start), type_arg=type_arg)
        else:
            # Generic effect name
            name = self.consume(TokenKind.IDENT, "Expected effect name").value
            # Try to map to known effect
            if name == "IO":
                return Effect(kind=EffectKind.IO, span=self.make_span(start))
            self.error(f"Unknown effect: {name}")
            return Effect(kind=EffectKind.IO, span=self.make_span(start))
    
    def parse_contract(self) -> Contract:
        """Parse contract clause."""
        start = self.current().span.start
        
        if self.match(TokenKind.REQUIRES):
            kind = ContractKind.REQUIRES
        elif self.match(TokenKind.ENSURES):
            kind = ContractKind.ENSURES
        else:
            self.error("Expected 'requires' or 'ensures'")
            kind = ContractKind.REQUIRES
        
        condition = self.parse_expression()
        self.consume(TokenKind.SEMICOLON, "Expected ';' after contract")
        
        return Contract(kind=kind, condition=condition, span=self.make_span(start))
    
    def parse_struct_def(self, visibility: Optional[Visibility] = None) -> StructDef:
        """Parse struct definition."""
        start = self.current().span.start
        self.consume(TokenKind.STRUCT, "Expected 'struct'")
        
        name = self.consume(TokenKind.IDENT, "Expected struct name").value
        
        generic_params = []
        if self.check(TokenKind.LT):
            generic_params = self.parse_generic_params()
        
        self.consume(TokenKind.LBRACE, "Expected '{' after struct name")
        fields = self.parse_field_list()
        self.consume(TokenKind.RBRACE, "Expected '}' after struct fields")
        
        return StructDef(
            span=self.make_span(start),
            name=name,
            fields=fields,
            visibility=visibility,
            generic_params=generic_params,
        )
    
    def parse_field_list(self) -> List[Field]:
        """Parse struct field list."""
        fields = []
        
        while not self.check(TokenKind.RBRACE) and not self.is_at_end():
            vis = self.parse_visibility()
            start = self.current().span.start
            name = self.consume(TokenKind.IDENT, "Expected field name").value
            self.consume(TokenKind.COLON, "Expected ':' after field name")
            field_type = self.parse_type()
            
            fields.append(Field(
                name=name,
                type=field_type,
                span=self.make_span(start),
                visibility=vis,
            ))
            
            if not self.match(TokenKind.COMMA):
                break
        
        return fields
    
    def parse_enum_def(self, visibility: Optional[Visibility] = None) -> EnumDef:
        """Parse enum definition."""
        start = self.current().span.start
        self.consume(TokenKind.ENUM, "Expected 'enum'")
        
        name = self.consume(TokenKind.IDENT, "Expected enum name").value
        
        generic_params = []
        if self.check(TokenKind.LT):
            generic_params = self.parse_generic_params()
        
        self.consume(TokenKind.LBRACE, "Expected '{' after enum name")
        variants = self.parse_variant_list()
        self.consume(TokenKind.RBRACE, "Expected '}' after enum variants")
        
        return EnumDef(
            span=self.make_span(start),
            name=name,
            variants=variants,
            visibility=visibility,
            generic_params=generic_params,
        )
    
    def parse_variant_list(self) -> List[Variant]:
        """Parse enum variant list."""
        variants = []
        
        while not self.check(TokenKind.RBRACE) and not self.is_at_end():
            var_start = self.current().span.start
            name = self.consume(TokenKind.IDENT, "Expected variant name").value
            
            fields = None
            named_fields = None
            
            if self.match(TokenKind.LPAREN):
                # Tuple variant
                fields = []
                if not self.check(TokenKind.RPAREN):
                    fields.append(self.parse_type())
                    while self.match(TokenKind.COMMA):
                        if self.check(TokenKind.RPAREN):
                            break
                        fields.append(self.parse_type())
                self.consume(TokenKind.RPAREN, "Expected ')'")
            elif self.match(TokenKind.LBRACE):
                # Struct variant
                named_fields = self.parse_field_list()
                self.consume(TokenKind.RBRACE, "Expected '}'")
            
            variants.append(Variant(
                name=name,
                span=self.make_span(var_start),
                fields=fields,
                named_fields=named_fields,
            ))
            
            if not self.match(TokenKind.COMMA):
                break
        
        return variants
    
    def parse_type_alias(self, visibility: Optional[Visibility] = None) -> TypeAlias:
        """Parse type alias."""
        start = self.current().span.start
        self.consume(TokenKind.TYPE, "Expected 'type'")
        
        name = self.consume(TokenKind.IDENT, "Expected type name").value
        
        generic_params = []
        if self.check(TokenKind.LT):
            generic_params = self.parse_generic_params()
        
        self.consume(TokenKind.ASSIGN, "Expected '=' in type alias")
        aliased_type = self.parse_type()
        self.consume(TokenKind.SEMICOLON, "Expected ';' after type alias")
        
        return TypeAlias(
            span=self.make_span(start),
            name=name,
            aliased_type=aliased_type,
            visibility=visibility,
            generic_params=generic_params,
        )
    
    def parse_const_def(self, visibility: Optional[Visibility] = None) -> ConstDef:
        """Parse constant definition."""
        start = self.current().span.start
        self.consume(TokenKind.CONST, "Expected 'const'")
        
        name = self.consume(TokenKind.IDENT, "Expected constant name").value
        self.consume(TokenKind.COLON, "Expected ':' after constant name")
        const_type = self.parse_type()
        self.consume(TokenKind.ASSIGN, "Expected '=' in constant")
        value = self.parse_expression()
        self.consume(TokenKind.SEMICOLON, "Expected ';' after constant")
        
        return ConstDef(
            span=self.make_span(start),
            name=name,
            type=const_type,
            value=value,
            visibility=visibility,
        )
    
    def parse_module_def(self, visibility: Optional[Visibility] = None) -> ModuleDef:
        """Parse module definition."""
        start = self.current().span.start
        self.consume(TokenKind.MOD, "Expected 'mod'")
        
        name = self.consume(TokenKind.IDENT, "Expected module name").value
        
        self.consume(TokenKind.LBRACE, "Expected '{' after module name")
        
        items = []
        while not self.check(TokenKind.RBRACE) and not self.is_at_end():
            item = self.parse_module_item()
            if item:
                items.append(item)
        
        self.consume(TokenKind.RBRACE, "Expected '}' after module")
        
        return ModuleDef(
            span=self.make_span(start),
            name=name,
            items=items,
            visibility=visibility,
        )
    
    def parse_trait_def(self, visibility: Optional[Visibility] = None) -> TraitDef:
        """Parse trait definition."""
        start = self.current().span.start
        self.consume(TokenKind.TRAIT, "Expected 'trait'")
        
        name = self.consume(TokenKind.IDENT, "Expected trait name").value
        
        generic_params = []
        if self.check(TokenKind.LT):
            generic_params = self.parse_generic_params()
        
        # Super traits
        super_traits = []
        if self.match(TokenKind.COLON):
            super_traits.append(self.consume(TokenKind.IDENT, "Expected super trait").value)
            while self.match(TokenKind.PLUS):
                super_traits.append(self.consume(TokenKind.IDENT, "Expected super trait").value)
        
        self.consume(TokenKind.LBRACE, "Expected '{' after trait")
        
        methods = []
        while not self.check(TokenKind.RBRACE) and not self.is_at_end():
            methods.append(self.parse_function_def())
        
        self.consume(TokenKind.RBRACE, "Expected '}' after trait")
        
        return TraitDef(
            span=self.make_span(start),
            name=name,
            methods=methods,
            visibility=visibility,
            generic_params=generic_params,
            super_traits=super_traits,
        )
    
    def parse_impl_block(self) -> ImplBlock:
        """Parse impl block."""
        start = self.current().span.start
        self.consume(TokenKind.IMPL, "Expected 'impl'")
        
        generic_params = []
        if self.check(TokenKind.LT):
            generic_params = self.parse_generic_params()
        
        # Could be "impl Type" or "impl Trait for Type"
        first_type = self.parse_type()
        
        trait_name = None
        target_type = first_type
        
        if self.match(TokenKind.FOR):
            # impl Trait for Type
            trait_name = str(first_type)  # TODO: proper path handling
            target_type = self.parse_type()
        
        self.consume(TokenKind.LBRACE, "Expected '{' after impl")
        
        methods = []
        while not self.check(TokenKind.RBRACE) and not self.is_at_end():
            vis = self.parse_visibility()
            methods.append(self.parse_function_def(vis))
        
        self.consume(TokenKind.RBRACE, "Expected '}' after impl")
        
        return ImplBlock(
            span=self.make_span(start),
            target_type=target_type,
            methods=methods,
            trait_name=trait_name,
            generic_params=generic_params,
        )
    
    def parse_import(self) -> Import:
        """Parse import statement."""
        start = self.current().span.start
        self.consume(TokenKind.IMPORT, "Expected 'import'")
        
        path = [self.consume(TokenKind.IDENT, "Expected path segment").value]
        while self.match(TokenKind.DOUBLE_COLON):
            if self.check(TokenKind.LBRACE):
                # import path::{item1, item2}
                self.advance()
                items = []
                if not self.check(TokenKind.RBRACE):
                    items.append(self.consume(TokenKind.IDENT, "Expected item").value)
                    while self.match(TokenKind.COMMA):
                        if self.check(TokenKind.RBRACE):
                            break
                        items.append(self.consume(TokenKind.IDENT, "Expected item").value)
                self.consume(TokenKind.RBRACE, "Expected '}'")
                self.consume(TokenKind.SEMICOLON, "Expected ';' after import")
                return Import(span=self.make_span(start), path=path, items=items)
            else:
                path.append(self.consume(TokenKind.IDENT, "Expected path segment").value)
        
        alias = None
        if self.match(TokenKind.AS):
            alias = self.consume(TokenKind.IDENT, "Expected alias").value
        
        self.consume(TokenKind.SEMICOLON, "Expected ';' after import")
        return Import(span=self.make_span(start), path=path, alias=alias)
    
    # ========================================================================
    # Type Parsing
    # ========================================================================
    
    def parse_type(self) -> Type:
        """Parse a type."""
        start = self.current().span.start
        
        # Reference type
        if self.match(TokenKind.AMPERSAND):
            lifetime = None
            if self.check(TokenKind.LIFETIME):
                lifetime = self.advance().value[1:]  # Remove leading '
            mutable = self.match(TokenKind.MUT)
            inner = self.parse_type()
            return ReferenceType(
                span=self.make_span(start),
                inner=inner,
                mutable=mutable,
                lifetime=lifetime,
            )
        
        # Function type
        if self.match(TokenKind.FN):
            self.consume(TokenKind.LPAREN, "Expected '(' in function type")
            params = []
            if not self.check(TokenKind.RPAREN):
                params.append(self.parse_type())
                while self.match(TokenKind.COMMA):
                    if self.check(TokenKind.RPAREN):
                        break
                    params.append(self.parse_type())
            self.consume(TokenKind.RPAREN, "Expected ')' in function type")
            
            return_type = None
            if self.match(TokenKind.ARROW):
                return_type = self.parse_type()
            
            effects = []
            if self.match(TokenKind.NOT):
                effects = self.parse_effect_list()
            
            return FunctionType(
                span=self.make_span(start),
                params=params,
                return_type=return_type,
                effects=effects,
            )
        
        # Tuple type
        if self.match(TokenKind.LPAREN):
            elements = []
            if not self.check(TokenKind.RPAREN):
                elements.append(self.parse_type())
                while self.match(TokenKind.COMMA):
                    if self.check(TokenKind.RPAREN):
                        break
                    elements.append(self.parse_type())
            self.consume(TokenKind.RPAREN, "Expected ')' in tuple type")
            return TupleType(span=self.make_span(start), elements=elements)
        
        # Array/slice type
        if self.match(TokenKind.LBRACKET):
            elem_type = self.parse_type()
            size = None
            if self.match(TokenKind.SEMICOLON):
                size = self.parse_expression()
            self.consume(TokenKind.RBRACKET, "Expected ']' in array type")
            return ArrayType(span=self.make_span(start), element=elem_type, size=size)
        
        # Primitive or path type
        return self.parse_path_type()
    
    def parse_path_type(self) -> Type:
        """Parse a path type (primitive or named type with generics)."""
        start = self.current().span.start
        
        # Check for primitive types
        primitive_tokens = {
            TokenKind.I8: PrimitiveKind.I8,
            TokenKind.I16: PrimitiveKind.I16,
            TokenKind.I32: PrimitiveKind.I32,
            TokenKind.I64: PrimitiveKind.I64,
            TokenKind.I128: PrimitiveKind.I128,
            TokenKind.U8: PrimitiveKind.U8,
            TokenKind.U16: PrimitiveKind.U16,
            TokenKind.U32: PrimitiveKind.U32,
            TokenKind.U64: PrimitiveKind.U64,
            TokenKind.U128: PrimitiveKind.U128,
            TokenKind.F32: PrimitiveKind.F32,
            TokenKind.F64: PrimitiveKind.F64,
            TokenKind.BOOL: PrimitiveKind.BOOL,
            TokenKind.CHAR: PrimitiveKind.CHAR,
            TokenKind.STR: PrimitiveKind.STR,
        }
        
        if self.current().kind in primitive_tokens:
            kind = primitive_tokens[self.current().kind]
            self.advance()
            base_type = PrimitiveType(span=self.make_span(start), kind=kind)
            
            # Check for branded type: u64 as UserId
            if self.match(TokenKind.AS):
                brand_name = self.consume(TokenKind.IDENT, "Expected brand name").value
                return BrandedType(span=self.make_span(start), base_type=base_type, brand_name=brand_name)
            
            return base_type
        
        # Path type
        segments = [self.consume(TokenKind.IDENT, "Expected type name").value]
        while self.match(TokenKind.DOUBLE_COLON):
            segments.append(self.consume(TokenKind.IDENT, "Expected type segment").value)
        
        # Generic arguments
        generic_args = []
        if self.match(TokenKind.LT):
            if not self.check(TokenKind.GT):
                generic_args.append(self.parse_type())
                while self.match(TokenKind.COMMA):
                    if self.check(TokenKind.GT):
                        break
                    generic_args.append(self.parse_type())
            self.consume(TokenKind.GT, "Expected '>' after generic arguments")
        
        path_type = PathType(span=self.make_span(start), segments=segments, generic_args=generic_args)
        
        # Check for branded type: SomeType as BrandedName
        if self.match(TokenKind.AS):
            brand_name = self.consume(TokenKind.IDENT, "Expected brand name").value
            return BrandedType(span=self.make_span(start), base_type=path_type, brand_name=brand_name)
        
        return path_type
    
    # ========================================================================
    # Statement Parsing
    # ========================================================================
    
    def parse_statement(self) -> Statement:
        """Parse a statement."""
        if self.check(TokenKind.LET):
            return self.parse_let_stmt()
        elif self.check(TokenKind.RETURN):
            return self.parse_return_stmt()
        elif self.check(TokenKind.BREAK):
            return self.parse_break_stmt()
        elif self.check(TokenKind.CONTINUE):
            return self.parse_continue_stmt()
        else:
            return self.parse_expr_or_assign_stmt()
    
    def parse_let_stmt(self) -> LetStmt:
        """Parse let statement."""
        start = self.current().span.start
        self.consume(TokenKind.LET, "Expected 'let'")
        
        mutable = self.match(TokenKind.MUT)
        
        # Pattern or simple name
        if self.check(TokenKind.IDENT):
            name = self.advance().value
        elif self.check(TokenKind.UNDERSCORE):
            self.advance()
            name = "_"
        else:
            # Could be tuple pattern
            name = "_"
            # For now, just consume as identifier
            self.error("Expected variable name")
        
        var_type = None
        if self.match(TokenKind.COLON):
            var_type = self.parse_type()
        
        value = None
        if self.match(TokenKind.ASSIGN):
            value = self.parse_expression()
        
        self.consume(TokenKind.SEMICOLON, "Expected ';' after let statement")
        
        return LetStmt(
            span=self.make_span(start),
            name=name,
            type=var_type,
            value=value,
            mutable=mutable,
        )
    
    def parse_return_stmt(self) -> ReturnStmt:
        """Parse return statement."""
        start = self.current().span.start
        self.consume(TokenKind.RETURN, "Expected 'return'")
        
        value = None
        if not self.check(TokenKind.SEMICOLON):
            value = self.parse_expression()
        
        self.consume(TokenKind.SEMICOLON, "Expected ';' after return")
        
        return ReturnStmt(span=self.make_span(start), value=value)
    
    def parse_break_stmt(self) -> BreakStmt:
        """Parse break statement."""
        start = self.current().span.start
        self.consume(TokenKind.BREAK, "Expected 'break'")
        
        value = None
        if not self.check(TokenKind.SEMICOLON):
            value = self.parse_expression()
        
        self.consume(TokenKind.SEMICOLON, "Expected ';' after break")
        
        return BreakStmt(span=self.make_span(start), value=value)
    
    def parse_continue_stmt(self) -> ContinueStmt:
        """Parse continue statement."""
        start = self.current().span.start
        self.consume(TokenKind.CONTINUE, "Expected 'continue'")
        self.consume(TokenKind.SEMICOLON, "Expected ';' after continue")
        
        return ContinueStmt(span=self.make_span(start))
    
    def parse_expr_or_assign_stmt(self) -> Statement:
        """Parse expression statement or assignment."""
        start = self.current().span.start
        expr = self.parse_expression()
        
        if self.match(TokenKind.ASSIGN):
            value = self.parse_expression()
            self.consume(TokenKind.SEMICOLON, "Expected ';' after assignment")
            return AssignStmt(span=self.make_span(start), target=expr, value=value)
        
        # Check for compound assignment
        compound_ops = {
            TokenKind.PLUS_ASSIGN: BinaryOpKind.ADD,
            TokenKind.MINUS_ASSIGN: BinaryOpKind.SUB,
            TokenKind.STAR_ASSIGN: BinaryOpKind.MUL,
            TokenKind.SLASH_ASSIGN: BinaryOpKind.DIV,
            TokenKind.PERCENT_ASSIGN: BinaryOpKind.MOD,
        }
        
        for token_kind, op_kind in compound_ops.items():
            if self.match(token_kind):
                value = self.parse_expression()
                # Desugar x += y to x = x + y
                compound_value = BinaryOp(
                    span=self.make_span(start),
                    op=op_kind,
                    left=expr,
                    right=value,
                )
                self.consume(TokenKind.SEMICOLON, "Expected ';' after compound assignment")
                return AssignStmt(span=self.make_span(start), target=expr, value=compound_value)
        
        self.consume(TokenKind.SEMICOLON, "Expected ';' after expression")
        return ExprStmt(span=self.make_span(start), expr=expr)
    
    # ========================================================================
    # Expression Parsing (Pratt Parser)
    # ========================================================================
    
    def parse_expression(self) -> Expression:
        """Parse an expression."""
        return self.parse_precedence(Precedence.ASSIGN)
    
    def parse_precedence(self, min_prec: int) -> Expression:
        """Parse expression with minimum precedence."""
        left = self.parse_unary()
        
        while True:
            # Check for binary operator
            if self.current().kind not in BINARY_PRECEDENCE:
                break
            
            prec = BINARY_PRECEDENCE[self.current().kind]
            if prec < min_prec:
                break
            
            op_token = self.advance()
            op_kind = BINARY_OP_MAP[op_token.kind]
            
            # Right associative for assignment, left associative otherwise
            right = self.parse_precedence(prec + 1)
            
            left = BinaryOp(
                span=left.span.merge(right.span),
                op=op_kind,
                left=left,
                right=right,
            )
        
        return left
    
    def parse_unary(self) -> Expression:
        """Parse unary expression."""
        start = self.current().span.start
        
        if self.match(TokenKind.MINUS):
            operand = self.parse_unary()
            return UnaryOp(
                span=self.make_span(start),
                op=UnaryOpKind.NEG,
                operand=operand,
            )
        
        if self.match(TokenKind.NOT):
            operand = self.parse_unary()
            return UnaryOp(
                span=self.make_span(start),
                op=UnaryOpKind.NOT,
                operand=operand,
            )
        
        if self.match(TokenKind.STAR):
            operand = self.parse_unary()
            return UnaryOp(
                span=self.make_span(start),
                op=UnaryOpKind.DEREF,
                operand=operand,
            )
        
        if self.match(TokenKind.AMPERSAND):
            mutable = self.match(TokenKind.MUT)
            operand = self.parse_unary()
            return UnaryOp(
                span=self.make_span(start),
                op=UnaryOpKind.REF_MUT if mutable else UnaryOpKind.REF,
                operand=operand,
            )
        
        return self.parse_postfix()
    
    def parse_postfix(self) -> Expression:
        """Parse postfix expression (calls, field access, indexing)."""
        expr = self.parse_primary()
        
        while True:
            if self.match(TokenKind.LPAREN):
                # Function call
                args = []
                if not self.check(TokenKind.RPAREN):
                    args.append(self.parse_expression())
                    while self.match(TokenKind.COMMA):
                        if self.check(TokenKind.RPAREN):
                            break
                        args.append(self.parse_expression())
                self.consume(TokenKind.RPAREN, "Expected ')' after arguments")
                expr = FunctionCall(
                    span=expr.span.merge(self.previous().span),
                    function=expr,
                    args=args,
                )
            elif self.match(TokenKind.DOT):
                # Field access or method call
                if self.check(TokenKind.AWAIT):
                    self.advance()
                    expr = AwaitExpr(
                        span=expr.span.merge(self.previous().span),
                        expr=expr,
                    )
                elif self.check(TokenKind.INT_LITERAL):
                    # Tuple field access
                    field = str(self.advance().value)
                    expr = FieldAccess(
                        span=expr.span.merge(self.previous().span),
                        object=expr,
                        field=field,
                    )
                else:
                    name = self.consume(TokenKind.IDENT, "Expected field or method name").value
                    
                    if self.match(TokenKind.LPAREN):
                        # Method call
                        args = []
                        if not self.check(TokenKind.RPAREN):
                            args.append(self.parse_expression())
                            while self.match(TokenKind.COMMA):
                                if self.check(TokenKind.RPAREN):
                                    break
                                args.append(self.parse_expression())
                        self.consume(TokenKind.RPAREN, "Expected ')' after arguments")
                        expr = MethodCall(
                            span=expr.span.merge(self.previous().span),
                            object=expr,
                            method=name,
                            args=args,
                        )
                    else:
                        # Field access
                        expr = FieldAccess(
                            span=expr.span.merge(self.previous().span),
                            object=expr,
                            field=name,
                        )
            elif self.match(TokenKind.LBRACKET):
                # Index access
                index = self.parse_expression()
                self.consume(TokenKind.RBRACKET, "Expected ']' after index")
                expr = IndexAccess(
                    span=expr.span.merge(self.previous().span),
                    object=expr,
                    index=index,
                )
            elif self.match(TokenKind.QUESTION):
                # Try expression
                expr = TryExpr(
                    span=expr.span.merge(self.previous().span),
                    expr=expr,
                )
            elif self.match(TokenKind.AS):
                # Cast expression
                target_type = self.parse_type()
                expr = CastExpr(
                    span=expr.span.merge(self.previous().span),
                    expr=expr,
                    target_type=target_type,
                )
            else:
                break
        
        return expr
    
    def parse_primary(self) -> Expression:
        """Parse primary expression."""
        start = self.current().span.start
        
        # Literals
        if self.check(TokenKind.INT_LITERAL):
            token = self.advance()
            return Literal(
                span=token.span,
                kind=LiteralKind.INT,
                value=token.value,
            )
        
        if self.check(TokenKind.FLOAT_LITERAL):
            token = self.advance()
            return Literal(
                span=token.span,
                kind=LiteralKind.FLOAT,
                value=token.value,
            )
        
        if self.check(TokenKind.STRING_LITERAL):
            token = self.advance()
            return Literal(
                span=token.span,
                kind=LiteralKind.STRING,
                value=token.value,
            )
        
        if self.check(TokenKind.CHAR_LITERAL):
            token = self.advance()
            return Literal(
                span=token.span,
                kind=LiteralKind.CHAR,
                value=token.value,
            )
        
        if self.check(TokenKind.BOOL_LITERAL):
            token = self.advance()
            return Literal(
                span=token.span,
                kind=LiteralKind.BOOL,
                value=token.value,
            )
        
        # Parenthesized expression or tuple
        if self.match(TokenKind.LPAREN):
            if self.check(TokenKind.RPAREN):
                # Unit tuple ()
                self.advance()
                return TupleExpr(span=self.make_span(start), elements=[])
            
            expr = self.parse_expression()
            
            if self.match(TokenKind.COMMA):
                # Tuple
                elements = [expr]
                if not self.check(TokenKind.RPAREN):
                    elements.append(self.parse_expression())
                    while self.match(TokenKind.COMMA):
                        if self.check(TokenKind.RPAREN):
                            break
                        elements.append(self.parse_expression())
                self.consume(TokenKind.RPAREN, "Expected ')' after tuple")
                return TupleExpr(span=self.make_span(start), elements=elements)
            
            self.consume(TokenKind.RPAREN, "Expected ')' after expression")
            return expr
        
        # Array literal
        if self.match(TokenKind.LBRACKET):
            if self.check(TokenKind.RBRACKET):
                self.advance()
                return ArrayExpr(span=self.make_span(start), elements=[])
            
            first = self.parse_expression()
            
            if self.match(TokenKind.SEMICOLON):
                # [value; count] syntax
                count = self.parse_expression()
                self.consume(TokenKind.RBRACKET, "Expected ']' after array")
                return ArrayExpr(span=self.make_span(start), elements=[first], repeat=count)
            
            elements = [first]
            while self.match(TokenKind.COMMA):
                if self.check(TokenKind.RBRACKET):
                    break
                elements.append(self.parse_expression())
            self.consume(TokenKind.RBRACKET, "Expected ']' after array")
            return ArrayExpr(span=self.make_span(start), elements=elements)
        
        # Block expression
        if self.check(TokenKind.LBRACE):
            return self.parse_block_expr()
        
        # If expression
        if self.check(TokenKind.IF):
            return self.parse_if_expr()
        
        # Match expression
        if self.check(TokenKind.MATCH):
            return self.parse_match_expr()
        
        # For loop
        if self.check(TokenKind.FOR):
            return self.parse_for_expr()
        
        # While loop
        if self.check(TokenKind.WHILE):
            return self.parse_while_expr()
        
        # Loop
        if self.check(TokenKind.LOOP):
            return self.parse_loop_expr()
        
        # Lambda
        if self.check(TokenKind.PIPE):
            return self.parse_lambda_expr()
        
        # Move lambda
        if self.match(TokenKind.MOVE):
            if self.check(TokenKind.PIPE):
                return self.parse_lambda_expr(is_move=True)
        
        # Identifier or path
        if self.check(TokenKind.IDENT) or self.check(TokenKind.SELF) or self.check(TokenKind.SELF_TYPE):
            return self.parse_path_or_struct_expr()
        
        # Range with no start
        if self.match(TokenKind.DOTDOT):
            end = None
            if not self.check_any(TokenKind.SEMICOLON, TokenKind.COMMA, TokenKind.RPAREN, TokenKind.RBRACE, TokenKind.RBRACKET):
                end = self.parse_expression()
            return RangeExpr(span=self.make_span(start), start=None, end=end, inclusive=False)
        
        if self.match(TokenKind.DOTDOTEQ):
            end = self.parse_expression()
            return RangeExpr(span=self.make_span(start), start=None, end=end, inclusive=True)
        
        self.error(f"Expected expression, got {self.current().kind.name}")
        return Identifier(span=self.current().span, name="<error>")
    
    def parse_block_expr(self) -> BlockExpr:
        """Parse block expression."""
        start = self.current().span.start
        self.consume(TokenKind.LBRACE, "Expected '{'")
        
        statements = []
        expr = None
        
        while not self.check(TokenKind.RBRACE) and not self.is_at_end():
            # Track position for error recovery
            pos_before = self.pos
            
            # Check if this is a final expression (no semicolon)
            if self.is_expression_start() and self.could_be_final_expr():
                expr = self.parse_expression()
                if self.check(TokenKind.SEMICOLON):
                    self.advance()
                    statements.append(ExprStmt(span=expr.span, expr=expr))
                    expr = None
                    continue
                # This is the final expression
                break
            else:
                stmt = self.parse_statement()
                statements.append(stmt)
            
            # Error recovery: if we didn't advance, skip the problematic token
            if self.pos == pos_before and not self.check(TokenKind.RBRACE) and not self.is_at_end():
                self.error(f"Unexpected token {self.current().kind.name}, skipping")
                self.advance()
        
        self.consume(TokenKind.RBRACE, "Expected '}' after block")
        
        return BlockExpr(span=self.make_span(start), statements=statements, expr=expr)
    
    def is_expression_start(self) -> bool:
        """Check if current token can start an expression."""
        return self.current().kind in (
            TokenKind.IDENT, TokenKind.INT_LITERAL, TokenKind.FLOAT_LITERAL,
            TokenKind.STRING_LITERAL, TokenKind.CHAR_LITERAL, TokenKind.BOOL_LITERAL,
            TokenKind.LPAREN, TokenKind.LBRACKET, TokenKind.LBRACE,
            TokenKind.IF, TokenKind.MATCH, TokenKind.FOR, TokenKind.WHILE,
            TokenKind.LOOP, TokenKind.PIPE, TokenKind.AMPERSAND, TokenKind.STAR,
            TokenKind.MINUS, TokenKind.NOT, TokenKind.MOVE, TokenKind.SELF,
            TokenKind.SELF_TYPE, TokenKind.DOTDOT, TokenKind.DOTDOTEQ,
        )
    
    def could_be_final_expr(self) -> bool:
        """Heuristic to check if this could be a final expression in a block."""
        # Look ahead to see if there's a semicolon before }
        # This is a simplification; real implementation would need more context
        return not self.check_any(
            TokenKind.LET, TokenKind.RETURN, TokenKind.BREAK, TokenKind.CONTINUE
        )
    
    def parse_if_expr(self) -> IfExpr:
        """Parse if expression."""
        start = self.current().span.start
        self.consume(TokenKind.IF, "Expected 'if'")
        
        condition = self.parse_expression()
        then_branch = self.parse_block_expr()
        
        else_branch = None
        if self.match(TokenKind.ELSE):
            if self.check(TokenKind.IF):
                else_branch = self.parse_if_expr()
            else:
                else_branch = self.parse_block_expr()
        
        return IfExpr(
            span=self.make_span(start),
            condition=condition,
            then_branch=then_branch,
            else_branch=else_branch,
        )
    
    def parse_match_expr(self) -> MatchExpr:
        """Parse match expression."""
        start = self.current().span.start
        self.consume(TokenKind.MATCH, "Expected 'match'")
        
        scrutinee = self.parse_expression()
        self.consume(TokenKind.LBRACE, "Expected '{' after match expression")
        
        arms = []
        while not self.check(TokenKind.RBRACE) and not self.is_at_end():
            arm_start = self.current().span.start
            pattern = self.parse_pattern()
            
            guard = None
            if self.match(TokenKind.IF):
                guard = self.parse_expression()
            
            self.consume(TokenKind.FAT_ARROW, "Expected '=>' in match arm")
            body = self.parse_expression()
            
            arms.append(MatchArm(
                pattern=pattern,
                guard=guard,
                body=body,
                span=self.make_span(arm_start),
            ))
            
            if not self.match(TokenKind.COMMA):
                break
        
        self.consume(TokenKind.RBRACE, "Expected '}' after match arms")
        
        return MatchExpr(span=self.make_span(start), scrutinee=scrutinee, arms=arms)
    
    def parse_for_expr(self) -> ForExpr:
        """Parse for loop expression."""
        start = self.current().span.start
        self.consume(TokenKind.FOR, "Expected 'for'")
        
        pattern = self.parse_pattern()
        self.consume(TokenKind.IN, "Expected 'in' in for loop")
        iterable = self.parse_expression()
        body = self.parse_block_expr()
        
        return ForExpr(
            span=self.make_span(start),
            pattern=pattern,
            iterable=iterable,
            body=body,
        )
    
    def parse_while_expr(self) -> WhileExpr:
        """Parse while loop expression."""
        start = self.current().span.start
        self.consume(TokenKind.WHILE, "Expected 'while'")
        
        condition = self.parse_expression()
        body = self.parse_block_expr()
        
        return WhileExpr(
            span=self.make_span(start),
            condition=condition,
            body=body,
        )
    
    def parse_loop_expr(self) -> LoopExpr:
        """Parse infinite loop expression."""
        start = self.current().span.start
        self.consume(TokenKind.LOOP, "Expected 'loop'")
        
        body = self.parse_block_expr()
        
        return LoopExpr(span=self.make_span(start), body=body)
    
    def parse_lambda_expr(self, is_move: bool = False) -> LambdaExpr:
        """Parse lambda expression."""
        start = self.current().span.start
        self.consume(TokenKind.PIPE, "Expected '|'")
        
        params = []
        if not self.check(TokenKind.PIPE):
            params.append(self.parse_lambda_param())
            while self.match(TokenKind.COMMA):
                if self.check(TokenKind.PIPE):
                    break
                params.append(self.parse_lambda_param())
        
        self.consume(TokenKind.PIPE, "Expected '|' after lambda parameters")
        
        return_type = None
        if self.match(TokenKind.ARROW):
            return_type = self.parse_type()
        
        body = self.parse_expression()
        
        return LambdaExpr(
            span=self.make_span(start),
            params=params,
            body=body,
            return_type=return_type,
            is_move=is_move,
        )
    
    def parse_lambda_param(self) -> Parameter:
        """Parse lambda parameter."""
        start = self.current().span.start
        name = self.consume(TokenKind.IDENT, "Expected parameter name").value
        
        param_type = None
        if self.match(TokenKind.COLON):
            param_type = self.parse_type()
        else:
            # Inferred type
            param_type = PathType(span=self.make_span(start), segments=["_"])
        
        return Parameter(name=name, type=param_type, span=self.make_span(start))
    
    def parse_path_or_struct_expr(self) -> Expression:
        """Parse identifier, path, or struct expression."""
        start = self.current().span.start
        
        # Build path
        if self.check(TokenKind.SELF):
            segments = ["self"]
            self.advance()
        elif self.check(TokenKind.SELF_TYPE):
            segments = ["Self"]
            self.advance()
        else:
            segments = [self.consume(TokenKind.IDENT, "Expected identifier").value]
        
        while self.match(TokenKind.DOUBLE_COLON):
            segments.append(self.consume(TokenKind.IDENT, "Expected path segment").value)
        
        # Check for struct instantiation
        if self.check(TokenKind.LBRACE) and len(segments) == 1:
            # Could be struct or block - disambiguate
            # If next token after { is ident followed by :, it's a struct
            if self.peek(1).kind == TokenKind.IDENT and self.peek(2).kind == TokenKind.COLON:
                return self.parse_struct_expr(segments[-1], segments[:-1] if len(segments) > 1 else None)
            if self.peek(1).kind == TokenKind.RBRACE:
                return self.parse_struct_expr(segments[-1], segments[:-1] if len(segments) > 1 else None)
            if self.peek(1).kind == TokenKind.DOTDOT:
                return self.parse_struct_expr(segments[-1], segments[:-1] if len(segments) > 1 else None)
        
        # Path with generics
        generic_args = None
        # Don't parse < as generic if it could be comparison
        if self.check(TokenKind.LT):
            # Lookahead to see if this is generics or comparison
            # If next is a type keyword or identifier followed by >, it's generics
            if self.is_generic_args():
                self.advance()  # consume <
                generic_args = []
                if not self.check(TokenKind.GT):
                    generic_args.append(self.parse_type())
                    while self.match(TokenKind.COMMA):
                        if self.check(TokenKind.GT):
                            break
                        generic_args.append(self.parse_type())
                self.consume(TokenKind.GT, "Expected '>' after generic arguments")
        
        if len(segments) == 1 and generic_args is None:
            return Identifier(span=self.make_span(start), name=segments[0])
        
        return PathExpr(span=self.make_span(start), segments=segments, generic_args=generic_args)
    
    def is_generic_args(self) -> bool:
        """Heuristic to determine if < starts generic arguments."""
        # Look for patterns like <Type>, <Type, Type>
        pos = self.pos + 1
        depth = 1
        while pos < len(self.tokens) and depth > 0:
            kind = self.tokens[pos].kind
            if kind == TokenKind.LT:
                depth += 1
            elif kind == TokenKind.GT:
                depth -= 1
            elif kind == TokenKind.SHR:  # >>
                depth -= 2
            elif kind in (TokenKind.SEMICOLON, TokenKind.LBRACE, TokenKind.RBRACE):
                return False
            pos += 1
        return depth == 0
    
    def parse_struct_expr(self, name: str, path: Optional[List[str]] = None) -> StructExpr:
        """Parse struct instantiation expression."""
        start = self.current().span.start
        self.consume(TokenKind.LBRACE, "Expected '{' in struct expression")
        
        fields = []
        base = None
        
        while not self.check(TokenKind.RBRACE) and not self.is_at_end():
            if self.match(TokenKind.DOTDOT):
                # Struct update syntax
                base = self.parse_expression()
                break
            
            field_name = self.consume(TokenKind.IDENT, "Expected field name").value
            
            if self.match(TokenKind.COLON):
                value = self.parse_expression()
            else:
                # Shorthand: just field name means field: field
                value = Identifier(span=self.previous().span, name=field_name)
            
            fields.append((field_name, value))
            
            if not self.match(TokenKind.COMMA):
                break
        
        self.consume(TokenKind.RBRACE, "Expected '}' after struct fields")
        
        return StructExpr(
            span=self.make_span(start),
            name=name,
            path=path,
            fields=fields,
            base=base,
        )
    
    # ========================================================================
    # Pattern Parsing
    # ========================================================================
    
    def parse_pattern(self) -> Pattern:
        """Parse a pattern."""
        left = self.parse_primary_pattern()
        
        # Or pattern
        if self.match(TokenKind.PIPE):
            patterns = [left]
            patterns.append(self.parse_primary_pattern())
            while self.match(TokenKind.PIPE):
                patterns.append(self.parse_primary_pattern())
            return OrPattern(span=left.span.merge(patterns[-1].span), patterns=patterns)
        
        return left
    
    def parse_primary_pattern(self) -> Pattern:
        """Parse primary pattern."""
        start = self.current().span.start
        
        # Wildcard
        if self.match(TokenKind.UNDERSCORE):
            return WildcardPattern(span=self.make_span(start))
        
        # Literals
        if self.check_any(TokenKind.INT_LITERAL, TokenKind.FLOAT_LITERAL, 
                          TokenKind.STRING_LITERAL, TokenKind.CHAR_LITERAL,
                          TokenKind.BOOL_LITERAL):
            lit_expr = self.parse_primary()
            if isinstance(lit_expr, Literal):
                # Check for range pattern
                if self.match(TokenKind.DOTDOT):
                    end_lit = None
                    if self.check_any(TokenKind.INT_LITERAL, TokenKind.FLOAT_LITERAL,
                                      TokenKind.STRING_LITERAL, TokenKind.CHAR_LITERAL):
                        end_expr = self.parse_primary()
                        if isinstance(end_expr, Literal):
                            end_lit = end_expr
                    return RangePattern(
                        span=self.make_span(start),
                        start=lit_expr,
                        end=end_lit,
                        inclusive=False,
                    )
                if self.match(TokenKind.DOTDOTEQ):
                    end_expr = self.parse_primary()
                    end_lit = end_expr if isinstance(end_expr, Literal) else None
                    return RangePattern(
                        span=self.make_span(start),
                        start=lit_expr,
                        end=end_lit,
                        inclusive=True,
                    )
                return LiteralPattern(span=self.make_span(start), value=lit_expr)
        
        # Tuple pattern
        if self.match(TokenKind.LPAREN):
            elements = []
            if not self.check(TokenKind.RPAREN):
                elements.append(self.parse_pattern())
                while self.match(TokenKind.COMMA):
                    if self.check(TokenKind.RPAREN):
                        break
                    elements.append(self.parse_pattern())
            self.consume(TokenKind.RPAREN, "Expected ')' in tuple pattern")
            return TuplePattern(span=self.make_span(start), elements=elements)
        
        # Identifier, struct pattern, or enum pattern
        if self.check(TokenKind.IDENT):
            # Check for ref or mut
            is_ref = self.match(TokenKind.REF)
            mutable = self.match(TokenKind.MUT)
            
            name = self.consume(TokenKind.IDENT, "Expected identifier").value
            
            # Build path
            path = None
            if self.match(TokenKind.DOUBLE_COLON):
                path = [name]
                while True:
                    path.append(self.consume(TokenKind.IDENT, "Expected path segment").value)
                    if not self.match(TokenKind.DOUBLE_COLON):
                        break
                name = path[-1]
                path = path[:-1] if path else None
            
            # Struct pattern
            if self.match(TokenKind.LBRACE):
                fields = []
                rest = False
                
                while not self.check(TokenKind.RBRACE) and not self.is_at_end():
                    if self.match(TokenKind.DOTDOT):
                        rest = True
                        break
                    
                    field_start = self.current().span.start
                    field_name = self.consume(TokenKind.IDENT, "Expected field name").value
                    
                    field_pattern = None
                    if self.match(TokenKind.COLON):
                        field_pattern = self.parse_pattern()
                    
                    fields.append(FieldPattern(
                        name=field_name,
                        pattern=field_pattern,
                        span=self.make_span(field_start),
                    ))
                    
                    if not self.match(TokenKind.COMMA):
                        break
                
                self.consume(TokenKind.RBRACE, "Expected '}' in struct pattern")
                return StructPattern(
                    span=self.make_span(start),
                    name=name,
                    path=path,
                    fields=fields,
                    rest=rest,
                )
            
            # Enum pattern
            if self.match(TokenKind.LPAREN):
                fields = []
                if not self.check(TokenKind.RPAREN):
                    fields.append(self.parse_pattern())
                    while self.match(TokenKind.COMMA):
                        if self.check(TokenKind.RPAREN):
                            break
                        fields.append(self.parse_pattern())
                self.consume(TokenKind.RPAREN, "Expected ')' in enum pattern")
                return EnumPattern(
                    span=self.make_span(start),
                    name=name,
                    path=path,
                    fields=fields,
                )
            
            # Simple identifier pattern
            return IdentifierPattern(
                span=self.make_span(start),
                name=name,
                mutable=mutable,
                is_ref=is_ref,
            )
        
        self.error(f"Expected pattern, got {self.current().kind.name}")
        return WildcardPattern(span=self.current().span)
