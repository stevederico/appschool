Fair enough! Let's reset. You're essentially learning this fresh — with the advantage that concepts will click faster once you see them.

Let me walk you through the full hour, section by section, with real explanations rather than assuming you remember.

---

# Section 1: Swift Core (15 min)

## 1.1 Value vs Reference

Swift has two fundamental kinds of types:

**Value types (struct, enum)** — when you assign to a new variable, you get a *copy*. Changes to one don't affect the other.

```swift
struct Point { var x: Int }
var a = Point(x: 5)
var b = a        // b is now a COPY of a
b.x = 10         // only b changes
print(a.x)       // still 5
```

**Reference types (class)** — when you assign to a new variable, both variables point to the *same object* in memory.

```swift
class Node { var x = 5 }
let n1 = Node()
let n2 = n1      // n2 points to the SAME object
n2.x = 10        // changes the shared object
print(n1.x)      // now 10
```

**When to use which:** Default to structs. Use classes when you need identity (this specific instance matters), inheritance, or Objective-C interop.

---

## 1.2 Optionals

Swift's way of handling "this might not have a value." Other languages use null and crash at runtime. Swift makes you handle it at compile time.

```swift
var name: String? = nil   // The ? means "might be nil"
```

Four ways to work with optionals:

```swift
// 1. if-let: unwrap and use inside the braces
if let name = name {
    print(name)  // only runs if name isn't nil
}

// 2. guard-let: unwrap or exit early
guard let name = name else { return }
print(name)  // name is now unwrapped for rest of function

// 3. nil coalescing: provide a default
let display = name ?? "Anonymous"

// 4. optional chaining: safely access properties
let count = name?.count  // returns Int? (nil if name is nil)
```

---

## 1.3 Closures & Memory

A closure is just an inline function you can pass around:

```swift
let greet = { (name: String) in
    print("Hello \(name)")
}
greet("Steve")
```

**The problem:** Closures *capture* variables from their surrounding scope. When a closure captures `self`, you can create a retain cycle.

**What's a retain cycle?** Swift uses ARC (Automatic Reference Counting) to manage memory. Each object has a count of how many things reference it. When the count hits zero, it's deallocated.

A retain cycle happens when two objects hold strong references to each other — neither count ever hits zero, so neither is ever freed. Memory leak.

```swift
class ViewController {
    var handler: (() -> Void)?
    
    func setup() {
        // BAD: closure captures self strongly
        // self -> handler -> closure -> self (cycle!)
        handler = {
            self.doSomething()
        }
    }
}
```

**The fix:** Use `[weak self]` to break the cycle:

```swift
handler = { [weak self] in
    guard let self else { return }  // self might be nil
    self.doSomething()
}
```

**weak vs unowned:**
- `weak` — becomes nil if the object is deallocated (safer)
- `unowned` — crashes if the object is deallocated (use only when you're certain it won't be)

**@escaping:** A closure is "escaping" if it's stored or called after the function returns. The compiler makes you mark these explicitly.

```swift
func doLater(completion: @escaping () -> Void) {
    DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
        completion()  // called after doLater returns
    }
}
```

---

## 1.4 Protocols & Generics

**Protocols** define a contract — "any type that conforms must have these properties/methods":

```swift
protocol Identifiable {
    var id: String { get }
}

struct User: Identifiable {
    var id: String  // must provide this
}
```

You can add default implementations via extensions:

```swift
extension Identifiable {
    func describe() -> String { 
        return "ID: \(id)" 
    }
}
// Now ALL Identifiable types get describe() for free
```

**Generics** let you write flexible, reusable code:

```swift
func findFirst<T: Collection>(in collection: T) -> T.Element? {
    return collection.first
}
// Works with Array, Set, any Collection
```

**`some` vs `any`** (newer Swift):
- `some Identifiable` — "one specific type that conforms" (compiler knows which, better performance)
- `any Identifiable` — "any type that conforms" (type-erased, flexible but slower)

---

# Section 2: Modern Concurrency (15 min)

This is the biggest change since you were last coding. It replaces completion handlers and much of GCD.

## 2.1 async/await

**The old way** — completion handlers, nested callbacks:

