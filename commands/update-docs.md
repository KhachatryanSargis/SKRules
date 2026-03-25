# Update Documentation

Sync documentation with the codebase, generating from source-of-truth files.

## Step 1: Identify Sources of Truth

| Source | Generates |
|--------|-----------|
| `Package.swift` (SPM) | Available targets and build configurations |
| `Makefile` or build schemes | Available build/test commands |
| `.env.example` | Environment variable documentation |
| `.xcodeproj` / `.xcworkspace` | Xcode schemes and configurations |
| Source code exports | Public API documentation |
| CocoaPods or SPM dependencies | Dependency reference |

**iOS-Specific Sources:**

| Source | Generates |
|--------|-----------|
| `.xcconfig` files | Build configuration documentation |
| `Podfile` / `Package.swift` | Dependency and version constraints |
| Xcode scheme definitions | Available build targets and run configurations |
| `Info.plist` template | Required keys and capabilities (iOS version, permissions) |

## Step 2: Generate Build Command Reference

1. Read `Package.swift` and extract build targets
2. Read Xcode scheme files or use `xcodebuild -list`
3. Document available commands:

```markdown
| Command | Description |
|---------|-------------|
| `swift build` | Build project with type checking |
| `swift test` | Run test suite with coverage |
| `swift-format` | Format code to style guide |
| `swiftlint` | Check code style violations |
| `xcodebuild build` | Build via Xcode for iOS/macOS |
```

## Step 3: Generate Environment Documentation

1. Read `.env.example` (or `.env.template`, `.env.sample`)
2. Extract all variables with their purposes (provisioning profiles, API keys, build paths)
3. Categorize as required vs optional
4. Document expected format and valid values

```markdown
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DEVELOPMENT_TEAM` | Yes | Apple Developer Team ID | `ABC123DEF4` |
| `API_BASE_URL` | Yes | Backend API endpoint | `https://api.example.com` |
| `LOG_LEVEL` | No | Logging verbosity (default: info) | `debug`, `info`, `warn`, `error` |
```

**iOS Environment Variables:**

```markdown
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `APPLE_DEVELOPER_TEAM_ID` | Yes | Apple Developer Team ID (from Apple Developer portal) | `ABC123DEF4` |
| `CODE_SIGN_IDENTITY` | Yes | Certificate name for code signing | `Apple Development` or `Apple Distribution` |
| `PROVISIONING_PROFILE` | Yes | UUID or name of provisioning profile | `00000000-0000-0000-0000-000000000000` |
| `PROVISIONING_PROFILE_SPECIFIER` | Yes | Human-readable provisioning profile name | `MyApp Development` |
| `DEPLOYMENT_TARGET` | Yes | Minimum iOS version (e.g., iOS 16) | `16.0` |
| `BUNDLE_IDENTIFIER` | Yes | App bundle ID (reverse domain + app name) | `com.example.myapp` |
| `PRODUCT_NAME` | Yes | Display name of app in App Store | `My App` |
| `CONFIGURATION` | No | Build configuration (Debug or Release) | `Debug` or `Release` |
```

## Step 4: Update Contributing Guide

Generate or update `docs/CONTRIBUTING.md` with:
- Development environment setup (Xcode version, CocoaPods/SPM, iOS target version)
- Available build targets and schemes
- Testing procedures (swift test, XCTest/Swift Testing framework)
- Code style enforcement (swiftlint, swift-format, pre-commit hooks)
- Provisioning and signing setup
- PR submission checklist

## Step 5: Update Runbook

Generate or update `docs/RUNBOOK.md` with:
- Build and deployment procedures (via Xcode, Fastlane, or CI/CD)
- Test execution and coverage reporting
- Common build issues and their fixes
- How to run on simulator vs. device
- Provisioning profile management and troubleshooting

## Step 6: Staleness Check

1. Find documentation files not modified in 90+ days
2. Cross-reference with recent source code changes
3. Flag potentially outdated docs for manual review

## Step 7: Show Summary

```
Documentation Update
──────────────────────────────
Updated:  docs/CONTRIBUTING.md (scripts table)
Updated:  docs/ENV.md (3 new variables)
Flagged:  docs/DEPLOY.md (142 days stale)
Skipped:  docs/API.md (no changes detected)
──────────────────────────────
```

## Rules

- **Single source of truth**: Always generate from code, never manually edit generated sections
- **Preserve manual sections**: Only update generated sections; leave hand-written prose intact
- **Mark generated content**: Use `<!-- AUTO-GENERATED -->` markers around generated sections
- **Don't create docs unprompted**: Only create new doc files if the command explicitly requests it
