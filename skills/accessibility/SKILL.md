---
name: accessibility
description: VoiceOver, Dynamic Type, motor accessibility, contrast, and testing guidelines for iOS apps.
---

# Accessibility (A11y) Guidelines

> **Scope:** VoiceOver, Dynamic Type, motor accessibility, visual accessibility, testing, App Store compliance

## Core Rules

1. **MUST** add `accessibilityLabel` to every interactive element (buttons, fields, links)
2. **MUST** hide purely decorative images with `.accessibilityHidden(true)`
3. **MUST** combine related elements with `.accessibilityElement(children: .combine)` to reduce VoiceOver noise
4. **MUST** ensure all tap targets are at least 44x44 points
5. **MUST** support Dynamic Type without fixed font sizes; adapt layout above `.accessibility3`
6. **MUST** meet WCAG AA contrast: 4.5:1 for text, 3:1 for UI components
7. **MUST** respect Reduce Motion; disable animations for motion-sensitive users
8. **MUST** test with VoiceOver on every screen before shipping

## VoiceOver Example

```swift
Button(action: { toggleFavorite() }) {
    Image(systemName: isFavorite ? "heart.fill" : "heart")
}
.accessibilityLabel(isFavorite ? "Remove from favorites" : "Add to favorites")

HStack {
    Image(systemName: "star.fill")
    Text("4.5")
}
.accessibilityElement(children: .combine)
.accessibilityLabel("Rating: 4.5 out of 5 stars")
```

## Dynamic Type

- **MUST** use dynamic type styles (`.title`, `.body`, `.caption`); never hardcoded font sizes
- **MUST** use `@ScaledMetric` for dimensions that should scale with text size
- **SHOULD** adapt layouts at extreme sizes (`.accessibility3` and above):

```swift
@Environment(\.dynamicTypeSize) private var typeSize

var body: some View {
    if typeSize >= .accessibility1 {
        VStack { title; description }  // Vertical
    } else {
        HStack { VStack { title; description }; details }  // Side-by-side
    }
}
```

## Accessibility Traits and Contrast

- **MUST** use proper traits (`.isButton`, `.isHeader`, `.isSelected`) to communicate element purpose
- **MUST** ensure sufficient contrast: 4.5:1 for normal text, 3:1 for large text/UI components
- **SHOULD NOT** convey information through color alone; always add text or icons

```swift
Button("Confirm") { confirm() }
    .accessibilityAddTraits(.isButton)

Text("Settings").font(.title2)
    .accessibilityAddTraits(.isHeader)

// ✅ Status with icon + text
HStack {
    Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.red)
    Text("Error: Please fix the form").foregroundStyle(.red)
}
.accessibilityLabel("Error: Please fix the form")
```

## Reduce Motion

```swift
@Environment(\.accessibilityReduceMotion) private var reduceMotion

var body: some View {
    content.onTapGesture {
        withAnimation(reduceMotion ? .none : .spring()) {
            isExpanded.toggle()
        }
    }
}
```

## Testing Accessibility

| Method | Requirements |
|--------|--------------|
| **Accessibility Inspector** | Run audit via Xcode Developer Tools; check labels, contrast, traits |
| **VoiceOver Testing** | Settings → Accessibility → VoiceOver; verify every element reachable and announces clearly |
| **Automated Audits** | iOS 17+: `app.performAccessibilityAudit()` in XCTest |

- **MUST** test VoiceOver navigation order (top-to-bottom, left-to-right)
- **MUST** verify custom actions work with two-finger swipe
- **MUST** verify error messages announce immediately
