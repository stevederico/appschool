Requirements
- Expert in Swift
- deep knowledge of SwiftUI 
- deep knowledge of UIKit
- Combine - Skilled in concurrency and reactive programming (Combine) for responsive, real-time apps.
- Built high-throughput integrations with APIs (REST, gRPC) or AI model outputs, ensuring seamless data flow.

The first session will be a 30-minute session in SwiftUI. Should this go well, we'd like to accelerate the process by connecting you with our consumer engineering lead, for a 45-minute technical session on the same day.




LEARNING WIHT AI
  - have it write college level breakdowns on subjects
  - have it make 1 hour classes aross the subjects, get meters
  - take quizes

- - [ ] Performance Optimization and low-level tool

swift sucks
- layout is insanely complex to draw, 4 lines of contraints for every element
- build and run is slow
- still requires @objc for addTarget!!!! that's like onlick and swift isn't supported!

UIKit
1 Foundation — App lifecycle, views, and view controllers DONE
2 Layout — Auto Layout, stack views, and constraints DONE
3 Controls & Input — Buttons, text fields, gestures
4 Lists — Table views and collection views
5 Navigation — Navigation controllers, tab bars, modals
6 Animation — UIView animations, Core Animation, transitions
7 Data Flow — Delegation, notifications, target-action
8 Advanced — Drag/drop, context menus, accessibility
9 Modern UIKit — Diffable data sources, compositional layout, SwiftUI interop
9.5 completed
9.6 Coordinator Pattern
- 9.7 Modern UIKit: Compositional Layout
- 9.8 Content Configuration (Modern Cells)
- 9.9 Async/Await in UIKit
- 9.10 Where to Go From Here
- 9.11 Exercise



Chp2.md




redBox.translatesAutoresizingMaskIntoConstraints = false

use NSLayoutConstraint.activate([]) to activate constraints
use centerXanchor and centerYnahcor, widthanchor hieghtAnchor
leadingNachor, trailinganchor, topanchor, bottomanchor, leftanchor, rightanchor

centerXAnchor, centerYAnchor

widthAnchor, hieghtAnchor

view.safeArealayoutOu

mustadd the stackview to the mainview before setting it's contraints

label.translatesAutoresizingMaskIntoConstraints = false is required!! you will Unable to simultaneously satisfy constraints if you forget it

you can reference yourself in the contraints
  redBox.heightAnchor.constraint(equalTo: redBox.widthAnchor, multiplier: 0.5),

CHP3
@o
  @objc func buttonTapped() {
        print("Button was Tapped")
    }


UIButton.Configuration is great for stylying
.fileld - solidbackgorund
config.image = UIImage(systemName: "arrow.right") to use system icons


you can now dismiss keybaord through v view.endEditing(true)!!
you dont need a delegate on UITextField. you can also do textField.resignFirstResponder

slider.isContinuous = true continuous delegate updates, false is jsut the final value, i,e slider stopped


remember to add view.isUserInteractionEnabled = true on gestureregconiser parents

return taccept next work of autocomeplte, tab for eveythgin


