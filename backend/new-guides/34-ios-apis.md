# High-Throughput API & AI Integration in Swift

A 30-minute interview preparation guide covering REST APIs, gRPC, AI model integration, and seamless data flow patterns in modern Swift.

---

## Table of Contents

1. [Modern Swift Networking Overview](#1-modern-swift-networking-overview)
2. [REST API Integration](#2-rest-api-integration)
3. [gRPC Integration](#3-grpc-integration)
4. [AI Model Output Integration](#4-ai-model-output-integration)
5. [High-Throughput Data Flow Patterns](#5-high-throughput-data-flow-patterns)
6. [Error Handling & Resilience](#6-error-handling--resilience)
7. [Interview Quick Reference](#7-interview-quick-reference)

---

## 1. Modern Swift Networking Overview

Swift's networking has evolved significantly. The key pillars for high-throughput integrations are async/await for clean asynchronous code, URLSession for REST, swift-grpc for gRPC, and Combine or AsyncSequence for reactive streaming.

**Core Architecture Pattern:**

```swift
// Modern networking follows this layered approach:
// 1. Transport Layer (URLSession, gRPC Channel)
// 2. Serialization Layer (Codable, Protobuf)
// 3. Service Layer (API Client abstraction)
// 4. Data Flow Layer (async/await, Combine, AsyncSequence)
```

**Why This Matters for High-Throughput:**
High-throughput means handling many requests efficiently without blocking, managing back-pressure when data arrives faster than you can process it, and maintaining responsiveness. Swift's structured concurrency provides the foundation for all of this.

---

## 2. REST API Integration

### 2.1 Basic async/await Pattern

```swift
struct APIClient {
    private let session: URLSession
    private let baseURL: URL
    private let decoder: JSONDecoder
    
    init(baseURL: URL, configuration: URLSessionConfiguration = .default) {
        self.baseURL = baseURL
        self.session = URLSession(configuration: configuration)
        self.decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .iso8601
    }
    
    func fetch<T: Decodable>(_ endpoint: String) async throws -> T {
        let url = baseURL.appendingPathComponent(endpoint)
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }
        
        return try decoder.decode(T.self, from: data)
    }
}
```

### 2.2 High-Throughput: Concurrent Batch Requests

When you need to fetch multiple resources simultaneously, use TaskGroup for controlled concurrency:

```swift
extension APIClient {
    /// Fetch multiple items concurrently with controlled parallelism
    func fetchBatch<T: Decodable>(
        endpoints: [String],
        maxConcurrent: Int = 6
    ) async throws -> [T] {
        try await withThrowingTaskGroup(of: (Int, T).self) { group in
            var results: [Int: T] = [:]
            var iterator = endpoints.enumerated().makeIterator()
            
            // Start initial batch
            for _ in 0..<min(maxConcurrent, endpoints.count) {
                if let (index, endpoint) = iterator.next() {
                    group.addTask {
                        let result: T = try await self.fetch(endpoint)
                        return (index, result)
                    }
                }
            }
            
            // Process results and add new tasks
            for try await (index, result) in group {
                results[index] = result
                
                // Add next task when one completes
                if let (nextIndex, nextEndpoint) = iterator.next() {
                    group.addTask {
                        let result: T = try await self.fetch(nextEndpoint)
                        return (nextIndex, result)
                    }
                }
            }
            
            return endpoints.indices.compactMap { results[$0] }
        }
    }
}
```

### 2.3 Streaming REST Responses (Server-Sent Events)

For real-time data like AI model outputs or live feeds:

```swift
struct StreamingAPIClient {
    func streamEvents(from url: URL) -> AsyncThrowingStream<ServerEvent, Error> {
        AsyncThrowingStream { continuation in
            let task = Task {
                do {
                    let (bytes, response) = try await URLSession.shared.bytes(from: url)
                    
                    guard let httpResponse = response as? HTTPURLResponse,
                          httpResponse.statusCode == 200 else {
                        continuation.finish(throwing: APIError.invalidResponse)
                        return
                    }
                    
                    var buffer = ""
                    for try await byte in bytes {
                        let char = Character(UnicodeScalar(byte))
                        buffer.append(char)
                        
                        // SSE events are separated by double newlines
                        if buffer.hasSuffix("\n\n") {
                            if let event = parseSSE(buffer) {
                                continuation.yield(event)
                            }
                            buffer = ""
                        }
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
            
            continuation.onTermination = { _ in
                task.cancel()
            }
        }
    }
    
    private func parseSSE(_ raw: String) -> ServerEvent? {
        // Parse "data: {...}\n\n" format
        let lines = raw.split(separator: "\n")
        for line in lines {
            if line.hasPrefix("data: ") {
                let jsonString = String(line.dropFirst(6))
                return try? JSONDecoder().decode(ServerEvent.self, 
                    from: Data(jsonString.utf8))
            }
        }
        return nil
    }
}
```

---

## 3. gRPC Integration

gRPC excels at high-throughput scenarios due to HTTP/2 multiplexing, binary serialization (Protobuf), and built-in streaming support.

### 3.1 Setup Overview

Swift gRPC uses the `grpc-swift` package. You define services in `.proto` files, generate Swift code, then implement clients.

```protobuf
// example.proto
syntax = "proto3";

service DataService {
    // Unary: single request, single response
    rpc GetItem(ItemRequest) returns (ItemResponse);
    
    // Server streaming: single request, stream of responses
    rpc StreamItems(StreamRequest) returns (stream ItemResponse);
    
    // Client streaming: stream of requests, single response
    rpc BatchUpload(stream ItemData) returns (UploadSummary);
    
    // Bidirectional streaming
    rpc LiveSync(stream SyncRequest) returns (stream SyncResponse);
}
```

### 3.2 gRPC Client Implementation

```swift
import GRPC
import NIO

final class GRPCDataClient {
    private let client: DataServiceAsyncClient
    private let group: EventLoopGroup
    
    init(host: String, port: Int) throws {
        self.group = PlatformSupport.makeEventLoopGroup(loopCount: 1)
        
        let channel = try GRPCChannelPool.with(
            target: .host(host, port: port),
            transportSecurity: .tls(.makeClientConfigurationBackedByNIOSSL()),
            eventLoopGroup: group
        )
        
        self.client = DataServiceAsyncClient(channel: channel)
    }
    
    // Unary call
    func getItem(id: String) async throws -> ItemResponse {
        var request = ItemRequest()
        request.id = id
        return try await client.getItem(request)
    }
    
    // Server streaming - consume as AsyncSequence
    func streamItems(query: String) -> AsyncThrowingStream<ItemResponse, Error> {
        AsyncThrowingStream { continuation in
            Task {
                do {
                    var request = StreamRequest()
                    request.query = query
                    
                    for try await response in client.streamItems(request) {
                        continuation.yield(response)
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }
    
    // Client streaming - batch upload
    func batchUpload(items: [ItemData]) async throws -> UploadSummary {
        let requests = AsyncStream<ItemData> { continuation in
            for item in items {
                continuation.yield(item)
            }
            continuation.finish()
        }
        return try await client.batchUpload(requests)
    }
    
    deinit {
        try? group.syncShutdownGracefully()
    }
}
```

### 3.3 gRPC vs REST: When to Use Which

| Aspect | REST | gRPC |
|--------|------|------|
| Serialization | JSON (text) | Protobuf (binary) |
| Protocol | HTTP/1.1 or 2 | HTTP/2 required |
| Streaming | SSE, WebSocket | Native bidirectional |
| Browser support | Universal | Limited (grpc-web) |
| Debugging | Easy (curl, Postman) | Requires tools |
| Schema | Optional (OpenAPI) | Required (.proto) |
| Best for | Public APIs, CRUD | Internal services, streaming |

---

## 4. AI Model Output Integration

AI models (local CoreML or remote APIs like OpenAI) typically return streaming token-by-token output. Here's how to integrate them seamlessly.

### 4.1 CoreML On-Device Integration

```swift
import CoreML

actor MLModelManager {
    private var model: MLModel?
    private let configuration: MLModelConfiguration
    
    init() {
        configuration = MLModelConfiguration()
        configuration.computeUnits = .cpuAndNeuralEngine
    }
    
    func loadModel(named name: String) async throws {
        guard let url = Bundle.main.url(forResource: name, 
                                         withExtension: "mlmodelc") else {
            throw MLError.modelNotFound
        }
        model = try await MLModel.load(contentsOf: url, 
                                        configuration: configuration)
    }
    
    func predict(input: MLFeatureProvider) async throws -> MLFeatureProvider {
        guard let model = model else { throw MLError.modelNotLoaded }
        return try await model.prediction(from: input)
    }
}
```

### 4.2 Streaming AI API Integration (OpenAI-style)

```swift
struct AIStreamingClient {
    private let apiKey: String
    private let baseURL = URL(string: "https://api.openai.com/v1")!
    
    func streamCompletion(
        prompt: String,
        model: String = "gpt-4"
    ) -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            Task {
                var request = URLRequest(url: baseURL.appendingPathComponent("chat/completions"))
                request.httpMethod = "POST"
                request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                
                let body: [String: Any] = [
                    "model": model,
                    "messages": [["role": "user", "content": prompt]],
                    "stream": true
                ]
                request.httpBody = try? JSONSerialization.data(withJSONObject: body)
                
                do {
                    let (bytes, _) = try await URLSession.shared.bytes(for: request)
                    
                    var buffer = ""
                    for try await byte in bytes {
                        buffer.append(Character(UnicodeScalar(byte)))
                        
                        // Process complete SSE lines
                        while let newlineIndex = buffer.firstIndex(of: "\n") {
                            let line = String(buffer[..<newlineIndex])
                            buffer = String(buffer[buffer.index(after: newlineIndex)...])
                            
                            if line.hasPrefix("data: "),
                               let token = extractToken(from: line) {
                                continuation.yield(token)
                            }
                            
                            if line == "data: [DONE]" {
                                continuation.finish()
                                return
                            }
                        }
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }
    
    private func extractToken(from line: String) -> String? {
        let json = String(line.dropFirst(6)) // Remove "data: "
        guard let data = json.data(using: .utf8),
              let response = try? JSONDecoder().decode(StreamResponse.self, from: data),
              let content = response.choices.first?.delta.content else {
            return nil
        }
        return content
    }
}

// Usage: Display tokens as they arrive
func displayStreamingResponse() async {
    let client = AIStreamingClient(apiKey: "...")
    
    do {
        for try await token in client.streamCompletion(prompt: "Explain Swift concurrency") {
            print(token, terminator: "") // Print without newline for seamless output
        }
    } catch {
        print("Error: \(error)")
    }
}
```

### 4.3 Combining AI Output with UI Updates

```swift
@MainActor
class ChatViewModel: ObservableObject {
    @Published var currentResponse = ""
    @Published var isStreaming = false
    
    private let aiClient: AIStreamingClient
    private var streamTask: Task<Void, Never>?
    
    func sendMessage(_ message: String) {
        isStreaming = true
        currentResponse = ""
        
        streamTask = Task {
            do {
                for try await token in aiClient.streamCompletion(prompt: message) {
                    currentResponse += token
                }
            } catch {
                currentResponse += "\n[Error: \(error.localizedDescription)]"
            }
            isStreaming = false
        }
    }
    
    func cancelStream() {
        streamTask?.cancel()
        isStreaming = false
    }
}
```

---

## 5. High-Throughput Data Flow Patterns

### 5.1 Back-Pressure Management with AsyncChannel

When producers generate data faster than consumers can process:

```swift
import AsyncAlgorithms

actor DataProcessor {
    private let channel = AsyncChannel<DataItem>()
    
    func startProducer() async {
        // Producer sends data into channel
        for await item in fetchDataStream() {
            await channel.send(item)
        }
        channel.finish()
    }
    
    func startConsumer() async {
        // Consumer pulls at its own pace - automatic back-pressure
        for await item in channel {
            await processItem(item)
        }
    }
}
```

### 5.2 Debouncing and Throttling

For UI-driven requests (search, etc.):

```swift
import Combine

class SearchManager {
    private var searchSubject = PassthroughSubject<String, Never>()
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        searchSubject
            .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
            .removeDuplicates()
            .filter { !$0.isEmpty }
            .sink { [weak self] query in
                Task { await self?.performSearch(query) }
            }
            .store(in: &cancellables)
    }
    
    func search(_ query: String) {
        searchSubject.send(query)
    }
}
```

### 5.3 Request Coalescing

Combine multiple requests for the same resource:

```swift
actor RequestCoalescer<Key: Hashable, Value> {
    private var inFlight: [Key: Task<Value, Error>] = [:]
    
    func fetch(key: Key, using fetcher: @escaping () async throws -> Value) async throws -> Value {
        // Return existing task if already in flight
        if let existing = inFlight[key] {
            return try await existing.value
        }
        
        // Create new task
        let task = Task {
            defer { inFlight[key] = nil }
            return try await fetcher()
        }
        
        inFlight[key] = task
        return try await task.value
    }
}

// Usage: Multiple callers requesting same user get single network request
let coalescer = RequestCoalescer<String, User>()

// These run concurrently but only one network request fires
async let user1 = coalescer.fetch(key: "user-123") { try await api.fetchUser("123") }
async let user2 = coalescer.fetch(key: "user-123") { try await api.fetchUser("123") }
```

### 5.4 Caching Layer

```swift
actor CacheManager<Key: Hashable, Value> {
    private var cache: [Key: CacheEntry<Value>] = [:]
    private let ttl: TimeInterval
    
    struct CacheEntry<V> {
        let value: V
        let timestamp: Date
        
        func isValid(ttl: TimeInterval) -> Bool {
            Date().timeIntervalSince(timestamp) < ttl
        }
    }
    
    init(ttl: TimeInterval = 300) {
        self.ttl = ttl
    }
    
    func get(_ key: Key) -> Value? {
        guard let entry = cache[key], entry.isValid(ttl: ttl) else {
            cache[key] = nil
            return nil
        }
        return entry.value
    }
    
    func set(_ key: Key, value: Value) {
        cache[key] = CacheEntry(value: value, timestamp: Date())
    }
    
    func getOrFetch(_ key: Key, fetcher: () async throws -> Value) async throws -> Value {
        if let cached = get(key) {
            return cached
        }
        let value = try await fetcher()
        set(key, value: value)
        return value
    }
}
```

---

## 6. Error Handling & Resilience

### 6.1 Retry with Exponential Backoff

```swift
func withRetry<T>(
    maxAttempts: Int = 3,
    initialDelay: TimeInterval = 1.0,
    multiplier: Double = 2.0,
    operation: () async throws -> T
) async throws -> T {
    var lastError: Error?
    var delay = initialDelay
    
    for attempt in 1...maxAttempts {
        do {
            return try await operation()
        } catch {
            lastError = error
            
            // Don't retry on non-recoverable errors
            if case APIError.unauthorized = error { throw error }
            if case APIError.notFound = error { throw error }
            
            if attempt < maxAttempts {
                try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                delay *= multiplier
            }
        }
    }
    
    throw lastError ?? APIError.unknown
}

// Usage
let user = try await withRetry {
    try await api.fetchUser(id: "123")
}
```

### 6.2 Circuit Breaker Pattern

Prevents cascading failures when a service is down:

```swift
actor CircuitBreaker {
    enum State { case closed, open, halfOpen }
    
    private var state: State = .closed
    private var failureCount = 0
    private var lastFailureTime: Date?
    
    private let failureThreshold: Int
    private let resetTimeout: TimeInterval
    
    init(failureThreshold: Int = 5, resetTimeout: TimeInterval = 30) {
        self.failureThreshold = failureThreshold
        self.resetTimeout = resetTimeout
    }
    
    func execute<T>(_ operation: () async throws -> T) async throws -> T {
        // Check if circuit should reset
        if state == .open, let lastFailure = lastFailureTime,
           Date().timeIntervalSince(lastFailure) > resetTimeout {
            state = .halfOpen
        }
        
        guard state != .open else {
            throw CircuitBreakerError.circuitOpen
        }
        
        do {
            let result = try await operation()
            recordSuccess()
            return result
        } catch {
            recordFailure()
            throw error
        }
    }
    
    private func recordSuccess() {
        failureCount = 0
        state = .closed
    }
    
    private func recordFailure() {
        failureCount += 1
        lastFailureTime = Date()
        if failureCount >= failureThreshold {
            state = .open
        }
    }
}
```

---

## 7. Interview Quick Reference

### Key Concepts to Articulate

**"How do you handle high-throughput API integration?"**
- Use async/await with TaskGroup for controlled concurrency
- Implement request coalescing to avoid duplicate requests
- Add caching layer with TTL for frequently accessed data
- Use back-pressure mechanisms (AsyncChannel) when producers outpace consumers

**"REST vs gRPC - when do you choose each?"**
- REST for public APIs, browser clients, simple CRUD operations
- gRPC for internal microservices, streaming data, bidirectional communication, performance-critical paths

**"How do you integrate streaming AI model outputs?"**
- Use AsyncThrowingStream to wrap SSE or streaming responses
- Parse tokens incrementally and yield to UI
- Maintain cancellation support for user interruption
- Buffer partial data until complete tokens available

**"What patterns ensure resilience?"**
- Retry with exponential backoff for transient failures
- Circuit breaker to prevent cascade failures
- Timeout configuration per request type
- Graceful degradation (cache fallback, reduced functionality)

### Code Patterns to Know Cold

```swift
// 1. Basic async fetch
func fetch<T: Decodable>(_ url: URL) async throws -> T {
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode(T.self, from: data)
}

// 2. Concurrent batch with limit
await withThrowingTaskGroup(of: Item.self) { group in
    for item in items.prefix(maxConcurrent) {
        group.addTask { try await process(item) }
    }
    // ... add new tasks as others complete
}

// 3. AsyncThrowingStream for custom async sequences
AsyncThrowingStream<Element, Error> { continuation in
    Task {
        // yield elements
        continuation.yield(element)
        // finish when done
        continuation.finish()
    }
}

// 4. Actor for thread-safe state
actor DataManager {
    private var cache: [String: Data] = [:]
    func get(_ key: String) -> Data? { cache[key] }
    func set(_ key: String, value: Data) { cache[key] = value }
}
```

### Vocabulary Checklist

- **Structured Concurrency**: Tasks have clear parent-child relationships, automatic cancellation propagation
- **Back-pressure**: When consumers signal producers to slow down to prevent overflow
- **Request Coalescing**: Combining multiple requests for same resource into single network call
- **Circuit Breaker**: Pattern that "trips open" after failures, preventing cascading failures
- **Exponential Backoff**: Progressively longer delays between retry attempts
- **Protobuf**: Binary serialization format used by gRPC, more efficient than JSON
- **Server-Sent Events (SSE)**: HTTP-based streaming from server to client
- **AsyncSequence**: Protocol for asynchronous iteration, Swift's async equivalent of Sequence

---

**You've got this.** A solid foundation in iOS development combined with these modern patterns puts you in a strong position. The key shift is that everything flows through async/await now instead of completion handlers, and actors replace manual lock management. The concepts of efficient networking, caching, and error handling remain the same - it's just cleaner syntax.