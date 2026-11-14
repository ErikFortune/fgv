# Stream brief — `agent-tasks-i1a`

**Slice I1a of four** — the tool factory and the read-only surface.
`docs/design/agent-tasks/implementation-plan.md` § I1.

## Mission

Create the `tools` packlet: a factory that produces `@fgv/ts-extras` `IAiClientTool`s over a bound
task view. **Read-only only** — `query` and `inspect`. Bounded outputs by default. Schema
revalidation inside `execute`.

**Dependencies:** T5–T8, all landed. **You do not need T9**, and you must not reach for it.

## Branch and PR posture

- **Branch:** `claude/agent-tasks-i1a`, created off `integration/agent-tasks-v1` at `9b1af1821`
  (the T9 landing) and pushed.
- **PR into `integration/agent-tasks-v1`** — **not `release`.**
- **Artifacts stay in `.ai/tasks/active/agent-tasks-i1a/`.** This family finalizes at **cluster
  close**, not per slice. Do **not** run `/finalize-task`.

---

## You are slice one of four, and the scope boundary is the point

I1 was split up front rather than mid-review. T7 and T9 each landed at 65+ files and +11,000 lines
with the review loop still finding structural defects at round 6+; this decomposition exists so that
does not happen a third time. The plan's § I1 carries the table. In short:

| slice | adds |
|---|---|
| **I1a — you** | the packlet, the factory, the read-only surface, bounded outputs, revalidation |
| I1b | tracked + reassignment mutation opt-ins, disabled by default |
| I1c | statically generated typed command tools |
| I1d | stop tools (the T9 opt-in) |

**Why read-only and nothing else.** I1's review gate says *"read-only use has no mutation
dependency."* The strongest proof of that is a shipped read surface with **no mutation code in the
package at all** — then I1b demonstrates the property holds by adding mutations on top, rather than
asserting a separation inside one large diff.

