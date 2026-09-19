# Swift Concurrency & Combine: Interview-Ready Guide

## Part 1: Modern Swift Concurrency

### The Foundation: async/await

Swift's concurrency model replaced completion handlers with structured, readable code.

```swift
// Old way (completion handlers)
func fetchUser(id: String, completion: @escaping (Result<User, Error>) -> Void) {
    URLSession.shared.dataTask(with: url) { data, _, error in
        // callback hell begins...
    }.resume()
}

// Modern way (async/await)
func fetchUser(id: String) async throws -> User {
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode(User.self, from: data)
}

// Calling async code
Task {
    do {
        let user = try await fetchUser(id: "123")
        // Use user directly - no nested closures
    } catch {
        // Handle error
    }
}
```

**Key interview points:**
- `async` marks a function as asynchronous
- `await` suspends execution until the async operation completes
- The thread is freed during suspension (not blocked)
- Errors propagate naturally with `throws`

---

### Tasks: Units of Asynchronous Work

```swift
// Unstructured Task - runs independently
Task {
    await doSomething()
}

// Detached Task - no inherited context (rare, avoid usually)
Task.detached {
    await doSomething()
}

// Task with priority
Task(priority: .userInitiated) {
    await loadCriticalData()
}

// Cancellation
let task = Task {
    for i in 0..<1000 {
        try Task.checkCancellation() // Throws if cancelled
        await process(item: i)
    }
}
task.cancel() // Request cancellation
```

**Task priorities:** `.userInitiated` > `.medium` (default) > `.utility` > `.background`

---

### Structured Concurrency: TaskGroup & async let

**async let** - Run fixed number of tasks concurrently:

```swift
func loadDashboard() async throws -> Dashboard {
    async let user = fetchUser()
    async let posts = fetchPosts()
    async let notifications = fetchNotifications()
    
    // All three run concurrently, await collects results
    return try await Dashboard(
        user: user,
        posts: posts,
        notifications: notifications
    )
}
```

**TaskGroup** - Dynamic number of concurrent tasks:

```swift
func fetchAllImages(urls: [URL]) async throws -> [UIImage] {
    try await withThrowingTaskGroup(of: UIImage.self) { group in
        for url in urls {
            group.addTask {
                let (data, _) = try await URLSession.shared.data(from: url)
                return UIImage(data: data)!
            }
        }
        
        var images: [UIImage] = []
        for try await image in group {
            images.append(image)
        }
        return images
    }
}
```

---

### Actors: Safe Mutable State

Actors protect mutable state from data races. Only one task accesses an actor's state at a time.

```swift
actor BankAccount {
    private var balance: Double = 0
    
    func deposit(_ amount: Double) {
        balance += amount
    }
    
    func withdraw(_ amount: Double) throws -> Double {
        guard balance >= amount else {
            throw BankError.insufficientFunds
        }
        balance -= amount
        return amount
    }
    
    // nonisolated - no actor protection needed (immutable/computed)
    nonisolated var accountType: String { "Checking" }
}

// Usage - must await when crossing actor boundary
let account = BankAccount()
await account.deposit(100)
let cash = try await account.withdraw(50)
```

---

### MainActor: UI Thread Safety

```swift
// Entire class on main thread
@MainActor
class ProfileViewModel: ObservableObject {
    @Published var user: User?
    
    func loadUser() async {
        let user = await fetchUser() // Can call off-main
        self.user = user // Assignment happens on main
    }
}

// Single function/property
class DataService {
    @MainActor var displayName: String = ""
    
    @MainActor
    func updateUI() {
        // Guaranteed main thread
    }
}

// Explicit dispatch to main
Task { @MainActor in
    label.text = "Updated"
}
```

---

### Sendable: Thread-Safe Types

`Sendable` marks types safe to pass across concurrency boundaries.

```swift
// Value types are implicitly Sendable
struct Point: Sendable {
    let x: Double
    let y: Double
}

// Classes must be final with immutable stored properties
final class ImmutableConfig: Sendable {
    let apiKey: String
    let timeout: TimeInterval
    
    init(apiKey: String, timeout: TimeInterval) {
        self.apiKey = apiKey
        self.timeout = timeout
    }
}

// Or use @unchecked when you manage thread safety yourself
final class ThreadSafeCache: @unchecked Sendable {
    private let lock = NSLock()
    private var storage: [String: Any] = [:]
    
    func get(_ key: String) -> Any? {
        lock.lock()
        defer { lock.unlock() }
        return storage[key]
    }
}
```

