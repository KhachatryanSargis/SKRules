# Update Codemaps

Analyze the codebase structure and generate token-lean architecture documentation.

## Step 1: Scan Project Structure

1. Identify the project type (monorepo, single app, library, microservice)
2. Find all source directories (src/, lib/, app/, packages/)
3. Map entry points (main.ts, index.ts, app.py, main.go, etc.)

## Step 2: Generate Codemaps

Create or update codemaps in `docs/CODEMAPS/` (or `.reports/codemaps/`):

| File | Contents |
|------|----------|
| `architecture.md` | High-level system diagram, layer boundaries, data flow |
| `services.md` | Service layer design, business logic, dependencies |
| `views.md` | View hierarchy, SwiftUI components, navigation flow |
| `data.md` | Core Data/SwiftData models, relationships, persistence |
| `dependencies.md` | External APIs, SDKs, third-party integrations, SPM/CocoaPods packages |

### Codemap Format

Each codemap should be token-lean — optimized for AI context consumption:

```markdown
# iOS Architecture

## View Layer
AuthView → LoginView → DashboardView → DetailsView
TabView (Home, Search, Profile) → respective ViewControllers

## Service Layer
UserService.login() → APIClient.POST /auth/login → KeychainService.store()
UserService.getProfile() → UserViewModel.fetchProfile() → refresh UI

## Data Layer
User (Codable) → Core Data Entity → Keychain (sensitive fields)
LocalCache using SwiftData for offline support

## Key Files
Sources/Services/UserService.swift (business logic, 180 lines)
Sources/ViewModels/UserViewModel.swift (state management, 120 lines)
Sources/Models/User.swift (data models, 50 lines)

## Dependencies
- Apple Keychain (secure credential storage)
- Core Data / SwiftData (local persistence)
- URLSession (networking)
- Firebase (analytics, push notifications)
```

## Step 3: Diff Detection

1. If previous codemaps exist, calculate the diff percentage
2. If changes > 30%, show the diff and request user approval before overwriting
3. If changes <= 30%, update in place

## Step 4: Add Metadata

Add a freshness header to each codemap:

```markdown
<!-- Generated: 2026-02-11 | Files scanned: 142 | Token estimate: ~800 -->
```

## Step 5: Save Analysis Report

Write a summary to `.reports/codemap-diff.txt`:
- Files added/removed/modified since last scan
- New dependencies detected
- Architecture changes (new routes, new services, etc.)
- Staleness warnings for docs not updated in 90+ days

## Tips

- Focus on **high-level structure**, not implementation details
- Prefer **file paths and function signatures** over full code blocks
- Keep each codemap under **1000 tokens** for efficient context loading
- Use ASCII diagrams for data flow instead of verbose descriptions
- Run after major feature additions or refactoring sessions
