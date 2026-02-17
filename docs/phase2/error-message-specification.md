# Veritas Error Message Format Specification
**Phase 2 - Stream 3: Error Messages & Compiler Feedback**
**Version:** 1.0  
**Author:** worker-3  
**Date:** 2026-02-17

## Overview

This document specifies the error message format for the Veritas programming language, optimized for LLM parsing and AI-assisted error correction. The design prioritizes structured, machine-readable output with actionable fix suggestions.

## Design Principles

1. **Machine-Readable First**: JSON format with consistent structure for LLM parsing
2. **Precise Location Information**: Exact file, line, column, and span information
3. **Actionable Suggestions**: Specific fix recommendations with before/after examples
4. **Error Code Taxonomy**: Hierarchical error codes for categorization
5. **Context-Aware**: Include relevant surrounding code and type information
6. **Deterministic**: Same error produces same structured output
7. **Severity Levels**: Clear distinction between errors, warnings, and hints

## Error Message JSON Schema

```json
{
  "version": "1.0",
  "error_count": 1,
  "warning_count": 0,
  "errors": [
    {
      "error_id": "string (unique identifier for this error instance)",
      "error_code": "string (hierarchical error code, e.g., E-TYPE-0042)",
      "severity": "enum: error | warning | hint",
      "message": "string (human-readable error message)",
      "explanation": "string (detailed explanation of why this is an error)",
      "category": "enum: type | syntax | ownership | effect | contract | import",
      
      "location": {
        "file": "string (absolute or relative file path)",
        "start_line": "integer (1-indexed)",
        "start_column": "integer (1-indexed)",
        "end_line": "integer (1-indexed)",
        "end_column": "integer (1-indexed)",
        "span_text": "string (exact text that triggered the error)"
      },
      
      "context": {
        "before_lines": ["string (2-3 lines before error)"],
        "error_line": "string (the line containing the error)",
        "after_lines": ["string (2-3 lines after error)"],
        "function_name": "string (optional: containing function)",
        "module_name": "string (optional: containing module)"
      },
      
      "type_information": {
        "expected_type": "string (optional: type that was expected)",
        "actual_type": "string (optional: type that was found)",
        "type_origin": "string (optional: where the type was inferred from)"
      },
      
      "suggestions": [
        {
          "suggestion_id": "string (unique identifier)",
          "description": "string (what this suggestion does)",
          "confidence": "enum: high | medium | low",
          "fix_type": "enum: replace | insert | delete | refactor",
          
          "diff": {
            "before": "string (code before fix)",
            "after": "string (code after fix)",
            "change_description": "string (explanation of the change)"
          },
          
          "automated_fix": {
            "applicable": "boolean (can this be auto-applied?)",
            "file": "string (file to modify)",
            "start_line": "integer",
            "start_column": "integer",
            "end_line": "integer",
            "end_column": "integer",
            "replacement_text": "string (exact text to insert)"
          }
        }
      ],
      
      "related_errors": [
        {
          "error_id": "string (ID of related error)",
          "relationship": "enum: caused_by | causes | similar_to",
          "description": "string (how this error relates)"
        }
      ],
      
      "documentation": {
        "error_code_url": "string (link to error code documentation)",
        "related_concepts": ["string (concepts to understand)"],
        "examples_url": "string (link to examples)"
      }
    }
  ],
  
  "compilation_result": {
    "success": false,
    "total_lines_analyzed": 150,
    "analysis_time_ms": 45,
    "next_steps": "string (what to do next)"
  }
}
```

## Error Code Taxonomy

Veritas uses hierarchical error codes with the format: `SEVERITY-CATEGORY-NUMBER`

### Severity Prefixes
- `E-` : Error (compilation will fail)
- `W-` : Warning (compilation succeeds but potential issue)
- `H-` : Hint (suggestion for improvement)

### Category Codes

