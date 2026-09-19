# iOS Advanced — 1 Hour Edition

Getting to 80% across the board.

Swift          [████████████████░░░░] 80%
SwiftUI        [████████████████░░░░] 80%
UIKit          [████████████████░░░░] 80%
Combine        [████████████████░░░░] 80%
API/AI         [████████████████░░░░] 80%

---

# Table of Contents

## 1. Swift Edge Cases (10 min)
- [1.1 Concurrency Pitfalls](#11-concurrency-pitfalls)
- [1.2 Memory Deep Dive](#12-memory-deep-dive)

## 2. SwiftUI Production (15 min)
- [2.1 Performance](#21-performance)
- [2.2 Custom Layouts](#22-custom-layouts)
- [2.3 Complex Navigation](#23-complex-navigation)
- [2.4 Testing SwiftUI](#24-testing-swiftui)

## 3. Combine Advanced (10 min)
- [3.1 Custom Publishers](#31-custom-publishers)
- [3.2 Schedulers](#32-schedulers)
- [3.3 Testing Combine](#33-testing-combine)

## 4. UIKit Polish (10 min)
- [4.1 Custom Transitions](#41-custom-transitions)
- [4.2 Advanced Gestures](#42-advanced-gestures)
- [4.3 Performance Profiling](#43-performance-profiling)

## 5. API Mastery (15 min)
- [5.1 Pagination Patterns](#51-pagination-patterns)
- [5.2 gRPC Basics](#52-grpc-basics)
- [5.3 AI Integration](#53-ai-integration)
- [5.4 Full Offline Sync](#54-full-offline-sync)

---

# 1. Swift Edge Cases (10 min)

## 1.1 Concurrency Pitfalls

### Actor Reentrancy

Actors protect state, but `await` creates suspension points where other calls can slip in.

```swift
actor BankAccount {
    var balance = 100
    
    func withdraw(_ amount: Int) async -> Bool {
        guard balance >= amount else { return false }
        await someSlowOperation()  // DANGER: balance can change here
        balance -= amount  // Might overdraw!
        return true
    }
}
```

Between the check and the subtraction, another task could withdraw. Fix: do all state changes without suspension points, or re-check after awaiting.

---

### Task Cancellation

Tasks can be cancelled. Your code should check and respond.

```swift
func fetchAllItems() async throws -> [Item] {
    var items: [Item] = []
    for id in ids {
        try Task.checkCancellation()  // Throws if cancelled
        items.append(try await fetchItem(id))
    }
    return items
}
```

Without checks, cancelled tasks keep running, wasting resources.

---

### MainActor Inheritance

Classes marked `@MainActor` make all methods main-thread. But subclasses inherit this. If you override in a subclass, it's also `@MainActor`.

Protocols with `@MainActor` requirements force conforming types onto main thread too. Be intentional about where you put it.

---

### Sendable Closures

Closures passed across concurrency boundaries must be `@Sendable`. This means they can't capture mutable state.

```swift
actor Worker {
    func process(_ work: @Sendable () -> Void) {
        // ...
    }
}

var counter = 0
worker.process {
    counter += 1  // ERROR: captures mutable variable
}
```

---

## 1.2 Memory Deep Dive

### Capture Lists Revisited

You know `[weak self]`. But you can capture other things too:

```swift
let multiplier = 5
let closure = { [multiplier] value in  // Captures current value of multiplier
    return value * multiplier
}
```

Capturing by value avoids retain cycles for value types and freezes the value at capture time.

---

### Unowned Optional

`unowned` normally crashes if the object is deallocated. `unowned(unsafe)` skips the check — undefined behavior if wrong.

`unowned` with optionals exists too:

```swift
unowned(unsafe) var delegate: Delegate?
```

Rarely needed. Stick with `weak` unless you have specific performance requirements.

---

### Closure Capture Timing

Closures capture variables, not values (unless you use a capture list):

```swift
var value = 1
let closure = { print(value) }
value = 2
closure()  // Prints 2, not 1
```

With capture list:

```swift
var value = 1
let closure = { [value] in print(value) }
value = 2
closure()  // Prints 1
```

---

# 2. SwiftUI Production (15 min)

## 2.1 Performance

### Avoiding Unnecessary Redraws

`body` runs whenever state changes. If parent state changes, children re-run too — even if their data didn't change.

**Fix 1: Extract views**

```swift
// Bad: entire body reruns when unrelatedState changes
var body: some View {
    VStack {
        Text("Static content")
        ExpensiveView(data: data)
        Text("Unrelated: \(unrelatedState)")
    }
}

// Good: ExpensiveView only reruns when data changes
struct ExpensiveView: View {
    let data: Data  // Only rerenders when data changes
    var body: some View { ... }
}
```

**Fix 2: Equatable conformance**

```swift
struct ItemView: View, Equatable {
    let item: Item
    
    static func == (lhs: ItemView, rhs: ItemView) -> Bool {
        lhs.item.id == rhs.item.id  // Custom equality check
    }
    
    var body: some View { ... }
}

// Use with .equatable()
ItemView(item: item).equatable()
```

---

### Lazy Loading

`LazyVStack` and `LazyHStack` only create views when visible.

```swift
ScrollView {
    LazyVStack {  // Views created on-demand as you scroll
        ForEach(items) { item in
            ItemView(item: item)
        }
    }
}
```

Regular `VStack` creates all views immediately — bad for long lists.

---

### Identifiable Performance

`ForEach` diffs by ID. If IDs are stable, SwiftUI reuses views. If IDs change unnecessarily, views are recreated.

Bad: Using array index as ID.
Good: Using stable, unique identifiers.

---

## 2.2 Custom Layouts

iOS 16+ lets you build custom layout containers.

```swift
struct RadialLayout: Layout {
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        // Return the size this layout needs
        proposal.replacingUnspecifiedDimensions()
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let radius = min(bounds.width, bounds.height) / 2
        let angle = 2 * .pi / CGFloat(subviews.count)
        
        for (index, subview) in subviews.enumerated() {
            let x = bounds.midX + radius * cos(angle * CGFloat(index))
            let y = bounds.midY + radius * sin(angle * CGFloat(index))
            subview.place(at: CGPoint(x: x, y: y), anchor: .center, proposal: .unspecified)
        }
    }
}
```

Usage:

```swift
RadialLayout {
    ForEach(0..<8) { i in
        Circle().frame(width: 40, height: 40)
    }
}
```

---

## 2.3 Complex Navigation

### NavigationPath for Type-Erased Navigation

```swift
@State private var path = NavigationPath()

NavigationStack(path: $path) {
    List {
        Button("Go to User") { path.append(User(id: 1)) }
        Button("Go to Settings") { path.append(Settings()) }
    }
    .navigationDestination(for: User.self) { UserView(user: $0) }
    .navigationDestination(for: Settings.self) { SettingsView() }
}
```

`NavigationPath` holds any `Hashable` type. You can push different types onto the same stack.

---

### Deep Linking

Restore navigation state from a URL:

```swift
func handleDeepLink(_ url: URL) {
    guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return }
    
    path.removeLast(path.count)  // Clear stack
    
    if components.path == "/user" {
        if let id = components.queryItems?.first(where: { $0.name == "id" })?.value {
            path.append(User(id: Int(id)!))
        }
    }
}
```

---

### Coordinator Pattern

For complex flows, use a coordinator object:

```swift
@Observable
class AppCoordinator {
    var path = NavigationPath()
    
    func goToUser(_ id: Int) {
        path.append(User(id: id))
    }
    
    func goBack() {
        path.removeLast()
    }
    
    func goToRoot() {
        path.removeLast(path.count)
    }
}
```

Inject it via environment. Views call coordinator methods instead of manipulating path directly.

---

## 2.4 Testing SwiftUI

### Testing ViewModels

Don't test views directly. Test the view model logic:

```swift
@Observable
class CounterViewModel {
    var count = 0
    func increment() { count += 1 }
}

// Test
func testIncrement() {
    let vm = CounterViewModel()
    vm.increment()
    XCTAssertEqual(vm.count, 1)
}
```

---

### ViewInspector (Third Party)

Library that lets you inspect SwiftUI view hierarchies:

```swift
func testButtonExists() throws {
    let view = ContentView()
    let button = try view.inspect().find(button: "Tap me")
    XCTAssertNotNil(button)
}
```

---

### Snapshot Testing

Capture view as image, compare against reference:

```swift
func testViewSnapshot() {
    let view = MyView()
    let image = ImageRenderer(content: view).uiImage
    assertSnapshot(matching: image, as: .image)
}
```

Catches visual regressions. Fails if anything changes.

---

# 3. Combine Advanced (10 min)

## 3.1 Custom Publishers

When built-in publishers aren't enough, build your own.

Simplest approach: Use a `Deferred` with a `Future`:

```swift
func customPublisher() -> AnyPublisher<Int, Error> {
    Deferred {
        Future { promise in
            // Your async work
            promise(.success(42))
        }
    }.eraseToAnyPublisher()
}
```

---

### Full Custom Publisher

For complete control, implement `Publisher` protocol:

```swift
struct CountdownPublisher: Publisher {
    typealias Output = Int
    typealias Failure = Never
    
    let start: Int
    
    func receive<S: Subscriber>(subscriber: S) where S.Input == Int, S.Failure == Never {
        let subscription = CountdownSubscription(subscriber: subscriber, start: start)
        subscriber.receive(subscription: subscription)
    }
}
```

You also need a `Subscription` that manages the actual work and handles cancellation. This is advanced — usually unnecessary.

---

## 3.2 Schedulers

Schedulers control *where* and *when* work happens.

**Where:** Which thread/queue.
**When:** Immediately, delayed, or at intervals.

---

### Common Schedulers

`RunLoop.main` — main thread, integrates with UI events.

`DispatchQueue.main` — main thread, GCD-based.

`DispatchQueue.global()` — background thread.

`ImmediateScheduler.shared` — executes synchronously, useful for tests.

---

### receive(on:) vs subscribe(on:)

`receive(on:)` — downstream operators and subscriber run on this scheduler.

`subscribe(on:)` — upstream subscription and request happen on this scheduler.

```swift
publisher
    .subscribe(on: DispatchQueue.global())  // Work happens on background
    .receive(on: DispatchQueue.main)        // Results delivered on main
    .sink { value in
        // This runs on main thread
    }
```

Usually you only need `receive(on:)`.

---

## 3.3 Testing Combine

### Collecting Results

```swift
func testPublisher() {
    var results: [Int] = []
    let cancellable = publisher
        .sink { results.append($0) }
    
    // Trigger events...
    
    XCTAssertEqual(results, [1, 2, 3])
}
```

---

### Testing with Expectations

For async publishers:

```swift
func testAsyncPublisher() {
    let expectation = XCTestExpectation(description: "Received value")
    
    let cancellable = asyncPublisher
        .sink { value in
            XCTAssertEqual(value, expected)
            expectation.fulfill()
        }
    
    wait(for: [expectation], timeout: 1.0)
}
```

---

### Test Scheduler

Replace real schedulers with test schedulers to control time:

```swift
let scheduler = DispatchQueue.test  // From CombineSchedulers library

publisher
    .debounce(for: .seconds(1), scheduler: scheduler)
    .sink { ... }

scheduler.advance(by: .seconds(1))  // Manually advance time
```

No waiting. Tests run instantly.

---

# 4. UIKit Polish (10 min)

## 4.1 Custom Transitions

### UIViewControllerAnimatedTransitioning

Create custom present/dismiss animations:

```swift
class FadeTransition: NSObject, UIViewControllerAnimatedTransitioning {
    func transitionDuration(using context: UIViewControllerContextTransitioning?) -> TimeInterval {
        return 0.3
    }
    
    func animateTransition(using context: UIViewControllerContextTransitioning) {
        guard let toView = context.view(forKey: .to) else { return }
        
        let container = context.containerView
        toView.alpha = 0
        container.addSubview(toView)
        
        UIView.animate(withDuration: 0.3) {
            toView.alpha = 1
        } completion: { _ in
            context.completeTransition(!context.transitionWasCancelled)
        }
    }
}
```

---

### Using Custom Transitions

Set the transitioning delegate:

```swift
class MyViewController: UIViewController, UIViewControllerTransitioningDelegate {
    func presentDetail() {
        let detail = DetailViewController()
        detail.modalPresentationStyle = .custom
        detail.transitioningDelegate = self
        present(detail, animated: true)
    }
    
    func animationController(forPresented presented: UIViewController, presenting: UIViewController, source: UIViewController) -> UIViewControllerAnimatedTransitioning? {
        return FadeTransition()
    }
}
```

---

### Interactive Transitions

Make transitions gesture-driven with `UIPercentDrivenInteractiveTransition`:

```swift
let interactor = UIPercentDrivenInteractiveTransition()

// In pan gesture handler:
interactor.update(percent)  // 0.0 to 1.0
interactor.finish()         // Complete transition
interactor.cancel()         // Abort transition
```

---

## 4.2 Advanced Gestures

### Custom Gesture Recognizers

Subclass `UIGestureRecognizer`:

```swift
class TwoFingerTapGesture: UIGestureRecognizer {
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
        if touches.count == 2 {
            state = .recognized
        }
    }
}
```

Override `touchesBegan`, `touchesMoved`, `touchesEnded`, `touchesCancelled`.

Set `state` to `.began`, `.changed`, `.ended`, `.recognized`, `.failed`, `.cancelled`.

---

### Gesture Dependencies

Make one gesture wait for another to fail:

```swift
let singleTap = UITapGestureRecognizer(target: self, action: #selector(handleSingle))
let doubleTap = UITapGestureRecognizer(target: self, action: #selector(handleDouble))
doubleTap.numberOfTapsRequired = 2

singleTap.require(toFail: doubleTap)  // Single waits to see if it's actually a double
```

---

### Simultaneous Gestures

By default, only one gesture recognizes at a time. Allow simultaneous:

```swift
func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer) -> Bool {
    return true  // Allow both to fire
}
```

---

## 4.3 Performance Profiling

### Instruments

Xcode's profiling tool. Key templates:

**Time Profiler** — where CPU time is spent. Find slow functions.

**Allocations** — memory usage over time. Find leaks and bloat.

**Leaks** — specifically detects retain cycles.

**Core Animation** — frame rate, offscreen rendering, blending.

---

### Common Issues

**Offscreen rendering** — shadows, masks, corner radius on large views. GPU renders offscreen then composites. Fix: rasterize with `shouldRasterize = true` or use pre-rendered images.

**Blending** — transparent views over other views. GPU composites each frame. Fix: use opaque backgrounds where possible.

**Main thread work** — JSON parsing, image decoding on main thread. Fix: move to background queue.

---

### Quick Checks

```swift
// Show blended layers (simulator only)
// Debug → Color Blended Layers

// Show offscreen rendered
// Debug → Color Offscreen-Rendered

// Print frame rate
let displayLink = CADisplayLink(target: self, selector: #selector(tick))
displayLink.add(to: .main, forMode: .common)
```

---

# 5. API Mastery (15 min)

## 5.1 Pagination Patterns

### Cursor-Based Pagination

Server returns a cursor (opaque string) pointing to next page.

```swift
struct PagedResponse<T: Decodable>: Decodable {
    let items: [T]
    let nextCursor: String?
}

func fetchPage(cursor: String?) async throws -> PagedResponse<Item> {
    var url = baseURL
    if let cursor {
        url.append(queryItems: [URLQueryItem(name: "cursor", value: cursor)])
    }
    return try await client.request(url)
}
```

Keep calling with returned cursor until `nextCursor` is nil.

---

### Offset-Based Pagination

Request specific pages by offset and limit:

```swift
func fetchPage(offset: Int, limit: Int = 20) async throws -> [Item] {
    // GET /items?offset=40&limit=20
}
```

Simpler but problematic if items are added/deleted between pages.

---

### Infinite Scroll Implementation

```swift
@Observable
class ItemListViewModel {
    var items: [Item] = []
    var cursor: String?
    var isLoading = false
    var hasMore = true
    
    func loadMore() async {
        guard !isLoading, hasMore else { return }
        isLoading = true
        
        let response = try await fetchPage(cursor: cursor)
        items.append(contentsOf: response.items)
        cursor = response.nextCursor
        hasMore = response.nextCursor != nil
        
        isLoading = false
    }
}
```

In SwiftUI, trigger when last item appears:

```swift
ForEach(vm.items) { item in
    ItemRow(item: item)
        .onAppear {
            if item == vm.items.last {
                Task { await vm.loadMore() }
            }
        }
}
```

---

## 5.2 gRPC Basics

### What Is gRPC?

Alternative to REST. Uses Protocol Buffers (binary format) instead of JSON. Faster, strongly typed, supports streaming.

---

### Protocol Buffers

Define your API in `.proto` files:

```protobuf
syntax = "proto3";

message User {
    int32 id = 1;
    string name = 2;
}

service UserService {
    rpc GetUser(GetUserRequest) returns (User);
    rpc ListUsers(ListUsersRequest) returns (stream User);  // Server streaming
}
```

Generate Swift code with `protoc` compiler.

---

### Using grpc-swift

Apple's official library:

```swift
let channel = try GRPCChannelPool.with(target: .host("api.example.com", port: 443), transportSecurity: .tls, eventLoopGroup: group)

let client = UserServiceAsyncClient(channel: channel)

let request = GetUserRequest.with { $0.id = 123 }
let user = try await client.getUser(request)
```

---

### When to Use gRPC

- High-performance requirements
- Strongly-typed contracts
- Streaming data (server push, bidirectional)
- Microservice communication

REST is fine for most mobile apps. gRPC shines in performance-critical or streaming scenarios.

---

## 5.3 AI Integration

### Calling LLM APIs

Most AI APIs (Claude, OpenAI) use REST with streaming.

```swift
struct ChatRequest: Encodable {
    let model: String
    let messages: [Message]
    let stream: Bool
}

struct Message: Codable {
    let role: String  // "user" or "assistant"
    let content: String
}
```

---

### Streaming Responses

AI responses stream token-by-token via SSE:

```swift
func streamChat(messages: [Message]) -> AsyncThrowingStream<String, Error> {
    AsyncThrowingStream { continuation in
        Task {
            var request = URLRequest(url: apiURL)
            request.httpMethod = "POST"
            request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
            request.httpBody = try JSONEncoder().encode(ChatRequest(model: "claude-3", messages: messages, stream: true))
            
            let (bytes, _) = try await URLSession.shared.bytes(for: request)
            
            for try await line in bytes.lines {
                guard line.hasPrefix("data: ") else { continue }
                let json = String(line.dropFirst(6))
                if json == "[DONE]" { break }
                
                if let chunk = parseStreamChunk(json) {
                    continuation.yield(chunk.delta)
                }
            }
            continuation.finish()
        }
    }
}
```

---

### Managing Conversation History

AI is stateless. You send full conversation each request:

```swift
@Observable
class ChatViewModel {
    var messages: [Message] = []
    var currentResponse = ""
    
    func send(_ text: String) async {
        messages.append(Message(role: "user", content: text))
        currentResponse = ""
        
        for try await chunk in streamChat(messages: messages) {
            currentResponse += chunk
        }
        
        messages.append(Message(role: "assistant", content: currentResponse))
    }
}
```

---

### Token Limits

Models have context limits. Track tokens and truncate old messages if needed:

```swift
func trimToFit(messages: [Message], maxTokens: Int) -> [Message] {
    var total = 0
    var result: [Message] = []
    
    for message in messages.reversed() {
        let tokens = estimateTokens(message.content)
        if total + tokens > maxTokens { break }
        result.insert(message, at: 0)
        total += tokens
    }
    return result
}
```

---

## 5.4 Full Offline Sync

### The Challenge

User makes changes offline. Server has changes too. When reconnecting, merge without losing data.

---

### Timestamps vs Versions

**Timestamps:** Each record has `updatedAt`. Latest wins.
- Simple but clock skew can cause issues.

**Versions:** Each record has a version number. Increment on change.
- More reliable. Requires conflict resolution.

---

### Sync Algorithm

1. Track local changes (created, updated, deleted) since last sync
2. Send local changes to server
3. Server responds with conflicts and remote changes
4. Apply remote changes locally
5. Handle conflicts (last-write-wins, prompt user, or merge)
6. Update sync timestamp

---

### Change Tracking

```swift
struct SyncableItem: Codable {
    let id: UUID
    var content: String
    var updatedAt: Date
    var isDeleted: Bool
    var syncStatus: SyncStatus
}

enum SyncStatus: Codable {
    case synced
    case pendingUpload
    case pendingDelete
}
```

Mark items `pendingUpload` on local change. After successful sync, mark `synced`.

---

### Conflict Resolution Strategies

**Last-write-wins:** Compare timestamps, latest version survives. Data can be lost.

**Merge:** Combine changes field-by-field. Complex but preserves data.

**Prompt user:** Show both versions, let user choose. Best UX, most work.

For most apps, last-write-wins is acceptable. Critical data needs smarter merging.

---

# Priority Order (if < 1 hour)

1. **Section 2.1: SwiftUI Performance** — real apps need this
2. **Section 5.1: Pagination** — almost every app needs it
3. **Section 1.1: Concurrency Pitfalls** — avoid hard-to-debug bugs
4. **Section 5.3: AI Integration** — increasingly common requirement

---

# What's Still Missing for 100%

- Advanced debugging techniques
- App Store submission process
- Accessibility implementation
- Localization
- Push notifications
- Core Data / SwiftData
- Security best practices
- CI/CD pipelines

But at 80%, you're a strong hire. The rest comes on the job.

*Ship it.*