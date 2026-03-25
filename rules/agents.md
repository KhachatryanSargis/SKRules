# Agent Orchestration

> **Scope:** Prompt-based agent roles, invocation methods, parallel execution | **References:** [code-style.md](code-style.md), [testing.md](testing.md)

## Available Agents (10)

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| **planner** | Implementation planning | Complex features, refactoring, multi-step work |
| **architect** | System design & patterns | Architectural decisions, module restructuring |
| **code-reviewer** | Code quality & patterns | After writing code, before commits |
| **e2e-runner** | XCUITest E2E testing | Critical user flows, integration testing |
| **performance-optimizer** | Performance profiling | Launch time, memory, scroll FPS |
| **doc-updater** | Documentation | After API changes, module restructuring |
| **gan-planner** | Product spec generation | Expanding a prompt into a full feature spec |
| **gan-generator** | Feature implementation | Iterating on features with evaluator feedback |
| **gan-evaluator** | Feature evaluation & scoring | Evaluating generated code against spec |
| **loop-operator** | Autonomous loop execution | Run loops safely, monitor stalls |

## Agent Activation

```
Manual:        "Act as the code-reviewer agent and analyze this PR"
Slash command: /code-review
Workflow:      /santa-loop
```

**Rules:**
- **MUST** invoke agents manually (not auto-invocable)
- **SHOULD** launch independent analyses in parallel
- **MAY** extend agents for domain-specific needs

## Parallel Task Execution

**ALWAYS use parallel for independent agent analysis:**

```markdown
# GOOD: Parallel
1. performance-optimizer → Cache system profiling
2. code-reviewer → Feature code quality

# BAD: Sequential when independent
Wait for security → wait for performance → wait for code review
```

**Decision:**
- Is task independent? → Launch in parallel
- Need multiple perspectives? → Launch split-role agents in parallel

## Multi-Perspective Analysis

For complex problems, invoke split-role agents on same code:

```
Role 1: Factual Reviewer
- Does code match contract?
- Are invariants maintained?

Role 2: Security Expert
- Auth logic correct?
- Credential handling secure?

Role 3: Consistency Reviewer
- Matches team patterns?
- Error handling consistent?
```

**Rules:**
- **SHOULD** use for security/performance/quality decisions
- **MAY** use 3-4 roles for complex analysis
- Results merged after all complete

## Agent Invocation Best Practices

1. **Complex features** → Use planner agent
2. **Code just written** → Use code-reviewer agent
3. **Architectural changes** → Use architect agent
4. **Performance concerns** → Use performance-optimizer agent
6. **Full product spec from idea** → Use gan-planner → gan-generator → gan-evaluator
7. **Autonomous loops / monitoring** → Use loop-operator agent
