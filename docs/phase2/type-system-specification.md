# Veritas Type System Specification

Version: 1.0.0
Status: Draft
Author: worker-4
Date: 2026-02-17

## 1. Overview

The Veritas type system is designed with AI agents as the primary users. Every design decision optimizes for:
- Compile-time error detection (94% of AI errors are type-related)
- Explicit, unambiguous semantics
- Local reasoning without full codebase context
- Self-documenting code through types

## 2. Type Hierarchy

### 2.1 Primitive Types

```
Primitives
├── Integers (signed)
│   ├── i8    (-128 to 127)
│   ├── i16   (-32,768 to 32,767)
│   ├── i32   (-2^31 to 2^31-1)
│   ├── i64   (-2^63 to 2^63-1)
│   └── i128  (-2^127 to 2^127-1)
├── Integers (unsigned)
│   ├── u8    (0 to 255)
│   ├── u16   (0 to 65,535)
│   ├── u32   (0 to 2^32-1)
│   ├── u64   (0 to 2^64-1)
│   └── u128  (0 to 2^128-1)
├── Floats
│   ├── f32   (IEEE 754 single precision)
│   └── f64   (IEEE 754 double precision)
├── Bool     (true, false)
├── Char     (Unicode scalar value)
└── Unit     () - zero-sized type
```

**Design Rationale**: Explicit bit widths prevent overflow surprises. No implicit numeric conversions.

### 2.2 Compound Types

#### Tuples
```veritas
type Point = (i32, i32)
type RGB = (u8, u8, u8)
type Named = (x: i32, y: i32)  // Named tuple fields
```

#### Arrays (Fixed Size)
```veritas
type Buffer = [u8; 256]
type Matrix3x3 = [[f64; 3]; 3]
```

#### Slices (Dynamic Size)
```veritas
type Bytes = [u8]
type Numbers = [i32]
```

### 2.3 User-Defined Types

#### Structs
```veritas
struct User {
    id: UserId,
    name: String,
    email: Email,
    created_at: Timestamp,
}
```

#### Enums (Algebraic Data Types)
```veritas
enum Result<T, E> {
    Ok(T),
    Err(E),
}

enum Option<T> {
    Some(T),
    None,
}

enum HttpStatus {
    Ok = 200,
    NotFound = 404,
    InternalError = 500,
}
```

## 3. Branded Types (Semantic Type Distinctions)

### 3.1 Motivation

AI agents frequently confuse semantically different values that share the same underlying type. Branded types prevent this at compile time.

### 3.2 Syntax

```veritas
brand UserId = i64
brand OrderId = i64
brand ProductId = i64
brand Email = String
brand Url = String
```

### 3.3 Rules

1. **No Implicit Conversion**: `UserId` cannot be used where `OrderId` is expected
2. **Explicit Unwrap**: Access underlying value with `.value` or explicit conversion
3. **Explicit Wrap**: Create branded value with `UserId::from(123)` or `UserId(123)`

### 3.4 Example

```veritas
fn get_user(id: UserId) -> Result<User, DbError>
fn get_order(id: OrderId) -> Result<Order, DbError>

// COMPILER ERROR: Expected UserId, found OrderId
let user = get_user(order_id);

// CORRECT: Explicit and clear
let user = get_user(user_id);
```

### 3.5 Branded Type Operations

```veritas
brand UserId = i64 {
    // Custom methods on branded type
    fn is_valid(self) -> Bool {
        self.value > 0
    }
}

// Derive traits for branded types
brand OrderId = i64 deriving (Eq, Hash, Debug, Serialize)
```

## 4. Ownership Model

### 4.1 Core Rules

1. **Single Owner**: Every value has exactly one owner at any time
2. **Move Semantics**: Assignment transfers ownership (not copy)
3. **Drop on Scope Exit**: Values are dropped when owner goes out of scope
4. **No Use After Move**: Compiler rejects access to moved values

### 4.2 Ownership Transfer

```veritas
fn take_ownership(s: String) {
    // s is owned here
} // s is dropped

fn main() {
    let s = String::from("hello");
    take_ownership(s);
    // COMPILER ERROR: s was moved
    print(s);
}
```

### 4.3 Borrowing

#### Immutable Borrows (`&T`)
```veritas
fn read_only(s: &String) {
    // Can read s, cannot modify
    print(s.len());
}

fn main() {
    let s = String::from("hello");
    read_only(&s);  // Borrow
    print(s);       // Still valid, we only borrowed
}
```

