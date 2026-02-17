"""Main error reporter for Veritas compiler.

Collects errors from parser, type checker, and ownership checker,
then formats them as structured JSON for AI agents.
"""

from dataclasses import dataclass
from typing import List, Optional, Dict, Any
import time
import uuid

from ..span import Span
from ..parser.parser import ParseError
from ..type_checker.checker import TypeCheckError
from ..ownership.checker import OwnershipError

from .error_codes import *
from .suggestion import SuggestionEngine, Suggestion


@dataclass
class ErrorLocation:
    """Location information for an error."""
    file: str
    start_line: int
    start_column: int
    end_line: int
    end_column: int
    span_text: str


@dataclass
class ErrorContext:
    """Context information around an error."""
    before_lines: List[str]
    error_line: str
    after_lines: List[str]
    function_name: Optional[str] = None
    module_name: Optional[str] = None


@dataclass
class TypeInformation:
    """Type information for type errors."""
    expected_type: Optional[str] = None
    actual_type: Optional[str] = None
    type_origin: Optional[str] = None


@dataclass
class RelatedError:
    """Information about a related error."""
    error_id: str
    relationship: str  # "caused_by", "causes", "similar_to"
    description: str


@dataclass
class Documentation:
    """Documentation links for an error."""
    error_code_url: str
    related_concepts: List[str]
    examples_url: str


@dataclass
class StructuredError:
    """A fully structured error with all information."""
    error_id: str
    error_code: ErrorCode
    severity: str
    message: str
    explanation: str
    category: str
    location: ErrorLocation
    context: ErrorContext
    type_information: TypeInformation
    suggestions: List[Suggestion]
    related_errors: List[RelatedError]
    documentation: Documentation


