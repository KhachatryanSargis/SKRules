---
description: Run iOS verification pipeline — build, lint, test, and security checks. Delegates to the verification-loop skill.
argument-hint: ["quick" | "full" | "pre-commit", blank = quick]
---

# Verify Command

Run the iOS verification pipeline to confirm code is ready.

## Usage

```
/verify              # Quick: build + test
/verify quick        # Same as above
/verify full         # Build + lint + test + security scan
/verify pre-commit   # Minimal: build + lint (fast feedback)
```

## Verification Levels

### Quick (default)

```bash
swift build 2>&1
swift test 2>&1
```

Pass criteria: zero errors, all tests green.

### Pre-commit

```bash
swift build 2>&1
swiftlint --strict 2>&1
swift-format lint --recursive Sources/ Tests/ 2>&1
```

Pass criteria: zero errors, zero lint violations.

### Full

#### Step 1 — Build

Detect project type and build accordingly. **Always detect the simulator dynamically** — never hardcode a device name.

**Multi-scheme projects**: If multiple schemes exist, use the one matching the project name. Override with `QUALITY_GATE_SCHEME` env var if needed. If ambiguous, list schemes and ask the user.

```bash
# Detect available simulator (prefer recent iPhones, fallback gracefully)
SIMULATOR=$(xcrun simctl list devices available 2>/dev/null | grep "iPhone" | grep -v "unavailable" | tail -1 | sed 's/(.*//;s/^[[:space:]]*//' | xargs)
if [ -z "$SIMULATOR" ]; then
    echo "WARNING: No iPhone simulator found. Falling back to SPM build or generic destination." >&2
fi
```

- If `*.xcodeproj` or `*.xcworkspace` exists → use `xcodebuild build -scheme <scheme> -destination "platform=iOS Simulator,name=$SIMULATOR" -hideShellScriptEnvironment`
- If only `Package.swift` exists → use `swift build`
- If both exist → run both (xcodebuild for app target, swift build for package targets)

```bash
# Example for SPM package
swift build 2>&1

# Example for Xcode app project
xcodebuild build -scheme MyApp -destination "platform=iOS Simulator,name=$SIMULATOR" -hideShellScriptEnvironment 2>&1
```

#### Step 2 — Lint

```bash
swiftlint --strict 2>&1
swift-format lint --recursive Sources/ Tests/ 2>&1
```

#### Step 3 — Tests with coverage

```bash
# For SPM packages
swift test --enable-code-coverage 2>&1
xcrun llvm-cov report -instr-profile=.build/debug/codecov/default.profdata .build/debug/*Tests.xctest/Contents/MacOS/*Tests

# For Xcode projects
xcodebuild test -scheme MyApp -destination "platform=iOS Simulator,name=$SIMULATOR" -enableCodeCoverage YES 2>&1
```

#### Step 4 — Security scan

```bash
# Secrets detection (case-insensitive, covers both plist formats)
grep -rni "UserDefaults.*\(token\|password\|secret\|apiKey\)" --include="*.swift" Sources/
grep -rni "NSAllowsArbitraryLoads" --include="*.plist" --include="*.xml" .
grep -rni "\(api_key\|api_secret\|apikey\|auth_token\|bearer\|client_secret\|private_key\)" --include="*.swift" --include="*.plist" Sources/

# Exclude #if DEBUG blocks from print detection
grep -rn "print(\|debugPrint(" --include="*.swift" Sources/ | grep -v "#if DEBUG" | grep -v "// debug" | grep -v "Tests/"

# Check ALL ATS-related keys:
# - NSAllowsArbitraryLoads
# - NSExceptionDomains (review each domain exception)
# - NSAllowsLocalNetworking
# - NSAllowsArbitraryLoadsInMedia
# - NSAllowsArbitraryLoadsInWebContent
grep -rni "\(NSAllowsArbitraryLoads\|NSExceptionDomains\|NSAllowsLocalNetworking\|NSAllowsArbitraryLoadsInMedia\|NSAllowsArbitraryLoadsInWebContent\)" --include="*.plist" --include="*.xml" .
```

#### Step 5 — Validation

- **Privacy manifest (iOS 17+)**: If targeting iOS 17 or later, verify `PrivacyInfo.xcprivacy` exists
- **Asset catalog completeness**: Ensure AppIcon is present in Assets.xcassets
- **Info.plist required keys**: If xcodeproj exists, verify required keys (CFBundleVersion, CFBundleIdentifier, etc.)

#### Step 6 — Diff review

```bash
git diff --staged --stat
```

Pass criteria: all checks green, coverage ≥80% for business logic / ≥70% for networking (SwiftUI views best-effort), no security findings.

## Output Format

```
## Verification Report

| Check | Status | Details |
|-------|--------|---------|
| Build | ✅ PASS | 0 errors, 2 warnings |
| Lint | ✅ PASS | 0 violations |
| Tests | ✅ PASS | 87/87 passed |
| Coverage | ✅ PASS | 84% line coverage |
| Security | ✅ PASS | No findings |

**Verdict: PASS** — Ready to commit.
```

## Integration

```
/verify quick → /code-review → /prp-commit → /prp-pr
```

For detailed verification patterns, see `skill: verification-loop`.
