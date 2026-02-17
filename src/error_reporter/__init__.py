"""Error reporting module for Veritas compiler.

Provides structured JSON error format optimized for AI agents.
"""

from .reporter import ErrorReporter
from .error_codes import ErrorCode, ErrorCategory, ErrorSeverity
from .formatter import JSONErrorFormatter

__all__ = [
    'ErrorReporter',
    'ErrorCode',
    'ErrorCategory',
    'ErrorSeverity',
    'JSONErrorFormatter',
]