#### Mutable Borrows (`&mut T`)
```veritas
fn modify(s: &mut String) {
    s.push_str(" world");
}

fn main() {
    let mut s = String::from("hello");
    modify(&mut s);
    print(s);  // "hello world"
}
```

### 4.4 Borrowing Rules

1. **Multiple Immutable OR One Mutable**: Cannot have `&mut` while `&` exists
2. **No Dangling References**: References cannot outlive referent
3. **Borrow Scope**: Borrows are active until last use (NLL - Non-Lexical Lifetimes)

```veritas
fn example() {
    let mut data = vec![1, 2, 3];
    
    let first = &data[0];     // Immutable borrow
    // data.push(4);          // ERROR: Cannot mutate while borrowed
    print(first);             // Last use of first
    
    data.push(4);             // OK: immutable borrow ended
}
```

### 4.5 Lifetime Annotations

```veritas
// Explicit lifetime when ambiguous
fn longest<'a>(x: &'a String, y: &'a String) -> &'a String {
    if x.len() > y.len() { x } else { y }
}

// Lifetime bounds in structs
struct Excerpt<'a> {
    text: &'a String,
}
```

### 4.6 Copy Types

Types that implement `Copy` are duplicated instead of moved:

```veritas
// All primitives are Copy
let x: i32 = 5;
let y = x;  // Copy, not move
print(x);   // Still valid

// User types can derive Copy if all fields are Copy
struct Point deriving (Copy) {
    x: f64,
    y: f64,
}
```

## 5. Effect System

### 5.1 Motivation

AI agents cannot predict runtime behavior. The effect system makes all side effects visible in function signatures.

### 5.2 Built-in Effects

```
Effects
├── Pure       (default - no side effects)
├── IO         (file, network, console I/O)
├── State<T>   (mutable state of type T)
├── Error<E>   (can fail with error type E)
├── Async      (asynchronous execution)
└── Unsafe     (raw memory operations)
```

### 5.3 Effect Declarations

```veritas
// Pure function - no effect declaration needed
fn add(a: i32, b: i32) -> i32 {
    a + b
}

// IO effect - reads from console
fn read_line() -> String with IO {
    stdin().read_line()
}

// Multiple effects
fn fetch_user(id: UserId) -> User with IO, Error<HttpError> {
    let response = http_get(user_url(id))?;
    parse_user(response)?
}

// Async effect
fn fetch_async(url: Url) -> Response with Async, IO, Error<HttpError> {
    await http_get_async(url)?
}
```

### 5.4 Effect Propagation

Effects bubble up through call chains. The compiler enforces this:

```veritas
// COMPILER ERROR: Calling IO function from pure function
fn pure_function() -> i32 {
    let line = read_line();  // ERROR: read_line has IO effect
    line.parse().unwrap()
}

// CORRECT: Declare the effect
fn impure_function() -> i32 with IO {
    let line = read_line();
    line.parse().unwrap()
}
```

### 5.5 Effect Polymorphism

Functions can be generic over effects:

```veritas
fn map<T, U, E>(items: List<T>, f: fn(T) -> U with E) -> List<U> with E {
    items.iter().map(f).collect()
}

// Called with pure function - result is pure
let doubled = map(numbers, |x| x * 2);

// Called with IO function - result has IO effect
let printed = map(numbers, |x| with IO { print(x); x });
```

### 5.6 Effect Handlers

```veritas
// Handle errors
fn main() with IO {
    match fetch_user(UserId(123)) {
        Ok(user) => print(user.name),
        Err(e) => print("Error: {e}"),
    }
}

// Handle async
fn main() with IO {
    let runtime = Runtime::new();
    runtime.block_on(async_main());
}
```

## 6. Error Handling

### 6.1 No Null

Veritas has no null, nil, or undefined. Use `Option<T>` for optional values:

```veritas
enum Option<T> {
    Some(T),
    None,
}

fn find_user(id: UserId) -> Option<User> {
    // Returns Some(user) or None
}
```

### 6.2 Result Type

Errors are values, not exceptions:

```veritas
enum Result<T, E> {
    Ok(T),
    Err(E),
}

fn parse_int(s: String) -> Result<i32, ParseError> {
    // Returns Ok(number) or Err(error)
}
```

