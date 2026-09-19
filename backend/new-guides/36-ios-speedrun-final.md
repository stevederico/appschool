# iOS Final 20% — Deep Cuts

The stuff you'll rarely need but might encounter. Reference material, not memorization.

---

# Table of Contents

## 1. Swift — The Last 20%
- [1.1 Macros](#11-macros)
- [1.2 Memory Layout](#12-memory-layout)
- [1.3 Concurrency Edge Cases](#13-concurrency-edge-cases)

## 2. SwiftUI — The Last 20%
- [2.1 Custom Drawing](#21-custom-drawing)
- [2.2 Advanced Animations](#22-advanced-animations)
- [2.3 Complex State Coordination](#23-complex-state-coordination)

## 3. UIKit — The Last 20%
- [3.1 Core Animation Deep Dive](#31-core-animation-deep-dive)
- [3.2 Custom Rendering](#32-custom-rendering)
- [3.3 Complex Gesture Systems](#33-complex-gesture-systems)

## 4. Combine — The Last 20%
- [4.1 Custom Publishers from Scratch](#41-custom-publishers-from-scratch)
- [4.2 Backpressure](#42-backpressure)
- [4.3 Complex Operator Chains](#43-complex-operator-chains)

## 5. API — The Last 20%
- [5.1 GraphQL](#51-graphql)
- [5.2 Advanced Caching](#52-advanced-caching)
- [5.3 Circuit Breakers](#53-circuit-breakers)

---

# 1. Swift — The Last 20%

## 1.1 Macros

Swift 5.9+. Code that writes code at compile time.

### What They Are

Macros transform your source code before compilation. You've used them: `@Observable`, `#Preview`.

### Two Types

**Freestanding** — start with `#`. Generate code in place.

```swift
let url = #URL("https://example.com")  // Validated at compile time
```

**Attached** — start with `@`. Modify declarations.

```swift
@Observable
class ViewModel {
    var count = 0  // Macro adds observation infrastructure
}
```

### Built-in Macros

- `@Observable` — auto-generates observation code
- `@Model` — SwiftData persistence
- `#Preview` — SwiftUI previews
- `#stringify` — turns code into string

### Writing Custom Macros

Requires a separate Swift package with macro implementations. Uses SwiftSyntax to parse and transform code.

```swift
@freestanding(expression)
macro stringify<T>(_ value: T) -> (T, String) = #externalMacro(module: "MyMacros", type: "StringifyMacro")
```

Complex. You'll use macros often, write them rarely.

---

## 1.2 Memory Layout

How Swift lays out types in memory.

### MemoryLayout

```swift
MemoryLayout<Int>.size       // 8 bytes
MemoryLayout<Int>.alignment  // 8 bytes
MemoryLayout<Int>.stride     // 8 bytes (including padding)
```

### Structs

Fields laid out in order, with padding for alignment:

```swift
struct Example {
    let a: Bool    // 1 byte
    // 7 bytes padding
    let b: Int     // 8 bytes (needs 8-byte alignment)
    let c: Bool    // 1 byte
    // 7 bytes padding
}
// Total: 24 bytes
```

Reorder for efficiency:

```swift
struct Example {
    let b: Int     // 8 bytes
    let a: Bool    // 1 byte
    let c: Bool    // 1 byte
    // 6 bytes padding
}
// Total: 16 bytes
```

### Copy-on-Write

Value types with heap storage (Array, String, Dictionary) use COW:

```swift
var a = [1, 2, 3]
var b = a          // No copy yet, shared storage
b.append(4)        // NOW it copies
```

Check uniqueness with `isKnownUniquelyReferenced`:

```swift
final class Storage<T> {
    var value: T
}

struct COWWrapper<T> {
    private var storage: Storage<T>
    
    var value: T {
        get { storage.value }
        set {
            if !isKnownUniquelyReferenced(&storage) {
                storage = Storage(value: newValue)
            } else {
                storage.value = newValue
            }
        }
    }
}
```

### Unsafe Pointers

Direct memory access when you need it:

```swift
let numbers = [1, 2, 3, 4, 5]
numbers.withUnsafeBufferPointer { buffer in
    // Direct pointer access
    for i in 0..<buffer.count {
        print(buffer[i])
    }
}
```

Types:
- `UnsafePointer<T>` — read-only
- `UnsafeMutablePointer<T>` — read-write
- `UnsafeRawPointer` — untyped bytes
- `UnsafeBufferPointer<T>` — contiguous collection

Use only when performance critical. Easy to crash or corrupt memory.

---

## 1.3 Concurrency Edge Cases

### Task Local Values

Thread-local storage for async contexts:

```swift
enum RequestContext {
    @TaskLocal static var requestID: String?
}

await RequestContext.$requestID.withValue("abc-123") {
    await handleRequest()  // All code here sees requestID = "abc-123"
}
```

Useful for logging, tracing, passing context without parameters.

### Async Sequences

Beyond basic for-await:

```swift
// Transform
let doubled = numbers.map { $0 * 2 }

// Filter
let evens = numbers.filter { $0.isMultiple(of: 2) }

// First match
let first = await numbers.first { $0 > 10 }

// Reduce
let sum = await numbers.reduce(0, +)
```

### Custom AsyncSequence

```swift
struct Counter: AsyncSequence {
    typealias Element = Int
    let limit: Int
    
    struct AsyncIterator: AsyncIteratorProtocol {
        var current = 0
        let limit: Int
        
        mutating func next() async -> Int? {
            guard current < limit else { return nil }
            defer { current += 1 }
            return current
        }
    }
    
    func makeAsyncIterator() -> AsyncIterator {
        AsyncIterator(limit: limit)
    }
}

for await number in Counter(limit: 5) {
    print(number)  // 0, 1, 2, 3, 4
}
```

### Global Actors

Create your own actor singletons:

```swift
@globalActor
actor DatabaseActor {
    static let shared = DatabaseActor()
}

@DatabaseActor
func saveToDatabase() {
    // Guaranteed to run on DatabaseActor
}
```

All `@DatabaseActor` functions serialize through the same actor.

### Distributed Actors

Actors that can live on different machines:

```swift
distributed actor Player {
    distributed func move(to position: Position) {
        // Can be called remotely
    }
}
```

Requires a distributed actor system. Used for multi-device games, distributed systems.

---

# 2. SwiftUI — The Last 20%

## 2.1 Custom Drawing

### Canvas

High-performance drawing for many shapes:

```swift
Canvas { context, size in
    for _ in 0..<1000 {
        let rect = CGRect(
            x: .random(in: 0..<size.width),
            y: .random(in: 0..<size.height),
            width: 10, height: 10
        )
        context.fill(Path(ellipseIn: rect), with: .color(.blue))
    }
}
```

Doesn't create 1000 views — draws directly. Much faster for particles, graphs, games.

### Custom Shapes

```swift
struct Triangle: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.midX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        path.closeSubpath()
        return path
    }
}

Triangle()
    .fill(.blue)
    .frame(width: 100, height: 100)
```

### Animatable Shapes

Make shapes animate by conforming to `Animatable`:

```swift
struct PieSlice: Shape {
    var endAngle: Angle
    
    var animatableData: Double {
        get { endAngle.degrees }
        set { endAngle = .degrees(newValue) }
    }
    
    func path(in rect: CGRect) -> Path {
        // Draw pie slice to endAngle
    }
}
```

Now `endAngle` changes animate smoothly.

### Metal via DrawingGroup

```swift
VStack {
    // Complex view hierarchy
}
.drawingGroup()  // Renders via Metal, flattens to single layer
```

Can improve performance for complex static content. Test to verify — not always faster.

---

## 2.2 Advanced Animations

### Custom Timing Curves

```swift
Animation.timingCurve(0.68, -0.55, 0.27, 1.55, duration: 0.5)  // Bouncy
```

Control points for cubic Bézier curve. Play with values to get custom easing.

### Keyframe Animations (iOS 17+)

```swift
Text("Hello")
    .keyframeAnimator(initialValue: AnimationValues()) { content, value in
        content
            .scaleEffect(value.scale)
            .opacity(value.opacity)
    } keyframes: { _ in
        KeyframeTrack(\.scale) {
            SpringKeyframe(1.5, duration: 0.3)
            SpringKeyframe(1.0, duration: 0.3)
        }
        KeyframeTrack(\.opacity) {
            LinearKeyframe(0.5, duration: 0.2)
            LinearKeyframe(1.0, duration: 0.4)
        }
    }
```

Multiple properties, different timings, coordinated.

### Phase Animations (iOS 17+)

Cycle through states:

```swift
Text("Hello")
    .phaseAnimator([false, true]) { content, phase in
        content
            .scaleEffect(phase ? 1.2 : 1.0)
            .opacity(phase ? 1.0 : 0.7)
    }
```

Automatically cycles between phases.

### Transaction Control

Fine-grained animation control:

```swift
var transaction = Transaction(animation: .spring())
transaction.disablesAnimations = false

withTransaction(transaction) {
    state = newValue
}
```

Or disable animation for specific changes:

```swift
var transaction = Transaction()
transaction.disablesAnimations = true
withTransaction(transaction) {
    // This change won't animate
}
```

### Matched Geometry Effect

Animate between views:

```swift
@Namespace private var namespace

if isExpanded {
    ExpandedView()
        .matchedGeometryEffect(id: "card", in: namespace)
} else {
    CollapsedView()
        .matchedGeometryEffect(id: "card", in: namespace)
}
```

SwiftUI interpolates size and position between views with same ID.

---

## 2.3 Complex State Coordination

### Reducer Pattern (TCA-style)

Centralize state mutations:

```swift
struct AppState {
    var count: Int = 0
    var items: [Item] = []
}

enum AppAction {
    case increment
    case decrement
    case addItem(Item)
    case removeItem(at: Int)
}

func reduce(state: inout AppState, action: AppAction) {
    switch action {
    case .increment:
        state.count += 1
    case .decrement:
        state.count -= 1
    case .addItem(let item):
        state.items.append(item)
    case .removeItem(let index):
        state.items.remove(at: index)
    }
}
```

All state changes go through reducer. Predictable, testable, debuggable.

### Dependency Injection

```swift
struct Dependencies {
    var apiClient: APIClient
    var database: Database
    var analytics: Analytics
}

extension EnvironmentValues {
    var dependencies: Dependencies {
        get { self[DependenciesKey.self] }
        set { self[DependenciesKey.self] = newValue }
    }
}

// In tests, inject mocks
ContentView()
    .environment(\.dependencies, .mock)
```

### State Restoration

Save and restore navigation state:

```swift
@SceneStorage("navigationPath") private var pathData: Data?

var body: some View {
    NavigationStack(path: $path) {
        // ...
    }
    .onAppear {
        if let data = pathData {
            path = try? JSONDecoder().decode(NavigationPath.self, from: data)
        }
    }
    .onChange(of: path) {
        pathData = try? JSONEncoder().encode(path)
    }
}
```

App closes and reopens to same screen.

---

# 3. UIKit — The Last 20%

## 3.1 Core Animation Deep Dive

### Layer Hierarchy

Every UIView has a CALayer. Layers handle actual rendering.

```swift
view.layer.cornerRadius = 10
view.layer.shadowColor = UIColor.black.cgColor
view.layer.shadowOffset = CGSize(width: 0, height: 2)
view.layer.shadowRadius = 4
view.layer.shadowOpacity = 0.3
```

### Explicit Animations

More control than UIView.animate:

```swift
let animation = CABasicAnimation(keyPath: "position.x")
animation.fromValue = 0
animation.toValue = 100
animation.duration = 1.0
animation.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
layer.add(animation, forKey: "moveRight")
```

### Keyframe Animations

```swift
let animation = CAKeyframeAnimation(keyPath: "position")
animation.values = [
    CGPoint(x: 0, y: 0),
    CGPoint(x: 100, y: 0),
    CGPoint(x: 100, y: 100),
    CGPoint(x: 0, y: 100),
    CGPoint(x: 0, y: 0)
]
animation.keyTimes = [0, 0.25, 0.5, 0.75, 1.0]
animation.duration = 2.0
layer.add(animation, forKey: "square")
```

### Animation Groups

Combine multiple animations:

```swift
let move = CABasicAnimation(keyPath: "position.x")
move.toValue = 200

let fade = CABasicAnimation(keyPath: "opacity")
fade.toValue = 0

let group = CAAnimationGroup()
group.animations = [move, fade]
group.duration = 1.0
layer.add(group, forKey: "moveAndFade")
```

### Layer Types

- `CAShapeLayer` — vector shapes
- `CAGradientLayer` — gradients
- `CATextLayer` — text
- `CAReplicatorLayer` — duplicates sublayers
- `CAEmitterLayer` — particle systems
- `CAScrollLayer` — scrollable content

```swift
let gradient = CAGradientLayer()
gradient.colors = [UIColor.red.cgColor, UIColor.blue.cgColor]
gradient.frame = view.bounds
view.layer.addSublayer(gradient)
```

---

## 3.2 Custom Rendering

### drawRect

Override for custom drawing:

```swift
class CustomView: UIView {
    override func draw(_ rect: CGRect) {
        guard let context = UIGraphicsGetCurrentContext() else { return }
        
        context.setFillColor(UIColor.blue.cgColor)
        context.fill(CGRect(x: 10, y: 10, width: 100, height: 100))
        
        context.setStrokeColor(UIColor.red.cgColor)
        context.setLineWidth(2)
        context.stroke(CGRect(x: 50, y: 50, width: 100, height: 100))
    }
}
```

Call `setNeedsDisplay()` to trigger redraw.

### CADisplayLink

Sync with screen refresh:

```swift
let displayLink = CADisplayLink(target: self, selector: #selector(update))
displayLink.add(to: .main, forMode: .common)

@objc func update(_ displayLink: CADisplayLink) {
    let elapsed = displayLink.targetTimestamp - displayLink.timestamp
    // Update animation based on time
}
```

Use for custom animations, games, smooth updates.

### Async Drawing

Draw on background thread:

```swift
layer.drawsAsynchronously = true
```

Or render to image in background:

```swift
DispatchQueue.global().async {
    let renderer = UIGraphicsImageRenderer(size: size)
    let image = renderer.image { context in
        // Heavy drawing
    }
    DispatchQueue.main.async {
        imageView.image = image
    }
}
```

---

## 3.3 Complex Gesture Systems

### State Machine Gestures

Track gesture phases:

```swift
class DrawingGestureRecognizer: UIGestureRecognizer {
    private var trackedTouch: UITouch?
    var path = UIBezierPath()
    
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
        guard trackedTouch == nil, let touch = touches.first else {
            state = .failed
            return
        }
        trackedTouch = touch
        path.move(to: touch.location(in: view))
        state = .began
    }
    
    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent) {
        guard let touch = trackedTouch, touches.contains(touch) else { return }
        path.addLine(to: touch.location(in: view))
        state = .changed
    }
    
    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {
        guard let touch = trackedTouch, touches.contains(touch) else { return }
        state = .ended
        trackedTouch = nil
    }
    
    override func reset() {
        trackedTouch = nil
        path = UIBezierPath()
    }
}
```

### Multi-Touch Tracking

Track multiple fingers:

```swift
class MultiTouchGesture: UIGestureRecognizer {
    var touches: [UITouch] = []
    
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
        self.touches.append(contentsOf: touches)
        if self.touches.count >= 2 {
            state = .began
        }
    }
}
```

### Gesture Delegate Methods

```swift
// Allow gesture to begin
func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
    let velocity = panGesture.velocity(in: view)
    return abs(velocity.x) > abs(velocity.y)  // Only horizontal pans
}

// Allow multiple gestures
func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, 
    shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer) -> Bool {
    return true
}

// Gesture dependencies
func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, 
    shouldRequireFailureOf other: UIGestureRecognizer) -> Bool {
    return gestureRecognizer is UITapGestureRecognizer && other is UISwipeGestureRecognizer
}
```

---

# 4. Combine — The Last 20%

## 4.1 Custom Publishers from Scratch

### Full Implementation

```swift
struct TimerPublisher: Publisher {
    typealias Output = Date
    typealias Failure = Never
    
    let interval: TimeInterval
    
    func receive<S: Subscriber>(subscriber: S) where S.Input == Date, S.Failure == Never {
        let subscription = TimerSubscription(subscriber: subscriber, interval: interval)
        subscriber.receive(subscription: subscription)
    }
}

class TimerSubscription<S: Subscriber>: Subscription where S.Input == Date, S.Failure == Never {
    private var subscriber: S?
    private var timer: Timer?
    
    init(subscriber: S, interval: TimeInterval) {
        self.subscriber = subscriber
        timer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] _ in
            _ = self?.subscriber?.receive(Date())
        }
    }
    
    func request(_ demand: Subscribers.Demand) {
        // Could track demand here
    }
    
    func cancel() {
        timer?.invalidate()
        timer = nil
        subscriber = nil
    }
}
```

### Custom Subscribers

```swift
class PrintSubscriber: Subscriber {
    typealias Input = Int
    typealias Failure = Never
    
    func receive(subscription: Subscription) {
        subscription.request(.unlimited)
    }
    
    func receive(_ input: Int) -> Subscribers.Demand {
        print("Received: \(input)")
        return .none  // Don't request more
    }
    
    func receive(completion: Subscribers.Completion<Never>) {
        print("Completed")
    }
}
```

---

## 4.2 Backpressure

### What It Is

Publisher producing faster than subscriber can consume. Without handling, memory grows unbounded.

### Demand

Subscribers request specific amounts:

```swift
func receive(subscription: Subscription) {
    subscription.request(.max(5))  // Only want 5 items
}

func receive(_ input: Int) -> Subscribers.Demand {
    return .max(1)  // Request one more after processing
}
```

### Buffer

Handle fast producers:

```swift
publisher
    .buffer(size: 100, prefetch: .byRequest, whenFull: .dropOldest)
    .sink { ... }
```

Options when full:
- `.dropOldest` — discard old items
- `.dropNewest` — discard new items
- `.customError` — fail with error

### Throttle vs Debounce

Both limit rate, differently:

**Throttle** — emit first (or last) in time window:
```swift
.throttle(for: .seconds(1), scheduler: RunLoop.main, latest: true)
```

**Debounce** — emit after silence:
```swift
.debounce(for: .seconds(1), scheduler: RunLoop.main)
```

---

## 4.3 Complex Operator Chains

### Share and Multicast

Prevent duplicate work:

```swift
// Bad: each subscriber triggers network request
let publisher = URLSession.shared.dataTaskPublisher(for: url)

// Good: share result among subscribers
let shared = publisher.share()
```

For manual control:

```swift
let subject = PassthroughSubject<Data, Error>()
let multicasted = publisher.multicast(subject: subject)

// Set up subscribers first
multicasted.sink { ... }
multicasted.sink { ... }

// Then connect
multicasted.connect()
```

### FlatMap Strategies

```swift
// Unlimited concurrent inner publishers (default)
.flatMap { fetchDetails($0) }

// Limit concurrency
.flatMap(maxPublishers: .max(3)) { fetchDetails($0) }
```

### SwitchToLatest

Cancel previous, only care about latest:

```swift
searchTextPublisher
    .map { query in
        searchAPI(query)  // Returns publisher
    }
    .switchToLatest()  // Cancels previous search when new one starts
```

### Handling Multiple Error Types

```swift
publisher
    .mapError { error -> AppError in
        switch error {
        case let urlError as URLError:
            return .network(urlError)
        case let decodingError as DecodingError:
            return .parsing(decodingError)
        default:
            return .unknown(error)
        }
    }
```

### Combine Multiple Publishers

```swift
// All must complete
Publishers.Zip4(pub1, pub2, pub3, pub4)
    .map { a, b, c, d in ... }

// Merge many of same type
Publishers.MergeMany(arrayOfPublishers)

// Combine latest of many
Publishers.CombineLatest4(pub1, pub2, pub3, pub4)
```

---

# 5. API — The Last 20%

## 5.1 GraphQL

### What It Is

Query language for APIs. Client specifies exactly what data it wants.

### vs REST

**REST:** Multiple endpoints, fixed response shapes.
```
GET /users/1
GET /users/1/posts
GET /users/1/followers
```

**GraphQL:** Single endpoint, flexible queries.
```graphql
query {
  user(id: 1) {
    name
    posts { title }
    followers { name }
  }
}
```

One request, exactly the data you need.

### iOS Libraries

**Apollo iOS** — most popular. Generates Swift types from schema.

```swift
let query = UserQuery(id: "1")
apollo.fetch(query: query) { result in
    switch result {
    case .success(let data):
        print(data.user?.name)
    case .failure(let error):
        print(error)
    }
}
```

### Mutations

```graphql
mutation {
  createPost(title: "Hello", body: "World") {
    id
    title
  }
}
```

### Subscriptions

Real-time updates via WebSocket:

```graphql
subscription {
  newPost {
    id
    title
  }
}
```

---

## 5.2 Advanced Caching

### Cache Layers

```
Memory Cache (fastest, smallest)
    ↓
Disk Cache (slower, larger)
    ↓
Network (slowest)
```

### LRU Cache

Least Recently Used — evict oldest accessed items:

```swift
class LRUCache<Key: Hashable, Value> {
    private let capacity: Int
    private var cache: [Key: Value] = [:]
    private var order: [Key] = []
    
    init(capacity: Int) {
        self.capacity = capacity
    }
    
    func get(_ key: Key) -> Value? {
        guard let value = cache[key] else { return nil }
        // Move to end (most recent)
        order.removeAll { $0 == key }
        order.append(key)
        return value
    }
    
    func set(_ key: Key, value: Value) {
        if cache[key] != nil {
            order.removeAll { $0 == key }
        } else if cache.count >= capacity {
            // Evict oldest
            if let oldest = order.first {
                order.removeFirst()
                cache.removeValue(forKey: oldest)
            }
        }
        cache[key] = value
        order.append(key)
    }
}
```

### ETag / Last-Modified

Conditional requests:

```swift
var request = URLRequest(url: url)
if let etag = cachedETag {
    request.setValue(etag, forHTTPHeaderField: "If-None-Match")
}

// Server returns 304 Not Modified if unchanged
// Otherwise returns new data with new ETag
```

### Cache-Control Headers

```swift
// Parse Cache-Control: max-age=3600
let maxAge = response.value(forHTTPHeaderField: "Cache-Control")
    .flatMap { /* parse max-age */ }
```

Respect server's caching directives.

---

## 5.3 Circuit Breakers

### What It Is

Prevent cascading failures. If a service is down, stop hammering it.

### States

1. **Closed** — requests flow normally
2. **Open** — requests fail immediately (don't even try)
3. **Half-Open** — allow one test request to check if service recovered

### Implementation

```swift
actor CircuitBreaker {
    enum State {
        case closed
        case open(until: Date)
        case halfOpen
    }
    
    private var state: State = .closed
    private var failureCount = 0
    private let threshold = 5
    private let timeout: TimeInterval = 30
    
    func execute<T>(_ operation: () async throws -> T) async throws -> T {
        switch state {
        case .open(let until):
            if Date() < until {
                throw CircuitBreakerError.open
            }
            state = .halfOpen
            fallthrough
            
        case .halfOpen:
            do {
                let result = try await operation()
                reset()
                return result
            } catch {
                trip()
                throw error
            }
            
        case .closed:
            do {
                let result = try await operation()
                failureCount = 0
                return result
            } catch {
                failureCount += 1
                if failureCount >= threshold {
                    trip()
                }
                throw error
            }
        }
    }
    
    private func trip() {
        state = .open(until: Date().addingTimeInterval(timeout))
        failureCount = 0
    }
    
    private func reset() {
        state = .closed
        failureCount = 0
    }
}
```

### Usage

```swift
let breaker = CircuitBreaker()

func fetchData() async throws -> Data {
    try await breaker.execute {
        try await api.request(endpoint)
    }
}
```

After 5 failures, circuit opens. Requests fail fast for 30 seconds. Then one test request. If it works, circuit closes.

---

# Summary

This is reference material. You don't need to memorize it.

**When you'll use this:**

- Macros: When you see `@Observable` and wonder how it works
- Memory layout: When optimizing data structures for performance
- Custom drawing: When building charts, games, or custom visualizations
- Core Animation: When UIView.animate isn't enough
- Custom publishers: When Combine's built-in publishers don't fit
- GraphQL: When your backend uses it
- Circuit breakers: When building resilient distributed systems

**Most iOS developers never need 80% of this guide.** But now you have it when you do.

---

*The last 20%. Now archived.*