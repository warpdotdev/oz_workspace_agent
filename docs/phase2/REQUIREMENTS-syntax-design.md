# Phase 2 Stream 1: Syntax Design Requirements

## Overview
This document specifies the requirements for creating the Veritas programming language syntax design specification.

## Deliverables Required

### 1. Main Specification Document
**File**: `docs/phase2/syntax-specification.md`

**Must Include**:
- Formal grammar in EBNF (Extended Backus-Naur Form) notation
- Token definitions (keywords, operators, literals, identifiers)
- Language constructs:
  - Function declarations and signatures
  - Type declarations (structs, enums, type aliases)
  - Module system syntax
  - Import/export statements
  - Variable declarations (let, const)
  - Control flow (if, match, while, for)
  - Expression syntax
  - Pattern matching syntax
  - Comment syntax
- Syntax for ownership annotations (move, borrow, lifetime)
- Effect system syntax (Effect[IO], Effect[State<T>], etc.)
- Contract syntax (requires, ensures, invariant)

**Design Principles to Follow**:
- Token efficiency: Minimize tokens needed to express intent
- Self-documenting: Types and effects visible in signatures
- No implicit behaviors: Everything explicit
- Unambiguous: No operator overloading or hidden conversions
- Familiar enough: Leverage existing language training data where reasonable

### 2. Examples Document
**File**: `docs/phase2/syntax-examples.md`

**Must Include** (minimum 10 examples):
1. Hello World program
2. Function definitions with types and effects
3. Struct and enum declarations
4. Pattern matching
5. Ownership and borrowing examples
6. Error handling with Result<T, E>
7. Effect declarations and usage
8. Module organization
9. Web server example (showing async/IO effects)
10. Data processing pipeline (showing functional composition)

**For Each Example**:
- Full working code
- Line-by-line explanation
- Token count
- Comparison with Python/Rust/TypeScript equivalent

### 3. Token Efficiency Analysis
**Required Analysis**:
- Compare token counts for common patterns:
  - Function definition
  - Error handling
  - Data structure declaration
  - Module imports
- Show percentage difference vs Python, Rust, TypeScript
- Justify any extra tokens with safety/clarity benefits

### 4. Grammar Reference
**Required Sections**:
```
program ::= module_declaration* item*
item ::= function | struct | enum | type_alias | const
function ::= visibility? 'fn' identifier generic_params? params return_type? effect_list? block
... (complete grammar)
```

## Integration Requirements

### Must Work With Stream 2 (Type System)
- Syntax for type annotations
- Generic type parameters
- Branded type syntax (e.g., `type UserId = brand Int`)
- Lifetime annotations (e.g., `&'a T`)

### Must Work With Stream 3 (Error Messages)
- Syntax must be unambiguous enough for precise error locations
- Clear distinction between different constructs for error categorization
- Enough syntactic markers for helpful error suggestions

### Must Work With Stream 4 (Standard Library)
- Module path syntax
- Qualified imports
- Re-export syntax

## Acceptance Criteria

1. Grammar is complete and unambiguous
2. At least 10 working examples provided
3. Token efficiency analysis shows reasonable overhead (<50% more than Python)
4. Syntax supports all required type system features
5. Syntax supports effect system declarations
6. Examples compile (conceptually) without syntax errors
7. Comparison with existing languages included

## Research References

From Phase 1 research:
- TypeScript: Explicit types, 3x faster LLM convergence
- Rust: Ownership syntax, lifetime annotations
- Python: Familiar patterns, readability
- Mojo: Python-compatible with system types

## Timeline
This specification should take 4-6 hours for an experienced language designer.

## Questions to Answer

1. Should we use braces `{}` or indentation for blocks?
2. Semicolons required or optional?
3. Type annotation syntax: `: Type` or `Type variable`?
4. Effect syntax: `fn foo() -> Effect[IO] Result<T>` or `fn foo() Effect[IO] -> Result<T>`?
5. Explicit `move` keyword or implicit?
6. Pattern matching: `match` keyword or `case`/`when`?

## Success Metrics

- Specification enables Phase 3 (parser implementation)
- Examples are clear and cover common use cases
- Token counts competitive with existing languages
- Syntax is learnable from examples
- No ambiguous constructs