### 6.3 Error Propagation Operator

The `?` operator propagates errors up the call stack:

```veritas
fn process_file(path: Path) -> Result<Data, FileError> with IO {
    let file = File::open(path)?;        // Returns early if Err
    let content = file.read_string()?;   // Returns early if Err
    let data = parse(content)?;          // Returns early if Err
    Ok(data)
}
```

### 6.4 Must-Use Results

Results cannot be silently ignored:

```veritas
fn main() with IO {
    // COMPILER WARNING: Unused Result
    File::create("test.txt");
    
    // CORRECT: Handle the result
    let _ = File::create("test.txt");           // Explicit ignore
    File::create("test.txt")?;                  // Propagate
    File::create("test.txt").expect("Failed");  // Panic on error
}
```

## 7. Generics and Type Parameters

### 7.1 Generic Functions

```veritas
fn identity<T>(value: T) -> T {
    value
}

fn swap<T, U>(pair: (T, U)) -> (U, T) {
    (pair.1, pair.0)
}
```

### 7.2 Generic Types

```veritas
struct Pair<T, U> {
    first: T,
    second: U,
}

enum Tree<T> {
    Leaf(T),
    Node(Box<Tree<T>>, Box<Tree<T>>),
}
```

### 7.3 Trait Bounds

```veritas
// T must implement Display
fn print_value<T: Display>(value: T) with IO {
    print("{value}");
}

// Multiple bounds
fn compare_and_show<T: Ord + Display>(a: T, b: T) -> T with IO {
    let result = if a > b { a } else { b };
    print("Winner: {result}");
    result
}

// Where clauses for complex bounds
fn complex<T, U>(x: T, y: U) -> i32
where
    T: Clone + Debug,
    U: Into<T>,
{
    // ...
}
```

## 8. Traits (Type Classes)

### 8.1 Trait Definition

```veritas
trait Display {
    fn fmt(self, f: &mut Formatter) -> Result<(), FormatError>;
}

trait Default {
    fn default() -> Self;
}

trait From<T> {
    fn from(value: T) -> Self;
}
```

### 8.2 Trait Implementation

```veritas
impl Display for User {
    fn fmt(self, f: &mut Formatter) -> Result<(), FormatError> {
        write!(f, "User(id={}, name={})", self.id.value, self.name)
    }
}

impl Default for Config {
    fn default() -> Self {
        Config {
            timeout: Duration::seconds(30),
            retries: 3,
            debug: false,
        }
    }
}
```

### 8.3 Derive Macros

```veritas
struct User deriving (Debug, Clone, Eq, Hash, Serialize, Deserialize) {
    id: UserId,
    name: String,
    email: Email,
}
```

## 9. Pattern Matching

### 9.1 Exhaustive Matching

The compiler requires all cases to be handled:

```veritas
fn describe(opt: Option<i32>) -> String {
    match opt {
        Some(n) if n > 0 => "positive",
        Some(0) => "zero",
        Some(n) => "negative",  // n < 0
        None => "nothing",
    }
}

// COMPILER ERROR: Non-exhaustive match
fn incomplete(opt: Option<i32>) -> String {
    match opt {
        Some(n) => "something",
        // Missing None case!
    }
}
```

### 9.2 Pattern Types

```veritas
// Literal patterns
match x {
    0 => "zero",
    1 => "one",
    _ => "other",
}

// Destructuring
match point {
    Point { x: 0, y } => "on y-axis at {y}",
    Point { x, y: 0 } => "on x-axis at {x}",
    Point { x, y } => "at ({x}, {y})",
}

// Nested patterns
match result {
    Ok(Some(value)) => "got {value}",
    Ok(None) => "got nothing",
    Err(e) => "error: {e}",
}

// Or patterns
match char {
    'a' | 'e' | 'i' | 'o' | 'u' => "vowel",
    _ => "consonant",
}

// Range patterns
match score {
    0..=59 => "F",
    60..=69 => "D",
    70..=79 => "C",
    80..=89 => "B",
    90..=100 => "A",
    _ => "invalid",
}
```

### 9.3 If-Let and While-Let

```veritas
// Instead of full match for single case
if let Some(user) = find_user(id) {
    print("Found: {user.name}");
}

// Loop while pattern matches
while let Some(item) = queue.pop() {
    process(item);
}
```

## 10. Type Inference