---

### Continuations: Bridging Callback APIs

```swift
// Wrap callback-based API in async
func fetchLocation() async throws -> CLLocation {
    try await withCheckedThrowingContinuation { continuation in
        locationManager.requestLocation { result in
            switch result {
            case .success(let location):
                continuation.resume(returning: location)
            case .failure(let error):
                continuation.resume(throwing: error)
            }
        }
    }
}

// CRITICAL: Resume exactly once - never zero, never twice
```

---

## Part 2: Combine Framework

### Core Concepts

**Publisher** - Emits values over time
**Subscriber** - Receives and processes values
**Operator** - Transforms values between publisher and subscriber

```swift
// The data flow
Publisher → Operator → Operator → Subscriber
```

---

### Essential Publishers

```swift
// Just - single value then completes
Just("Hello")
    .sink { print($0) } // "Hello"

// Future - single async result
Future<User, Error> { promise in
    api.fetchUser { result in
        promise(result)
    }
}

// PassthroughSubject - imperative publishing
let subject = PassthroughSubject<String, Never>()
subject.send("Event 1")
subject.send("Event 2")
subject.send(completion: .finished)

// CurrentValueSubject - holds current value
let current = CurrentValueSubject<Int, Never>(0)
print(current.value) // 0
current.send(1)
print(current.value) // 1

// @Published - SwiftUI integration
class ViewModel: ObservableObject {
    @Published var searchText = ""
    @Published var results: [Item] = []
}
```

---

### Key Operators (Must Know)

**Transformation:**
```swift
[1, 2, 3].publisher
    .map { $0 * 2 }           // [2, 4, 6]
    .flatMap { fetchItem($0) } // Flattens nested publishers
    .compactMap { Int($0) }    // Unwraps optionals, drops nils
```

**Filtering:**
```swift
publisher
    .filter { $0 > 10 }
    .removeDuplicates()
    .first(where: { $0.isValid })
```

**Timing:**
```swift
searchText.publisher
    .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
    // Waits for 300ms of silence before emitting
    
publisher
    .throttle(for: .seconds(1), scheduler: RunLoop.main, latest: true)
    // At most one value per second
```

**Combining:**
```swift
// Wait for both, emit tuple
Publishers.CombineLatest(userPublisher, settingsPublisher)
    .sink { user, settings in }

// Merge multiple into one stream
Publishers.Merge(publisher1, publisher2)

// Zip - pairs values by index
Publishers.Zip(names, ages)
    .sink { name, age in }
```

**Error Handling:**
```swift
publisher
    .catch { error in Just(fallbackValue) }
    .replaceError(with: defaultValue)
    .retry(3) // Retry on failure
```

---

### Subscribers & Memory Management

```swift
class ViewModel {
    private var cancellables = Set<AnyCancellable>()
    
    func bind() {
        // .sink creates a subscription
        publisher
            .sink(
                receiveCompletion: { completion in
                    switch completion {
                    case .finished: print("Done")
                    case .failure(let error): print(error)
                    }
                },
                receiveValue: { value in
                    print(value)
                }
            )
            .store(in: &cancellables) // CRITICAL: Store to keep alive
        
        // .assign for direct property binding
        publisher
            .receive(on: DispatchQueue.main)
            .assign(to: \.title, on: self)
            .store(in: &cancellables)
        
        // Memory-safe assign to @Published
        $searchText
            .assign(to: &$results) // No retain cycle
    }
}
```

**Memory rules:**
- Store `AnyCancellable` or subscription dies immediately
- Use `[weak self]` in sink closures to avoid retain cycles
- `assign(to:)` with `&$property` is memory-safe

---

### Real-World Pattern: Search with Debounce

