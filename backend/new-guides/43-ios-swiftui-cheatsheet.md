| Element | Example |
|---------|---------|
| `Text` | `Text("Hello").font(.title).bold()` |
| `TextField` | `TextField("Name", text: $name)` |
| `SecureField` | `SecureField("Password", text: $password)` |
| `Button` | `Button("Tap") { print("tapped") }` |
| `Image` | `Image(systemName: "star.fill").foregroundColor(.yellow)` |
| `Toggle` | `Toggle("Dark Mode", isOn: $isDark)` |
| `Slider` | `Slider(value: $volume, in: 0...100)` |
| `Picker` | `Picker("Size", selection: $size) { Text("S").tag(0); Text("M").tag(1) }` |
| `List` | `List(items) { item in Text(item.name) }` |
| `ScrollView` | `ScrollView { VStack { ForEach(0..<50) { Text("Row \($0)") } } }` |
| `VStack` | `VStack { Text("Top"); Text("Bottom") }` |
| `HStack` | `HStack { Text("Left"); Spacer(); Text("Right") }` |
| `ZStack` | `ZStack { Color.blue; Text("On top") }` |
| `Spacer` | `HStack { Text("Left"); Spacer() }` |
| `NavigationStack` | `NavigationStack { List { NavigationLink("Go", destination: DetailView()) } }` |
| `NavigationLink` | `NavigationLink("Details", destination: Text("Detail"))` |
| `Sheet` | `.sheet(isPresented: $showModal) { ModalView() }` |
| `Alert` | `.alert("Title", isPresented: $showAlert) { Button("OK") { } }` |