# SKRules

Shared Claude Code configuration for iOS/Swift projects. Rules, agents, skills, and commands that sync into any codebase via a single script.

SKRules provides the general development standards that apply to every iOS project you work on. Domain-specific packages (SKCore, SKNavigation, SKStorage, SKNetwork, SKAnalytics, SKPurchases) each carry their own CLAUDE.md with rules scoped to that package's domain.

## How It Works

SKRules has four types of components. Each behaves differently at runtime:

| Component | Location after sync | When it loads | Token cost |
|-----------|-------------------|---------------|------------|
| **Rules** | `.claude/rules/` | Automatically, every prompt | Always paid |
| **Skills** | `.claude/skills/` | On demand, when invoked | Paid only when used |
| **Agents** | `.claude/agents/` | On demand, when called | Paid only when used |
| **Commands** | `.claude/commands/` | On demand, when you type the slash command | Paid only when used |

The distinction matters. Rules are short guardrails that Claude reads on every single prompt. Skills are detailed playbooks loaded only when a specific task calls for them. Putting too much detail in rules wastes tokens on every prompt; putting critical constraints in skills means they might not be loaded when needed.

---

## Quick Start

```bash
# Clone SKRules (or add as a submodule)
git clone https://github.com/user/SKRules.git

# Sync everything into your iOS project
./SKRules/sync.sh /path/to/my-ios-app
```

After syncing, your project will have:

```
my-ios-app/
├── .claude/
│   ├── rules/        # 6 rule files (auto-loaded every prompt)
│   ├── agents/       # 10 agent definitions
│   ├── skills/       # 19 skill playbooks
│   └── commands/     # 20 slash commands
├── CLAUDE.md          # Project-specific content (from CLAUDE.local.md, if present)
└── ...your code...
```

---

## Rules

**What they are:** Short, declarative MUST/MUST NOT constraints. Think of them as the coding standards document that Claude reads before every response.

**How they load:** Claude Code automatically reads every `.md` file in `.claude/rules/` at the start of each prompt. You do not need to invoke them. They are always active.

**Why keep them short:** Every token in a rule is paid on every single prompt. Rules should be under 100 lines. If you need detailed examples, reference a skill instead.

### What's included

| Rule | What it enforces |
|------|-----------------|
| `architecture` | Clean Architecture + MVVM, layer boundaries, DI, @MainActor, @Observable |
| `code-style` | Naming conventions, formatting, access control, Swift 6 concurrency |
| `testing` | Swift Testing standard, coverage targets (80%/70%), actor mocks, FIDFS |
| `git-workflow` | Branch naming, Conventional Commits, PR workflow, merge strategy |
| `import-hygiene` | Import ordering, @testable restrictions, SPM target isolation |
| `agents` | Agent roster and invocation patterns |

### Example: what a rule looks like

From `rules/testing.md`:

```markdown
- **MUST** use Swift Testing (`import Testing`) as the default framework
- **MUST** achieve 80%+ coverage for business logic / Use Cases
- **MUST** use actor-based mocks for Sendable safety
- **MUST NOT** test private implementation details — test public API behavior
```

Claude sees this on every prompt and will follow it without being asked.

### Adding project-specific rules

Create a `CLAUDE.local.md` in your project root. The sync script copies it to `CLAUDE.md`. This is where you put project-specific content that doesn't belong in the shared package:

```markdown
# MyApp Project Rules

- This project uses SwiftData (not Core Data)
- Minimum deployment target: iOS 17
- Feature flags are managed via RemoteConfig
- Run `make bootstrap` before first build
```

---

## Skills

**What they are:** Detailed, step-by-step playbooks for specific tasks. They can be hundreds of lines with full code examples, templates, and workflows.

**How they load:** Skills are NOT loaded automatically. They are loaded on demand when Claude determines the task requires that skill, or when a command or agent explicitly invokes one. This means they cost zero tokens on prompts that don't need them.

**When to use a skill vs a rule:** If Claude needs the constraint on every single prompt, it's a rule. If Claude only needs it during a specific task, it's a skill.

### What's included (19 skills)

**iOS/Swift Patterns:**
`swiftui` `swift-concurrency-6-2` `swift-actor-persistence` `swift-protocol-di-testing` `liquid-glass-design` `accessibility` `entitlements`

