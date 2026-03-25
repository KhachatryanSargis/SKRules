# Git & PR Workflow

> **Scope:** Branch naming, commit conventions, PR workflows, merge strategy, .gitignore | **References:** [code-style.md](code-style.md), [testing.md](testing.md)

## Branch Naming

Format: `<type>/<short-description>` in kebab-case.

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New functionality | `feature/bookmark-sync` |
| `bugfix/` | Bug fix | `bugfix/crash-on-empty-list` |
| `hotfix/` | Urgent production fix | `hotfix/token-expiry-loop` |
| `refactor/` | Structural change, no behavior change | `refactor/extract-auth-module` |
| `chore/` | Build config, dependencies, tooling | `chore/update-swiftlint-rules` |
| `release/` | Release preparation | `release/1.2.0` |

- **MUST** use one of the prefixes above — no unprefixed branches
- **MUST** use kebab-case (lowercase, hyphens only) after the prefix
- **SHOULD** include ticket ID when applicable: `feature/GH-42-add-search`
- **SHOULD** keep branch names under 50 characters

## Commit Format

Follow Conventional Commits: `<type>(<scope>): <subject>`

| Type | Purpose |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring (no behavior change) |
| `test` | Test additions or fixes |
| `docs` | Documentation updates |
| `chore` | Build config, dependencies |
| `perf` | Performance optimization |
| `ci` | CI/CD pipeline changes |

**Scopes:** `ui` `model` `vm` `api` `test` `config` `deps` `ci` `perf` `nav`

**Rules:**
- Present tense: "Add feature" not "Added feature"
- Under 72 characters
- Include footer: `Closes #42`

## PR Workflow

**Before Creating PR (run in this order):**
1. `swift build` — zero warnings (see [code-style.md](code-style.md))
2. `swift test` — all tests passing
3. `swiftformat .` — apply formatting first (may change code SwiftLint inspects)
4. `swiftlint --fix && swiftlint` — lint clean after formatting
5. `git rebase origin/main` — linear history, no merge commits

**PR Requirements:**
- **MUST** have ≥1 approval before merge
- **MUST** have passing CI
- **MUST** have zero merge conflicts
- **MUST** remove debug logging (`print`, `debugPrint`, `dump`) before PR — `TODO`/`FIXME` allowed if tracked in issue tracker
- **SHOULD** keep PRs under 400 lines of production code — split larger changes into stacked PRs

## Merge Strategy

**Feature branches:**
- **MUST** rebase: `git rebase origin/main` before merge (linear history)

**Release branches:**
- **SHOULD** use merge commit: `git merge --no-ff release/1.2.0` (preserves boundaries)

## Protected Branches

- **MUST** protect `main` with status checks, 1+ review, branches up-to-date, no merge commits
- **SHOULD** protect `develop` with same rules

**Rules:**
- **MUST** exclude DerivedData, .build, xcuserdata, Pods
- **MUST** exclude .DS_Store (merge conflicts)
- **MUST** exclude .env and local config files
