"""Tests for code generation (AST -> IR -> Rust)."""

import unittest
from src.span import Span, dummy_span
from src.ast import nodes
from src.ast.types import PrimitiveType, PrimitiveKind, Effect, EffectKind
from src.codegen.generator import CodeGenerator
from src.codegen.rust_backend import RustBackend
from src.ir.ir import IRTypeKind


class TestCodeGenerator(unittest.TestCase):
    """Test code generation from AST to IR."""
    
    def setUp(self):
        self.generator = CodeGenerator()
        self.span = dummy_span()
    
    def test_simple_function(self):
        """Test generating IR for a simple function."""
        # Create AST for: fn add(a: i32, b: i32) -> i32 { a + b }
        func = nodes.FunctionDef(
            name="add",
            params=[
                nodes.Parameter("a", PrimitiveType(span=self.span, kind=PrimitiveKind.I32), self.span),
                nodes.Parameter("b", PrimitiveType(span=self.span, kind=PrimitiveKind.I32), self.span),
            ],
            return_type=PrimitiveType(span=self.span, kind=PrimitiveKind.I32),
            body=nodes.BlockExpr(
                statements=[],
                expr=nodes.BinaryOp(
                    span=self.span,
                    op=nodes.BinaryOpKind.ADD,
                    left=nodes.Identifier(span=self.span, name="a"),
                    right=nodes.Identifier(span=self.span, name="b")
                ),
                span=self.span
            ),
            span=self.span
        )
        
        program = nodes.Program(items=[func], span=self.span)
        ir_module = self.generator.generate_module(program)
        
        # Check IR module was created
        self.assertIsNotNone(ir_module)
        self.assertEqual(ir_module.name, "main")
        
        # Check function was generated
        self.assertIn("add", ir_module.functions)
        ir_func = ir_module.functions["add"]
        
        # Check function signature
        self.assertEqual(ir_func.name, "add")
        self.assertEqual(len(ir_func.params), 2)
        self.assertEqual(ir_func.params[0].name, "a")
        self.assertEqual(ir_func.params[1].name, "b")
        self.assertEqual(ir_func.return_type.kind, IRTypeKind.I32)
        
        # Check entry block exists
        self.assertIsNotNone(ir_func.entry_block)
        self.assertIn(ir_func.entry_block, ir_func.blocks)
    
    def test_struct_definition(self):
        """Test generating IR for struct definition."""
        # Create AST for: struct Point { x: i32, y: i32 }
        struct_def = nodes.StructDef(
            name="Point",
            fields=[
                nodes.Field("x", PrimitiveType(span=self.span, kind=PrimitiveKind.I32), self.span),
                nodes.Field("y", PrimitiveType(span=self.span, kind=PrimitiveKind.I32), self.span),
            ],
            span=self.span
        )
        
        program = nodes.Program(items=[struct_def], span=self.span)
        ir_module = self.generator.generate_module(program)
        
        # Check struct type was registered
        self.assertIn("Point", ir_module.types)
        struct_type = ir_module.types["Point"]
        
        self.assertEqual(struct_type.kind, IRTypeKind.STRUCT)
        self.assertEqual(struct_type.name, "Point")
        self.assertEqual(len(struct_type.fields), 2)
        self.assertEqual(struct_type.fields[0][0], "x")
        self.assertEqual(struct_type.fields[1][0], "y")
    
    def test_hello_world(self):
        """Test generating IR for hello world program."""
        # Create AST for: fn main() !IO { println("Hello, World!"); }
        func = nodes.FunctionDef(
            name="main",
            params=[],
            return_type=None,
            body=nodes.BlockExpr(
                statements=[
                    nodes.ExprStmt(
                        span=self.span,
                        expr=nodes.FunctionCall(
                            span=self.span,
                            function=nodes.Identifier(span=self.span, name="println"),
                            args=[nodes.Literal(
                                span=self.span,
                                kind=nodes.LiteralKind.STRING,
                                value="Hello, World!"
                            )]
                        )
                    )
                ],
                expr=None,
                span=self.span
            ),
            effects=[Effect(kind=EffectKind.IO, span=self.span)],
            span=self.span
        )
        
        program = nodes.Program(items=[func], span=self.span)
        ir_module = self.generator.generate_module(program)
        
        # Check IR module was created
        self.assertIsNotNone(ir_module)
        self.assertIn("main", ir_module.functions)
        
        ir_func = ir_module.functions["main"]
        self.assertEqual(ir_func.name, "main")
        self.assertEqual(len(ir_func.effects), 1)
        self.assertEqual(ir_func.effects[0].kind, EffectKind.IO)


