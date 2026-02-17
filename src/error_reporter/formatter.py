"""JSON formatter for Veritas compiler errors.

Formats structured errors as JSON according to the error message specification.
"""

import json
from typing import Dict, Any, List
from dataclasses import asdict

from .reporter import StructuredError, ErrorReporter
from .suggestion import Suggestion, FixConfidence, FixType


class JSONErrorFormatter:
    """Formats structured errors as JSON for AI agent consumption."""
    
    VERSION = "1.0"
    
    @staticmethod
    def format_error(error: StructuredError) -> Dict[str, Any]:
        """Format a single structured error as a JSON object."""
        return {
            "error_id": error.error_id,
            "error_code": str(error.error_code),
            "severity": error.severity,
            "message": error.message,
            "explanation": error.explanation,
            "category": error.category,
            
            "location": {
                "file": error.location.file,
                "start_line": error.location.start_line,
                "start_column": error.location.start_column,
                "end_line": error.location.end_line,
                "end_column": error.location.end_column,
                "span_text": error.location.span_text
            },
            
            "context": {
                "before_lines": error.context.before_lines,
                "error_line": error.context.error_line,
                "after_lines": error.context.after_lines,
                "function_name": error.context.function_name,
                "module_name": error.context.module_name
            },
            
            "type_information": {
                "expected_type": error.type_information.expected_type,
                "actual_type": error.type_information.actual_type,
                "type_origin": error.type_information.type_origin
            },
            
            "suggestions": [
                JSONErrorFormatter._format_suggestion(sugg)
                for sugg in error.suggestions
            ],
            
            "related_errors": [
                {
                    "error_id": rel.error_id,
                    "relationship": rel.relationship,
                    "description": rel.description
                }
                for rel in error.related_errors
            ],
            
            "documentation": {
                "error_code_url": error.documentation.error_code_url,
                "related_concepts": error.documentation.related_concepts,
                "examples_url": error.documentation.examples_url
            }
        }
    
    @staticmethod
    def _format_suggestion(suggestion: Suggestion) -> Dict[str, Any]:
        """Format a suggestion as a JSON object."""
        return {
            "suggestion_id": suggestion.suggestion_id,
            "description": suggestion.description,
            "confidence": suggestion.confidence.value,
            "fix_type": suggestion.fix_type.value,
            
            "diff": {
                "before": suggestion.diff.before,
                "after": suggestion.diff.after,
                "change_description": suggestion.diff.change_description
            },
            
            "automated_fix": {
                "applicable": suggestion.automated_fix.applicable,
                "file": suggestion.automated_fix.file,
                "start_line": suggestion.automated_fix.start_line,
                "start_column": suggestion.automated_fix.start_column,
                "end_line": suggestion.automated_fix.end_line,
                "end_column": suggestion.automated_fix.end_column,
                "replacement_text": suggestion.automated_fix.replacement_text
            }
        }
    
    @staticmethod
    def format_report(
        reporter: ErrorReporter,
        success: bool,
        total_lines: int = 0,
        analysis_time_ms: int = 0
    ) -> str:
        """Format a complete compilation report as JSON."""
        errors = reporter.get_errors()
        
        # Build complete JSON structure
        report = {
            "version": JSONErrorFormatter.VERSION,
            "error_count": reporter.error_count(),
            "warning_count": reporter.warning_count(),
            "errors": [
                JSONErrorFormatter.format_error(err)
                for err in errors
            ],
            "compilation_result": {
                "success": success,
                "total_lines_analyzed": total_lines,
                "analysis_time_ms": analysis_time_ms,
                "next_steps": JSONErrorFormatter._generate_next_steps(errors)
            }
        }
        
        # Pretty-print JSON for readability
        return json.dumps(report, indent=2)
    
    @staticmethod
    def _generate_next_steps(errors: List[StructuredError]) -> str:
        """Generate next steps guidance based on errors."""
        if not errors:
            return "Compilation successful! No errors to fix."
        
        # Focus on first error
        first_error = errors[0]
        location = f"{first_error.location.file}:{first_error.location.start_line}:{first_error.location.start_column}"
        
        if first_error.suggestions:
            first_suggestion = first_error.suggestions[0]
            return f"Fix the {first_error.category} error at {location}. Suggestion: {first_suggestion.description}"
        else:
            return f"Fix the {first_error.category} error at {location} and recompile"
    
    @staticmethod
    def format_compact(reporter: ErrorReporter, success: bool) -> str:
        """Format as compact single-line JSON (for logs)."""
        errors = reporter.get_errors()
        
        report = {
            "version": JSONErrorFormatter.VERSION,
            "error_count": reporter.error_count(),
            "warning_count": reporter.warning_count(),
            "success": success,
            "errors": [
                {
                    "id": err.error_id,
                    "code": str(err.error_code),
                    "message": err.message,
                    "location": f"{err.location.file}:{err.location.start_line}:{err.location.start_column}"
                }
                for err in errors
            ]
        }
        
        return json.dumps(report, separators=(',', ':'))
    
    @staticmethod
    def format_text(reporter: ErrorReporter) -> str:
        """Format as human-readable text (for console output)."""
        errors = reporter.get_errors()
        
        if not errors:
            return "✓ No errors found"
        
        lines = []
        lines.append(f"Found {reporter.error_count()} error(s) and {reporter.warning_count()} warning(s)")
        lines.append("")
        
        for i, err in enumerate(errors, 1):
            lines.append(f"Error {i}: {err.message}")
            lines.append(f"  --> {err.location.file}:{err.location.start_line}:{err.location.start_column}")
            lines.append(f"  Code: {err.error_code}")
            lines.append("")
            
            # Show context
            lines.append("  Context:")
            for line in err.context.before_lines:
                lines.append(f"    {line}")
            lines.append(f"  > {err.context.error_line}  <-- ERROR HERE")
            for line in err.context.after_lines:
                lines.append(f"    {line}")
            lines.append("")
            
            # Show suggestions
            if err.suggestions:
                lines.append("  Suggestions:")
                for sugg in err.suggestions:
                    lines.append(f"    - {sugg.description} (confidence: {sugg.confidence.value})")
                lines.append("")
        
        return "\n".join(lines)
