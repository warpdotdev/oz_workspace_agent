"""Error code taxonomy for Veritas compiler.

Defines hierarchical error codes with format: SEVERITY-CATEGORY-NUMBER
"""

from enum import Enum, auto
from typing import Tuple


class ErrorSeverity(Enum):
    """Error severity levels."""
    ERROR = "error"      # Compilation will fail
    WARNING = "warning"  # Compilation succeeds but potential issue
    HINT = "hint"        # Suggestion for improvement


class ErrorCategory(Enum):
    """Error categories."""
    TYPE = "type"
    SYNTAX = "syntax"
    OWNERSHIP = "ownership"
    EFFECT = "effect"
    CONTRACT = "contract"
    IMPORT = "import"
    NAME = "name"
    PATTERN = "pattern"


class ErrorCode:
    """Error code with severity, category, and number."""
    
    def __init__(self, severity: ErrorSeverity, category: ErrorCategory, number: int):
        self.severity = severity
        self.category = category
        self.number = number
    
    def __str__(self) -> str:
        """Format as SEVERITY-CATEGORY-NUMBER."""
        prefix = {
            ErrorSeverity.ERROR: "E",
            ErrorSeverity.WARNING: "W",
            ErrorSeverity.HINT: "H",
        }[self.severity]
        
        category_name = self.category.value.upper()
        return f"{prefix}-{category_name}-{self.number:04d}"
    
    @staticmethod
    def parse(code_str: str) -> 'ErrorCode':
        """Parse an error code string like 'E-TYPE-0001'."""
        parts = code_str.split('-')
        if len(parts) != 3:
            raise ValueError(f"Invalid error code format: {code_str}")
        
        severity_map = {"E": ErrorSeverity.ERROR, "W": ErrorSeverity.WARNING, "H": ErrorSeverity.HINT}
        severity = severity_map.get(parts[0])
        if not severity:
            raise ValueError(f"Invalid severity: {parts[0]}")
        
        try:
            category = ErrorCategory[parts[1]]
        except KeyError:
            raise ValueError(f"Invalid category: {parts[1]}")
        
        try:
            number = int(parts[2])
        except ValueError:
            raise ValueError(f"Invalid error number: {parts[2]}")
        
        return ErrorCode(severity, category, number)


# Type system errors
E_TYPE_0001 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.TYPE, 1)    # Type mismatch
E_TYPE_0002 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.TYPE, 2)    # Type annotation missing
E_TYPE_0003 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.TYPE, 3)    # Type annotation conflicts with inferred type
E_TYPE_0004 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.TYPE, 4)    # Unknown type name
E_TYPE_0005 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.TYPE, 5)    # Type parameter count mismatch
E_TYPE_0006 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.TYPE, 6)    # Trait bound not satisfied
E_TYPE_0007 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.TYPE, 7)    # Recursive type without indirection
E_TYPE_0008 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.TYPE, 8)    # Ambiguous type inference
E_TYPE_0009 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.TYPE, 9)    # Incompatible types in operation
E_TYPE_0010 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.TYPE, 10)   # Return type mismatch

# Syntax errors
E_SYNTAX_0001 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.SYNTAX, 1)    # Unexpected token
E_SYNTAX_0002 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.SYNTAX, 2)    # Missing semicolon
E_SYNTAX_0003 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.SYNTAX, 3)    # Unclosed delimiter
E_SYNTAX_0004 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.SYNTAX, 4)    # Invalid identifier
E_SYNTAX_0005 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.SYNTAX, 5)    # Malformed expression
E_SYNTAX_0006 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.SYNTAX, 6)    # Invalid declaration
E_SYNTAX_0007 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.SYNTAX, 7)    # Unexpected end of file
E_SYNTAX_0008 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.SYNTAX, 8)    # Invalid operator usage
E_SYNTAX_0009 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.SYNTAX, 9)    # Misplaced keyword
E_SYNTAX_0010 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.SYNTAX, 10)   # Invalid literal

# Ownership & memory safety errors
E_OWN_0001 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.OWNERSHIP, 1)    # Use after move
E_OWN_0002 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.OWNERSHIP, 2)    # Multiple mutable borrows
E_OWN_0003 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.OWNERSHIP, 3)    # Immutable borrow with mutable borrow
E_OWN_0004 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.OWNERSHIP, 4)    # Moved value used
E_OWN_0005 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.OWNERSHIP, 5)    # Borrow outlives owner
E_OWN_0006 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.OWNERSHIP, 6)    # Cannot move out of borrowed content
E_OWN_0007 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.OWNERSHIP, 7)    # Partial move of value
E_OWN_0008 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.OWNERSHIP, 8)    # Invalid lifetime annotation
E_OWN_0009 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.OWNERSHIP, 9)    # Lifetime parameter mismatch
E_OWN_0010 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.OWNERSHIP, 10)   # Dangling reference detected

