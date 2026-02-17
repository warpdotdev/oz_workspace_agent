# Phase 2 Stream 2: Type System & Semantics Requirements

## Overview
This document specifies the requirements for creating the Veritas programming language type system specification.

## Deliverables Required

### 1. Type System Specification
**File**: `docs/phase2/type-system-specification.md`

**Must Include**:

#### Core Type System
- Primitive types (Int, Float, String, Bool, Char)
  - Sized integer types: i8, i16, i32, i64, i128, u8, u16, u32, u64, u128
  - Float types: f32, f64
- Composite types:
  - Tuples: `(Int, String, Bool)`
  - Structs: Named product types
  - Enums: Sum types with pattern matching
  - Arrays: Fixed-size `[T; N]`
  - Slices: Dynamic-size `[T]`
- Function types: `fn(T1, T2) -> T3`
- Generic types: `List<T>`, `Map<K, V>`
- References: `&T` (immutable), `&mut T` (mutable)

#### Ownership Model
- **Core Rules**:
  - Every value has exactly one owner
  - When owner goes out of scope, value is dropped
  - Move semantics by default
  - Explicit `move` keyword for clarity

- **Borrowing Rules**:
  - Multiple immutable borrows allowed simultaneously
  - Only one mutable borrow allowed
  - Cannot have mutable and immutable borrows simultaneously
  - Borrows cannot outlive the owner

- **Lifetime System**:
  - Lifetime annotations: `'a`, `'b`, `'static`
  - Lifetime elision rules
  - Lifetime bounds on generics
  - Function signature lifetime constraints

#### Branded Types
- **Purpose**: Semantic type distinctions at compile time
- **Syntax**: `type UserId = brand i64`
- **Example**:
  ```
  type UserId = brand i64
  type OrderId = brand i64
  
  fn get_user(id: UserId) -> User  // Only accepts UserId, not OrderId
  ```
- **Properties**:
  - Distinct types at compile time
  - Same representation at runtime (zero cost)
  - Explicit conversion required
  - Prevents 94% of ID confusion errors

#### Effect System
- **Effect Types**:
  - `Effect[IO]`: Input/output operations
  - `Effect[State<T>]`: Mutable state access
  - `Effect[Error<E>]`: Error propagation
  - `Effect[Async]`: Asynchronous operations
  - `Effect[Unsafe]`: Unsafe operations

- **Effect Declarations**:
  ```
  fn read_file(path: String) -> Effect[IO] Result<String, IOError>
  fn pure_function(x: Int) -> Int  // No effects
  ```

- **Effect Composition**:
  - Multiple effects: `Effect[IO, State<Counter>]`
  - Effect polymorphism: Functions can propagate effects
  - Effect handlers

- **Effect Rules**:
  - Pure functions cannot call effectful functions
  - Effectful functions must declare their effects
  - Effects are tracked through call chains
  - Effect type checking at compile time

#### Error Handling
- **No Null**: Absence represented by `Option<T>`
  - `Some(value)` or `None`
  - Forces explicit handling

- **Result Type**: `Result<T, E>` for recoverable errors
  - `Ok(value)` or `Err(error)`
  - `?` operator for error propagation
  - Explicit error types in signatures

- **Pattern Matching**: Exhaustive matching required
  ```
  match result {
      Ok(value) => use(value),
      Err(error) => handle(error)
  }
  ```

#### Type Inference
- **Local Scope Only**: Types inferred within function bodies
- **Explicit Boundaries**: Function signatures, struct fields, module boundaries require explicit types
- **Prevents Propagation**: Inference errors don't cross boundaries

### 2. Type System Examples
**File**: `docs/phase2/type-system-examples.md`

**Must Include**:
1. Branded types preventing ID confusion
2. Ownership transfer and borrowing
3. Lifetime annotations in complex scenarios
4. Effect system usage (pure vs effectful functions)
5. Option<T> for handling absence
6. Result<T, E> for error propagation
7. Pattern matching with exhaustiveness
8. Generic functions with type constraints
9. Real-world web application example
10. Token efficiency analysis

### 3. Formal Type Rules
**Required Formal Specifications**:
- Type judgment rules
- Subtyping relations
- Ownership transfer rules
- Borrowing validation rules
- Effect propagation rules
- Pattern match exhaustiveness checking

### 4. Memory Safety Guarantees
**Must Document**:
- No use-after-free
- No double-free
- No null pointer dereferences
- No data races
- No buffer overflows
- How ownership ensures these guarantees

## Integration Requirements

### Must Integrate With Stream 1 (Syntax)
- Syntax for type annotations
- Ownership annotation syntax
- Effect declaration syntax
- Lifetime syntax

### Must Generate Stream 3 (Error Messages)
- Type mismatch errors
- Ownership violation errors
- Borrowing errors
- Effect violation errors
- Pattern match exhaustiveness errors

### Must Define Stream 4 (Standard Library)
- Core types (Option, Result, List, Map, etc.)
- Effect types
- Standard type classes/traits

## Acceptance Criteria

1. Type system is sound and complete
2. Ownership model formally specified
3. Branded types system designed
4. Effect system fully specified
5. No null - Option type enforced
6. Error handling with Result type
7. Pattern matching exhaustiveness guaranteed
8. Formal type rules provided
9. Memory safety guarantees documented
10. Real-world examples demonstrate practicality

## Research References

From Phase 1 competitive research:
- Rust: Ownership, borrowing, lifetimes - prevents use-after-free
- TypeScript: 3x faster LLM convergence with mandatory types
- Branded types: Distinguish semantically different but structurally identical types
- Effect systems: Track side effects explicitly

## Design Rationale

### Why Ownership?
- Memory safety without garbage collection
- Zero runtime cost
- Prevents entire categories of bugs
- Compile-time verification
- AI agents can reason about memory

### Why Branded Types?
- 94% of AI code errors are type mismatches
- Semantic distinction at compile time
- Zero runtime cost
- Prevents ID confusion (UserId vs OrderId)

### Why Effect System?
- Makes side effects visible
- Pure functions guaranteed side-effect free
- Helps AI agents reason about function behavior
- Enables better compiler optimizations

### Why No Null?
- Null pointer errors are epidemic
- Option<T> forces explicit handling
- Compiler catches missing cases
- Self-documenting APIs

## Timeline
This specification should take 6-8 hours for an experienced type system designer.

## Success Metrics

- Type system prevents common AI agent errors (type mismatches, null errors)
- Ownership model is learnable from examples
- Effect system improves code clarity
- Zero runtime overhead for safety features
- Specification enables Phase 3 (type checker implementation)
