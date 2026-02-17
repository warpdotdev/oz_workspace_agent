"""Code generation for Veritas.

This package handles code generation from Veritas AST to various backends:
- IR generation from AST
- Rust backend (transpilation to Rust)
- Runtime support for ownership and effects
"""

from .generator import CodeGenerator
from .rust_backend import RustBackend

__all__ = [
    "CodeGenerator",
    "RustBackend",
]
