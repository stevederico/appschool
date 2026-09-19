# 30-Minute UIKit Hard Mode Interview

## Format
- 5 min: Rapid fire concepts
- 18 min: Live coding exercise
- 5 min: Follow-ups and questions
- 2 min: Your questions

---

## Part 1: Rapid Fire (5 min)

**View Controller Lifecycle**
- What's the difference between `loadView` and `viewDidLoad`?
- When would you override `loadView`?
- What happens if you override `loadView` but don't assign `self.view`?

**Frame vs Bounds**
- What's the difference?
- If I rotate a view 45 degrees, what happens to its frame?

**Auto Layout**
- What's `translatesAutoresizingMaskIntoConstraints`? Why set it to false?
- What's intrinsic content size?
- Content hugging vs compression resistance - which one wins when space is tight?

**Table View**
- Why does cell reuse matter?
- `dequeueReusableCell(withIdentifier:)` vs `dequeueReusableCell(withIdentifier:for:)` - what's the difference?

**Memory**
- What's a retain cycle? Give an example.
- When do you use `weak` vs `unowned`?

---

## Part 2: Live Coding (18 min)

### Likely Prompts

**Option A: Classic Table + Network**
> Build a table view that fetches data from an API and displays it. Programmatic layout, no storyboards. Handle errors. Use async/await.

**Option B: Form Layout**
> Build a login screen with email field, password field, and a submit button. Programmatic Auto Layout. Button should be disabled until both fields have text.

**Option C: Custom Cell**
> Build a table view with a custom cell that has a title label, subtitle label, and a button on the right side. Tapping the button should print the index path.

**Option D: Navigation Flow**
> Build a list screen. Tapping an item pushes a detail screen. Detail screen has a "Delete" button that pops back and removes the item from the list.

---

## What They're Evaluating

| Signal | What They Want to See |
|--------|----------------------|
| Layout | `translatesAutoresizingMaskIntoConstraints = false`, clean constraints |
| Data Source | Proper `numberOfRowsInSection`, `cellForRowAt` implementation |
| Memory | No retain cycles in closures, `[weak self]` where needed |
| Async | `Task {}`, proper error handling, UI updates after fetch |
| Navigation | `navigationController?.pushViewController`, passing data correctly |
| Polish | `deselectRow(at:animated:)`, loading states, edge cases |

---

## Common Mistakes Under Pressure

```markdown
□ Forgot tableView.reloadData()
□ Forgot translatesAutoresizingMaskIntoConstraints = false
□ Forgot to set delegate and dataSource
□ Forgot to add view as subview before constraining
□ Force unwrapped URL without guard
□ Forgot endRefreshing() in error case
□ Used .map instead of .forEach or .filter
□ Didn't wrap alert in MainActor (if needed)
□ Passed individual properties instead of whole model
□ Forgot required init?(coder:) in custom VC
```

---

## Part 3: Follow-Up Questions

After you finish coding, expect:

- "What would you do differently with more time?"
- "How would you add pull-to-refresh?"
- "What if the list had 10,000 items?"
- "How would you add a loading spinner?"
- "What if the API returned paginated results?"
- "How would you test this?"

---

## Your Answers to Have Ready

**"Walk me through your approach"**
> I'll start with the model struct, then set up the table view with constraints, implement data source methods, write the async fetch function, and handle errors with an alert.

**"What would you improve?"**
> Add a loading state, maybe skeleton cells. Error retry. Diffable data source for animations. Unit tests on the network layer.

**"How would you handle pagination?"**
> Track current page, detect when user scrolls near bottom in `scrollViewDidScroll` or `willDisplay cell`, trigger next fetch, append to data source.

---

## 60-Second Pre-Interview Checklist

```markdown
□ UITableView setup: delegate, dataSource, register/dequeue
□ Auto Layout: translatesAutoresizing, activate constraints
□ Async fetch: Task {}, do/catch, reloadData()
□ Navigation: pushViewController, custom init, pass model
□ Memory: [weak self] in closures
□ Error handling: UIAlertController on main thread
```

You've done all of this tonight. You're ready.