#### TYPE (Type System Errors)
- `E-TYPE-0001` : Type mismatch
- `E-TYPE-0002` : Type annotation missing
- `E-TYPE-0003` : Type annotation conflicts with inferred type
- `E-TYPE-0004` : Unknown type name
- `E-TYPE-0005` : Type parameter count mismatch
- `E-TYPE-0006` : Trait bound not satisfied
- `E-TYPE-0007` : Recursive type without indirection
- `E-TYPE-0008` : Ambiguous type inference
- `E-TYPE-0009` : Incompatible types in operation
- `E-TYPE-0010` : Return type mismatch

#### SYNTAX (Syntax Errors)
- `E-SYNTAX-0001` : Unexpected token
- `E-SYNTAX-0002` : Missing semicolon
- `E-SYNTAX-0003` : Unclosed delimiter
- `E-SYNTAX-0004` : Invalid identifier
- `E-SYNTAX-0005` : Malformed expression
- `E-SYNTAX-0006` : Invalid declaration
- `E-SYNTAX-0007` : Unexpected end of file
- `E-SYNTAX-0008` : Invalid operator usage
- `E-SYNTAX-0009` : Misplaced keyword
- `E-SYNTAX-0010` : Invalid literal

#### OWN (Ownership & Memory Safety)
- `E-OWN-0001` : Use after move
- `E-OWN-0002` : Multiple mutable borrows
- `E-OWN-0003` : Immutable borrow with mutable borrow
- `E-OWN-0004` : Moved value used
- `E-OWN-0005` : Borrow outlives owner
- `E-OWN-0006` : Cannot move out of borrowed content
- `E-OWN-0007` : Partial move of value
- `E-OWN-0008` : Invalid lifetime annotation
- `E-OWN-0009` : Lifetime parameter mismatch
- `E-OWN-0010` : Dangling reference detected

#### EFFECT (Effect System Violations)
- `E-EFFECT-0001` : Side effect in pure function
- `E-EFFECT-0002` : Missing effect annotation
- `E-EFFECT-0003` : Effect annotation too broad
- `E-EFFECT-0004` : IO operation without IO effect
- `E-EFFECT-0005` : Async operation without Async effect
- `E-EFFECT-0006` : Unsafe operation without Unsafe effect
- `E-EFFECT-0007` : Effect propagation violation
- `E-EFFECT-0008` : Cannot call effectful function from pure context
- `E-EFFECT-0009` : Effect handler mismatch
- `E-EFFECT-0010` : Unhandled effect

#### CONTRACT (Contract & Assertion Violations)
- `E-CONTRACT-0001` : Precondition violation
- `E-CONTRACT-0002` : Postcondition violation
- `E-CONTRACT-0003` : Invariant violation
- `E-CONTRACT-0004` : Invalid contract expression
- `E-CONTRACT-0005` : Contract cannot be verified
- `E-CONTRACT-0006` : Assertion failed at compile time
- `E-CONTRACT-0007` : Loop invariant not maintained
- `E-CONTRACT-0008` : Variant not decreasing
- `E-CONTRACT-0009` : Specification too weak
- `E-CONTRACT-0010` : Specification inconsistent

#### IMPORT (Module & Import Errors)
- `E-IMPORT-0001` : Module not found
- `E-IMPORT-0002` : Circular import detected
- `E-IMPORT-0003` : Import name conflict
- `E-IMPORT-0004` : Private item accessed
- `E-IMPORT-0005` : Ambiguous import
- `E-IMPORT-0006` : Import path invalid
- `E-IMPORT-0007` : Re-export of private item
- `E-IMPORT-0008` : Module visibility violation
- `E-IMPORT-0009` : Deprecated module used
- `E-IMPORT-0010` : Version conflict

#### NAME (Name Resolution)
- `E-NAME-0001` : Undefined variable
- `E-NAME-0002` : Undefined function
- `E-NAME-0003` : Undefined type
- `E-NAME-0004` : Undefined module
- `E-NAME-0005` : Name already defined
- `E-NAME-0006` : Cannot shadow immutable binding
- `E-NAME-0007` : Ambiguous name
- `E-NAME-0008` : Name not in scope
- `E-NAME-0009` : Invalid self reference
- `E-NAME-0010` : Unused variable (W-NAME-0010 for warning)

