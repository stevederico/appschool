# Guide Authoring Standards

How to create and format guides for AppSchool.

---

## Guide + Quiz Relationship

**Every guide must have an associated quiz. Every quiz question must be covered in the guide.**

This is a hard requirement. The guide teaches the concepts, the quiz verifies understanding.

### Rules

1. **Guide slug = Quiz slug** — A guide with slug `uikit-deep` must have a quiz with slug `uikit-deep`
2. **100% coverage** — Every quiz question must have its answer explained in the guide
3. **No surprises** — Quiz should not test concepts not covered in the guide
4. **Teach then test** — Guide content comes first, quiz reinforces

### Workflow

1. Write the guide content
2. Create quiz questions based on guide content
3. Verify each question has a clear answer in the guide
4. Cross-reference: read each quiz question, find the guide section that teaches it

### Example

If your quiz has:

```
Q: What's the difference between frame and bounds?
A: Frame is in superview coordinates, bounds is in own coordinates
```

Your guide MUST have a section explaining this:

```markdown
### Frame vs Bounds

Frame describes a view's position in its superview's coordinate system.
Bounds describes the view's own coordinate system...
```

---

## Categories

Guides are organized into three categories based on their purpose:

### `core`

Primary learning content. These guides teach fundamental concepts that every learner must understand.

- **Purpose:** Teach new concepts from scratch
- **Style:** Thorough explanations, build mental models, progressive complexity
- **Examples:** `swift-fundamentals`, `uikit-core`, `swiftui-basics`
- **Expected:** Learner has no prior knowledge of the topic

### `review`

Interview preparation content. These guides assume prior knowledge and focus on rapid review and reinforcement.

- **Purpose:** Refresh and solidify existing knowledge
- **Style:** Concise summaries, quick reference, interview-focused tips
- **Examples:** `review-40`, `review-60`, `review-80`, `review-100`
- **Expected:** Learner has completed core guides or has equivalent experience
- **Structure:** Often uses progress bars to show cumulative coverage

Review guides typically follow a progression:
| Guide | Coverage | Target |
|-------|----------|--------|
| `review-40` | 40% | Fundamentals refresher |
| `review-60` | 60% | Intermediate depth |
| `review-80` | 80% | Advanced topics |
| `review-100` | 100% | Edge cases, deep cuts |

### `bonus`

Supplementary content. Deep dives, specialized topics, or advanced material beyond core curriculum.

- **Purpose:** Go deeper on specific topics
- **Style:** Comprehensive, reference-quality, for motivated learners
- **Examples:** `uikit-deep`, `combine-advanced`, `performance-tuning`
- **Expected:** Learner wants to go beyond interview prep

---

## Database Fields

### Guide

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | string | yes | URL-friendly identifier (e.g., `uikit-deep`) |
| `title` | string | yes | Display title |
| `content` | string | yes | Full markdown content |
| `category` | string | no | Topic category (e.g., `Swift`, `UIKit`) |
| `estimatedMinutes` | number | yes | Reading time estimate |
| `courseId` | ObjectId | yes | Parent course reference |
| `published` | boolean | yes | Visibility flag |

### Quiz

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | string | yes | Must match guide slug |
| `title` | string | yes | Display title |
| `guideId` | ObjectId | yes | Reference to associated guide |
| `courseId` | ObjectId | yes | Parent course reference |
| `passingScore` | number | yes | Minimum % to pass (e.g., 80) |
| `questions` | array | yes | Array of question objects |

### Question Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique question identifier |
| `question` | string | yes | The question text |
| `options` | array | yes | Array of answer choices |
| `correctAnswer` | string | yes | The correct option |

---

## Content Structure

### Title Slide

The first `#` header becomes the title slide. Include:

1. Title
2. Compact table of contents (bold numbered items)
3. Progress bars (optional)
4. Horizontal rule to separate from content

```markdown
# Guide Title

**1. Section Name** - Topic A, Topic B, Topic C

**2. Section Name** - Topic D, Topic E, Topic F

**3. Section Name** - Topic G, Topic H

\```
Swift          [████████████████░░░░] 80%
SwiftUI        [████████████░░░░░░░░] 60%
\```

---
```

### Section Headers

Use `##` for major sections. These become individual slides.

```markdown
## 1. Section Name

Content here...

## 2. Another Section

More content...
```

### Subsections

Use `###` for subsections within a slide. These do NOT create new slides.

```markdown
## 1. Scroll Views

### Understanding the Model

Explanation here...

### The Delegate Pattern

More explanation...
```

---

## Slide Mode Behavior

Content is split into slides by `#` and `##` headers:

```javascript
const sections = markdownContent.split(/(?=^#{1,2} )/gm);
```

**Rules:**
- `# Title` — Creates a slide
- `## Section` — Creates a slide
- `### Subsection` — Does NOT create a slide (stays with parent)
- `#### Deeper` — Does NOT create a slide

**Avoid:**
- `## Table of Contents` — This creates an unwanted separate slide
- Multiple `#` headers — Only use one for the title

---

## Writing Style

**Guides should read like college textbooks**—concise, rigorous explanations of concepts with code examples to illustrate. Every section should teach something, not just show syntax.

**What this means:**
- Explain the underlying concept or mental model before showing code
- Cover the "why" and "when", not just the "what"
- Be precise and technical—readers are developers, not beginners
- Use analogies to build intuition for complex ideas
- Code examples illustrate concepts, they don't replace explanations
- A guide with only code snippets and no prose is incomplete

### Concepts Before Code

Explain the mental model first, then show code as illustration.

