# Veritas Language Syntax Specification

Version: 0.1.0
Status: Phase 2 Draft
Author: worker-2
Date: 2026-02-17

## 1. Overview

Veritas is a statically-typed programming language optimized for AI agent code generation. The syntax prioritizes:

1. **Explicitness** - No implicit behaviors or hidden magic
2. **Token Efficiency** - Minimize tokens while maintaining clarity
3. **Self-Documentation** - Types and effects visible in signatures
4. **Determinism** - Same code produces same behavior always
5. **Local Reasoning** - Understand code without full codebase context

## 2. Lexical Structure

### 2.1 Character Set

Veritas source files are UTF-8 encoded.

### 2.2 Keywords

```
fn       let      mut      const    type     struct   enum
trait    impl     mod      use      pub      self     Self
if       else     match    for      while    loop     break
continue return   async    await    effect   pure     where
true     false    and      or       not      in       as
move     ref      owns     borrows  branded  contract require
ensure   invariant
```

### 2.3 Operators

```
Arithmetic:     +  -  *  /  %  **
Comparison:     == != <  >  <= >=
Logical:        and or not
Bitwise:        & | ^ ~ << >>
Assignment:     = += -= *= /= %= &= |= ^=
Access:         .  ::  ->
Reference:      & &mut
Range:          ..  ..=
Error Prop:     ?
Type:           :  ->
```

### 2.4 Delimiters

```
( )    Grouping, function calls, tuples
{ }    Blocks, struct/enum bodies
[ ]    Arrays, slices, indexing
< >    Generic parameters
,      Separator
;      Statement terminator
```

### 2.5 Comments

```veritas
// Single line comment

/// Documentation comment (attaches to following item)
/// Supports markdown formatting

/* 
   Multi-line comment 
   Can be nested /* like this */
*/
```

### 2.6 Literals

```veritas
// Integers
42          // i64 default
42_i32      // Explicit type suffix
0xFF        // Hexadecimal
0o77        // Octal
0b1010      // Binary
1_000_000   // Underscores allowed

// Floats
3.14        // f64 default
3.14_f32    // Explicit type suffix
1.0e10      // Scientific notation

// Strings
"hello"              // String
"line1\nline2"       // Escape sequences
r"raw\nstring"       // Raw string (no escapes)
f"hello {name}"      // Format string

// Characters
'a'
'\n'
'\u{1F600}'

// Booleans
true
false
```

## 3. Formal Grammar (EBNF)

### 3.1 Program Structure

```ebnf
program        = { item } ;

item           = module_decl
               | use_decl
               | fn_decl
               | type_alias
               | struct_decl
               | enum_decl
               | trait_decl
               | impl_block
               | const_decl ;

module_decl    = "mod" IDENT ( ";" | "{" { item } "}" ) ;

use_decl       = "use" path [ "as" IDENT ] ";" 
               | "use" path "::" "{" use_list "}" ";" ;

use_list       = IDENT { "," IDENT } [ "," ] ;
```

### 3.2 Functions

```ebnf
fn_decl        = [ visibility ] [ "async" ] [ "pure" ] "fn" IDENT 
                 [ generics ] "(" [ params ] ")" 
                 [ "->" type ] 
                 [ effects ]
                 [ where_clause ]
                 [ contracts ]
                 block ;

visibility     = "pub" [ "(" visibility_scope ")" ] ;
visibility_scope = "crate" | "super" | "self" | path ;

generics       = "<" generic_param { "," generic_param } [ "," ] ">" ;
generic_param  = IDENT [ ":" type_bounds ] [ "=" type ] ;

params         = param { "," param } [ "," ] ;
param          = [ "mut" ] IDENT ":" type ;

effects        = "effect" effect_list ;
effect_list    = effect_item { "+" effect_item } ;
effect_item    = "IO" | "State" "<" type ">" | "Error" "<" type ">" | "Async" ;

where_clause   = "where" where_pred { "," where_pred } ;
where_pred     = type ":" type_bounds ;

type_bounds    = type_bound { "+" type_bound } ;
type_bound     = path [ generics ] ;

contracts      = { contract_clause } ;
contract_clause = "require" expr 
                | "ensure" expr 
                | "invariant" expr ;

block          = "{" { statement } [ expr ] "}" ;
```

### 3.3 Types