# Effect system violations
E_EFFECT_0001 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.EFFECT, 1)    # Side effect in pure function
E_EFFECT_0002 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.EFFECT, 2)    # Missing effect annotation
E_EFFECT_0003 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.EFFECT, 3)    # Effect annotation too broad
E_EFFECT_0004 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.EFFECT, 4)    # IO operation without IO effect
E_EFFECT_0005 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.EFFECT, 5)    # Async operation without Async effect
E_EFFECT_0006 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.EFFECT, 6)    # Unsafe operation without Unsafe effect
E_EFFECT_0007 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.EFFECT, 7)    # Effect propagation violation
E_EFFECT_0008 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.EFFECT, 8)    # Cannot call effectful function from pure context
E_EFFECT_0009 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.EFFECT, 9)    # Effect handler mismatch
E_EFFECT_0010 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.EFFECT, 10)   # Unhandled effect

# Contract & assertion violations
E_CONTRACT_0001 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.CONTRACT, 1)    # Precondition violation
E_CONTRACT_0002 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.CONTRACT, 2)    # Postcondition violation
E_CONTRACT_0003 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.CONTRACT, 3)    # Invariant violation
E_CONTRACT_0004 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.CONTRACT, 4)    # Invalid contract expression
E_CONTRACT_0005 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.CONTRACT, 5)    # Contract cannot be verified
E_CONTRACT_0006 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.CONTRACT, 6)    # Assertion failed at compile time
E_CONTRACT_0007 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.CONTRACT, 7)    # Loop invariant not maintained
E_CONTRACT_0008 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.CONTRACT, 8)    # Variant not decreasing
E_CONTRACT_0009 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.CONTRACT, 9)    # Specification too weak
E_CONTRACT_0010 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.CONTRACT, 10)   # Specification inconsistent

# Module & import errors
E_IMPORT_0001 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.IMPORT, 1)    # Module not found
E_IMPORT_0002 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.IMPORT, 2)    # Circular import detected
E_IMPORT_0003 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.IMPORT, 3)    # Import name conflict
E_IMPORT_0004 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.IMPORT, 4)    # Private item accessed
E_IMPORT_0005 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.IMPORT, 5)    # Ambiguous import
E_IMPORT_0006 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.IMPORT, 6)    # Import path invalid
E_IMPORT_0007 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.IMPORT, 7)    # Re-export of private item
E_IMPORT_0008 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.IMPORT, 8)    # Module visibility violation
E_IMPORT_0009 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.IMPORT, 9)    # Deprecated module used
E_IMPORT_0010 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.IMPORT, 10)   # Version conflict

# Name resolution errors
E_NAME_0001 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.NAME, 1)    # Undefined variable
E_NAME_0002 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.NAME, 2)    # Undefined function
E_NAME_0003 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.NAME, 3)    # Undefined type
E_NAME_0004 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.NAME, 4)    # Undefined module
E_NAME_0005 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.NAME, 5)    # Name already defined
E_NAME_0006 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.NAME, 6)    # Cannot shadow immutable binding
E_NAME_0007 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.NAME, 7)    # Ambiguous name
E_NAME_0008 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.NAME, 8)    # Name not in scope
E_NAME_0009 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.NAME, 9)    # Invalid self reference
E_NAME_0010 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.NAME, 10)   # Unused variable
W_NAME_0010 = ErrorCode(ErrorSeverity.WARNING, ErrorCategory.NAME, 10) # Unused variable warning

# Pattern matching errors
E_PATTERN_0001 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.PATTERN, 1)    # Non-exhaustive pattern
E_PATTERN_0002 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.PATTERN, 2)    # Unreachable pattern
E_PATTERN_0003 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.PATTERN, 3)    # Invalid pattern syntax
E_PATTERN_0004 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.PATTERN, 4)    # Pattern type mismatch
E_PATTERN_0005 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.PATTERN, 5)    # Binding inconsistency across patterns
E_PATTERN_0006 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.PATTERN, 6)    # Invalid guard expression
E_PATTERN_0007 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.PATTERN, 7)    # Duplicate binding in pattern
E_PATTERN_0008 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.PATTERN, 8)    # Cannot destructure non-product type
E_PATTERN_0009 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.PATTERN, 9)    # Or-pattern with different bindings
E_PATTERN_0010 = ErrorCode(ErrorSeverity.ERROR, ErrorCategory.PATTERN, 10)   # Pattern too complex to verify
