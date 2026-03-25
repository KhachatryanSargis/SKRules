# Swift Code Style Guide

> **Scope:** Naming conventions, formatting, concurrency patterns, error handling, and Swift 6+ style guidelines
> **References:** [architecture.md](architecture.md), [git-workflow.md](git-workflow.md)

## Core Rules

- **MUST** — Use `UpperCamelCase` for types and protocols; `lowerCamelCase` for everything else.
- **MUST** — Strive to compile without warnings. Warnings often indicate correctness issues.
- **MUST** — Prefer immutability: Use `let` by default, only `var` when reassignment is required.
- **MUST** — Use explicit error handling; never silently swallow errors. Use typed throws (Swift 6+).
- **SHOULD** — Keep functions under 50 lines; keep files under 800 lines.
- **SHOULD** — Use `private` by default; only expose what's needed.
- **SHOULD** — Use structured concurrency: `async let`, `TaskGroup`, prefer over bare `Task {}`.

## Naming Conventions

**Type Names:** `UpperCamelCase`
- Classes, structs, enums, protocols
- Capability protocols: end in -able, -ible, -ing

**Variable and Function Names:** `lowerCamelCase`
- Variables, functions, properties
- Boolean properties read like assertions: `isEnabled`, `hasCompleted`, `canDelete`

## Formatting

- Indentation: 4 spaces
- Line length: 120 characters (configure SwiftLint `line_length`)
- Break long signatures at logical points

## `guard` vs `if let`

- **MUST** use `guard let` for early exit when the unwrapped value is needed in the remaining scope
- **MUST** use `if let` when work with the unwrapped value is self-contained within the branch
- **MUST NOT** use `guard` without an early exit (`return`, `throw`, `continue`, `break`)

```swift
// ✅ guard: value needed for the rest of the function
guard let user = session.currentUser else { return }
loadProfile(for: user)

// ✅ if let: value only needed inside the branch
if let cached = cache.get(key) {
    return cached
}
```

## Access Control

- **MUST** default to `private`; only expose what's needed
- Use `final` on classes unless designed for inheritance

## Trailing Closures

- **MUST** use trailing closure syntax when the final argument is a single closure
- **MUST NOT** use trailing closure syntax when there are multiple closure arguments — use labeled arguments for clarity
- **MUST NOT** use trailing closure syntax when the closure's purpose is unclear without the label

```swift
// ✅ Single closure — trailing syntax
users.filter { $0.isActive }

// ✅ Multiple closures — labeled arguments for clarity
withAnimation(.easeInOut(duration: 0.3)) {
    isExpanded = true
}

Task {
    let (data, response) = try await URLSession.shared.data(
        for: request,
        delegate: nil
    )
}

// ❌ Trailing closure when purpose is unclear without the label
Button(action: { viewModel.submit() }, label: { Text("Submit") })
// ✅ Trailing closure is fine here — purpose is obvious
Button("Submit") { viewModel.submit() }
```

## Immutability

- Prefer `let` over `var`
- Use struct with value semantics
- Use immutable collections: `let users: [User] = [...]`

## Error Handling

Use typed throws (Swift 6+) for precise error types **within module boundaries**:

```swift
enum LoadError: Error {
case fileNotFound(path: String)
case decodingFailed(underlying: Error)
}

func load(id: String) throws(LoadError) -> Item {
// Throw .fileNotFound(path: path) or .decodingFailed(underlying: error)
}
```

- **SHOULD** use typed throws (`throws(MyError)`) for internal/module-private functions where callers benefit from exhaustive `catch`
- **SHOULD** use untyped throws (`throws`) for public API surfaces — typed throws locks callers into a specific error type and doesn't compose well across module boundaries (only a single error type is supported)
- **MUST NOT** use `throws(any Error)` — it's equivalent to `throws` and adds noise

## Extension Organization

- **SHOULD** use separate extensions to organize protocol conformances and logical groupings
- **SHOULD** add a `// MARK: -` comment for each extension grouping

```swift
// MARK: - Core
struct Route: Identifiable, Hashable, Sendable {
    let id: UUID
    let name: String
    let coordinates: [Coordinate]
}

// MARK: - Codable
extension Route: Codable {
    enum CodingKeys: String, CodingKey { case id, name, coordinates }
}

// MARK: - Computed Properties
extension Route {
    var totalDistance: Double { /* ... */ }
    var isLoop: Bool { coordinates.first == coordinates.last }
}
```

## Swift 6 Strict Concurrency

Enable in Build Settings: Swift Compiler - Strict Concurrency → Treat Concurrency Warnings as Errors: YES

- **MUST** ensure all `Sendable` conformance is explicitly declared
- **SHOULD** prefer `async let` over `TaskGroup` when workload is known
- **SHOULD** use structured concurrency (`async let`, `TaskGroup`) over unstructured `Task {}`

See [architecture.md](architecture.md) for @MainActor guidance, actor patterns, and `nonisolated` usage.
