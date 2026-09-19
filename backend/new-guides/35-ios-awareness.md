# iOS Awareness Guide — 15 Minutes

The final 20%. Just enough to not be lost if it comes up.

---

# 1. Accessibility (2 min)

## What It Is

Making your app usable by people with disabilities — vision, hearing, motor, cognitive.

## Key Concepts

**VoiceOver** — screen reader. Reads UI elements aloud. Users swipe to navigate.

**Dynamic Type** — user sets preferred text size in Settings. Your app should respect it.

**Accessibility Labels** — what VoiceOver reads. Set on images, icons, buttons without clear text.

```swift
Image(systemName: "gear")
    .accessibilityLabel("Settings")
```

**Accessibility Traits** — tells VoiceOver what an element is: button, header, link, etc.

## What Interviewers Want to Hear

"I use accessibility labels, support Dynamic Type, and test with VoiceOver."

---

# 2. Localization (2 min)

## What It Is

Adapting your app for different languages and regions.

## Key Concepts

**String Catalogs** — Xcode 15+. Store translations in `.xcstrings` files.

**NSLocalizedString** — older approach. Wrap strings for translation:

```swift
Text("Hello")  // SwiftUI auto-localizes
let greeting = NSLocalizedString("Hello", comment: "Greeting")  // UIKit
```

**Locale** — user's region. Affects date formats, number formats, currency.

**RTL Languages** — Arabic, Hebrew read right-to-left. Use leading/trailing, not left/right.

## What Interviewers Want to Hear

"I externalize strings, use Auto Layout with leading/trailing constraints, and test with pseudolanguages."

---

# 3. Push Notifications (2 min)

## What It Is

Messages sent from a server to the user's device, even when app isn't running.

## Key Concepts

**APNs** — Apple Push Notification service. Your server talks to Apple, Apple delivers to device.

**Device Token** — unique identifier for this app on this device. You send it to your server.

**Permission** — user must grant permission. Ask at the right moment, not on first launch.

**Payload** — JSON with title, body, sound, badge count. Max 4KB.

**Silent Push** — wakes app in background without alerting user. For syncing data.

## What Interviewers Want to Hear

"I've integrated APNs, handled device token registration, and dealt with permission flow."

---

# 4. Core Data / SwiftData (3 min)

## What They Are

Apple's frameworks for persisting data locally. SQLite under the hood, but you work with objects.

## Core Data (Older)

- **NSManagedObject** — your data objects
- **NSManagedObjectContext** — workspace for changes
- **NSPersistentContainer** — sets everything up

Verbose, but battle-tested. Lots of existing code uses it.

## SwiftData (iOS 17+)

Modern replacement. Uses macros:

```swift
@Model
class User {
    var name: String
    var email: String
}
```

Much simpler. Integrates with SwiftUI via `@Query`:

```swift
@Query var users: [User]
```

## When to Use

- Simple data → UserDefaults or JSON files
- Relational data, large datasets, complex queries → Core Data or SwiftData
- New projects on iOS 17+ → SwiftData
- Supporting older iOS → Core Data

## What Interviewers Want to Hear

"I've used Core Data for persistence. I understand contexts, fetch requests, and migrations. I'm familiar with SwiftData for new projects."

---

# 5. CI/CD (2 min)

## What It Is

Continuous Integration / Continuous Deployment. Automate building, testing, and releasing.

## Key Concepts

**CI** — every commit triggers automated builds and tests. Catches issues early.

**CD** — automatically deploy to TestFlight or App Store after tests pass.

**Common Tools:**
- **Xcode Cloud** — Apple's built-in solution
- **Fastlane** — popular open-source tool for iOS automation
- **GitHub Actions** — general CI, works with iOS
- **Bitrise, CircleCI** — cloud CI services with iOS support

**Fastlane** handles:
- Building and signing
- Running tests
- Uploading to TestFlight
- Screenshots for App Store

## What Interviewers Want to Hear

"I've set up CI pipelines with Fastlane/Xcode Cloud. Automated testing on every PR, deployment to TestFlight on merge to main."

---

# 6. App Store Submission (2 min)

## The Process

1. **App Store Connect** — Apple's portal for managing apps
2. **Archive** — build a release version in Xcode
3. **Upload** — send to App Store Connect
4. **Metadata** — screenshots, description, keywords, privacy policy
5. **Review** — Apple reviews (1-3 days typically)
6. **Release** — manual or automatic after approval

## Common Rejection Reasons

- Crashes or bugs
- Incomplete features
- Misleading metadata
- Privacy issues (missing permission descriptions)
- Guideline violations (in-app purchase rules, etc.)

## Key Concepts

**Provisioning Profiles** — tie your app to your team and devices

**Certificates** — prove you're you. Distribution certificate for App Store.

**TestFlight** — beta testing. Up to 10,000 external testers.

## What Interviewers Want to Hear

"I've submitted apps to the App Store, dealt with rejections, and managed TestFlight distribution."

---

# 7. Security Best Practices (2 min)

## Key Concepts

**Keychain** — secure storage for sensitive data (tokens, passwords). Encrypted by iOS.

```swift
// Don't: UserDefaults for tokens
// Do: Keychain
```

**App Transport Security (ATS)** — enforces HTTPS. Don't disable it.

**Certificate Pinning** — verify server's certificate matches expected. Prevents man-in-middle attacks.

**Biometrics** — Face ID / Touch ID via LocalAuthentication framework.

**Data Protection** — files encrypted when device locked. Set appropriate protection level.

**Obfuscation** — not foolproof, but makes reverse engineering harder.

## What Interviewers Want to Hear

"I store sensitive data in Keychain, use HTTPS everywhere, and implement certificate pinning for high-security apps."

---

# Quick Reference Table

| Topic | One-Liner |
|-------|-----------|
| Accessibility | VoiceOver labels, Dynamic Type, test with screen reader |
| Localization | String catalogs, leading/trailing constraints, locale-aware formatting |
| Push Notifications | APNs, device tokens, permission timing |
| Core Data | Contexts, fetch requests, migrations |
| SwiftData | @Model, @Query, iOS 17+ |
| CI/CD | Fastlane or Xcode Cloud, automate builds/tests/deploys |
| App Store | Archive, upload, metadata, review, TestFlight |
| Security | Keychain for secrets, HTTPS, certificate pinning |

---

# If Asked in Interview

For any of these topics, a good answer is:

"I've worked with [topic] on previous projects. I understand [2-3 key concepts]. I'd need to reference docs for the specifics, but I know the patterns."

Honesty about looking up details is fine. Knowing the concepts exist and roughly how they work is what matters.

---

*Now you're at 100% awareness, 80% depth. That's the right balance.*