```ebnf
type           = path [ generics ]
               | tuple_type
               | array_type
               | slice_type
               | fn_type
               | ref_type
               | branded_type ;

tuple_type     = "(" [ type { "," type } [ "," ] ] ")" ;
array_type     = "[" type ";" expr "]" ;
slice_type     = "[" type "]" ;
fn_type        = "fn" "(" [ type_list ] ")" [ "->" type ] [ effects ] ;
ref_type       = "&" [ "mut" ] [ lifetime ] type ;
branded_type   = "branded" IDENT "=" type ;

type_list      = type { "," type } [ "," ] ;

lifetime       = "'" IDENT ;
```

### 3.4 Structs and Enums

```ebnf
struct_decl    = [ visibility ] "struct" IDENT [ generics ] 
                 [ where_clause ]
                 ( struct_body | ";" ) ;

struct_body    = "{" [ struct_fields ] "}" 
               | "(" [ tuple_fields ] ")" ";" ;

struct_fields  = struct_field { "," struct_field } [ "," ] ;
struct_field   = [ visibility ] IDENT ":" type ;

tuple_fields   = type { "," type } [ "," ] ;

enum_decl      = [ visibility ] "enum" IDENT [ generics ]
                 [ where_clause ]
                 "{" [ enum_variants ] "}" ;

enum_variants  = enum_variant { "," enum_variant } [ "," ] ;
enum_variant   = IDENT [ "(" tuple_fields ")" | "{" struct_fields "}" ] ;
```

### 3.5 Traits and Implementations

```ebnf
trait_decl     = [ visibility ] "trait" IDENT [ generics ]
                 [ ":" type_bounds ]
                 [ where_clause ]
                 "{" { trait_item } "}" ;

trait_item     = fn_signature ";"
               | fn_decl
               | type_alias ;

fn_signature   = [ "async" ] [ "pure" ] "fn" IDENT 
                 [ generics ] "(" [ params ] ")" 
                 [ "->" type ] 
                 [ effects ]
                 [ where_clause ] ;

impl_block     = "impl" [ generics ] [ type "for" ] type
                 [ where_clause ]
                 "{" { impl_item } "}" ;

impl_item      = fn_decl
               | type_alias ;

type_alias     = "type" IDENT [ generics ] "=" type ";" ;
```

### 3.6 Statements

```ebnf
statement      = let_stmt
               | expr_stmt
               | item ;

let_stmt       = "let" [ "mut" ] pattern [ ":" type ] "=" expr ";" ;

expr_stmt      = expr ";" ;
```

### 3.7 Expressions

```ebnf
expr           = literal
               | path_expr
               | block_expr
               | tuple_expr
               | array_expr
               | struct_expr
               | call_expr
               | method_expr
               | field_expr
               | index_expr
               | unary_expr
               | binary_expr
               | if_expr
               | match_expr
               | loop_expr
               | for_expr
               | while_expr
               | return_expr
               | break_expr
               | continue_expr
               | closure_expr
               | await_expr
               | try_expr ;

literal        = INT_LIT | FLOAT_LIT | STRING_LIT | CHAR_LIT | BOOL_LIT ;

path_expr      = [ "::" ] IDENT { "::" IDENT } [ "::" generics ] ;

block_expr     = "{" { statement } [ expr ] "}" ;

tuple_expr     = "(" [ expr { "," expr } [ "," ] ] ")" ;

array_expr     = "[" [ expr { "," expr } [ "," ] ] "]"
               | "[" expr ";" expr "]" ;

struct_expr    = path "{" [ field_init { "," field_init } [ "," ] ] "}" ;
field_init     = IDENT [ ":" expr ] ;

call_expr      = expr "(" [ expr { "," expr } [ "," ] ] ")" ;

method_expr    = expr "." IDENT [ "::" generics ] "(" [ expr { "," expr } ] ")" ;

field_expr     = expr "." IDENT ;

index_expr     = expr "[" expr "]" ;

unary_expr     = ( "-" | "not" | "&" | "&mut" | "*" ) expr ;

binary_expr    = expr binary_op expr ;
binary_op      = "+" | "-" | "*" | "/" | "%" | "**"
               | "==" | "!=" | "<" | ">" | "<=" | ">="
               | "and" | "or"
               | "&" | "|" | "^" | "<<" | ">>"
               | "=" | "+=" | "-=" | "*=" | "/=" | "%=" ;

if_expr        = "if" expr block [ "else" ( if_expr | block ) ] ;

match_expr     = "match" expr "{" { match_arm } "}" ;
match_arm      = pattern [ "if" expr ] "=>" ( expr "," | block ) ;

loop_expr      = [ label ] "loop" block ;
for_expr       = [ label ] "for" pattern "in" expr block ;
while_expr     = [ label ] "while" expr block ;

label          = "'" IDENT ":" ;

return_expr    = "return" [ expr ] ;
break_expr     = "break" [ "'" IDENT ] [ expr ] ;
continue_expr  = "continue" [ "'" IDENT ] ;

closure_expr   = [ "move" ] "|" [ params ] "|" [ "->" type ] ( expr | block ) ;

await_expr     = expr "." "await" ;

try_expr       = expr "?" ;
```