```swift
func fetchUser(completion: @escaping (Result<User, Error>) -> Void) {
    URLSession.shared.dataTask(with: url) { data, response, error in
        if let error = error {
            completion(.failure(error))
            return
        }
        // decode data...
        completion(.success(user))
    }.resume()
}

// Using it:
fetchUser { result in
    switch result {
    case .success(let user):
        fetchPosts(for: user) { result in
            // more nesting...
        }
    case .failure(let error):
        // handle error
    }
}
```

**The new way** — async/await:

```swift
func fetchUser() async throws -> User {
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode(User.self, from: data)
}

// Using it:
let user = try await fetchUser()
let posts = try await fetchPosts(for: user)
// Linear! Readable!
```

**Key concepts:**
- `async` marks a function that can suspend
- `await` marks where you're calling an async function (potential suspension point)
- `throws` / `try` work the same as before, just combined with async

**To call async code from non-async context**, wrap it in a Task:

```swift
Task {
    let user = try await fetchUser()
    print(user)
}
```

**Important:** `await` doesn't block the thread. It *suspends* — the thread is freed to do other work. When the result is ready, execution resumes.

---

## 2.2 Parallel Execution

Sequential (one after another):
```swift
let user = try await fetchUser()     // wait...
let posts = try await fetchPosts()   // then wait...
```

**Parallel with async let** (when you know exactly what to fetch):

```swift
async let user = fetchUser()    // starts immediately
async let posts = fetchPosts()  // starts immediately, in parallel

let (u, p) = try await (user, posts)  // wait for both
```

**Parallel with TaskGroup** (dynamic number of tasks):

```swift
let users = try await withThrowingTaskGroup(of: User.self) { group in
    for id in userIds {
        group.addTask {
            try await fetchUser(id: id)
        }
    }
    
    var results: [User] = []
    for try await user in group {
        results.append(user)
    }
    return results
}
```

---

## 2.3 Actors & @MainActor

**The problem:** Multiple tasks accessing the same mutable data causes data races (unpredictable bugs).

**Actors** solve this. An actor is like a class, but Swift guarantees only one task can access its mutable state at a time:

```swift
actor Counter {
    private var value = 0
    
    func increment() {
        value += 1  // safe, no race conditions
    }
    
    func getValue() -> Int {
        return value
    }
}
```

When you call an actor's methods from outside, you must `await`:

```swift
let counter = Counter()
await counter.increment()  // must await
let value = await counter.getValue()
```

**@MainActor** is a special actor that guarantees code runs on the main thread. Essential for UI:

```swift
@MainActor
class ViewModel: ObservableObject {
    @Published var items: [Item] = []  // UI state
    
    func load() async {
        let fetched = await api.fetchItems()
        items = fetched  // guaranteed main thread
    }
}
```

---

## 2.4 Sendable

**Sendable** means "safe to pass between concurrent tasks."

Value types (struct, enum) are usually automatically Sendable because they're copied:

```swift
struct User: Sendable {
    let id: Int
    let name: String
}
```

Classes are trickier — they're only Sendable if they're `final` and all properties are immutable (`let`):

```swift
final class Config: Sendable {
    let apiKey: String  // immutable, safe
    init(apiKey: String) { self.apiKey = apiKey }
}
```

**Bridging old callback APIs to async** — use continuations:

```swift
func modernFetch() async throws -> Data {
    try await withCheckedThrowingContinuation { continuation in
        oldCallbackAPI { result, error in
            if let error = error {
                continuation.resume(throwing: error)
            } else {
                continuation.resume(returning: result!)
            }
            // IMPORTANT: must call resume exactly ONCE
        }
    }
}
```

---

# Section 3: Combine & APIs (10 min)

## 3.1 Combine Essentials

Combine is Apple's framework for reactive programming — handling values that change over time.

**Core concept:** Publisher → Operators → Subscriber

```swift
// A Publisher emits values over time
// Operators transform those values
// A Subscriber receives the final values

$searchText                    // Publisher: emits when text changes
    .debounce(for: .milliseconds(300), scheduler: RunLoop.main)  // wait for typing to pause
    .removeDuplicates()        // ignore if same as last
    .flatMap { query in        // for each value, start a new publisher
        searchService.search(query)
    }
    .receive(on: DispatchQueue.main)  // ensure main thread
    .sink { [weak self] results in    // subscriber: do something with results
        self?.results = results
    }
    .store(in: &cancellables)  // MUST store or subscription immediately dies
```

