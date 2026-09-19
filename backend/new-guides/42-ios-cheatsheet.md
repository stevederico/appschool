# iOS Interview Anchor Cheat Sheet

---

## Rep Keywords

**Table View (Traditional)**
- `UITableViewDataSource`
- `register`
- `addSubview`
- `constraints`
- `numberOfRows`
- `cellForRowAt`

**Table View (Diffable)**
- `UITableViewDiffableDataSource<Int, User>`
- `snapshot`
- `appendSections`
- `appendItems`
- `apply`

**Combine**
- `@Published`
- `$prop`
- `.debounce`
- `.map`
- `.sink`
- `.store(in:)`

**@State**
- `@State var`
- mutate directly

**@Binding**
- `@State` parent
- `$binding`
- `@Binding` child

**@StateObject + @ObservedObject**
- `ObservableObject` + `@Published`
- `@StateObject` parent
- `@ObservedObject` child

**Async/Await Parallel**
- `async let a`
- `async let b`
- `try await (a, b)`

---

Day-Of Reminders
UIKit Anchors
swift// TableView setup
tableView.register(UITableViewCell.self, forCellReuseIdentifier: "Cell")
tableView.dataSource = self
tableView.delegate = self

// Auto Layout
view.translatesAutoresizingMaskIntoConstraints = false
NSLayoutConstraint.activate([
    view.topAnchor.constraint(equalTo: parent.safeAreaLayoutGuide.topAnchor, constant: 16),
    view.leadingAnchor.constraint(equalTo: parent.leadingAnchor, constant: 16),
    view.trailingAnchor.constraint(equalTo: parent.trailingAnchor, constant: -16)
])
async/await Anchor
swiftfunc fetchData() async throws -> [Item] {
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode([Item].self, from: data)
}
Combine Anchor
swifttextField.textPublisher
    .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
    .removeDuplicates()
    .sink { [weak self] text in
        self?.search(text)
    }
    .store(in: &cancellables)


## Table View (Traditional)

```swift
class VC: UIViewController, UITableViewDataSource, UITableViewDelegate {
    let tableView = UITableView()
    var objects: [User] = []
    
    // viewDidLoad:
    tableView.delegate = self
    tableView.dataSource = self
    tableView.register(UITableViewCell.self, forCellReuseIdentifier: "cell")
    tableView.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(tableView)
    // constraints
    
    // numberOfRowsInSection → objects.count
    // cellForRowAt → dequeueReusableCell(withIdentifier:for:)
}
```

---

## Table View (Diffable)

```swift
var dataSource: UITableViewDiffableDataSource<Int, User>?

dataSource = UITableViewDiffableDataSource(tableView: tableView) { tableView, indexPath, user in
    let cell = tableView.dequeueReusableCell(withIdentifier: "cell", for: indexPath)
    cell.textLabel?.text = user.name
    return cell
}

var snapshot = NSDiffableDataSourceSnapshot<Int, User>()
snapshot.appendSections([0])
snapshot.appendItems(results)
await dataSource?.apply(snapshot)
```

---

## Networking

```swift
func fetchData() async throws -> [User] {
    let url = URL(string: "...")!
    let (data, response) = try await URLSession.shared.data(from: url)
    guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
        throw URLError(.badServerResponse)
    }
    return try JSONDecoder().decode([User].self, from: data)
}
```

---

## Combine Pipeline

```swift
$searchText
    .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
    .map { query in self.items.filter { $0.contains(query) } }
    .sink { print($0) }
    .store(in: &cancellables)
```

---

## SwiftUI State

| Wrapper | Use |
|---------|-----|
| `@State` | View owns it, simple types |
| `@Binding` | Child writes to parent's state |
| `@StateObject` | View creates the ObservableObject |
| `@ObservedObject` | View receives the ObservableObject |

```swift
class VM: ObservableObject { @Published var count = 0 }

// Parent: @StateObject var vm = VM()
// Child:  @ObservedObject var vm: VM
```

---

## Async/Await Parallel

```swift
async let users = fetchUsers()
async let posts = fetchPosts()
let (u, p) = try await (users, posts)
```

---

## Auto Layout

```swift
view.addSubview(tableView)
tableView.translatesAutoresizingMaskIntoConstraints = false
NSLayoutConstraint.activate([
    tableView.topAnchor.constraint(equalTo: view.topAnchor),
    tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
    tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
    tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
])
```

---

## Swift 6 Concurrency Fixes

```swift
nonisolated struct User: Codable, Hashable, Sendable { }
@preconcurrency import UIKit
```

---

## Quick Reminders

- `addSubview` before constraints
- `register` before `dequeue`
- `try await` not just `await` for throwing
- `ObservableObject` = protocol, `@ObservedObject` = wrapper
