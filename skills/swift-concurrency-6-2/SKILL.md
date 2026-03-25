---
name: swift-concurrency-6-2
description: Swift 6.2 Approachable Concurrency — single-threaded by default, @concurrent for explicit background offloading, isolated conformances for main actor types.
---

# Swift 6.2 Approachable Concurrency

Patterns for adopting Swift 6.2's concurrency model where code runs single-threaded by default and concurrency is introduced explicitly. Eliminates common data-race errors without sacrificing performance.

## When to Activate

- Migrating Swift 5.x or 6.0/6.1 projects to Swift 6.2
- Resolving data-race safety compiler errors
- Designing MainActor-based app architecture
- Offloading CPU-intensive work to background threads
- Implementing protocol conformances on MainActor-isolated types
- Enabling Approachable Concurrency build settings in Xcode 26

## Core Problem: Implicit Background Offloading

In Swift 6.1 and earlier, async functions could be implicitly offloaded to background threads, causing data-race errors even in seemingly safe code:

```swift
// Swift 6.1: ERROR
@MainActor
final class StickerModel {
    let photoProcessor = PhotoProcessor()

    func extractSticker(_ item: PhotosPickerItem) async throws -> Sticker? {
        guard let data = try await item.loadTransferable(type: Data.self) else { return nil }

        // Error: Sending 'self.photoProcessor' risks causing data races
        return await photoProcessor.extractSticker(data: data, with: item.itemIdentifier)
    }
}
```

Swift 6.2 fixes this: async functions stay on the calling actor by default.

```swift
// Swift 6.2: OK — async stays on MainActor, no data race
@MainActor
final class StickerModel {
    let photoProcessor = PhotoProcessor()

    func extractSticker(_ item: PhotosPickerItem) async throws -> Sticker? {
        guard let data = try await item.loadTransferable(type: Data.self) else { return nil }
        return await photoProcessor.extractSticker(data: data, with: item.itemIdentifier)
    }
}
```

## Core Pattern — Isolated Conformances

MainActor types can now conform to non-isolated protocols safely:

```swift
protocol Exportable {
    func export()
}

// Swift 6.1: ERROR — crosses into main actor-isolated code
// Swift 6.2: OK with isolated conformance
extension StickerModel: @MainActor Exportable {
    func export() {
        photoProcessor.exportAsPNG()
    }
}
```

The compiler ensures the conformance is only used on the main actor:

```swift
// OK — ImageExporter is also @MainActor
@MainActor
struct ImageExporter {
    var items: [any Exportable]

    mutating func add(_ item: StickerModel) {
        items.append(item)  // Safe: same actor isolation
    }
}

// ERROR — nonisolated context can't use MainActor conformance
nonisolated struct ImageExporter {
    var items: [any Exportable]

    mutating func add(_ item: StickerModel) {
        items.append(item)  // Error: Main actor-isolated conformance cannot be used here
    }
}
```

## Core Pattern — Global and Static Variables

Protect global/static state with MainActor:

```swift
// Swift 6.1: ERROR — non-Sendable type may have shared mutable state
final class StickerLibrary {
    static let shared: StickerLibrary = .init()  // Error
}

// Fix: Annotate with @MainActor
@MainActor
final class StickerLibrary {
    static let shared: StickerLibrary = .init()  // OK
}
```

### MainActor Default Inference Mode

> **Toolchain Requirement**: The patterns in this section require Swift 6.2+ with Approachable Concurrency enabled in build settings (Xcode 26+). On Swift 6.0/6.1, these patterns will NOT compile.
>
> **Multi-toolchain strategy:** Use `#if compiler(>=6.2)` to conditionally compile patterns:
> ```swift
> #if compiler(>=6.2)
> // Swift 6.2+ — MainActor inferred by default
> final class StickerLibrary {
>     static let shared: StickerLibrary = .init()
> }
> #else
> // Swift 6.0/6.1 — explicit annotations required
> @MainActor
> final class StickerLibrary {
>     static let shared: StickerLibrary = .init()
> }
> #endif
> ```

Swift 6.2 introduces a mode where MainActor is inferred by default — no manual annotations needed:

```swift
// With MainActor default inference enabled: (Swift 6.2+ with Approachable Concurrency)
final class StickerLibrary {
    static let shared: StickerLibrary = .init()  // Implicitly @MainActor (Swift 6.2+)
}

final class StickerModel {
    let photoProcessor: PhotoProcessor
    var selection: [PhotosPickerItem]  // Implicitly @MainActor (Swift 6.2+)
}

extension StickerModel: Exportable {  // Implicitly @MainActor conformance (Swift 6.2+)
    func export() {
        photoProcessor.exportAsPNG()
    }
}
```