**The `$` prefix** accesses a `@Published` property's publisher.

**When to use Combine vs async/await:**
- Combine: streams of values over time, debouncing, throttling, combining multiple streams
- async/await: single request → single response

---

## 3.2 API Patterns

**Basic generic fetch:**

```swift
func fetch<T: Decodable>(from url: URL) async throws -> T {
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode(T.self, from: data)
}

// Usage:
let user: User = try await fetch(from: userURL)
```

**Retry with exponential backoff:**

```swift
func withRetry<T>(
    attempts: Int = 3,
    operation: () async throws -> T
) async throws -> T {
    var delay = 1.0
    for attempt in 1...attempts {
        do {
            return try await operation()
        } catch {
            if attempt == attempts { throw error }
            try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            delay *= 2  // 1s, 2s, 4s...
        }
    }
    fatalError("Unreachable")
}
```

**Streaming (for AI APIs, server-sent events):**

```swift
func streamEvents(from url: URL) -> AsyncThrowingStream<Event, Error> {
    AsyncThrowingStream { continuation in
        Task {
            let (bytes, _) = try await URLSession.shared.bytes(from: url)
            for try await line in bytes.lines {
                if let event = parseEvent(line) {
                    continuation.yield(event)
                }
            }
            continuation.finish()
        }
    }
}

// Usage:
for try await event in streamEvents(from: url) {
    print(event)
}
```

---

# Section 4: SwiftUI (10 min)

## 4.1 State Management

**This is the #1 interview topic for SwiftUI.** You must know which wrapper to use when.

### @State — view owns a value type

```swift
struct CounterView: View {
    @State private var count = 0  // view owns this
    
    var body: some View {
        Button("Count: \(count)") {
            count += 1
        }
    }
}
```

### @Binding — child modifies parent's state

```swift
struct ParentView: View {
    @State private var isOn = false
    
    var body: some View {
        ChildView(isOn: $isOn)  // pass binding with $
    }
}

struct ChildView: View {
    @Binding var isOn: Bool  // doesn't own it, just modifies it
    
    var body: some View {
        Toggle("Setting", isOn: $isOn)
    }
}
```

### @StateObject — view creates and owns a reference type

```swift
class ViewModel: ObservableObject {
    @Published var items: [String] = []
}

struct MyView: View {
    @StateObject private var vm = ViewModel()  // created once, survives re-renders
    
    var body: some View {
        List(vm.items, id: \.self) { Text($0) }
    }
}
```

### @ObservedObject — view receives an already-created reference type

```swift
struct ChildView: View {
    @ObservedObject var vm: ViewModel  // passed in, not created here
    
    var body: some View {
        List(vm.items, id: \.self) { Text($0) }
    }
}
```

### **The critical mistake:**

```swift
// WRONG - vm is recreated every time view re-renders!
struct BadView: View {
    @ObservedObject var vm = ViewModel()  // NO!
}

// RIGHT - vm created once and persisted
struct GoodView: View {
    @StateObject var vm = ViewModel()  // YES
}
```

### Quick reference:

| Wrapper | Owns it? | Type | Use case |
|---------|----------|------|----------|
| @State | Yes | Value | Simple local state (Int, Bool, String) |
| @Binding | No | Value | Child modifies parent's value |
| @StateObject | Yes | ObservableObject | View creates the object |
| @ObservedObject | No | ObservableObject | Object passed in from parent |

### iOS 17+ simplification with @Observable:

```swift
@Observable  // new macro
class ViewModel {
    var items: [String] = []  // no @Published needed
}

struct MyView: View {
    @State private var vm = ViewModel()  // use @State, not @StateObject
}
```

---

## 4.2 Navigation & Async

**Modern navigation (iOS 16+):**

