---
name: swiftui
description: SwiftUI dumb-view architecture, state management with @Observable, view composition, rendering performance, animations, and localization best practices.
---

# SwiftUI Best Practices

> **Scope:** Dumb-view architecture, state management, view composition, rendering performance, animations, localization | **See also:** `rules/architecture.md`, `skills/performance/`

> **iOS 17+ required** for `@Observable`, `@Bindable`, and the Observation framework. For iOS 16, use `ObservableObject` + `@Published` + `@StateObject` / `@ObservedObject`.

## Dumb-View Principle

Views are renderers. All logic, data transformation, formatting, and decisions belong in the ViewModel.

- **MUST** keep `body` free of logic — no `if/else` on raw data, no formatting, no computation
- **MUST** expose pre-formatted display strings from ViewModel (dates, currencies, counts)
- **MUST** expose every user action as a ViewModel method (`viewModel.didTapSave()`, not inline logic)
- **MUST** derive all conditional UI from ViewModel published state, not raw model inspection
- **MUST NOT** reference services, repositories, or network layers from Views

```swift
// ✅ View is a pure renderer
struct OrderView: View {
var viewModel: OrderViewModel

var body: some View {
VStack {
Text(viewModel.formattedTotal)        // pre-formatted in VM
Text(viewModel.deliveryDateDisplay)    // pre-formatted in VM
if viewModel.showsUrgentBadge {        // decision made in VM
UrgentBadge()
}
Button("Place Order", action: viewModel.placeOrder)
}
.task { await viewModel.onAppear() }
}
}

// ❌ View doing logic
var body: some View {
Text("$\(String(format: "%.2f", order.total))")  // formatting in view
if order.deliveryDate < Date() { UrgentBadge() }  // logic in view
Button("Place Order") { Task { try await service.place(order) } }  // service call in view
}
```

## State Wrappers

| Wrapper | Use Case |
|---------|----------|
| `@State` | Simple local view-owned value (toggle, text field input) |
| `@Binding` | Two-way connection to parent's state |
| `@Observable` class + `@State` | View-owned model with multiple properties |
| plain property | Read-only @Observable ViewModel passed from parent — no wrapper needed |
| `@Bindable` (iOS 17+) | Two-way binding to @Observable ViewModel properties via `$` |
| `@Environment` | System-provided values only (`\.colorScheme`, `\.accessibilityReduceMotion`). **MUST NOT** use for dependency injection — use constructor injection (see `rules/architecture.md`) |

See `rules/architecture.md` for @Observable vs ObservableObject and @MainActor patterns.

### @Observable ViewModel

Use `@Observable` (not `ObservableObject`) — the Observation framework provides granular property tracking. During `body` evaluation, SwiftUI tracks which properties your view reads and re-renders only when those specific properties change. This eliminates `objectWillChange` which notified ALL subscribers on ANY property change:

```swift
@Observable
final class ItemListViewModel {
    private(set) var items: [Item] = []
    private(set) var isLoading = false
    var searchText = ""

    private let repository: any ItemRepository

    init(repository: any ItemRepository = DefaultItemRepository()) {
        self.repository = repository
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        items = (try? await repository.fetchAll()) ?? []
    }
}
```

### View Consuming the ViewModel

```swift
struct ItemListView: View {
    @State private var viewModel: ItemListViewModel   // owned — use @State

    init(viewModel: ItemListViewModel = ItemListViewModel()) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        List(viewModel.items) { item in ItemRow(item: item) }
        .searchable(text: $viewModel.searchText)       // $binding via @Bindable-like access
        .overlay { if viewModel.isLoading { ProgressView() } }
        .task { await viewModel.load() }
    }
}
```

### @Bindable for Two-Way Bindings

Use `@Bindable` when a child view needs `$` bindings to an `@Observable` it doesn't own:

```swift
struct EditView: View {
    @Bindable var viewModel: EditViewModel   // not owned — parent passes it in

    var body: some View {
        Form {
            TextField("Name", text: $viewModel.name)
            Toggle("Active", isOn: $viewModel.isActive)
        }
    }
}
```

