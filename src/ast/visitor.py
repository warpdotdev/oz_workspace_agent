"""AST Visitor pattern for traversing Veritas AST."""

from abc import ABC
from typing import TypeVar, Generic

from .nodes import *
from .types import *

T = TypeVar('T')


class ASTVisitor(ABC, Generic[T]):
    """Base visitor class for traversing AST nodes.
    
    Subclass and override visit_* methods to implement custom traversals.
    """
    
    def visit(self, node: ASTNode) -> T:
        """Visit a node by dispatching to the appropriate method."""
        method_name = f"visit_{type(node).__name__}"
        method = getattr(self, method_name, self.generic_visit)
        return method(node)
    
    def generic_visit(self, node: ASTNode) -> T:
        """Default visitor for unhandled nodes."""
        raise NotImplementedError(f"No visitor for {type(node).__name__}")
    
    # Program structure
    def visit_Program(self, node: Program) -> T:
        for item in node.items:
            self.visit(item)
        return None
    
    def visit_ModuleDef(self, node: ModuleDef) -> T:
        for item in node.items:
            self.visit(item)
        return None
    
    def visit_Import(self, node: Import) -> T:
        return None
    
    # Definitions
    def visit_FunctionDef(self, node: FunctionDef) -> T:
        if node.body:
            self.visit(node.body)
        return None
    
    def visit_StructDef(self, node: StructDef) -> T:
        return None
    
    def visit_EnumDef(self, node: EnumDef) -> T:
        return None
    
    def visit_TypeAlias(self, node: TypeAlias) -> T:
        return None
    
    def visit_ConstDef(self, node: ConstDef) -> T:
        self.visit(node.value)
        return None
    
    def visit_TraitDef(self, node: TraitDef) -> T:
        for method in node.methods:
            self.visit(method)
        return None
    
    def visit_ImplBlock(self, node: ImplBlock) -> T:
        for method in node.methods:
            self.visit(method)
        return None
    
    # Statements
    def visit_LetStmt(self, node: LetStmt) -> T:
        if node.value:
            self.visit(node.value)
        return None
    
    def visit_AssignStmt(self, node: AssignStmt) -> T:
        self.visit(node.target)
        self.visit(node.value)
        return None
    
    def visit_ExprStmt(self, node: ExprStmt) -> T:
        self.visit(node.expr)
        return None
    
    def visit_ReturnStmt(self, node: ReturnStmt) -> T:
        if node.value:
            self.visit(node.value)
        return None
    
    def visit_BreakStmt(self, node: BreakStmt) -> T:
        if node.value:
            self.visit(node.value)
        return None
    
    def visit_ContinueStmt(self, node: ContinueStmt) -> T:
        return None
    
    # Expressions
    def visit_Literal(self, node: Literal) -> T:
        return None
    
    def visit_Identifier(self, node: Identifier) -> T:
        return None
    
    def visit_PathExpr(self, node: PathExpr) -> T:
        return None
    
    def visit_BinaryOp(self, node: BinaryOp) -> T:
        self.visit(node.left)
        self.visit(node.right)
        return None
    
    def visit_UnaryOp(self, node: UnaryOp) -> T:
        self.visit(node.operand)
        return None
    
    def visit_FunctionCall(self, node: FunctionCall) -> T:
        self.visit(node.function)
        for arg in node.args:
            self.visit(arg)
        return None
    
    def visit_MethodCall(self, node: MethodCall) -> T:
        self.visit(node.object)
        for arg in node.args:
            self.visit(arg)
        return None
    
    def visit_FieldAccess(self, node: FieldAccess) -> T:
        self.visit(node.object)
        return None
    
    def visit_IndexAccess(self, node: IndexAccess) -> T:
        self.visit(node.object)
        self.visit(node.index)
        return None
    
    def visit_IfExpr(self, node: IfExpr) -> T:
        self.visit(node.condition)
        self.visit(node.then_branch)
        if node.else_branch:
            self.visit(node.else_branch)
        return None
    
    def visit_MatchExpr(self, node: MatchExpr) -> T:
        self.visit(node.scrutinee)
        for arm in node.arms:
            self.visit(arm.body)
        return None
    
    def visit_BlockExpr(self, node: BlockExpr) -> T:
        for stmt in node.statements:
            self.visit(stmt)
        if node.expr:
            self.visit(node.expr)
        return None
    
    def visit_LambdaExpr(self, node: LambdaExpr) -> T:
        self.visit(node.body)
        return None
    
    def visit_ForExpr(self, node: ForExpr) -> T:
        self.visit(node.iterable)
        self.visit(node.body)
        return None
    
    def visit_WhileExpr(self, node: WhileExpr) -> T:
        self.visit(node.condition)
        self.visit(node.body)
        return None
    
    def visit_LoopExpr(self, node: LoopExpr) -> T:
        self.visit(node.body)
        return None
    
    def visit_RangeExpr(self, node: RangeExpr) -> T:
        if node.start:
            self.visit(node.start)
        if node.end:
            self.visit(node.end)
        return None
    
    def visit_StructExpr(self, node: StructExpr) -> T:
        for _, value in node.fields:
            self.visit(value)
        if node.base:
            self.visit(node.base)
        return None
    
    def visit_TupleExpr(self, node: TupleExpr) -> T:
        for elem in node.elements:
            self.visit(elem)
        return None
    
    def visit_ArrayExpr(self, node: ArrayExpr) -> T:
        for elem in node.elements:
            self.visit(elem)
        if node.repeat:
            self.visit(node.repeat)
        return None
    
    def visit_CastExpr(self, node: CastExpr) -> T:
        self.visit(node.expr)
        return None
    
    def visit_AwaitExpr(self, node: AwaitExpr) -> T:
        self.visit(node.expr)
        return None
    
    def visit_TryExpr(self, node: TryExpr) -> T:
        self.visit(node.expr)
        return None
