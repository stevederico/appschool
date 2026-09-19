# SwiftUI Layout Mastery - Complete Guide

**1. Layout System** - Three-Step Process, Golden Rule, Views Size Themselves

**2. Stacks** - VStack, HStack, ZStack, Alignment Options

**3. Grids** - LazyVGrid, GridItem Types, Fixed/Flexible/Adaptive

**4. Frame Modifier** - Container Model, Variations, .infinity Pattern

**5. Spacing** - Spacer, Divider, Common Patterns

**6. GeometryReader** - Size Access, Gotchas, Responsive Layouts

**7. Advanced** - Alignment Guides, Layout Priority, Fixed Size, Aspect Ratio

**8. Patterns** - Card, Profile, Tab Bar, Masonry, Safe Area, Overlay

**9. Debugging** - Borders, Common Mistakes

---

## The SwiftUI Layout System

SwiftUI uses a three-step layout process:

1. **Parent proposes size** to child
2. **Child chooses its own size** (children have final say)
3. **Parent positions child** in its coordinate space

This is the opposite of UIKit where parents dictate sizes. Understanding this is key to mastering SwiftUI.

---

## The Golden Rule

**Views size themselves.** A parent cannot force a size on a child. It can only:
- Propose a size
- Position the child after it sizes itself

```swift
// The Text chooses its own size based on content
// The frame modifier just proposes a size
Text("Hello")
    .frame(width: 200, height: 100)
    // Text is still only as big as "Hello"
    // The frame creates a 200x100 container
    // Text is centered within it
```

---

## Stacks - The Foundation

Stacks are SwiftUI's primary layout tool. They arrange views along a single axis and handle spacing automatically. Think of them like arranging books on a shelf—you decide the direction and alignment, and the stack figures out the positioning.

**When to use which:**
- **VStack** — Content flows top-to-bottom (forms, lists, cards)
- **HStack** — Content flows left-to-right (toolbars, inline labels, buttons)
- **ZStack** — Content overlaps (backgrounds, badges, overlays)

**Key insight:** Stacks don't force sizes on children. Each child sizes itself, then the stack arranges them. This means a stack is only as big as it needs to be to contain its children—it won't automatically fill available space.

### VStack (Vertical)

```swift
VStack(alignment: .leading, spacing: 10) {
    Text("First")
    Text("Second")
    Text("Third")
}
```

**Alignment options:** `.leading`, `.center`, `.trailing`

### HStack (Horizontal)

```swift
HStack(alignment: .top, spacing: 10) {
    Text("Left")
    Text("Right")
}
```

**Alignment options:** `.top`, `.center`, `.bottom`, `.firstTextBaseline`, `.lastTextBaseline`

### ZStack (Overlay/Depth)

```swift
ZStack(alignment: .bottomTrailing) {
    Image("background")
    Text("Overlay")
}
```

**Alignment options:** Any combination - `.topLeading`, `.center`, `.bottomTrailing`, etc.

---

## Grids - What You Need

SwiftUI offers multiple ways to create grids, each with different trade-offs. The right choice depends on your content and requirements.

**Decision framework:**
- **LazyVGrid/LazyHGrid** — Best for scrollable content with many items. "Lazy" means views are created on-demand as they scroll into view, saving memory.
- **Grid (iOS 16+)** — Best for static grids where you need precise control over row/column alignment. Not lazy—all cells exist immediately.
- **Nested Stacks** — Best for simple, fixed-size grids (like a tic-tac-toe board). Most explicit control but most verbose.

**The key concept:** Grids are defined by their columns (for LazyVGrid) or rows (for LazyHGrid). You specify how many columns you want and how they should size themselves, then the grid fills them with your content.

### The 3x3 Grid (Multiple Ways)

#### Method 1: LazyVGrid (Most Common)

```swift
let columns = [
    GridItem(.flexible()),
    GridItem(.flexible()),
    GridItem(.flexible())
]

LazyVGrid(columns: columns, spacing: 10) {
    ForEach(0..<9) { index in
        Text("\(index)")
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .aspectRatio(1, contentMode: .fit)
            .background(Color.blue)
    }
}
```

#### Method 2: Fixed Size Grid

```swift
let columns = [
    GridItem(.fixed(100)),
    GridItem(.fixed(100)),
    GridItem(.fixed(100))
]

LazyVGrid(columns: columns, spacing: 10) {
    ForEach(0..<9) { index in
        Text("\(index)")
            .frame(width: 100, height: 100)
            .background(Color.blue)
    }
}
```

#### Method 3: Adaptive Grid (Responsive)

