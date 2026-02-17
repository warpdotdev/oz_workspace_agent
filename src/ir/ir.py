"""IR data structures for Veritas code generation.

This module defines the Intermediate Representation used for code generation.
The IR is lower-level than the AST and explicitly tracks ownership, effects, and control flow.
"""

from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Optional, List, Dict, Set, Any, Union
from abc import ABC, abstractmethod

from ..ast.types import Effect
from ..span import Span


# ============================================================================
# IR Types
# ============================================================================

class IRTypeKind(Enum):
    """IR type kinds."""
    VOID = auto()
    BOOL = auto()
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
    CHAR = auto()
    STRING = auto()
    POINTER = auto()
    STRUCT = auto()
    ENUM = auto()
    TUPLE = auto()
    ARRAY = auto()
    FUNCTION = auto()
    BRANDED = auto()


@dataclass
class IRType:
    """IR type representation."""
    kind: IRTypeKind
    name: Optional[str] = None  # For named types (structs, enums, branded)
    inner: Optional["IRType"] = None  # For pointers, arrays
    fields: List[tuple[str, "IRType"]] = field(default_factory=list)  # For structs, tuples
    size: Optional[int] = None  # For arrays
    mutable: bool = False  # For references
    
    def __str__(self) -> str:
        if self.kind == IRTypeKind.POINTER:
            mut = "mut " if self.mutable else ""
            return f"&{mut}{self.inner}"
        elif self.kind == IRTypeKind.BRANDED:
            return f"{self.name}({self.inner})"
        elif self.kind == IRTypeKind.STRUCT:
            return self.name or "struct"
        elif self.kind == IRTypeKind.TUPLE:
            fields = ", ".join(str(f[1]) for f in self.fields)
            return f"({fields})"
        elif self.kind == IRTypeKind.ARRAY:
            return f"[{self.inner}; {self.size}]"
        else:
            return self.kind.name.lower()


# ============================================================================
# IR Values
# ============================================================================

class IRValueKind(Enum):
    """IR value kinds."""
    LOCAL = auto()          # Local variable
    TEMP = auto()           # Temporary value
    CONSTANT = auto()       # Constant value
    GLOBAL = auto()         # Global variable
    FUNCTION = auto()       # Function reference
    PARAMETER = auto()      # Function parameter


@dataclass
class IRValue:
    """IR value (variable, temporary, constant, etc.)."""
    kind: IRValueKind
    name: str
    type: IRType
    constant_value: Optional[Any] = None  # For constants
    owned: bool = True  # Ownership status
    borrowed_from: Optional["IRValue"] = None  # If this is a borrow
    
    def __str__(self) -> str:
        if self.kind == IRValueKind.CONSTANT:
            if self.type.kind == IRTypeKind.STRING:
                return f'"{self.constant_value}"'
            return str(self.constant_value)
        return f"%{self.name}: {self.type}"


# ============================================================================
# IR Instructions
# ============================================================================

class IROpcode(Enum):
    """IR instruction opcodes."""
    # Data movement
    ALLOC = auto()          # Allocate local variable
    LOAD = auto()           # Load value
    STORE = auto()          # Store value
    MOVE = auto()           # Move ownership
    COPY = auto()           # Copy value
    BORROW = auto()         # Create reference
    BORROW_MUT = auto()     # Create mutable reference
    
    # Arithmetic
    ADD = auto()
    SUB = auto()
    MUL = auto()
    DIV = auto()
    MOD = auto()
    NEG = auto()
    
    # Bitwise
    AND = auto()
    OR = auto()
    XOR = auto()
    NOT = auto()
    SHL = auto()
    SHR = auto()
    
    # Comparison
    EQ = auto()
    NE = auto()
    LT = auto()
    GT = auto()
    LE = auto()
    GE = auto()
    
    # Control flow
    BR = auto()             # Unconditional branch
    BR_COND = auto()        # Conditional branch
    CALL = auto()           # Function call
    RETURN = auto()         # Return from function
    UNREACHABLE = auto()    # Unreachable code
    
    # Aggregate operations
    STRUCT_NEW = auto()     # Create struct
    STRUCT_GET = auto()     # Get struct field
    STRUCT_SET = auto()     # Set struct field
    TUPLE_NEW = auto()      # Create tuple
    TUPLE_GET = auto()      # Get tuple element
    ARRAY_NEW = auto()      # Create array
    ARRAY_GET = auto()      # Index array
    ARRAY_SET = auto()      # Set array element
    
    # Type operations
    CAST = auto()           # Type cast
    BRAND = auto()          # Apply brand to value
    UNBRAND = auto()        # Remove brand from value
    
    # Pattern matching
    MATCH_BEGIN = auto()    # Begin match expression
    MATCH_ARM = auto()      # Match arm
    MATCH_END = auto()      # End match expression
    
    # Effects
    EFFECT_BEGIN = auto()   # Begin effectful operation
    EFFECT_END = auto()     # End effectful operation


