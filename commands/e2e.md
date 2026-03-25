---
description: Run XCUITest end-to-end tests for critical user flows. Invokes the e2e-runner agent.
argument-hint: [test class or flow name, blank = run all UI tests]
---

# E2E Test Command

Invoke the **e2e-runner** agent for end-to-end UI testing with XCUITest.

## Usage

```
/e2e                              # Run all UI tests
/e2e OnboardingFlowTests          # Run specific test class
/e2e "checkout flow"              # Describe a flow to test
```

## What It Does

1. Identifies critical user flows by priority (P0: auth, core value → P2: settings, navigation)
2. Writes or runs XCUITest suites using `xcodebuild test`
3. Analyzes failures from `.xcresult` bundles
4. Provides reliability improvements (waitForExistence, launch arguments, accessibility identifiers)

## Quick Run

```bash
xcodebuild test \
  -scheme MyApp \
  -destination 'platform=iOS Simulator,name=<SIMULATOR>,OS=latest' \
  -only-testing:MyAppUITests
```

## Key Reminders

- **Simulator selection**: Detect dynamically with `xcrun simctl list devices available` — never hardcode device names
- **Accessibility identifiers**: Required on all interactive elements for test stability
- **System dialogs**: Register `addUIInterruptionMonitor` BEFORE `app.launch()`, then `app.tap()` to trigger
- **Multi-device**: Test on smallest (iPhone SE) and largest (Pro Max) screens

For detailed XCUITest patterns, reliability techniques, and flakiness debugging, the **e2e-runner agent** provides comprehensive guidance.