```swift
// Fits as many as possible with minimum 80pt width
let columns = [
    GridItem(.adaptive(minimum: 80))
]

LazyVGrid(columns: columns, spacing: 10) {
    ForEach(0..<9) { index in
        Text("\(index)")
            .frame(height: 80)
            .frame(maxWidth: .infinity)
            .background(Color.blue)
    }
}
```

#### Method 4: Nested Stacks (Explicit Control)

```swift
VStack(spacing: 10) {
    ForEach(0..<3) { row in
        HStack(spacing: 10) {
            ForEach(0..<3) { col in
                let index = row * 3 + col
                Text("\(index)")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .aspectRatio(1, contentMode: .fit)
                    .background(Color.blue)
            }
        }
    }
}
```

#### Method 5: Grid (iOS 16+, Most Powerful)

```swift
Grid(horizontalSpacing: 10, verticalSpacing: 10) {
    GridRow {
        Color.red
        Color.green
        Color.blue
    }
    GridRow {
        Color.yellow
        Color.orange
        Color.purple
    }
    GridRow {
        Color.pink
        Color.cyan
        Color.mint
    }
}
.aspectRatio(1, contentMode: .fit)
```

---

## GridItem Types Explained

GridItem defines how a single column (or row) behaves. Understanding the three types is essential for building responsive grids.

**The mental model:** Think of GridItem as answering the question "How wide should this column be?"
- **Fixed** answers: "Exactly this many points, always."
- **Flexible** answers: "At least this much, at most this much, but grow if there's room."
- **Adaptive** answers: "Fit as many columns as possible within the available space."

**Interview tip:** Adaptive is powerful for responsive design—a grid that shows 2 columns on iPhone and 4 on iPad with zero extra code.

```swift
// Fixed: Exactly this size
GridItem(.fixed(100))

// Flexible: At least min, at most max, prefers growing
GridItem(.flexible(minimum: 50, maximum: 200))

// Adaptive: Fit as many as possible in available space
GridItem(.adaptive(minimum: 80, maximum: 120))
```

### Real Examples

```swift
// 3 equal columns
[GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())]

// Shorthand for above
Array(repeating: GridItem(.flexible()), count: 3)

// 2 columns: fixed left, flexible right
[GridItem(.fixed(100)), GridItem(.flexible())]

// As many 100pt columns as fit
[GridItem(.adaptive(minimum: 100))]
```

---

## Frame Modifier Deep Dive

### The Most Misunderstood Modifier

```swift
// WRONG mental model: "Make this view 200x100"
// CORRECT mental model: "Create a 200x100 container, child sizes itself inside"

Text("Hi")
    .frame(width: 200, height: 100)
```

### Frame Variations

```swift
// Fixed size container
.frame(width: 200, height: 100)

// Flexible size container
.frame(minWidth: 100, maxWidth: 300, minHeight: 50, maxHeight: 200)

// Expand to fill available space
.frame(maxWidth: .infinity, maxHeight: .infinity)

// Expand width, fixed height
.frame(maxWidth: .infinity)
.frame(height: 50)

// Alignment within frame
.frame(width: 200, height: 100, alignment: .topLeading)
```

### The .infinity Pattern

```swift
// Take all available width
Text("Hello")
    .frame(maxWidth: .infinity)
    .background(Color.blue)

// Take all available space
Text("Hello")
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(Color.blue)

// Common pattern: full-width button
Button("Submit") { }
    .frame(maxWidth: .infinity)
    .padding()
    .background(Color.blue)
    .foregroundColor(.white)
    .cornerRadius(10)
```

---

## Spacer and Divider

### Spacer

Spacer is SwiftUI's way of pushing views apart. Think of it like a spring—it expands to fill whatever space is available, pushing other views to the edges.

**Why Spacer exists:** Without Spacer, stacks only take up as much space as their content needs. Spacer is how you tell SwiftUI "use the remaining space here."

**The key insight:** Spacer only works inside stacks. It expands along the stack's axis—horizontally in HStack, vertically in VStack.

Spacer expands to fill available space in a stack:

```swift
// Push content to edges
HStack {
    Text("Left")
    Spacer()
    Text("Right")
}

// Push to one side
HStack {
    Spacer()
    Text("Right aligned")
}

// Minimum spacing
HStack {
    Text("Left")
    Spacer(minLength: 20)
    Text("Right")
}
```

### Common Spacer Patterns

```swift
// Navigation bar style
HStack {
    Button("Back") { }
    Spacer()
    Text("Title")
    Spacer()
    Button("Done") { }
}

// Form label-value
HStack {
    Text("Name")
    Spacer()
    Text("Steve")
        .foregroundColor(.secondary)
}

// Bottom-aligned content
VStack {
    Spacer()
    Button("Continue") { }
        .padding()
}
```