**Bad:**
```markdown
### Setup

\```swift
let scrollView = UIScrollView()
scrollView.contentSize = CGSize(width: 1000, height: 2000)
\```
```

**Good:**
```markdown
### Understanding Scroll Views

A scroll view moves a "window" over content larger than the screen. Think of it like a porthole on a ship—the ocean stays still, the porthole moves.

Key concepts:
- **Frame** — The visible rectangle (the porthole)
- **Content Size** — The scrollable area (the ocean)
- **Content Offset** — Current position

\```swift
scrollView.contentSize = CGSize(width: 1000, height: 2000)
scrollView.contentOffset = CGPoint(x: 0, y: 100)
\```
```

### Explain the Why

Don't just show what—explain why it exists and when to use it.

**Bad:**
```markdown
Use `UIViewPropertyAnimator` for animations.
```

**Good:**
```markdown
`UIView.animate` is fire-and-forget—once started, you cannot pause or reverse it. `UIViewPropertyAnimator` solves this by giving you an animation object you can control mid-flight. Use it when animations need to respond to gestures.
```

### Use Analogies

Build mental models with familiar concepts.

- Scroll view = porthole on a ship
- Retain cycle = two people holding hands, neither can leave
- Actor = a person who only takes one phone call at a time

### Interview Tips

Add practical interview advice inline:

```markdown
**Interview tip:** When asked about `weak` vs `unowned`, explain that `weak` becomes `nil` safely while `unowned` crashes. Default to `weak` unless you're certain the reference outlives the closure.
```

---

## Code Blocks

### Language Tags

Always specify the language for syntax highlighting:

```markdown
\```swift
let x = 5
\```
```

### Keep Examples Focused

Show only the relevant code. Omit boilerplate unless teaching it.

**Bad:** Full view controller with imports, class declaration, all lifecycle methods

**Good:** Just the relevant method or pattern

### Add Comments for Non-Obvious Code

```swift
layer.add(animation, forKey: "fade")
layer.opacity = 0  // Must set final value—animations are temporary
```

---

## Tables

Use tables for comparisons and quick reference:

```markdown
| Scenario | Horizontal | Vertical |
|----------|------------|----------|
| iPhone portrait | Compact | Regular |
| iPad full screen | Regular | Regular |
```

---

## Progress Bars

Use code blocks to preserve alignment:

```markdown
\```
Swift          [████████████████░░░░] 80%
SwiftUI        [████████████░░░░░░░░] 60%
UIKit          [██████████░░░░░░░░░░] 50%
\```
```

Characters:
- Filled: `█` (U+2588)
- Empty: `░` (U+2591)
- Total width: 20 characters

---

## Checklist Before Publishing

### Structure
- [ ] Title slide (single `#`) with compact TOC (bold numbered items)
- [ ] No `## Table of Contents` header (causes extra slide)
- [ ] Each `##` section can stand alone as a slide
- [ ] Subsections use `###` (do not create new slides)
- [ ] Horizontal rules (`---`) separate major sections
- [ ] Progress bars in code block, if used (review guides)

### Writing Quality
- [ ] Reads like a college textbook, not a code dump
- [ ] Every section has prose explaining the concept
- [ ] Concepts explained BEFORE code is shown
- [ ] Explains the "why" and "when", not just the "what"
- [ ] Uses analogies to build mental models
- [ ] Includes interview tips where relevant
- [ ] Technical and precise—written for developers

### Code Examples
- [ ] All code blocks have language tags (```swift, ```javascript)
- [ ] Code illustrates concepts, doesn't replace explanations
- [ ] Examples are focused—no unnecessary boilerplate
- [ ] Comments explain non-obvious lines

### Quiz Integration
- [ ] Quiz exists with matching slug
- [ ] Every quiz question is answered in guide content
- [ ] Guide covers all concepts tested in quiz
- [ ] Cross-referenced: read each question, found answer in guide

### Metadata
- [ ] `slug` is URL-friendly (lowercase, hyphens)
- [ ] `title` is clear and descriptive
- [ ] `category` is set (core, review, bonus)
- [ ] `estimatedMinutes` is accurate
- [ ] `published` is set to true

### Final Review
- [ ] Tested in slide mode
- [ ] No orphaned code blocks without explanation
- [ ] No sections that are just code with no prose

---

## Updating Guides

Guides are stored in MongoDB. Update via Node.js:

```javascript
import { MongoClient } from "mongodb";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env", "utf8").split("\n")
    .filter(l => l.includes("="))
    .map(l => l.split("=").map(s => s.trim()))
);

const content = readFileSync("my-guide.md", "utf8");

const client = new MongoClient(env.MONGODB_URL);
await client.connect();
const db = client.db("AppSchool");

await db.collection("Guides").updateOne(
  { slug: "my-guide-slug" },
  { $set: { content } }
);

await client.close();
```

---

## Example Guide Structure

```markdown
# Swift Concurrency Guide

**1. async/await** - Syntax, Suspension Points, Error Handling

**2. Actors** - Isolation, Reentrancy, @MainActor

**3. Sendable** - Value Types, Checking, Bridging

\```
Concurrency    [████████████████████] 100%
\```

---

## 1. async/await

### What Problem Does It Solve?

Callback-based code creates "pyramid of doom"...

### Syntax

The `async` keyword marks functions that can suspend...

\```swift
func fetchUser() async throws -> User {
    let data = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode(User.self, from: data)
}
\```

### Suspension Points

When you see `await`, the function might pause...

---

## 2. Actors

### Understanding Isolation

An actor is like a person who only takes one call at a time...
```
