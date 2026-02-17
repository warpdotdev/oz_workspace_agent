"""Ownership and Borrow Checker for Veritas.

Implements Rust-style ownership tracking with:
- Single owner per value
- Move semantics
- Borrow checking (mutable and immutable)
- Non-Lexical Lifetimes (NLL)
- Flow-sensitive analysis
"""

from .checker import OwnershipChecker, OwnershipError
from .lifetime import LifetimeAnalyzer

__all__ = [
    "OwnershipChecker",
    "OwnershipError",
    "LifetimeAnalyzer",
]
