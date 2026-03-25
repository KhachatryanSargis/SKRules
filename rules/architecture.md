# Architecture

> **Scope:** Clean Architecture with MVVM, layers, entities, Use Cases, Repositories, DI, SPM structure, @MainActor, @Observable, error domains, dependency vetting
> **References:** [code-style.md](code-style.md), [testing.md](testing.md)

## Dependencies & Reuse

- **MUST** verify API availability for the project's minimum iOS deployment target before using any new framework API
- **SHOULD** check license compatibility (MIT, Apache 2.0 preferred) before adding third-party dependencies
- **SHOULD** prefer actively maintained packages with recent commits and Swift 6 concurrency support

## Clean Architecture + MVVM

Data flows one way: **View → ViewModel → Use Case → Repository → Data Source**. Dependencies point inward: **Presentation → Domain ← Data**.

### Three Layers

| Layer | Contains | Depends On | Never Depends On |
|-------|----------|------------|------------------|
| **Domain** | Entities, Use Cases, Repository protocols | Nothing (pure Swift, no frameworks) | Data, Presentation, UIKit, SwiftUI |
| **Data** | Repository implementations, DTOs, API clients, persistence | Domain (to conform to protocols) | Presentation |
| **Presentation** | Views, ViewModels | Domain (Use Cases only) | Data |

- **MUST** keep Domain layer framework-free — no `import UIKit`, `import SwiftUI`, or third-party frameworks
- **MUST** use Use Cases as the only interface between ViewModels and data
- **MUST NOT** inject Repositories directly into ViewModels — always go through a Use Case
- **MUST NOT** import Data layer types in Presentation layer
- **MUST** define Repository protocols in Domain; implementations in Data
- **MUST** map DTOs to Domain Entities at the Repository boundary
- **MUST NOT** leak DTOs, API response models, or persistence models into Domain or Presentation

```swift
// ✅ ViewModel depends on Use Case only
@Observable @MainActor
final class BookmarkListViewModel {
var bookmarks: [Bookmark] = []
var error: BookmarkError?
private let fetchBookmarks: FetchBookmarksUseCase
private let deleteBookmark: DeleteBookmarkUseCase

init(fetchBookmarks: FetchBookmarksUseCase, deleteBookmark: DeleteBookmarkUseCase) {
self.fetchBookmarks = fetchBookmarks
self.deleteBookmark = deleteBookmark
}

func onAppear() async {
do {
bookmarks = try await fetchBookmarks.execute()
} catch {
self.error = error as? BookmarkError
}
}

func didSwipeDelete(_ bookmark: Bookmark) async {
do {
try await deleteBookmark.execute(id: bookmark.id)
bookmarks.removeAll { $0.id == bookmark.id }
} catch {
self.error = error as? BookmarkError
}
}
}

// ❌ ViewModel uses Repository directly — violates layer boundary
final class BookmarkListViewModel {
private let repository: BookmarkRepository  // WRONG: skips Use Case layer
}
```

## Entities

Domain objects representing core business concepts. Pure value types.

```swift
// Domain layer — no framework imports
struct Bookmark: Identifiable, Hashable, Sendable {
let id: UUID
let title: String
let url: URL
let createdAt: Date
}
```

- **MUST** be `Sendable`, `Equatable`, and `Hashable` (Hashable implies Equatable; required for SwiftUI `ForEach`/`List` identity and `Set`/`Dictionary` usage)
- **MUST** use value types (`struct`, `enum`) — no `class`
- **MUST NOT** contain persistence annotations (`@Model`, `@Attribute`) or Codable for API shapes

## Use Cases (Interactors)

Single-responsibility units of business logic. The only gateway ViewModels use to access data.

```swift
protocol FetchBookmarksUseCase: Sendable {
func execute() async throws -> [Bookmark]
}

final class FetchBookmarksUseCaseImpl: FetchBookmarksUseCase {
private let repository: BookmarkRepository
init(repository: BookmarkRepository) { self.repository = repository }

func execute() async throws -> [Bookmark] {
try await repository.fetchAll()
}
}
```

