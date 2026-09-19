# Rust - Interview Ready Guide

**1. Fundamentals** - What It Is, Core Concepts (Ownership, Borrowing, Lifetimes)

**2. Basic Syntax** - Variables, Types, Functions

**3. Collections** - Vec, HashMap, String

**4. Control Flow** - Match, Pattern Matching, Loops

**5. Types** - Structs, Enums, Option, Result

**6. Error Handling** - Result, ?, panic

**7. Traits** - Defining, Implementing, Trait Bounds

**8. Concurrency** - Threads, Channels, Arc, Mutex, Async/Await

**9. Interview Prep** - Common Questions, Practice Project

---

## What It Is

Rust is a systems programming language focused on safety, speed, and concurrency. Developed by Mozilla and first released in 2010, Rust provides memory safety without garbage collection through its innovative ownership system.

Rust solves a fundamental problem: C and C++ are fast but prone to memory bugs (buffer overflows, use-after-free, data races). Garbage-collected languages are safe but have runtime overhead. Rust achieves both safety and performance through compile-time checks.

Rust is used for:
- Systems programming (operating systems, drivers)
- WebAssembly applications
- Command-line tools
- Web services (high-performance APIs)
- Embedded systems
- Game engines
- Blockchain and cryptocurrencies

Companies using Rust: Mozilla (Firefox), Dropbox, Discord, Cloudflare, Amazon (Firecracker), Microsoft, Google.

---

## Core Concepts

### Ownership

Rust's defining feature. Every value has exactly one owner.

```rust
fn main() {
    // s1 owns the String
    let s1 = String::from("hello");
    
    // Ownership moves to s2. s1 is no longer valid.
    let s2 = s1;
    
    // println!("{}", s1);  // ERROR: value borrowed after move
    println!("{}", s2);     // OK
    
    // Function takes ownership
    takes_ownership(s2);
    // println!("{}", s2);  // ERROR: s2 was moved into function
}

fn takes_ownership(s: String) {
    println!("{}", s);
}  // s is dropped here, memory freed
```

**Rules:**
1. Each value has exactly one owner
2. When owner goes out of scope, value is dropped
3. Assignment moves ownership (for non-Copy types)

### Borrowing and References

Instead of moving ownership, borrow with references.

```rust
fn main() {
    let s = String::from("hello");
    
    // Immutable borrow - can have multiple
    let len = calculate_length(&s);
    println!("Length of '{}' is {}", s, len);  // s still valid
    
    // Mutable borrow - can have only one
    let mut s2 = String::from("hello");
    change(&mut s2);
    println!("{}", s2);  // "hello, world"
}

fn calculate_length(s: &String) -> usize {
    s.len()
}  // s goes out of scope but doesn't drop (borrowed, not owned)

fn change(s: &mut String) {
    s.push_str(", world");
}
```

**Borrowing Rules:**
1. Can have either ONE mutable reference OR any number of immutable references
2. References must always be valid (no dangling pointers)

```rust
fn main() {
    let mut s = String::from("hello");
    
    let r1 = &s;     // OK
    let r2 = &s;     // OK - multiple immutable borrows
    // let r3 = &mut s;  // ERROR: cannot borrow as mutable while immutable borrows exist
    
    println!("{} {}", r1, r2);
    // r1 and r2 no longer used after this point
    
    let r3 = &mut s; // OK now - previous borrows are done
    println!("{}", r3);
}
```

### Lifetimes

Ensure references don't outlive the data they reference.

```rust
// This won't compile - Rust can't determine which lifetime to use
// fn longest(x: &str, y: &str) -> &str {
//     if x.len() > y.len() { x } else { y }
// }

// Explicit lifetime annotation
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let s1 = String::from("long string");
    let s2 = String::from("short");
    
    let result = longest(&s1, &s2);
    println!("Longest: {}", result);
}

// Lifetime in structs
struct Excerpt<'a> {
    part: &'a str,
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().unwrap();
    let excerpt = Excerpt { part: first_sentence };
    println!("{}", excerpt.part);
}
```

---

## Basic Syntax

### Variables and Types

```rust
fn main() {
    // Immutable by default
    let x = 5;
    // x = 6;  // ERROR: cannot assign twice to immutable variable
    
    // Mutable
    let mut y = 5;
    y = 6;  // OK
    
    // Type annotations
    let z: i32 = 10;
    let f: f64 = 3.14;
    let b: bool = true;
    let c: char = 'a';
    
    // Shadowing (redeclare with same name)
    let x = x + 1;  // OK - new variable shadowing old
    let x = "now a string";  // OK - can change type with shadowing
    
    // Constants (must have type annotation)
    const MAX_POINTS: u32 = 100_000;
}
```