#### PATTERN (Pattern Matching)
- `E-PATTERN-0001` : Non-exhaustive pattern
- `E-PATTERN-0002` : Unreachable pattern
- `E-PATTERN-0003` : Invalid pattern syntax
- `E-PATTERN-0004` : Pattern type mismatch
- `E-PATTERN-0005` : Binding inconsistency across patterns
- `E-PATTERN-0006` : Invalid guard expression
- `E-PATTERN-0007` : Duplicate binding in pattern
- `E-PATTERN-0008` : Cannot destructure non-product type
- `E-PATTERN-0009` : Or-pattern with different bindings
- `E-PATTERN-0010` : Pattern too complex to verify

## Example Error Messages

### Example 1: Type Mismatch

```json
{
  "version": "1.0",
  "error_count": 1,
  "warning_count": 0,
  "errors": [
    {
      "error_id": "err_1708128273_1",
      "error_code": "E-TYPE-0001",
      "severity": "error",
      "message": "Type mismatch: expected Int, found String",
      "explanation": "The function 'calculate_total' expects an argument of type Int, but a String value was provided. Veritas requires exact type matches and does not perform implicit type conversions.",
      "category": "type",
      
      "location": {
        "file": "src/main.vts",
        "start_line": 15,
        "start_column": 25,
        "end_line": 15,
        "end_column": 37,
        "span_text": "\"hello world\""
      },
      
      "context": {
        "before_lines": [
          "fn main() -> Effect[IO] {",
          "    let price: Int = 100;"
        ],
        "error_line": "    let total = calculate_total(\"hello world\");",
        "after_lines": [
          "    print_int(total);",
          "}"
        ],
        "function_name": "main",
        "module_name": "main"
      },
      
      "type_information": {
        "expected_type": "Int",
        "actual_type": "String",
        "type_origin": "Function signature at line 8: fn calculate_total(amount: Int) -> Int"
      },
      
      "suggestions": [
        {
          "suggestion_id": "sugg_1",
          "description": "Parse the string to an integer if it contains a numeric value",
          "confidence": "high",
          "fix_type": "replace",
          
          "diff": {
            "before": "let total = calculate_total(\"hello world\");",
            "after": "let total = calculate_total(parse_int(\"hello world\")?);",
            "change_description": "Wrap the string argument with parse_int() to convert it to Int. Note: parse_int returns Result[Int, ParseError] so you'll need to handle the potential error with '?' or explicit error handling."
          },
          
          "automated_fix": {
            "applicable": false,
            "file": null,
            "start_line": null,
            "start_column": null,
            "end_line": null,
            "end_column": null,
            "replacement_text": null
          }
        },
        {
          "suggestion_id": "sugg_2",
          "description": "If the string was a mistake, provide an integer literal instead",
          "confidence": "medium",
          "fix_type": "replace",
          
          "diff": {
            "before": "let total = calculate_total(\"hello world\");",
            "after": "let total = calculate_total(100);",
            "change_description": "Replace the string with an integer literal. Make sure this matches your intended value."
          },
          
          "automated_fix": {
            "applicable": false,
            "file": null,
            "start_line": null,
            "start_column": null,
            "end_line": null,
            "end_column": null,
            "replacement_text": null
          }
        },
        {
          "suggestion_id": "sugg_3",
          "description": "Change the function signature to accept String if that's the intended type",
          "confidence": "low",
          "fix_type": "refactor",
          
          "diff": {
            "before": "fn calculate_total(amount: Int) -> Int {",
            "after": "fn calculate_total(amount: String) -> Int {",
            "change_description": "Modify the function signature to accept String. You'll need to update the function body accordingly."
          },
          
          "automated_fix": {
            "applicable": false,
            "file": null,
            "start_line": null,
            "start_column": null,
            "end_line": null,
            "end_column": null,
            "replacement_text": null
          }
        }
      ],
      
      "related_errors": [],
      
      "documentation": {
        "error_code_url": "https://docs.veritas-lang.org/errors/E-TYPE-0001",
        "related_concepts": ["Type System", "Function Calls", "Type Conversion"],
        "examples_url": "https://docs.veritas-lang.org/examples/type-conversions"
      }
    }
  ],
  
  "compilation_result": {
    "success": false,
    "total_lines_analyzed": 150,
    "analysis_time_ms": 23,
    "next_steps": "Fix the type mismatch error at src/main.vts:15:25 and recompile"
  }
}
```

