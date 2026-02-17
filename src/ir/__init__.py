"""Intermediate Representation (IR) for Veritas.

The IR serves as a bridge between the AST and code generation, providing:
- Simplified representation suitable for optimization
- Explicit ownership and borrowing information
- Effect tracking
- SSA-like value semantics
"""

from .ir import *

__all__ = [
    "IRModule",
    "IRFunction",
    "IRBasicBlock",
    "IRInstruction",
    "IRValue",
    "IRType",
]
