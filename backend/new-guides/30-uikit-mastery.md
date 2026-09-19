# UIKit Layout Mastery - Complete Guide

**1. Layout System** - Frame-Based, Auto Layout, Stack Views

**2. Auto Layout** - Mental Model, Anchors, Constraint Types

**3. Safe Areas** - Safe Area Guide, Layout Margins, Readable Content

**4. UIStackView** - Axis, Alignment, Distribution, Nested Stacks

**5. Grids** - Nested Stacks, UICollectionView, Compositional Layout

**6. Content Sizing** - Hugging, Compression Resistance, Intrinsic Size

**7. Constraint Priority** - Priorities, Flexible Layouts

**8. Animation** - Animating Constraints, Deactivate/Reactivate

**9. Patterns** - Full Screen, Centered, Aspect Ratio, ScrollView, Card, Tab Bar

**10. Debugging** - Console Messages, Visual Debugging, Common Mistakes

---

## The UIKit Layout System

UIKit uses an imperative layout system where you explicitly tell views their size and position. There are three main approaches:

1. **Frame-based layout** - Manual positioning with CGRect
2. **Auto Layout** - Constraint-based, declarative relationships
3. **Stack Views** - Simplified Auto Layout for common patterns

Auto Layout is the modern standard. Master it.

---

## Auto Layout Mental Model

Auto Layout solves a system of linear equations. Each constraint is an equation:

```
view.attribute = multiplier × otherView.attribute + constant
```

For a view to have a **fully defined layout**, it needs:
- **X position** (leading, centerX, or trailing)
- **Y position** (top, centerY, or bottom)
- **Width** (explicit or derived from constraints)
- **Height** (explicit or derived from constraints)

Missing any = **ambiguous layout**
Conflicting constraints = **unsatisfiable layout**

---

## Programmatic Auto Layout

While Interface Builder exists, most professional iOS development uses programmatic Auto Layout. It's more explicit, easier to review in code, and eliminates merge conflicts in storyboard files.

**The pattern has three steps:**
1. Create views and set `translatesAutoresizingMaskIntoConstraints = false`
2. Add views to the hierarchy with `addSubview()`
3. Activate constraints with `NSLayoutConstraint.activate([])`

**Why this order matters:** Constraints reference views, so views must exist first. Views must be in the hierarchy before constraints involving superviews can be created.

### The Setup Pattern

```swift
class MyViewController: UIViewController {
    
    // 1. Declare views as properties
    private let titleLabel: UILabel = {
        let label = UILabel()
        label.text = "Hello"
        label.font = .systemFont(ofSize: 24, weight: .bold)
        label.translatesAutoresizingMaskIntoConstraints = false  // CRITICAL!
        return label
    }()
    
    private let actionButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Tap Me", for: .normal)
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }
    
    private func setupUI() {
        // 2. Add to hierarchy
        view.addSubview(titleLabel)
        view.addSubview(actionButton)
        
        // 3. Activate constraints
        NSLayoutConstraint.activate([
            titleLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),
            titleLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            titleLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            
            actionButton.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 20),
            actionButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
        ])
    }
}
```

### ⚠️ The #1 Mistake

```swift
// WRONG - Forgot this, constraints won't work!
let label = UILabel()
view.addSubview(label)

// RIGHT - Always set this for programmatic constraints
label.translatesAutoresizingMaskIntoConstraints = false
```

---

## Anchor Syntax (Modern Way)

Before iOS 9, creating constraints required verbose `NSLayoutConstraint(item:attribute:relatedBy:...)` calls. Anchor syntax is the modern, readable alternative.

