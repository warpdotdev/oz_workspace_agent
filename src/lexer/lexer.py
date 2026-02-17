"""Veritas Lexer implementation.

A hand-written lexer with source span tracking and error recovery.
"""

from dataclasses import dataclass, field
from typing import Optional, Iterator, List

from ..span import Position, Span
from .tokens import Token, TokenKind, KEYWORDS


@dataclass
class LexerError:
    """A lexer error with location information."""
    
    message: str
    span: Span
    
    def __str__(self) -> str:
        return f"{self.span}: {self.message}"


class Lexer:
    """Tokenizer for the Veritas programming language.
    
    Features:
    - Full source span tracking for all tokens
    - Error recovery (produces ERROR tokens and continues)
    - Unicode identifier support
    - All Veritas operators and punctuation
    """
    
    def __init__(self, source: str, filename: Optional[str] = None):
        self.source = source
        self.filename = filename
        self.pos = 0
        self.line = 1
        self.column = 1
        self.errors: List[LexerError] = []
    
    def position(self) -> Position:
        """Get current position in source."""
        return Position(line=self.line, column=self.column, offset=self.pos)
    
    def is_at_end(self) -> bool:
        """Check if we've reached end of source."""
        return self.pos >= len(self.source)
    
    def peek(self, offset: int = 0) -> str:
        """Peek at character at current position + offset."""
        idx = self.pos + offset
        if idx >= len(self.source):
            return '\0'
        return self.source[idx]
    
    def advance(self) -> str:
        """Advance one character and return it."""
        if self.is_at_end():
            return '\0'
        
        ch = self.source[self.pos]
        self.pos += 1
        
        if ch == '\n':
            self.line += 1
            self.column = 1
        else:
            self.column += 1
        
        return ch
    
    def skip_whitespace(self) -> None:
        """Skip whitespace and comments."""
        while not self.is_at_end():
            ch = self.peek()
            
            if ch in ' \t\r\n':
                self.advance()
            elif ch == '/' and self.peek(1) == '/':
                # Single-line comment
                while not self.is_at_end() and self.peek() != '\n':
                    self.advance()
            elif ch == '/' and self.peek(1) == '*':
                # Multi-line comment
                self.advance()  # /
                self.advance()  # *
                while not self.is_at_end():
                    if self.peek() == '*' and self.peek(1) == '/':
                        self.advance()
                        self.advance()
                        break
                    self.advance()
            else:
                break
    
    def make_span(self, start: Position) -> Span:
        """Create a span from start to current position."""
        return Span(start=start, end=self.position(), source=self.filename)
    
    def make_token(self, kind: TokenKind, start: Position, value: Optional[any] = None) -> Token:
        """Create a token from start to current position."""
        return Token(kind=kind, span=self.make_span(start), value=value)
    
    def error(self, message: str, span: Span) -> Token:
        """Record an error and return an error token."""
        err = LexerError(message=message, span=span)
        self.errors.append(err)
        return Token(kind=TokenKind.LEXER_ERROR, span=span, value=message)
    
    def scan_identifier(self, start: Position) -> Token:
        """Scan an identifier or keyword."""
        while not self.is_at_end() and (self.peek().isalnum() or self.peek() == '_'):
            self.advance()
        
        text = self.source[start.offset:self.pos]
        
        # Check for keywords
        if text in KEYWORDS:
            kind = KEYWORDS[text]
            if kind == TokenKind.BOOL_LITERAL:
                return self.make_token(kind, start, text == "true")
            return self.make_token(kind, start)
        
        # Check for underscore (wildcard pattern)
        if text == "_":
            return self.make_token(TokenKind.UNDERSCORE, start)
        
        return self.make_token(TokenKind.IDENT, start, text)
    
    def scan_number(self, start: Position) -> Token:
        """Scan a number literal (int or float)."""
        # Check for hex or binary
        if self.peek(-1) == '0':
            if self.peek() in 'xX':
                self.advance()
                while not self.is_at_end() and self.peek() in '0123456789abcdefABCDEF_':
                    self.advance()
                text = self.source[start.offset:self.pos].replace('_', '')
                try:
                    value = int(text, 16)
                    return self.make_token(TokenKind.INT_LITERAL, start, value)
                except ValueError:
                    return self.error(f"Invalid hex literal: {text}", self.make_span(start))
            
            if self.peek() in 'bB':
                self.advance()
                while not self.is_at_end() and self.peek() in '01_':
                    self.advance()
                text = self.source[start.offset:self.pos].replace('_', '')
                try:
                    value = int(text, 2)
                    return self.make_token(TokenKind.INT_LITERAL, start, value)
                except ValueError:
                    return self.error(f"Invalid binary literal: {text}", self.make_span(start))
        
        # Decimal number
        while not self.is_at_end() and (self.peek().isdigit() or self.peek() == '_'):
            self.advance()
        
        is_float = False
        
        # Check for decimal point
        if self.peek() == '.' and self.peek(1).isdigit():
            is_float = True
            self.advance()  # .
            while not self.is_at_end() and (self.peek().isdigit() or self.peek() == '_'):
                self.advance()
        
        # Check for exponent
        if self.peek() in 'eE':
            is_float = True
            self.advance()
            if self.peek() in '+-':
                self.advance()
            while not self.is_at_end() and (self.peek().isdigit() or self.peek() == '_'):
                self.advance()
        
        text = self.source[start.offset:self.pos].replace('_', '')
        
        try:
            if is_float:
                value = float(text)
                return self.make_token(TokenKind.FLOAT_LITERAL, start, value)
            else:
                value = int(text)
                return self.make_token(TokenKind.INT_LITERAL, start, value)
        except ValueError:
            return self.error(f"Invalid number literal: {text}", self.make_span(start))
    
    def scan_string(self, start: Position) -> Token:
        """Scan a string literal."""
        quote = self.source[start.offset]
        chars = []
        
        while not self.is_at_end() and self.peek() != quote:
            ch = self.peek()
            
            if ch == '\n':
                return self.error("Unterminated string literal", self.make_span(start))
            
            if ch == '\\':
                self.advance()
                escape = self.peek()
                if escape == 'n':
                    chars.append('\n')
                elif escape == 'r':
                    chars.append('\r')
                elif escape == 't':
                    chars.append('\t')
                elif escape == '\\':
                    chars.append('\\')
                elif escape == quote:
                    chars.append(quote)
                elif escape == '0':
                    chars.append('\0')
                elif escape == 'x':
                    self.advance()
                    hex_chars = self.peek() + (self.peek(1) if not self.is_at_end() else '')
                    self.advance()
                    try:
                        chars.append(chr(int(hex_chars, 16)))
                    except ValueError:
                        return self.error(f"Invalid hex escape: \\x{hex_chars}", self.make_span(start))
                else:
                    return self.error(f"Unknown escape sequence: \\{escape}", self.make_span(start))
                self.advance()
            else:
                chars.append(self.advance())
        
        if self.is_at_end():
            return self.error("Unterminated string literal", self.make_span(start))
        
        self.advance()  # closing quote
        
        value = ''.join(chars)
        return self.make_token(TokenKind.STRING_LITERAL, start, value)
    
    def scan_char(self, start: Position) -> Token:
        """Scan a character literal."""
        if self.is_at_end():
            return self.error("Unterminated character literal", self.make_span(start))
        
        ch = self.peek()
        
        if ch == '\\':
            self.advance()
            escape = self.peek()
            if escape == 'n':
                ch = '\n'
            elif escape == 'r':
                ch = '\r'
            elif escape == 't':
                ch = '\t'
            elif escape == '\\':
                ch = '\\'
            elif escape == '\'':
                ch = '\''
            elif escape == '0':
                ch = '\0'
            else:
                return self.error(f"Unknown escape sequence: \\{escape}", self.make_span(start))
            self.advance()
        else:
            ch = self.advance()
        
        if self.is_at_end() or self.peek() != '\'':
            return self.error("Unterminated character literal", self.make_span(start))
        
        self.advance()  # closing quote
        
        return self.make_token(TokenKind.CHAR_LITERAL, start, ch)
    
    def scan_lifetime(self, start: Position) -> Token:
        """Scan a lifetime annotation ('a, 'static, etc.)."""
        # Already consumed the opening '
        while not self.is_at_end() and (self.peek().isalnum() or self.peek() == '_'):
            self.advance()
        
        text = self.source[start.offset:self.pos]
        return self.make_token(TokenKind.LIFETIME, start, text)
    
    def next_token(self) -> Token:
        """Scan and return the next token."""
        self.skip_whitespace()
        
        if self.is_at_end():
            return self.make_token(TokenKind.EOF, self.position())
        
        start = self.position()
        ch = self.advance()
        
        # Identifiers and keywords
        if ch.isalpha() or ch == '_':
            return self.scan_identifier(start)
        
        # Numbers
        if ch.isdigit():
            return self.scan_number(start)
        
        # Strings
        if ch == '"':
            return self.scan_string(start)
        
        # Characters or lifetimes
        if ch == '\'':
            # Check if this is a lifetime or char literal
            if self.peek().isalpha() or self.peek() == '_':
                # Could be lifetime
                next_pos = self.pos
                while next_pos < len(self.source) and (self.source[next_pos].isalnum() or self.source[next_pos] == '_'):
                    next_pos += 1
                # If no closing quote, it's a lifetime
                if next_pos >= len(self.source) or self.source[next_pos] != '\'':
                    return self.scan_lifetime(start)
            return self.scan_char(start)
        
        # Operators and punctuation
        match ch:
            case '(':
                return self.make_token(TokenKind.LPAREN, start)
            case ')':
                return self.make_token(TokenKind.RPAREN, start)
            case '{':
                return self.make_token(TokenKind.LBRACE, start)
            case '}':
                return self.make_token(TokenKind.RBRACE, start)
            case '[':
                return self.make_token(TokenKind.LBRACKET, start)
            case ']':
                return self.make_token(TokenKind.RBRACKET, start)
            case ',':
                return self.make_token(TokenKind.COMMA, start)
            case ';':
                return self.make_token(TokenKind.SEMICOLON, start)
            case '@':
                return self.make_token(TokenKind.AT, start)
            case '#':
                return self.make_token(TokenKind.HASH, start)
            case '?':
                return self.make_token(TokenKind.QUESTION, start)
            
            case ':':
                if self.peek() == ':':
                    self.advance()
                    return self.make_token(TokenKind.DOUBLE_COLON, start)
                return self.make_token(TokenKind.COLON, start)
            
            case '.':
                if self.peek() == '.':
                    self.advance()
                    if self.peek() == '=':
                        self.advance()
                        return self.make_token(TokenKind.DOTDOTEQ, start)
                    return self.make_token(TokenKind.DOTDOT, start)
                return self.make_token(TokenKind.DOT, start)
            
            case '-':
                if self.peek() == '>':
                    self.advance()
                    return self.make_token(TokenKind.ARROW, start)
                if self.peek() == '=':
                    self.advance()
                    return self.make_token(TokenKind.MINUS_ASSIGN, start)
                return self.make_token(TokenKind.MINUS, start)
            
            case '=':
                if self.peek() == '=':
                    self.advance()
                    return self.make_token(TokenKind.EQ, start)
                if self.peek() == '>':
                    self.advance()
                    return self.make_token(TokenKind.FAT_ARROW, start)
                return self.make_token(TokenKind.ASSIGN, start)
            
            case '+':
                if self.peek() == '=':
                    self.advance()
                    return self.make_token(TokenKind.PLUS_ASSIGN, start)
                return self.make_token(TokenKind.PLUS, start)
            
            case '*':
                if self.peek() == '=':
                    self.advance()
                    return self.make_token(TokenKind.STAR_ASSIGN, start)
                return self.make_token(TokenKind.STAR, start)
            
            case '/':
                if self.peek() == '=':
                    self.advance()
                    return self.make_token(TokenKind.SLASH_ASSIGN, start)
                return self.make_token(TokenKind.SLASH, start)
            
            case '%':
                if self.peek() == '=':
                    self.advance()
                    return self.make_token(TokenKind.PERCENT_ASSIGN, start)
                return self.make_token(TokenKind.PERCENT, start)
            
            case '!':
                if self.peek() == '=':
                    self.advance()
                    return self.make_token(TokenKind.NE, start)
                return self.make_token(TokenKind.NOT, start)
            
            case '<':
                if self.peek() == '=':
                    self.advance()
                    return self.make_token(TokenKind.LE, start)
                if self.peek() == '<':
                    self.advance()
                    if self.peek() == '=':
                        self.advance()
                        return self.make_token(TokenKind.SHL_ASSIGN, start)
                    return self.make_token(TokenKind.SHL, start)
                return self.make_token(TokenKind.LT, start)
            
            case '>':
                if self.peek() == '=':
                    self.advance()
                    return self.make_token(TokenKind.GE, start)
                if self.peek() == '>':
                    self.advance()
                    if self.peek() == '=':
                        self.advance()
                        return self.make_token(TokenKind.SHR_ASSIGN, start)
                    return self.make_token(TokenKind.SHR, start)
                return self.make_token(TokenKind.GT, start)
            
            case '&':
                if self.peek() == '&':
                    self.advance()
                    return self.make_token(TokenKind.AND, start)
                if self.peek() == '=':
                    self.advance()
                    return self.make_token(TokenKind.AND_ASSIGN, start)
                return self.make_token(TokenKind.AMPERSAND, start)
            
            case '|':
                if self.peek() == '|':
                    self.advance()
                    return self.make_token(TokenKind.OR, start)
                if self.peek() == '=':
                    self.advance()
                    return self.make_token(TokenKind.OR_ASSIGN, start)
                return self.make_token(TokenKind.PIPE, start)
            
            case '^':
                if self.peek() == '=':
                    self.advance()
                    return self.make_token(TokenKind.CARET_ASSIGN, start)
                return self.make_token(TokenKind.CARET, start)
        
        # Unknown character
        return self.error(f"Unexpected character: {ch!r}", self.make_span(start))
    
    def tokenize(self) -> List[Token]:
        """Tokenize the entire source and return list of tokens."""
        tokens = []
        while True:
            token = self.next_token()
            tokens.append(token)
            if token.kind == TokenKind.EOF:
                break
        return tokens
    
    def __iter__(self) -> Iterator[Token]:
        """Iterate over tokens."""
        while True:
            token = self.next_token()
            yield token
            if token.kind == TokenKind.EOF:
                break
