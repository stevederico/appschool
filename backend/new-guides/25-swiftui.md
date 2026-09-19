# SwiftUI - Interview Ready Guide

---

## What It Is

SwiftUI is Apple's declarative UI framework (2019) for building interfaces across all Apple platforms. Unlike UIKit's imperative approach, you describe what the UI should look like, and SwiftUI handles the updates.

---

## Core Concepts

### Declarative Syntax

```swift
struct ContentView: View {
    @State private var count = 0
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Count: \(count)")
                .font(.largeTitle)
            
            Button("Increment") {
                count += 1
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}
```

### Property Wrappers

```swift
@State           // Local view state, value type
@Binding         // Two-way connection to parent's state
@StateObject     // Creates/owns ObservableObject
@ObservedObject  // References existing ObservableObject
@EnvironmentObject  // Shared object from environment
@Environment     // System values (colorScheme, dismiss)
@Published       // Triggers view updates when changed
```

### State Management

```swift
// Local state
@State private var name = ""

// Observable object
class UserViewModel: ObservableObject {
    @Published var user: User?
    @Published var isLoading = false
    
    func fetchUser() async {
        isLoading = true
        user = await api.getUser()
        isLoading = false
    }
}

// Usage
struct ProfileView: View {
    @StateObject private var viewModel = UserViewModel()
    
    var body: some View {
        Group {
            if viewModel.isLoading {
                ProgressView()
            } else if let user = viewModel.user {
                Text(user.name)
            }
        }
        .task {
            await viewModel.fetchUser()
        }
    }
}
```

---

## Layout System

```swift
// Stacks
VStack { }  // Vertical
HStack { }  // Horizontal
ZStack { }  // Overlay

// Lazy stacks (efficient for many items)
LazyVStack { }
LazyHStack { }

// Grid
LazyVGrid(columns: [
    GridItem(.flexible()),
    GridItem(.flexible())
]) {
    ForEach(items) { item in
        ItemView(item: item)
    }
}

// Modifiers
Text("Hello")
    .font(.title)
    .foregroundColor(.blue)
    .padding()
    .background(Color.gray.opacity(0.2))
    .cornerRadius(8)
```

---

## Navigation

```swift
// NavigationStack (iOS 16+)
NavigationStack {
    List(items) { item in
        NavigationLink(value: item) {
            Text(item.name)
        }
    }
    .navigationDestination(for: Item.self) { item in
        ItemDetailView(item: item)
    }
    .navigationTitle("Items")
}

// Sheets
@State private var showSheet = false

Button("Show") { showSheet = true }
    .sheet(isPresented: $showSheet) {
        SheetView()
    }
```

---

## Lists and Data

```swift
struct ItemList: View {
    @State private var items = ["A", "B", "C"]
    
    var body: some View {
        List {
            ForEach(items, id: \.self) { item in
                Text(item)
            }
            .onDelete(perform: delete)
            .onMove(perform: move)
        }
    }
    
    func delete(at offsets: IndexSet) {
        items.remove(atOffsets: offsets)
    }
    
    func move(from source: IndexSet, to destination: Int) {
        items.move(fromOffsets: source, toOffset: destination)
    }
}
```

---

## Async/Await

```swift
struct AsyncView: View {
    @State private var data: [Item] = []
    
    var body: some View {
        List(data) { item in
            Text(item.name)
        }
        .task {
            data = await fetchData()
        }
        .refreshable {
            data = await fetchData()
        }
    }
}
```

---

## Interview Questions

**Q: How does SwiftUI differ from UIKit?**

A: SwiftUI is declarative (describe what), UIKit is imperative (describe how). SwiftUI uses structs and value types, UIKit uses classes. SwiftUI has automatic state-driven updates, UIKit requires manual updates. SwiftUI is cross-platform, UIKit is iOS only.

**Q: Explain @State vs @StateObject vs @ObservedObject.**

A: @State for simple value types owned by view. @StateObject creates and owns an ObservableObject (use for initialization). @ObservedObject references existing ObservableObject (passed from parent). @StateObject persists across view recreations, @ObservedObject doesn't.

**Q: How does SwiftUI handle view updates?**

A: Views are structs with body property. When state changes, body is recomputed. SwiftUI diffs the result and updates only changed parts. Property wrappers (@State, @Published) trigger this process.

---

## Resources

- https://developer.apple.com/documentation/swiftui
- https://www.hackingwithswift.com/100/swiftui
