
let (bytes, _) = try await URLSession.shared.bytes(for: request)
for try await line in bytes.lines {
    guard line.hasPrefix("data: ") else { continue }
    let chunk = String(line.dropFirst(6))
    await MainActor.run { self.text += chunk }
}

let (bytes, _) = try await URLSession.shared.bytes(for: request)
for try await line in bytes.lines {
    guard line.hasPrefix("data: ") else { continue }
    let chunk = String(line.dropFirst(6))
    await MainActor.run { self.text += chunk }
}


let (bytes, _) = try await URLSession.shared.bytes(for: request)

for try await line in bytes.lines {
    guard line.hasPrefix("data: ") else { continue }
    let chunk =String(line.dropFirst(6))
    await MainActor.run { self.text += chunk }
}






let (bytes, _ ) = URLSession.shared.bytes(for: request)

for try await line in bytes.lines {
    guard line.hasPrefix("data: ") else { continue}
    let chunk = String(line.dropFirst(6))
    await MainActor.run {self.text += chunk}
}




struct SearchView: View {
    @StateObject var vm = VM()
    
    var body: some View {
        TextField("Search", text: $vm.searchText)
        
        List(vm.results) { item in
            Text(item.name)
        }
    }
}


class ViewModel: ObservableObject {
    @Published var searchText = ""
    @Published var results: [Item] = []
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        $searchText
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .removeDuplicates()
            .sink { [weak self] query in
                self?.search(query)
            }
            .store(in: &cancellables)
    }
    
    func search(_ query: String) {
        // fetch from API
    }
}

class SearchVC: UIViewController {
    let searchField = UITextField()
    let vm = VM()
    var cancellables = Set<AnyCancellable>()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        vm.$results
            .receive(on: RunLoop.main)
            .sink { [weak self] items in
                self?.updateUI(items)
            }
            .store(in: &cancellables)
    }
    
    func updateUI(_ items: [Item]) {
        // reload tableview, etc.
    }
}