**Development Workflows:**
`search-first` `verification-loop` `ci-cd` `eval-harness` `codebase-onboarding`

**Agentic Engineering:**
`agentic-engineering` `ai-first-engineering` `santa-method` `safety-guard` `blueprint` `deep-research` `repo-scan`

### Example: skill in action

You ask Claude to write a feature that uses async/await. Claude activates the `swift-concurrency-6-2` skill, which loads a full playbook with actor isolation patterns, Sendable conformance strategies, structured concurrency examples, and task cancellation handling. Once the task is done, the skill is no longer consuming context.

### Skill structure

Each skill lives in its own directory with a `SKILL.md` file:

```
skills/
├── swift-concurrency-6-2/
│   └── SKILL.md       # The playbook Claude reads when this skill activates
├── swiftui/
│   └── SKILL.md
└── ...
```

---

## Agents

**What they are:** Specialized personas with focused expertise. Each agent has a system prompt that tells Claude to adopt a specific role, use specific tools, and follow a specific checklist.

**How they load:** Agents are NOT auto-invocable. You activate them in one of three ways:

1. **Directly ask Claude** to act as an agent
2. **Use a slash command** that delegates to an agent
3. **Reference the agent** in a composite workflow

### What's included (10 agents)

| Agent | Role | Best model |
|-------|------|-----------|
| `planner` | Task breakdown and implementation sequencing | opus |
| `architect` | System design, patterns, API boundaries | opus |
| `code-reviewer` | Code quality, security, maintainability | sonnet |
| `e2e-runner` | XCUITest writing and flakiness debugging | sonnet |
| `performance-optimizer` | Launch time, memory, frame rate, energy | opus |
| `doc-updater` | DocC catalogs, codemaps, CLAUDE.md maintenance | sonnet |
| `gan-planner` | Expand a one-line idea into a full product spec | opus |
| `gan-generator` | Implement features per spec, iterate on feedback | opus |
| `gan-evaluator` | Score generated code, produce PASS/FAIL verdicts | opus |
| `loop-operator` | Run autonomous loops safely, detect stalls | sonnet |

### Example: using an agent

**Manual invocation:**
```
You: Act as the architect agent and evaluate whether we should
     use SwiftData or Core Data for this project.
```

Claude reads the `architect.md` agent definition and adopts that role: it analyzes data flow, considers scalability, evaluates migration paths, and produces an Architecture Decision Record.

**Via slash command:**
```
You: /code-review
```

The `/code-review` command tells Claude to follow the `code-reviewer` agent guidelines, which include a confidence-based filtering system, severity levels, and an iOS-specific checklist.

**GAN pipeline (three agents in sequence):**
```
You: /prp-prd
```

This kicks off the GAN triad: `gan-planner` writes the spec, `gan-generator` implements it, and `gan-evaluator` scores the output. If the evaluator returns FAIL, the generator iterates. Maximum 3 rounds.

### Agent frontmatter

Each agent file has YAML frontmatter that specifies recommended tools and model:

```yaml
---
name: planner
description: Expert planning specialist for complex features
tools: ["Read", "Grep", "Glob"]
model: opus
---
```

The `model` field is a recommendation, not a hard constraint. Claude Code does not enforce it — it indicates which model is best suited for that agent's workload.

---

## Commands

**What they are:** Slash commands you type in Claude Code. Each command is a markdown file that tells Claude what to do when you invoke it. Commands often delegate to agents or skills.

**How they load:** Type `/command-name` in Claude Code. The command's markdown is loaded as instructions for that interaction.

### Core workflow commands

| Command | What it does |
|---------|-------------|
| `/plan` | Create an implementation plan before writing code (delegates to planner agent) |
| `/build-fix` | Diagnose and fix Swift/Xcode build errors incrementally |
| `/code-review` | Run a code review (delegates to code-reviewer agent) |
| `/verify` | Run the full verification pipeline: build, lint, test, security scan |
| `/e2e` | Write or fix XCUITest end-to-end tests (delegates to e2e-runner agent) |

### PRP (Plan-Review-Push) suite

A complete feature delivery pipeline from idea to merged PR:

