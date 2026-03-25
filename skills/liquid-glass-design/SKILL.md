---
name: liquid-glass-design
description: iOS 26 Liquid Glass design system — dynamic glass material with blur, reflection, and interactive morphing for SwiftUI, UIKit, and WidgetKit.
---

# Liquid Glass Design System (iOS 26)

Patterns for implementing Apple's Liquid Glass — a dynamic material that blurs content behind it, reflects color and light from surrounding content, and reacts to touch and pointer interactions. Covers SwiftUI, UIKit, and WidgetKit integration.

**IMPORTANT: All Liquid Glass APIs require iOS 26+. Always use `@available(iOS 26, *)` guards or wrap in `if #available(iOS 26, *) { }` blocks.**

## When to Activate

- Building or updating apps for iOS 26+ with the new design language
- Implementing glass-style buttons, cards, toolbars, or containers
- Creating morphing transitions between glass elements
- Applying Liquid Glass effects to widgets
- Migrating existing blur/material effects to the new Liquid Glass API

## Core Pattern — SwiftUI

### Basic Glass Effect

The simplest way to add Liquid Glass to any view:

```swift
@available(iOS 26, *)
struct GlassButtonView: View {
    var body: some View {
        Text("Hello, World!")
            .font(.title)
            .padding()
            .glassEffect()  // Default: regular variant, capsule shape
    }
}
```

### Customizing Shape and Tint

```swift
@available(iOS 26, *)
struct CustomGlassView: View {
    var body: some View {
        Text("Hello, World!")
            .font(.title)
            .padding()
            .glassEffect(.regular.tint(.orange).interactive(), in: .rect(cornerRadius: 16.0))
    }
}
```

Key customization options:
- `.regular` — standard glass effect
- `.clear` — transparent glass effect (no blur, useful for dimming layers)
- `.tint(Color)` — add color tint for prominence
- `.interactive()` — react to touch and pointer interactions
- `isEnabled: Bool` — disable the glass effect conditionally (default: `true`)
- Shape: `.capsule` (default), `.rect(cornerRadius:)`, `.circle`

### Glass Button Styles

```swift
@available(iOS 26, *)
struct GlassButtonsView: View {
    var body: some View {
        VStack {
            Button("Click Me") { /* action */ }
                .buttonStyle(.glass)

            Button("Important") { /* action */ }
                .buttonStyle(.glassProminent)
        }
    }
}
```

### GlassEffectContainer for Multiple Elements

Always wrap multiple glass views in a container for performance and morphing:

```swift
@available(iOS 26, *)
struct GlassContainerView: View {
    var body: some View {
        GlassEffectContainer(spacing: 40.0) {
            HStack(spacing: 40.0) {
                Image(systemName: "scribble.variable")
                    .frame(width: 80.0, height: 80.0)
                    .font(.system(size: 36))
                    .glassEffect()

                Image(systemName: "eraser.fill")
                    .frame(width: 80.0, height: 80.0)
                    .font(.system(size: 36))
                    .glassEffect()
            }
        }
    }
}
```

The `spacing` parameter controls merge distance — closer elements blend their glass shapes together.

### Uniting Glass Effects

Combine multiple views into a single glass shape with `glassEffectUnion`:

```swift
@available(iOS 26, *)
struct UnitedGlassEffectsView: View {
    let symbolSet = ["star.fill", "heart.fill", "checkmark", "xmark"]
    @Namespace private var namespace

    var body: some View {
        GlassEffectContainer(spacing: 20.0) {
            HStack(spacing: 20.0) {
                ForEach(symbolSet.indices, id: \.self) { item in
                    Image(systemName: symbolSet[item])
                        .frame(width: 80.0, height: 80.0)
                        .glassEffect()
                        .glassEffectUnion(id: item < 2 ? "group1" : "group2", namespace: namespace)
                }
            }
        }
    }
}
```

### Morphing Transitions

Create smooth morphing when glass elements appear/disappear:

```swift
@available(iOS 26, *)
struct MorphingGlassView: View {
    @State private var isExpanded = false
    @Namespace private var namespace

    var body: some View {
        VStack {
            GlassEffectContainer(spacing: 40.0) {
                HStack(spacing: 40.0) {
                    Image(systemName: "scribble.variable")
                        .frame(width: 80.0, height: 80.0)
                        .glassEffect()
                        .glassEffectID("pencil", in: namespace)

                    if isExpanded {
                        Image(systemName: "eraser.fill")
                            .frame(width: 80.0, height: 80.0)
                            .glassEffect()
                            .glassEffectID("eraser", in: namespace)
                    }
                }
            }

            Button("Toggle") {
                withAnimation { isExpanded.toggle() }
            }
            .buttonStyle(.glass)
        }
    }
}
```

### Extending Horizontal Scrolling Under Sidebar

To allow horizontal scroll content to extend under a sidebar or inspector, ensure the `ScrollView` content reaches the leading/trailing edges of the container. The system automatically handles the under-sidebar scrolling behavior when the layout extends to the edges — no additional modifier is needed.

## Core Pattern — UIKit

### Basic UIGlassEffect