### 10.1 Local Inference Only

Type inference is limited to local scope. Function signatures, struct fields, and module boundaries require explicit types.

```veritas
// Function signatures MUST have explicit types
fn process(input: String) -> Result<Output, Error> with IO {
    // Local variables can be inferred
    let x = 42;                    // Inferred as i32
    let y = vec![1, 2, 3];         // Inferred as Vec<i32>
    let z = input.parse()?;        // Inferred from return type
    
    Ok(z)
}

// Struct fields MUST have explicit types
struct Config {
    timeout: Duration,             // Required
    retries: u32,                  // Required
}
```

### 10.2 Inference Rules

1. Literals default: `42` → `i32`, `3.14` → `f64`
2. Collections infer from elements
3. Closures infer from context
4. Return type propagates backward

```veritas
// Type flows from usage
let numbers = vec![];              // Type unknown
numbers.push(42);                  // Now Vec<i32>

// Explicit when ambiguous
let numbers: Vec<i64> = vec![];    // Explicit annotation
let numbers = Vec::<i64>::new();   // Turbofish syntax
```

## 11. Contracts and Assertions

### 11.1 Preconditions

```veritas
fn divide(a: i32, b: i32) -> i32
    requires b != 0
{
    a / b
}

fn get_element<T>(list: &List<T>, index: usize) -> &T
    requires index < list.len()
{
    &list[index]
}
```

### 11.2 Postconditions

```veritas
fn abs(x: i32) -> i32
    ensures result >= 0
{
    if x < 0 { -x } else { x }
}

fn sort<T: Ord>(list: &mut List<T>)
    ensures list.is_sorted()
{
    // implementation
}
```

### 11.3 Invariants

```veritas
struct BoundedCounter {
    value: u32,
    max: u32,
    
    invariant self.value <= self.max
}

impl BoundedCounter {
    fn increment(&mut self) {
        if self.value < self.max {
            self.value += 1;
        }
    }
}
```

### 11.4 Contract Checking

Contracts are checked at:
- **Compile time**: When statically provable
- **Runtime**: When dynamic values involved (debug builds)
- **Verification**: With external proof assistants

## 12. Module System

### 12.1 Module Declaration

```veritas
// In lib.ver
mod auth;           // Load from auth.ver or auth/mod.ver
mod database;
mod http;

pub mod api {       // Inline module
    pub fn handler() { }
}
```

### 12.2 Visibility

```veritas
pub struct User {           // Public struct
    pub name: String,       // Public field
    email: Email,           // Private field (module only)
    pub(crate) id: UserId,  // Crate-visible
}

pub fn public_api() { }     // Public
fn internal() { }           // Private to module
pub(super) fn parent() { }  // Visible to parent module
```

### 12.3 Imports

```veritas
use std::collections::HashMap;
use std::io::{Read, Write};
use crate::models::{User, Order};
use super::common::*;           // Wildcard (use sparingly)

// Rename on import
use std::collections::HashMap as Map;
```

## 13. Memory Layout

### 13.1 Size and Alignment

```veritas
struct Compact {
    a: u8,      // 1 byte
    b: u32,     // 4 bytes (aligned to 4)
    c: u8,      // 1 byte
}
// Total: 12 bytes (with padding)

#[repr(packed)]
struct Packed {
    a: u8,
    b: u32,
    c: u8,
}
// Total: 6 bytes (no padding)

#[repr(C)]
struct CCompatible {
    // C-compatible layout
}
```

### 13.2 Smart Pointers

```veritas
Box<T>       // Heap-allocated, single owner
Rc<T>        // Reference-counted, multiple owners, single-threaded
Arc<T>       // Atomic reference-counted, multiple owners, thread-safe
RefCell<T>   // Interior mutability, runtime borrow checking
Mutex<T>     // Thread-safe interior mutability
```

## 14. Concurrency Types

### 14.1 Send and Sync

```veritas
// Marker traits for thread safety
trait Send { }     // Safe to transfer between threads
trait Sync { }     // Safe to share references between threads

// Compiler auto-implements when safe
struct SafeData deriving (Send, Sync) {
    value: i32,
}

// NOT Send/Sync - has interior mutability
struct UnsafeData {
    cell: RefCell<i32>,  // RefCell is !Sync
}
```

### 14.2 Thread-Safe Types

