#!/usr/bin/env python3
"""Test the hello world compilation."""

from src.parser import Parser
from src.type_checker import TypeChecker
from src.ownership import OwnershipChecker
from src.codegen import CodeGenerator
from src.codegen.rust_backend import RustBackend

with open('tests/examples/01_hello_world.veritas') as f:
    source = f.read()

print("Source:", repr(source))
print()

# Parse
parser = Parser(source, filename='hello.veritas')
program = parser.parse()
print('1. Parse errors:', parser.errors)
print()

if program and program.items:
    fn = program.items[0]
    print('Function body statements:', fn.body.statements)
    print()

# Type check
type_checker = TypeChecker()
success = type_checker.check_program(program)
print('2. Type check:', 'OK' if success else type_checker.errors)
print()

# Ownership check
ownership_checker = OwnershipChecker()
success = ownership_checker.check_program(program)
print('3. Ownership check:', 'OK' if success else ownership_checker.errors)
print()

# Code gen
codegen = CodeGenerator(type_checker)
ir_module = codegen.generate_module(program)

# Debug IR
for name, func in ir_module.functions.items():
    print(f'IR Function: {name}')
    for block_label, block in func.blocks.items():
        print(f'  Block {block_label}:')
        for instr in block.instructions:
            print(f'    {instr.opcode}: operands={instr.operands}, result={instr.result}, func={getattr(instr, "function_name", None)}')
print()

# Rust backend
rust_backend = RustBackend()
rust_code = rust_backend.generate(ir_module)
print('Generated Rust code:')
print(rust_code)

# Write to file and optionally compile
import tempfile
import subprocess
import os
import shutil

print()
print('--- Compiling and running ---')

if shutil.which('rustc'):
    with tempfile.TemporaryDirectory() as tmpdir:
        rust_file = os.path.join(tmpdir, 'main.rs')
        exe_file = os.path.join(tmpdir, 'main')
        
        with open(rust_file, 'w') as f:
            f.write(rust_code)
        
        # Compile
        result = subprocess.run(['rustc', rust_file, '-o', exe_file], capture_output=True, text=True)
        if result.returncode != 0:
            print('Compilation FAILED:')
            print(result.stderr)
        else:
            print('Compilation OK')
            # Run
            result = subprocess.run([exe_file], capture_output=True, text=True)
            print('Output:', repr(result.stdout))
            print('Exit code:', result.returncode)
else:
    print('rustc not found - skipping actual compilation')
    print()
    print('Generated code appears valid (manual inspection):')  
    # Basic syntax check - count braces
    open_braces = rust_code.count('{')
    close_braces = rust_code.count('}')
    open_parens = rust_code.count('(')
    close_parens = rust_code.count(')')
    print(f'  Braces balanced: {open_braces == close_braces} ({open_braces}/{close_braces})')
    print(f'  Parens balanced: {open_parens == close_parens} ({open_parens}/{close_parens})')
    print(f'  Has main: {"fn main()" in rust_code}')
    print(f'  Has println!: {"println!" in rust_code}')
