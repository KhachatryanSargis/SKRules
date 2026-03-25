#!/usr/bin/env node

/**
 * session-cli.js — Standalone CLI for managing Claude Code session history.
 *
 * Usage:
 *   node scripts/session-cli.js list [--limit N] [--date YYYY-MM-DD] [--search PATTERN]
 *   node scripts/session-cli.js load <id|alias>
 *   node scripts/session-cli.js alias <id> <name>
 *   node scripts/session-cli.js unalias <name>
 *   node scripts/session-cli.js info <id|alias>
 *   node scripts/session-cli.js aliases
 *
 * Depends on:
 *   scripts/lib/session-manager  (from CLAUDE_PLUGIN_ROOT)
 *   scripts/lib/session-aliases  (from CLAUDE_PLUGIN_ROOT)
 */

"use strict";

const path = require("path");
const fs = require("fs");
const os = require("os");

// ---------------------------------------------------------------------------
// Resolve CLAUDE_PLUGIN_ROOT — single copy of the logic that was repeated
// nine times as a minified IIFE in the old commands/sessions.md.
// ---------------------------------------------------------------------------
function resolvePluginRoot() {
  const env = process.env.CLAUDE_PLUGIN_ROOT;
  if (env && env.trim()) return env.trim();

  const home = os.homedir();
  const claudeDir = path.join(home, ".claude");
  const sentinel = path.join("scripts", "lib", "utils.js");

  // Check ~/.claude itself
  if (fs.existsSync(path.join(claudeDir, sentinel))) return claudeDir;

  // Walk the plugins cache
  try {
    const cacheBase = path.join(claudeDir, "plugins", "cache", "everything-claude-code");
    for (const org of fs.readdirSync(cacheBase)) {
      for (const ver of fs.readdirSync(path.join(cacheBase, org))) {
        const candidate = path.join(cacheBase, org, ver);
        if (fs.existsSync(path.join(candidate, sentinel))) return candidate;
      }
    }
  } catch (_) {
    // Cache dir doesn't exist — fall through
  }

  return claudeDir; // fallback
}

const PLUGIN_ROOT = resolvePluginRoot();
const sm = require(path.join(PLUGIN_ROOT, "scripts", "lib", "session-manager"));
const aa = require(path.join(PLUGIN_ROOT, "scripts", "lib", "session-aliases"));

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

function actionList(args) {
  const limit = flagValue(args, "--limit", 50);
  const date = flagValue(args, "--date");
  const search = flagValue(args, "--search");

  const result = sm.getAllSessions({ limit: Number(limit) });
  const aliases = aa.listAliases();
  const aliasMap = {};
  for (const a of aliases) aliasMap[a.sessionPath] = a.name;

  let sessions = result.sessions;
  if (date) sessions = sessions.filter((s) => s.date === date);
  if (search) sessions = sessions.filter((s) => s.shortId.includes(search));

  console.log(`Sessions (showing ${sessions.length} of ${result.total}):`);
  console.log("");
  console.log("ID        Date        Time     Branch       Worktree           Alias");
  console.log("────────────────────────────────────────────────────────────────────");

  for (const s of sessions) {
    const alias = aliasMap[s.filename] || "";
    const metadata = sm.parseSessionMetadata(sm.getSessionContent(s.sessionPath));
    const id = s.shortId === "no-id" ? "(none)" : s.shortId.slice(0, 8);
    const time = s.modifiedTime.toTimeString().slice(0, 5);
    const branch = (metadata.branch || "-").slice(0, 12);
    const worktree = metadata.worktree
      ? path.basename(metadata.worktree).slice(0, 18)
      : "-";
    console.log(
      `${id.padEnd(8)} ${s.date}  ${time}   ${branch.padEnd(12)} ${worktree.padEnd(18)} ${alias}`
    );
  }
}

function actionLoad(args) {
  const id = args[0];
  if (!id) {
    console.log("Usage: /sessions load <id|alias>");
    process.exit(1);
  }

  const resolved = aa.resolveAlias(id);
  const sessionId = resolved ? resolved.sessionPath : id;

  const session = sm.getSessionById(sessionId, true);
  if (!session) {
    console.log("Session not found: " + id);
    process.exit(1);
  }

  const stats = sm.getSessionStats(session.sessionPath);
  const size = sm.getSessionSize(session.sessionPath);
  const aliases = aa.getAliasesForSession(session.filename);

  console.log("Session: " + session.filename);
  console.log("Path: " + session.sessionPath);
  console.log("");
  console.log("Statistics:");
  console.log("  Lines: " + stats.lineCount);
  console.log("  Total items: " + stats.totalItems);
  console.log("  Completed: " + stats.completedItems);
  console.log("  In progress: " + stats.inProgressItems);
  console.log("  Size: " + size);
  console.log("");

  if (aliases.length > 0) {
    console.log("Aliases: " + aliases.map((a) => a.name).join(", "));
    console.log("");
  }

  const md = session.metadata;
  if (md.title) console.log("Title: " + md.title);
  if (md.started) console.log("Started: " + md.started);
  if (md.lastUpdated) console.log("Last Updated: " + md.lastUpdated);
  if (md.project) console.log("Project: " + md.project);
  if (md.branch) console.log("Branch: " + md.branch);
  if (md.worktree) console.log("Worktree: " + md.worktree);
}

