"""Basic type checker tests."""

import unittest

from src.ast.nodes import *
from src.ast.types import *
from src.span import Position, Span, dummy_span
from src.type_checker import TypeChecker


class TestBasicTypeChecking(unittest.TestCase):
    """Test basic type checking functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.checker = TypeChecker()
        self.span = dummy_span()
    
    def test_literal_inference(self):
        """Test that literals are inferred correctly."""
        # Create a simple program with a literal
        lit = Literal(kind="integer", value="42", span=self.span)
        
        # Infer type
        inferred = self.checker._infer_literal(lit)
        
        # Should be i32 by default
        self.assertIsNotNone(inferred)
    
    def test_binary_op_type_checking(self):
        """Test binary operation type checking."""
        # Create: 1 + 2
        left = Literal(kind="integer", value="1", span=self.span)
        right = Literal(kind="integer", value="2", span=self.span)
        binop = BinaryOp(
            op=BinaryOpKind.ADD,
            left=left,
            right=right,
            span=self.span
        )
        
        # Should infer a type
        from src.type_checker.env import TypeEnvironment
        env = TypeEnvironment()
        result = self.checker._infer_binary_op(binop, env)
        
        self.assertIsNotNone(result)
        # Should have generated constraints
        self.assertGreater(len(self.checker.constraints), 0)
    
    def test_function_definition(self):
        """Test function definition type checking."""
        # Create: fn add(a: i32, b: i32) -> i32 { a + b }
        i32_type = PrimitiveType(kind=PrimitiveKind.I32, span=self.span)
        
        param_a = Parameter(name="a", type=i32_type, span=self.span)
        param_b = Parameter(name="b", type=i32_type, span=self.span)
        
        # Body: a + b
        ident_a = Identifier(name="a", span=self.span)
        ident_b = Identifier(name="b", span=self.span)
        body_expr = BinaryOp(
            op=BinaryOpKind.ADD,
            left=ident_a,
            right=ident_b,
            span=self.span
        )
        body = BlockExpr(statements=[], expr=body_expr, span=self.span)
        
        func = FunctionDef(
            name="add",
            params=[param_a, param_b],
            return_type=i32_type,
            body=body,
            span=self.span
        )
        
        # Check function
        from src.type_checker.env import TypeEnvironment
        env = TypeEnvironment()
        self.checker._check_function_def(func, env)
        
        # Should have no errors
        self.assertEqual(len(self.checker.errors), 0)
    
    def test_if_expression(self):
        """Test if expression type checking."""
        # Create: if true { 1 } else { 2 }
        condition = Literal(kind="bool", value="true", span=self.span)
        then_branch = Literal(kind="integer", value="1", span=self.span)
        else_branch = Literal(kind="integer", value="2", span=self.span)
        
        if_expr = IfExpr(
            condition=condition,
            then_branch=then_branch,
            else_branch=else_branch,
            span=self.span
        )
        
        from src.type_checker.env import TypeEnvironment
        env = TypeEnvironment()
        result = self.checker._infer_if_expr(if_expr, env)
        
        self.assertIsNotNone(result)
        # Should have constraints for condition being bool
        # and branches having same type
        self.assertGreater(len(self.checker.constraints), 0)


class TestConstraintSolving(unittest.TestCase):
    """Test constraint solving."""
    
    def test_simple_unification(self):
        """Test simple type unification."""
        from src.type_checker.types import TypeVariable
        from src.type_checker.constraints import Constraint, ConstraintKind, ConstraintSolver
        
        # Create constraints: t0 = t1, t1 = i32
        t0 = TypeVariable("t0")
        t1 = TypeVariable("t1")
        i32_type = PrimitiveType(kind=PrimitiveKind.I32, span=dummy_span())
        from src.type_checker.types import ConcreteType
        i32_inferred = ConcreteType(i32_type)
        
        constraints = [
            Constraint(ConstraintKind.EQUALITY, t0, t1, dummy_span()),
            Constraint(ConstraintKind.EQUALITY, t1, i32_inferred, dummy_span()),
        ]
        
        solver = ConstraintSolver()
        subst = solver.solve(constraints)
        
        # t0 should be unified with i32
        result = t0.substitute(subst)
        self.assertIsNotNone(result)


class TestBrandedTypes(unittest.TestCase):
    """Test branded type checking."""
    
    def test_branded_type_distinction(self):
        """Test that branded types are distinguished."""
        from src.type_checker.types import BrandedInferredType, ConcreteType
        
        i64_type = PrimitiveType(kind=PrimitiveKind.I64, span=dummy_span())
        i64_inferred = ConcreteType(i64_type)
        
        user_id = BrandedInferredType("UserId", i64_inferred)
        order_id = BrandedInferredType("OrderId", i64_inferred)
        
        # UserId and OrderId should not be equal
        self.assertNotEqual(user_id.brand_name, order_id.brand_name)


if __name__ == "__main__":
    unittest.main()