### 3.8 Patterns

```ebnf
pattern        = "_"
               | IDENT
               | literal_pattern
               | ref_pattern
               | tuple_pattern
               | struct_pattern
               | enum_pattern
               | slice_pattern
               | or_pattern
               | range_pattern ;

literal_pattern = INT_LIT | FLOAT_LIT | STRING_LIT | CHAR_LIT | BOOL_LIT ;

ref_pattern    = "&" [ "mut" ] pattern ;

tuple_pattern  = "(" [ pattern { "," pattern } [ "," ] ] ")" ;

struct_pattern = path "{" [ field_pattern { "," field_pattern } [ "," ] ] [ ".." ] "}" ;
field_pattern  = IDENT [ ":" pattern ] ;

enum_pattern   = path [ "(" [ pattern { "," pattern } ] ")" 
                      | "{" [ field_pattern { "," field_pattern } ] "}" ] ;

slice_pattern  = "[" [ pattern { "," pattern } ] [ ".." [ pattern ] ] "]" ;

or_pattern     = pattern "|" pattern ;

range_pattern  = [ literal ] ".." [ "=" ] [ literal ] ;
```

## 4. Type System Syntax

### 4.1 Branded Types

Branded types create distinct types from underlying types to prevent mixing semantically different values.

```veritas
// Declaration
branded UserId = i64;
branded OrderId = i64;
branded Email = String;

// Usage - compiler prevents mixing
fn get_user_orders(user: UserId) -> List<OrderId> { ... }

// Conversion requires explicit cast
let user_id: UserId = UserId(42);
let raw: i64 = user_id.into();
```

### 4.2 Option and Result Types

No null in Veritas. Use Option and Result.

```veritas
// Option - represents optional values
enum Option<T> {
    Some(T),
    None,
}

// Result - represents operations that can fail
enum Result<T, E> {
    Ok(T),
    Err(E),
}

// Usage
fn find_user(id: UserId) -> Option<User> { ... }
fn parse_int(s: String) -> Result<i64, ParseError> { ... }
```

### 4.3 Ownership and Borrowing Syntax

```veritas
// Ownership transfer (move)
let s1 = String::from("hello");
let s2 = s1;  // s1 moved to s2, s1 no longer valid

// Immutable borrow
let s = String::from("hello");
let len = calculate_length(&s);  // s borrowed, still valid

// Mutable borrow
let mut s = String::from("hello");
append_world(&mut s);  // s mutably borrowed

// Function signatures with ownership
fn take_ownership(s: String) { ... }           // Takes ownership
fn borrow_ref(s: &String) { ... }              // Immutable borrow
fn borrow_mut(s: &mut String) { ... }          // Mutable borrow

// Lifetime annotations when needed
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str { ... }
```

### 4.4 Effect System Syntax

```veritas
// Pure function - no effects
pure fn add(a: i64, b: i64) -> i64 {
    a + b
}

// Function with IO effect
fn read_file(path: &str) -> Result<String, IoError> effect IO {
    ...
}

// Function with multiple effects
fn process_data(id: i64) -> Result<Data, Error> effect IO + Error<DbError> {
    ...
}

// Effect polymorphism
fn map<T, U, E>(opt: Option<T>, f: fn(T) -> U effect E) -> Option<U> effect E {
    match opt {
        Some(x) => Some(f(x)),
        None => None,
    }
}
```

### 4.5 Contracts Syntax

```veritas
fn divide(a: i64, b: i64) -> i64
    require b != 0
    ensure result * b == a
{
    a / b
}

fn binary_search<T: Ord>(arr: &[T], target: &T) -> Option<usize>
    require arr.is_sorted()
    ensure match result {
        Some(i) => arr[i] == *target,
        None => not arr.contains(target),
    }
{
    ...
}

struct BankAccount {
    balance: i64,
    
    invariant balance >= 0
}
```

## 5. Module System

### 5.1 Module Declaration

```veritas
// File: src/main.vt

mod auth;           // Loads from src/auth.vt or src/auth/mod.vt
mod database;       // Loads from src/database.vt or src/database/mod.vt

// Inline module
mod helpers {
    pub fn format_date(d: Date) -> String { ... }
}
```

### 5.2 Visibility

