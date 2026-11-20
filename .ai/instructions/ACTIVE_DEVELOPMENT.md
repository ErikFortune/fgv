# Active Development Guidelines

This document covers guidelines specific to the libraries and surfaces currently under active development. These rules supplement the general coding standards.

## How to read this doc

This repo is a set of utility libraries with independent roadmaps but a **lockstep version policy** — when we publish, we publish everything. Most libraries see at least some reactive maintenance, but a handful (and specific packlets within them) are the current frontier and accept breakage freely; the rest carry stability obligations.

The active/production split is therefore **per-surface, not per-library**. A library can have both an established surface that needs compatibility care and an actively-developed packlet that doesn't. The lists below name the surfaces currently in the "free hand" zone; everything else is "handle with care" by default.

## Currently active surfaces

| Library | Active surface(s) | Notes |
|---------|-------------------|-------|
| `ts-extras` | `ai-assist`, `crypto-utils`, `async-control` | Established packlets (csv, record-jar, yaml, mustache, hash, conversion, zip-file-tree) are stable — handle with care |
| `ts-app-shell` | All packlets | New library, no consumers yet outside this repo |
| `ts-http-storage` | All | New library |
| `ts-web-extras` | All | New library |
| `ts-prompt-assist` | All | New library (v0.1; design + initial implementation in flight via the `ts-prompt-assist` workstream) |
| `ts-agent-memory` | All | New library (v1 shipped, one close consumer coordinating adoption; treated as still pre-1.0/malleable — breaking changes land freely with no shim, e.g. the 2026-07 rank-axis, scope-qualified-edge, and vector-scoping streams) |
| `ts-agent-memory-sqlite-vec` | All | Companion to `ts-agent-memory`; carries the same pre-1.0 posture and moves in lockstep with its seams (it implements `IVectorIndex` / `IFragmentVectorIndex`, so a contract change there lands here in the same PR) |
| `ts-extras-re2` | All | New library, never on `main`; pins `re2js` exactly, and each bump is reviewed against the README's dialect table |
| `ts-extras-system-one` | All | New library, never on `main`; a Result boundary over a young 0.x SDK (`@typesafe-ai/sdk` `~0.6.0`), so every SDK minor is a wire change reviewed against the behaviours its README lists |
| `ts-agent-tasks` | All | New library, **not yet on `main`** — being built slice by slice on `integration/agent-tasks-v1` per `docs/design/agent-tasks/implementation-plan.md`. T1 shipped ~101 union members across 15 closed sets with roughly half *choice*-unexercised, so each later slice is the first to exercise part of that vocabulary and **holds explicit licence to revise it**; the slice that revises also updates T1's declared-vs-exercised table. Breaking changes land freely with no shim |

Anything not listed above — including production libraries like `ts-utils`, `ts-res`, `ts-bcp47`, `ts-json`, `ts-json-base`, `ts-random`, `ts-utils-jest`, `ts-res-ui-components` — carries stability obligations. See [Compatibility Rules](#compatibility-rules).

## Moved out

The sudoku packages (`ts-sudoku-lib`, `ts-sudoku-ui`, `apps/sudoku`) moved out of this repo, with their history, before 5.1.0.

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

**The test: did the code this change breaks ever ship in a non-alpha release?** Check the release
train — `release/<major>`, which always equals what is on npm for that major (or the
`<package>_v<version>` tag of the last stable publish) — not `main`, the trunk, which carries
everything merged since. If the surface has only ever reached consumers in alphas (`5.2.0-NN`), the
answer is no, and the change is **`minor`** however thoroughly it breaks. Only a surface present in
a stable publish can take `major`.

Type it `minor` and keep the `BREAKING:` prefix on the comment. That prefix is the part alpha
consumers actually need — it tells them what to fix — and it is the established form here: as of
2026-09-25 all fifteen `BREAKING`-prefixed pending change files are typed `minor`, thirteen with the
plain prefix, ten of them on `ts-agent-memory`. Use `BREAKING (implementers only):` when widening an
interface breaks implementations but not callers.

**Worked check, 2026-09-25.** Five pending change files claimed `major`. Every one failed the test
(at the time `main` was the published non-alpha line; under the current branch model that role is
`release/<major>`'s):

| package | what `main` holds | verdict |
|---|---|---|
| `@fgv/ts-extras` (×2, `ai-assist`) | `ts-extras` 5.0.2, packlets `conversion` `csv` `experimental` `hash` `record-jar` `zip-file-tree` — **no `ai-assist` at all** (0 occurrences repo-wide on `main`) | `minor` |
| `@fgv/ts-app-shell` | package absent from `main` | `minor` |
| `@fgv/ts-prompt-assist` | package absent from `main` | `minor` |
| `@fgv/heft-dual-rig` | present, but `"private": true` at 0.1.0 — never published at all | `minor` |

Four independent streams reached for `major` between 2026-03 and 2026-09 because this rule was
unwritten, and the most recent cited an earlier one as precedent — a miscategorisation citing a
miscategorisation. That is the cost of leaving it implicit, which is why it is here.

**What the `type` actually does in this repo — and does not.** Every publishable project is on the
`base-utils` lockstep policy, so the `type` drives **neither the version number** — that is the
policy's: a stable publish takes it from the `publish/<version>` branch name and writes it with
`rush version --ensure-version-policy --override-version <version>-0` then `rush version --bump
--override-bump patch` (see `.github/workflows/publish-release-impl.yml`) — **nor anything about
other packages**. It **does** decide which section of the package's CHANGELOG the entry renders
under, and that CHANGELOG ships to consumers:

| change file `type` | `CHANGELOG.json` bucket | `CHANGELOG.md` heading |
|---|---|---|
| `major` | `major` | `### Breaking changes` |
| `minor` | `minor` | `### Minor changes` |
| `patch` | `patch` | `### Patches` |
| `none` | `none` | `### Updates` |

**The evidence is the 5.1.0 publish** (`d198bfda6`, "Publish 5.1.0", on `release/5` and merged back
to `main` by #799). Every `base-utils` package went to exactly 5.1.0, yet the sections differ by
type: `ts-utils`' 5.1.0 entry carries `major` 1 / `minor` 8 / `patch` 4 in `CHANGELOG.json` and renders
`### Breaking changes`, `### Minor changes` and `### Patches`; `ts-web-extras` adds `### Updates`;
across the repo the 5.1.0 sections show `### Breaking changes` in five packages. A `major` typed
change file is therefore a visible claim to consumers, under a heading that says so.

**Why an earlier version of this section said the opposite.** It reasoned from rush's source that
lockstep projects are treated as manually versioned and their change type forced to `none`, so
everything renders under `### Updates`. That is how the pre-5.1.0 stable sections look (5.0.x shows
only `### Updates`), because those sections were written through `rush publish`, not `rush version
--bump`; the 5.1.0 workflow runs `--bump`, and `--bump` renders by type. Do not reason about this
from rush's source again — read the published CHANGELOG.

Type it correctly, then, for two reasons: `common/changes/` is read as precedent by the next stream,
and the type is the heading a consumer reads. A wrong `major` puts a non-breaking change under
"Breaking changes" in a shipped CHANGELOG. It still has no version consequence — a design argument
that expects one is arguing from a mechanism this repo doesn't have.

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
