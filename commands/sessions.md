---
description: Manage Claude Code session history, aliases, and session metadata.
---

# Sessions Command

Manage Claude Code session history — list, load, alias, and inspect sessions stored in `~/.claude/session-data/` with legacy reads from `~/.claude/sessions/`.

All logic lives in `scripts/session-cli.js`. Each action below invokes it with the appropriate sub-command.

## Usage

`/sessions [list|load|alias|unalias|info|aliases|help] [options]`

## Actions

### List Sessions

Display sessions with metadata, filtering, and pagination.

```bash
/sessions                              # List all sessions (default)
/sessions list                         # Same as above
/sessions list --limit 10              # Show 10 sessions
/sessions list --date 2026-02-01       # Filter by date
/sessions list --search abc            # Search by session ID
```

**Script:**
```bash
node "$CLAUDE_PLUGIN_ROOT/scripts/session-cli.js" list $ARGUMENTS
```

### Load Session

Load and display a session's content (by ID or alias).

```bash
/sessions load <id|alias>
/sessions load 2026-02-01              # By date (for no-id sessions)
/sessions load a1b2c3d4                # By short ID
/sessions load my-alias                # By alias name
```

**Script:**
```bash
node "$CLAUDE_PLUGIN_ROOT/scripts/session-cli.js" load $ARGUMENTS
```

### Create Alias

Create a memorable alias for a session.

```bash
/sessions alias <id> <name>
/sessions alias 2026-02-01 today-work
```

**Script:**
```bash
node "$CLAUDE_PLUGIN_ROOT/scripts/session-cli.js" alias $ARGUMENTS
```

### Remove Alias

Delete an existing alias.

```bash
/sessions unalias <name>
/sessions alias --remove <name>        # Alternative syntax
```

**Script:**
```bash
node "$CLAUDE_PLUGIN_ROOT/scripts/session-cli.js" unalias $ARGUMENTS
```

### Session Info

Show detailed information about a session.

```bash
/sessions info <id|alias>
```

**Script:**
```bash
node "$CLAUDE_PLUGIN_ROOT/scripts/session-cli.js" info $ARGUMENTS
```

### List Aliases

Show all session aliases.

```bash
/sessions aliases
```

**Script:**
```bash
node "$CLAUDE_PLUGIN_ROOT/scripts/session-cli.js" aliases
```

## Operator Notes

- Session files persist `Project`, `Branch`, and `Worktree` in the header so `/sessions info` can disambiguate parallel tmux/worktree runs.
- For command-center style monitoring, combine `/sessions info`, `git diff --stat`, and the cost metrics emitted by `scripts/hooks/cost-tracker.js`.

## Arguments

$ARGUMENTS:
- `list [options]` — List sessions
  - `--limit <n>` — Max sessions to show (default: 50)
  - `--date <YYYY-MM-DD>` — Filter by date
  - `--search <pattern>` — Search in session ID
- `load <id|alias>` — Load session content
- `alias <id> <name>` — Create alias for session
- `unalias <name>` — Remove alias
- `info <id|alias>` — Show session statistics
- `aliases` — List all aliases
- `help` — Show this help

## Notes

- Sessions are stored as markdown files in `~/.claude/session-data/` with legacy reads from `~/.claude/sessions/`
- Aliases are stored in `~/.claude/session-aliases.json`
- Session IDs can be shortened (first 4–8 characters usually unique enough)
- Use aliases for frequently referenced sessions
