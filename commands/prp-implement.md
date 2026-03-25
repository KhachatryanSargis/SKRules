---
description: Execute an implementation plan with rigorous validation loops
argument-hint: <path/to/plan.md>
---

> Adapted from PRPs-agentic-eng by Wirasm. Part of the PRP workflow series.

# PRP Implement

### Setup (Auto-Create)
Before proceeding, ensure the PRP directory structure exists:
```bash
mkdir -p .claude/PRPs/prds .claude/PRPs/plans .claude/PRPs/reports .claude/PRPs/implementations
```
This is idempotent and safe to run every time.

Execute a plan file step-by-step with continuous validation. Every change is verified immediately — never accumulate broken state.

**Core Philosophy**: Validation loops catch mistakes early. Run checks after every change. Fix issues immediately.

**Golden Rule**: If a validation fails, fix it before moving on. Never accumulate broken state.

---

## Phase 0 — DETECT

### Package Manager Detection

| File Exists | Package Manager | Runner |
|---|---|---|
| `Package.swift` | SPM (Swift Package Manager) | `swift build` or `xcodebuild` |
| `Podfile` / `Podfile.lock` | CocoaPods | `pod install` |
| `.xcodeproj` | Xcode (native) | `xcodebuild` |
| `.xcworkspace` | Xcode workspace | `xcodebuild -workspace` |

### Validation Scripts

Check `Package.swift` for available targets and check Xcode build schemes:

```bash
# For Swift projects
cat Package.swift | grep -A 20 'targets'

# List available schemes
xcodebuild -list
```

Note available commands for: swift build, swift test, swift-format, swiftlint, xcodebuild.

---

## Phase 1 — LOAD

Read the plan file:

```bash
cat "$ARGUMENTS"
```

Extract these sections from the plan:
- **Summary** — What is being built
- **Patterns to Mirror** — Code conventions to follow
- **Files to Change** — What to create or modify
- **Step-by-Step Tasks** — Implementation sequence
- **Validation Commands** — How to verify correctness
- **Acceptance Criteria** — Definition of done

If the file doesn't exist or isn't a valid plan:
```
Error: Plan file not found or invalid.
Run /prp-plan <feature-description> to create a plan first.
```

**CHECKPOINT**: Plan loaded. All sections identified. Tasks extracted.

---

## Phase 2 — PREPARE

### Git State

```bash
git branch --show-current
git status --porcelain
```

### Branch Decision

| Current State | Action |
|---|---|
| On feature branch | Use current branch |
| On main, clean working tree | Create feature branch: `git checkout -b feat/{plan-name}` |
| On main, dirty working tree | **STOP** — Ask user to stash or commit first |
| In a git worktree for this feature | Use the worktree |

### Sync Remote

```bash
git pull --rebase origin $(git branch --show-current) 2>/dev/null || true
```

**CHECKPOINT**: On correct branch. Working tree ready. Remote synced.

---

## Phase 3 — EXECUTE

Process each task from the plan sequentially.

### Per-Task Loop

For each task in **Step-by-Step Tasks**:

1. **Read MIRROR reference** — Open the pattern file referenced in the task's MIRROR field. Understand the convention before writing code.

2. **Implement** — Write the code following the pattern exactly. Apply GOTCHA warnings. Use specified IMPORTS.

3. **Validate immediately** — After EVERY file change:
   ```bash
   # Run build (adjust command per project)
   [build command from Phase 0]
   ```
   If build fails → fix the error before moving to the next file.

4. **Track progress** — Log: `[done] Task N: [task name] — complete`

### Handling Deviations

If implementation must deviate from the plan:
- Note **WHAT** changed
- Note **WHY** it changed
- Continue with the corrected approach
- These deviations will be captured in the report

**CHECKPOINT**: All tasks executed. Deviations logged.

---

## Phase 4 — VALIDATE

Run all validation levels from the plan. Fix issues at each level before proceeding.

### Level 1: Static Analysis

```bash
# Build and type checking — zero errors required
swift build

# Linting — fix automatically where possible
swiftlint
swiftlint --fix
```

If lint errors remain after auto-fix, fix manually.

### Level 2: Unit Tests

