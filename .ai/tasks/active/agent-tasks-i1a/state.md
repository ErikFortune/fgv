# State — `agent-tasks-i1a`

**Purpose of this file.** If the session crosses a context boundary, `brief.md` plus this file must
be enough to resume cold. Keep it current as you go.

---

## Status

**PR open (#702); Copilot round 1 fixed; every gate green on `301a09f1` (2026-09-28).** CI green;
package suite 2,062 passing at 100 % with zero `c8 ignore`; repo-wide rebuild and test exit 0; five
verify scripts 0 failed; revert matrix on `301a09f1`: 19 rows, 33 red tests, 0 UNVERIFIED or `0 red`.
Round 1 (1 high, 2 medium) all fixed; CodeRabbit's one finding withdrawn by CodeRabbit. Next: Copilot
round 2. If a round changes source, re-run the matrix on the new head.

## Branch

- `claude/agent-tasks-i1a`, cut from `integration/agent-tasks-v1` at `9b1af1821` — the T9 landing.
- PR targets `integration/agent-tasks-v1`, **not `release`**.
- Artifacts stay in `.ai/tasks/active/agent-tasks-i1a/`. This family finalizes at **cluster close**;
  do not run `/finalize-task`.

## What is on this base

T1–T9 are all landed: the envelope and registry (T1), the pure renderer (T2), durable records (T3),
indexed selection (T4), bound authority (T5), external sources (T6), subscriptions and exact-ID
acknowledgement (T7), retention and the qualified capacity profile (T8 / T8b), and the persistent
cascade stop (T9). Plus, from `release`, the `hasOwnProperty` null-prototype fix (#700).

Two facts from T8b worth carrying: the default profile admits **536 plain registrations**, bound by
`logical-bytes` rather than the 1,000 `non-archived-tasks` it advertises; and an update cannot exceed
**37,417 bytes**.

## Why this slice is read-only, and the boundary that proves it

I1 is **four slices, split up front** (plan § I1). I1a is the packlet, the factory and the read-only
surface; I1b adds mutation opt-ins; I1c the generated command tools; I1d the stop tools.

The split exists because T7 and T9 each landed at 65+ files and +11,000 lines with the review loop
still finding structural defects at round 6+. It is not a convenience — I1's own review gate says
*"read-only use has no mutation dependency,"* and shipping a read surface with no mutation code in
the package is the strongest available proof of that. **If this slice needs anything from
`IBoundTaskWriter`, that is a finding to surface, not a scope to widen.**

## The dependency this slice adds

`ts-agent-tasks` currently depends on `@fgv/ts-json-base`, `@fgv/ts-utils` and `tslib` — nothing else.
This slice adds **`@fgv/ts-extras`** for `AiAssist.IAiClientTool`, via `rush add -p`.

That matches `ts-agent-memory`, which takes a direct `@fgv/ts-extras` dependency and imports
`AiAssist` in its own `tools` packlet. The cost — a task-recording consumer pulls in crypto, csv, zip
and ai-assist — is known and accepted, because the plan names `ts-agent-tasks` as the affected
package and the precedent is settled.

## Verification standing at branch time

Orchestrator re-ran on T9's final source, independently of its claims:

- `rushx test` → 85 suites, **2,011 passed, 0 failed**, 100 % on every metric, zero `c8 ignore`,
  zero warnings.
- The four revert rows T9 repaired after its full matrix run, re-run independently: **T9-13 2 red,
  T9-14 1 red, T9-26 2 red, T9-66 1 red** — every claim reproduced, `0 UNVERIFIED or 0 red`.
- CI green on `d7677b845`.

## Work log

### 2026-09-28 — reading and design

**Shape.** New `tools` packlet. `createTaskTools({ view, renderer?, budget? })` →
`Result<ReadonlyArray<AiAssist.IAiClientTool>>` with exactly two tools, `task_query` and
`task_inspect`. The factory takes an `IBoundTaskView` and calls nothing on it; each `execute`
revalidates its arguments with its own schema, then calls `view.query` / `view.inspect` — authority
is asked per call, never cached. No selection parameter: which mutation tools exist and how they are
opted into is I1b's to spell.

**Bounding reuses T2's renderer.** Every task the model sees reaches it as `TaskContextRenderer`
text (bounded by the context budget, escaped, framed). A page item the renderer omitted or
abbreviated is named by id (`omitted` / `abbreviated`) so the model can `task_inspect` it — without
that, `nextCursor` would silently skip past tasks the text dropped. The receipt is discarded:
tools acknowledge nothing. `limit` is 1..`budget.context.maxItems`, default the maximum; out of
range fails. Details (only present when the host's `ITaskProjector.details` opted in) are included
only when their JSON is within `budget.maxDetailsChars`; otherwise `detailsOmitted: 'too-large'`.
Failure messages are truncated to a fixed bound (a converter echoes the model's own input).

**Failing projector → the call fails.** Both projectors on the path (the view's `ITaskProjector`,
the renderer's projection) already fail closed; the tool propagates the failure and returns no
partial page. "Yield less" was rejected: dropping one item from a page misstates completeness and
advances the cursor past a task the model never saw.

**Misfit found in the renderer (surfaced, and extended rather than worked around).** A bound view
emits `IProjectedUnresolvedReference` — no `binding`, by design — but the renderer's input requires
`IUnresolvedTaskReference`, binding included, which it then never renders. Fabricating a binding
would be a workaround. The extension: the renderer accepts an unresolved reference whose binding is
optional, through a **new, separate** converter — `context.unresolvedReference` is also the
*storage* converter for persisted records (`storageConverters.ts`), and widening it would let a
stored reference lose its binding. Touches `types/context.ts`, `contextConverters.ts`,
`context/renderer.ts`, `context/normalize.ts` — outside the tools packlet, inside the package, on an
active surface.

### 2026-09-28 — implementation, layer 1, matrix

- Scenario tests came out at 100 % coverage without a closure pass.
- The Gemini capture test first found no tools: the wire key is `function_declarations`. The test
  was wrong, not the tools — recorded in `result.md` because it is the failure mode the test exists
  to catch, and it was investigated before being believed.
- Layer 1 (`code-reviewer`): no P1. P2-1 — a rejecting/throwing view reached the model unprefixed
  and untruncated through `thenOnSuccess`'s own capture — fixed with `_read`. P3s documented or fixed.
- Revert matrix: 18 rows (`I1a-1`…`I1a-18`) added to `perf/mutationMatrix.js`, run with `--pkg` on a
  copy of the final source.
- Routed to `docs/TECH_DEBT.md`: unframed details (I2), `JsonSchema.integer` has no range.

### 2026-09-28 — preliminary matrix (pre-format source; the final run is still owed)

17 of 18 rows red. **I1a-18 came back `0 red` and the mutant was at fault, not the protection:**
`.optional().withConstraint(b => b !== undefined)` is a no-op, because `strictObject` never invokes
an absent optional field's converter. Re-pointed to drop `.optional()` → **4 red** (renderer,
converter, and two tool suites). The rule "a `0 red` row is a finding" held — the finding was about
the mutant.

## Open questions for the orchestrator

_(raise here and surface, rather than reconstructing intent and proceeding)_

Two are anticipated:

1. **What a failing host projector should do.** The memory precedent degrades to the *full* body,
   which is the wrong direction when bounding is the default. Yielding less, or failing the call,
   are both defensible — decide, implement, and record the reasoning; do not inherit the precedent's
   choice by accident.
2. **Whether `TaskContextRenderer` fits.** T2 already bounds and returns an inclusion receipt.
   Reusing it is preferred over a second bounding story; if it does not fit, say what does not fit
   rather than working around it.