---

## GeometryReader

GeometryReader solves a specific problem: sometimes you need to know the actual size of the space you're working with. SwiftUI's declarative model usually hides this, but GeometryReader gives you access.

**When to use GeometryReader:**
- Making a view a percentage of available space (e.g., "50% of parent width")
- Creating aspect-ratio-dependent layouts
- Positioning based on screen coordinates
- Parallax effects and scroll-based animations

**When NOT to use GeometryReader:**
- Simple centering (use `.frame` with alignment)
- Equal distribution (use stacks with `.frame(maxWidth: .infinity)`)
- Responsive grids (use `GridItem(.adaptive)`)

**Interview tip:** GeometryReader is often overused. Before reaching for it, ask if there's a simpler modifier-based solution.

Access the size and position of the parent container:

```swift
GeometryReader { geometry in
    // geometry.size.width - available width
    // geometry.size.height - available height
    // geometry.frame(in: .global) - position in screen
    // geometry.frame(in: .local) - position in parent
    
    Text("Width: \(geometry.size.width)")
}
```

### Square that fills width

```swift
GeometryReader { geometry in
    Rectangle()
        .fill(Color.blue)
        .frame(width: geometry.size.width, height: geometry.size.width)
}
```

### Responsive grid with GeometryReader

```swift
GeometryReader { geometry in
    let size = geometry.size.width / 3 - 10
    
    LazyVGrid(columns: Array(repeating: GridItem(.fixed(size)), count: 3), spacing: 10) {
        ForEach(0..<9) { i in
            Color.blue
                .frame(width: size, height: size)
        }
    }
}
```

### ⚠️ GeometryReader Gotcha

GeometryReader expands to fill all available space and aligns content to top-leading:

```swift
// This will look weird - Text at top-left
GeometryReader { geo in
    Text("Small")  // Still takes all space!
}

// Fix: explicitly position
GeometryReader { geo in
    Text("Small")
        .frame(width: geo.size.width, height: geo.size.height)
}
```

---

## Alignment Guides

### Custom Alignment

```swift
extension VerticalAlignment {
    struct CustomCenter: AlignmentID {
        static func defaultValue(in context: ViewDimensions) -> CGFloat {
            context[VerticalAlignment.center]
        }
    }
    static let customCenter = VerticalAlignment(CustomCenter.self)
}

HStack(alignment: .customCenter) {
    Rectangle()
        .fill(Color.red)
        .frame(width: 50, height: 100)
        .alignmentGuide(.customCenter) { d in d[VerticalAlignment.center] }
    
    Rectangle()
        .fill(Color.blue)
        .frame(width: 50, height: 50)
        .alignmentGuide(.customCenter) { d in d[VerticalAlignment.top] }
}
```

---

## Layout Priority

When there isn't enough space for all views at their ideal size, SwiftUI must decide which views shrink. Layout priority controls this decision.

**How it works:** Views with higher priority get offered space first. They take what they need, then remaining space goes to lower-priority views. Default priority is 0.

**Common use case:** A title and a date in an HStack. The date should never truncate, but the title can. Give the date higher priority (or give the title lower priority).

**The mental model:** Think of it like a buffet line—higher priority views get to fill their plate first.

Control which views get space first:

```swift
HStack {
    Text("This is a very long text that might need to truncate")
        .layoutPriority(1)  // Gets space first
    
    Text("Short")
        .layoutPriority(0)  // Gets remaining space
}
```

---

## Fixed Size

By default, Text and other views are flexible—they'll shrink to fit available space. `.fixedSize()` tells a view to use its ideal size regardless of what the parent proposes.

**When to use it:**
- Preventing text truncation when you have room elsewhere
- Ensuring a view doesn't compress below its natural size
- Making a view ignore parent size proposals

**The trade-off:** A fixed-size view might overflow its container. Use with intention.

Stop a view from being flexible:

```swift
// Problem: Text truncates in tight space
HStack {
    Text("Don't truncate me")
    Spacer()
    Text("Other content")
}

// Solution: fixedSize
HStack {
    Text("Don't truncate me")
        .fixedSize()  // Prevents truncation
    Spacer()
    Text("Other content")
}
```

---

## Aspect Ratio

Maintain proportions:

