# Testing Guidelines

> **Scope:** Unit testing, test architecture, mocking, coverage, Swift Testing patterns | **References:** [architecture.md](architecture.md), [code-style.md](code-style.md)

## Coverage Targets

| Layer | Target | Notes |
|-------|--------|-------|
| Business logic / ViewModels | 80%+ | Test all state transitions and error paths |
| Networking / Repositories | 70%+ | Mock external dependencies; test error handling |
| SwiftUI Views | Best-effort | Snapshot tests where valuable |
| Model / Data structures | 70%+ | Test initialization, validation, transformation |

- **MUST NOT** inflate coverage by testing trivial code (simple getters, one-liners)
- **SHOULD** measure coverage via `swift test --enable-code-coverage` (SPM) or Xcode's scheme coverage report (Product → Scheme → Edit Scheme → Test → Code Coverage)

## Swift Testing (Modern Standard)

- **MUST** use Swift Testing (`import Testing`) for new tests
- **SHOULD** migrate XCTest suites incrementally to Swift Testing

### Assertions: `#expect` vs `#require`

| Macro | Behavior | Use When |
|-------|----------|----------|
| `#expect(condition)` | Records failure, test **continues** | Checking outcomes — multiple expects per test is fine |
| `try #require(expr)` | Records failure, test **stops** (throws) | Unwrapping optionals or preconditions that later assertions depend on |

- **MUST** use `try #require()` instead of `guard` + `Issue.record` + `return` for optional unwrapping
- **MUST NOT** use XCTest assertions (`XCTAssertEqual`, `XCTAssertNil`, etc.) in Swift Testing suites

```swift
@Suite("UserStorage Tests")
struct UserStorageTests {
    @Test("saves and loads user correctly")
    func saveAndLoad() throws {
        let testDefaults = try #require(UserDefaults(suiteName: "test"))
        let storage = UserDefaultsStorage(defaults: testDefaults)
        try storage.save("token", forKey: .authToken)
        #expect(try storage.load(forKey: .authToken) == "token")
    }
}
```

### Parameterized Tests

- **SHOULD** use `@Test(arguments:)` to test the same behavior across multiple inputs instead of duplicating test methods

```swift
@Test("rejects invalid email formats", arguments: [
    "", "missing-at.com", "@no-local.com", "spaces in@email.com"
])
func rejectsInvalidEmail(input: String) {
    #expect(EmailValidator.isValid(input) == false)
}
```

### Async Confirmation

- **MUST** use `confirmation()` to test async callbacks, delegate calls, or notifications instead of raw expectations with sleep/timeout

```swift
@Test("notifies delegate on sync completion")
func notifiesDelegate() async {
    await confirmation { confirm in
        let service = SyncService(onComplete: { confirm() })
        await service.sync()
    }
}
```

## FIDFS Principles (Fast, Independent, Deterministic, Focused, Self-Validating)

1. **Fast** — Each test < 1 second (no network calls, use mocks)
2. **Independent** — No shared mutable state; no test ordering dependencies
3. **Deterministic** — Same input always produces same output; no flaky timing assumptions
4. **Focused** — One behavior per test; split error cases into separate tests
5. **Self-Validating** — Tests assert outcomes explicitly; no manual log inspection to determine pass/fail

## Test Naming

**Swift Testing:** The `@Test("...")` string is the human-readable display name; the method name should be concise and readable.

- **MUST** provide a descriptive `@Test("description")` string that reads as a behavior statement
- **SHOULD** use concise method names in `lowerCamelCase`: `validLogin()`, `emptyCartTotal()`
- Examples:
  - `@Test("returns token with valid credentials") func validLogin()`
  - `@Test("returns zero for empty items") func emptyCartTotal()`

**XCTest (legacy):** Method name is the only identifier — use underscore convention.

- **MUST** use `function_scenario_expectedResult()` format
- Examples: `test_login_withValidCredentials_returnsToken()`, `test_calculateTotal_withEmptyItems_returnsZero()`