@dataclass
class IRInstruction:
    """IR instruction."""
    opcode: IROpcode
    result: Optional[IRValue] = None
    operands: List[IRValue] = field(default_factory=list)
    type: Optional[IRType] = None
    label: Optional[str] = None  # For branches
    function_name: Optional[str] = None  # For calls
    field_name: Optional[str] = None  # For struct operations
    index: Optional[int] = None  # For tuple/array operations
    effects: List[Effect] = field(default_factory=list)  # For tracking effects
    span: Optional[Span] = None
    
    def __str__(self) -> str:
        result_str = f"{self.result} = " if self.result else ""
        operands_str = ", ".join(str(op) for op in self.operands)
        
        if self.opcode == IROpcode.CALL:
            return f"{result_str}call {self.function_name}({operands_str})"
        elif self.opcode in [IROpcode.BR, IROpcode.BR_COND]:
            return f"br {self.label} {operands_str}"
        elif self.opcode == IROpcode.RETURN:
            return f"return {operands_str}"
        elif self.opcode == IROpcode.STRUCT_GET:
            return f"{result_str}get {operands_str}.{self.field_name}"
        elif self.opcode == IROpcode.TUPLE_GET:
            return f"{result_str}get {operands_str}.{self.index}"
        else:
            return f"{result_str}{self.opcode.name.lower()} {operands_str}"


# ============================================================================
# IR Basic Blocks
# ============================================================================

@dataclass
class IRBasicBlock:
    """IR basic block (sequence of instructions with single entry/exit)."""
    label: str
    instructions: List[IRInstruction] = field(default_factory=list)
    predecessors: Set[str] = field(default_factory=set)
    successors: Set[str] = field(default_factory=set)
    
    def add_instruction(self, instr: IRInstruction):
        """Add instruction to this block."""
        self.instructions.append(instr)
    
    def is_terminated(self) -> bool:
        """Check if block is terminated (has return/branch)."""
        if not self.instructions:
            return False
        last = self.instructions[-1]
        return last.opcode in [IROpcode.RETURN, IROpcode.BR, IROpcode.BR_COND, IROpcode.UNREACHABLE]
    
    def __str__(self) -> str:
        instrs = "\n  ".join(str(i) for i in self.instructions)
        return f"{self.label}:\n  {instrs}"


# ============================================================================
# IR Functions
# ============================================================================

@dataclass
class IRFunction:
    """IR function."""
    name: str
    params: List[IRValue]
    return_type: IRType
    blocks: Dict[str, IRBasicBlock] = field(default_factory=dict)
    entry_block: Optional[str] = None
    locals: Dict[str, IRValue] = field(default_factory=dict)
    effects: List[Effect] = field(default_factory=list)
    
    def add_block(self, block: IRBasicBlock):
        """Add basic block to function."""
        self.blocks[block.label] = block
        if self.entry_block is None:
            self.entry_block = block.label
    
    def get_block(self, label: str) -> Optional[IRBasicBlock]:
        """Get block by label."""
        return self.blocks.get(label)
    
    def add_local(self, local: IRValue):
        """Add local variable."""
        self.locals[local.name] = local
    
    def __str__(self) -> str:
        params_str = ", ".join(str(p) for p in self.params)
        effects_str = ""
        if self.effects:
            effects_str = " !" + " + ".join(str(e) for e in self.effects)
        
        blocks_str = "\n\n".join(str(b) for b in self.blocks.values())
        return f"fn {self.name}({params_str}) -> {self.return_type}{effects_str} {{\n{blocks_str}\n}}"


# ============================================================================
# IR Module
# ============================================================================

@dataclass
class IRModule:
    """IR module (collection of functions, types, and globals)."""
    name: str
    functions: Dict[str, IRFunction] = field(default_factory=dict)
    types: Dict[str, IRType] = field(default_factory=dict)
    globals: Dict[str, IRValue] = field(default_factory=dict)
    imports: List[str] = field(default_factory=list)
    
    def add_function(self, func: IRFunction):
        """Add function to module."""
        self.functions[func.name] = func
    
    def get_function(self, name: str) -> Optional[IRFunction]:
        """Get function by name."""
        return self.functions.get(name)
    
    def add_type(self, name: str, ty: IRType):
        """Add named type to module."""
        self.types[name] = ty
    
    def add_global(self, global_var: IRValue):
        """Add global variable."""
        self.globals[global_var.name] = global_var
    
    def __str__(self) -> str:
        funcs = "\n\n".join(str(f) for f in self.functions.values())
        return f"module {self.name} {{\n{funcs}\n}}"
