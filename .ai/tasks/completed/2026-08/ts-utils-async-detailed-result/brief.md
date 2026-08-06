# Workstream Brief: `ts-utils-async-detailed-result` — async chaining that keeps its detail

## Mission

Chaining an async step off a `DetailedResult<T, TD>` silently degrades it to a plain `Result<T>`,
losing `TD`. Close that gap in `@fgv/ts-utils`, then apply it in `@fgv/ts-extras`'s `safer-fetch`
packlet — the consumer that hit the wall hardest and the reason this stream exists.

## Status entering

Surfaced by the `safer-fetch-s3` stream (#601, merged as `b85b094b7`). Its deliverable 3 — a
Result-chaining pass over `saferFetch.ts` — landed only partially, and the implementing agent
recorded why in `.ai/tasks/completed/2026-08/safer-fetch-s3/state.md`:

> `thenOnSuccess` returns `AsyncResult<T>` and drops the `FetchFailureReason` detail, so async
> steps stay explicit awaits; that is a constraint of the current ts-utils surface, not a style
> choice.

**Verified against source on `release` @ `b85b094b7`:**

- `DetailedSuccess<out T, out TD> extends Success<T>` (`base/result.ts:994`) and
  `DetailedFailure<out T, out TD> extends Failure<T>` (`:1100`).
- Neither declares `thenOnSuccess` / `thenOnFailure`. They inherit the base implementations, whose
  signature is `thenOnSuccess<TN>(cb): AsyncResult<TN>` (`:407`, `:587`) — **no detail type
  parameter, and no `AsyncDetailedResult` exists.**
- So `someDetailedResult.thenOnSuccess(async (v) => ...)` type-checks, returns `AsyncResult<TN>`,
  and `TD` is gone.

**The dangerous part is that it is silent.** There is no error at the chain site — the loss only
surfaces later, as a type mismatch at whatever boundary expected the detail back, or not at all if
the caller was going to widen anyway. A consumer whose failure taxonomy *is* its product (exactly
`safer-fetch`) can lose it by writing idiomatic code.

**Scope of who is affected:** 49 non-test files across 7 packages reference `DetailedResult` —
`ts-utils` (14), `ts-json` (10), `ts-res` (9), `ts-utils-jest` (6), `ts-web-extras` (4),
`ts-json-base` (4), `ts-extras` (2). **Verify these counts yourself; do not trust this brief's
numbers.** The last two streams both found brief-supplied figures overstated or incomplete, and
that verification was worth more than the figures were.

## In-scope paths (you may modify)

- `libraries/ts-utils/src/packlets/base/result.ts` — the extension
- `libraries/ts-utils/src/packlets/base/index.ts` — exports, if the shape adds any
- `libraries/ts-utils/src/test/unit/**`
- `libraries/ts-utils/etc/ts-utils.api.md` — regenerate, never hand-edit
- `libraries/ts-extras/src/packlets/safer-fetch/saferFetch.ts` — the consumer pass (deliverable 3)
- `libraries/ts-extras/src/test/unit/safer-fetch/**` — only if the pass requires it
- `libraries/ts-extras/etc/ts-extras.api.md` — regenerate if the surface moves (it should not)
- `.claude/project/async-result-family-design.md` — a new section; this is that design's natural
  continuation
- `common/changes/@fgv/ts-utils/*.json`, `common/changes/@fgv/ts-extras/*.json`
- `.ai/instructions/LIBRARY_CAPABILITIES.md` — the `@fgv/ts-utils` `base` row, **only if** the
  public surface changes
- `docs/WORKSTREAMS.md` — this stream's own entry only

## Out-of-scope paths (you must NOT modify)

- **Every other `DetailedResult` consumer** — `ts-json`, `ts-res`, `ts-json-base`,
  `ts-utils-jest`, `ts-web-extras`. Do **not** sweep them onto the new surface. That is a
  behavior-affecting migration per package, exactly the reasoning `async-result-family-design.md`
  § 7 already recorded for the sync family's in-repo sites, and it wants its own scoping. If you
  find a consumer that is *already silently losing its detail*, **record it as a finding, do not
  fix it.**
- `libraries/ts-extras/src/packlets/safer-fetch/**` other than `saferFetch.ts` — the rest of the
  packlet was chained by S3 and is not this stream's business
- `libraries/ts-web-extras/**`
- The synchronous `Result` / `onSuccess` / `onFailure` path — this extension is **additive**; no
  existing signature changes, no existing behavior changes

## Required reading (load before writing code)

- `libraries/ts-utils/src/packlets/base/result.ts` — `Success`, `Failure`, `AsyncResult`,
  `DetailedSuccess`, `DetailedFailure`, and the existing `thenOnSuccess` / `thenOnFailure`
- `libraries/ts-utils/src/packlets/base/mapResultsAsync.ts` — the async family that shipped in
  #596; its naming, parameter order and deferral conventions are the ones to mirror
- `.claude/project/async-result-family-design.md` — especially § 2(c) (the two-class split) and
  § 6 (divergences found in implementation)
- `libraries/ts-extras/src/packlets/safer-fetch/saferFetch.ts` — the consumer; read `_execute`,
  `_connect`, `_receive`, `_nextHop`, `_raced`
- `.ai/instructions/CODING_STANDARDS.md` § "Result Pattern" and § "Extending Core Libraries Over
  Working Around Them"

## Missing-input rule (non-negotiable)

If any required-reading file doesn't exist or you can't access it: **STOP** and surface the gap.
Do not recreate it from codebase exploration, re-derive brief content, or improvise. Missing
required-reading is an orchestrator-level provisioning gap, not an agent-level workaround.

## Dependencies

**Hard:** none. Branch `ts-utils-async-detailed-result` exists, from `release` @ `b85b094b7`.
**Soft:** none. No other stream is in flight.

## v1 deliverables (in order)

1. **The `ts-utils` extension.** Async chaining off a `DetailedResult<T, TD>` must preserve `TD`.
   Shape is OQ-1. Additive only — the plain-`Result` path keeps its exact current signatures and
   behavior.
2. **Tests.** Cover detail preservation across a success chain, a failure chain, a rejected
   promise inside the callback, and a callback that throws synchronously — the async family's
   established rule is that neither escapes as an exception. Include a **type-level** assertion
   that the detail survives the chain: this bug type-checked, so a runtime-only test would not
   have caught it.
3. **The `safer-fetch` consumer pass.** Convert the sites in `saferFetch.ts` that the missing
   surface blocked. **Measure before you claim:** on `release` the file is 1,174 lines with 22
   `isFailure()`/`isSuccess()` checks and 12 chaining calls; a rough count suggested only ~3 of
   those 22 are on awaited values, which would mean the ts-utils gap explains a *minority* of the
   remainder. Establish the real split yourself and report it. Convert what genuinely converts;
   leave what does not and say why. `_execute`'s hop loop is legitimately exempt as loop control
   flow — that exemption is in `CODING_STANDARDS` and was upheld by S3's own reviewer.
4. **Docs, in this PR.** A new section in `async-result-family-design.md` recording the gap, the
   shape chosen, and why the in-repo migration is again deferred. `LIBRARY_CAPABILITIES.md` only
   if the public surface changed. This stream's ledger entry moved to Completed.

## Acceptance criteria (the stop point)

- [ ] An async chain off a `DetailedResult<T, TD>` preserves `TD`, with a **type-level** test that
      fails against today's code
- [ ] The synchronous path is untouched — no changed signatures, no changed behavior
- [ ] A rejected promise and a synchronously-throwing callback both become a `Failure` carrying
      the detail, never an escaped exception
- [ ] The `saferFetch.ts` pass reports a measured before/after split, not an impression
- [ ] No other `DetailedResult` consumer package is migrated (findings recorded instead)
- [ ] `rushx build` passes in every modified package
- [ ] **`rushx lint` passes in every modified package** *(not run transitively by build)*
- [ ] `rushx test` passes with 100% coverage in every modified package
- [ ] `rushx fixlint` run before the final commit
- [ ] No `any`; all fallible operations return `Result<T>`
- [ ] **Docs ship with the code, in this PR** — see `CODING_STANDARDS.md` § "Docs ship with the
      code"
- [ ] `code-reviewer` agent run on the final diff **before** chasing 100% measured coverage;
      findings resolved or dispositioned
- [ ] Copilot loop driven by the implementer; stopped on diminishing returns or the 10-round cap

## Handoff contract (what you publish)

- The detail-preserving async chaining surface — consumed by every `DetailedResult` package, and
  the thing that makes the deferred migrations expressible
- A measured account of what `saferFetch.ts` still cannot chain and why — the record that closes
  out S3's deliverable 3
- The design-doc section — where the next person looks before re-deriving this

## Open questions to resolve

- **OQ-1 — the shape.** Options: (a) an `AsyncDetailedResult<T, TD>` sibling of `AsyncResult<T>`,
  with `thenOnSuccess` / `thenOnFailure` overridden on `DetailedSuccess` / `DetailedFailure` to
  return it; (b) generic overloads on the existing methods that thread `TD` through; (c) distinct
  method names on the detailed classes. **Recommended: (a)** — it mirrors how `AsyncResult` already
  relates to `Result`, keeps the detail classes' overrides honest with their inheritance, and
  avoids overload-resolution ambiguity of the kind `allSucceedAsync` hit in #596 (recorded in
  `async-result-family-design.md` § 6). Escalate if the override turns out to violate
  variance — `DetailedSuccess<out T, out TD>` is covariant in both, and an override that
  needs a contravariant position is a signal to prefer (c).