### Scalar Types

```rust
// Integers
i8, i16, i32, i64, i128, isize  // signed
u8, u16, u32, u64, u128, usize  // unsigned

// Floating point
f32, f64

// Boolean
bool  // true, false

// Character (4 bytes, Unicode)
char  // 'a', '😀'
```

### Compound Types

```rust
fn main() {
    // Tuple - fixed length, different types
    let tup: (i32, f64, u8) = (500, 6.4, 1);
    let (x, y, z) = tup;  // Destructuring
    let first = tup.0;    // Access by index
    
    // Array - fixed length, same type
    let arr: [i32; 5] = [1, 2, 3, 4, 5];
    let first = arr[0];
    let all_threes = [3; 5];  // [3, 3, 3, 3, 3]
}
```

### Strings

```rust
fn main() {
    // String slice (reference to string data)
    let s1: &str = "hello";  // String literal, stored in binary
    
    // String (owned, heap-allocated, growable)
    let s2: String = String::from("hello");
    let s3: String = "hello".to_string();
    
    // String operations
    let mut s = String::from("hello");
    s.push_str(", world");  // Append
    s.push('!');            // Append char
    
    // Concatenation
    let s1 = String::from("Hello, ");
    let s2 = String::from("world!");
    let s3 = s1 + &s2;  // s1 is moved, s2 is borrowed
    
    // Format macro (doesn't take ownership)
    let s = format!("{} {}", "hello", "world");
    
    // Slicing
    let hello = &s[0..5];  // "hello"
    
    // Iteration
    for c in "hello".chars() {
        println!("{}", c);
    }
}
```

---

## Collections

### Vector

```rust
fn main() {
    // Create vector
    let v: Vec<i32> = Vec::new();
    let v = vec![1, 2, 3];  // Macro
    
    // Mutable operations
    let mut v = Vec::new();
    v.push(1);
    v.push(2);
    v.push(3);
    
    // Access
    let third: &i32 = &v[2];       // Panics if out of bounds
    let third: Option<&i32> = v.get(2);  // Returns None if out of bounds
    
    match v.get(2) {
        Some(value) => println!("Third element: {}", value),
        None => println!("No third element"),
    }
    
    // Iteration
    for i in &v {
        println!("{}", i);
    }
    
    // Mutable iteration
    for i in &mut v {
        *i += 10;
    }
}
```

### HashMap

```rust
use std::collections::HashMap;

fn main() {
    // Create
    let mut scores = HashMap::new();
    
    // Insert
    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Yellow"), 50);
    
    // Access
    let team_name = String::from("Blue");
    let score = scores.get(&team_name);  // Option<&V>
    
    // Iterate
    for (key, value) in &scores {
        println!("{}: {}", key, value);
    }
    
    // Update
    scores.insert(String::from("Blue"), 25);  // Overwrite
    
    // Insert only if key doesn't exist
    scores.entry(String::from("Red")).or_insert(30);
    
    // Update based on old value
    let count = scores.entry(String::from("Blue")).or_insert(0);
    *count += 1;
}
```

---

## Control Flow

```rust
fn main() {
    // if/else
    let number = 6;
    if number % 2 == 0 {
        println!("even");
    } else {
        println!("odd");
    }
    
    // if as expression
    let result = if number > 5 { "big" } else { "small" };
    
    // loop (infinite)
    let mut counter = 0;
    let result = loop {
        counter += 1;
        if counter == 10 {
            break counter * 2;  // Return value from loop
        }
    };
    
    // while
    while counter > 0 {
        println!("{}", counter);
        counter -= 1;
    }
    
    // for
    for i in 1..=5 {  // 1 to 5 inclusive
        println!("{}", i);
    }
    
    for element in [10, 20, 30].iter() {
        println!("{}", element);
    }
    
    // match (exhaustive pattern matching)
    let x = 1;
    match x {
        1 => println!("one"),
        2 => println!("two"),
        3..=5 => println!("three to five"),
        _ => println!("something else"),  // Default case
    }
    
    // if let (shorthand for single match)
    let some_value = Some(3);
    if let Some(x) = some_value {
        println!("Got: {}", x);
    }
}
```