This mode is opt-in and recommended for apps, scripts, and other executable targets.

## Core Pattern — @concurrent for Background Work

When you need actual parallelism, explicitly offload with `@concurrent`:

> **Important:** This example requires Approachable Concurrency build settings — SE-0466 (MainActor default isolation) and SE-0461 (NonisolatedNonsendingByDefault).

> **Without these settings, the mutable state access is a data race.** To support Swift 6.0/6.1, use the `@MainActor` class variant below.

**Swift 6.2+ (with Approachable Concurrency):**

```swift
// With SE-0466 enabled, this class inherits MainActor isolation by default.
// Do NOT mark it `nonisolated` — that would opt out of MainActor protection.
final class PhotoProcessor {
    private var cachedStickers: [String: Sticker] = [:]

    func extractSticker(data: Data, with id: String) async -> Sticker {
        if let sticker = cachedStickers[id] {
            return sticker
        }

        let sticker = await Self.extractSubject(from: data)
        cachedStickers[id] = sticker
        return sticker
    }

    // Offload expensive work to concurrent thread pool
    @concurrent
    static func extractSubject(from data: Data) async -> Sticker { /* ... */ }
}
```

**Swift 6.0/6.1 fallback (explicit @MainActor):**

```swift
#if compiler(<6.2)
@MainActor
final class PhotoProcessor {
    private var cachedStickers: [String: Sticker] = [:]

    func extractSticker(data: Data, with id: String) async -> Sticker {
        if let sticker = cachedStickers[id] {
            return sticker
        }
        let sticker = await Self.extractSubject(from: data)
        cachedStickers[id] = sticker
        return sticker
    }

    nonisolated static func extractSubject(from data: Data) async -> Sticker { /* ... */ }
}
#endif
```

```swift
// Callers must await
let processor = PhotoProcessor()
processedPhotos[item.id] = await processor.extractSticker(data: data, with: item.id)
```

To use `@concurrent` (Swift 6.2+):
1. Ensure Approachable Concurrency is enabled (class inherits MainActor by default)
2. Add `@concurrent` to functions that need background execution
3. Add `async` if not already asynchronous
4. Add `await` at call sites

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Single-threaded by default | Most natural code is data-race free; concurrency is opt-in |
| Async stays on calling actor | Eliminates implicit offloading that caused data-race errors |
| Isolated conformances | MainActor types can conform to protocols without unsafe workarounds |
| `@concurrent` explicit opt-in | Background execution is a deliberate performance choice, not accidental |
| MainActor default inference | Reduces boilerplate `@MainActor` annotations for app targets |
| Opt-in adoption | Non-breaking migration path — enable features incrementally |

## Migration Steps

1. **Enable in Xcode**: Swift Compiler > Concurrency section in Build Settings
2. **Enable in SPM**: Use `SwiftSettings` API in package manifest
3. **Use migration tooling**: Automatic code changes via swift.org/migration
4. **Start with MainActor defaults**: Enable inference mode for app targets
5. **Add `@concurrent` where needed**: Profile first, then offload hot paths
6. **Test thoroughly**: Data-race issues become compile-time errors

## Best Practices

- **Start on MainActor** — write single-threaded code first, optimize later
- **Use `@concurrent` only for CPU-intensive work** — image processing, compression, complex computation
- **Enable MainActor inference mode** for app targets that are mostly single-threaded
- **Profile before offloading** — use Instruments to find actual bottlenecks
- **Protect globals with MainActor** — global/static mutable state needs actor isolation
- **Use isolated conformances** instead of `nonisolated` workarounds or `@Sendable` wrappers
- **Migrate incrementally** — enable features one at a time in build settings

## Anti-Patterns to Avoid

- Applying `@concurrent` to every async function (most don't need background execution)
- Using `nonisolated` to suppress compiler errors without understanding isolation
- Keeping legacy `DispatchQueue` patterns when actors provide the same safety
- Fighting the compiler — if it reports a data race, the code has a real concurrency issue
- Assuming all async code runs in the background (Swift 6.2 default: stays on calling actor)

## When to Use

- All new Swift 6.2+ projects (Approachable Concurrency is the recommended default)
- Migrating existing apps from Swift 5.x or 6.0/6.1 concurrency
- Resolving data-race safety compiler errors during Xcode 26 adoption
- Building MainActor-centric app architectures (most UI apps)
- Performance optimization — offloading specific heavy computations to background
