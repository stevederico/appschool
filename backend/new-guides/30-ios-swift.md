# Swift Interview Guide
*60-Minute Review for iOS Developer Interviews*
- Swift Fundamentals (10 min) - value vs reference types, optionals, closures, properties
- Protocols & Generics (8 min) - associated types, constraints, some vs any
- Modern Concurrency (12 min) - async/await, actors, @MainActor, Sendable
- Memory Management (7 min) - ARC, retain cycles, weak vs unowned
- Error Handling (5 min) - throws, Result type, try variations
- Collections & Higher-Order Functions (5 min) - map, filter, reduce, compactMap
- Access Control (3 min) - the five levels
- Modern Swift Features (5 min) - Swift 5.9+ additions
- Common Interview Questions (5 min) - direct Q&A format
---

## 1. Swift Fundamentals (10 min)

### Value Types vs Reference Types

**Value types** (structs, enums, tuples) are copied on assignment. **Reference types** (classes) share the same instance.

```swift
struct Point { var x: Int }
var a = Point(x: 5)
var b = a        // b is a copy
b.x = 10         // a.x is still 5

class Node { var value: Int = 5 }
let n1 = Node()
let n2 = n1      // n2 points to same instance
n2.value = 10    // n1.value is now 10
```

**When to use which:** Default to structs. Use classes when you need identity, inheritance, or Objective-C interop.

### Optionals

```swift
var name: String? = nil

// Safe unwrapping
if let name = name { print(name) }
guard let name = name else { return }

// Nil coalescing
let displayName = name ?? "Anonymous"

// Optional chaining
let count = name?.count  // Int?

// Force unwrap (avoid unless certain)
let forced = name!
```

### Closures

```swift
// Full syntax
let add: (Int, Int) -> Int = { (a: Int, b: Int) -> Int in
    return a + b
}

// Shorthand
let multiply: (Int, Int) -> Int = { $0 * $1 }

// Trailing closure
numbers.map { $0 * 2 }

// Capturing values (watch for retain cycles)
class ViewController {
    var handler: (() -> Void)?
    
    func setup() {
        handler = { [weak self] in
            self?.doSomething()  // weak breaks cycle
        }
    }
}
```

**@escaping**: Closure outlives the function call (stored, async). Required annotation.

```swift
func fetch(completion: @escaping (Data) -> Void) {
    DispatchQueue.global().async {
        completion(Data())  // Called after fetch() returns
    }
}
```

### Properties

```swift
struct Temperature {
    var celsius: Double
    
    // Computed property
    var fahrenheit: Double {
        get { celsius * 9/5 + 32 }
        set { celsius = (newValue - 32) * 5/9 }
    }
    
    // Property observer
    var kelvin: Double = 0 {
        willSet { print("Will change to \(newValue)") }
        didSet { print("Changed from \(oldValue)") }
    }
    
    // Lazy (initialized on first access)
    lazy var expensiveCalculation: Double = {
        return celsius * 1000
    }()
}
```

---

## 2. Protocols & Generics (8 min)

### Protocol Fundamentals

```swift
protocol Identifiable {
    var id: String { get }
    func describe() -> String
}

// Protocol extension (default implementation)
extension Identifiable {
    func describe() -> String { "ID: \(id)" }
}

// Protocol composition
func process(item: Identifiable & Codable) { }
```

### Associated Types

```swift
protocol Container {
    associatedtype Item
    var items: [Item] { get }
    mutating func add(_ item: Item)
}

struct IntBox: Container {
    var items: [Int] = []
    mutating func add(_ item: Int) { items.append(item) }
}
```

### Generics

```swift
func swap<T>(_ a: inout T, _ b: inout T) {
    let temp = a; a = b; b = temp
}

// Constraints
func findIndex<T: Equatable>(of value: T, in array: [T]) -> Int? {
    array.firstIndex(of: value)
}

// where clause
func compare<T, U>(_ a: T, _ b: U) -> Bool 
    where T: Comparable, U: Comparable, T == U {
    return a == b
}
```

### some vs any (Opaque Types)

```swift
// 'some' - compiler knows concrete type, better performance
func makeCollection() -> some Collection { [1, 2, 3] }

// 'any' - existential, type-erased, runtime flexibility
func process(items: [any Identifiable]) { }
```

**Rule:** Use `some` when returning a single concrete type. Use `any` when storing heterogeneous types.

---

## 3. Modern Concurrency (12 min)

### async/await Basics