- **OQ-2 — does `AsyncResult` itself need a detailed sibling, or only the entry points?** A chain
  that starts detailed and stays detailed needs the whole ladder. **Recommended:** build the
  ladder, but only as far as the methods that actually exist on `AsyncResult` today — do not
  invent new combinators in this stream.
- **OQ-3 — how far to take the `safer-fetch` pass.** If the measured split shows the ts-utils gap
  explained only a few sites, **do not force the rest**. Report the finding, convert what the new
  surface unblocks, and leave the remainder with a one-line reason. A chaining pass that hurts
  readability to raise a metric is the failure mode, not the goal. Escalate if the honest answer
  is "most of it should stay imperative" — that is a legitimate outcome and worth knowing.

## Findings-inbox convention

Findings go to `.ai/tasks/active/ts-utils-async-detailed-result/findings/inbox/<timestamp>-<slug>.md`
— one per file. In particular, **every other-package consumer you find silently losing its detail
belongs here, not in the diff.** The orchestrator drains the inbox into `followups.md`.

## Required exit artifact

On completion write `.ai/tasks/active/ts-utils-async-detailed-result/result.md` with: branch name;
one-paragraph summary; files changed; build/test/lint status per command; the **measured
before/after** for `saferFetch.ts`; an **observability self-audit**; a
**convention-compliance sweep** against `.ai/instructions/CODE_REVIEW_CHECKLIST.md`; a
**sibling-sweep pass** (the new surface's siblings are `AsyncResult` and the five async collectors
from #596 — did you diverge from their naming, parameter order, or failure conventions?); the list
of other-package consumers found losing detail; and any deviation from this brief.

## Resume protocol

If interrupted: re-read this brief in full, read
`.ai/tasks/active/ts-utils-async-detailed-result/state.md`, and confirm scope still applies.

## Why this is a `ts-utils` stream and not a `safer-fetch` cleanup

The tempting scope is "tidy up `saferFetch.ts`". That fixes one file and leaves the trap armed for
the next package that makes a `DetailedResult` chain go async — and the trap is silent, so the next
package will not notice either. `CODING_STANDARDS` § "Extending Core Libraries Over Working Around
Them" names this exact choice and defaults to extending the primitive. `safer-fetch` is here as the
extension's **first real consumer**, which is also what keeps the extension from shipping
speculatively.
