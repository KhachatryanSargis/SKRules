---
description: Run a comprehensive code review using the code-reviewer agent. Checks security, quality, SwiftUI patterns, and performance.
argument-hint: [file or directory to review, blank = review all staged/unstaged changes]
---

# Code Review Command

Invoke the **code-reviewer** agent for a thorough review of code changes.

## Usage

```
/code-review                     # Review all staged + unstaged changes
/code-review Sources/Auth/       # Review a specific directory
/code-review LoginViewModel.swift # Review a specific file
```

## What Gets Reviewed

The code-reviewer agent evaluates across these categories (from CRITICAL to LOW):

1. **Security (CRITICAL)** — Hardcoded secrets, injection, auth bypasses, Keychain misuse
2. **Code Quality (HIGH)** — Large functions, deep nesting, missing error handling, dead code
3. **SwiftUI Patterns (HIGH)** — State management, task lifecycle, ForEach identifiers
4. **Architecture (HIGH)** — Layer violations, ViewModel bloat, missing use cases, coordinator leaks
5. **Performance (MEDIUM)** — Inefficient algorithms, main thread blocking, unnecessary recomputation
6. **Best Practices (LOW)** — TODOs without tickets, missing docs, naming, magic numbers

## Workflow

1. Invoke the `code-reviewer` agent
2. Agent gathers context via `git diff`
3. Agent reads full files for surrounding context
4. Agent applies review checklist with confidence filtering (>80% confidence)
5. Agent reports findings organized by severity

## Approval Criteria

- **Approve**: No CRITICAL or HIGH issues
- **Warning**: HIGH issues only (can merge with caution)
- **Block**: Any CRITICAL issue — must fix before merge

## Integration

Use `/code-review` at these points in the workflow:

```
/plan → /code-review → /prp-commit → /prp-pr
```

For adversarial dual-review with external models, use `/santa-loop` instead.