```swift
class SearchViewModel: ObservableObject {
    @Published var searchText = ""
    @Published var results: [SearchResult] = []
    @Published var isLoading = false
    
    private var cancellables = Set<AnyCancellable>()
    private let searchService: SearchService
    
    init(searchService: SearchService) {
        self.searchService = searchService
        setupBindings()
    }
    
    private func setupBindings() {
        $searchText
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .removeDuplicates()
            .filter { !$0.isEmpty }
            .handleEvents(receiveOutput: { [weak self] _ in
                self?.isLoading = true
            })
            .flatMap { [weak self] query -> AnyPublisher<[SearchResult], Never> in
                guard let self else { return Just([]).eraseToAnyPublisher() }
                return self.searchService.search(query)
                    .catch { _ in Just([]) }
                    .eraseToAnyPublisher()
            }
            .receive(on: DispatchQueue.main)
            .sink { [weak self] results in
                self?.results = results
                self?.isLoading = false
            }
            .store(in: &cancellables)
    }
}
```

---

### Schedulers

```swift
publisher
    .subscribe(on: DispatchQueue.global())  // Where work happens
    .receive(on: DispatchQueue.main)        // Where values delivered
    .sink { value in
        // This runs on main thread
    }
```

Common schedulers: `DispatchQueue.main`, `DispatchQueue.global()`, `RunLoop.main`, `ImmediateScheduler.shared`

---

## Part 3: Combine + async/await Integration

```swift
// Convert Publisher to async
let value = try await publisher.values.first(where: { _ in true })

// AsyncSequence from Publisher
for await value in publisher.values {
    print(value)
}

// Convert async to Publisher
func fetchUser() -> AnyPublisher<User, Error> {
    Future { promise in
        Task {
            do {
                let user = try await api.fetchUser()
                promise(.success(user))
            } catch {
                promise(.failure(error))
            }
        }
    }
    .eraseToAnyPublisher()
}
```

---

## Part 4: Common Interview Questions

**Q: When would you use Combine vs async/await?**

| Use Combine | Use async/await |
|------------|-----------------|
| Multiple values over time | Single async result |
| Reactive UI bindings | Sequential async operations |
| Complex event streams | Simple request/response |
| Time-based operations | Task cancellation needed |

**Q: How do you prevent data races?**
- Use actors for shared mutable state
- Mark types as `Sendable` when crossing boundaries
- Use `@MainActor` for UI updates
- Prefer value types (structs) over classes

**Q: What happens if you don't store AnyCancellable?**
The subscription is immediately cancelled and deallocated. No values will be received.

**Q: Explain structured vs unstructured concurrency**
- **Structured:** `async let`, `TaskGroup` - automatic cancellation propagation, clear parent-child relationship
- **Unstructured:** `Task { }` - independent lifecycle, must manage cancellation manually

**Q: How does actor reentrancy work?**
When an actor awaits, other tasks can run on that actor. State may change across await points.

```swift
actor Counter {
    var value = 0
    
    func increment() async {
        let current = value
        await Task.yield() // Other code might run here!
        value = current + 1 // Bug: value may have changed
    }
}
```

---

## Quick Reference Card

| Concept | Purpose |
|---------|---------|
| `async/await` | Sequential async code |
| `Task` | Unit of async work |
| `async let` | Concurrent child tasks |
| `TaskGroup` | Dynamic concurrent tasks |
| `Actor` | Thread-safe mutable state |
| `@MainActor` | Main thread guarantee |
| `Sendable` | Safe to cross boundaries |
| `Publisher` | Emits values over time |
| `Subscriber` | Receives values |
| `sink/assign` | Terminal subscribers |
| `AnyCancellable` | Subscription lifecycle |
| `debounce` | Wait for silence |
| `throttle` | Rate limit |
| `flatMap` | Async transformation |
| `combineLatest` | Merge latest values |

---

## Code Patterns to Memorize

**Pattern 1: ViewModel with async loading**
```swift
@MainActor
class ViewModel: ObservableObject {
    @Published var items: [Item] = []
    @Published var error: Error?
    
    func load() async {
        do {
            items = try await service.fetchItems()
        } catch {
            self.error = error
        }
    }
}
```

**Pattern 2: Combine search binding**
```swift
$searchText
    .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
    .removeDuplicates()
    .flatMap { query in searchService.search(query) }
    .receive(on: DispatchQueue.main)
    .assign(to: &$results)
```

**Pattern 3: Actor-protected cache**
```swift
actor ImageCache {
    private var cache: [URL: UIImage] = [:]
    
    func image(for url: URL) async throws -> UIImage {
        if let cached = cache[url] { return cached }
        let image = try await downloadImage(url)
        cache[url] = image
        return image
    }
}
```

Good luck with your interview!