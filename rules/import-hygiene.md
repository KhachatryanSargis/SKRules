# Import Hygiene

> **Scope:** Import ordering, @testable, preview scoping, conditional compilation, SPM isolation | **References:** [code-style.md](code-style.md)

## Import Ordering

Group imports in exact order with blank lines between:

**Rules:**
- **MUST** group system frameworks first (Foundation, UIKit, etc.)
- **MUST** group third-party packages second (alphabetically)
- **MUST** group project imports third (alphabetically)
- **SHOULD** use SwiftFormat to auto-format (`--sortedimports`)

## @testable Import Rule

- **MUST** only use `@testable import` in test targets
- **MUST NOT** use in production code (breaks encapsulation)
- **SHOULD** use public APIs when possible

## Preview Scoping & CI

SwiftUI #Preview macros cause CI build failures without `#if DEBUG`:

**Rules:**
- **MUST** wrap all #Preview macros in `#if DEBUG`
- **MUST** import SwiftUI inside the `#if DEBUG` block (not top-level)
- **RATIONALE:** Preview infrastructure unavailable in CI headless builds

## Conditional Compilation

Common conditions:
```
#if os(iOS) / #if os(macOS) / #if os(watchOS)
#if DEBUG / #if RELEASE
#if canImport(Framework)
#if targetEnvironment(simulator)
```

**Rules:**
- **MUST** use `#if canImport()` for framework availability
- **SHOULD** wrap debug imports in `#if DEBUG`

## SPM Target Isolation

**Rules:**
- **MUST** define all dependencies in Package.swift
- **MUST NOT** import modules not listed in target dependencies
- **SHOULD** enforce layering: UI → Model → Network (not reverse)

## No Speculative Imports

**Rules:**
- **MUST NOT** add imports "for future use"
- **MUST** add import only when compiler complains
- **SHOULD** remove unused imports before committing