### Example 2: Ownership Violation

```json
{
  "version": "1.0",
  "error_count": 1,
  "warning_count": 0,
  "errors": [
    {
      "error_id": "err_1708128274_1",
      "error_code": "E-OWN-0001",
      "severity": "error",
      "message": "Use after move: value 'data' used after being moved",
      "explanation": "The variable 'data' was moved into the function 'process_data' at line 12. After a move, the original binding no longer owns the value and cannot be used. Veritas enforces strict ownership to prevent use-after-free bugs.",
      "category": "ownership",
      
      "location": {
        "file": "src/processor.vts",
        "start_line": 14,
        "start_column": 10,
        "end_line": 14,
        "end_column": 14,
        "span_text": "data"
      },
      
      "context": {
        "before_lines": [
          "fn handle_request(req: Request) -> Response {",
          "    let data: String = req.body;"
        ],
        "error_line": "    let result = process_data(move data);  // data moved here",
        "after_lines": [
          "    log_debug(data);  // ERROR: data used after move",
          "    return Response::ok(result);"
        ],
        "function_name": "handle_request",
        "module_name": "processor"
      },
      
      "type_information": {
        "expected_type": null,
        "actual_type": "String (moved)",
        "type_origin": "Moved at line 12"
      },
      
      "suggestions": [
        {
          "suggestion_id": "sugg_1",
          "description": "Clone the value before moving it, so you can use both the clone and original",
          "confidence": "high",
          "fix_type": "replace",
          
          "diff": {
            "before": "    let result = process_data(move data);\n    log_debug(data);",
            "after": "    let result = process_data(move data.clone());\n    log_debug(data);",
            "change_description": "Call .clone() on the value before moving it. This creates a copy that can be moved, while the original remains accessible."
          },
          
          "automated_fix": {
            "applicable": true,
            "file": "src/processor.vts",
            "start_line": 12,
            "start_column": 35,
            "end_line": 12,
            "end_column": 39,
            "replacement_text": "data.clone()"
          }
        },
        {
          "suggestion_id": "sugg_2",
          "description": "Use a reference instead of moving the value",
          "confidence": "high",
          "fix_type": "replace",
          
          "diff": {
            "before": "    let result = process_data(move data);",
            "after": "    let result = process_data(&data);",
            "change_description": "Pass a reference (&data) instead of moving the value. The function must accept a reference type (&String) for this to work."
          },
          
          "automated_fix": {
            "applicable": false,
            "file": null,
            "start_line": null,
            "start_column": null,
            "end_line": null,
            "end_column": null,
            "replacement_text": null
          }
        },
        {
          "suggestion_id": "sugg_3",
          "description": "Reorder operations to use the value before moving it",
          "confidence": "medium",
          "fix_type": "refactor",
          
          "diff": {
            "before": "    let result = process_data(move data);\n    log_debug(data);",
            "after": "    log_debug(data);\n    let result = process_data(move data);",
            "change_description": "Move the log_debug call before the move operation, so the value is still accessible."
          },
          
          "automated_fix": {
            "applicable": true,
            "file": "src/processor.vts",
            "start_line": 12,
            "start_column": 1,
            "end_line": 14,
            "end_column": 21,
            "replacement_text": "    log_debug(data);\n    let result = process_data(move data);"
          }
        }
      ],
      
      "related_errors": [],
      
      "documentation": {
        "error_code_url": "https://docs.veritas-lang.org/errors/E-OWN-0001",
        "related_concepts": ["Ownership", "Move Semantics", "Borrowing", "Clone"],
        "examples_url": "https://docs.veritas-lang.org/examples/ownership"
      }
    }
  ],
  
  "compilation_result": {
    "success": false,
    "total_lines_analyzed": 89,
    "analysis_time_ms": 31,
    "next_steps": "Fix the ownership error at src/processor.vts:14:10 by cloning the value, using a reference, or reordering operations"
  }
}
```