## Rendering Performance

SwiftUI re-evaluates `body` whenever a read dependency changes. Expensive bodies cause frame drops.

- **MUST** move all computation out of `body` — pre-compute in ViewModel or `.task`
- **MUST** break large views into small subviews (invalidation stays local to the changed subview)
- **MUST** use `LazyVStack`/`LazyHStack` inside `ScrollView` for large lists (views created on demand)
- **MUST** provide stable `id` in `ForEach` — unstable IDs cause full-list rebuild
- **MUST NOT** create `DateFormatter`, `NumberFormatter`, or any object inside `body` — initialize once in ViewModel
- **SHOULD** use `.equatable()` modifier or `Equatable` conformance to skip re-render when data is unchanged

For views with expensive bodies, conform to `Equatable` to skip unnecessary re-renders:

```swift
struct ExpensiveChartView: View, Equatable {
    let dataPoints: [DataPoint]

    static func == (lhs: Self, rhs: Self) -> Bool {
        lhs.dataPoints == rhs.dataPoints
    }

    var body: some View {
        // Complex chart rendering
    }
}
```

## View Composition

- **MUST** extract subviews into small focused structs — invalidation stays local to the changed subview
- **MUST** use `ViewModifier` for reusable styling (e.g. card backgrounds, shadow combos)
- **MUST NOT** use `AnyView` for type erasure — prefer `@ViewBuilder` or `Group` for conditional views
- **MUST NOT** create ViewModels as `@State` inside child views that don't own the data — pass from parent

## Animation Performance

Layout changes (`.frame`, `.padding`, `.offset` that changes layout) force the layout engine to recalculate the entire hierarchy. Transform-based properties are GPU-composited and skip layout entirely.

- **MUST** prefer transforms over layout changes for animations:
- `scaleEffect` instead of animating `.frame(width:height:)`
- `offset(x:y:)` (render transform) instead of `.padding` or `.position` changes
- `rotationEffect` instead of rebuilding rotated content
- `opacity` for fade-in/fade-out (GPU-composited)
- **MUST** respect Reduce Motion: `@Environment(\.accessibilityReduceMotion)`
- **MUST NOT** animate both layout and visual properties simultaneously (causes double-pass)
- **SHOULD** use `.drawingGroup()` for complex view hierarchies with layered effects (renders to Metal texture)
- **SHOULD** use `.contentTransition(.numericText())` for animating number changes without layout shift
- **SHOULD** disable animations on frequently-updating values (timers, progress bars): `.animation(.none, value: timerValue)`

```swift
// ✅ GPU-composited, no layout recalculation
CellView(item: item)
.scaleEffect(isAppearing ? 1.0 : 0.8)
.opacity(isAppearing ? 1.0 : 0)

// ❌ Layout recalculation on every frame
CellView(item: item)
.frame(width: isAppearing ? 200 : 160, height: isAppearing ? 80 : 64)
.padding(isAppearing ? 0 : 20)
```

## Visual Effect Costs

- **MUST NOT** use `.blur`, `.shadow`, `.mask` in scrolling lists — triggers expensive offscreen rendering
- **SHOULD** combine overlapping effects into a single `.overlay` or `.background`
- **SHOULD** use `.compositingGroup()` before applying effects to complex hierarchies

## .task over .onAppear

- **MUST** use `.task` for async work — auto-cancelled on disappear, prevents leaks
- **MUST NOT** wrap `Task {}` inside `.onAppear` (manual lifecycle, no auto-cancellation)

## Localization

- **MUST** use String Catalogs (`.xcstrings`, iOS 17+) — auto-extracted from `Text`
- **MUST** use `.leading`/`.trailing` not `.left`/`.right` (RTL support)
- **MUST** use system formatters for dates, numbers, currencies — never manual string concatenation
- **SHOULD** use Automatic Grammar Engine: `Text("^[\(count) item](inflect: true)")`

## Previews

- **MUST** use `#Preview` macro with inline mock data: `#Preview("Empty") { MyView(viewModel: VM(useCase: MockUseCase())) }`
- **MUST** cover key states: empty, loaded, error
