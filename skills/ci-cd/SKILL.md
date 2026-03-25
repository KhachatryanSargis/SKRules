---
name: ci-cd
description: GitHub Actions pipelines, Fastlane automation, SPM package CI, deployment triggers, and caching for iOS projects.
---

# CI/CD Pipeline

> **Scope:** GitHub Actions pipelines, Fastlane automation, SPM package CI, deployment triggers, caching
> **See also:** `rules/git-workflow.md`, `skills/code-signing/`, `skills/entitlements/`, `rules/testing.md`

## Core Rules

- **MUST** use GitHub Actions as the CI/CD platform
- **MUST** use Fastlane for all build, test, sign, and deploy automation
- **MUST** run CI on every pull request and every push to `main`
- **MUST** pass CI before merge — no exceptions
- **MUST** cache SPM dependencies keyed on `Package.resolved`
- **MUST NOT** store secrets, certificates, or API keys in the repository

## Pipeline Tiers

Every repo gets CI. The tier depends on what the repo contains.

### Tier 1: SPM Package (SKCore, SKNetwork, SKStorage, SKNavigation, feature packages)

Triggered on: **PR** and **push to main**

| Stage | Tool | Requirement |
|-------|------|-------------|
| Resolve dependencies | `swift package resolve` | MUST |
| Build | `swift build` | MUST |
| Test | `swift test --parallel` | MUST |
| Lint | `swiftlint --strict` | SHOULD |

- **MUST** test on `macos-15` runner with latest stable Xcode
- **MUST** test against the minimum Swift version declared in `Package.swift`
- **SHOULD** run tests on both Debug and Release configurations

### Tier 2: App (full pipeline)

| Trigger | Lint | Unit Tests | Integration | Build | TestFlight | App Store |
|---------|------|-----------|-------------|-------|-----------|-----------|
| **PR** | MUST | MUST | SHOULD | MUST (debug) | — | — |
| **Push to main** | MUST | MUST | MUST | MUST (release) | MUST | — |
| **Tag `release/*`** | MUST | MUST | MUST | MUST (release) | — | MUST |

**PR pipeline (target: <8 min):**
- **MUST** run SwiftLint + SwiftFormat check
- **MUST** build debug configuration
- **MUST** run unit tests
- **MUST NOT** run UI tests (too slow for PR feedback)
- **MUST NOT** sign or archive

**Main pipeline (target: <15 min):**
- **MUST** run full test suite (unit + integration)
- **MUST** enforce code coverage ≥80% on business logic (see `rules/testing.md`)
- **MUST** build release configuration
- **MUST** sign with Fastlane Match (see `skills/code-signing/`)
- **MUST** upload to TestFlight automatically

**Release pipeline (target: <25 min):**
- **MUST** run full validation suite
- **MUST** archive and sign for distribution
- **MUST** submit to App Store (hold for review)

## Fastlane

- **MUST** use Fastlane for all CI automation (no raw `xcodebuild` in workflows)
- **MUST** define lanes: `test`, `lint`, `testflight`, `release`
- **MUST** use Fastlane Match for code signing in CI (`--readonly` mode)
- **MUST** use App Store Connect API key for uploads (not personal Apple ID)

### Required Lanes

```ruby
platform :ios do
lane :test do
run_tests(scheme: "AppScheme", devices: ["iPhone 16"], code_coverage: true)
end

lane :lint do
swiftlint(mode: :lint, strict: true)
end

lane :testflight do
match(type: "appstore", readonly: true)
build_app(scheme: "AppScheme", configuration: "Release", export_method: "app-store")
upload_to_testflight(skip_waiting_for_build_processing: true)
end

lane :release do
match(type: "appstore", readonly: true)
build_app(scheme: "AppScheme", configuration: "Release", export_method: "app-store")
upload_to_app_store(submit_for_review: true, skip_screenshots: true)
end
end
```

## GitHub Actions Configuration

- **MUST** use `macos-15` runner
- **MUST** use `maxim-lobanov/setup-xcode` for Xcode version management
- **MUST** use `actions/cache@v4` for SPM dependency caching

### SPM Dependency Caching

```yaml
- uses: actions/cache@v4
with:
path: |
.build/SourcePackages
.swiftpm
key: ${{ runner.os }}-spm-${{ hashFiles('**/Package.resolved') }}
restore-keys: |
${{ runner.os }}-spm-
```

- **MUST** resolve dependencies before caching (`swift package resolve` first)
- **MUST** key cache on `Package.resolved` hash (busts automatically on dependency change)

### Private Package Authentication

For repos that depend on other private SK packages:

- **MUST** use SSH deploy key or GitHub App token for private SPM package access
- **MUST** store authentication credentials as GitHub Actions secrets
- **MUST NOT** hardcode tokens or keys in workflow files

```yaml
- name: Configure private package access
run: |
mkdir -p ~/.ssh
echo "${{ secrets.SPM_DEPLOY_KEY }}" > ~/.ssh/id_ed25519
chmod 600 ~/.ssh/id_ed25519
ssh-keyscan github.com >> ~/.ssh/known_hosts
```

## Secrets Management

- **MUST** store all secrets in GitHub Actions Secrets (repo or org level)
- **MUST** use App Store Connect API key (not personal Apple ID) for submissions
- **MUST** use Fastlane Match with encrypted git repo for certificates and profiles
- **MUST NOT** commit `.env`, `.p12`, `.mobileprovision`, or `.p8` files to any repository

### Required Secrets

| Secret | Purpose |
|--------|---------|
| `MATCH_GIT_BASIC_AUTHORIZATION` | Access to Match certificates repo |
| `MATCH_PASSWORD` | Decrypt Match certificates |
| `ASC_KEY_ID` | App Store Connect API key ID |
| `ASC_ISSUER_ID` | App Store Connect issuer ID |
| `ASC_API_KEY` | App Store Connect private key (base64) |
| `SPM_DEPLOY_KEY` | SSH key for private package access |

## Build Versioning

- **MUST** auto-increment build number in CI (never manual)
- **SHOULD** use git commit count or CI run number as build number
- **SHOULD** use semantic versioning for marketing version (from tag)

## Failure Handling

- **MUST** fail the pipeline immediately on first error (no partial passes)
- **MUST** report test results as PR check annotations
- **SHOULD** notify on main branch failures (Slack, email, or GitHub notification)
- **MUST NOT** allow merge if any required check is failing