class TestRustBackend(unittest.TestCase):
    """Test Rust code generation from IR."""
    
    def setUp(self):
        self.backend = RustBackend()
        self.generator = CodeGenerator()
        self.span = dummy_span()
    
    def test_simple_function_rust(self):
        """Test generating Rust code for simple function."""
        # Create AST for: fn add(a: i32, b: i32) -> i32 { a + b }
        func = nodes.FunctionDef(
            name="add",
            params=[
                nodes.Parameter("a", PrimitiveType(span=self.span, kind=PrimitiveKind.I32), self.span),
                nodes.Parameter("b", PrimitiveType(span=self.span, kind=PrimitiveKind.I32), self.span),
            ],
            return_type=PrimitiveType(span=self.span, kind=PrimitiveKind.I32),
            body=nodes.BlockExpr(
                statements=[],
                expr=nodes.BinaryOp(
                    span=self.span,
                    op=nodes.BinaryOpKind.ADD,
                    left=nodes.Identifier(span=self.span, name="a"),
                    right=nodes.Identifier(span=self.span, name="b")
                ),
                span=self.span
            ),
            span=self.span
        )
        
        program = nodes.Program(items=[func], span=self.span)
        ir_module = self.generator.generate_module(program)
        rust_code = self.backend.generate(ir_module)
        
        # Check Rust code was generated
        self.assertIn("pub fn add(a: i32, b: i32) -> i32", rust_code)
        self.assertIn("// Generated by Veritas compiler", rust_code)
    
    def test_struct_rust(self):
        """Test generating Rust code for struct."""
        # Create AST for: struct Point { x: i32, y: i32 }
        struct_def = nodes.StructDef(
            name="Point",
            fields=[
                nodes.Field("x", PrimitiveType(span=self.span, kind=PrimitiveKind.I32), self.span),
                nodes.Field("y", PrimitiveType(span=self.span, kind=PrimitiveKind.I32), self.span),
            ],
            span=self.span
        )
        
        program = nodes.Program(items=[struct_def], span=self.span)
        ir_module = self.generator.generate_module(program)
        rust_code = self.backend.generate(ir_module)
        
        # Check Rust struct was generated
        self.assertIn("pub struct Point", rust_code)
        self.assertIn("pub x: i32", rust_code)
        self.assertIn("pub y: i32", rust_code)
    
    def test_branded_type_rust(self):
        """Test generating Rust code for branded type."""
        from src.ast.types import BrandedType
        
        # Create AST for: type UserId = u64 as UserId
        type_alias = nodes.TypeAlias(
            name="UserId",
            aliased_type=BrandedType(
                span=self.span,
                base_type=PrimitiveType(span=self.span, kind=PrimitiveKind.U64),
                brand_name="UserId"
            ),
            span=self.span
        )
        
        program = nodes.Program(items=[type_alias], span=self.span)
        ir_module = self.generator.generate_module(program)
        rust_code = self.backend.generate(ir_module)
        
        # Check Rust newtype was generated
        self.assertIn("pub struct UserId(pub u64)", rust_code)
        self.assertIn("impl UserId", rust_code)
        self.assertIn("pub fn new(value: u64) -> Self", rust_code)
        self.assertIn("pub fn into_inner(self) -> u64", rust_code)
    
    def test_hello_world_rust(self):
        """Test generating Rust code for hello world."""
        func = nodes.FunctionDef(
            name="main",
            params=[],
            return_type=None,
            body=nodes.BlockExpr(
                statements=[
                    nodes.ExprStmt(
                        span=self.span,
                        expr=nodes.FunctionCall(
                            span=self.span,
                            function=nodes.Identifier(span=self.span, name="println"),
                            args=[nodes.Literal(
                                span=self.span,
                                kind=nodes.LiteralKind.STRING,
                                value="Hello, World!"
                            )]
                        )
                    )
                ],
                expr=None,
                span=self.span
            ),
            effects=[Effect(kind=EffectKind.IO, span=self.span)],
            span=self.span
        )
        
        program = nodes.Program(items=[func], span=self.span)
        ir_module = self.generator.generate_module(program)
        rust_code = self.backend.generate(ir_module)
        
        # Check Rust main function was generated
        self.assertIn("pub fn main()", rust_code)
        self.assertIn("println", rust_code)


if __name__ == "__main__":
    unittest.main()