```swift
// Square
Rectangle()
    .aspectRatio(1, contentMode: .fit)

// 16:9
Rectangle()
    .aspectRatio(16/9, contentMode: .fit)

// Fill container (may crop)
Image("photo")
    .resizable()
    .aspectRatio(contentMode: .fill)
    .frame(width: 200, height: 200)
    .clipped()

// Fit in container (may letterbox)
Image("photo")
    .resizable()
    .aspectRatio(contentMode: .fit)
    .frame(width: 200, height: 200)
```

---

## Common Layout Patterns

These patterns appear constantly in iOS apps. Understanding the layout principles behind each one helps you adapt them to your needs.

### Card Layout

Cards are self-contained content blocks with consistent styling. The key challenge is making the image fill the width while maintaining aspect ratio, and ensuring text has proper padding without affecting the image.

**Layout principles used:**
- `.aspectRatio(contentMode: .fill)` + `.clipped()` for the image
- Nested VStack for text content with separate padding
- `.cornerRadius()` applied to the outer container

```swift
VStack(alignment: .leading, spacing: 12) {
    Image("header")
        .resizable()
        .aspectRatio(16/9, contentMode: .fill)
        .frame(height: 200)
        .clipped()
    
    VStack(alignment: .leading, spacing: 8) {
        Text("Title")
            .font(.headline)
        Text("Subtitle goes here with more detail")
            .font(.subheadline)
            .foregroundColor(.secondary)
    }
    .padding(.horizontal)
    .padding(.bottom)
}
.background(Color.white)
.cornerRadius(12)
.shadow(radius: 4)
```

### Profile Header

Profile headers combine an avatar, text info, and an action button. The key is using Spacer to push the button to the right while keeping avatar and text grouped.

**Layout principles used:**
- HStack with explicit spacing for the main row
- Nested VStack for name/subtitle grouping
- Spacer() to push the action button right
- `.clipShape(Circle())` for the avatar

```swift
HStack(spacing: 16) {
    Image("avatar")
        .resizable()
        .aspectRatio(1, contentMode: .fill)
        .frame(width: 80, height: 80)
        .clipShape(Circle())
    
    VStack(alignment: .leading, spacing: 4) {
        Text("Steve")
            .font(.title2.bold())
        Text("iOS Developer")
            .font(.subheadline)
            .foregroundColor(.secondary)
    }
    
    Spacer()
    
    Button("Follow") { }
        .buttonStyle(.borderedProminent)
}
.padding()
```

### Tab Bar

Custom tab bars need equal-width buttons regardless of content. The trick is `.frame(maxWidth: .infinity)` on each button—this makes them all compete equally for space, resulting in equal widths.

**Layout principles used:**
- HStack containing the buttons
- `.frame(maxWidth: .infinity)` on each button for equal distribution
- VStack inside each button for icon + label stacking

```swift
HStack {
    ForEach(tabs, id: \.self) { tab in
        Button {
            selectedTab = tab
        } label: {
            VStack(spacing: 4) {
                Image(systemName: tab.icon)
                    .font(.system(size: 24))
                Text(tab.title)
                    .font(.caption2)
            }
            .foregroundColor(selectedTab == tab ? .blue : .gray)
            .frame(maxWidth: .infinity)
        }
    }
}
.padding(.vertical, 8)
.background(Color(.systemBackground))
```

### Pinterest/Masonry Grid

Standard grids align items in rows. Masonry grids let items have different heights, with each column filling independently—like Pinterest.

**The technique:** Instead of one grid, create multiple LazyVStacks side by side (one per column). Distribute items across columns using modulo. This gives the waterfall effect where items stack within their column.

**Limitation:** This simple approach doesn't balance column heights perfectly. For true height-balancing, you'd need to track each column's height and assign items to the shortest one.

```swift
struct MasonryGrid: View {
    let items: [Item]
    let columns = 2
    
    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            ForEach(0..<columns, id: \.self) { column in
                LazyVStack(spacing: 10) {
                    ForEach(itemsForColumn(column)) { item in
                        ItemCard(item: item)
                    }
                }
            }
        }
        .padding(.horizontal)
    }
    
    func itemsForColumn(_ column: Int) -> [Item] {
        items.enumerated()
            .filter { $0.offset % columns == column }
            .map { $0.element }
    }
}
```

### Full Screen with Safe Area

A common need: background color extends under the notch/home indicator, but content stays within safe areas. The solution is layering with ZStack—background ignores safe area, content respects it.

**Key insight:** `.ignoresSafeArea()` only affects the view it's applied to, not its children. So applying it to a background color lets it extend edge-to-edge while content above stays safe.

```swift
ZStack {
    Color.blue
        .ignoresSafeArea()
    
    VStack {
        // Content respects safe area
        Text("Content")
    }
}
```

### Overlay Badge

