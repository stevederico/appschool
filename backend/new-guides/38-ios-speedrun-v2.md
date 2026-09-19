# iOS Deep Dive — 1 Hour Edition

After completing the deep dive guide:
Swift          [████████████████░░░░] 80%
SwiftUI        [████████████░░░░░░░░] 60%
UIKit          [██████████░░░░░░░░░░] 50%
Combine        [████████████░░░░░░░░] 60%
API/AI         [██████████░░░░░░░░░░] 50%

Building on the speedrun-v1 foundations. This takes you deeper.

---

# Table of Contents

## 1. Swift Advanced (15 min)
- [1.1 Advanced Generics](#11-advanced-generics)
- [1.2 Property Wrappers](#12-property-wrappers)
- [1.3 Result Builders](#13-result-builders)
- [1.4 Key Paths & Metatypes](#14-key-paths--metatypes)

## 2. SwiftUI Deep Dive (15 min)
- [2.1 View Identity & Lifecycle](#21-view-identity--lifecycle)
- [2.2 Environment & Preferences](#22-environment--preferences)
- [2.3 Custom View Modifiers](#23-custom-view-modifiers)
- [2.4 Animations & Gestures](#24-animations--gestures)

## 3. Combine Mastery (10 min)
- [3.1 Publisher Types](#31-publisher-types)
- [3.2 Essential Operators](#32-essential-operators)
- [3.3 Error Handling](#33-error-handling)
- [3.4 Subjects & Custom Publishers](#34-subjects--custom-publishers)

## 4. UIKit Deeper (10 min)
- [4.1 View Controller Lifecycle](#41-view-controller-lifecycle)
- [4.2 Responder Chain](#42-responder-chain)
- [4.3 Advanced Auto Layout](#43-advanced-auto-layout)
- [4.4 Collection View Deep Dive](#44-collection-view-deep-dive)

## 5. API & Networking (10 min)
- [5.1 Endpoint Abstraction](#51-endpoint-abstraction)
- [5.2 Authentication Patterns](#52-authentication-patterns)
- [5.3 Streaming & WebSockets](#53-streaming--websockets)
- [5.4 Offline & Caching](#54-offline--caching)

---

# 1. Swift Advanced (15 min)

## 1.1 Advanced Generics

### Associated Types

Protocols can have placeholder types that conforming types define:

```swift
protocol Container {
    associatedtype Item  // placeholder
    var count: Int { get }
    mutating func append(_ item: Item)
    subscript(i: Int) -> Item { get }
}

struct IntStack: Container {
    typealias Item = Int  // concrete type (often inferred)
    var items: [Int] = []
    var count: Int { items.count }
    mutating func append(_ item: Int) { items.append(item) }
    subscript(i: Int) -> Int { items[i] }
}
```

### Type Erasure

When you need to store different concrete types that share a protocol:

```swift
// Problem: Can't do this directly
// var publishers: [Publisher]  // Error: has associated types

// Solution: Type erasure wraps the concrete type
let intPublisher = Just(42)
let stringPublisher = Just("hello")

// AnyPublisher erases the concrete type
let erasedInt: AnyPublisher<Int, Never> = intPublisher.eraseToAnyPublisher()
let erasedString: AnyPublisher<String, Never> = stringPublisher.eraseToAnyPublisher()
```

### Where Clauses

Constrain generics with complex requirements:

```swift
// Multiple constraints
func process<T>(_ value: T) where T: Codable, T: Hashable {
    // T must be both Codable AND Hashable
}

// Constrain associated types
extension Container where Item: Equatable {
    func contains(_ item: Item) -> Bool {
        for i in 0..<count {
            if self[i] == item { return true }
        }
        return false
    }
}

// Same-type constraint
func compare<C1: Container, C2: Container>(_ c1: C1, _ c2: C2) -> Bool
    where C1.Item == C2.Item, C1.Item: Equatable {
    // Both containers must have the same Item type
    guard c1.count == c2.count else { return false }
    for i in 0..<c1.count {
        if c1[i] != c2[i] { return false }
    }
    return true
}
```

---

## 1.2 Property Wrappers

Property wrappers encapsulate getter/setter logic for reuse:

```swift
@propertyWrapper
struct Clamped<Value: Comparable> {
    var value: Value
    let range: ClosedRange<Value>
    
    init(wrappedValue: Value, _ range: ClosedRange<Value>) {
        self.range = range
        self.value = min(max(wrappedValue, range.lowerBound), range.upperBound)
    }
    
    var wrappedValue: Value {
        get { value }
        set { value = min(max(newValue, range.lowerBound), range.upperBound) }
    }
}

// Usage
struct Player {
    @Clamped(0...100) var health: Int = 100
    @Clamped(0...1) var volume: Double = 0.5
}

var player = Player()
player.health = 150  // Clamped to 100
player.health = -10  // Clamped to 0
```

### Projected Value

Property wrappers can expose additional data via `$`:

```swift
@propertyWrapper
struct Published<Value> {
    private var value: Value
    private let subject = PassthroughSubject<Value, Never>()
    
    init(wrappedValue: Value) {
        self.value = wrappedValue
    }
    
    var wrappedValue: Value {
        get { value }
        set {
            value = newValue
            subject.send(newValue)
        }
    }
    
    var projectedValue: AnyPublisher<Value, Never> {
        subject.eraseToAnyPublisher()
    }
}

// Usage
class ViewModel {
    @Published var count = 0
}

let vm = ViewModel()
vm.$count.sink { print($0) }  // $count is the projectedValue (publisher)
vm.count = 5  // prints 5
```

---

## 1.3 Result Builders

Result builders power SwiftUI's declarative syntax. They transform a series of statements into a single result:

```swift
@resultBuilder
struct ArrayBuilder<Element> {
    static func buildBlock(_ components: Element...) -> [Element] {
        components
    }
    
    static func buildOptional(_ component: [Element]?) -> [Element] {
        component ?? []
    }
    
    static func buildEither(first component: [Element]) -> [Element] {
        component
    }
    
    static func buildEither(second component: [Element]) -> [Element] {
        component
    }
    
    static func buildArray(_ components: [[Element]]) -> [Element] {
        components.flatMap { $0 }
    }
}

// Usage
@ArrayBuilder<Int>
func buildNumbers(includeEvens: Bool) -> [Int] {
    1
    3
    5
    if includeEvens {
        2
        4
    }
    for i in [7, 9] {
        i
    }
}

let nums = buildNumbers(includeEvens: true)  // [1, 3, 5, 2, 4, 7, 9]
```

This is how SwiftUI's `@ViewBuilder` works — each view you write becomes a component that gets combined.

---

## 1.4 Key Paths & Metatypes

### Key Paths

Type-safe references to properties:

```swift
struct User {
    var name: String
    var age: Int
}

let namePath: KeyPath<User, String> = \User.name
let agePath: WritableKeyPath<User, Int> = \User.age

var user = User(name: "Steve", age: 30)

// Reading
let name = user[keyPath: namePath]  // "Steve"

// Writing (with WritableKeyPath)
user[keyPath: agePath] = 31

// Practical use: sorting
let users = [User(name: "B", age: 25), User(name: "A", age: 30)]
let sortedByName = users.sorted(by: \.name)  // shorthand key path
```

### Metatypes

Types themselves as values:

```swift
// .self gives you the metatype (the type itself as a value)
let intType: Int.Type = Int.self
let stringType: String.Type = String.self

// Useful for generic initialization
func create<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
    try JSONDecoder().decode(type, from: data)
}

let user = try create(User.self, from: jsonData)

// Protocol metatypes use .Protocol
let anyProtocol: Decodable.Protocol = Decodable.self
```

---

# 2. SwiftUI Deep Dive (15 min)

## 2.1 View Identity & Lifecycle

SwiftUI uses **identity** to track views across updates. Two types:

### Structural Identity

Position in the view hierarchy (implicit):

```swift
var body: some View {
    if showFirst {
        Text("First")   // This IS a different view than...
    } else {
        Text("Second")  // ...this, even if text were the same
    }
}
// SwiftUI sees these as different views — state resets when switching
```

### Explicit Identity

Using `id()` or `ForEach`:

```swift
// id() gives explicit identity
Text("Hello")
    .id(someValue)  // When someValue changes, view is destroyed and recreated

// ForEach requires identifiable items
ForEach(items) { item in  // item.id provides identity
    ItemView(item: item)
}
```

### Lifecycle

Views don't have `viewDidLoad`. Instead:

```swift
struct MyView: View {
    var body: some View {
        Text("Hello")
            .onAppear { /* view appeared */ }
            .onDisappear { /* view disappeared */ }
            .task { /* async work, auto-cancelled on disappear */ }
            .onChange(of: someValue) { oldValue, newValue in
                /* react to state changes */
            }
    }
}
```

**Key insight:** `body` is called frequently. Keep it fast. Side effects go in modifiers, not in `body` computation.

---

## 2.2 Environment & Preferences

### Environment (data flows down)

Parent passes data to all descendants without explicit parameters:

```swift
// Define custom environment key
struct ThemeKey: EnvironmentKey {
    static let defaultValue = Theme.light
}

extension EnvironmentValues {
    var theme: Theme {
        get { self[ThemeKey.self] }
        set { self[ThemeKey.self] = newValue }
    }
}

// Parent sets it
ContentView()
    .environment(\.theme, .dark)

// Any descendant reads it
struct DeepChild: View {
    @Environment(\.theme) var theme
    
    var body: some View {
        Text("Hello")
            .foregroundStyle(theme.textColor)
    }
}
```

### Preferences (data flows up)

Child communicates data to ancestors:

```swift
// Define preference key
struct SizePreferenceKey: PreferenceKey {
    static var defaultValue: CGSize = .zero
    static func reduce(value: inout CGSize, nextValue: () -> CGSize) {
        value = nextValue()
    }
}

// Child reports its size
struct Child: View {
    var body: some View {
        GeometryReader { geo in
            Color.clear
                .preference(key: SizePreferenceKey.self, value: geo.size)
        }
    }
}

// Parent reads it
struct Parent: View {
    @State private var childSize: CGSize = .zero
    
    var body: some View {
        Child()
            .onPreferenceChange(SizePreferenceKey.self) { size in
                childSize = size
            }
    }
}
```

---

## 2.3 Custom View Modifiers

Encapsulate reusable view modifications:

```swift
struct CardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding()
            .background(Color.white)
            .cornerRadius(12)
            .shadow(radius: 4)
    }
}

// Extension for clean syntax
extension View {
    func card() -> some View {
        modifier(CardModifier())
    }
}

// Usage
Text("Hello")
    .card()
```

### Modifiers with Parameters

```swift
struct ShakeModifier: ViewModifier {
    let times: Int
    @State private var shake = false
    
    func body(content: Content) -> some View {
        content
            .offset(x: shake ? -10 : 0)
            .animation(
                .linear(duration: 0.05).repeatCount(times * 2),
                value: shake
            )
            .onAppear { shake = true }
    }
}

extension View {
    func shake(times: Int = 3) -> some View {
        modifier(ShakeModifier(times: times))
    }
}
```

---

## 2.4 Animations & Gestures

### Animations

Two approaches:

```swift
// 1. Implicit: animate when value changes
@State private var scale = 1.0

Circle()
    .scaleEffect(scale)
    .animation(.spring(), value: scale)  // animates whenever scale changes

// 2. Explicit: wrap the change
withAnimation(.easeInOut(duration: 0.3)) {
    scale = 2.0
}
```

### Transitions

Control how views appear/disappear:

```swift
if showDetail {
    DetailView()
        .transition(.move(edge: .trailing).combined(with: .opacity))
}
```

### Gestures

```swift
struct DraggableView: View {
    @State private var offset = CGSize.zero
    @GestureState private var dragOffset = CGSize.zero  // resets when gesture ends
    
    var body: some View {
        Circle()
            .offset(x: offset.width + dragOffset.width,
                    y: offset.height + dragOffset.height)
            .gesture(
                DragGesture()
                    .updating($dragOffset) { value, state, _ in
                        state = value.translation  // live tracking
                    }
                    .onEnded { value in
                        offset.width += value.translation.width
                        offset.height += value.translation.height
                    }
            )
    }
}
```

### Combining Gestures

```swift
// Simultaneous: both active at once
.gesture(dragGesture.simultaneously(with: rotationGesture))

// Sequenced: one after another
.gesture(longPressGesture.sequenced(before: dragGesture))

// Exclusive: one or the other (first match wins)
.gesture(tapGesture.exclusively(before: doubleTapGesture))
```

---

# 3. Combine Mastery (10 min)

## 3.1 Publisher Types

### Built-in Publishers

```swift
// Just: single value, then completes
let just = Just(42)  // emits 42, completes

// Future: single async value
let future = Future<Int, Error> { promise in
    DispatchQueue.global().async {
        promise(.success(42))
    }
}

// Empty: completes immediately, no values
let empty = Empty<Int, Never>()

// Fail: immediately fails with error
let fail = Fail<Int, MyError>(error: .somethingWrong)

// Deferred: creates publisher lazily
let deferred = Deferred {
    Just(Date())  // Date captured when subscribed, not when created
}

// Sequence: emits each element
let sequence = [1, 2, 3].publisher  // emits 1, 2, 3, completes
```

### @Published and NotificationCenter

```swift
class ViewModel: ObservableObject {
    @Published var query = ""  // $query is a publisher
}

// NotificationCenter publisher
NotificationCenter.default
    .publisher(for: UIApplication.didBecomeActiveNotification)
    .sink { _ in print("App active") }
```

---

## 3.2 Essential Operators

### Transforming

```swift
[1, 2, 3].publisher
    .map { $0 * 2 }        // [2, 4, 6]
    .filter { $0 > 2 }     // [4, 6]
    .compactMap { Int?($0) }  // removes nils
    .flatMap { fetchData(for: $0) }  // flattens nested publishers
    .scan(0, +)            // running total: [2, 6, 12]
```

### Combining

```swift
// combineLatest: emit when ANY source emits (with latest from others)
let combined = Publishers.CombineLatest(pub1, pub2)
    .map { a, b in "\(a), \(b)" }

// merge: interleave emissions from multiple publishers
let merged = Publishers.Merge(pub1, pub2)

// zip: pair up emissions (waits for both)
let zipped = Publishers.Zip(pub1, pub2)
```

### Timing

```swift
$searchText
    .debounce(for: .milliseconds(300), scheduler: RunLoop.main)  // wait for pause
    .throttle(for: .seconds(1), scheduler: RunLoop.main, latest: true)  // max 1 per second
    .delay(for: .seconds(2), scheduler: RunLoop.main)  // delay all emissions
    .timeout(.seconds(10), scheduler: RunLoop.main)  // fail if no emission
```

### Debugging

```swift
publisher
    .print("Debug")  // logs all events
    .handleEvents(
        receiveSubscription: { _ in print("Subscribed") },
        receiveOutput: { print("Got: \($0)") },
        receiveCompletion: { print("Completed: \($0)") },
        receiveCancel: { print("Cancelled") }
    )
```

---

## 3.3 Error Handling

```swift
fetchData()
    .retry(3)  // retry up to 3 times on failure
    .catch { error in
        Just(fallbackValue)  // replace error stream with fallback
    }
    .replaceError(with: defaultValue)  // simpler fallback
    .mapError { MyError.wrapped($0) }  // transform error type
```

### tryMap for Throwing

```swift
dataPublisher
    .tryMap { data in
        try JSONDecoder().decode(User.self, from: data)
    }
    .mapError { $0 as? DecodingError ?? .unknown }
```

---

## 3.4 Subjects & Custom Publishers

### Subjects

Publishers you can send values to imperatively:

```swift
// PassthroughSubject: no memory, only emits to current subscribers
let passthrough = PassthroughSubject<Int, Never>()
passthrough.send(1)  // emitted if anyone is subscribed
passthrough.send(completion: .finished)

// CurrentValueSubject: remembers last value, new subscribers get it immediately
let current = CurrentValueSubject<Int, Never>(0)
print(current.value)  // 0
current.send(5)
print(current.value)  // 5
```

### When to Use Which

- **PassthroughSubject**: Events (button taps, notifications)
- **CurrentValueSubject**: State (current user, settings)

### Bridging to Combine

```swift
// From callback API
func fetchUser() -> AnyPublisher<User, Error> {
    Future { promise in
        legacyAPI.fetch { result in
            switch result {
            case .success(let user): promise(.success(user))
            case .failure(let error): promise(.failure(error))
            }
        }
    }.eraseToAnyPublisher()
}
```

---

# 4. UIKit Deeper (10 min)

## 4.1 View Controller Lifecycle

The complete sequence:

```swift
class MyViewController: UIViewController {
    // 1. Initialization
    init() { super.init(nibName: nil, bundle: nil) }
    
    // 2. View loading (called once, lazily)
    override func loadView() {
        // Create view hierarchy programmatically
        // Don't call super if providing custom view
        view = UIView()
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        // View loaded into memory (once)
        // Setup that only happens once
    }
    
    // 3. Appearing (can happen multiple times)
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        // About to become visible
        // Start observing, refresh data
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        // Now visible
        // Start animations, analytics
    }
    
    // 4. Disappearing
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        // About to leave screen
    }
    
    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        // No longer visible
        // Stop observing, pause work
    }
    
    // 5. Layout
    override func viewWillLayoutSubviews() {
        super.viewWillLayoutSubviews()
        // Before layout pass
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        // After layout pass
        // Safe to read final frames
    }
}
```

---

## 4.2 Responder Chain

Events travel up the responder chain until handled:

```
View → Superview → ... → ViewController → Window → Application
```

```swift
class MyView: UIView {
    // First responder for keyboard
    override var canBecomeFirstResponder: Bool { true }
    
    // Handle events
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        // Handle or pass to next responder
        super.touchesBegan(touches, with: event)
    }
}

// Custom actions travel the responder chain
extension UIResponder {
    @objc func handleCustomAction(_ sender: Any?) {
        // If not handled, passes to next responder automatically
    }
}

// Trigger from anywhere
UIApplication.shared.sendAction(#selector(UIResponder.handleCustomAction), to: nil, from: self, for: nil)
```

---

## 4.3 Advanced Auto Layout

### Programmatic Constraints

```swift
// Verbose way
NSLayoutConstraint.activate([
    view.topAnchor.constraint(equalTo: superview.topAnchor, constant: 20),
    view.leadingAnchor.constraint(equalTo: superview.leadingAnchor, constant: 16),
    view.trailingAnchor.constraint(equalTo: superview.trailingAnchor, constant: -16),
    view.heightAnchor.constraint(equalToConstant: 44)
])

// Don't forget!
view.translatesAutoresizingMaskIntoConstraints = false
```

### Priorities and Hugging/Compression

```swift
// Priority: 1-1000 (1000 = required)
let constraint = view.widthAnchor.constraint(equalToConstant: 100)
constraint.priority = .defaultHigh  // 750
constraint.isActive = true

// Content hugging: resistance to growing
label.setContentHuggingPriority(.required, for: .horizontal)

// Compression resistance: resistance to shrinking
label.setContentCompressionResistancePriority(.required, for: .horizontal)
```

### Intrinsic Content Size

```swift
class CustomView: UIView {
    override var intrinsicContentSize: CGSize {
        CGSize(width: UIView.noIntrinsicMetric, height: 44)
    }
    
    // Call when intrinsic size changes
    func updateContent() {
        invalidateIntrinsicContentSize()
    }
}
```

---

## 4.4 Collection View Deep Dive

### Modern Cell Registration

```swift
// Cell registration (iOS 14+)
let cellRegistration = UICollectionView.CellRegistration<MyCell, Item> { cell, indexPath, item in
    cell.configure(with: item)
}

// In diffable data source
dataSource = UICollectionViewDiffableDataSource(collectionView: collectionView) { 
    collectionView, indexPath, item in
    collectionView.dequeueConfiguredReusableCell(using: cellRegistration, for: indexPath, item: item)
}
```

### Section Snapshots (iOS 14+)

For hierarchical data:

```swift
var sectionSnapshot = NSDiffableDataSourceSectionSnapshot<Item>()

// Root items
sectionSnapshot.append(parentItems)

// Children under parent
sectionSnapshot.append(childItems, to: parentItem)

// Expand/collapse
sectionSnapshot.expand([parentItem])

dataSource.apply(sectionSnapshot, to: .main)
```

### Compositional Layout with Supplementary Views

```swift
let layout = UICollectionViewCompositionalLayout { section, env in
    // Item and group setup...
    
    let section = NSCollectionLayoutSection(group: group)
    
    // Header
    let headerSize = NSCollectionLayoutSize(
        widthDimension: .fractionalWidth(1.0),
        heightDimension: .estimated(44)
    )
    let header = NSCollectionLayoutBoundarySupplementaryItem(
        layoutSize: headerSize,
        elementKind: UICollectionView.elementKindSectionHeader,
        alignment: .top
    )
    section.boundarySupplementaryItems = [header]
    
    return section
}
```

---

# 5. API & Networking (10 min)

## 5.1 Endpoint Abstraction

Clean, type-safe API layer:

```swift
protocol Endpoint {
    associatedtype Response: Decodable
    var path: String { get }
    var method: HTTPMethod { get }
    var headers: [String: String] { get }
    var body: Data? { get }
}

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
}

// Concrete endpoints
struct GetUser: Endpoint {
    typealias Response = User
    let id: Int
    var path: String { "/users/\(id)" }
    var method: HTTPMethod { .get }
    var headers: [String: String] { [:] }
    var body: Data? { nil }
}

struct CreatePost: Endpoint {
    typealias Response = Post
    let title: String
    let content: String
    var path: String { "/posts" }
    var method: HTTPMethod { .post }
    var headers: [String: String] { ["Content-Type": "application/json"] }
    var body: Data? { try? JSONEncoder().encode(["title": title, "content": content]) }
}

// Generic API client
class APIClient {
    let baseURL: URL
    let session: URLSession
    
    func request<E: Endpoint>(_ endpoint: E) async throws -> E.Response {
        var request = URLRequest(url: baseURL.appendingPathComponent(endpoint.path))
        request.httpMethod = endpoint.method.rawValue
        request.httpBody = endpoint.body
        endpoint.headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        
        let (data, _) = try await session.data(for: request)
        return try JSONDecoder().decode(E.Response.self, from: data)
    }
}

// Usage
let user = try await client.request(GetUser(id: 123))
```

---

## 5.2 Authentication Patterns

### Token Refresh with Retry

```swift
actor AuthManager {
    private var accessToken: String?
    private var refreshToken: String?
    private var refreshTask: Task<String, Error>?
    
    func validToken() async throws -> String {
        // Return existing valid token
        if let token = accessToken, !isExpired(token) {
            return token
        }
        
        // If already refreshing, wait for that
        if let task = refreshTask {
            return try await task.value
        }
        
        // Start refresh
        let task = Task {
            let newTokens = try await refreshTokens()
            accessToken = newTokens.access
            refreshToken = newTokens.refresh
            refreshTask = nil
            return newTokens.access
        }
        refreshTask = task
        return try await task.value
    }
}

// In API client
func authenticatedRequest<E: Endpoint>(_ endpoint: E) async throws -> E.Response {
    let token = try await authManager.validToken()
    var request = buildRequest(endpoint)
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    
    do {
        return try await perform(request)
    } catch APIError.unauthorized {
        // Token might have expired between check and use
        let freshToken = try await authManager.forceRefresh()
        request.setValue("Bearer \(freshToken)", forHTTPHeaderField: "Authorization")
        return try await perform(request)
    }
}
```

---

## 5.3 Streaming & WebSockets

### Server-Sent Events (SSE)

Common for AI/LLM APIs:

```swift
func streamCompletion(prompt: String) -> AsyncThrowingStream<String, Error> {
    AsyncThrowingStream { continuation in
        Task {
            var request = URLRequest(url: completionURL)
            request.httpMethod = "POST"
            request.httpBody = try? JSONEncoder().encode(["prompt": prompt, "stream": true])
            
            let (bytes, _) = try await URLSession.shared.bytes(for: request)
            
            for try await line in bytes.lines {
                // SSE format: "data: {json}\n\n"
                guard line.hasPrefix("data: ") else { continue }
                let json = String(line.dropFirst(6))
                
                if json == "[DONE]" {
                    continuation.finish()
                    return
                }
                
                if let chunk = parseChunk(json) {
                    continuation.yield(chunk.text)
                }
            }
            continuation.finish()
        }
    }
}

// Usage
for try await text in streamCompletion(prompt: "Hello") {
    print(text, terminator: "")  // Print as it streams
}
```

### WebSockets

```swift
class WebSocketManager {
    private var webSocket: URLSessionWebSocketTask?
    
    func connect(to url: URL) {
        webSocket = URLSession.shared.webSocketTask(with: url)
        webSocket?.resume()
        receiveMessage()
    }
    
    func send(_ message: String) async throws {
        try await webSocket?.send(.string(message))
    }
    
    private func receiveMessage() {
        webSocket?.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self?.handleMessage(text)
                case .data(let data):
                    self?.handleData(data)
                @unknown default:
                    break
                }
                self?.receiveMessage()  // Continue listening
            case .failure(let error):
                self?.handleError(error)
            }
        }
    }
    
    func disconnect() {
        webSocket?.cancel(with: .normalClosure, reason: nil)
    }
}
```

---

## 5.4 Offline & Caching

### Simple Disk Cache

```swift
actor DiskCache<T: Codable> {
    private let directory: URL
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    
    init(name: String) {
        directory = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent(name)
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    }
    
    func get(_ key: String) -> T? {
        let file = directory.appendingPathComponent(key)
        guard let data = try? Data(contentsOf: file) else { return nil }
        return try? decoder.decode(T.self, from: data)
    }
    
    func set(_ key: String, value: T) {
        let file = directory.appendingPathComponent(key)
        guard let data = try? encoder.encode(value) else { return }
        try? data.write(to: file)
    }
}

// Cache-first pattern
func fetchUser(id: Int) async throws -> User {
    let cacheKey = "user-\(id)"
    
    // Return cached if available
    if let cached: User = await cache.get(cacheKey) {
        // Refresh in background
        Task { try? await refreshUser(id: id) }
        return cached
    }
    
    // Fetch and cache
    let user = try await api.request(GetUser(id: id))
    await cache.set(cacheKey, value: user)
    return user
}
```

### Request Queue for Offline

```swift
actor OfflineQueue {
    private var pending: [PendingRequest] = []
    
    func enqueue(_ request: PendingRequest) {
        pending.append(request)
        save()
    }
    
    func processPending() async {
        for request in pending {
            do {
                try await execute(request)
                pending.removeAll { $0.id == request.id }
                save()
            } catch {
                // Keep in queue for retry
                break
            }
        }
    }
}

// Monitor connectivity
class NetworkMonitor {
    private let monitor = NWPathMonitor()
    
    var isConnected: Bool {
        monitor.currentPath.status == .satisfied
    }
    
    func startMonitoring(onReconnect: @escaping () -> Void) {
        monitor.pathUpdateHandler = { path in
            if path.status == .satisfied {
                onReconnect()
            }
        }
        monitor.start(queue: .global())
    }
}
```

---

# Priority Order (if < 1 hour)

1. **Section 2: SwiftUI Deep Dive** — Identity and lifecycle trips up many
2. **Section 3: Combine Operators** — Know combineLatest, merge, flatMap
3. **Section 5.1-5.2: API Patterns** — Practical job skills
4. **Section 1.2: Property Wrappers** — Understand how @State works under the hood

---

# What's Still Missing

This guide + the speedrun still don't cover:
- **gRPC** (would need separate deep dive)
- **Core Data / SwiftData**
- **Testing** (unit, UI, Combine, async)
- **Architecture patterns** (MVVM, TCA, Clean)
- **Performance profiling**
- **CI/CD and deployment**

But you're now much closer to "deep knowledge" territory.

*Keep building.*