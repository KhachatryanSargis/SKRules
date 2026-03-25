---
description: Create a GitHub pull request with comprehensive summary, test plan, and linked issues.
argument-hint: [base branch, blank = default branch]
---

# PRP Pull Request Command

Create a well-structured GitHub pull request from current branch changes.

### Setup (Auto-Create)
Before proceeding, ensure the PRP directory structure exists:
```bash
mkdir -p .claude/PRPs/prds .claude/PRPs/plans .claude/PRPs/reports .claude/PRPs/implementations
```
This is idempotent and safe to run every time.

## Usage

```
/prp-pr                # PR against default branch
/prp-pr develop        # PR against specific base branch
```

## Workflow

### 1. Gather Context

```bash
# Understand the full scope of changes
git log --oneline $(git merge-base HEAD origin/main)..HEAD
git diff origin/main...HEAD --stat
git status
```

### 2. Analyze Changes

- Read ALL commits on the branch (not just the latest)
- Identify: new files, modified files, deleted files
- Categorize: features, fixes, refactors, tests, docs
- Note: breaking changes, migration steps, new dependencies

### 3. Create PR

```bash
gh pr create \
  --title "<type>: <concise description>" \
  --body "$(cat <<'EOF'
## Summary

<1-3 bullet points describing what this PR does and why>

## Changes

<List key changes by category>

### New
- Added `TypeName` for <purpose>

### Modified
- Updated `ExistingType` to support <feature>

### Removed
- Removed deprecated `OldType`

## Test Plan

- [ ] Unit tests pass (`swift test`)
- [ ] UI tests pass (`xcodebuild test -only-testing:UITests`)
- [ ] Manual verification: <describe what to check>
- [ ] Build succeeds on CI

## Notes

<Any migration steps, breaking changes, or reviewer guidance>
EOF
)"
```

### 4. Push and Link

```bash
# Push branch with tracking
git push -u origin HEAD

# If related to an issue
gh pr create --title "..." --body "..." --assignee @me
```

## PR Title Conventions

Format: `<type>: <description>` (under 70 characters)

| Type | When |
|------|------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring |
| `test` | Adding/fixing tests |
| `docs` | Documentation only |
| `perf` | Performance improvement |
| `chore` | Build, deps, CI changes |

## Checklist Before Creating

**General:**
- [ ] Branch is up to date with base: `git rebase origin/main`
- [ ] Build passes: `swift build` or `xcodebuild build -scheme <scheme>`
- [ ] Tests pass: `swift test` or `xcodebuild test`
- [ ] Lint passes: `swiftlint`
- [ ] CLAUDE.md updated if public API changed

**iOS-Specific:**
- [ ] No `print()`/`debugPrint()` in release code paths (only in #if DEBUG blocks or Tests/)
- [ ] No hardcoded API endpoints (use build config, Info.plist, or environment-specific configuration)
- [ ] Simulators/devices tested listed in PR description (e.g., "tested on iPhone 16, iPhone SE, iPad Pro")
- [ ] Minimum iOS version impact noted if deployment target changed
- [ ] Core Data/SwiftData migration included if schema changed (migration policy, version hash)
- [ ] No uncommitted secrets (check with `git diff --cached`)

**Test Plan Coverage:**
- Specify which simulators/devices were tested
- List both unit and UI test results
- Note any manual testing scenarios
