"""Performance tests for the Veritas compiler.

Tests compilation time, memory usage, and scalability.
"""

import unittest
import time
import sys
from pathlib import Path

from src.parser import Parser
from src.type_checker import TypeChecker
from src.ownership import OwnershipChecker
from src.codegen import CodeGenerator
from src.codegen.rust_backend import RustBackend


class PerformanceTest(unittest.TestCase):
    """Test compiler performance."""
    
    def measure_compilation_time(self, source: str) -> dict:
        """Measure time for each compilation stage.
        
        Returns:
            Dict with timing information
        """
        timings = {}
        
        # Parse
        start = time.time()
        parser = Parser(source)
        program = parser.parse()
        timings['parse'] = time.time() - start
        
        if parser.errors:
            return timings
        
        # Type check
        start = time.time()
        type_checker = TypeChecker()
        type_checker.check_program(program)
        timings['type_check'] = time.time() - start
        
        # Ownership check
        start = time.time()
        ownership_checker = OwnershipChecker()
        ownership_checker.check_program(program)
        timings['ownership_check'] = time.time() - start
        
        # Code generation
        start = time.time()
        codegen = CodeGenerator(type_checker)
        ir_module = codegen.generate_module(program)
        timings['ir_generation'] = time.time() - start
        
        # Rust generation
        start = time.time()
        rust_backend = RustBackend()
        rust_backend.generate(ir_module)
        timings['rust_generation'] = time.time() - start
        
        timings['total'] = sum(timings.values())
        
        return timings
    
    def test_small_program_performance(self):
        """Test performance on small program."""
        source = """
        fn add(a: i32, b: i32) -> i32 {
            a + b
        }
        
        fn main() !IO {
            let x = add(1, 2);
        }
        """
        
        timings = self.measure_compilation_time(source)
        
        print(f"\nSmall program performance:")
        for stage, duration in timings.items():
            print(f"  {stage}: {duration:.4f}s")
        
        # Assert reasonable performance (< 1 second total)
        self.assertLess(timings['total'], 1.0)
    
    def test_medium_program_performance(self):
        """Test performance on medium-sized program."""
        # Generate a medium program with multiple functions
        functions = []
        for i in range(20):
            functions.append(f"""
            fn func{i}(x: i32) -> i32 {{
                x + {i}
            }}
            """)
        
        source = "\n".join(functions) + """
        fn main() !IO {
            let x = func0(1);
        }
        """
        
        timings = self.measure_compilation_time(source)
        
        print(f"\nMedium program performance (20 functions):")
        for stage, duration in timings.items():
            print(f"  {stage}: {duration:.4f}s")
        
        # Assert reasonable performance (< 5 seconds total)
        self.assertLess(timings['total'], 5.0)
    
    def test_large_program_performance(self):
        """Test performance on large program."""
        # Generate a large program with many functions
        functions = []
        for i in range(100):
            functions.append(f"""
            fn func{i}(x: i32, y: i32) -> i32 {{
                x + y + {i}
            }}
            """)
        
        source = "\n".join(functions) + """
        fn main() !IO {
            let x = func0(1, 2);
        }
        """
        
        timings = self.measure_compilation_time(source)
        
        print(f"\nLarge program performance (100 functions):")
        for stage, duration in timings.items():
            print(f"  {stage}: {duration:.4f}s")
        
        # Assert reasonable performance (< 10 seconds total)
        self.assertLess(timings['total'], 10.0)
    
    def test_parsing_performance(self):
        """Test parser performance specifically."""
        # Generate code with lots of expressions
        expressions = []
        for i in range(100):
            expressions.append(f"let x{i} = {i} + {i+1};")
        
        source = f"""
        fn main() !IO {{
            {" ".join(expressions)}
        }}
        """
        
        start = time.time()
        parser = Parser(source)
        program = parser.parse()
        duration = time.time() - start
        
        print(f"\nParsing 100 expressions: {duration:.4f}s")
        
        self.assertEqual(len(parser.errors), 0)
        self.assertLess(duration, 1.0)
    
    def test_type_checking_performance(self):
        """Test type checker performance."""
        # Generate code with complex types
        source = """
        type UserId = u64 as UserId;
        type OrderId = u64 as OrderId;
        
        struct User {
            id: UserId,
            name: String,
        }
        
        struct Order {
            id: OrderId,
            user_id: UserId,
        }
        """
        
        # Add many functions
        functions = []
        for i in range(50):
            functions.append(f"""
            fn process{i}(user: User, order: Order) -> bool {{
                user.id == order.user_id
            }}
            """)
        
        source += "\n".join(functions)
        
        parser = Parser(source)
        program = parser.parse()
        
        start = time.time()
        type_checker = TypeChecker()
        type_checker.check_program(program)
        duration = time.time() - start
        
        print(f"\nType checking 50 functions with branded types: {duration:.4f}s")
        
        self.assertLess(duration, 2.0)
    
    def test_memory_usage_estimation(self):
        """Estimate memory usage during compilation."""
        source = """
        fn factorial(n: i32) -> i32 {
            if n <= 1 {
                1
            } else {
                n * factorial(n - 1)
            }
        }
        
        fn main() !IO {
            let result = factorial(10);
        }
        """
        
        # Parse
        parser = Parser(source)
        program = parser.parse()
        
        # Type check
        type_checker = TypeChecker()
        type_checker.check_program(program)
        
        # Generate code
        codegen = CodeGenerator(type_checker)
        ir_module = codegen.generate_module(program)
        
        # Check that memory usage is reasonable
        # Python doesn't give us precise memory usage, but we can check object counts
        import gc
        gc.collect()
        objects = len(gc.get_objects())
        
        print(f"\nTotal Python objects after compilation: {objects}")
        
        # Assert reasonable number of objects
        self.assertLess(objects, 100000)


if __name__ == "__main__":
    unittest.main()