```
/prp-prd          Write a problem-first PRD
     ↓
/prp-plan         Create a detailed implementation plan
     ↓
/prp-implement    Execute the plan with build/test validation loops
     ↓
/prp-commit       Commit with natural language file targeting
     ↓
/prp-pr           Create a GitHub PR with summary and test plan
```

### Learning and documentation

| Command | What it does |
|---------|-------------|
| `/learn` | Extract reusable patterns from the current session |
| `/learn-eval` | Extract patterns with quality self-evaluation |
| `/update-docs` | Sync docs from Package.swift and source files |
| `/update-codemaps` | Generate architecture documentation |

### Session management

| Command | What it does |
|---------|-------------|
| `/save-session` | Save current session state for later |
| `/resume-session` | Reload a saved session and continue |
| `/sessions` | List and manage session history |
| `/aside` | Quick side question without losing context |

### Autonomous loops

| Command | What it does |
|---------|-------------|
| `/loop-start` | Start a managed autonomous loop with safety limits |
| `/santa-loop` | Adversarial dual-review convergence loop |

### Example: using a command

```
You: /plan Add a bookmark deduplication feature

Claude: [Loads planner agent]
        1. Restates requirements
        2. Breaks down into phases with dependencies
        3. Assesses risks and estimates complexity
        4. Presents plan and WAITS for confirmation
```

---

## Sync Script

`sync.sh` copies components from SKRules into your project's `.claude/` directory.

### Usage

```bash
# Sync everything (rules + agents + skills + commands)
./sync.sh /path/to/project

# Sync only rules
./sync.sh /path/to/project --rules-only

# Sync specific rules only
./sync.sh /path/to/project code-style testing architecture

# Sync into the current directory
./sync.sh
```

### Configuration

Place these files in your project to customize what gets synced:

**`.skrules-config`** — Choose which component types to sync:
```
# Only sync rules and agents, skip skills and commands
rules
agents
```

**`.claude-rules-config`** — Choose which rules to include:
```
# Core rules only (skip agents.md, etc.)
code-style
architecture
testing
git-workflow
import-hygiene
```

If neither config file exists, everything is synced.

### Updating

```bash
cd SKRules && git pull
./sync.sh /path/to/project
```

---

## How the Pieces Fit Together

Here is how the layers interact during a typical feature implementation:

```
You type: /prp-plan "Add offline bookmark sync"
          │
          ▼
    ┌─────────────┐
    │  /prp-plan   │  ← Command (loaded on demand)
    │  command      │
    └──────┬──────┘
           │ delegates to
           ▼
    ┌─────────────┐
    │  planner     │  ← Agent (loaded on demand)
    │  agent       │
    └──────┬──────┘
           │ always constrained by
           ▼
    ┌─────────────┐
    │  rules/      │  ← Rules (always in context)
    │  architecture│
    │  testing     │
    │  code-style  │
    └──────┬──────┘
           │ references when needed
           ▼
    ┌─────────────┐
    │  skills/     │  ← Skills (loaded on demand)
    │  swift-      │
    │  concurrency │
    │  swiftui     │
    └─────────────┘
```

Rules are always active as guardrails. The command loads the agent, the agent may reference skills for detailed guidance, and everything stays within the boundaries set by the rules.

---

## API Documentation Generator

`generate-api.sh` scans a Swift package's `Sources/` directory for `public` and `open` declarations and writes a summary into the package's `CLAUDE.md`. This keeps the API reference up to date without manual effort.

```bash
./generate-api.sh /path/to/MyPackage
```

It writes between `<!-- PUBLIC-API-START -->` and `<!-- PUBLIC-API-END -->` markers. If the markers don't exist yet, they are appended.

---

## Adding New Content

**New rule:** Create `rules/my-rule.md`, keep it under 100 lines, start with a `# Title` heading. Run `sync.sh` to deploy.

**New skill:** Create `skills/my-skill/SKILL.md` with YAML frontmatter (`name`, `description`). Can be as long as needed.

**New agent:** Create `agents/my-agent.md` with frontmatter (`name`, `description`, `tools`, `model`). Write the system prompt as the body.

**New command:** Create `commands/my-command.md` with frontmatter (`description`). The command will be available as `/my-command`.

---

## License

MIT