```swift
func fetchUser(id: Int) async throws -> User {
    let url = URL(string: "https://api.example.com/users/\(id)")!
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode(User.self, from: data)
}

// Calling async functions
Task {
    do {
        let user = try await fetchUser(id: 1)
        print(user.name)
    } catch {
        print(error)
    }
}
```

### Structured Concurrency

```swift
// Parallel execution with async let
async let user = fetchUser(id: 1)
async let posts = fetchPosts(userId: 1)
let (userData, userPosts) = try await (user, posts)

// Task groups for dynamic parallelism
func fetchAllUsers(ids: [Int]) async throws -> [User] {
    try await withThrowingTaskGroup(of: User.self) { group in
        for id in ids {
            group.addTask { try await fetchUser(id: id) }
        }
        var users: [User] = []
        for try await user in group {
            users.append(user)
        }
        return users
    }
}
```

### Actors

```swift
actor BankAccount {
    private var balance: Double = 0
    
    func deposit(_ amount: Double) {
        balance += amount
    }
    
    func getBalance() -> Double {
        balance  // Safe, isolated access
    }
}

// Usage requires await
let account = BankAccount()
await account.deposit(100)
let balance = await account.getBalance()
```

### @MainActor

```swift
@MainActor
class ViewModel: ObservableObject {
    @Published var data: [String] = []
    
    func loadData() async {
        let result = await fetchFromNetwork()
        data = result  // Safe, guaranteed main thread
    }
}

// Isolate specific function
nonisolated func backgroundWork() { }

@MainActor
func updateUI() { }
```

### Sendable

```swift
// Types safe to pass across concurrency boundaries
struct UserData: Sendable {
    let id: Int
    let name: String
}

// Classes must be final with immutable stored properties
final class ImmutableConfig: Sendable {
    let apiKey: String
    init(apiKey: String) { self.apiKey = apiKey }
}
```

### Task Cancellation

```swift
func fetchWithCancellation() async throws -> Data {
    try Task.checkCancellation()  // Throws if cancelled
    
    guard !Task.isCancelled else { return Data() }
    
    return try await URLSession.shared.data(from: url).0
}

let task = Task {
    try await fetchWithCancellation()
}
task.cancel()  // Request cancellation
```

---

## 4. Memory Management (7 min)

### ARC (Automatic Reference Counting)

Reference types have a reference count. When count reaches 0, memory is deallocated.

### Retain Cycles

```swift
class Person {
    var apartment: Apartment?
}

class Apartment {
    var tenant: Person?  // Strong reference cycle!
}

// Solution: weak or unowned
class Apartment {
    weak var tenant: Person?  // Breaks cycle, becomes nil
}
```

### weak vs unowned

| weak | unowned |
|------|---------|
| Optional type | Non-optional |
| Becomes nil when deallocated | Crashes if accessed after deallocation |
| Use when reference might become nil | Use when reference always outlives |

```swift
class Customer {
    var card: CreditCard?
}

class CreditCard {
    unowned let customer: Customer  // Card can't exist without customer
    init(customer: Customer) { self.customer = customer }
}
```

### Closure Capture Lists

```swift
class DataLoader {
    var onComplete: (() -> Void)?
    
    func load() {
        onComplete = { [weak self] in
            guard let self else { return }
            self.process()
        }
    }
    
    // Capturing specific values
    func capture() {
        let currentValue = self.value
        onComplete = { [currentValue] in  // Captures value, not self
            print(currentValue)
        }
    }
}
```

---

## 5. Error Handling (5 min)

### Throwing Functions

```swift
enum NetworkError: Error {
    case invalidURL
    case noData
    case decodingFailed(underlying: Error)
}

func fetch(urlString: String) throws -> Data {
    guard let url = URL(string: urlString) else {
        throw NetworkError.invalidURL
    }
    // ...
}
```

### Handling Errors

```swift
// do-catch
do {
    let data = try fetch(urlString: "...")
} catch NetworkError.invalidURL {
    print("Bad URL")
} catch {
    print("Other error: \(error)")
}

// try? - converts to optional
let data = try? fetch(urlString: "...")  // Data?

// try! - force (crashes on error)
let data = try! fetch(urlString: "...")
```

### Result Type

```swift
func fetch(completion: @escaping (Result<Data, NetworkError>) -> Void) {
    // ...
    completion(.success(data))
    // or
    completion(.failure(.noData))
}

// Handling
fetch { result in
    switch result {
    case .success(let data): process(data)
    case .failure(let error): handle(error)
    }
}
```

---

## 6. Collections & Higher-Order Functions (5 min)