```swift
struct ContentView: View {
    @State private var path = NavigationPath()
    @State private var items: [Item] = []
    
    var body: some View {
        NavigationStack(path: $path) {
            List(items) { item in
                NavigationLink(value: item) {
                    Text(item.name)
                }
            }
            .navigationDestination(for: Item.self) { item in
                DetailView(item: item)
            }
            .task {
                // runs when view appears, auto-cancels on disappear
                items = try await api.fetchItems()
            }
            .refreshable {
                // pull-to-refresh
                items = try await api.fetchItems()
            }
        }
    }
}
```

**UIKit interop:**
- `UIViewRepresentable` — wrap a UIKit view for use in SwiftUI
- `UIViewControllerRepresentable` — wrap a UIKit view controller
- Use a `Coordinator` class to handle delegates

---

# Section 5: UIKit Modern (5 min)

## 5.1 Diffable Data Source

**Old way:** Manually call `insertRows`, `deleteRows`, manage index paths, easy to crash.

**New way:** Declare the state you want, framework figures out the diff and animates.

```swift
// 1. Create the data source
var dataSource: UITableViewDiffableDataSource<Section, Item>!

dataSource = UITableViewDiffableDataSource(tableView: tableView) { 
    tableView, indexPath, item in
    let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexPath)
    cell.textLabel?.text = item.name
    return cell
}

// 2. Apply snapshots to update
var snapshot = NSDiffableDataSourceSnapshot<Section, Item>()
snapshot.appendSections([.main])
snapshot.appendItems(items)
dataSource.apply(snapshot, animatingDifferences: true)
```

## Compositional Layout

Declaratively build complex collection view layouts:

```swift
let layout = UICollectionViewCompositionalLayout { sectionIndex, environment in
    // Item: 50% width, full height of group
    let item = NSCollectionLayoutItem(layoutSize: NSCollectionLayoutSize(
        widthDimension: .fractionalWidth(0.5),
        heightDimension: .fractionalHeight(1.0)
    ))
    
    // Group: full width, 100pt tall, contains items
    let group = NSCollectionLayoutGroup.horizontal(
        layoutSize: NSCollectionLayoutSize(
            widthDimension: .fractionalWidth(1.0),
            heightDimension: .absolute(100)
        ),
        subitems: [item]
    )
    
    return NSCollectionLayoutSection(group: group)
}
```

## Content Configuration

Replaces the old `cell.textLabel`, `cell.imageView` pattern:

```swift
var config = UIListContentConfiguration.cell()
config.text = "Title"
config.secondaryText = "Subtitle"
config.image = UIImage(systemName: "star")
cell.contentConfiguration = config
```

---

# Section 6: Rapid Fire Q&A (5 min)

Memorize these:

**struct vs class?**
Struct = value type, copied on assignment. Class = reference type, shared. Default to struct.

**What's a retain cycle?**
Two objects strongly referencing each other. Neither can be deallocated. Memory leak.

**weak vs unowned?**
weak = optional, becomes nil safely. unowned = non-optional, crashes if object gone.

**What's @escaping?**
Marks a closure that outlives the function call — stored or called later.

**async/await vs callbacks?**
async/await = linear code, compiler-checked errors. Callbacks = nested, manual error handling.

**What's an actor?**
Reference type with isolated state. Only one task can access at a time. Prevents data races.

**What's @MainActor?**
Guarantees code runs on main thread. Use for all UI code.

**What's Sendable?**
Protocol marking types safe to pass across concurrency boundaries.

**@State vs @StateObject?**
@State = value types. @StateObject = reference types the view creates.

**@StateObject vs @ObservedObject?**
@StateObject = view creates it (stable). @ObservedObject = passed in from elsewhere.

**map vs compactMap?**
map transforms every element. compactMap transforms and removes nils.

**What's a diffable data source?**
Declare desired state via snapshots. Framework computes diff and animates changes automatically.

**How do you bridge callbacks to async?**
withCheckedContinuation or withCheckedThrowingContinuation. Call resume exactly once.

---

# Priority If You're Short on Time

1. **Section 2 (Concurrency)** — completely new since 2020
2. **Section 4.1 (State wrappers)** — memorize that table
3. **Section 1.3 (Closures/memory)** — retain cycles always asked
4. **Section 6 (Rapid fire)** — practice saying answers aloud

---

That's the full hour. Want me to quiz you on any section, or dive deeper into something that's not clicking?