function actionAlias(args) {
  const sessionId = args[0];
  const aliasName = args[1];

  if (!sessionId || !aliasName) {
    console.log("Usage: /sessions alias <id> <name>");
    process.exit(1);
  }

  const session = sm.getSessionById(sessionId);
  if (!session) {
    console.log("Session not found: " + sessionId);
    process.exit(1);
  }

  const result = aa.setAlias(aliasName, session.filename);
  if (result.success) {
    console.log("Alias created: " + aliasName + " -> " + session.filename);
  } else {
    console.log("Error: " + result.error);
    process.exit(1);
  }
}

function actionUnalias(args) {
  const aliasName = args[0];
  if (!aliasName) {
    console.log("Usage: /sessions unalias <name>");
    process.exit(1);
  }

  const result = aa.deleteAlias(aliasName);
  if (result.success) {
    console.log("Alias removed: " + aliasName);
  } else {
    console.log("Error: " + result.error);
    process.exit(1);
  }
}

function actionInfo(args) {
  const id = args[0];
  if (!id) {
    console.log("Usage: /sessions info <id|alias>");
    process.exit(1);
  }

  const resolved = aa.resolveAlias(id);
  const sessionId = resolved ? resolved.sessionPath : id;

  const session = sm.getSessionById(sessionId, true);
  if (!session) {
    console.log("Session not found: " + id);
    process.exit(1);
  }

  const stats = sm.getSessionStats(session.sessionPath);
  const size = sm.getSessionSize(session.sessionPath);
  const aliases = aa.getAliasesForSession(session.filename);

  console.log("Session Information");
  console.log("════════════════════");
  console.log("ID:          " + (session.shortId === "no-id" ? "(none)" : session.shortId));
  console.log("Filename:    " + session.filename);
  console.log("Date:        " + session.date);
  console.log("Modified:    " + session.modifiedTime.toISOString().slice(0, 19).replace("T", " "));
  console.log("Project:     " + (session.metadata.project || "-"));
  console.log("Branch:      " + (session.metadata.branch || "-"));
  console.log("Worktree:    " + (session.metadata.worktree || "-"));
  console.log("");
  console.log("Content:");
  console.log("  Lines:         " + stats.lineCount);
  console.log("  Total items:   " + stats.totalItems);
  console.log("  Completed:     " + stats.completedItems);
  console.log("  In progress:   " + stats.inProgressItems);
  console.log("  Size:          " + size);
  if (aliases.length > 0) {
    console.log("Aliases:     " + aliases.map((a) => a.name).join(", "));
  }
}

function actionAliases() {
  const aliases = aa.listAliases();
  console.log("Session Aliases (" + aliases.length + "):");
  console.log("");

  if (aliases.length === 0) {
    console.log("No aliases found.");
    return;
  }

  console.log("Name          Session File                    Title");
  console.log("─────────────────────────────────────────────────────────────");
  for (const a of aliases) {
    const name = a.name.padEnd(12);
    const file = (
      a.sessionPath.length > 30
        ? a.sessionPath.slice(0, 27) + "..."
        : a.sessionPath
    ).padEnd(30);
    const title = a.title || "";
    console.log(`${name} ${file} ${title}`);
  }
}

// ---------------------------------------------------------------------------
// CLI dispatcher
// ---------------------------------------------------------------------------

function flagValue(args, flag, defaultVal) {
  const idx = args.indexOf(flag);
  if (idx === -1) return defaultVal;
  return args[idx + 1] || defaultVal;
}

const [action, ...rest] = process.argv.slice(2);

switch (action) {
  case "list":
  case undefined:
    actionList(rest);
    break;
  case "load":
    actionLoad(rest);
    break;
  case "alias":
    actionAlias(rest);
    break;
  case "unalias":
    actionUnalias(rest);
    break;
  case "info":
    actionInfo(rest);
    break;
  case "aliases":
    actionAliases();
    break;
  default:
    console.log("Unknown action: " + action);
    console.log("Available: list, load, alias, unalias, info, aliases");
    process.exit(1);
}
