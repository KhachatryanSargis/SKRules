---
name: verification-loop
description: "A comprehensive verification system for Claude Code sessions."
---

# Verification Loop Skill

A comprehensive verification system for Claude Code sessions.

## When to Use

Invoke this skill:
- After completing a feature or significant code change
- Before creating a PR
- When you want to ensure quality gates pass
- After refactoring

## Verification Phases

### Phase 1: Build Verification
```bash
# Check if project builds
swift build 2>&1 | tail -20
```

If build fails, STOP and fix before continuing.

### Phase 2: Type Check
```bash
# Swift type checking (included in build)
swift build 2>&1 | grep -i "error\|warning" | head -30

# Alternative: Use Xcode's diagnostics
xcodebuild build -scheme MyApp 2>&1 | grep -i "error" | head -30
```

Report all type errors. Fix critical ones before continuing.

### Phase 3: Lint Check
```bash
# Swift linting
swiftlint 2>&1 | head -30

# Or install and use SwiftFormat
swiftformat --lint . 2>&1 | head -30
```

### Phase 4: Test Suite
```bash
# Run tests with coverage
swift test --enable-code-coverage 2>&1 | tail -50

# Check coverage threshold
# Target: 80% minimum
xcrun xccov view --report .build/coverage.profdata
```

Report:
- Total tests: X
- Passed: X
- Failed: X
- Coverage: X%

### Phase 5: Security Scan
```bash
# Check for hardcoded secrets
grep -rn "sk-\|api_key\|password" --include="*.swift" . 2>/dev/null | head -10

# Check for debugging prints left in code
grep -rn "print(\|debugPrint(" --include="*.swift" Sources/ 2>/dev/null | head -10

# Check for TODO/FIXME that might be security-related
grep -rn "TODO.*secret\|FIXME.*auth\|HACK.*security" --include="*.swift" . 2>/dev/null | head -10
```

### Phase 6: Diff Review
```bash
# Show what changed
git diff --stat
git diff HEAD~1 --name-only
```

Review each changed file for:
- Unintended changes
- Missing error handling
- Potential edge cases

## Output Format

After running all phases, produce a verification report:

```
VERIFICATION REPORT
==================

Build:     [PASS/FAIL]
Types:     [PASS/FAIL] (X errors)
Lint:      [PASS/FAIL] (X warnings)
Tests:     [PASS/FAIL] (X/Y passed, Z% coverage)
Security:  [PASS/FAIL] (X issues)
Diff:      [X files changed]

Overall:   [READY/NOT READY] for PR

Issues to Fix:
1. ...
2. ...
```

## Continuous Mode

For long sessions, run verification every 15 minutes or after major changes:

```markdown
Set a mental checkpoint:
- After completing each function
- After finishing a component
- Before moving to next task

Run: /verify
```

## Integration with Hooks

This skill complements PostToolUse hooks but provides deeper verification.
Hooks catch issues immediately; this skill provides comprehensive review.