- **MUST** define one `execute()` method per Use Case (single responsibility)
- **MUST** define as protocol + implementation for testability
- **MUST** inject Repository protocols, never concrete implementations
- **SHOULD** name as verb phrase: `FetchBookmarksUseCase`, `SyncUserSessionUseCase`, `DeleteExpiredTokensUseCase`
- **MUST** always use a Use Case between ViewModel and Repository — even if the Use Case only forwards. This keeps the layering uniform and provides a seam for future business logic without touching the ViewModel
- **SHOULD** add business logic (validation, transformation, combining sources) in the Use Case when applicable

## Repository Protocols

Defined as protocols in Domain. Implementation lives in Data layer modules.

```swift
// Domain layer — protocol only
protocol BookmarkRepository: Sendable {
func fetchAll() async throws -> [Bookmark]
func save(_ bookmark: Bookmark) async throws
func delete(id: UUID) async throws
}
```

- **MUST** define protocol in Domain layer
- **MUST** place implementation in Data layer
- **MUST NOT** specify storage mechanism in the protocol (no CoreData, no UserDefaults, no API details)

## @MainActor Guidance (Canonical)

- **MUST** mark UI-driving ViewModels with `@MainActor` at class level
- **MUST** use `nonisolated` for CPU-heavy methods that don't touch @MainActor state (for Swift 6.2+ guidance on `@concurrent`, see `skills/swift-concurrency-6-2/`)
- **MUST NOT** annotate individual methods with `@MainActor` — mark the class once
- **SHOULD** comment `nonisolated` methods explaining why they're safe off-actor

```swift
@Observable @MainActor
final class SearchViewModel {
var results: [SearchResult] = []

nonisolated func rankResults(_ items: [SearchResult], query: String) -> [SearchResult] {
// CPU-intensive scoring — no @MainActor state accessed
items.sorted { $0.relevanceScore(for: query) > $1.relevanceScore(for: query) }
}
}
```

## @Observable vs ObservableObject (Canonical)

| Target | Framework | Pattern |
|--------|-----------|---------|
| iOS 17+ | @Observable | `@Observable @MainActor final class VM { var state: State }` |
| iOS 16 | ObservableObject | `@MainActor final class VM: ObservableObject { @Published var state }` |

- **MUST** prefer `@Observable` for new code (iOS 17+)
- **MUST NOT** mix `@Observable` and `ObservableObject` in the same feature

### @Observable Ownership in Views

| Scenario | Property Wrapper | Notes |
|----------|-----------------|-------|
| View **creates** the ViewModel | `@State` | View owns lifecycle; survives re-renders |
| View **receives** the ViewModel from parent | Plain `let` / `var` property | No wrapper needed; @Observable tracks access automatically |
| View needs **two-way binding** to ViewModel | `@Bindable var vm` | Use when passing `$vm.property` to SwiftUI controls |
| ViewModel shared via environment | `@Environment(MyViewModel.self)` | Retrieve, then wrap with `@Bindable` locally if bindings needed |

```swift
// ✅ Parent creates, child receives
struct ParentView: View {
@State private var vm = BookmarkListViewModel(/* injected deps */)
var body: some View { ChildView(vm: vm) }
}

struct ChildView: View {
@Bindable var vm: BookmarkListViewModel  // @Bindable for $vm.searchText bindings
var body: some View { TextField("Search", text: $vm.searchText) }
}
```

- **MUST NOT** use `@StateObject` or `@ObservedObject` with `@Observable` classes
- **MUST** use `@State` (not `@StateObject`) when a view owns an `@Observable` object's lifecycle
- **MUST** use `@Bindable` when the view needs `$`-bindings to an `@Observable` object it does not own

## Dependency Injection

- **MUST** use constructor injection for all dependencies
- **MUST** define protocols for all injectable dependencies
- **MUST** wire dependencies at a single Composition Root (app entry point)
- **MUST NOT** use singletons (`static let shared`) or service locators
- **MUST NOT** let ViewModels create their own dependencies
- **SHOULD** use factory methods for transient objects (ViewModels, per-screen dependencies)

## Feature-Based File Structure

Within a single app or module, organize by feature then by layer:

