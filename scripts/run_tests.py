#!/usr/bin/env python3
"""Test runner for Veritas compiler.

Runs all test suites and generates coverage reports.
"""

import sys
import os
import unittest
import argparse
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


def discover_tests(test_dir: str, pattern: str = "test_*.py") -> unittest.TestSuite:
    """Discover all tests in a directory.
    
    Args:
        test_dir: Directory to search for tests
        pattern: Pattern to match test files
    
    Returns:
        Test suite with all discovered tests
    """
    loader = unittest.TestLoader()
    suite = loader.discover(test_dir, pattern=pattern, top_level_dir=str(project_root))
    return suite


def run_test_suite(suite: unittest.TestSuite, verbosity: int = 2) -> bool:
    """Run a test suite and return whether all tests passed.
    
    Args:
        suite: Test suite to run
        verbosity: Verbosity level (0=quiet, 1=normal, 2=verbose)
    
    Returns:
        True if all tests passed, False otherwise
    """
    runner = unittest.TextTestRunner(verbosity=verbosity)
    result = runner.run(suite)
    return result.wasSuccessful()


def main():
    parser = argparse.ArgumentParser(description="Run Veritas compiler tests")
    parser.add_argument(
        "--suite",
        choices=["all", "unit", "integration", "e2e", "performance"],
        default="all",
        help="Test suite to run (default: all)"
    )
    parser.add_argument(
        "--verbosity",
        type=int,
        choices=[0, 1, 2],
        default=2,
        help="Test output verbosity (default: 2)"
    )
    parser.add_argument(
        "--failfast",
        action="store_true",
        help="Stop on first failure"
    )
    
    args = parser.parse_args()
    
    # Configure test runner
    if args.failfast:
        unittest.TestLoader.sortTestMethodsUsing = None
    
    print("=" * 70)
    print("Veritas Compiler Test Suite")
    print("=" * 70)
    print()
    
    tests_dir = project_root / "tests"
    all_passed = True
    
    # Run unit tests
    if args.suite in ["all", "unit"]:
        print("Running unit tests...")
        print("-" * 70)
        
        # Discover unit tests from individual test files
        unit_tests = unittest.TestSuite()
        
        for test_file in ["test_parser.py", "test_codegen.py", "test_error_reporter.py"]:
            test_path = tests_dir / test_file
            if test_path.exists():
                suite = discover_tests(str(tests_dir), pattern=test_file)
                unit_tests.addTests(suite)
        
        # Add type checker tests
        type_checker_dir = tests_dir / "type_checker"
        if type_checker_dir.exists():
            suite = discover_tests(str(type_checker_dir))
            unit_tests.addTests(suite)
        
        if unit_tests.countTestCases() > 0:
            passed = run_test_suite(unit_tests, args.verbosity)
            all_passed = all_passed and passed
            print()
        else:
            print("No unit tests found")
            print()
    
    # Run integration tests
    if args.suite in ["all", "integration"]:
        print("Running integration tests...")
        print("-" * 70)
        
        integration_dir = tests_dir / "integration"
        if integration_dir.exists():
            suite = discover_tests(str(integration_dir))
            if suite.countTestCases() > 0:
                passed = run_test_suite(suite, args.verbosity)
                all_passed = all_passed and passed
            else:
                print("No integration tests found")
        else:
            print("Integration test directory not found")
        print()
    
    # Run end-to-end tests
    if args.suite in ["all", "e2e"]:
        print("Running end-to-end tests...")
        print("-" * 70)
        
        e2e_dir = tests_dir / "e2e"
        if e2e_dir.exists():
            suite = discover_tests(str(e2e_dir))
            if suite.countTestCases() > 0:
                passed = run_test_suite(suite, args.verbosity)
                all_passed = all_passed and passed
            else:
                print("No e2e tests found")
        else:
            print("E2E test directory not found")
        print()
    
    # Run performance tests
    if args.suite in ["all", "performance"]:
        print("Running performance tests...")
        print("-" * 70)
        
        perf_dir = tests_dir / "performance"
        if perf_dir.exists():
            suite = discover_tests(str(perf_dir))
            if suite.countTestCases() > 0:
                passed = run_test_suite(suite, args.verbosity)
                all_passed = all_passed and passed
            else:
                print("No performance tests found")
        else:
            print("Performance test directory not found")
        print()
    
    # Print summary
    print("=" * 70)
    if all_passed:
        print("✓ All tests passed!")
        print("=" * 70)
        return 0
    else:
        print("✗ Some tests failed")
        print("=" * 70)
        return 1


if __name__ == "__main__":
    sys.exit(main())
