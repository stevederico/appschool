# AppKit - Interview Ready Guide

---

## What It Is

AppKit is Apple's framework for building macOS applications. Unlike UIKit (iOS) or SwiftUI (declarative), AppKit uses an imperative, object-oriented approach with NSView, NSWindow, and NSViewController.

---

## Core Components

```swift
// Window Controller
class MainWindowController: NSWindowController {
    override func windowDidLoad() {
        super.windowDidLoad()
        window?.title = "My App"
    }
}

// View Controller
class MainViewController: NSViewController {
    @IBOutlet weak var label: NSTextField!
    @IBOutlet weak var button: NSButton!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        label.stringValue = "Hello"
    }
    
    @IBAction func buttonClicked(_ sender: NSButton) {
        label.stringValue = "Clicked!"
    }
}
```

---

## Key Differences from UIKit

| Concept | AppKit | UIKit |
|---------|--------|-------|
| Base view | NSView | UIView |
| Labels | NSTextField | UILabel |
| Buttons | NSButton | UIButton |
| Tables | NSTableView | UITableView |
| Coordinate system | Bottom-left origin | Top-left origin |
| Storyboards | Optional | Common |

---

## Programmatic UI

```swift
class ViewController: NSViewController {
    private lazy var stackView: NSStackView = {
        let stack = NSStackView()
        stack.orientation = .vertical
        stack.spacing = 10
        return stack
    }()
    
    private lazy var button: NSButton = {
        let btn = NSButton(title: "Click", target: self, action: #selector(clicked))
        return btn
    }()
    
    override func loadView() {
        view = NSView(frame: NSRect(x: 0, y: 0, width: 400, height: 300))
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        stackView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stackView)
        stackView.addArrangedSubview(button)
        
        NSLayoutConstraint.activate([
            stackView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            stackView.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
    }
    
    @objc func clicked() {
        print("Clicked")
    }
}
```

---

## Menus and Toolbars

```swift
// Menu
let menu = NSMenu(title: "File")
let item = NSMenuItem(title: "Open", action: #selector(openFile), keyEquivalent: "o")
menu.addItem(item)

// Toolbar (modern)
extension NSToolbarItem.Identifier {
    static let addItem = NSToolbarItem.Identifier("addItem")
}

func toolbar(_ toolbar: NSToolbar, itemForItemIdentifier itemIdentifier: NSToolbarItem.Identifier, willBeInsertedIntoToolbar flag: Bool) -> NSToolbarItem? {
    let item = NSToolbarItem(itemIdentifier: itemIdentifier)
    item.label = "Add"
    item.image = NSImage(systemSymbolName: "plus", accessibilityDescription: nil)
    item.action = #selector(addItem)
    return item
}
```

---

## Interview Questions

**Q: When use AppKit vs SwiftUI for macOS?**

A: SwiftUI for new projects, simpler UIs, cross-platform. AppKit for complex desktop features, deep system integration, existing codebases. Can mix both using NSHostingView (SwiftUI in AppKit) or NSViewRepresentable (AppKit in SwiftUI).

---

## Resources

- https://developer.apple.com/documentation/appkit
