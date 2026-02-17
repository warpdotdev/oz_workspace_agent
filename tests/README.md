# Veritas Compiler Test Suite

Comprehensive testing framework for the Veritas programming language compiler.

## Test Structure

```
tests/
├── __init__.py                    # Test package init
├── README.md                      # This file
├── examples/                      # Example Veritas programs
│   ├── 01_hello_world.veritas
│   ├── 02_simple_function.veritas
│   ├── 03_branded_types.veritas
│   └── 04_pattern_matching.veritas
├── e2e/                          # End-to-end tests
│   ├── __init__.py
│   └── test_end_to_end.py
├── integration/                  # Integration tests
│   ├── __init__.py
│   └── test_pipeline.py
├── performance/                  # Performance tests
│   ├── __init__.py
│   └── test_performance.py
└── type_checker/                 # Type checker unit tests
    ├── __init__.py
    ├── test_basic.py
    └── test_ownership.py
```

## Running Tests

### Run All Tests

```bash
python3 scripts/run_tests.py
```

### Run Specific Test Suite

```bash
# Unit tests only
python3 scripts/run_tests.py --suite unit

# Integration tests only
python3 scripts/run_tests.py --suite integration

# End-to-end tests only
python3 scripts/run_tests.py --suite e2e

# Performance tests only
python3 scripts/run_tests.py --suite performance
```

### Run with Different Verbosity

```bash
# Quiet mode
python3 scripts/run_tests.py --verbosity 0

# Normal mode
python3 scripts/run_tests.py --verbosity 1

# Verbose mode (default)
python3 scripts/run_tests.py --verbosity 2
```

### Run Individual Test Files

```bash
# Run specific test file
python3 -m unittest tests.e2e.test_end_to_end

# Run specific test class
python3 -m unittest tests.e2e.test_end_to_end.EndToEndTest

# Run specific test method
python3 -m unittest tests.e2e.test_end_to_end.EndToEndTest.test_hello_world
```

## Test Categories

### Unit Tests

Individual component tests for:
- Lexer (`test_lexer.py`)
- Parser (`test_parser.py`)
- Type Checker (`type_checker/test_basic.py`, `type_checker/test_ownership.py`)
- Code Generator (`test_codegen.py`)
- Error Reporter (`test_error_reporter.py`)

Run with: `python3 scripts/run_tests.py --suite unit`

### Integration Tests

Tests for interactions between compiler stages:
- Lexer → Parser
- Parser → Type Checker
- Type Checker → Code Generator
- Code Generator → Rust Backend
- Full pipeline integration

Run with: `python3 scripts/run_tests.py --suite integration`

### End-to-End Tests

Complete compilation pipeline tests:
1. Parse Veritas source code
2. Type check the AST
3. Perform ownership checking
4. Generate IR
5. Generate Rust code
6. Compile Rust code with `rustc`
7. Run the executable
8. Verify output

Tests all example programs from Phase 2 specification.

Run with: `python3 scripts/run_tests.py --suite e2e`

**Note:** E2E tests require `rustc` to be installed.

### Performance Tests

Benchmark compiler performance:
- Compilation time for different program sizes
- Memory usage estimation
- Parsing performance
- Type checking performance
- Code generation performance

Run with: `python3 scripts/run_tests.py --suite performance`

## Test Coverage

### Language Features Tested

- ✓ Basic functions
- ✓ Branded types (UserId, OrderId, etc.)
- ✓ Pattern matching
- ✓ Effect system (!IO, !Async, !State, !Error)
- ✓ Ownership and borrowing
- ✓ Type inference
- ✓ Error handling (Result<T, E>)
- ✓ Structs and enums
- ✓ Generic types

### Compiler Stages Tested

- ✓ Lexical analysis (tokenization)
- ✓ Parsing (AST generation)
- ✓ Type checking (Hindley-Milner inference)
- ✓ Ownership checking (borrow checker)
- ✓ IR generation
- ✓ Rust code generation
- ✓ Error reporting (JSON format)

## Adding New Tests

### Adding Example Programs

1. Create `.veritas` file in `tests/examples/`
2. Add corresponding test method in `tests/e2e/test_end_to_end.py`

### Adding Unit Tests

1. Add test methods to existing test files or create new ones
2. Follow naming convention: `test_*.py`
3. Use `unittest.TestCase` base class

### Adding Integration Tests

1. Add test methods to `tests/integration/test_pipeline.py`
2. Test interactions between multiple components

### Adding Performance Tests

1. Add benchmark methods to `tests/performance/test_performance.py`
2. Use `measure_compilation_time()` helper for timing

## Continuous Integration

### CI Configuration (Future)

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      - run: python3 scripts/run_tests.py
```

## Test Requirements

### Python Dependencies

- Python 3.8+
- unittest (standard library)
- pathlib (standard library)

### External Dependencies

- `rustc` (for E2E tests only)
- Rust standard library

### Installing Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## Test Metrics

### Current Test Coverage

- **Unit Tests:** 32 tests across 5 modules
- **Integration Tests:** 9 tests for pipeline integration
- **End-to-End Tests:** 6 tests for complete compilation
- **Performance Tests:** 6 benchmark tests

**Total:** 53+ tests

### Expected Results

All tests should pass with:
- No parse errors
- No type errors
- No ownership errors
- Successful Rust code generation
- Valid Rust compilation (for E2E tests)

## Troubleshooting

### E2E Tests Fail with "rustc not found"

Install Rust toolchain:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Import Errors

Make sure you're running from project root:
```bash
cd /path/to/oz_workspace_agent
python3 scripts/run_tests.py
```

### Tests Timeout

Increase timeout in E2E tests if compiling on slow machine:
```python
# In test_end_to_end.py
run_result = subprocess.run([executable], timeout=10)  # Increase from 5
```

## Best Practices

1. **Keep tests isolated:** Each test should be independent
2. **Use descriptive names:** Test names should describe what they test
3. **Test both success and failure:** Test valid code AND invalid code
4. **Clean up resources:** Use setUp() and tearDown() for cleanup
5. **Document expected behavior:** Add comments explaining complex tests

## Contributing

When adding new language features:

1. Add example program to `tests/examples/`
2. Add unit tests for new compiler components
3. Add integration tests if feature spans multiple stages
4. Add E2E test to verify complete compilation
5. Update this README

## License

Same as Veritas compiler project.