CHP 4

        let tableView = UITableView()
        tableView.translatesAutoresizingMaskIntoConstraints = false
        tableView.dataSource = self
        tableView.delegate = self
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "cell")
        view.addSubview(tableView)
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {

            func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {


  // Always set these — don't assume they're empty
    cell.textLabel?.text = tasks[indexPath.row]
    cell.imageView?.image = nil  // Clear old image
    cell.accessoryType = .none   // Clear old accessory


    need to understand handlers and clousures { _, _, completion in
        print("Archived: \(self.tasks[indexPath.row])")
        completion(true)
    }

CHP 6

frame = position and size in parent's coordinate system
bounds = position and size in own coordinate system


Chap 7 

// GOOD — breaks the cycle
addVC.onSave = { [weak self] item in
    self?.data.append(item)
}


CHP 8 

  DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {


CHP 9
Presnetable mmeans it's swift with uikit inside



SPEEDRUN-v1
- Value is copied , reference is shared
- struct is value, creates a copy
- class is reference, shares the instance

default to structs, classes for indentity and inheritenance or OBJC

1.2 optionals
 name String? = nil

 if let name = name {} if there is a value
 guard let name = name else {return} else if there isn't
 let display = name ?? "default"
 let count = name?.count this is chaining but it returns a Int? you don't know if it's non-nil



## Speedrun - 1hr

some vs any 
some Identifiable - opaque type, complier knwos the type, better perofmance

any Identifiable - existential/type-erased, flexiable but he boxes the value

[weak self]

guard let self else {return} replaced guard let self = self


2 Concurrency
replaces GrandCentralDispatch and completion handlers

instead of callbacks that run "later"

now you write linear code that suspends at await keybaord, the thread isn't blocked through, 

used to use DispatchQuene.main.async {
  self.display(posts)
}

let user = try await fetchUser()
let posts = try await fetchPosts(for: user)
display(posts)

Actors are replacement for dispatchQueues, they protect state and work with concurrnecy, Sendable @MainActor 
await is potential suspension poitns, the complier checks now upfront before a runtime crash happens

3 Combine
its reactive frame like RxSwift
Combine streams over time, search debounce, real-time updates, binding the UI to data

async/await are for request and response fetch requts

the $searchText.debournce().flatMap() pattern is used a search as you type. 

4. SwiftUI State

@State - store a value the view owns
@Binding - child can modify parent's value
@StateObject - create a reference-type object
@ObservedObject - 


## Speedrun-1hr-v2
### 1.1 Value vs Reference
value is copied
reference is shared

class is a reference
struct/enum are value

### 1.2 Optionals
value could be nil, swift handles at compile time, not run-time, reduces app crashes

var name: String? = nil

if let name = name {
  print(name)
}

guard let name = name else {return}
print(name)

let display = name ?? "DEFAULT"

let count = name?.count // this returns a Int?


### 1.3 Closures and Memory
clousre is just an inline function

let greet = { (name: String) in
  print("Hello \(name)")
}

greet("Steve")

when you create a clousire make sure you use [weak self], otherwise the clousre will create a reference to self and it will never be broken

let a = { [weak self] in 
  guard let self else {return}
  self.doSomething()
}

weak - becomes nil if the object is deallocated
unowned crashes if the object is deallocated - dont use unless you are sure it won't be deallocated

@escaping a closure that is called after the function returns
  xcode requires you mark these
  func doLater(completion @escaping () -> Void){
    DispatchQueue.main.asyncAfter(deadline: .now() + 1){
      completion()
    }
  }

### 1.4 Protocols & Generics
protocol says you must have these properties or methods, i.e. like a delegate protocol

protocol Identifiable {
  var id: String { get }
}

struct User: Identifiable {
  var id: String
}

extensions let you add a default implementaiton of a method or propertie

extension Identifiable {
  func describe() -> String {
    return "ID: \(id)"
  }
}

Generics
you can write one function that works with multiple types

func findFirst(in array: [String]) -> String? {
  return array.first
}

func findFirst<T: Colleciton>(in collection: T) -> T.Elment? {
  return collection.first
}

<> declares a type placeholder. <T: > means call the placeholder T, <T: Collection> is saying it needs to conform to Collection protocol

T.Element is just a prop frol Collection

IN
numbers.map({ (n: Int) -> String in 
  return String(n)
})

numbers.map({ n in String(n)})

numbers.map {n in String(n)}

numbers.map {String($0)}

some vs any 

some Identifiable one specific type that conforms
any Identiifiable any type that confirms


## 2 Concurrency
async/await

func fetchUser() async throws -> User {
  let (data, _) = try await URLSession.shared.data(from: url)
  return try JSONDecoder().decode(User.self, from: data)
}

let user = try await fetchUser()
let posts = try await fetchPosts(for: user)

throws means it can fial with an error
if you call a function that has throws you must call with try

do {
  let user try await fetchUser()
} catch {
  print("Failed: \(error))
}

let user = try? await fetchUser()

Task
allows you to call async code from non-asyn context

Task {
  let user = try await fetchUser()
  print(user)
}

await doesn't block the thtread is sypends teh thread the freed and the execeution resumts when the result is complete

2.2 Parallel Execution
sequntial one after another

let user = try await fetchUser() // this one
let posts = try await fetchPosts() // then this one

parallee with async let 

async let user = fetchUser() //same time
async let posts = fetchPosts() // same time

let (u, p) = try await (user, posts) // waits for both

parallele with TaskGroup

let users = try await withThrowingTaskGroup(of User.self){ group in
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

## 2.3 Actors & @MainActor
the issue is with many tasks accessing mutable data, the state gets changed inconsistnely across threads, makes bugs

actors make sure only one task can access mutable data at a time

actor Counter {
  private var value = 0

  func increment(){
    value +=1
  }

  func getValue() -> Int {
    return value
  }
}

you must call an actor with await

let counter = Counter()
await counter.increment()
let value = await counter.getValue()

@MainActor is a special actor that guatnees code runs on main thread, must have for UI work

@MainActor
classViewModel: ObserveableObject {
  @Published var items: [Item] = []

  func load() async {
    let fetched = await api.fetchItems()
    items = fetched
  }
}

ObserveableObject - this class has data that views shoudl watch,
@Publishable means trigger view updates when these properties change
 now @Observable replaces @Publishable and ObservableObejct, 

2.4 Sendable
safe to pass betwene concurrent tasks
structs and enums are always sendable

struct User: Sendable {
  let id: Int
  let name: String
}

classes are not aways sendbale, unless they are final and all properties are immutable

final class Config: Sendable {
  let apiKey: String
  init(apiKey: String){
    self.apiKey = apiKey
  }
}

Section 3.1 Combine (very similar to KVO)
reactive programming, handlign values that change over time, like react. this is much like KVO

Publisher -> Operator -> Subscriber

Publisher emits values 
Operators transform those values
Subscriber receives teh final values

$searchText //emit when changes
  .debounce(for: .milliseconds(300), scheduler: RunLoop.main) //wait for typing
  .removeDuplicates() //ignore if same as last time
  .flatMap { query in //for each value start a publisher
    searchService.search(query)
  }
  .receive(on: DispatchQueue.main) main thread only
  .sink {[weak self] results in  // this is the subscriber
    self?.results = results
  }
  .store(in: &cancellables) // store it or the subscritpion ends

Combine is like a stream of updates
async/await are one request and one response, ad host

&cancellables is like removing the KVO observer


## Section 3.2 API Patterns

basic fetch

func fetch <T: Decodable>(from url: URL) async throws -> T {
  let (data, _) = try await URLSession.shared.data(from: url)
  return try JSONDecoder().decode(T.self, from: data)
}

let user: User = try await fetch(from: userURL)

streaming for AI APIS and Server-sent events

func streamEvents(from url: URL) -> AsyncThrowingStream<Event, Error>{
  AsyncThrowingStream { continuation in
    Task {
      let (bytes, _) = try await URLSession.shared.bytes(from: url)
      for try await line in bytes.lines {
        if let event = parseEvent(line){
          continuation.yield(event)
        }
      }
      continuation.finish()
    }
  }
}

for try await event in streamEvents(from: url){
  print(event)
}


# Section 4 SwiftUI
## 4.1 State Management

@State view owns this value type no one else can edit

struct CounterView: View {
  @State private var count = 0

  var body: some View {
    Button("Count: \(count)){
      count +=1
    }
  }
}

@Binding - child can modifies parent's state
struct ParentView: View {
  @State private var isOn = false
  var body: some View {
    ChildView(isOn: $isOn) //$ makes it availabel to child
  }
}

struct ChildView: View {
  @Binding var isOn: Bool // doesn't own it, just modifies

  var body: some View {
    Toggle("Setting", isOn: $isOn)
  }
}

@StateObject view creates and owns a reference type - it survives re-renders and refreshes

@Observeable
class ViewModel {
  var items: [String] = []
}

struct MyView: View {
  @StateObject private var vm = ViewModel() //created once and survives re-render

  var body: some View {
    List(vm.items, id: \.self) {
      Text($0)
    }
  }
}

@ObservedObject - view receis an already created reference type, passed in, not created here

struct ChildView: View {
  @ObservedObject var vm: ViewModel

  var body: some View {
    List(vm.items, id: \.self){
      Text($0)
    }
  }
}

make sure you do a @StateObject for models so they are persisted

struct MyView: View {
  @StateObject var vm = ViewModel()
}

@Observable is ios 17+
use @State for @StateObject
@Binding for pass binding with $
@Bindable  for $vm.property syntax
just read wihtout anythign from ChildView now

## 4.2 Navigation & Async

Modern navigation iOS 16

struct ContentView: View {
  @State private var path = NavigationPath()
  @State private var items: [Item] = []

  var body: some View {
    NavigationStack(path: $path){
      List(items){ item in
        NavigationLink(value: item){
          Text(item.name)
        }
      }.navigationDestination(for: Item.self){ item in
        DetailView(item: item)

      }.task {
        items = try await api.fetchItems()
      }.refreshable {
        item = try await api.fetchItems()
      }
    }
  }
}

UIViewRepresentable for UIKit in Swift
UIViewCOntrollerReprentable UIKit ViewController
use Coordinator class to handle delegates


## 5 Modern UIKit
 Diffable Data Source

 declare the state you want and framework solves it and animates, no more insertROws and deleteRows crashing at runtime

 var dataSource: UITableViewDiffableDataSource<Section, Item>!

 dataSource = UITableViewDiffableDataSource(tableView: tableView){ tableView, indexPath, item in
    let cell = tableView.dequeueResuableCell(withIdentifier: "Cell", for indexPath)
    cell.textLabel?.text = item.name
    return cell
 }

 var snapshot = NSDiffableDataSourceSnapshot<Section, Item>()
 snapshot.appendSections([.main])
 snapshot.appendItems(items)
 dataSource.apply(snapshot, animatingDifferences: true)

 ## 5.2 Compositional Layout
 build complex colleciton views with declaratively

let layout = UICollectionViewCompositionalLayout { sectionIndex, environment in
  let item = NSCollectionLayoutItem(layoutSize: NSCollectionLayoutSize(widthDimension: .fractionalWidth(0.5)heightDimension: .fractionalHeight(1.0)))

  let group = NSCollectionLayoutGroup.horizontal(layoutSize: NSCollecitonLayoutSize(widthDimension: .fractinalWidth(1.0, heightDimension: .absolute(100)), subitems: [item])
  )

  return NSCollectionLayoutSection(group: group)
}

## 5.3 Content Configuation
replace the old cell.textLabel and cell.iamgeView resets

var config = UIListContentConfiguration.cell()
config.text = "Title"
config.secondaryText = "Subtitle"
config.image = UIImage(systemName: "star")
cell.contentConfiguration = config


## 6. Rapid Fire
struct is value aka copies
class is reference aka shared

retain cycle - is when two objects strongly reference each other making it so their reference count never reaches 0 and the memory is never released. creates a leak

weak vs unown - weak means to clean up after deallocation, it's not needed, onowned crashes after object is released

@escaping is a clousire that is called after the return statement, outlives or stored for later

async/await vs callbacks - callbacks are called "later" and make nested code that is isn't read top to bottom, hard to read, manual error handlging. async await is top to bottom and called compiler checked, 

actor ensure that the mutable data is only accessed by one task at a time, 

@mainactor ensures the main thread is used, often used for UI work

Sendable - means data can be passed between to concurrent tasks, this data is immutable or final 

@State is a variable owned by the view
@StateObject is an object that survives re-renders and perists
@StateObject is owned by hte view, @ObservedObject means it's watching a object passed in

map vs compactMap - map loops through each item and transforms it, compactMap transforms and removes ** dind't know

diffable data soruce - a datasource that handles the add and remove animiations and compile time checked instead of leading to run-time errors. uses snapshots and is based on state



Quiz

some - is one specific type, just not teling you which 
any - any conforming type

to convert callback api to async/await use continusations

.task {} runs async doe when the view appears, but atuomatically cancels after the view disappears
if you did it on onViewAppear the task just keeps running after the view is gone

diffable datasoruces are declaed via snapshots 

Task {} call async code from synchronous context

withCheckedContinuation / withCheckedThrowingContinuation for bridging callback APIs
.task { } auto-cancellation behavior


Swift          [████████████░░░░░░░░] 60%
SwiftUI        [██████░░░░░░░░░░░░░░] 30%
UIKit          [█████░░░░░░░░░░░░░░░] 25%
Combine        [████░░░░░░░░░░░░░░░░] 20%
API/AI         [███░░░░░░░░░░░░░░░░░] 15%


# Level 2
1.1 Advanced Generics
assoicated types, let you define a protocol without defing the type
IntStack<Int> Stack<AsscoiatedType>

Type Erasure
var things: [Collection] = [] //error

error because you have to say what type of Collection<String>
erasure is a wordaround that wraps your specifictype ina. generic box that hides the details

Combine you can use AnyPublisher<Int, Never>
Erase to AnyPublisher

## Clauses
sometimes you want generic code that only works under certin conditions

sort function that sorts whatever you give it, how do you handle closures

where clauses let you add requirements: "this code only works when T is Compareable or This extension only applies when Element is Equatable

Conditional extensions are powerful, array.sorted() only works if the elements are Compareable, you can't sorted() on an array of closures


1.2 Property Wrappers

1.3 Result Builders
result builders are what create and transform 

@resultBuilder
struct ArrayBuilder<Element> {
  //Called for each statement in the block
  static func buildBlock(_ components: Element...) -> [Element]{
    components
  }
}

@ArrayBuilder<Int>
func buildNumbers() -> [Int] {
  1
  3
  5
}

let nums = buildNumbers()

@ArrayBuilder take each statement passthem all to buildBlock and return the result
@ViewBuilder is how TextButton becomes one compoennet

1.4 Key Paths & Metatypes

struct User {
  var name: String
  var age: Int
}

let namePath: KeyPath<User, String> = \User.name

var user = User(name: "Steve", age: 30)
let name = user[keyPath: namePath]


sort any properoty
func sorted<T, V: Comparable>(by keyPath: KeyPath<T,V>) -> [T]{
  sorted { $0[keyPath: keyPath] < $1[keyPath:keyPath]>}
}

let users = [User(name: "B", age: 25), User(name: "A", age:30)]
let byName = users.sorted(by: \.name)
let byAge = users.sorted(by: \.age)

MetaTypes
let intType: Int.Type = Int.self //Int.self is Int as a value

func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {

try JSONDecoder().decode(type, from: data)
}

let user = try decode(User.self, from: jsonData)


## Section 2 Swift UI Deep
2.1 View Idenitty and Lifecycle
SwiftUI Tracks View sby identity, when the idenitty change shte state resets
Position in tree matters

var body: some View{
  if showFirst {
    Text("first)
  } else {
    Text("second)
  }
}

higher position is hte default, when state resets this is the default, use @State

Text("Hello").id(someValue)

there is no viewDidLoad, use modifiers

Text("Hello")
  .onAppear{}
  .onDisappear{}
  .task {} //Async work, cancelled on disapper
  .onChange(of: someValue) { old, new in } // this is nice

body is caleld frequently keep it fast, no side effects on body, but them in the modifiers

## 2.2 Environment + Preferences

struct ThemeKey: EnvrionmentKey {
  static let defaultValue = Theme.light
}

extension EnvironmentValues {
  var theme: Theme {
    get { self[ThemeKey.self]}
    set { self[ThemeKey.self] = newValue}
  }
}

ContentView().environment(\.theme, .dark)

struct DeeplyNestedChild: View {
  @Environment(\.theme) var theme

  var body: some View {
    Text("Hello").foregroundStyle(theme.textColor)
  }
}

can do this with colorScheme, dismiss and openURL

## 2.2 Preferences

Child tells parent something, upward data movement

GeoReader { geo in 
  Color.clear
    .preference(key: SizePreferenceKey.self, value: geo.size)
}

.onPreferenceChange(SizePreferenceKey.self) { size in
  childSize = size
}

## 2.3 Custom View Modifiers
encapsulate repeated stylying

struct CardModifier: ViewModifier {
  func body(content: Content) -> some View {
    content
      .padding()
      .background(Color.white)
      .cornerRadius(12)
      .shadow(radius: 4)
  }
}

extension View {
  func card() -> some View {
    modifier(CardModifier())
  }
}

Text("Hello").card()
Image("Photo").card()

# 2.4 Animations + Gestures
implicit is animate whnever a value changes

@State private var scale = 1.0
Circle()
  .scaleEffect(scale)
  .animation(.spring(), value: scale)

withAnimation(.easeInOut(duration:0.3)){
  scale = 2.0
}

# Gestures
@State private var offset = CGSize.zero
@GestureState privat evar dragOffset = CGSize.zero //resets after gesture ends

Circle()
  .offset(x: offset.width + dragOffset.width,
    y: offset.height + dragOffset.height
  )
  .gesture(DragGesture()
    .updating($dragOffset){ value, state, _ in
      state = value.translation 
    }
    .onEnded { value in 
      offset.width += value.translation.width
      offset.height += value.translation.height
    }
    )

# Section 3 Combine
## 3.1 Publisher Types
Publisher emits values 
Operators transform teh stream
Subscriber receives the value

Publisher -> Operators -> Subscriber


Just - emits once
[1,2,3].publisher emits each element then completes
Future - async work then completes
@Published emits whenever a property changes
NotificationCenterr.publisher emits when notification fires


Subscribing

publisher
  .sink { value in
    print(value)
  }
  .store(in: &cancellables)

must store or the susbcription dies immediately


## 3.2 Essential Operators

map is a transform on each value
filter only pass values that meet condition, 
compactMap transform and remove nils


combineLatest - emits when any source emits with the latest from all

merge - merges emits from multiple publsishers into one stream

zip - makes a tuple out of two emits

debounce - watis for a pause in the emits
throttle - rate limit, one emit per X secs

Publishers.CombineLatest(usernamePublisher, passwordPublisher)
.map{ username, password in 
  !username.isEmpty && password.count >= 8
}

Publishers.Merge(localDataPublisher, networkDataPublisher)

Publishers.Zip(requestA, requestB)

## 3.3 Error Handling
if a publisher fails the stream ends

retry - try again up to N times

fetchData()
  .retry(3)

catch - if it i fails do something

fetchData()
  .catch { error in 
    Just(fallbackValue)
  }

replaceError - simpler catch just emit this value if anythign fails
fetchData()
  .replaceError(with: defaultValue)

connecting to publisher's this error type must match, if not use the mapError

# 3.4 Subjects
publishers are read-only, Subjects are publishers you can control with .send(value)

PassthroughSubject - no memory. value is sent to subscribers if no one subscribed it lost. i.e. button taps

CurrentValueSubject - remembers the lastest value, new subscribers also get it, you can read .value directly. i.e. current User

subjects turn imperative code into reactive streams, button tap

dont overuse them, subjects are only for pushign manually


# 4 UIKit ViewController
## 4.1 View Controller Lifecycle
- init 
- loadView view is created - override for porgrammtically view
- viewDidLoad view is in memory
- viewWillApepar - about to show
- viewDidAppear - now visble
- viewWIllDiesappear - about to leave screen
- viewDidDisappear no longer visiable

viewdidload runs one
willeapr adn didapear can run many times - refrehsing data or start observers here
willdispepar viewdiddispear can run many times, stopobserving or pause work

## 4.2 responder chaing
events travel up a chain until soemthgin handles them. from child to parent upwards

view -> superview -> Viewcontroller -> Window -> Applciation

this means you can capture a touch from a child in a parent. the first responder that has the action handles it

firstReponder is who is receiveing the events i.e. a focused textField
becomingFirstResponder() makes a view the first repsodner shows keyboard if textifled
resignsFirstReponder() gives it up hides keybarod

# 4.3 Advanced Layout
programatic contriants
view.translatesAutoresizingMaskIntoContstraints = false
NSLayoutConstraint.active([
  view.topAnchor.constraint(equalTo: superview.topAnchor, constant: 20),
  view.leadingAnchor.constraint(equalTo: superview.leadingAnchor, constant: 16)
])

priority
lower can be broken if you must

Content Hugging vs Compression Resistance
if two labels are side by side and there is not enoguht sapce for both who wins?

Content hugging - resitance to growing "Don't stretch me"
Compression resitance = resistance to shringking, "Don't squish me"
higher prioroty wins, if label has higher copression resitance label b get squished


Intrinsic Content Size
labels, buttons, images and other views know their size you dont have to set width/height

# 4.4 Collection View Deep Dive

register collectionview

let registration = UICollectionView.CellRegistration<MyCell, Item>{ cell, indexPath, item in
  configure(with: item)
}

diffable data source
no more insertorws and delete rows 
declare the state you want with snapshot, framework figures out the diff and animates

var snapshot = NSDiffableDataSourceSnapshot<Section, Item>()
snapshot.appendSections([.main])
snapshot.appendItems(items)
dataSource.apply(snapshot)

section snapshots - expand and collapse sections

Compositonal Layout 
build complex layout sdeclarivale
item - singel cell's size
group - horizontal or vertical grouping of items
section - contains groups can have headers/footers

# 5 APIs
## 5.1 Endpoitn Abstraction
network code is scatterd everywhere, repeated and error prone

make a endpoint type - like na api manager

struct GetUser: Endpoint {
  typealias Response = User
  let id: Int
  var path: String { "/users/\(id)"}
  var method: HTTPMethod { .get }
}

repposne is known at compoile time, you can't mix up the url and method, easy to test, one central place for all api calls

## 5.2 Authenciation Patterns
tokens expire but what if you have five different requests? they could all start to retry at once. 

use an actor to manager the tokens, only one refresh allowed at a time

1 request needs toke
2 actor checks if token is valid
3 if expired start refresh or wait for one already in progress
4 return the valid token
5 if request still fails with 401, force refresh and retry once

actors ensure only one task can make a change a a time, others callers wait for her fresh, everyone gets the same token, no more race consitions

## 5.3 Streaming & WebSockets
grok, claude stream responses, using server-sent events SSE, you receive them as they arrive

lines start iwth data: { JSON CONTENT HERE}

must use the URLSession.shared.bytes(for:) to get async stream of bytes

WebStockets
two way persistent connection both side can send at any time, great for live updates

1. create URLSession.shared.webSocketTask(with:)
2. .resume() to connect
3. .send()
4. .receive() call it again after each message
5. .cancel()

## 5.4 Offline & Caching
Cache-first pattern - check cached data immediately refrehs in background
check for cache for data, if poudn return it na fetch fresh dat ain abcgkround, if not founder fetch and cache
user sees data instantly

simepl disk cache - store json responses in cache dreictor key becomes the filename, use an actor to prevent race conditions for multile reaa dn writes

offlien queue - offline actions are recorded, monitrng network and process the queue

what to cache? data that doesnt change ofen, user profiesl, 
how long? depns on freshness requirements mintues for feeds, horus for profiesl, days for static
when to invalidate on user action after time lime or when server says


# SpeedRun-v3 Guide

##1.1 Actor Reentrancy 
actors protect state only one task accesses at a time

when you await inside an actor, the actor suspends, while suspended other tasks can run on that actor

actor BankAccount {
  var balance = 100
  func withdraw(_ amount: Int) async -> Bool {
    guard balance >= amount else {return false}
    await someSlowOperation()
    balance -= amount
    return true
  }
}

what if there are multiple requests to withdraw at once? the actor just gets suspended, meaning it has 100 as balance the other request has 100 as balance and they both are removing 80, you are going to overdraw

you need to re-check after suspension or do actors without await

## 1.1.2 Task Cancellation

Tasks can be cancelled but they don't automatically stop when requested to be cancelled
you must check

Task.checkCancellation() //throws if cancelled

it can kep running without a check

## 1.1.3 MainActor Inheritance
@MainActor is inherited by all subclasses and func on the class, make sure you want everything on this class and it's subclasses on the main thread

## 1.1.4 Sendable Closures
closures crossing concurrency boundaries must be @Sendable they can't capture mutable state, the complier will protect against this

var counter = 0
worker.process {
  counter +=1 //can't do this if you are passing concurrnecy bounderise!
}

# 1.2 Memory Deep Dive

## Capture Lists Revisited

[weak self] is a capture list. capture lists can freeze a value in a momemnt in time, avoid retain cycles and be used when you need a value as it was not as it is

a closure usualy captures variables, not values

here is an example of it capturing a variable

var value = 1
let closure = { print(value)}
value = 2
closure() // prints 2

if you use the [value] its like copy as value in excel
var value = 1
let closure = { [value] print(value)}
value = 2
closure() // prints 1

# 1.3 Closure Cpature Timing Trap

in a loop with closures it's easy to have a variable change 

var closures: [() -> Void] = []
for i in 0..<3 {
  closures.append { print(i)}
}
closures.forEach{ $0() } the i is 3 and appened each closure

if yo uuse closures.append {[i] in print(i)} it now sprints 0,1,2

## 1.3.2 Unowned vs Weak
weak - becomes nil if object deallocateds
unowned crashes if object allocates, use when your certai the object outlives the closure
unowned(unsafe) - no checks at all undefined behavior if wrong, never use this





# 2. SwiftUI in Production

## 2.1 The problem 
var body: some View {
  VStack {
    ExpensiveView(data: data)
    Text("Count: \(count)")
  }
}
the entire VStack re-renders everytime there is a count change, even if data didn't change

you can fix this by extracting the Views into their own struct

struct ExpensiveView: View {
  let data: Data //only reender when data changes
  var body: some View {

  }
}


Fix Lazy Stacks
VStack creates all views immediately even ones offscreen

LazyVStack only creates View when they become visible

ScrollView {
  LazyVStack {
    ForEach(items) { item in 
      ItemView(item: item)
    }
  }
}
for long lists this can save memory

### Stable IDs
ForEach diffs by id, if they ids are stable the views are reusied, if the ids change the views are re-creasted

BAD
ForEach(items.indicies, id: \.self) indicies shift when items change

GOOD
ForEach(items) where items are Identifiable with stable IDs


# 2.2 Custom Layouts

create your own layouts containers like VStack and HStack

sizeThatFits returns how much space your layout needs
placeSubviews positon each child view within the bounds

## 2.3 Complex Navigation

navgationPath holds a stack of hashable types, push differnet ypes onto the same stack. have it route based on type

@State private var path = NavigationPath()

NavigationStack(path: $path) {
  List {
    Button("Go to User") { path.append(User(id:1))}
    Button("Go to Settings"){path.append(Settings())}
  }
  .navigationDestination(for: User.self) {UserView(user: $0)}
  .navigationDestination(for: Settings.self) {SettingsView()}
}

so the path could be a User or a Settings and it will psuh to the proper view

## programticaly Control of Navigation
path.append(User(id: 1)) push
path.removeLast() pop
path.removeLast(path.count) pop to root

Deep Linking
when you app opens from a URL parse it and buidl the navigationStack properly

func handleDeepLink(_ url: URL){
  path.removeLast(path.count) //clear the stack

  if url.path == "/user" {
    let id = "URL PARSED"
    path.append(User(id: id))
  }
}

user taps link and app opens directly to that screen

Coordinator Pattern

standardize all navigation code into one class, inject it via encriomemnt

@Observable
 class AppCoordinator {
  var path = NavigationPath()

  func goToUser(_ id: Int) { path.append(User(id: id))}
  func goBack() {path.removeLast()}
  func goToRoot() {path.removeLast(path.count)}
 }

 ## 2.4 Testing SwiftUI
 - dont test views directly test the view model

 Testing ViewModels
 @Observable
 class CounterViewModel {
    var count = 0
    func increment() { count += 1 }
 }

 func testIncrement(){
  let vm = CounterViewModel()
  vm.increment()
  XCTAssertEqual(vm.count, 1)
 }

 test the logic not hte UI

 ## 2.4.2 Snapshot Testing

 capture the view as an image, comapre again a saved refeence, if anychanges visually the tes failes, easy to break

 ## 2.4.3 ViewInSpector (3rd party)
 library lets you dig into SwiftUI view hieracrhies

 let view = ContentView()
 let button = try view.inspect().find(button: "Tap Me")

 heave logic in the viewMOdel then unit test it
 simple views then trust swiftui
 visual correctness cnapshot test
 integration ui tests with XCUITest

 # Section 3 Combine

 ## 3.1 Custom Publishers

built-int publisehr cover most cases you may need custom
SImplest approach Wrap a Future in a Deferred

func customPublisher() -> AnyPublisher<Int, Error>{
  Deferred {
    Future { promise in
      promise(.success(42))
    }
  }.eraseToAnyPublisher()
}

deferred waits until subscription to create the future, otherwise the work starts immediately when you create a publisher

deferred is like lazy, wait until subscription to create

## full custom publisher

for complete control implemente the Publisher protocol with custom Susbcription

you need a Publisher struct that creates susbcriptions
and a Subscription class that manges the work and handles cancellation

this is very advacned you like dont need it deferred + future approach handles most

## 3.2 Schedulers

schedulers controll whcih thread or queue and when code is exectued immediately delayed or at intervals

## Common Schedulers

DispatchQueue.main - mainthread for UI Updates
DispatchQueue.global() backgrond thread
RunLoop.main - main thread integrations with UI events
ImmediateScheduler.shared runs synchonrolsy user for tests

## receive(on:) vs subscribe(on:)

received(on: ) - downstream work happens on this scheduler, most common
subscribe(on: ) - upstream susbcription happens o this scheduler rarely used

publisher
  .subscribe(on: Dispatchqueue.global()) background 
  .received(on: dispatchqueue.main) main thrad
  .sink { value in how you subscribe
      main thread
   }
   .store(in: &cancellables)

## 3.3 Testing Combine

Basic Pattern 
Collect Results into an array then assert: 

func testPublisher(){
    var results: [Int] = []
    let cancellable = publisher
      .sink {results.append($0)}

    XCTAssertEqual(results, [1,2,3])
}

Async publishers for publisher that emit later use expcations

func testAsyncpUblisher() {
  let expectation = XCTestExpectation(description: "receiged value")
  let cancellable = asyncPublisher
    .sink {value in 
      XCTAssertEqual(value, expected)
      expectation.fulfill()
    }
  wait(for: [expectation], timeout: 1.0)
}

Test SChedulers

real time makes test slow and flaky test scheulers let you control teh time

let schedeuler = Dispatchqueu.test

publisher
  .debounce(for: .seconds(1), scheduler: scheduler)
  .sink { ... }

scheduler.advance(by: .seconds(1))) so you can control the time and not have to wait

key principle 
repalce reeal schedulers with test schedulers, control teh time instead of wiating


# Section 4
## 4.1 Custom Transitions

UIViewControllerAnimatedTransitioning
- transitionDuration how long the animaiton takes
- animate transition the actual animation code

animate has a context with a view property you can animate

create the transition subsclass and then use it

class FadeTransition: NSObject, UIViewControlelrAnimatedTransitoning

detail.transitioningDelegate = self
present(detail, animated: true)

in delegate
func animationController(forPresented: ...){
  return FadeTransition()
}

Interactive Transitions 
you can make transitions gesture-driven with UIPercentDrivenInteractiveTransition 
- user swipes transitions follow thier finger

## 4.2 Advanced Gestures

you can make your own gesture recongizers
use touchesbegan
touchesmoved
tocuhesended
touchescancelled

stats to the ll teh system what happended .began .changed .ended .recongized, .failed, .cancelled

Gesture Dependedcies
make sure one gesture waits to see if the other faield. make single wait for a failed double
singleTap.requre(toFail: doubleTap)

Simultaenous Gestures
allow multiple gesture recongizers

use gestureRecongizer(shoudlRecongizeSimultaneslouWith) { return true} pan and pinch both allowed, like a mpa

## 4.3 perfoamcne profiling
Intruments - xcode profiling tool

time profile - find slow functions where cpu time is sepnt, 
allocations - find leaks  memory usage over time, 
leaks - retain cycles
core animation - frame rate, offscren rendinger bleidng

Common performacne Killers

- offscrene rendering , things like shadows mask corner dius on large views, GPU renders offscren then composite, expensive, 
  fix this wiht shouldRasterize = true or pre-rendred images

- blending transparent views over other views GPY composite every frame, use opageu backgroudn wher epossible

- main thread work - JSON parseing, image decoding, these should be on the background queu

## Debug Checks
- in simualtor 
  Debug -> Color Blended Layers (red = blending)
  Debug -> COlor Offscrene-rendered yellow= offscreen

  if you see a lot of red and yello you have work to do 

don optimiat until you measure instruments tells you where the real-problems are
- 

# Section 5
## 5.1 Pagination

cursor-based - gives your a cursor you pass back and get more. this is good because if the data set changes you still get the new data

offset-based - this is literally a number of offset items, 20, 30, 40 etc. if the data changes you dont always get to see it. but it's simplier

Infinite scroll - trigger when last time appears, track the loading state and if more pages exist

## 5.2 gRPC Basics
alternative to rest, uses protocal buffers(binary) instead of JSON
faster, strongly typed, and supports streaming

Protocol BUffers
define your API in .proto files

message User {
  int32 id = 1;
  string name = 2;
}

service UserService {
  rpc GetUser(GetUserRequest) returns (User)
  rpc ListUsers(ListUsersRequest) returns (stream User)
}

run the protoc compiler to generate teh swift code you get type-safe request/response objects

## grpc-swift
apples offical library for grpc

let client = USerServiceAsyncClient(channel: channel)
let request = GetUserRequest.with {$0.id = 123}
let user = tray wait client.getUser(request)

looks similar to REST but binrary under the hood

high-perfomrnac erequirements
streaming data server push, bidirectional, strongly typed constracted, microsrever

REST is fine for most mobile gRPC shines when perfoamcne and streaming matters

## 5.3 AI Integration

most ai apis use rest with streaming you send mesasgesa nd get a response

struct ChatRequest: Encodable {
  let model: String
  let message: [Message]
  let stream: Bool
}

struct Message: Codable {
  let role: String //"user" or assistant
  let content: String
}

## Streaming Reposnses
AI Reposnse arrive token by btoken via Server Sent EVents

each line starts with data: followed by some JSON, you parse the chunks as they arrive

for try await line in bytes.lines {
  guard line.hasPrefix("data: ") else { continue}
  let json = String(line.dropFirst(6))
  if json == "[DONE]" {break}
}

word by word instead of waiting for of full response 

## Conversation History
AI is stateless, each request must include the full conversation

you must maintian a history of the conversation not he api

## token limts
models have context limirf i the conversation gets too loogn trim the old messages
trimToFit

## 5.4 Full Offline Sync
user is offline and server has changes too how do you handle merging without losing data

timestamps - each record has a updatedAt , newest wins, but clock skew could be problem
versions - each record has a version number incremented on each change, more reliable but requires conflickt resolution logic

sync algo
- track local changes since last sync 
- send them to server
- server response wiht conflicts and remote changes
- apply remote changes locally
- handle conflicts
- update sync timestamp

mark each item with syncstatus - synced, pendingUpload, pendingDelete


Conflict Resoltuion
last-write-wins - last timestamp survies is simple but data can be lost
merge - combien changes field by field complex preserves data
prompt - show both version to the user and let them pick 

last-write-wins uses both



# REPS
@State doesnt go in structs that are just data models, only in views
List syntax


Question 13: How do you bridge callbacks to async? withCheckedContinuation()

@State vs @StateObject
Old way
@State var count = 0 only works on value types
struct MyView: View {
  @StateObject var vm = ViewModel()
}
@StateObject fo view created referecne types

now

@Obserable
class ViewModel{
  var items: [String] = []
}

struct MyView: View {
  @State var vm = ViewModel()
}


12/22
Quick Review

try Task.checkCancellation() will tell you if a async task has been canceleld, sometimes this happends because of a parent. you should do this before expensive transactions

@ObservedObject is passed in
@StateObject is created by the view

property wrappers allow you to apply code to properties without having to write it out each time. updating the getter and setter for each attribute on a class could be cumbersome, but you cna create a @MyStyle or @Trimmed or @WhateverYouWant modifier that you can use like this @Trimmed var name: String