```
Sources/Features/
├── Bookmark/
│   ├── Domain/         # Entities, Use Cases, Repository protocol
│   ├── Data/           # Repository impl, DTOs
│   └── Presentation/   # BookmarkListView, BookmarkListViewModel
├── UserSession/
│   ├── Domain/
│   ├── Data/
│   └── Presentation/
└── Shared/
└── Domain/         # Cross-feature entities (User, AppError)
```

- **MUST** organize by feature, then by layer within feature
- **MUST** keep Domain free of framework imports
- **SHOULD** promote shared entities to `Shared/Domain/` when used across ≥2 features

## SPM Module Structure

Every feature gets `Domain` + `Data` packages. Presentation lives in the app or a Presentation package.

```
Packages/
├── Core/                  # Shared infrastructure protocols
├── Navigation/            # Navigation coordination
├── Networking/            # Networking layer
├── Storage/               # Persistence layer
├── BookmarkDomain/        # Entities, Use Case protocols + impls, Repository protocols
├── BookmarkData/          # Repository impls, DTOs (depends on Networking, Storage)
├── UserSessionDomain/     # UserSession entities, auth Use Cases
├── UserSessionData/       # Auth API client, token storage
├── SharedDomain/          # Cross-feature entities (User, AppError)
└── App/                   # Composition Root, Views, ViewModels
```

- **MUST** suffix feature packages with `Domain` or `Data` to make layer explicit
- **MUST** enforce dependency direction in `Package.swift`: `Data` depends on `Domain`, never reverse
- **MUST** Data packages depend on infrastructure packages (Networking, Storage) — not the reverse
- **MUST NOT** create cross-feature dependencies between Data packages
- **SHOULD** create `SharedDomain` for entities used across ≥2 features
- **SHOULD** keep feature packages independent — communicate through Domain protocols

## Actor Pattern

- **MUST** use actors for shared mutable state instead of locks or dispatch queues
- **MUST** ensure all generic constraints are `Sendable`
- **MUST** treat every `await` inside an actor as a potential state-change point (reentrancy)
- **MUST** re-check invariants after every `await` — actor state may have changed
- **SHOULD** minimize suspension points (awaits) within a single actor method to reduce reentrancy risk

```swift
actor Cache<Key: Hashable & Sendable, Value: Sendable> {
private var storage: [Key: Value] = [:]
func get(_ key: Key) -> Value? { storage[key] }
func set(_ key: Key, value: Value) { storage[key] = value }
}
```

### nonisolated Access on Actors

- **MUST** mark read-only computed properties that don't access mutable state as `nonisolated` to avoid unnecessary async access
- **MUST NOT** mark stored `var` properties as `nonisolated` — only `let` constants can be `nonisolated`

```swift
actor SessionManager {
let sessionID: UUID          // immutable — implicitly nonisolated
private var tokens: [String] = []

nonisolated var description: String {  // ✅ only reads let constant
"Session(\(sessionID))"
}
}
```

### @unchecked Sendable

- **MUST NOT** use `@unchecked Sendable` without a code-review comment explaining why it's safe
- **SHOULD** exhaust alternatives first: actors, `Sendable` structs, value types
- **MAY** use `@unchecked Sendable` for types with internal synchronization (e.g., wrapping `os_unfair_lock`, `NSLock`) that the compiler cannot verify

```swift
// ✅ Justified: internal lock-based synchronization
final class AtomicCounter: @unchecked Sendable {
// SAFETY: all access to `count` is guarded by `lock`
private let lock = NSLock()
private var count = 0
func increment() { lock.withLock { count += 1 } }
}
```

## Error Domains

- **MUST** define typed errors per layer (Domain errors, Data errors)
- **MUST** map low-level errors to domain errors at layer boundaries
- **MUST NOT** leak infrastructure error types (URLError, SQLiteError) into Domain

```swift
// Domain layer
enum BookmarkError: Error, Sendable {
case notFound(id: UUID)
case saveFailed(underlying: Error)
case unauthorized
}

// Data layer catches URLError, SQLiteError etc. → throws BookmarkError
```