### Example 3: Effect System Violation

```json
{
  "version": "1.0",
  "error_count": 1,
  "warning_count": 0,
  "errors": [
    {
      "error_id": "err_1708128275_1",
      "error_code": "E-EFFECT-0001",
      "severity": "error",
      "message": "Side effect in pure function: IO operation 'print' not allowed in pure context",
      "explanation": "The function 'calculate_sum' is declared without an effect annotation, making it a pure function. Pure functions cannot perform side effects like IO operations. The 'print' function requires the IO effect.",
      "category": "effect",
      
      "location": {
        "file": "src/math.vts",
        "start_line": 8,
        "start_column": 5,
        "end_line": 8,
        "end_column": 33,
        "span_text": "print(\"Sum calculated\")"
      },
      
      "context": {
        "before_lines": [
          "// Calculate the sum of two integers",
          "fn calculate_sum(a: Int, b: Int) -> Int {"
        ],
        "error_line": "    print(\"Sum calculated\");  // ERROR: IO in pure function",
        "after_lines": [
          "    return a + b;",
          "}"
        ],
        "function_name": "calculate_sum",
        "module_name": "math"
      },
      
      "type_information": {
        "expected_type": "Pure context (no effects)",
        "actual_type": "Effect[IO] required by 'print'",
        "type_origin": "Function 'print' requires Effect[IO] (stdlib/io.vts:45)"
      },
      
      "suggestions": [
        {
          "suggestion_id": "sugg_1",
          "description": "Add IO effect to the function signature",
          "confidence": "high",
          "fix_type": "replace",
          
          "diff": {
            "before": "fn calculate_sum(a: Int, b: Int) -> Int {",
            "after": "fn calculate_sum(a: Int, b: Int) -> Effect[IO] Int {",
            "change_description": "Add 'Effect[IO]' to the return type signature to indicate that this function performs IO operations. Note: All callers must now handle the IO effect."
          },
          
          "automated_fix": {
            "applicable": true,
            "file": "src/math.vts",
            "start_line": 7,
            "start_column": 38,
            "end_line": 7,
            "end_column": 42,
            "replacement_text": "-> Effect[IO] Int"
          }
        },
        {
          "suggestion_id": "sugg_2",
          "description": "Remove the IO operation to keep the function pure",
          "confidence": "high",
          "fix_type": "delete",
          
          "diff": {
            "before": "fn calculate_sum(a: Int, b: Int) -> Int {\n    print(\"Sum calculated\");\n    return a + b;\n}",
            "after": "fn calculate_sum(a: Int, b: Int) -> Int {\n    return a + b;\n}",
            "change_description": "Remove the print statement to maintain function purity. Consider logging at a higher level in the call stack if needed."
          },
          
          "automated_fix": {
            "applicable": true,
            "file": "src/math.vts",
            "start_line": 8,
            "start_column": 1,
            "end_line": 8,
            "end_column": 34,
            "replacement_text": ""
          }
        },
        {
          "suggestion_id": "sugg_3",
          "description": "Split into pure and effectful functions",
          "confidence": "medium",
          "fix_type": "refactor",
          
          "diff": {
            "before": "fn calculate_sum(a: Int, b: Int) -> Int {\n    print(\"Sum calculated\");\n    return a + b;\n}",
            "after": "fn calculate_sum(a: Int, b: Int) -> Int {\n    return a + b;\n}\n\nfn calculate_sum_with_log(a: Int, b: Int) -> Effect[IO] Int {\n    print(\"Sum calculated\");\n    return calculate_sum(a, b);\n}",
            "change_description": "Keep the pure function separate and create a wrapper function that adds the IO effect. This maintains a pure core with effectful shell."
          },
          
          "automated_fix": {
            "applicable": false,
            "file": null,
            "start_line": null,
            "start_column": null,
            "end_line": null,
            "end_column": null,
            "replacement_text": null
          }
        }
      ],
      
      "related_errors": [],
      
      "documentation": {
        "error_code_url": "https://docs.veritas-lang.org/errors/E-EFFECT-0001",
        "related_concepts": ["Effect System", "Pure Functions", "IO Effect", "Effect Propagation"],
        "examples_url": "https://docs.veritas-lang.org/examples/effects"
      }
    }
  ],
  
  "compilation_result": {
    "success": false,
    "total_lines_analyzed": 56,
    "analysis_time_ms": 18,
    "next_steps": "Either add Effect[IO] to the function signature or remove the IO operation at src/math.vts:8:5"
  }
}
```