So: **if you find yourself needing anything from `IBoundTaskWriter`, stop.** That is the signal the
separation does not hold as designed, and it is a finding worth surfacing, not a scope to expand.
The seam is already in the types — `IBoundTaskView` is `query` / `inspect` / `inspectStop`, and every
mutating operation is on `IBoundTaskWriter`. (`inspectStop` is I1d's; leave it.)

## The precedent, and the exact thing in it not to copy

`libraries/ts-agent-memory/src/packlets/tools/memoryTools.ts` (737 lines) is the shape to follow: a
`create*Tools(params)` factory returning `IAiClientTool`s, `JsonSchema` parameter schemas, a resolved
context threaded into each `execute`. Read it first.

**The review gate names its defect: the "permissive full-body fallback."** Here it is, from the
precedent's own docstrings:

> *"When absent, the built-in default projection is used (full body plus the handle), which ignores
> the detail tier"* … *"the built-in default projection returns the full body regardless"*

So `memory_search` hands the model unbounded record bodies unless the host supplies `projectItem`.
**Bounding is opt-in there. In I1 it is the default** — that is what "bounded outputs" in the
acceptance criteria means. Concretely:

- There must be **no path** where a missing or failing host callback yields an unbounded result.
- The precedent guards `handleFor` / `projectItem` so a throw *degrades to the full body*. Degrading
  toward more disclosure is the wrong direction. A projector that throws should yield **less**, or
  fail the call — decide which, implement it, and say why in `result.md`.
- T2's `TaskContextRenderer` already bounds and returns an inclusion receipt. Prefer reusing that
  machinery over inventing a second bounding story; if it does not fit, say what does not fit.

## Acceptance properties that are yours (the rest belong to I1b–d)

- **No principal / scope / consumer overrides in schemas or execution.** The bound view already
  carries the principal; the model must not be able to name one. A schema that accepts a `principal`,
  `scope` or `consumer` field is the defect.
- **Direct calls with surplus fields fail.** Not ignored — failed.
- **Schema revalidation inside `execute`.** The harness validates before dispatch, but `execute` must
  not trust that it did: a direct call bypasses the harness entirely. Pin this by calling `execute`
  with malformed arguments *without* going through a harness.
- **Capability checks remain live.** Authority is asked at execution, never cached at factory time.
- **Bounded outputs**, per the section above.

Explicitly **not** yours: mutation opt-ins, generated command tools, stop tools, forged-actor and
revoked-authority cases (those need a mutation to revoke authority *for*).

## The test the plan singles out

> *"Capture ai-assist outbound request and assert tools were really sent — mocking a tool-call
> response alone is inadequate."*

This is the C-phase lesson codified in `TESTING_GUIDELINES.md`: a stream once reported a live testbed
success while `executeClientToolTurn` had never merged client tools into the request `tools` array,
so the model could not have called them. 100% coverage was measured on lines that mocked the
*response* side; **no test verified the request body.**

So: build a request, capture what ai-assist would actually send, and assert your tools are in it with
the schemas you expect. A test that mocks a tool call coming back proves nothing about whether the
tool was offered.

Also required: **`JsonSchema.toJson` wire assertions** — assert the emitted wire schema, not just
that a validator exists.

## The dependency you are adding

`ts-agent-tasks` currently depends on **only** `@fgv/ts-json-base`, `@fgv/ts-utils` and `tslib`. You
are adding its first dependency beyond those: **`@fgv/ts-extras`**, for `AiAssist.IAiClientTool`.

- Add it with **`rush add -p @fgv/ts-extras`** from the package directory — never by editing
  `package.json` (`MONOREPO_GUIDE.md`). It is a workspace dependency, so no minimum-release-age
  concern.
- This follows the precedent exactly: `ts-agent-memory` takes a direct `@fgv/ts-extras` dependency
  and imports `AiAssist` in its tools packlet.
- Worth knowing rather than re-deciding: it means a consumer who wants only task *recording* pulls in
  `ts-extras` (crypto, csv, zip, ai-assist). The plan says "Affected package: `ts-agent-tasks` tools"
  and the precedent is settled, so **follow it**. If you find a concrete reason the tools belong in a
  companion package instead, that is a finding to surface, not a decision to take.

## Review gates

1. **Layer 1, `code-reviewer` before coverage closure.**
2. Then the implementer-driven Copilot loop.

No separate antagonist pass this time — that requirement was T8's and T9's, for persistence and
cascade semantics. **Expect a shorter loop than T9's ten rounds**: this is a schema-and-projection
surface, not an ordering one. If it starts running long, that is worth surfacing, because on this
slice it would mean something different from what it meant on T9.

Still: the factory takes a principal-bound view and hands tools to a *model*, so a wrong answer
discloses. Enumerate in `result.md` every place a caller-supplied value reaches a read, and say what
constrains it.

## Package surface

`libraries/ts-agent-tasks` only — the new `tools` packlet, its types, converters and tests; the
`package.json` dependency; `CAPABILITIES.md`; this stream's artifacts; the plan's I1a status line and
this stream's ledger entry.

**Headroom.** Nothing in this package is near the 2000-line `max-lines` cap
(`storage/repository.ts` 1817 is the largest, 183 to spare), and you are writing a new packlet — but
the precedent is 737 lines in one file, so plan the file split before you approach it rather than
after. That cap is a promoted P1 and T8b paid it with a designed extraction.

## Gates

- [ ] `rushx build` **zero warnings**; `rushx lint`; `rushx fixlint` before the final commit
- [ ] `rushx test` at 100 % coverage with **zero `c8 ignore`**
- [ ] `rush change --verify --target-branch origin/integration/agent-tasks-v1`; type the change file
      **`minor`** (`ts-agent-tasks` has never been published, so `major` is wrong however breaking —
      `ACTIVE_DEVELOPMENT.md` § *How to type a change file*)
- [ ] Repo-wide `rebuild` **and** `test`, **on the final source** — you are adding a package
      dependency, which changes the build graph
- [ ] `verify-capability-docs`, `generate-capability-feed --check`, `verify-esm-entrypoints`,
      `verify-bundler-resolution`, `verify-tarball-exports`
- [ ] No `any`; all fallible operations return `Result<T>`
- [ ] **Revert matrix rows for this slice, run on the final source**, with per-row suite names
- [ ] Both review layers recorded in `result.md`
- [ ] The plan's I1a status line and this stream's ledger entry written as shipped **in this PR**

## Skills to load, and when

| when you are about to | load |
|---|---|
| write or review a converter, validator, or a `JsonSchema` | `/type-safe-validation` |
| write or review any `Result<T>`-returning code | `/result-pattern` |
| write or review tests | `/result-tests` |
| write anything that "feels general" | `/published-primitives-reflex` |

## Traps this cluster paid for

1. **The revert matrix is the highest-yield gate here, and it must run on final source.** It has
   found something material in three of the four slices that ran it: T3 (nine rows green, five real
   gaps), T8b, and T9 — where four rows came back green and **three were real**. Two of T9's tests
   passed for the wrong reason (a capacity profile where root *and* target overflowed, so each check
   was masked by the other), and one protection was masked by a backstop that no test drove.
2. **A single-mutation matrix cannot see a defence-in-depth pair.** T9 added `paired(...)` to
   `perf/mutationMatrix.js` for exactly this. If one of your protections has a backstop, use it.
3. **A test comparing a constant to a constant looks like a guard and is not.** This is what T9-13
   and T9-14 turned out to be.
4. **Quote a suite and a total, not a bare ratio** — T7 reported "22 of 28" for a falsifier that
   re-ran at 26 of 33, because "28" named nothing anyone could count.
5. **A brief's arithmetic is a claim like any other.** The orchestrator's capacity table for T8b
   modelled one dimension and concluded a limit was reachable; built, the profile bound on a
   different dimension at half that. Reproduce anything numeric here before relying on it.
6. **A review round that posts zero comments is not evidence of a clean diff** — read the
   previously-missed block. T8 PR 1 hit that twice in four rounds.
7. **A finding that lives only in a PR body is thrown away.** Route anything outliving this slice to
   `docs/TECH_DEBT.md` **in this PR**.

## Exit artifact

`result.md`, opening with a one-line `**Shipped:** …` that becomes the capability-feed `sourceLine`
verbatim. It must record:

- The factory shape, and **how bounding is the default** — including what a failing host projector
  does and why that direction was chosen.
- Every place a caller-supplied value reaches a read, and what constrains it.
- The request-body capture test: what was asserted, and that it would fail if tools were not sent.
- Confirmation that **no `IBoundTaskWriter` member is referenced anywhere in the packlet** — the
  evidence for I1's "read-only use has no mutation dependency" gate.
- The revert matrix rows, run on final source, with per-row suite names.
- Anything belonging to I1b/I1c/I1d, routed durably.

Keep `state.md` current. If the session crosses a context boundary, `state.md` plus this brief must
be enough to resume cold.

## Required reading, in order

1. This brief.
2. `docs/design/agent-tasks/implementation-plan.md` § I1 — including the split table.
3. `libraries/ts-agent-memory/src/packlets/tools/memoryTools.ts` — the shape to follow and the
   fallback not to copy.
4. `libraries/ts-extras/src/packlets/ai-assist/toolTypes.ts` — `IAiClientTool`,
   `IAiClientToolConfig`, `IAiToolAnnotations`.
5. `libraries/ts-agent-tasks/src/packlets/types/broker.ts` — `IBoundTaskView` vs `IBoundTaskWriter`.
6. `.ai/tasks/active/agent-tasks-t2/result.md` — the renderer's bounding and inclusion receipts.
7. `.ai/tasks/active/agent-tasks-t5/result.md` — bound authority; what a principal may see.
8. `.ai/instructions/TESTING_GUIDELINES.md` § *Coverage Gap Resolution* — the request-body lesson.

## Missing-input rule

If a required-reading file does not exist, or a plan section does not say what this brief claims,
**STOP and surface the gap.** Do not reconstruct intent from surrounding code and proceed.
