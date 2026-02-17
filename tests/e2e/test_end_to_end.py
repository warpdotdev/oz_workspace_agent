"""End-to-end compiler tests.

Tests the complete compilation pipeline:
1. Parse Veritas source code
2. Type check the AST
3. Generate IR
4. Generate Rust code
5. Compile Rust code
6. Run the executable
"""

import unittest
import os
import subprocess
import tempfile
from pathlib import Path

from src.lexer import Lexer
from src.parser import Parser
from src.type_checker import TypeChecker
from src.ownership import OwnershipChecker
from src.codegen import CodeGenerator
from src.codegen.rust_backend import RustBackend
from src.error_reporter import ErrorReporter


class EndToEndTest(unittest.TestCase):
    """Test complete compilation pipeline."""
    
    def setUp(self):
        """Set up test environment."""
        self.examples_dir = Path(__file__).parent.parent / "examples"
        self.temp_dir = tempfile.mkdtemp()
    
    def tearDown(self):
        """Clean up temp files."""
        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
    
    def compile_and_run(self, veritas_source: str, expected_output: str = None):
        """Compile Veritas source and optionally run it.
        
        Args:
            veritas_source: Veritas source code
            expected_output: Expected output from running the program (if any)
        
        Returns:
            Tuple of (success, output, errors)
        """
        # Step 1: Parse
        parser = Parser(veritas_source, filename="<test>")
        program = parser.parse()
        
        if parser.errors:
            error_reporter = ErrorReporter()
            for err in parser.errors:
                error_reporter.add_parse_error(err)
            return False, None, error_reporter.format_json()
        
        # Step 2: Type check
        type_checker = TypeChecker()
        type_check_success = type_checker.check_program(program)
        
        if not type_check_success:
            error_reporter = ErrorReporter()
            for err in type_checker.errors:
                error_reporter.add_type_error(err)
            return False, None, error_reporter.format_json()
        
        # Step 3: Ownership check
        ownership_checker = OwnershipChecker()
        ownership_success = ownership_checker.check_program(program)
        
        if not ownership_success:
            error_reporter = ErrorReporter()
            for err in ownership_checker.errors:
                error_reporter.add_ownership_error(err)
            return False, None, error_reporter.format_json()
        
        # Step 4: Generate IR
        codegen = CodeGenerator(type_checker)
        ir_module = codegen.generate_module(program)
        
        # Step 5: Generate Rust code
        rust_backend = RustBackend()
        rust_code = rust_backend.generate(ir_module)
        
        # Step 6: Write Rust code to temp file
        rust_file = os.path.join(self.temp_dir, "main.rs")
        with open(rust_file, 'w') as f:
            f.write(rust_code)
        
        # Step 7: Compile Rust code
        executable = os.path.join(self.temp_dir, "program")
        compile_result = subprocess.run(
            ["rustc", rust_file, "-o", executable],
            capture_output=True,
            text=True
        )
        
        if compile_result.returncode != 0:
            return False, None, f"Rust compilation failed:\n{compile_result.stderr}"
        
        # Step 8: Run if expected output is provided
        if expected_output is not None:
            run_result = subprocess.run(
                [executable],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if run_result.returncode != 0:
                return False, run_result.stdout, f"Program failed:\n{run_result.stderr}"
            
            return True, run_result.stdout.strip(), None
        
        return True, None, None
    
    def test_hello_world(self):
        """Test Example 1: Hello World."""
        example_file = self.examples_dir / "01_hello_world.veritas"
        
        if not example_file.exists():
            self.skipTest(f"Example file not found: {example_file}")
        
        with open(example_file) as f:
            source = f.read()
        
        success, output, errors = self.compile_and_run(source, expected_output="Hello, World!")
        
        if not success:
            self.fail(f"Compilation failed:\n{errors}")
        
        self.assertEqual(output, "Hello, World!")
    
    def test_simple_function(self):
        """Test simple function with arithmetic."""
        example_file = self.examples_dir / "02_simple_function.veritas"
        
        if not example_file.exists():
            self.skipTest(f"Example file not found: {example_file}")
        
        with open(example_file) as f:
            source = f.read()
        
        success, output, errors = self.compile_and_run(source, expected_output="Result: 8")
        
        if not success:
            self.fail(f"Compilation failed:\n{errors}")
        
        self.assertIn("Result: 8", output)
    
    def test_branded_types(self):
        """Test Example 3: Branded Types."""
        example_file = self.examples_dir / "03_branded_types.veritas"
        
        if not example_file.exists():
            self.skipTest(f"Example file not found: {example_file}")
        
        with open(example_file) as f:
            source = f.read()
        
        # Should compile successfully
        success, output, errors = self.compile_and_run(source)
        
        if not success:
            self.fail(f"Compilation failed:\n{errors}")
    
    def test_pattern_matching(self):
        """Test Example 4: Pattern Matching."""
        example_file = self.examples_dir / "04_pattern_matching.veritas"
        
        if not example_file.exists():
            self.skipTest(f"Example file not found: {example_file}")
        
        with open(example_file) as f:
            source = f.read()
        
        # Should compile successfully
        success, output, errors = self.compile_and_run(source)
        
        if not success:
            self.fail(f"Compilation failed:\n{errors}")
    
    def test_type_error_detection(self):
        """Test that type errors are caught."""
        source = """
        fn add(a: i32, b: i32) -> i32 {
            a + b
        }
        
        fn main() !IO {
            let result = add("hello", "world");  // Type error!
            println("Result: {}", result);
        }
        """
        
        success, output, errors = self.compile_and_run(source)
        
        # Should fail with type error
        self.assertFalse(success)
        self.assertIsNotNone(errors)
    
    def test_ownership_error_detection(self):
        """Test that ownership errors are caught."""
        source = """
        fn main() !IO {
            let x = 42;
            let y = move x;
            println("x: {}", x);  // Use after move!
        }
        """
        
        success, output, errors = self.compile_and_run(source)
        
        # Should fail with ownership error
        self.assertFalse(success)
        self.assertIsNotNone(errors)


if __name__ == "__main__":
    unittest.main()