Write tests for every new function (as specified in the plan's Testing Strategy).

```bash
swift test
# or for Xcode projects:
xcodebuild test
```

- Every function needs at least one test
- Cover edge cases listed in the plan
- If a test fails → fix the implementation (not the test, unless the test is wrong)

### Level 3: Build Check

```bash
swift build
# or for Xcode projects:
xcodebuild build
```

Build must succeed with zero errors.

### Level 4: Integration Testing (if applicable)

```bash
# For iOS apps with server dependencies:
# 1. Start mock server or backend service (if needed)
# 2. Run UI tests or integration tests

# Run integration tests
xcodebuild test -scheme YourScheme -configuration Debug

# Or for SPM projects with integration tests:
swift test --configuration debug
```

### Level 5: Edge Case Testing

Run through edge cases from the plan's Testing Strategy checklist.

**CHECKPOINT**: All 5 validation levels pass. Zero errors.

### Error Recovery

If validation fails during implementation:

1. **Check git state**: `git status` — identify all modified files
2. **Create a WIP commit**: `git add -A && git commit -m "WIP: [feature] — validation failed"`
3. **Review failures**: Read build errors / test failures carefully
4. **Fix incrementally**: Address one failure at a time, re-running validation after each fix
5. **If stuck**: `git stash` to save work, `git checkout -b fix/[feature]-validation` to try a different approach
6. **Rollback option**: `git log --oneline -5` to find last good commit if needed

Never leave the working tree in a dirty state without at least a WIP commit.

---

## Phase 5 — REPORT

### Create Implementation Report

```bash
mkdir -p .claude/PRPs/reports
```

Write report to `.claude/PRPs/reports/{plan-name}-report.md`:

```markdown
# Implementation Report: [Feature Name]

## Summary
[What was implemented]

## Assessment vs Reality

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | [from plan] | [actual] |
| Confidence | [from plan] | [actual] |
| Files Changed | [from plan] | [actual count] |

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | [task name] | [done] Complete | |
| 2 | [task name] | [done] Complete | Deviated — [reason] |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static Analysis | [done] Pass | |
| Unit Tests | [done] Pass | N tests written |
| Build | [done] Pass | |
| Integration | [done] Pass | or N/A |
| Edge Cases | [done] Pass | |

## Files Changed

| File | Action | Lines |
|---|---|---|
| `path/to/file` | CREATED | +N |
| `path/to/file` | UPDATED | +N / -M |

## Deviations from Plan
[List any deviations with WHAT and WHY, or "None"]

## Issues Encountered
[List any problems and how they were resolved, or "None"]

## Tests Written

| Test File | Tests | Coverage |
|---|---|---|
| `path/to/test` | N tests | [area covered] |

## Next Steps
- [ ] Code review via `/code-review`
- [ ] Create PR via `/prp-pr`
```

### Update PRD (if applicable)

If this implementation was for a PRD phase:
1. Update the phase status from `in-progress` to `complete`
2. Add report path as reference

### Archive Plan

```bash
mkdir -p .claude/PRPs/plans/completed
mv "$ARGUMENTS" .claude/PRPs/plans/completed/
```

**CHECKPOINT**: Report created. PRD updated. Plan archived.

---

## Phase 6 — OUTPUT

Report to user:

```
## Implementation Complete

- **Plan**: [plan file path] → archived to completed/
- **Branch**: [current branch name]
- **Status**: [done] All tasks complete

### Validation Summary

| Check | Status |
|---|---|
| Type Check | [done] |
| Lint | [done] |
| Tests | [done] (N written) |
| Build | [done] |
| Integration | [done] or N/A |

### Files Changed
- [N] files created, [M] files updated

### Deviations
[Summary or "None — implemented exactly as planned"]

### Artifacts
- Report: `.claude/PRPs/reports/{name}-report.md`
- Archived Plan: `.claude/PRPs/plans/completed/{name}.plan.md`

### PRD Progress (if applicable)
| Phase | Status |
|---|---|
| Phase 1 | [done] Complete |
| Phase 2 | [next] |
| ... | ... |

> Next step: Run `/prp-pr` to create a pull request, or `/code-review` to review changes first.
```

---

## Next Steps

- Run `/code-review` to review changes before committing
- Run `/prp-commit` to commit with a descriptive message
- Run `/prp-pr` to create a pull request
- Run `/prp-plan <next-phase>` if the PRD has more phases