**Why anchors are better:**
- Type-safe (can't accidentally constrain width to a position)
- Chainable and readable
- Caught errors at compile time, not runtime

**Interview tip:** Always use `leadingAnchor`/`trailingAnchor` instead of `leftAnchor`/`rightAnchor`. Leading/trailing respect right-to-left languages like Arabic and Hebrew.

### Basic Anchors

```swift
// Position anchors
view.topAnchor
view.bottomAnchor
view.leadingAnchor      // Use instead of leftAnchor (RTL support)
view.trailingAnchor     // Use instead of rightAnchor
view.centerXAnchor
view.centerYAnchor

// Size anchors
view.widthAnchor
view.heightAnchor

// Baseline (for text)
view.firstBaselineAnchor
view.lastBaselineAnchor
```

### Constraint Types

```swift
// Equal to
view.topAnchor.constraint(equalTo: other.topAnchor)

// Equal with constant (offset)
view.topAnchor.constraint(equalTo: other.bottomAnchor, constant: 20)

// Greater than or equal
view.heightAnchor.constraint(greaterThanOrEqualToConstant: 44)

// Less than or equal
view.widthAnchor.constraint(lessThanOrEqualToConstant: 300)

// Multiplier (for proportional sizing)
view.widthAnchor.constraint(equalTo: other.widthAnchor, multiplier: 0.5)

// Size constants
view.widthAnchor.constraint(equalToConstant: 100)
view.heightAnchor.constraint(equalToConstant: 50)
```

### Activating Constraints

```swift
// Method 1: Activate array (preferred)
NSLayoutConstraint.activate([
    view.topAnchor.constraint(equalTo: other.topAnchor),
    view.leadingAnchor.constraint(equalTo: other.leadingAnchor),
])

// Method 2: Individual activation
let constraint = view.topAnchor.constraint(equalTo: other.topAnchor)
constraint.isActive = true

// Store reference if you need to modify later
private var heightConstraint: NSLayoutConstraint?

heightConstraint = view.heightAnchor.constraint(equalToConstant: 100)
heightConstraint?.isActive = true

// Later: modify
heightConstraint?.constant = 200
```

---

## Safe Area and Layout Guides

iOS provides several layout guides that represent important screen regions. Using these instead of hardcoded values makes your app adapt to different devices automatically.

**The three guides you need to know:**
- **safeAreaLayoutGuide** — Avoids system UI (notch, home indicator, status bar)
- **layoutMarginsGuide** — Respects system content margins (usually 16-20pt from edges)
- **readableContentGuide** — Keeps text at comfortable reading width on large screens

**When to use which:**
- Content (text, buttons, forms) → `safeAreaLayoutGuide`
- Background colors/images → Constrain to view edges directly (extend under safe areas)
- Long-form text on iPad → `readableContentGuide`

### Safe Area (Notch, Home Indicator)

```swift
// Pin to safe area (content won't go under notch/home indicator)
view.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor)
view.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor)

// Pin to edges (background colors, images that should extend)
view.topAnchor.constraint(equalTo: view.topAnchor)
view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
```

### Layout Margins

```swift
// Respect system margins (usually 16-20pt from edges)
view.leadingAnchor.constraint(equalTo: view.layoutMarginsGuide.leadingAnchor)

// Or use directionalLayoutMargins
view.directionalLayoutMargins = NSDirectionalEdgeInsets(top: 20, leading: 20, bottom: 20, trailing: 20)
```

### Readable Content Guide

```swift
// For text - constrains width on large screens (iPad)
label.leadingAnchor.constraint(equalTo: view.readableContentGuide.leadingAnchor)
label.trailingAnchor.constraint(equalTo: view.readableContentGuide.trailingAnchor)
```

---

## UIStackView - The Easy Way

UIStackView is the most important layout tool in UIKit. It handles constraint creation internally, dramatically reducing boilerplate. Think of it as the UIKit equivalent of SwiftUI's VStack/HStack.

**When to use UIStackView:**
- Any linear arrangement of views (forms, toolbars, cards)
- When views should distribute space evenly
- When you want to hide/show views without managing constraints

**When to use raw constraints instead:**
- Complex overlapping layouts
- Views that need to be positioned relative to non-siblings
- Performance-critical views with hundreds of items (UIStackView has overhead)

**Key insight:** Arranged subviews are automatically constrained. You only need to constrain the stack view itself, not its children.

Stack views handle most layout automatically. Use them liberally.

### Vertical Stack

```swift
let stack = UIStackView()
stack.axis = .vertical
stack.spacing = 10
stack.alignment = .fill        // How items align perpendicular to axis
stack.distribution = .fill     // How items distribute along axis
stack.translatesAutoresizingMaskIntoConstraints = false

stack.addArrangedSubview(label1)
stack.addArrangedSubview(label2)
stack.addArrangedSubview(label3)

view.addSubview(stack)

NSLayoutConstraint.activate([
    stack.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),
    stack.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
    stack.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
])
```

### Horizontal Stack

```swift
let stack = UIStackView()
stack.axis = .horizontal
stack.spacing = 10
stack.alignment = .center
stack.distribution = .equalSpacing
```

### Alignment Options

Alignment controls how views are positioned perpendicular to the stack's axis. For a vertical stack, alignment affects horizontal positioning. For a horizontal stack, alignment affects vertical positioning.

```swift
// .fill      - Stretch to fill (default)
// .leading   - Align to leading edge (vertical stack)
// .trailing  - Align to trailing edge
// .center    - Center items
// .top       - Align to top (horizontal stack)
// .bottom    - Align to bottom
// .firstBaseline  - Align text baselines
// .lastBaseline
```

### Distribution Options

Distribution controls how views divide space along the stack's axis. This is where content hugging and compression resistance come into play.

**The most useful ones:**
- `.fill` — Default. Views use natural sizes; extra space goes to lowest-hugging view.
- `.fillEqually` — All views same size. Ignores intrinsic content size.
- `.equalSpacing` — Views use natural sizes; extra space becomes equal gaps between them.

```swift
// .fill              - Fill space, respect hugging/compression (default)
// .fillEqually       - All items same size
// .fillProportionally - Size based on intrinsic content size ratio
// .equalSpacing      - Equal space between items
// .equalCentering    - Equal space between item centers
```

### Nested Stacks

```swift
// Outer vertical stack
let mainStack = UIStackView()
mainStack.axis = .vertical
mainStack.spacing = 20

// Inner horizontal stack for row
let rowStack = UIStackView()
rowStack.axis = .horizontal
rowStack.spacing = 10
rowStack.distribution = .fillEqually

rowStack.addArrangedSubview(button1)
rowStack.addArrangedSubview(button2)
rowStack.addArrangedSubview(button3)

mainStack.addArrangedSubview(titleLabel)
mainStack.addArrangedSubview(rowStack)
mainStack.addArrangedSubview(descriptionLabel)
```

### Adding Spacing/Padding

```swift
// Spacing between all items
stack.spacing = 10

// Custom spacing after specific item (iOS 11+)
stack.setCustomSpacing(20, after: titleLabel)

// Padding around stack content (iOS 11+)
stack.isLayoutMarginsRelativeArrangement = true
stack.layoutMargins = UIEdgeInsets(top: 20, left: 20, bottom: 20, right: 20)
```

---

## Grids in UIKit

UIKit offers multiple approaches to grids, each suited to different scenarios.

**Decision framework:**
- **Nested Stack Views** — Best for small, static grids (tic-tac-toe, calculator). Simple to set up, no data source needed.
- **UICollectionView + FlowLayout** — Best for medium grids with dynamic content. Handles reuse, scrolling, and selection.
- **UICollectionViewCompositionalLayout** — Best for complex, section-based layouts (App Store style). Most powerful, iOS 13+.
- **Manual frames** — Best when you need absolute control or have performance constraints.

**Interview tip:** Know when to use each. Nested stacks for simple cases, UICollectionView for anything with data, compositional layout for complex multi-section designs.

### The 3x3 Grid

#### Method 1: Nested Stack Views (Easiest)

```swift
func createGrid() -> UIStackView {
    let mainStack = UIStackView()
    mainStack.axis = .vertical
    mainStack.spacing = 10
    mainStack.distribution = .fillEqually
    mainStack.translatesAutoresizingMaskIntoConstraints = false
    
    for row in 0..<3 {
        let rowStack = UIStackView()
        rowStack.axis = .horizontal
        rowStack.spacing = 10
        rowStack.distribution = .fillEqually
        
        for col in 0..<3 {
            let index = row * 3 + col
            let cell = createCell(index: index)
            rowStack.addArrangedSubview(cell)
        }
        
        mainStack.addArrangedSubview(rowStack)
    }
    
    return mainStack
}

func createCell(index: Int) -> UIView {
    let cell = UIView()
    cell.backgroundColor = .systemBlue
    cell.layer.cornerRadius = 8
    
    let label = UILabel()
    label.text = "\(index)"
    label.textColor = .white
    label.textAlignment = .center
    label.translatesAutoresizingMaskIntoConstraints = false
    
    cell.addSubview(label)
    NSLayoutConstraint.activate([
        label.centerXAnchor.constraint(equalTo: cell.centerXAnchor),
        label.centerYAnchor.constraint(equalTo: cell.centerYAnchor),
    ])
    
    return cell
}

// Usage
let grid = createGrid()
view.addSubview(grid)

NSLayoutConstraint.activate([
    grid.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),
    grid.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
    grid.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
    grid.heightAnchor.constraint(equalTo: grid.widthAnchor),  // Square
])
```

#### Method 2: UICollectionView with Flow Layout

```swift
class GridViewController: UIViewController, UICollectionViewDataSource, UICollectionViewDelegateFlowLayout {
    
    private var collectionView: UICollectionView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        let layout = UICollectionViewFlowLayout()
        layout.minimumInteritemSpacing = 10
        layout.minimumLineSpacing = 10
        
        collectionView = UICollectionView(frame: .zero, collectionViewLayout: layout)
        collectionView.translatesAutoresizingMaskIntoConstraints = false
        collectionView.dataSource = self
        collectionView.delegate = self
        collectionView.register(GridCell.self, forCellWithReuseIdentifier: "cell")
        collectionView.backgroundColor = .clear
        
        view.addSubview(collectionView)
        
        NSLayoutConstraint.activate([
            collectionView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),
            collectionView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            collectionView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            collectionView.heightAnchor.constraint(equalTo: collectionView.widthAnchor),
        ])
    }
    
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return 9
    }
    
    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: "cell", for: indexPath) as! GridCell
        cell.label.text = "\(indexPath.item)"
        return cell
    }
    
    func collectionView(_ collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, sizeForItemAt indexPath: IndexPath) -> CGSize {
        let spacing: CGFloat = 10
        let totalSpacing = spacing * 2  // 2 gaps for 3 columns
        let width = (collectionView.bounds.width - totalSpacing) / 3
        return CGSize(width: width, height: width)
    }
}

class GridCell: UICollectionViewCell {
    let label = UILabel()
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        
        contentView.backgroundColor = .systemBlue
        contentView.layer.cornerRadius = 8
        
        label.textColor = .white
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        
        contentView.addSubview(label)
        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: contentView.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: contentView.centerYAnchor),
        ])
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}
```

#### Method 3: UICollectionViewCompositionalLayout (iOS 13+, Most Powerful)

```swift
func createCompositionalLayout() -> UICollectionViewLayout {
    let itemSize = NSCollectionLayoutSize(
        widthDimension: .fractionalWidth(1.0 / 3.0),
        heightDimension: .fractionalHeight(1.0)
    )
    let item = NSCollectionLayoutItem(layoutSize: itemSize)
    item.contentInsets = NSDirectionalEdgeInsets(top: 5, leading: 5, bottom: 5, trailing: 5)
    
    let groupSize = NSCollectionLayoutSize(
        widthDimension: .fractionalWidth(1.0),
        heightDimension: .fractionalWidth(1.0 / 3.0)
    )
    let group = NSCollectionLayoutGroup.horizontal(layoutSize: groupSize, subitems: [item])
    
    let section = NSCollectionLayoutSection(group: group)
    
    return UICollectionViewCompositionalLayout(section: section)
}

// Usage
collectionView = UICollectionView(frame: .zero, collectionViewLayout: createCompositionalLayout())
```

#### Method 4: Manual Frame Calculation

```swift
class ManualGridView: UIView {
    private var cells: [UIView] = []
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        
        for i in 0..<9 {
            let cell = UIView()
            cell.backgroundColor = .systemBlue
            cell.layer.cornerRadius = 8
            
            let label = UILabel()
            label.text = "\(i)"
            label.textColor = .white
            label.textAlignment = .center
            label.frame = cell.bounds
            label.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            cell.addSubview(label)
            
            cells.append(cell)
            addSubview(cell)
        }
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        
        let spacing: CGFloat = 10
        let columns = 3
        let totalSpacing = spacing * CGFloat(columns - 1)
        let cellSize = (bounds.width - totalSpacing) / CGFloat(columns)
        
        for (index, cell) in cells.enumerated() {
            let row = index / columns
            let col = index % columns
            
            let x = CGFloat(col) * (cellSize + spacing)
            let y = CGFloat(row) * (cellSize + spacing)
            
            cell.frame = CGRect(x: x, y: y, width: cellSize, height: cellSize)
        }
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}
```

---

## Content Hugging and Compression Resistance

When the layout engine needs to stretch or shrink views to fit available space, it uses these priorities to decide which views give in first. This is one of the most misunderstood aspects of Auto Layout.

**The mental model:**
- **Content Hugging** = "I don't want to grow beyond my natural size" (like a shy person not wanting to take up more space)
- **Compression Resistance** = "I don't want to shrink below my natural size" (like someone holding their ground)

Higher priority = stronger resistance to change. Default hugging is 250 (low), default compression resistance is 750 (high). This means by default, views resist shrinking more than they resist growing.

These priorities determine which views stretch or shrink when there's not enough (or too much) space.

### Content Hugging

"How much do I resist being stretched larger than my intrinsic size?"

```swift
// Higher priority = resist stretching more
label.setContentHuggingPriority(.defaultHigh, for: .horizontal)     // 251
label.setContentHuggingPriority(.defaultLow, for: .horizontal)      // 250
label.setContentHuggingPriority(.required, for: .horizontal)        // 1000
```

### Compression Resistance

"How much do I resist being compressed smaller than my intrinsic size?"

```swift
// Higher priority = resist compression more
label.setContentCompressionResistancePriority(.defaultHigh, for: .horizontal)  // 750
label.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)   // 250
```

### Practical Example

```swift
// Two labels side by side, left should truncate
HStack: [titleLabel] - [dateLabel]

// dateLabel should never truncate
dateLabel.setContentCompressionResistancePriority(.required, for: .horizontal)
dateLabel.setContentHuggingPriority(.required, for: .horizontal)

// titleLabel can stretch and compress
titleLabel.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
titleLabel.setContentHuggingPriority(.defaultLow, for: .horizontal)
```

---

## Intrinsic Content Size

Intrinsic content size is Auto Layout's way of asking a view "How big would you naturally be?" This lets you skip explicit size constraints for views that know their own ideal size.

**Why it matters:** A UILabel knows its ideal size based on its text and font. Instead of constraining its width and height, you only need to position it—Auto Layout uses intrinsic size for the rest.

**Interview tip:** Not all views have intrinsic content size. Plain UIView and UIScrollView don't—you must constrain them explicitly.

Some views know their ideal size (labels, buttons, images). This is their intrinsic content size.

```swift
// Views with intrinsic content size:
UILabel          // Based on text and font
UIButton         // Based on title and image
UIImageView      // Based on image size
UISwitch         // Fixed size
UITextField      // Height based on font

// Views WITHOUT intrinsic content size:
UIView           // Must constrain explicitly
UIScrollView     // Must constrain explicitly
```

### Custom Intrinsic Size

```swift
class CustomView: UIView {
    override var intrinsicContentSize: CGSize {
        return CGSize(width: 100, height: 50)
    }
    
    // Call when size changes
    func updateSize() {
        invalidateIntrinsicContentSize()
    }
}
```

---

## Constraint Priority

When constraints conflict, priority determines which one wins. This is how you create layouts that adapt gracefully—"I want this size, but if you can't do that, this other thing is okay."

**The key insight:** Only one constraint at priority 1000 (required) can exist for any given attribute. But you can have multiple lower-priority constraints competing—the highest priority that can be satisfied wins.

**Common pattern:** Set an ideal constraint at high priority (750) and a fallback constraint at lower priority (250). The layout engine tries to satisfy the high-priority constraint first.

Constraints have priority from 1-1000. Use to create flexible layouts.

```swift
// Built-in priorities
.required        // 1000 - Must satisfy
.defaultHigh     // 750
.defaultLow      // 250
.fittingSizeLevel // 50

// Custom priority
let constraint = view.widthAnchor.constraint(equalToConstant: 200)
constraint.priority = UILayoutPriority(999)  // Almost required
constraint.isActive = true
```

### Practical Example: Flexible Width

```swift
// Card that's ideally 300pt but can shrink to 200pt
let idealWidth = view.widthAnchor.constraint(equalToConstant: 300)
idealWidth.priority = .defaultHigh  // 750

let minWidth = view.widthAnchor.constraint(greaterThanOrEqualToConstant: 200)
minWidth.priority = .required  // 1000

NSLayoutConstraint.activate([idealWidth, minWidth])
```

---

## Animating Constraints

Constraint animations are one of UIKit's most powerful features. The technique is simple but the "why" trips people up.

**How it works:**
1. Change the constraint's constant (outside the animation block)
2. Call `layoutIfNeeded()` inside the animation block

**Why layoutIfNeeded?** Changing a constraint doesn't immediately move views—it just marks the layout as needing update. `layoutIfNeeded()` forces the layout pass to happen immediately, inside your animation block, so UIKit animates the position change.

**Common mistake:** Calling `setNeedsLayout()` instead. This just marks the layout as dirty; it doesn't trigger the layout pass. No animation happens.

```swift
// Store constraint reference
private var topConstraint: NSLayoutConstraint!

topConstraint = view.topAnchor.constraint(equalTo: superview.topAnchor, constant: 100)
topConstraint.isActive = true

// Animate change
func animateUp() {
    topConstraint.constant = 20
    
    UIView.animate(withDuration: 0.3) {
        self.view.layoutIfNeeded()  // CRITICAL - triggers layout update
    }
}
```

### Deactivate and Reactivate

```swift
private var collapsedConstraints: [NSLayoutConstraint] = []
private var expandedConstraints: [NSLayoutConstraint] = []

func toggle(expanded: Bool) {
    if expanded {
        NSLayoutConstraint.deactivate(collapsedConstraints)
        NSLayoutConstraint.activate(expandedConstraints)
    } else {
        NSLayoutConstraint.deactivate(expandedConstraints)
        NSLayoutConstraint.activate(collapsedConstraints)
    }
    
    UIView.animate(withDuration: 0.3) {
        self.view.layoutIfNeeded()
    }
}
```

---

## Common Layout Patterns

These patterns appear in almost every iOS app. Understanding the constraint logic behind each makes it easy to adapt them.

### Full Screen View

Pin all four edges to the parent. This is the simplest layout—the child always matches the parent's size.

```swift
NSLayoutConstraint.activate([
    childView.topAnchor.constraint(equalTo: view.topAnchor),
    childView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
    childView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
    childView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
])
```

### Centered View with Fixed Size

```swift
NSLayoutConstraint.activate([
    childView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
    childView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
    childView.widthAnchor.constraint(equalToConstant: 200),
    childView.heightAnchor.constraint(equalToConstant: 100),
])
```

### Aspect Ratio

```swift
// Square
imageView.heightAnchor.constraint(equalTo: imageView.widthAnchor, multiplier: 1.0)

// 16:9
imageView.heightAnchor.constraint(equalTo: imageView.widthAnchor, multiplier: 9.0/16.0)
```

### Equal Widths

```swift
view2.widthAnchor.constraint(equalTo: view1.widthAnchor)
view3.widthAnchor.constraint(equalTo: view1.widthAnchor)
```

### Percentage Width

```swift
// 50% of parent width
childView.widthAnchor.constraint(equalTo: view.widthAnchor, multiplier: 0.5)
```

### Bottom Pinned View (Keyboard-Aware)

```swift
private var bottomConstraint: NSLayoutConstraint!

bottomConstraint = actionButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -20)
bottomConstraint.isActive = true

// Observe keyboard
NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillShow), name: UIResponder.keyboardWillShowNotification, object: nil)
NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillHide), name: UIResponder.keyboardWillHideNotification, object: nil)

@objc func keyboardWillShow(_ notification: Notification) {
    guard let keyboardFrame = notification.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect else { return }
    
    bottomConstraint.constant = -keyboardFrame.height - 20
    
    UIView.animate(withDuration: 0.3) {
        self.view.layoutIfNeeded()
    }
}

@objc func keyboardWillHide(_ notification: Notification) {
    bottomConstraint.constant = -20
    
    UIView.animate(withDuration: 0.3) {
        self.view.layoutIfNeeded()
    }
}
```

### Card View

```swift
func createCard() -> UIView {
    let card = UIView()
    card.backgroundColor = .white
    card.layer.cornerRadius = 12
    card.layer.shadowColor = UIColor.black.cgColor
    card.layer.shadowOpacity = 0.1
    card.layer.shadowOffset = CGSize(width: 0, height: 2)
    card.layer.shadowRadius = 8
    card.translatesAutoresizingMaskIntoConstraints = false
    
    let imageView = UIImageView()
    imageView.contentMode = .scaleAspectFill
    imageView.clipsToBounds = true
    imageView.layer.cornerRadius = 12
    imageView.layer.maskedCorners = [.layerMinXMinYCorner, .layerMaxXMinYCorner]
    imageView.translatesAutoresizingMaskIntoConstraints = false
    
    let titleLabel = UILabel()
    titleLabel.font = .systemFont(ofSize: 18, weight: .semibold)
    titleLabel.translatesAutoresizingMaskIntoConstraints = false
    
    let subtitleLabel = UILabel()
    subtitleLabel.font = .systemFont(ofSize: 14)
    subtitleLabel.textColor = .secondaryLabel
    subtitleLabel.translatesAutoresizingMaskIntoConstraints = false
    
    card.addSubview(imageView)
    card.addSubview(titleLabel)
    card.addSubview(subtitleLabel)
    
    NSLayoutConstraint.activate([
        imageView.topAnchor.constraint(equalTo: card.topAnchor),
        imageView.leadingAnchor.constraint(equalTo: card.leadingAnchor),
        imageView.trailingAnchor.constraint(equalTo: card.trailingAnchor),
        imageView.heightAnchor.constraint(equalToConstant: 150),
        
        titleLabel.topAnchor.constraint(equalTo: imageView.bottomAnchor, constant: 12),
        titleLabel.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 16),
        titleLabel.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -16),
        
        subtitleLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 4),
        subtitleLabel.leadingAnchor.constraint(equalTo: card.leadingAnchor, constant: 16),
        subtitleLabel.trailingAnchor.constraint(equalTo: card.trailingAnchor, constant: -16),
        subtitleLabel.bottomAnchor.constraint(equalTo: card.bottomAnchor, constant: -16),
    ])
    
    return card
}
```

### Tab Bar Layout

```swift
func createTabBar() -> UIView {
    let container = UIView()
    container.backgroundColor = .systemBackground
    container.translatesAutoresizingMaskIntoConstraints = false
    
    let stack = UIStackView()
    stack.axis = .horizontal
    stack.distribution = .fillEqually
    stack.translatesAutoresizingMaskIntoConstraints = false
    
    let tabs = ["house", "magnifyingglass", "plus.circle", "heart", "person"]
    for icon in tabs {
        let button = UIButton()
        button.setImage(UIImage(systemName: icon), for: .normal)
        button.tintColor = .label
        stack.addArrangedSubview(button)
    }
    
    container.addSubview(stack)
    
    NSLayoutConstraint.activate([
        stack.topAnchor.constraint(equalTo: container.topAnchor, constant: 8),
        stack.leadingAnchor.constraint(equalTo: container.leadingAnchor),
        stack.trailingAnchor.constraint(equalTo: container.trailingAnchor),
        stack.bottomAnchor.constraint(equalTo: container.bottomAnchor, constant: -8),
        stack.heightAnchor.constraint(equalToConstant: 44),
    ])
    
    return container
}
```

---

## ScrollView with Auto Layout

UIScrollView with Auto Layout is notoriously confusing. The key is understanding the two layout guides.

**The mental model:**
- **frameLayoutGuide** — The visible rectangle (what you see on screen)
- **contentLayoutGuide** — The scrollable content area (can be larger than the screen)

**The recipe for vertical scrolling:**
1. ScrollView pinned to parent edges (defines the visible frame)
2. ContentView pinned to `contentLayoutGuide` edges (defines scrollable area)
3. ContentView width equals `frameLayoutGuide` width (prevents horizontal scroll)
4. ContentView height is determined by its children (enables vertical scroll)

**The critical rule:** The bottom-most view inside contentView MUST have a bottom constraint to contentView. This tells Auto Layout where content ends.

The tricky part: ScrollView needs to know content size.

```swift
let scrollView = UIScrollView()
scrollView.translatesAutoresizingMaskIntoConstraints = false

let contentView = UIView()
contentView.translatesAutoresizingMaskIntoConstraints = false

view.addSubview(scrollView)
scrollView.addSubview(contentView)

NSLayoutConstraint.activate([
    // ScrollView fills parent
    scrollView.topAnchor.constraint(equalTo: view.topAnchor),
    scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
    scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
    scrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
    
    // ContentView defines scrollable area
    contentView.topAnchor.constraint(equalTo: scrollView.contentLayoutGuide.topAnchor),
    contentView.leadingAnchor.constraint(equalTo: scrollView.contentLayoutGuide.leadingAnchor),
    contentView.trailingAnchor.constraint(equalTo: scrollView.contentLayoutGuide.trailingAnchor),
    contentView.bottomAnchor.constraint(equalTo: scrollView.contentLayoutGuide.bottomAnchor),
    
    // ContentView width matches ScrollView (vertical scroll only)
    contentView.widthAnchor.constraint(equalTo: scrollView.frameLayoutGuide.widthAnchor),
    
    // Height is determined by content inside contentView
])

// Add content to contentView
// Make sure bottom-most view has bottom constraint to contentView!
```

---

## Debugging Auto Layout

Auto Layout bugs fall into two categories: **ambiguous** (missing constraints, multiple solutions possible) and **unsatisfiable** (conflicting constraints, no solution possible). Your debugging approach differs for each.

**For ambiguous layouts:** The layout engine picks a solution, but it might not be what you wanted. Use `hasAmbiguousLayout` to detect and `exerciseAmbiguityInLayout()` to visualize the alternatives.

**For unsatisfiable layouts:** You'll see console errors listing the conflicting constraints. Read them carefully—one of those constraints needs to change. Give constraints identifiers to make the logs readable.

### Console Messages

```
Unable to simultaneously satisfy constraints.
```

This means conflicting constraints. Look at the constraint list and find the conflict.

### Debug in Code

```swift
// Print all constraints
print(view.constraints)

// Identify constraints
constraint.identifier = "card-width"  // Shows in console

// Check for ambiguity
print(view.hasAmbiguousLayout)
view.exerciseAmbiguityInLayout()  // Randomly picks between ambiguous options
```

### Visual Debugging

```swift
extension UIView {
    func addDebugBorder(_ color: UIColor = .red) {
        layer.borderColor = color.cgColor
        layer.borderWidth = 1
    }
    
    func debugAllSubviews() {
        let colors: [UIColor] = [.red, .blue, .green, .orange, .purple]
        func debug(_ view: UIView, depth: Int) {
            view.addDebugBorder(colors[depth % colors.count])
            for subview in view.subviews {
                debug(subview, depth: depth + 1)
            }
        }
        debug(self, depth: 0)
    }
}
```

### View Hierarchy Debugger

In Xcode: Debug → View Debugging → Capture View Hierarchy

---

## Common Mistakes

### 1. Forgot translatesAutoresizingMaskIntoConstraints

```swift
// WRONG
let view = UIView()
view.topAnchor.constraint(...)  // Won't work!

// RIGHT
let view = UIView()
view.translatesAutoresizingMaskIntoConstraints = false
view.topAnchor.constraint(...)
```

### 2. Conflicting Constraints

```swift
// WRONG - Can't have both!
view.widthAnchor.constraint(equalToConstant: 100),
view.leadingAnchor.constraint(equalTo: parent.leadingAnchor),
view.trailingAnchor.constraint(equalTo: parent.trailingAnchor),

// RIGHT - Pick width OR leading+trailing
```

### 3. Missing Constraints

```swift
// WRONG - Missing Y position
view.leadingAnchor.constraint(equalTo: parent.leadingAnchor),
view.widthAnchor.constraint(equalToConstant: 100),
view.heightAnchor.constraint(equalToConstant: 50),
// Where vertically? Ambiguous!

// RIGHT
view.topAnchor.constraint(equalTo: parent.topAnchor, constant: 20),
```

### 4. Constraint to Wrong View

```swift
// WRONG - Should be superview, not self
view.topAnchor.constraint(equalTo: view.topAnchor)  // Constraint to self!

// RIGHT
view.topAnchor.constraint(equalTo: superview.topAnchor)
```

### 5. Not Calling layoutIfNeeded in Animation

```swift
// WRONG - No animation
constraint.constant = 100
UIView.animate(withDuration: 0.3) { }

// RIGHT
constraint.constant = 100
UIView.animate(withDuration: 0.3) {
    self.view.layoutIfNeeded()
}
```

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────┐
│  SETUP                                                      │
├─────────────────────────────────────────────────────────────┤
│  translatesAutoresizingMaskIntoConstraints = false          │
│  view.addSubview(child)                                     │
│  NSLayoutConstraint.activate([...])                         │
├─────────────────────────────────────────────────────────────┤
│  POSITIONING                                                │
├─────────────────────────────────────────────────────────────┤
│  .topAnchor       .bottomAnchor                             │
│  .leadingAnchor   .trailingAnchor                           │
│  .centerXAnchor   .centerYAnchor                            │
├─────────────────────────────────────────────────────────────┤
│  SIZING                                                     │
├─────────────────────────────────────────────────────────────┤
│  .widthAnchor     .heightAnchor                             │
│  .equalToConstant(100)                                      │
│  .equalTo(other.widthAnchor, multiplier: 0.5)               │
├─────────────────────────────────────────────────────────────┤
│  SAFE AREAS                                                 │
├─────────────────────────────────────────────────────────────┤
│  view.safeAreaLayoutGuide.topAnchor                         │
│  view.safeAreaLayoutGuide.bottomAnchor                      │
├─────────────────────────────────────────────────────────────┤
│  STACK VIEW                                                 │
├─────────────────────────────────────────────────────────────┤
│  .axis = .vertical / .horizontal                            │
│  .spacing = 10                                              │
│  .alignment = .fill / .center / .leading                    │
│  .distribution = .fill / .fillEqually / .equalSpacing       │
│  .addArrangedSubview(view)                                  │
├─────────────────────────────────────────────────────────────┤
│  PRIORITIES                                                 │
├─────────────────────────────────────────────────────────────┤
│  setContentHuggingPriority(.defaultHigh, for: .horizontal)  │
│  setContentCompressionResistancePriority(...)               │
│  constraint.priority = UILayoutPriority(999)                │
└─────────────────────────────────────────────────────────────┘
```

---

## Resources

- https://developer.apple.com/documentation/uikit/uiview/positioning_content_within_layout_margins
- https://www.raywenderlich.com/811496-auto-layout-tutorial-in-ios-getting-started
- WWDC: Mysteries of Auto Layout (Parts 1 & 2)