---

## Structs and Enums

### Structs

```rust
// Define struct
struct User {
    username: String,
    email: String,
    active: bool,
    sign_in_count: u64,
}

// Tuple struct
struct Point(i32, i32, i32);
struct Color(i32, i32, i32);

impl User {
    // Associated function (constructor)
    fn new(username: String, email: String) -> User {
        User {
            username,
            email,
            active: true,
            sign_in_count: 1,
        }
    }
    
    // Method (takes &self)
    fn greet(&self) -> String {
        format!("Hello, {}!", self.username)
    }
    
    // Mutable method
    fn deactivate(&mut self) {
        self.active = false;
    }
}

fn main() {
    let user = User::new(
        String::from("steve"),
        String::from("steve@test.com"),
    );
    
    println!("{}", user.greet());
    
    // Struct update syntax
    let user2 = User {
        email: String::from("another@test.com"),
        ..user  // Copy remaining fields from user
    };
}
```

### Enums

```rust
// Simple enum
enum Direction {
    Up,
    Down,
    Left,
    Right,
}

// Enum with data
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

impl Message {
    fn call(&self) {
        match self {
            Message::Quit => println!("Quit"),
            Message::Move { x, y } => println!("Move to {}, {}", x, y),
            Message::Write(text) => println!("Write: {}", text),
            Message::ChangeColor(r, g, b) => println!("Color: {}, {}, {}", r, g, b),
        }
    }
}

// Option enum (no null in Rust)
fn divide(a: f64, b: f64) -> Option<f64> {
    if b == 0.0 {
        None
    } else {
        Some(a / b)
    }
}

// Result enum (error handling)
fn parse_number(s: &str) -> Result<i32, std::num::ParseIntError> {
    s.parse()
}

fn main() {
    // Option handling
    let result = divide(10.0, 2.0);
    match result {
        Some(value) => println!("Result: {}", value),
        None => println!("Cannot divide by zero"),
    }
    
    // Unwrap (panics if None/Err)
    let value = divide(10.0, 2.0).unwrap();
    
    // Unwrap with default
    let value = divide(10.0, 0.0).unwrap_or(0.0);
    
    // ? operator (propagate errors)
    fn calculate() -> Result<i32, std::num::ParseIntError> {
        let num = "42".parse::<i32>()?;  // Returns Err if fails
        Ok(num * 2)
    }
}
```

---

## Error Handling

```rust
use std::fs::File;
use std::io::{self, Read};

// Recoverable errors with Result
fn read_file(path: &str) -> Result<String, io::Error> {
    let mut file = File::open(path)?;  // ? propagates error
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}

// Chaining with ?
fn read_file_short(path: &str) -> Result<String, io::Error> {
    std::fs::read_to_string(path)
}

// Custom error types
#[derive(Debug)]
enum AppError {
    IoError(io::Error),
    ParseError(String),
    NotFound,
}

impl From<io::Error> for AppError {
    fn from(err: io::Error) -> AppError {
        AppError::IoError(err)
    }
}

fn main() {
    // Handle result
    match read_file("hello.txt") {
        Ok(contents) => println!("{}", contents),
        Err(e) => eprintln!("Error: {}", e),
    }
    
    // Panic for unrecoverable errors
    // panic!("crash and burn");
    
    // Unwrap (panics on error) - OK in tests, avoid in production
    let file = File::open("hello.txt").unwrap();
    
    // Expect (panics with message)
    let file = File::open("hello.txt").expect("Failed to open file");
}
```

---

## Traits

```rust
// Define trait
trait Summary {
    fn summarize(&self) -> String;
    
    // Default implementation
    fn preview(&self) -> String {
        format!("Read more: {}", self.summarize())
    }
}

struct Article {
    title: String,
    author: String,
    content: String,
}

struct Tweet {
    username: String,
    content: String,
}

// Implement trait for struct
impl Summary for Article {
    fn summarize(&self) -> String {
        format!("{} by {}", self.title, self.author)
    }
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("@{}: {}", self.username, self.content)
    }
}

// Trait as parameter
fn notify(item: &impl Summary) {
    println!("Breaking: {}", item.summarize());
}

// Trait bound syntax
fn notify_generic<T: Summary>(item: &T) {
    println!("Breaking: {}", item.summarize());
}

// Multiple trait bounds
fn notify_multiple<T: Summary + Clone>(item: &T) { }

// Where clause
fn some_function<T, U>(t: &T, u: &U)
where
    T: Summary + Clone,
    U: Summary,
{ }

// Return type implementing trait
fn create_summary() -> impl Summary {
    Tweet {
        username: String::from("horse"),
        content: String::from("neigh"),
    }
}
```

