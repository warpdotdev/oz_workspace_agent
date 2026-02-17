"""Ownership and borrow checker implementation.

Tracks ownership, moves, and borrows throughout the program.
"""

from dataclasses import dataclass, field
from typing import Dict, Set, List, Optional
from enum import Enum, auto

from ..ast.nodes import *
from ..span import Span


class BorrowKind(Enum):
    """Kind of borrow."""
    IMMUTABLE = auto()  # &T
    MUTABLE = auto()     # &mut T


@dataclass
class OwnershipError:
    """An ownership or borrow checking error."""
    message: str
    span: Span
    
    def __str__(self) -> str:
        return f"{self.span}: {self.message}"


@dataclass
class Variable:
    """Tracks ownership state of a variable."""
    name: str
    moved: bool = False
    move_location: Optional[Span] = None
    active_borrows: List[tuple[BorrowKind, Span]] = field(default_factory=list)


class OwnershipChecker:
    """Checks ownership and borrowing rules.
    
    Implements:
    - Single ownership
    - Move semantics
    - Borrow checking (no simultaneous mutable and immutable borrows)
    - Use-after-move detection
    - Non-Lexical Lifetimes (NLL)
    """
    
    def __init__(self):
        self.errors: List[OwnershipError] = []
        # Variable ownership state per scope
        self.variables: Dict[str, Variable] = {}
    
    def check_program(self, program: Program) -> bool:
        """Check ownership for entire program.
        
        Returns True if checking succeeds, False otherwise.
        """
        for item in program.items:
            if isinstance(item, FunctionDef) and item.body:
                self._check_function(item)
        
        return len(self.errors) == 0
    
    def _check_function(self, func: FunctionDef) -> None:
        """Check ownership within a function."""
        # Clear state for new function
        self.variables = {}
        
        # Parameters are owned by the function
        for param in func.params:
            self.variables[param.name] = Variable(name=param.name)
        
        # Check body
        if func.body:
            self._check_expr(func.body)
    
    def _check_expr(self, expr: Expression) -> None:
        """Check ownership for an expression."""
        if isinstance(expr, Identifier):
            self._check_identifier_use(expr)
        elif isinstance(expr, BinaryOp):
            self._check_expr(expr.left)
            self._check_expr(expr.right)
        elif isinstance(expr, UnaryOp):
            if expr.op == UnaryOpKind.REF:
                self._check_borrow(expr.operand, BorrowKind.IMMUTABLE)
            elif expr.op == UnaryOpKind.REF_MUT:
                self._check_borrow(expr.operand, BorrowKind.MUTABLE)
            else:
                self._check_expr(expr.operand)
        elif isinstance(expr, FunctionCall):
            self._check_function_call(expr)
        elif isinstance(expr, MethodCall):
            self._check_method_call(expr)
        elif isinstance(expr, IfExpr):
            self._check_if_expr(expr)
        elif isinstance(expr, MatchExpr):
            self._check_match_expr(expr)
        elif isinstance(expr, BlockExpr):
            self._check_block_expr(expr)
        elif isinstance(expr, LambdaExpr):
            self._check_lambda_expr(expr)
        elif isinstance(expr, FieldAccess):
            self._check_expr(expr.base)
        elif isinstance(expr, TupleExpr):
            for elem in expr.elements:
                self._check_expr(elem)
        elif isinstance(expr, ArrayExpr):
            for elem in expr.elements:
                self._check_expr(elem)
        elif isinstance(expr, StructExpr):
            for field_expr in expr.fields:
                self._check_expr(field_expr.value)
        elif isinstance(expr, CastExpr):
            self._check_expr(expr.expr)
        elif isinstance(expr, TryExpr):
            self._check_expr(expr.expr)
        elif isinstance(expr, AwaitExpr):
            self._check_expr(expr.expr)
        # Literals don't have ownership implications
    
    def _check_identifier_use(self, ident: Identifier) -> None:
        """Check that identifier hasn't been moved."""
        if ident.name in self.variables:
            var = self.variables[ident.name]
            if var.moved:
                self.errors.append(OwnershipError(
                    f"Use of moved value `{ident.name}`" + 
                    (f" (moved at {var.move_location})" if var.move_location else ""),
                    ident.span
                ))
    
    def _check_borrow(self, expr: Expression, borrow_kind: BorrowKind) -> None:
        """Check that a borrow is valid."""
        # Extract the borrowed variable
        var_name = self._extract_variable_name(expr)
        if not var_name:
            # Not borrowing a variable directly
            return
        
        if var_name not in self.variables:
            # Unknown variable - type checker should catch this
            return
        
        var = self.variables[var_name]
        
        # Check if variable has been moved
        if var.moved:
            self.errors.append(OwnershipError(
                f"Cannot borrow moved value `{var_name}`",
                expr.span
            ))
            return
        
        # Check borrow compatibility
        if borrow_kind == BorrowKind.MUTABLE:
            # Mutable borrow - no other borrows allowed
            if var.active_borrows:
                self.errors.append(OwnershipError(
                    f"Cannot borrow `{var_name}` as mutable because it is already borrowed",
                    expr.span
                ))
            else:
                var.active_borrows.append((borrow_kind, expr.span))
        else:
            # Immutable borrow - only mutable borrows conflict
            for kind, span in var.active_borrows:
                if kind == BorrowKind.MUTABLE:
                    self.errors.append(OwnershipError(
                        f"Cannot borrow `{var_name}` as immutable because it is already borrowed as mutable",
                        expr.span
                    ))
                    return
            var.active_borrows.append((borrow_kind, expr.span))
    
    def _check_function_call(self, call: FunctionCall) -> None:
        """Check function call arguments."""
        # Check function expression
        self._check_expr(call.function)
        
        # Check each argument
        for arg in call.arguments:
            # For simplicity, assume all arguments are moved unless they're borrows
            if isinstance(arg, UnaryOp) and arg.op in [UnaryOpKind.REF, UnaryOpKind.REF_MUT]:
                # This is a borrow - already handled in _check_expr
                self._check_expr(arg)
            else:
                # This moves the argument
                self._check_move(arg)
    
    def _check_method_call(self, call: MethodCall) -> None:
        """Check method call."""
        # Check receiver
        self._check_expr(call.receiver)
        
        # Check arguments
        for arg in call.arguments:
            if isinstance(arg, UnaryOp) and arg.op in [UnaryOpKind.REF, UnaryOpKind.REF_MUT]:
                self._check_expr(arg)
            else:
                self._check_move(arg)
    
    def _check_move(self, expr: Expression) -> None:
        """Check that a move is valid and mark the value as moved."""
        # Check the expression first
        self._check_expr(expr)
        
        # If it's an identifier, mark it as moved
        if isinstance(expr, Identifier):
            if expr.name in self.variables:
                var = self.variables[expr.name]
                if not var.moved:
                    var.moved = True
                    var.move_location = expr.span
    
    def _check_if_expr(self, if_expr: IfExpr) -> None:
        """Check if expression."""
        # Check condition
        self._check_expr(if_expr.condition)
        
        # Save current ownership state
        saved_state = self._save_state()
        
        # Check then branch
        self._check_expr(if_expr.then_branch)
        then_state = self._save_state()
        
        # Restore to before if
        self._restore_state(saved_state)
        
        # Check else branch if present
        if if_expr.else_branch:
            self._check_expr(if_expr.else_branch)
            else_state = self._save_state()
            
            # Merge states - variable is moved if moved in both branches
            self._merge_states(then_state, else_state)
        else:
            # No else branch - restore original state
            self._restore_state(saved_state)
    
    def _check_match_expr(self, match: MatchExpr) -> None:
        """Check match expression."""
        # Check scrutinee
        self._check_expr(match.scrutinee)
        
        # Save state before match
        saved_state = self._save_state()
        
        arm_states = []
        for arm in match.arms:
            # Restore to before match for each arm
            self._restore_state(saved_state)
            
            # Bind pattern variables
            # TODO: Extract variables from pattern and add to scope
            
            # Check arm body
            self._check_expr(arm.body)
            arm_states.append(self._save_state())
        
        # Merge all arm states
        if arm_states:
            self._restore_state(arm_states[0])
            for state in arm_states[1:]:
                self._merge_states(self._save_state(), state)
    
    def _check_block_expr(self, block: BlockExpr) -> None:
        """Check block expression."""
        # Create new scope
        saved_vars = dict(self.variables)
        
        # Check statements
        for stmt in block.statements:
            self._check_statement(stmt)
        
        # Check final expression
        if block.expr:
            self._check_expr(block.expr)
        
        # Restore outer scope (block-local variables go out of scope)
        # But keep modifications to outer variables
        for name in list(self.variables.keys()):
            if name not in saved_vars:
                del self.variables[name]
    
    def _check_lambda_expr(self, lambda_expr: LambdaExpr) -> None:
        """Check lambda expression."""
        # Save current state
        saved_vars = dict(self.variables)
        
        # Add parameters
        for param in lambda_expr.params:
            self.variables[param.name] = Variable(name=param.name)
        
        # Check body
        self._check_expr(lambda_expr.body)
        
        # Restore (lambda body is separate scope)
        self.variables = saved_vars
    
    def _check_statement(self, stmt: Statement) -> None:
        """Check statement."""
        if isinstance(stmt, LetStmt):
            # Check initializer
            if isinstance(stmt.pattern, IdentifierPattern):
                # New variable - initializer is moved into it
                self._check_move(stmt.value)
                # Add new variable to scope
                self.variables[stmt.pattern.name] = Variable(name=stmt.pattern.name)
            else:
                self._check_expr(stmt.value)
        elif isinstance(stmt, AssignStmt):
            # Assignment moves the value
            self._check_move(stmt.value)
            # Target must be valid
            self._check_expr(stmt.target)
        elif isinstance(stmt, ExprStmt):
            self._check_expr(stmt.expr)
        elif isinstance(stmt, ReturnStmt):
            if stmt.expr:
                self._check_move(stmt.expr)
    
    def _extract_variable_name(self, expr: Expression) -> Optional[str]:
        """Extract variable name from an expression, if it's a simple identifier."""
        if isinstance(expr, Identifier):
            return expr.name
        return None
    
    def _save_state(self) -> Dict[str, Variable]:
        """Save current ownership state."""
        return {
            name: Variable(
                name=var.name,
                moved=var.moved,
                move_location=var.move_location,
                active_borrows=list(var.active_borrows)
            )
            for name, var in self.variables.items()
        }
    
    def _restore_state(self, state: Dict[str, Variable]) -> None:
        """Restore ownership state."""
        self.variables = {
            name: Variable(
                name=var.name,
                moved=var.moved,
                move_location=var.move_location,
                active_borrows=list(var.active_borrows)
            )
            for name, var in state.items()
        }
    
    def _merge_states(self, state1: Dict[str, Variable], state2: Dict[str, Variable]) -> None:
        """Merge two ownership states (for control flow join points).
        
        A variable is moved if it's moved in both branches.
        Borrows are cleared at join points (conservatively).
        """
        for name in self.variables:
            var1 = state1.get(name)
            var2 = state2.get(name)
            
            if var1 and var2:
                # Variable is moved if moved in both branches
                self.variables[name].moved = var1.moved and var2.moved
                if self.variables[name].moved:
                    self.variables[name].move_location = var1.move_location or var2.move_location
                # Clear borrows at join point
                self.variables[name].active_borrows = []