```swift
let numbers = [1, 2, 3, 4, 5]

// map - transform each element
let doubled = numbers.map { $0 * 2 }  // [2, 4, 6, 8, 10]

// filter - keep elements matching predicate
let evens = numbers.filter { $0 % 2 == 0 }  // [2, 4]

// reduce - combine into single value
let sum = numbers.reduce(0, +)  // 15

// compactMap - transform + remove nils
let strings = ["1", "two", "3"]
let ints = strings.compactMap { Int($0) }  // [1, 3]

// flatMap - flatten nested collections
let nested = [[1, 2], [3, 4]]
let flat = nested.flatMap { $0 }  // [1, 2, 3, 4]

// Chaining
let result = numbers
    .filter { $0 > 2 }
    .map { $0 * 10 }
    .reduce(0, +)  // 120
```

---

## 7. Access Control (3 min)

| Level | Scope |
|-------|-------|
| `open` | Any module, can subclass/override |
| `public` | Any module, can't subclass outside |
| `internal` | Same module (default) |
| `fileprivate` | Same file |
| `private` | Same declaration + extensions in same file |

```swift
public class APIClient {
    private let apiKey: String
    fileprivate var cache: [String: Data] = [:]
    
    public init(apiKey: String) {
        self.apiKey = apiKey
    }
    
    internal func makeRequest() { }
}
```

---

## 8. Modern Swift Features (5 min)

### if/switch Expressions (Swift 5.9+)

```swift
let description = if count == 0 { "empty" } else { "has items" }

let size = switch count {
    case 0: "none"
    case 1...5: "small"
    default: "large"
}
```

### Macros (Swift 5.9+)

```swift
// Observable macro replaces ObservableObject boilerplate
@Observable
class ViewModel {
    var items: [String] = []  // Automatically observable
}
```

### Parameter Packs (Swift 5.9+)

```swift
func all<each T: Equatable>(equal pairs: repeat (each T, each T)) -> Bool {
    for pair in repeat each pairs {
        guard pair.0 == pair.1 else { return false }
    }
    return true
}
```

### Noncopyable Types (Swift 5.9+)

```swift
struct FileHandle: ~Copyable {
    private let fd: Int32
    
    consuming func close() {
        // Only callable once, consumes the value
    }
    
    deinit {
        // Cleanup
    }
}
```

---

## 9. Common Interview Questions (5 min)

**Q: Struct vs Class?**
Structs are value types (copied), classes are reference types (shared). Use structs by default; classes for identity, inheritance, or Objective-C interop.

**Q: What is a retain cycle and how do you prevent it?**
Two objects holding strong references to each other, preventing deallocation. Prevent with `weak` (optional, nil when deallocated) or `unowned` (non-optional, crashes if accessed after deallocation).

**Q: Explain async/await vs completion handlers.**
Async/await provides linear, readable code flow with compiler-enforced error handling. Completion handlers require manual error propagation and create "callback hell" with nested closures.

**Q: What's the difference between `map` and `compactMap`?**
`map` transforms every element. `compactMap` transforms and removes nil results.

**Q: How does ARC work?**
Objects have a reference count. It increments with strong references, decrements when references go out of scope. Zero count triggers deallocation.

**Q: What are actors?**
Reference types with built-in data isolation. All access to mutable state is serialized, preventing data races. Access from outside requires `await`.

**Q: Explain `@MainActor`.**
A global actor that ensures code runs on the main thread. Apply to classes, functions, or properties that must interact with UI.

**Q: What does `Sendable` mean?**
A protocol marking types safe to pass across concurrency boundaries. Value types are implicitly Sendable. Classes must be final with only immutable properties.

**Q: Difference between `some` and `any`?**
`some` is an opaque type - compiler knows the concrete type (better performance). `any` is existential - type-erased at runtime (more flexible, slower).

**Q: What is a protocol witness table?**
The mechanism Swift uses to achieve dynamic dispatch for protocol requirements. It's a lookup table mapping protocol methods to concrete implementations.

---

## Quick Reference Card

```
MEMORY
strong   - default, increases retain count
weak     - optional, nil when deallocated, no retain
unowned  - non-optional, crash if dangling, no retain

CLOSURES
@escaping    - survives function return
[weak self]  - capture list, prevents retain cycle
[unowned x]  - non-optional capture

CONCURRENCY
async/await  - structured async code
Task { }     - create unstructured async context
async let    - parallel child tasks
actor        - isolated mutable state
@MainActor   - main thread isolation
Sendable     - safe across boundaries

OPTIONALS
?   - optional type / optional chaining
!   - force unwrap / implicitly unwrapped
??  - nil coalescing
```

---

*Good luck with your interview!*