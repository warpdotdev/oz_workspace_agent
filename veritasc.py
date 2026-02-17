#!/usr/bin/env python3
"""Veritas Compiler CLI.

Compiles Veritas source code to Rust.

Usage:
    python veritasc.py <input.veritas> [-o output.rs]
    python veritasc.py <input.veritas> --run  # Compile and run (requires rustc)
"""

import argparse
import sys
import os
import tempfile
import subprocess
import shutil

from src.parser import Parser
from src.type_checker import TypeChecker
from src.ownership import OwnershipChecker
from src.codegen import CodeGenerator
from src.codegen.rust_backend import RustBackend
from src.error_reporter import ErrorReporter
from src.error_reporter.formatter import JSONErrorFormatter


def compile_veritas(source: str, filename: str = "<stdin>") -> tuple[bool, str, str]:
    """Compile Veritas source to Rust.
    
    Returns:
        Tuple of (success, rust_code_or_error, warnings)
    """
    # Parse
    parser = Parser(source, filename=filename)
    program = parser.parse()
    
    if parser.errors:
        error_reporter = ErrorReporter(source, filename)
        error_reporter.collect_parse_errors(parser.errors)
        return False, JSONErrorFormatter.format_text(error_reporter), ""
    
    # Type check (currently reports warnings for undefined builtins)
    type_checker = TypeChecker()
    type_success = type_checker.check_program(program)
    
    type_warnings = ""
    if not type_success:
        # Filter out builtin function errors for now
        real_errors = [e for e in type_checker.errors 
                      if "Undefined variable: println" not in e.message
                      and "Undefined variable: print" not in e.message]
        if real_errors:
            error_reporter = ErrorReporter(source, filename)
            error_reporter.collect_type_errors(real_errors)
            return False, JSONErrorFormatter.format_text(error_reporter), ""
    
    # Ownership check
    ownership_checker = OwnershipChecker()
    ownership_success = ownership_checker.check_program(program)
    
    if not ownership_success:
        error_reporter = ErrorReporter(source, filename)
        error_reporter.collect_ownership_errors(ownership_checker.errors)
        return False, JSONErrorFormatter.format_text(error_reporter), ""
    
    # Generate code
    codegen = CodeGenerator(type_checker)
    ir_module = codegen.generate_module(program)
    
    # Generate Rust
    rust_backend = RustBackend()
    rust_code = rust_backend.generate(ir_module)
    
    return True, rust_code, type_warnings


def main():
    parser = argparse.ArgumentParser(
        description="Veritas Compiler - Compiles Veritas to Rust"
    )
    parser.add_argument("input", help="Input Veritas source file")
    parser.add_argument("-o", "--output", help="Output file (default: stdout)")
    parser.add_argument("--run", action="store_true", 
                       help="Compile and run the program (requires rustc)")
    parser.add_argument("--emit-ir", action="store_true",
                       help="Print IR instead of Rust code")
    parser.add_argument("-v", "--verbose", action="store_true",
                       help="Verbose output")
    
    args = parser.parse_args()
    
    # Read input
    if args.input == "-":
        source = sys.stdin.read()
        filename = "<stdin>"
    else:
        if not os.path.exists(args.input):
            print(f"Error: File not found: {args.input}", file=sys.stderr)
            sys.exit(1)
        with open(args.input) as f:
            source = f.read()
        filename = args.input
    
    if args.verbose:
        print(f"Compiling {filename}...", file=sys.stderr)
    
    # Compile
    success, result, warnings = compile_veritas(source, filename)
    
    if not success:
        print(result, file=sys.stderr)
        sys.exit(1)
    
    rust_code = result
    
    # Output
    if args.run:
        if not shutil.which("rustc"):
            print("Error: rustc not found. Install Rust to use --run", file=sys.stderr)
            sys.exit(1)
        
        with tempfile.TemporaryDirectory() as tmpdir:
            rust_file = os.path.join(tmpdir, "main.rs")
            exe_file = os.path.join(tmpdir, "main")
            
            with open(rust_file, "w") as f:
                f.write(rust_code)
            
            # Compile with rustc
            result = subprocess.run(
                ["rustc", rust_file, "-o", exe_file],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                print("Rust compilation failed:", file=sys.stderr)
                print(result.stderr, file=sys.stderr)
                sys.exit(1)
            
            # Run
            result = subprocess.run([exe_file])
            sys.exit(result.returncode)
    
    elif args.output:
        with open(args.output, "w") as f:
            f.write(rust_code)
        if args.verbose:
            print(f"Wrote {args.output}", file=sys.stderr)
    else:
        print(rust_code)


if __name__ == "__main__":
    main()
