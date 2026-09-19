# SwiftUI Comprehensive Interview Guide

- 1 Core Concepts & Philosophy — Declarative vs imperative, View protocol basics
- View Protocol & Modifiers — some View, modifier order matters
- Layout System — VStack/HStack/ZStack, Spacer, GeometryReader
- State Management — @State, @Binding, @StateObject, @ObservedObject, @EnvironmentObject
- Observation Framework — @Observable (iOS 17+), @Bindable
- Lists & Navigation — List, NavigationStack, NavigationLink
- Common Controls — TextField, Button, Toggle, Picker, AsyncImage
- Sheets, Alerts & Popovers — .sheet(), .alert(), @Environment(.dismiss)
- Animations — withAnimation, .animation(), .transition()
- Async/Await Integration — .task, .refreshable, async loading patterns
- Custom Views & Composition — Extracting subviews, @ViewBuilder
- UIKit Interoperability — UIViewRepresentable, UIViewControllerRepresentable, Coordinator
- Environment & Preferences — Custom EnvironmentKey, PreferenceKey
- Common Interview Questions — State ownership, navigation, performance

## Chapter 1: Core Concepts & Philosophy

SwiftUI is a **declarative** UI framework introduced in 2019. Unlike UIKit where you imperatively tell the system *how* to update views, SwiftUI describes *what* the UI should look like for a given state—the framework handles updates automatically.

**Key principles:**
- Views are value types (structs conforming to `View`)
- UI is a function of state
- Single source of truth for data
- Composition over inheritance

```swift
struct ContentView: View {
    var body: some View {
        Text("Hello, SwiftUI")
    }
}
```

The `body` property is recomputed whenever state changes. SwiftUI diffs the result and updates only what changed.

---

## Chapter 2: View Protocol & Modifiers

Every SwiftUI view conforms to the `View` protocol, requiring a single computed property `body` that returns `some View` (an opaque type).

**Modifiers** return new views wrapping the original. Order matters:

```swift
Text("Hello")
    .padding()        // Adds padding first
    .background(.blue) // Background covers padded area

Text("Hello")
    .background(.blue) // Background only covers text
    .padding()        // Padding outside background
```

**Common modifiers:** `.font()`, `.foregroundStyle()`, `.frame()`, `.padding()`, `.background()`, `.clipShape()`, `.overlay()`, `.opacity()`

---

## Chapter 3: Layout System

SwiftUI uses a three-step layout process:
1. Parent proposes size to child
2. Child chooses its own size
3. Parent positions child

**Primary layout containers:**

```swift
VStack(alignment: .leading, spacing: 12) { } // Vertical
HStack(alignment: .center, spacing: 8) { }   // Horizontal
ZStack(alignment: .topLeading) { }           // Overlapping

LazyVStack { } // Lazy loading for performance
LazyHStack { }
```

**Spacer** consumes available space. **GeometryReader** provides parent's size (use sparingly).

**Grid layouts (iOS 16+):**
```swift
Grid {
    GridRow {
        Text("A"); Text("B")
    }
    GridRow {
        Text("C"); Text("D")
    }
}
```

---

## Chapter 4: State Management

This is the heart of SwiftUI. Different property wrappers for different ownership patterns:

| Wrapper | Ownership | Use Case |
|---------|-----------|----------|
| `@State` | View owns it | Simple value types local to view |
| `@Binding` | View doesn't own | Child view modifies parent's state |
| `@StateObject` | View owns it | Reference type (ObservableObject) created by view |
| `@ObservedObject` | View doesn't own | Reference type passed in |
| `@EnvironmentObject` | Injected via environment | Shared across view hierarchy |
| `@Environment` | System values | Color scheme, size class, dismiss action |

```swift
// @State - local value
struct Counter: View {
    @State private var count = 0
    
    var body: some View {
        Button("Count: \(count)") { count += 1 }
    }
}

// @Binding - child modifies parent
struct ToggleRow: View {
    @Binding var isOn: Bool
    
    var body: some View {
        Toggle("Setting", isOn: $isOn) // $ creates binding
    }
}

// Usage
@State private var setting = false
ToggleRow(isOn: $setting)
```

**ObservableObject pattern:**
```swift
class UserSettings: ObservableObject {
    @Published var username = ""
    @Published var isLoggedIn = false
}

struct ProfileView: View {
    @StateObject private var settings = UserSettings() // Create once
    
    var body: some View {
        ChildView(settings: settings)
    }
}

struct ChildView: View {
    @ObservedObject var settings: UserSettings // Passed in
}
```