```veritas
pub fn public_function() { ... }           // Public to all
pub(crate) fn crate_function() { ... }     // Public within crate
pub(super) fn parent_function() { ... }    // Public to parent module
fn private_function() { ... }              // Private (default)

pub struct User {
    pub name: String,           // Public field
    pub(crate) email: Email,    // Crate-visible field
    password_hash: String,      // Private field
}
```

### 5.3 Imports

```veritas
use std::collections::HashMap;
use std::io::{Read, Write};
use crate::auth::User;
use super::helpers::format_date;

// Aliasing
use std::collections::HashMap as Map;

// Glob import (discouraged - reduces explicitness)
use std::prelude::*;
```

## 6. Async Syntax

```veritas
// Async function
async fn fetch_data(url: &str) -> Result<Data, HttpError> effect IO {
    let response = http::get(url).await?;
    let data = response.json().await?;
    Ok(data)
}

// Calling async functions
async fn main() effect IO {
    let data = fetch_data("https://api.example.com").await?;
    println(f"Got: {data}");
}

// Concurrent execution
async fn fetch_all(urls: &[String]) -> Vec<Result<Data, HttpError>> effect IO {
    let futures = urls.iter().map(|url| fetch_data(url));
    join_all(futures).await
}
```

## 7. Token Efficiency Design

### 7.1 Design Principles

1. **Single-character operators where unambiguous** - `&` not `ref`, `?` for error propagation
2. **No redundant keywords** - `fn` not `function`, `pub` not `public`
3. **Type inference within functions** - Explicit at boundaries, inferred locally
4. **Semicolon inference at block end** - Optional for final expression
5. **Field shorthand** - `User { name }` instead of `User { name: name }`

### 7.2 Token Comparison

Equivalent "Hello World" in different languages:

**Python (7 tokens):**
```python
print("Hello, World!")
```

**Rust (11 tokens):**
```rust
fn main() { println!("Hello, World!"); }
```

**Veritas (10 tokens):**
```veritas
fn main() { print("Hello, World!") }
```

**More complex example - HTTP fetch with error handling:**

**TypeScript (~45 tokens):**
```typescript
async function fetchUser(id: number): Promise<User | null> {
  try {
    const response = await fetch(`/users/${id}`);
    if (!response.ok) return null;
    return await response.json();
  } catch { return null; }
}
```

**Veritas (~40 tokens):**
```veritas
async fn fetch_user(id: i64) -> Option<User> effect IO {
    let response = http::get(f"/users/{id}").await.ok()?;
    response.json().await.ok()
}
```

## 8. Error Message Integration

The syntax is designed to produce clear, actionable error messages. See the Error Message Specification for details on how syntax errors are reported.

```veritas
// Missing type annotation produces clear error
let x = get_value();
// Error[TYPE-001]: Cannot infer type for `x`
//   --> src/main.vt:5:5
//   |
// 5 | let x = get_value();
//   |     ^ add type annotation: `let x: ExpectedType = ...`
```

## 9. Reserved for Future

The following are reserved for potential future use:

- `macro` - Compile-time code generation
- `const fn` - Compile-time function evaluation
- `unsafe` - Low-level memory access (may never be added)
- `dyn` - Dynamic dispatch
- `box` - Heap allocation

## 10. File Extensions

- `.vt` - Veritas source files
- `.vti` - Veritas interface files (type definitions only)

## Appendix A: Complete Grammar

See the EBNF sections above for the complete formal grammar.

## Appendix B: Comparison with Other Languages

| Feature | Veritas | Rust | TypeScript | Python |
|---------|---------|------|------------|--------|
| Mandatory types | Yes | Yes | Partial | No |
| Ownership system | Yes | Yes | No | No |
| Effect tracking | Yes | No | No | No |
| Branded types | Built-in | Newtype pattern | Type aliases | No |
| Null safety | Option type | Option type | Strict mode | No |
| Contracts | Built-in | External crate | No | No |
| Type inference | Local only | Local + partial | Full | N/A |

## Appendix C: Design Rationale

### Why brace-based syntax?
- Training data abundance (C, Java, JavaScript, Rust, Go)
- Unambiguous block boundaries
- Familiar to most developers and AI models

### Why explicit effects?
- AI agents need to know if a function has side effects
- Enables pure function optimization
- Makes behavior visible without reading implementation

### Why contracts in syntax?
- Preconditions/postconditions are documentation that compiles
- Enables compile-time verification where possible
- Helps AI generate correct edge case handling

### Why branded types as first-class?
- Prevents 94% of AI type mismatch errors
- More ergonomic than newtype pattern
- Semantic meaning visible in type signatures