## Compiler Feedback Loop Specification

### Overview

The Veritas compiler implements a feedback loop system that enables AI agents to iteratively converge toward correct code through structured error messages and automated fix suggestions.

### Feedback Loop Architecture

```
┌─────────────────┐
│  Source Code    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Parser         │
│  (Syntax Check) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Type Checker   │
│  (Type Safety)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Ownership      │
│  Checker        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Effect Checker │
│  (Effect Track) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Contract       │
│  Verifier       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Error          │
│  Aggregator     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  JSON Formatter │
│  (Output)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  LLM / AI Agent │
│  (Parse & Fix)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Updated Source │
│  Code           │
└─────────────────┘
         │
         └──────────┐
                    │
         (Loop until success)
```

### Feedback Loop Modes

#### Mode 1: Single Error Focus
- Report only the first error encountered
- Provide maximum detail and context for that error
- Minimizes LLM confusion from multiple errors
- Best for: Initial debugging, complex errors

**Usage:**
```bash
veritas compile --error-mode=single src/main.vts
```

#### Mode 2: All Errors
- Report all errors found during compilation
- Prioritize by severity (errors > warnings > hints)
- Group related errors together
- Best for: Batch fixing, experienced AI agents

**Usage:**
```bash
veritas compile --error-mode=all src/main.vts
```

#### Mode 3: Category Focus
- Report errors from a specific category only
- Useful for focused iteration
- Best for: Type checking passes, ownership checking passes

**Usage:**
```bash
veritas compile --error-category=type src/main.vts
veritas compile --error-category=ownership src/main.vts
```

### Automated Fix Application

The compiler can apply suggested fixes automatically when they are marked as safe:

```bash
veritas fix --apply-safe src/main.vts
```

This will:
1. Compile the code
2. Identify errors with high-confidence automated fixes
3. Apply the fixes
4. Re-compile to verify
5. Report results

**Safety Criteria for Automated Fixes:**
- Fix must be marked `"applicable": true`
- Fix must have `"confidence": "high"`
- Fix must be a simple replacement (not a refactor)
- No cascading changes required

### Integration with AI Agents

#### Recommended Agent Workflow

```python
def fix_veritas_code(source_file: str) -> bool:
    """
    Iteratively fix Veritas code using compiler feedback.
    Returns True if compilation succeeds, False otherwise.
    """
    max_iterations = 10
    iteration = 0
    
    while iteration < max_iterations:
        # Compile and get structured errors
        result = subprocess.run(
            ['veritas', 'compile', '--json', source_file],
            capture_output=True,
            text=True
        )
        
        # Parse JSON output
        error_data = json.loads(result.stdout)
        
        # Check if compilation succeeded
        if error_data['compilation_result']['success']:
            return True
        
        # Extract first error
        if not error_data['errors']:
            # No errors but compilation failed (internal compiler error)
            return False
        
        error = error_data['errors'][0]
        
        # Get LLM to generate fix based on structured error
        fix = get_llm_fix(error)
        
        # Apply fix to source code
        apply_fix(source_file, fix)
        
        iteration += 1
    
    return False
```

#### LLM Prompt Template