```veritas
use std::sync::{Arc, Mutex, RwLock};

fn shared_state() with Async {
    let counter = Arc::new(Mutex::new(0));
    
    let handles: Vec<_> = (0..10).map(|_| {
        let counter = Arc::clone(&counter);
        spawn(async move {
            let mut num = counter.lock().await;
            *num += 1;
        })
    }).collect();
    
    for h in handles {
        h.await;
    }
}
```

## 15. Type Aliases

```veritas
// Simple alias
type UserId = i64;              // Note: NOT a branded type
type Callback = fn(i32) -> i32;
type Result<T> = std::result::Result<T, AppError>;

// Generic alias
type Pair<T> = (T, T);
type StringMap<V> = HashMap<String, V>;
```

## 16. Never Type

```veritas
// Functions that never return
fn panic(msg: String) -> ! {
    // Terminates program
}

fn infinite_loop() -> ! {
    loop { }
}

// Useful in match arms
fn unwrap_or_die<T>(opt: Option<T>) -> T {
    match opt {
        Some(v) => v,
        None => panic("Expected Some"),  // ! coerces to T
    }
}
```

## 17. Variance

### 17.1 Covariance

```veritas
// If Cat <: Animal, then Box<Cat> <: Box<Animal>
fn accept_animal(a: Box<Animal>) { }
accept_animal(Box::new(cat));  // OK: covariant
```

### 17.2 Invariance

```veritas
// Mutable references are invariant
fn modify(a: &mut Animal) { }
// Cannot pass &mut Cat - must be exactly &mut Animal
```

### 17.3 Contravariance

```veritas
// Functions are contravariant in arguments
// If Cat <: Animal, then fn(Animal) <: fn(Cat)
type Handler<T> = fn(T) -> ();
let cat_handler: Handler<Cat> = animal_handler;  // OK
```

## 18. Formal Type Rules

### 18.1 Typing Judgments

```
Γ ⊢ e : T    means "in context Γ, expression e has type T"
```

### 18.2 Core Rules

```
Variable:
    x : T ∈ Γ
    ─────────
    Γ ⊢ x : T

Function Application:
    Γ ⊢ f : (T → U with E)    Γ ⊢ x : T
    ────────────────────────────────────
    Γ ⊢ f(x) : U with E

Lambda:
    Γ, x : T ⊢ e : U with E
    ───────────────────────────
    Γ ⊢ (|x: T| e) : (T → U with E)

Let:
    Γ ⊢ e₁ : T    Γ, x : T ⊢ e₂ : U
    ────────────────────────────────
    Γ ⊢ (let x = e₁; e₂) : U

Borrow:
    Γ ⊢ e : T    e is not moved
    ───────────────────────────
    Γ ⊢ &e : &T

Mutable Borrow:
    Γ ⊢ e : T    e is mutable    no active borrows of e
    ─────────────────────────────────────────────────────
    Γ ⊢ &mut e : &mut T
```

## Appendix A: Reserved Keywords

```
as async await brand break const continue crate
derive do dyn else enum ensures extern false
fn for if impl import in invariant let
loop match mod move mut pub pure ref
requires return self Self static struct super
trait true type union unsafe use where while
with yield
```

## Appendix B: Operator Precedence

From highest to lowest:
1. Path: `::`
2. Method call: `.`
3. Unary: `!`, `-`, `*`, `&`, `&mut`
4. Cast: `as`
5. Multiply: `*`, `/`, `%`
6. Add: `+`, `-`
7. Shift: `<<`, `>>`
8. BitAnd: `&`
9. BitXor: `^`
10. BitOr: `|`
11. Compare: `==`, `!=`, `<`, `>`, `<=`, `>=`
12. And: `&&`
13. Or: `||`
14. Range: `..`, `..=`
15. Assign: `=`, `+=`, `-=`, etc.
16. Return: `return`, `break`, `continue`

## Appendix C: Comparison with Other Languages

| Feature | Veritas | Rust | TypeScript | Python |
|---------|---------|------|------------|--------|
| Static Types | Mandatory | Mandatory | Optional | Optional |
| Null Safety | No null | No null | Strict mode | Has None |
| Ownership | Yes | Yes | No | No |
| Effect System | Built-in | No | No | No |
| Branded Types | Built-in | Via newtype | Via branding | No |
| Contracts | Built-in | Via crates | No | No |
| AI-Optimized Errors | Yes | No | No | No |
