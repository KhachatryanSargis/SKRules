---
description: Diagnose and fix Swift/Xcode build errors. Analyzes compiler output, resolves dependency issues, and fixes type errors incrementally.
argument-hint: [error message or "all" to scan full build output]
---

# Build Fix Command

Diagnose and fix iOS/Swift build errors systematically.

## Usage

```
/build-fix                    # Run full build, analyze all errors
/build-fix "Cannot find type"  # Fix a specific error pattern
```

## Workflow

### 1. Detect Build System

| Marker | Build System | Build Command |
|--------|-------------|---------------|
| `Package.swift` | SPM | `swift build` |
| `.xcodeproj` | Xcode project | `xcodebuild build -scheme <scheme>` |
| `.xcworkspace` | Xcode workspace | `xcodebuild build -workspace <name> -scheme <scheme>` |
| `Podfile` | CocoaPods | `pod install && xcodebuild build -workspace <name> -scheme <scheme>` |

```bash
# Detect available schemes
xcodebuild -list 2>/dev/null || swift package describe 2>/dev/null
```

### 2. Run Build and Capture Errors

```bash
# SPM
swift build 2>&1 | tee /tmp/build-output.txt

# Xcode
xcodebuild build \
  -scheme MyApp \
  -destination "platform=iOS Simulator,name=$SIMULATOR" \
  2>&1 | tee /tmp/build-output.txt
```

### 3. Categorize Errors

Process errors in this priority order:

| Priority | Error Type | Examples |
|----------|-----------|----------|
| 1 | **Dependency resolution** | SPM version conflicts, missing packages, CocoaPods integration issues |
| 2 | **Module import ambiguity** | `Ambiguous module import`, CocoaPods + SPM mix conflicts |
| 3 | **Missing modules** | `No such module 'ModuleName'` |
| 4 | **Bridging header issues** | `Bridging header does not contain valid imports`, Objective-C interop failures |
| 5 | **Type errors** | `Cannot find type 'X' in scope`, `Cannot convert` |
| 6 | **Macro expansion errors** | `Macro not recognized` (Swift 5.9+), macro compilation failures |
| 7 | **Protocol conformance** | `Type does not conform to protocol` |
| 8 | **Resource bundle errors** | Missing assets, localization files not found in asset catalog |
| 9 | **Concurrency** | `Sending 'x' risks data races`, `non-sendable type` |
| 10 | **Deprecation/availability** | `'X' is only available in iOS 17 or newer` |

### 4. Fix Incrementally

**CRITICAL**: Fix one category at a time, rebuild between each.

```
Fix dependency errors → rebuild
  Fix missing modules → rebuild
    Fix type errors → rebuild
      Fix conformance errors → rebuild
        Fix concurrency warnings → rebuild
```

### 5. Fix Using Standard Patterns

Apply the appropriate fix for each error category. Claude already knows Swift/Xcode fix patterns — consult `rules/code-style.md` and `rules/architecture.md` for project-specific conventions.

Key reminders:
- **SPM resolution**: `swift package resolve && swift package clean && swift build`
- **CocoaPods**: Always build from `.xcworkspace`, not `.xcodeproj`
- **No simulator**: Fall back to `generic/platform=iOS` or `swift build`

### 6. Verify Fix

```bash
# Full clean build to confirm
swift build 2>&1 | grep -E "error:|Build complete"

# Run tests to check nothing broke
swift test 2>&1 | tail -5
```

## Output Format

```
## Build Fix Report

### Initial State
- Build system: SPM
- Errors: 8 across 4 files
- Warnings: 3

### Fixes Applied
1. ✅ Added missing `import CoreData` in `PersistenceController.swift`
2. ✅ Fixed `UserProfile` Sendable conformance — made all stored properties let
3. ✅ Updated `fetchItems()` signature to async throws
4. ✅ Added #available check for iOS 17 symbol effects

### Final State
- ✅ `swift build` succeeds
- ✅ `swift test` passes (42/42)
- Remaining warnings: 1 (deprecation in third-party dependency)
```