```
You are fixing a Veritas compilation error. Here is the structured error information:

Error Code: {error_code}
Message: {message}
Explanation: {explanation}

Location: {file}:{start_line}:{start_column}

Context:
{context.before_lines}
> {context.error_line}  // <-- ERROR HERE
{context.after_lines}

Type Information:
- Expected: {type_information.expected_type}
- Actual: {type_information.actual_type}

Suggested Fixes:
{suggestions[0].description}
Before: {suggestions[0].diff.before}
After: {suggestions[0].diff.after}

Based on this information, generate the corrected code for line {start_line}.
Output only the fixed line, no explanation.
```

### Performance Considerations

- **Fast Compilation**: Target < 100ms for files under 1000 lines
- **Incremental Analysis**: Only re-check modified functions
- **Parallel Checking**: Run type checking and ownership checking in parallel when possible
- **Error Caching**: Cache error locations to avoid re-computation

### Output Format Selection

The compiler supports multiple output formats:

```bash
# JSON (default for AI agents)
veritas compile --format=json src/main.vts

# Human-readable text
veritas compile --format=text src/main.vts

# Compact single-line JSON (for logs)
veritas compile --format=json-compact src/main.vts

# IDE-compatible format (LSP)
veritas compile --format=lsp src/main.vts
```

## Comparison with Existing Compilers

### Rust Compiler (rustc)
**Strengths:**
- Excellent error messages with suggestions
- Shows expected vs actual types
- Provides example code

**Limitations for AI:**
- Text-based output (not machine-readable)
- Error location in text format
- No structured suggestion format
- Multiple output styles inconsistent

**Veritas Improvements:**
- JSON-first format
- Consistent structure across all errors
- Explicit automated fix support
- Confidence levels on suggestions

### TypeScript Compiler (tsc)
**Strengths:**
- Fast compilation
- Clear type mismatch messages
- IDE integration

**Limitations for AI:**
- Text-based output
- Limited context in errors
- No fix suggestions built-in
- Difficult to parse programmatically

**Veritas Improvements:**
- Rich context with surrounding lines
- Multiple ranked suggestions
- Machine-readable error codes
- Better error grouping

### Python Type Checkers (mypy/pyright)
**Strengths:**
- Good for gradual typing
- Integrates with existing Python code

**Limitations for AI:**
- Type errors only (no ownership, effects)
- Limited compile-time verification
- Inconsistent error formats across tools
- No automated fix suggestions

**Veritas Improvements:**
- Comprehensive error categories
- Ownership and effect checking
- Unified error format
- Built-in verification support

## Future Enhancements

### Phase 3 Additions

1. **Error Pattern Recognition**: Identify common error patterns and provide specialized messages
2. **Multi-Error Fix Suggestions**: Suggest fixes that address multiple related errors at once
3. **Learning from Fixes**: Track which suggestions are accepted to improve confidence scores
4. **Visual Diff Output**: Generate visual diffs for complex refactoring suggestions
5. **Error Explain Mode**: Detailed tutorial-style explanations for complex errors
6. **Fix Preview**: Show what the entire file would look like after applying a fix
7. **Batch Fix Mode**: Apply multiple fixes in one pass with rollback support

### Long-term Vision

- **AI-Powered Error Messages**: Use ML to improve error messages based on successful fixes
- **Context-Aware Suggestions**: Leverage codebase-wide patterns to improve suggestions
- **Interactive Fix Mode**: CLI tool that steps through errors with the developer
- **Error Analytics**: Track common errors across projects to improve language design

## Conclusion

The Veritas error message format is designed specifically for AI agent consumption and automated error correction. By providing structured, machine-readable errors with actionable suggestions, we enable tight feedback loops that help AI agents converge quickly toward correct code.

**Key Innovations:**
1. JSON-first format for reliable parsing
2. Hierarchical error codes for categorization
3. Multiple ranked suggestions with confidence levels
4. Automated fix support with safety guarantees
5. Rich context and type information
6. Precise source location tracking
7. Related error grouping

This specification provides the foundation for Phase 3 compiler implementation.
