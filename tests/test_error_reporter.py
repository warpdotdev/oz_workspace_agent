"""Tests for error reporter functionality."""

import unittest
import json

from src.error_reporter import ErrorReporter, JSONErrorFormatter
from src.error_reporter.error_codes import E_SYNTAX_0002, E_OWN_0001, E_TYPE_0001
from src.parser.parser import Parser, ParseError
from src.span import Span, Position


class TestErrorReporter(unittest.TestCase):
    """Test error reporter functionality."""
    
    def test_syntax_error_collection(self):
        """Test collecting syntax errors from parser."""
        source = """fn main() {
    let x = 5
    print(x);
}"""
        
        reporter = ErrorReporter(source, "test.vts")
        
        # Create a parse error (missing semicolon)
        parse_err = ParseError(
            message="Expected semicolon after statement",
            span=Span(
                start=Position(line=2, column=14, offset=20),
                end=Position(line=2, column=14, offset=20),
                source="test.vts"
            )
        )
        
        reporter.collect_parse_errors([parse_err])
        
        self.assertEqual(reporter.error_count(), 1)
        self.assertEqual(reporter.warning_count(), 0)
        
        errors = reporter.get_errors()
        self.assertEqual(len(errors), 1)
        
        error = errors[0]
        self.assertEqual(error.category, "syntax")
        self.assertEqual(str(error.error_code), "E-SYNTAX-0002")
        self.assertEqual(error.location.start_line, 2)
        self.assertTrue(len(error.suggestions) > 0)
    
    def test_json_formatting(self):
        """Test JSON error formatting."""
        source = """fn test() {
    let x = 5
}"""
        
        reporter = ErrorReporter(source, "test.vts")
        
        parse_err = ParseError(
            message="Expected semicolon",
            span=Span(
                start=Position(line=2, column=14, offset=20),
                end=Position(line=2, column=14, offset=20),
                source="test.vts"
            )
        )
        
        reporter.collect_parse_errors([parse_err])
        
        # Format as JSON
        json_output = JSONErrorFormatter.format_report(
            reporter,
            success=False,
            total_lines=3,
            analysis_time_ms=10
        )
        
        # Parse JSON to verify structure
        data = json.loads(json_output)
        
        self.assertEqual(data["version"], "1.0")
        self.assertEqual(data["error_count"], 1)
        self.assertEqual(data["warning_count"], 0)
        self.assertFalse(data["compilation_result"]["success"])
        self.assertEqual(len(data["errors"]), 1)
        
        error = data["errors"][0]
        self.assertIn("error_id", error)
        self.assertIn("error_code", error)
        self.assertIn("location", error)
        self.assertIn("context", error)
        self.assertIn("suggestions", error)
        self.assertIn("documentation", error)
    
    def test_error_context_extraction(self):
        """Test error context extraction."""
        source = """fn main() {
    let x = 5;
    let y = x + 10
    println(y);
}"""
        
        reporter = ErrorReporter(source, "test.vts")
        
        parse_err = ParseError(
            message="Expected semicolon",
            span=Span(
                start=Position(line=3, column=19, offset=40),
                end=Position(line=3, column=19, offset=40),
                source="test.vts"
            )
        )
        
        reporter.collect_parse_errors([parse_err])
        
        errors = reporter.get_errors()
        error = errors[0]
        
        # Check context
        self.assertTrue(any("let x = 5;" in line for line in error.context.before_lines))
        self.assertEqual(error.context.error_line, "    let y = x + 10")
        self.assertTrue(any("println(y);" in line for line in error.context.after_lines))
    
    def test_text_formatting(self):
        """Test human-readable text formatting."""
        source = """fn test() {
    let x = 5
}"""
        
        reporter = ErrorReporter(source, "test.vts")
        
        parse_err = ParseError(
            message="Expected semicolon",
            span=Span(
                start=Position(line=2, column=14, offset=20),
                end=Position(line=2, column=14, offset=20),
                source="test.vts"
            )
        )
        
        reporter.collect_parse_errors([parse_err])
        
        text_output = JSONErrorFormatter.format_text(reporter)
        
        self.assertIn("Error 1:", text_output)
        self.assertIn("Expected semicolon", text_output)
        self.assertIn("test.vts:2:14", text_output)
        self.assertIn("ERROR HERE", text_output)
    
    def test_compact_json_formatting(self):
        """Test compact JSON formatting for logs."""
        source = "fn test() { let x = 5 }"
        
        reporter = ErrorReporter(source, "test.vts")
        
        parse_err = ParseError(
            message="Expected semicolon",
            span=Span(
                start=Position(line=1, column=22, offset=21),
                end=Position(line=1, column=22, offset=21),
                source="test.vts"
            )
        )
        
        reporter.collect_parse_errors([parse_err])
        
        compact_output = JSONErrorFormatter.format_compact(reporter, False)
        
        # Should be single line
        self.assertEqual(compact_output.count('\n'), 0)
        
        # Should be valid JSON
        data = json.loads(compact_output)
        self.assertEqual(data["error_count"], 1)
    
    def test_no_errors(self):
        """Test behavior with no errors."""
        source = "fn main() { }"
        
        reporter = ErrorReporter(source, "test.vts")
        
        self.assertFalse(reporter.has_errors())
        self.assertEqual(reporter.error_count(), 0)
        self.assertEqual(reporter.warning_count(), 0)
        
        text_output = JSONErrorFormatter.format_text(reporter)
        self.assertIn("No errors", text_output)
    
    def test_multiple_errors(self):
        """Test handling multiple errors."""
        source = """fn test() {
    let x = 5
    let y = 10
}"""
        
        reporter = ErrorReporter(source, "test.vts")
        
        err1 = ParseError(
            message="Expected semicolon",
            span=Span(
                start=Position(line=2, column=14, offset=20),
                end=Position(line=2, column=14, offset=20),
                source="test.vts"
            )
        )
        
        err2 = ParseError(
            message="Expected semicolon",
            span=Span(
                start=Position(line=3, column=15, offset=35),
                end=Position(line=3, column=15, offset=35),
                source="test.vts"
            )
        )
        
        reporter.collect_parse_errors([err1, err2])
        
        self.assertEqual(reporter.error_count(), 2)
        
        json_output = JSONErrorFormatter.format_report(reporter, False)
        data = json.loads(json_output)
        
        self.assertEqual(len(data["errors"]), 2)


if __name__ == '__main__':
    unittest.main()