---

## Chapter 5: Observation Framework (iOS 17+)

The new `@Observable` macro simplifies reactive objects—no more `@Published`:

```swift
@Observable
class UserSettings {
    var username = ""      // Automatically observed
    var isLoggedIn = false
}

struct ContentView: View {
    @State private var settings = UserSettings() // Use @State, not @StateObject
    
    var body: some View {
        Text(settings.username) // Automatic dependency tracking
    }
}
```

**Key differences from ObservableObject:**
- Finer-grained updates (only views using changed properties re-render)
- Use `@State` for owned observable objects
- Use `@Bindable` to create bindings to properties

---

## Chapter 6: Lists & Navigation

**Basic List:**
```swift
struct Item: Identifiable {
    let id = UUID()
    let name: String
}

struct ListView: View {
    let items: [Item]
    
    var body: some View {
        List(items) { item in
            Text(item.name)
        }
    }
}
```

**NavigationStack (iOS 16+, replaces NavigationView):**
```swift
struct ContentView: View {
    @State private var path = NavigationPath()
    
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
            .navigationTitle("Items")
        }
    }
}
```

**Programmatic navigation:** Append to `path` to push, remove to pop.

---

## Chapter 7: Common Controls

```swift
// Text input
@State private var text = ""
TextField("Placeholder", text: $text)
SecureField("Password", text: $password)
TextEditor(text: $longText)

// Buttons
Button("Tap Me") { action() }
Button(action: action) { Label("Save", systemImage: "square.and.arrow.down") }

// Toggle, Picker, Slider
Toggle("Enable", isOn: $isEnabled)
Picker("Choice", selection: $selected) {
    Text("A").tag(0)
    Text("B").tag(1)
}
Slider(value: $amount, in: 0...100)

// Async image
AsyncImage(url: url) { image in
    image.resizable().scaledToFit()
} placeholder: {
    ProgressView()
}
```

---

## Chapter 8: Sheets, Alerts & Popovers

```swift
struct ContentView: View {
    @State private var showSheet = false
    @State private var showAlert = false
    
    var body: some View {
        Button("Show Sheet") { showSheet = true }
            .sheet(isPresented: $showSheet) {
                SheetContent()
            }
        
        Button("Show Alert") { showAlert = true }
            .alert("Title", isPresented: $showAlert) {
                Button("OK") { }
                Button("Cancel", role: .cancel) { }
            } message: {
                Text("Alert message")
            }
    }
}
```

**Item-based presentation:**
```swift
.sheet(item: $selectedItem) { item in
    DetailView(item: item)
}
```

**Dismiss from within:**
```swift
@Environment(\.dismiss) private var dismiss

Button("Close") { dismiss() }
```

---

## Chapter 9: Animations

SwiftUI makes animation declarative. Wrap state changes or add modifiers:

```swift
// Implicit animation - animates all animatable changes
withAnimation(.spring()) {
    isExpanded.toggle()
}

// Animation modifier - animates when value changes
Circle()
    .scaleEffect(isExpanded ? 2 : 1)
    .animation(.easeInOut, value: isExpanded)

// Transitions for view insertion/removal
if showDetails {
    Text("Details")
        .transition(.slide)
}
```

**Common animations:** `.linear`, `.easeIn`, `.easeOut`, `.spring()`, `.interpolatingSpring()`

---

## Chapter 10: Async/Await Integration

```swift
struct ContentView: View {
    @State private var data: [Item] = []
    @State private var isLoading = false
    
    var body: some View {
        List(data) { item in
            Text(item.name)
        }
        .task {
            // Runs when view appears, cancelled on disappear
            await loadData()
        }
        .refreshable {
            // Pull-to-refresh
            await loadData()
        }
    }
    
    func loadData() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            data = try await api.fetchItems()
        } catch {
            // Handle error
        }
    }
}
```

---

## Chapter 11: Custom Views & View Composition

**Extract subviews for reuse:**
```swift
struct CardView: View {
    let title: String
    let subtitle: String
    
    var body: some View {
        VStack(alignment: .leading) {
            Text(title).font(.headline)
            Text(subtitle).foregroundStyle(.secondary)
        }
        .padding()
        .background(.regularMaterial)
        .cornerRadius(12)
    }
}
```

**ViewBuilder for custom containers:**
```swift
struct Card<Content: View>: View {
    @ViewBuilder let content: Content
    
    var body: some View {
        VStack {
            content
        }
        .padding()
        .background(.regularMaterial)
        .cornerRadius(12)
    }
}

// Usage
Card {
    Text("Title")
    Text("Subtitle")
}
```

