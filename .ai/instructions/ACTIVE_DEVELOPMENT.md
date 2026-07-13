# Active Development Guidelines

This document covers guidelines specific to the libraries and surfaces currently under active development. These rules supplement the general coding standards.

## How to read this doc

This repo is a set of utility libraries with independent roadmaps but a **lockstep version policy** — when we publish, we publish everything. Most libraries see at least some reactive maintenance, but a handful (and specific packlets within them) are the current frontier and accept breakage freely; the rest carry stability obligations.

The active/production split is therefore **per-surface, not per-library**. A library can have both an established surface that needs compatibility care and an actively-developed packlet that doesn't. The lists below name the surfaces currently in the "free hand" zone; everything else is "handle with care" by default.

## Currently active surfaces

| Library | Active surface(s) | Notes |
|---------|-------------------|-------|
| `ts-extras` | `ai-assist`, `crypto-utils` | Established packlets (csv, record-jar, yaml, mustache, hash, conversion, zip-file-tree) are stable — handle with care |
| `ts-app-shell` | All packlets | New library, no consumers yet outside this repo |
| `ts-http-storage` | All | New library |
| `ts-web-extras` | All | New library |
| `ts-prompt-assist` | All | New library (v0.1; design + initial implementation in flight via the `ts-prompt-assist` workstream) |
| `ts-agent-memory` | All | New library (v1 shipped, one close consumer coordinating adoption; treated as still pre-1.0/malleable — breaking changes land freely with no shim, e.g. the 2026-07 rank-axis, scope-qualified-edge, and vector-scoping streams) |

Anything not listed above — including production libraries like `ts-utils`, `ts-res`, `ts-bcp47`, `ts-json`, `ts-json-base`, `ts-random`, `ts-utils-jest`, `ts-res-ui-components` — carries stability obligations. See [Compatibility Rules](#compatibility-rules).

## Out-of-scope packages

The sudoku packages (`ts-sudoku-lib`, `ts-sudoku-ui`) are slated to move to their own monorepo. Don't queue active development against them in this repo's workflow substrate.

---

## Compatibility Rules

### Active surfaces: No Compatibility Burden

Code on the active surfaces listed above is **new enough that compatibility is not a consideration**:

- **Do not** preserve deprecated values, types, or re-exports
- **Do not** add backwards-compatibility shims or renamed aliases
- **Do not** leave dead code "just in case"
- If a change is necessary or appropriate, **break compatibility and fix consumers** rather than accumulating cruft
- Trying to preserve compatibility in new code leads to bloat and confusion

### Established surfaces: Be Careful

Everything else carries stability obligations:

- Breaking changes require careful consideration of downstream impact
- **When in doubt, ask** before making breaking changes
- Follow semantic versioning principles within the lockstep policy (a breaking change anywhere bumps everyone — that's a real cost)
- Check for consumers before removing or renaming exports

### The lockstep-version wrinkle

Because we publish everything together, a breaking change on an established surface is more expensive than it looks: every package's version moves, every consumer integrates a delta that includes things they didn't ask for. Prefer additive or aliased changes on established surfaces when feasible; reserve genuine breaks for cases where the new shape is materially better and the migration cost is justified.

---

## Testing Philosophy During Active Development

### Prioritize Functional Breadth Over Measured Coverage

The repo requires 100% coverage to merge to `main`, but during active development:

1. **Focus on functional correctness** - Write tests that verify behavior, not just hit lines
2. **Coverage metrics come later** - Once code settles down, fill coverage gaps systematically
3. **Don't skip tests** - Still write tests, just prioritize breadth of behavior over coverage percentage

### Balance Effort vs Value

- Don't spend an hour writing tests for a 5-minute fix
- When in doubt, ask

---

## General Principles

### Correctness Over Convenience

Prioritize correctness over ease, convenience, or brevity:

- Follow all repo guidelines including Result pattern with chaining
- Don't take shortcuts that sacrifice type safety or error handling
- A correct, slightly verbose solution is better than a clever but fragile one