---

## Concurrency

### Threads

```rust
use std::thread;
use std::time::Duration;

fn main() {
    // Spawn thread
    let handle = thread::spawn(|| {
        for i in 1..10 {
            println!("hi number {} from spawned thread", i);
            thread::sleep(Duration::from_millis(1));
        }
    });
    
    // Main thread work
    for i in 1..5 {
        println!("hi number {} from main thread", i);
        thread::sleep(Duration::from_millis(1));
    }
    
    // Wait for thread to finish
    handle.join().unwrap();
    
    // Move ownership to thread
    let v = vec![1, 2, 3];
    let handle = thread::spawn(move || {
        println!("Here's a vector: {:?}", v);
    });
    handle.join().unwrap();
}
```

### Channels

```rust
use std::sync::mpsc;  // Multiple producer, single consumer
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();
    
    // Clone for multiple producers
    let tx1 = tx.clone();
    
    thread::spawn(move || {
        tx.send(String::from("hello")).unwrap();
    });
    
    thread::spawn(move || {
        tx1.send(String::from("world")).unwrap();
    });
    
    // Receive
    for received in rx {
        println!("Got: {}", received);
    }
}
```

### Mutex and Arc

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // Arc = Atomic Reference Counting (thread-safe Rc)
    // Mutex = Mutual exclusion
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];
    
    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    println!("Result: {}", *counter.lock().unwrap());
}
```

---

## Async/Await

```rust
use tokio;

// Async function
async fn fetch_data() -> String {
    // Simulated async operation
    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
    String::from("data")
}

async fn process() {
    let data = fetch_data().await;
    println!("{}", data);
}

#[tokio::main]
async fn main() {
    // Run async function
    process().await;
    
    // Concurrent execution
    let (result1, result2) = tokio::join!(
        fetch_data(),
        fetch_data()
    );
    
    // Spawn task
    let handle = tokio::spawn(async {
        fetch_data().await
    });
    let result = handle.await.unwrap();
}
```

---

## Interview Questions

**Q: What is ownership in Rust?**

A: Ownership is Rust's memory management system enforced at compile time. Each value has exactly one owner. When the owner goes out of scope, the value is dropped (memory freed). Assignment moves ownership for heap data. This prevents double-free bugs and dangling pointers without garbage collection.

**Q: Explain borrowing and references.**

A: Borrowing lets you access data without taking ownership. Immutable references (`&T`) allow reading; mutable references (`&mut T`) allow modification. Rules: you can have either one mutable reference OR any number of immutable references, and references must always be valid. This prevents data races at compile time.

**Q: What are lifetimes?**

A: Lifetimes are compile-time annotations ensuring references don't outlive the data they point to. Written as `'a`. The compiler usually infers them, but explicit annotations are needed when returning references or storing them in structs. They prevent dangling pointer bugs.

**Q: What's the difference between String and &str?**

A: `String` is an owned, heap-allocated, growable string. `&str` is a string slice—a reference to string data (either in the binary or part of a String). Use `&str` for function parameters (more flexible), `String` when you need ownership or mutation.

**Q: How does Rust handle null?**

A: Rust has no null. Instead, use `Option<T>` which is either `Some(value)` or `None`. The compiler forces you to handle both cases, preventing null pointer exceptions. Use pattern matching, `unwrap()`, `unwrap_or()`, or the `?` operator.

**Q: Explain Result and error handling.**

A: `Result<T, E>` represents either success (`Ok(T)`) or failure (`Err(E)`). The `?` operator propagates errors to the caller. `unwrap()` panics on error. Use `match` for explicit handling. This makes error handling explicit and type-safe, unlike exceptions.

---

## Practice Project

Build a CLI tool in Rust:

**Requirements:**
1. Parse command-line arguments (clap)
2. Read/write files
3. HTTP requests (reqwest)
4. JSON parsing (serde)
5. Concurrent processing
6. Error handling with custom error types
7. Unit tests

---

## Resources

- https://doc.rust-lang.org/book/ (The Rust Book)
- https://doc.rust-lang.org/rust-by-example/ (Rust by Example)
- https://rustlings.cool/ (Interactive exercises)
- https://crates.io/ (Package registry)
