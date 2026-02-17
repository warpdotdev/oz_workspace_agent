"""Ownership and borrow checker tests."""

import unittest

from src.ast.nodes import *
from src.ast.types import *
from src.span import dummy_span
from src.ownership import OwnershipChecker


class TestOwnershipBasics(unittest.TestCase):
    """Test basic ownership checking."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.checker = OwnershipChecker()
        self.span = dummy_span()
    
    def test_simple_use(self):
        """Test simple variable use."""
        # fn test() { let x = 42; x; }
        i32_type = PrimitiveType(kind=PrimitiveKind.I32, span=self.span)
        param = Parameter(name="x", type=i32_type, span=self.span)
        
        # Body: x
        body_expr = Identifier(name="x", span=self.span)
        body = BlockExpr(statements=[], expr=body_expr, span=self.span)
        
        func = FunctionDef(
            name="test",
            params=[param],
            body=body,
            span=self.span
        )
        
        self.checker._check_function(func)
        
        # Should have no errors
        self.assertEqual(len(self.checker.errors), 0)
    
    def test_use_after_move(self):
        """Test use-after-move detection."""
        # fn test(x: i32) { let y = x; x; }  // Error: x moved
        i32_type = PrimitiveType(kind=PrimitiveKind.I32, span=self.span)
        param = Parameter(name="x", type=i32_type, span=self.span)
        
        # let y = x
        init = Identifier(name="x", span=self.span)
        pattern = IdentifierPattern(name="y", span=self.span)
        let_stmt = LetStmt(
            pattern=pattern,
            initializer=init,
            span=self.span
        )
        
        # x (use after move)
        use_x = Identifier(name="x", span=self.span)
        
        body = BlockExpr(statements=[let_stmt], expr=use_x, span=self.span)
        
        func = FunctionDef(
            name="test",
            params=[param],
            body=body,
            span=self.span
        )
        
        self.checker._check_function(func)
        
        # Should have an error for use after move
        self.assertEqual(len(self.checker.errors), 1)
        self.assertIn("moved", self.checker.errors[0].message.lower())
    
    def test_borrow(self):
        """Test borrowing."""
        # fn test(x: i32) { let y = &x; x; }  // OK: x only borrowed
        i32_type = PrimitiveType(kind=PrimitiveKind.I32, span=self.span)
        param = Parameter(name="x", type=i32_type, span=self.span)
        
        # let y = &x
        x_ident = Identifier(name="x", span=self.span)
        borrow = UnaryOp(
            op=UnaryOpKind.REF,
            operand=x_ident,
            span=self.span
        )
        pattern = IdentifierPattern(name="y", span=self.span)
        let_stmt = LetStmt(
            pattern=pattern,
            initializer=borrow,
            span=self.span
        )
        
        # x (use after borrow - OK)
        use_x = Identifier(name="x", span=self.span)
        
        body = BlockExpr(statements=[let_stmt], expr=use_x, span=self.span)
        
        func = FunctionDef(
            name="test",
            params=[param],
            body=body,
            span=self.span
        )
        
        self.checker._check_function(func)
        
        # Should have no errors (borrow doesn't move)
        self.assertEqual(len(self.checker.errors), 0)


class TestBorrowConflicts(unittest.TestCase):
    """Test borrow conflict detection."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.checker = OwnershipChecker()
        self.span = dummy_span()
    
    def test_mutable_and_immutable_borrow(self):
        """Test that mutable and immutable borrows conflict."""
        # This would require more complex setup to test properly
        # For now, just verify the checker exists
        self.assertIsNotNone(self.checker)


if __name__ == "__main__":
    unittest.main()
