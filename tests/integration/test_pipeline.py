"""Integration tests for the compiler pipeline.

Tests integration between different compiler stages.
"""

import unittest
from src.lexer import Lexer
from src.parser import Parser
from src.type_checker import TypeChecker
from src.ownership import OwnershipChecker
from src.codegen import CodeGenerator
from src.codegen.rust_backend import RustBackend
from src.error_reporter import ErrorReporter


class PipelineIntegrationTest(unittest.TestCase):
    """Test integration between compiler stages."""
    
    def test_lexer_to_parser(self):
        """Test lexer output works with parser."""
        source = """
        fn add(a: i32, b: i32) -> i32 {
            a + b
        }
        """
        
        # Lex
        lexer = Lexer(source)
        tokens = lexer.tokenize()
        self.assertGreater(len(tokens), 0)
        
        # Parse
        parser = Parser(source)
        program = parser.parse()
        self.assertEqual(len(parser.errors), 0)
        self.assertIsNotNone(program)
    
    def test_parser_to_type_checker(self):
        """Test parser AST works with type checker."""
        source = """
        fn add(a: i32, b: i32) -> i32 {
            a + b
        }
        
        fn main() !IO {
            let x = add(1, 2);
        }
        """
        
        # Parse
        parser = Parser(source)
        program = parser.parse()
        self.assertEqual(len(parser.errors), 0)
        
        # Type check
        type_checker = TypeChecker()
        success = type_checker.check_program(program)
        
        if not success:
            for err in type_checker.errors:
                print(f"Type error: {err}")
        
        self.assertTrue(success)
    
    def test_type_checker_to_codegen(self):
        """Test type-checked AST works with code generator."""
        source = """
        fn add(a: i32, b: i32) -> i32 {
            a + b
        }
        """
        
        # Parse
        parser = Parser(source)
        program = parser.parse()
        self.assertEqual(len(parser.errors), 0)
        
        # Type check
        type_checker = TypeChecker()
        success = type_checker.check_program(program)
        self.assertTrue(success)
        
        # Generate code
        codegen = CodeGenerator(type_checker)
        ir_module = codegen.generate_module(program)
        self.assertIsNotNone(ir_module)
        self.assertGreater(len(ir_module.functions), 0)
    
    def test_codegen_to_rust_backend(self):
        """Test IR works with Rust backend."""
        source = """
        fn add(a: i32, b: i32) -> i32 {
            a + b
        }
        """
        
        # Parse
        parser = Parser(source)
        program = parser.parse()
        
        # Type check
        type_checker = TypeChecker()
        type_checker.check_program(program)
        
        # Generate IR
        codegen = CodeGenerator(type_checker)
        ir_module = codegen.generate_module(program)
        
        # Generate Rust
        rust_backend = RustBackend()
        rust_code = rust_backend.generate(ir_module)
        
        self.assertIsNotNone(rust_code)
        self.assertIn("fn add", rust_code)
    
    def test_error_reporter_integration(self):
        """Test error reporter works with all error types."""
        # Parse error
        source = "fn bad syntax !!!"
        parser = Parser(source)
        program = parser.parse()
        
        error_reporter = ErrorReporter()
        for err in parser.errors:
            error_reporter.add_parse_error(err)
        
        json_errors = error_reporter.format_json()
        self.assertIn("errors", json_errors)
    
    def test_full_pipeline_simple(self):
        """Test complete pipeline with simple program."""
        source = """
        fn double(x: i32) -> i32 {
            x * 2
        }
        
        fn main() !IO {
            let result = double(21);
        }
        """
        
        # Parse
        parser = Parser(source)
        program = parser.parse()
        self.assertEqual(len(parser.errors), 0)
        
        # Type check
        type_checker = TypeChecker()
        type_success = type_checker.check_program(program)
        
        if not type_success:
            for err in type_checker.errors:
                print(f"Type error: {err}")
        
        self.assertTrue(type_success)
        
        # Ownership check
        ownership_checker = OwnershipChecker()
        ownership_success = ownership_checker.check_program(program)
        
        if not ownership_success:
            for err in ownership_checker.errors:
                print(f"Ownership error: {err}")
        
        self.assertTrue(ownership_success)
        
        # Generate IR
        codegen = CodeGenerator(type_checker)
        ir_module = codegen.generate_module(program)
        self.assertIsNotNone(ir_module)
        
        # Generate Rust
        rust_backend = RustBackend()
        rust_code = rust_backend.generate(ir_module)
        self.assertIsNotNone(rust_code)
        self.assertIn("fn double", rust_code)
        self.assertIn("fn main", rust_code)
    
    def test_branded_types_through_pipeline(self):
        """Test branded types work through entire pipeline."""
        source = """
        type UserId = u64 as UserId;
        
        struct User {
            id: UserId,
            name: String,
        }
        
        fn create_user(id: u64) -> User {
            User {
                id: UserId::from(id),
                name: "Alice",
            }
        }
        """
        
        # Parse
        parser = Parser(source)
        program = parser.parse()
        self.assertEqual(len(parser.errors), 0)
        
        # Type check
        type_checker = TypeChecker()
        success = type_checker.check_program(program)
        self.assertTrue(success)
        
        # Check branded type was registered
        self.assertIn("UserId", type_checker.branded_types)
        
        # Generate code
        codegen = CodeGenerator(type_checker)
        ir_module = codegen.generate_module(program)
        self.assertIsNotNone(ir_module)
        
        # Verify Rust code has newtype
        rust_backend = RustBackend()
        rust_code = rust_backend.generate(ir_module)
        self.assertIn("struct UserId", rust_code)


if __name__ == "__main__":
    unittest.main()