```swift
@available(iOS 26, *)
func setupGlassEffect(in view: UIView) {
    let glassEffect = UIGlassEffect()
    glassEffect.tintColor = UIColor.systemBlue.withAlphaComponent(0.3)
    glassEffect.isInteractive = true

    let visualEffectView = UIVisualEffectView(effect: glassEffect)
    visualEffectView.translatesAutoresizingMaskIntoConstraints = false
    visualEffectView.layer.cornerRadius = 20
    visualEffectView.clipsToBounds = true

    view.addSubview(visualEffectView)
    NSLayoutConstraint.activate([
        visualEffectView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
        visualEffectView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
        visualEffectView.widthAnchor.constraint(equalToConstant: 200),
        visualEffectView.heightAnchor.constraint(equalToConstant: 120)
    ])

    // Add content to contentView
    let label = UILabel()
    label.text = "Liquid Glass"
    label.translatesAutoresizingMaskIntoConstraints = false
    visualEffectView.contentView.addSubview(label)
    NSLayoutConstraint.activate([
        label.centerXAnchor.constraint(equalTo: visualEffectView.contentView.centerXAnchor),
        label.centerYAnchor.constraint(equalTo: visualEffectView.contentView.centerYAnchor)
    ])
}
```

### UIGlassContainerEffect for Multiple Elements

```swift
@available(iOS 26, *)
func setupGlassContainer(in view: UIView) {
    let containerEffect = UIGlassContainerEffect()
    containerEffect.spacing = 40.0

    let containerView = UIVisualEffectView(effect: containerEffect)
    containerView.translatesAutoresizingMaskIntoConstraints = false

    let firstGlass = UIVisualEffectView(effect: UIGlassEffect())
    let secondGlass = UIVisualEffectView(effect: UIGlassEffect())

    containerView.contentView.addSubview(firstGlass)
    containerView.contentView.addSubview(secondGlass)

    view.addSubview(containerView)
}
```

### Scroll Edge Effects

```swift
@available(iOS 26, *)
func configureScrollEdgeEffects(_ scrollView: UIScrollView) {
    scrollView.topEdgeEffect.style = .automatic
    scrollView.bottomEdgeEffect.style = .hard
    scrollView.leftEdgeEffect.isHidden = true
}
```

### Toolbar Glass Integration

```swift
@available(iOS 26, *)
func setupGlassToolbarButton() -> UIBarButtonItem {
    let favoriteButton = UIBarButtonItem(image: UIImage(systemName: "heart"), style: .plain, target: self, action: #selector(favoriteAction))
    favoriteButton.hidesSharedBackground = true  // Opt out of shared glass background
    return favoriteButton
}
```

## Core Pattern — WidgetKit

### Rendering Mode Detection

```swift
@available(iOS 26, *)
struct MyWidgetView: View {
    @Environment(\.widgetRenderingMode) var renderingMode

    var body: some View {
        if renderingMode == .accented {
            // Tinted mode: white-tinted, themed glass background
        } else {
            // Full color mode: standard appearance
        }
    }
}
```

### Accent Groups for Visual Hierarchy

```swift
HStack {
    VStack(alignment: .leading) {
        Text("Title")
            .widgetAccentable()  // Accent group
        Text("Subtitle")
            // Primary group (default)
    }
    Image(systemName: "star.fill")
        .widgetAccentable()  // Accent group
}
```

### Image Rendering in Accented Mode

```swift
Image("myImage")
    .widgetAccentedRenderingMode(.monochrome)
```

### Container Background

```swift
VStack { /* content */ }
    .containerBackground(for: .widget) {
        Color.blue.opacity(0.2)
    }
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| GlassEffectContainer wrapping | Performance optimization, enables morphing between glass elements |
| `spacing` parameter | Controls merge distance — fine-tune how close elements must be to blend |
| `@Namespace` + `glassEffectID` | Enables smooth morphing transitions on view hierarchy changes |
| `interactive()` modifier | Explicit opt-in for touch/pointer reactions — not all glass should respond |
| UIGlassContainerEffect in UIKit | Same container pattern as SwiftUI for consistency |
| Accented rendering mode in widgets | System applies tinted glass when user selects tinted Home Screen |

## Best Practices

- **Always use GlassEffectContainer** when applying glass to multiple sibling views — it enables morphing and improves rendering performance
- **Apply `.glassEffect()` after** other appearance modifiers (frame, font, padding)
- **Use `.interactive()`** only on elements that respond to user interaction (buttons, toggleable items)
- **Choose spacing carefully** in containers to control when glass effects merge
- **Use `withAnimation`** when changing view hierarchies to enable smooth morphing transitions
- **Test across appearances** — light mode, dark mode, and accented/tinted modes
- **Ensure accessibility contrast** — text on glass must remain readable

## Anti-Patterns to Avoid

- Using multiple standalone `.glassEffect()` views without a GlassEffectContainer
- Nesting too many glass effects — degrades performance and visual clarity
- Applying glass to every view — reserve for interactive elements, toolbars, and cards
- Forgetting `clipsToBounds = true` in UIKit when using corner radii
- Ignoring accented rendering mode in widgets — breaks tinted Home Screen appearance
- Using opaque backgrounds behind glass — defeats the translucency effect

## When to Use

- Navigation bars, toolbars, and tab bars with the new iOS 26 design
- Floating action buttons and card-style containers
- Interactive controls that need visual depth and touch feedback
- Widgets that should integrate with the system's Liquid Glass appearance
- Morphing transitions between related UI states