---

## Chapter 12: UIKit Interoperability

**Wrap UIKit views:**
```swift
struct ActivityIndicator: UIViewRepresentable {
    var isAnimating: Bool
    
    func makeUIView(context: Context) -> UIActivityIndicatorView {
        UIActivityIndicatorView(style: .large)
    }
    
    func updateUIView(_ uiView: UIActivityIndicatorView, context: Context) {
        isAnimating ? uiView.startAnimating() : uiView.stopAnimating()
    }
}
```

**Wrap UIKit view controllers:**
```swift
struct ImagePicker: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    @Environment(\.dismiss) private var dismiss
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: ImagePicker
        
        init(_ parent: ImagePicker) { self.parent = parent }
        
        func imagePickerController(_ picker: UIImagePickerController, 
                                   didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            parent.image = info[.originalImage] as? UIImage
            parent.dismiss()
        }
    }
}
```

---

## Chapter 13: Environment & Preferences

**Environment** passes values down the hierarchy:
```swift
// System values
@Environment(\.colorScheme) var colorScheme
@Environment(\.horizontalSizeClass) var sizeClass

// Custom environment values
private struct ThemeKey: EnvironmentKey {
    static let defaultValue = Theme.light
}

extension EnvironmentValues {
    var theme: Theme {
        get { self[ThemeKey.self] }
        set { self[ThemeKey.self] = newValue }
    }
}

// Inject
ContentView()
    .environment(\.theme, .dark)
```

**Preferences** pass values up (child to parent):
```swift
struct SizePreferenceKey: PreferenceKey {
    static var defaultValue: CGSize = .zero
    static func reduce(value: inout CGSize, nextValue: () -> CGSize) {
        value = nextValue()
    }
}

// Child reports size
Text("Hello")
    .background(GeometryReader { geo in
        Color.clear.preference(key: SizePreferenceKey.self, value: geo.size)
    })

// Parent reads it
.onPreferenceChange(SizePreferenceKey.self) { size in
    print("Child size: \(size)")
}
```

---

## Chapter 14: Common Interview Questions

**Q: What's the difference between @State and @StateObject?**
`@State` is for value types owned by the view. `@StateObject` is for reference types (ObservableObject) where the view owns the lifecycle—created once, survives re-renders.

**Q: When would you use @ObservedObject vs @StateObject?**
`@StateObject` when the view creates the object. `@ObservedObject` when received from parent. Using `@ObservedObject` for an object you create causes it to reset on re-render.

**Q: How do you share state across many views?**
`@EnvironmentObject` for ObservableObject, or `@Environment` with custom keys. With iOS 17's `@Observable`, inject using `.environment()`.

**Q: Why might a view not update when state changes?**
Common issues: mutating a class property without `@Published`, using `@ObservedObject` instead of `@StateObject`, or the view doesn't read the changed property in `body`.

**Q: How do you handle navigation in SwiftUI?**
`NavigationStack` (iOS 16+) with `NavigationLink(value:)` and `.navigationDestination(for:)`. Programmatic navigation via `NavigationPath`.

**Q: What are the performance considerations?**
Use `LazyVStack`/`LazyHStack` for large lists, avoid heavy computation in `body`, use `Equatable` conformance, minimize view hierarchy depth, use `.id()` carefully.

---

## Quick Reference Cheat Sheet

```
State Management:
  @State          → View owns value type
  @Binding        → Two-way connection to parent's state
  @StateObject    → View owns ObservableObject
  @ObservedObject → View borrows ObservableObject
  @EnvironmentObject → Injected ObservableObject
  @Observable (iOS 17) → Modern reactive class
  
Layout:
  VStack, HStack, ZStack → Basic stacking
  LazyVStack, LazyHStack → Performance for many items
  Spacer → Push content apart
  GeometryReader → Access parent size

Navigation:
  NavigationStack → Container
  NavigationLink(value:) → Trigger navigation
  .navigationDestination(for:) → Define destinations
  
Presentation:
  .sheet(isPresented:) → Modal sheet
  .alert(isPresented:) → Alert dialog
  .fullScreenCover() → Full screen modal
  
Lifecycle:
  .onAppear { } → View appeared
  .onDisappear { } → View disappeared
  .task { } → Async work tied to view lifecycle
  .onChange(of:) { } → React to value changes
```

---

Good luck with your interview! The key themes interviewers look for: understanding declarative vs imperative, proper state management ownership, and when to use each property wrapper.