Notification badges sit on top of icons, slightly outside their bounds. The `.overlay()` modifier with alignment lets you position content relative to another view without affecting layout.

**The technique:** Use `.overlay(alignment: .topTrailing)` to position the badge at the corner, then `.offset()` to push it slightly outside the icon bounds.

```swift
Image(systemName: "bell")
    .font(.title)
    .overlay(alignment: .topTrailing) {
        Text("3")
            .font(.caption2.bold())
            .foregroundColor(.white)
            .padding(4)
            .background(Color.red)
            .clipShape(Circle())
            .offset(x: 8, y: -8)
    }
```

---

## Debugging Layouts

### Add Borders

```swift
extension View {
    func debugBorder(_ color: Color = .red) -> some View {
        self.border(color, width: 1)
    }
}

// Usage
VStack {
    Text("Hello").debugBorder()
    Text("World").debugBorder(.blue)
}
.debugBorder(.green)
```

---

## Common Mistakes

### 1. GeometryReader Taking All Space

```swift
// Problem
GeometryReader { geo in
    Text("Small")  // Still takes all space!
}

// Solution: Size the GeometryReader or content explicitly
```

### 2. Frame Doesn't Resize View

```swift
// Problem: Text is still small
Text("Hi")
    .frame(width: 200, height: 200)
    .background(Color.blue)  // Blue is 200x200, text is tiny

// If you want blue behind just the text:
Text("Hi")
    .padding()
    .background(Color.blue)
```

### 3. ZStack Sizing

```swift
// Problem: ZStack only as big as largest child
ZStack {
    Text("Hi")  // ZStack is only this big
}

// Solution: Expand ZStack
ZStack {
    Color.clear  // Expands to fill
    Text("Hi")
}
```

---

## The Complete 3x3 Grid Solution

```swift
struct GridShowcase: View {
    var body: some View {
        VStack(spacing: 40) {
            
            // Method 1: LazyVGrid with flexible columns
            Text("LazyVGrid - Flexible").font(.headline)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 3), spacing: 10) {
                ForEach(0..<9) { i in
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color.blue)
                        .aspectRatio(1, contentMode: .fit)
                        .overlay(Text("\(i)").foregroundColor(.white))
                }
            }
            
            // Method 2: Nested Stacks
            Text("Nested Stacks").font(.headline)
            VStack(spacing: 10) {
                ForEach(0..<3) { row in
                    HStack(spacing: 10) {
                        ForEach(0..<3) { col in
                            let i = row * 3 + col
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.orange)
                                .aspectRatio(1, contentMode: .fit)
                                .overlay(Text("\(i)").foregroundColor(.white))
                        }
                    }
                }
            }
        }
        .padding()
    }
}
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│  SIZING                                                     │
├─────────────────────────────────────────────────────────────┤
│  .frame(width: 100, height: 100)    Fixed container         │
│  .frame(maxWidth: .infinity)        Expand to fill          │
│  .fixedSize()                       Use intrinsic size      │
│  .aspectRatio(1, contentMode: .fit) Maintain ratio          │
├─────────────────────────────────────────────────────────────┤
│  STACKS                                                     │
├─────────────────────────────────────────────────────────────┤
│  VStack(alignment:spacing:)         Vertical                │
│  HStack(alignment:spacing:)         Horizontal              │
│  ZStack(alignment:)                 Layered                 │
├─────────────────────────────────────────────────────────────┤
│  GRIDS                                                      │
├─────────────────────────────────────────────────────────────┤
│  LazyVGrid(columns:spacing:)        Vertical scrolling      │
│  LazyHGrid(rows:spacing:)           Horizontal scrolling    │
│  Grid { GridRow { } }               Static grid (iOS 16+)   │
├─────────────────────────────────────────────────────────────┤
│  GRID ITEMS                                                 │
├─────────────────────────────────────────────────────────────┤
│  GridItem(.fixed(100))              Exact size              │
│  GridItem(.flexible())              Fills available         │
│  GridItem(.adaptive(minimum: 80))   As many as fit          │
├─────────────────────────────────────────────────────────────┤
│  SPACING                                                    │
├─────────────────────────────────────────────────────────────┤
│  Spacer()                           Push apart              │
│  .padding()                         Add space around        │
│  .padding(.horizontal, 20)          Specific sides          │
└─────────────────────────────────────────────────────────────┘
```

---

## Resources

- https://developer.apple.com/documentation/swiftui/layout
- https://www.swiftbysundell.com/articles/swiftui-layout-system-guide-part-1/
- https://www.hackingwithswift.com/books/ios-swiftui/how-layout-works-in-swiftui
