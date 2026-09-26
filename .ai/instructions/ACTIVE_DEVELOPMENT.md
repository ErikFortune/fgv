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
| `ts-agent-memory-sqlite-vec` | All | Companion to `ts-agent-memory`; carries the same pre-1.0 posture and moves in lockstep with its seams (it implements `IVectorIndex` / `IFragmentVectorIndex`, so a contract change there lands here in the same PR) |
| `ts-agent-tasks` | All | New library, **not yet on `release`** — being built slice by slice on `integration/agent-tasks-v1` per `docs/design/agent-tasks/implementation-plan.md`. T1 shipped ~101 union members across 15 closed sets with roughly half *choice*-unexercised, so each later slice is the first to exercise part of that vocabulary and **holds explicit licence to revise it**; the slice that revises also updates T1's declared-vs-exercised table. Breaking changes land freely with no shim |

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

### How to type a change file: `major` means "breaks code that shipped non-alpha"

A change file's `type` is a claim about **what the change breaks for someone who consumes a published
package**. It is not a measure of how big or how breaking the diff is.

**The test: did the code this change breaks ever ship in a non-alpha release?** Check `main` — the
published non-alpha line — not `release`. If the surface has only ever reached consumers in alphas
(`5.1.0-NN`), the answer is no, and the change is **`minor`** however thoroughly it breaks. Only a
surface present on `main` can take `major`.

Type it `minor` and keep the `BREAKING:` prefix on the comment. That prefix is the part alpha
consumers actually need — it tells them what to fix — and it is the established form here: as of
2026-09-25 all fifteen `BREAKING`-prefixed pending change files are typed `minor`, thirteen with the
plain prefix, ten of them on `ts-agent-memory`. Use `BREAKING (implementers only):` when widening an
interface breaks implementations but not callers.

**Worked check, 2026-09-25.** Five pending change files claimed `major`. Every one failed the test:

| package | what `main` holds | verdict |
|---|---|---|
| `@fgv/ts-extras` (×2, `ai-assist`) | `ts-extras` 5.0.2, packlets `conversion` `csv` `experimental` `hash` `record-jar` `zip-file-tree` — **no `ai-assist` at all** (0 occurrences repo-wide on `main`) | `minor` |
| `@fgv/ts-app-shell` | package absent from `main` | `minor` |
| `@fgv/ts-prompt-assist` | package absent from `main` | `minor` |
| `@fgv/heft-dual-rig` | present, but `"private": true` at 0.1.0 — never published at all | `minor` |

Four independent streams reached for `major` between 2026-03 and 2026-09 because this rule was
unwritten, and the most recent cited an earlier one as precedent — a miscategorisation citing a
miscategorisation. That is the cost of leaving it implicit, which is why it is here.

**What the `type` actually does in this repo — and does not.** All 31 publishable projects are on the
`base-utils` lockstep policy, which declares `nextBump`. Rush treats such projects as *manually
versioned*: `VersionManager` passes them to `ChangeManager` as `projectsToExclude`, and
`PublishUtilities._addChange` then forces `currentChange.changeType = ChangeType.none` for every one
of them. So the `type` drives **neither the version number** (that comes from the policy's `version`
+ `nextBump`) **nor the CHANGELOG section** (lockstep entries all render under `### Updates`).

The `### Breaking changes` heading is unreachable under this config, and the two `CHANGELOG.md` files
that carry one — `ts-utils` and `ts-utils-jest`, both at 2.0.0, 2023-04-10 — predate
`version-policies.json`, which did not exist in the repo until 2023-07-31. Under individual
versioning the `type` did drive both the version and the section; do not read those entries as
evidence that it still does.

The field is therefore inert at publish time. Type it correctly anyway: `common/changes/` is read as
precedent by the next stream, and a wrong `major` is a false statement about what we shipped. Do not
reach for it expecting a version consequence — there isn't one, and a design argument that assumes
otherwise is arguing from a mechanism this repo doesn't have.

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