class ErrorReporter:
    """Main error reporter that aggregates errors from all compiler phases."""
    
    def __init__(self, source: str, filename: str = "<unknown>"):
        self.source = source
        self.filename = filename
        self.source_lines = source.split('\n')
        self.suggestion_engine = SuggestionEngine()
        self.errors: List[StructuredError] = []
        self.error_counter = 0
    
    def generate_error_id(self) -> str:
        """Generate a unique error ID."""
        timestamp = int(time.time())
        self.error_counter += 1
        return f"err_{timestamp}_{self.error_counter}"
    
    def collect_parse_errors(self, parse_errors: List[ParseError]) -> None:
        """Collect and structure parser errors."""
        for err in parse_errors:
            self._add_syntax_error(err)
    
    def collect_type_errors(self, type_errors: List[TypeCheckError]) -> None:
        """Collect and structure type checker errors."""
        for err in type_errors:
            self._add_type_error(err)
    
    def collect_ownership_errors(self, ownership_errors: List[OwnershipError]) -> None:
        """Collect and structure ownership checker errors."""
        for err in ownership_errors:
            self._add_ownership_error(err)
    
    def _add_syntax_error(self, err: ParseError) -> None:
        """Convert a parse error to a structured error."""
        # Determine specific error code based on message
        error_code = self._classify_syntax_error(err.message)
        
        location = self._create_location(err.span)
        context = self._extract_context(err.span)
        
        # Generate suggestions based on error type
        suggestions = []
        if "semicolon" in err.message.lower():
            suggestions = self.suggestion_engine.suggest_for_missing_semicolon(
                err.span,
                context.error_line
            )
        
        structured_err = StructuredError(
            error_id=self.generate_error_id(),
            error_code=error_code,
            severity=error_code.severity.value,
            message=err.message,
            explanation=self._generate_explanation(error_code, err.message),
            category=error_code.category.value,
            location=location,
            context=context,
            type_information=TypeInformation(),
            suggestions=suggestions,
            related_errors=[],
            documentation=self._generate_documentation(error_code)
        )
        
        self.errors.append(structured_err)
    
    def _add_type_error(self, err: TypeCheckError) -> None:
        """Convert a type checker error to a structured error."""
        # Determine specific error code based on message
        error_code = self._classify_type_error(err.message)
        
        location = self._create_location(err.span)
        context = self._extract_context(err.span)
        
        # Extract type information if present
        type_info = self._extract_type_info(err.message)
        
        # Generate suggestions
        suggestions = []
        if type_info.expected_type and type_info.actual_type:
            suggestions = self.suggestion_engine.suggest_for_type_mismatch(
                type_info.expected_type,
                type_info.actual_type,
                err.span,
                context.error_line
            )
        
        structured_err = StructuredError(
            error_id=self.generate_error_id(),
            error_code=error_code,
            severity=error_code.severity.value,
            message=err.message,
            explanation=self._generate_explanation(error_code, err.message),
            category=error_code.category.value,
            location=location,
            context=context,
            type_information=type_info,
            suggestions=suggestions,
            related_errors=[],
            documentation=self._generate_documentation(error_code)
        )
        
        self.errors.append(structured_err)
    
    def _add_ownership_error(self, err: OwnershipError) -> None:
        """Convert an ownership error to a structured error."""
        # Determine specific error code based on message
        error_code = self._classify_ownership_error(err.message)
        
        location = self._create_location(err.span)
        context = self._extract_context(err.span)
        
        # Generate suggestions
        suggestions = []
        if "use of moved value" in err.message.lower() or "use after move" in err.message.lower():
            # Extract variable name from error message
            variable_name = self._extract_variable_name(err.message)
            suggestions = self.suggestion_engine.suggest_for_use_after_move(
                variable_name,
                None,  # We don't have move location easily accessible
                err.span,
                context.error_line
            )
        elif "borrow" in err.message.lower():
            variable_name = self._extract_variable_name(err.message)
            suggestions = self.suggestion_engine.suggest_for_borrow_conflict(
                variable_name,
                "mutable" if "mutable" in err.message else "immutable",
                "mutable" if "as mutable" in err.message else "immutable",
                context.error_line
            )
        
        structured_err = StructuredError(
            error_id=self.generate_error_id(),
            error_code=error_code,
            severity=error_code.severity.value,
            message=err.message,
            explanation=self._generate_explanation(error_code, err.message),
            category=error_code.category.value,
            location=location,
            context=context,
            type_information=TypeInformation(),
            suggestions=suggestions,
            related_errors=[],
            documentation=self._generate_documentation(error_code)
        )
        
        self.errors.append(structured_err)
    
    def _create_location(self, span: Span) -> ErrorLocation:
        """Create error location from span."""
        # Extract text at span location
        if span.start.line == span.end.line:
            span_text = self.source_lines[span.start.line - 1][span.start.column - 1:span.end.column - 1]
        else:
            span_text = "<multiline>"
        
        return ErrorLocation(
            file=span.source or self.filename,
            start_line=span.start.line,
            start_column=span.start.column,
            end_line=span.end.line,
            end_column=span.end.column,
            span_text=span_text
        )
    
    def _extract_context(self, span: Span) -> ErrorContext:
        """Extract surrounding context lines."""
        error_line_idx = span.start.line - 1
        
        # Get 2-3 lines before and after
        before_start = max(0, error_line_idx - 2)
        after_end = min(len(self.source_lines), error_line_idx + 3)
        
        before_lines = self.source_lines[before_start:error_line_idx]
        error_line = self.source_lines[error_line_idx] if error_line_idx < len(self.source_lines) else ""
        after_lines = self.source_lines[error_line_idx + 1:after_end]
        
        return ErrorContext(
            before_lines=before_lines,
            error_line=error_line,
            after_lines=after_lines,
            function_name=None,  # TODO: Extract from AST
            module_name=None     # TODO: Extract from AST
        )
    
    def _extract_type_info(self, message: str) -> TypeInformation:
        """Extract type information from error message."""
        # Simple heuristic parsing for now
        expected = None
        actual = None
        
        if "expected" in message.lower() and "found" in message.lower():
            # Try to extract types
            parts = message.split("expected")
            if len(parts) > 1:
                right_part = parts[1]
                if "found" in right_part:
                    type_parts = right_part.split("found")
                    expected = type_parts[0].strip().strip(',').strip()
                    actual = type_parts[1].strip() if len(type_parts) > 1 else None
        
        return TypeInformation(
            expected_type=expected,
            actual_type=actual,
            type_origin=None
        )
    
    def _extract_variable_name(self, message: str) -> str:
        """Extract variable name from error message."""
        # Look for text in backticks
        import re
        match = re.search(r'`([^`]+)`', message)
        if match:
            return match.group(1)
        return "value"
    
    def _classify_syntax_error(self, message: str) -> ErrorCode:
        """Classify syntax error and return appropriate error code."""
        msg_lower = message.lower()
        
        if "unexpected token" in msg_lower:
            return E_SYNTAX_0001
        elif "semicolon" in msg_lower:
            return E_SYNTAX_0002
        elif "unclosed" in msg_lower or "delimiter" in msg_lower:
            return E_SYNTAX_0003
        elif "identifier" in msg_lower:
            return E_SYNTAX_0004
        elif "unexpected end" in msg_lower or "eof" in msg_lower:
            return E_SYNTAX_0007
        else:
            return E_SYNTAX_0005  # Malformed expression (default)
    
    def _classify_type_error(self, message: str) -> ErrorCode:
        """Classify type error and return appropriate error code."""
        msg_lower = message.lower()
        
        if "mismatch" in msg_lower or ("expected" in msg_lower and "found" in msg_lower):
            return E_TYPE_0001
        elif "unknown type" in msg_lower or "undefined type" in msg_lower:
            return E_TYPE_0004
        elif "ambiguous" in msg_lower:
            return E_TYPE_0008
        elif "return type" in msg_lower:
            return E_TYPE_0010
        else:
            return E_TYPE_0001  # Type mismatch (default)
    
    def _classify_ownership_error(self, message: str) -> ErrorCode:
        """Classify ownership error and return appropriate error code."""
        msg_lower = message.lower()
        
        if "use after move" in msg_lower or "use of moved value" in msg_lower:
            return E_OWN_0001
        elif "multiple mutable" in msg_lower:
            return E_OWN_0002
        elif "mutable" in msg_lower and "immutable" in msg_lower:
            return E_OWN_0003
        elif "moved value" in msg_lower:
            return E_OWN_0004
        else:
            return E_OWN_0001  # Use after move (default)
    
    def _generate_explanation(self, error_code: ErrorCode, message: str) -> str:
        """Generate detailed explanation for an error code."""
        # This could be expanded with more specific explanations
        explanations = {
            E_SYNTAX_0001: "The parser encountered a token that doesn't fit the expected syntax at this location.",
            E_SYNTAX_0002: "Statements in Veritas must end with a semicolon (;) unless they are the final expression in a block.",
            E_TYPE_0001: "The type system detected a mismatch between expected and actual types. Veritas requires exact type matches and does not perform implicit conversions.",
            E_OWN_0001: "The value was moved and no longer owns its data. After a move, the original binding cannot be used. Veritas enforces strict ownership to prevent use-after-free bugs.",
            E_OWN_0002: "Multiple mutable borrows of the same value are not allowed at the same time, as this could lead to data races.",
            E_OWN_0003: "A value cannot be borrowed as both mutable and immutable at the same time, as this violates memory safety guarantees.",
        }
        
        return explanations.get(error_code, message)
    
    def _generate_documentation(self, error_code: ErrorCode) -> Documentation:
        """Generate documentation links for an error code."""
        code_str = str(error_code)
        
        return Documentation(
            error_code_url=f"https://docs.veritas-lang.org/errors/{code_str}",
            related_concepts=self._get_related_concepts(error_code),
            examples_url=f"https://docs.veritas-lang.org/examples/{error_code.category.value}"
        )
    
    def _get_related_concepts(self, error_code: ErrorCode) -> List[str]:
        """Get related concepts for an error code."""
        concept_map = {
            ErrorCategory.TYPE: ["Type System", "Type Inference", "Type Annotations"],
            ErrorCategory.SYNTAX: ["Syntax", "Grammar", "Parsing"],
            ErrorCategory.OWNERSHIP: ["Ownership", "Move Semantics", "Borrowing", "Lifetimes"],
            ErrorCategory.EFFECT: ["Effect System", "Pure Functions", "Side Effects"],
            ErrorCategory.CONTRACT: ["Contracts", "Preconditions", "Postconditions"],
        }
        
        return concept_map.get(error_code.category, [])
    
    def get_errors(self) -> List[StructuredError]:
        """Get all collected errors."""
        return self.errors
    
    def has_errors(self) -> bool:
        """Check if any errors were collected."""
        return len(self.errors) > 0
    
    def error_count(self) -> int:
        """Get total error count."""
        return len([e for e in self.errors if e.severity == "error"])
    
    def warning_count(self) -> int:
        """Get total warning count."""
        return len([e for e in self.errors if e.severity == "warning"])