## Mocking Pattern

Two approaches for `Sendable`-compliant mocks — choose based on test ergonomics:

**Actor mock** — compiler-guaranteed safe, but every property access requires `await`:

```swift
protocol PaymentServiceProtocol: Sendable {
    func processPayment(_ amount: Decimal) async throws -> PaymentResult
}

actor MockPaymentService: PaymentServiceProtocol {
    var processPaymentCalls: [Decimal] = []
    var mockResult: PaymentResult = PaymentResult(status: .succeeded)

    func processPayment(_ amount: Decimal) async throws -> PaymentResult {
        processPaymentCalls.append(amount)
        return mockResult
    }
}

// Usage: assertions need await
#expect(await mock.processPaymentCalls.count == 1)
```

**Class mock with `@unchecked Sendable`** — simpler assertions, safe because tests are single-threaded:

```swift
final class MockPaymentService: PaymentServiceProtocol, @unchecked Sendable {
    // SAFETY: only accessed from a single test at a time
    var processPaymentCalls: [Decimal] = []
    var mockResult: PaymentResult = PaymentResult(status: .succeeded)

    func processPayment(_ amount: Decimal) async throws -> PaymentResult {
        processPaymentCalls.append(amount)
        return mockResult
    }
}

// Usage: no await needed for assertions
#expect(mock.processPaymentCalls.count == 1)
```

- **SHOULD** prefer actor mocks when the mock is shared across concurrent tasks in a test
- **MAY** use `@unchecked Sendable` class mocks for simpler test ergonomics when access is single-threaded
- **MUST** add a `// SAFETY:` comment when using `@unchecked Sendable` on mocks

## What to Test

- Business logic, algorithms, transformations
- Model validation logic
- State transitions in ViewModels
- Error handling paths (test both success and error cases)
- Edge cases and boundary conditions
- Parsing, formatters, URL manipulation

## What NOT to Test

- **MUST NOT** test private implementation details — test observable behavior
- **MUST NOT** test Apple framework internals or trivial standard library code
- **SHOULD NOT** test trivial getters/setters or auto-generated code

## TDD Workflow

1. **RED** — Write test first; it must fail for the intended reason (not unrelated syntax/setup errors). A test that was only written but not compiled and executed does not count as RED. Do not edit production code until RED is confirmed.
2. **GREEN** — Write minimal implementation to make the test pass. Rerun the same test target and confirm it is now GREEN before proceeding.
3. **REFACTOR** — Improve code while keeping tests green; verify coverage ≥ 80%

### Git Checkpoints During TDD

- **MUST** create a checkpoint commit after each TDD stage when the repo is under Git
- **MUST NOT** squash or rewrite checkpoint commits until the workflow is complete
- **MUST** verify each checkpoint is on the current active branch and belongs to the current task
- Preferred compact workflow:
  - One commit for failing test (RED validated): `test: add reproducer for <feature or bug>`
  - One commit for minimal fix (GREEN validated): `fix: <feature or bug>`
  - One optional commit for refactor: `refactor: clean up after <feature or bug> implementation`

### E2E Tests (XCUITest)

XCUITest requires XCTest — this is the one place XCTest is still appropriate. All unit and integration tests **MUST** use Swift Testing.

```swift
import XCTest

final class MarketFlowUITests: XCTestCase {
    let app = XCUIApplication()

    override func setUpWithError() throws {
        continueAfterFailure = false
        app.launch()
    }

    func testUserCanSearchAndFilterMarkets() throws {
        app.tabBars.buttons["Markets"].tap()
        let searchField = app.searchFields["Search markets"]
        searchField.tap()
        searchField.typeText("election")

        let resultCard = app.staticTexts.containing(NSPredicate(
            format: "label CONTAINS[c] 'election'"
        )).firstMatch
        XCTAssertTrue(resultCard.waitForExistence(timeout: 5))
    }
}
```
