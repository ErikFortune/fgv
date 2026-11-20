# Handoff: `@fgv/ts-agent-memory` fragment-retrieval cycle (N-Ask5) — clean close

> **Branch-model note (2026-11-20).** Written under the pre-5.1.0 model, where `release` was the
> branch every PR targeted and `main` the promoted line. Since 5.1.0 the trunk is `main`, trains are
> `release/<major>`, and the old `release` branch is deleted
> (`.ai/conventions/workflow/branch-buffer-and-promotion.md`). Read "`release`" below as history;
> for any instruction it gives, the branch today is `main`.

**Date:** 2026-07-20. **State:** clean — nothing in flight, all four PRs merged to `release`.
This documents a *completed* cycle plus the horizon items that were surfaced but never
formally requested, so a successor can pick up cold.

## What shipped (all merged to `release`)

The full **N-Ask5 fragment-granular semantic retrieval** feature, across four PRs:

| PR | Package | Content |
|----|---------|---------|
| #561 | `@fgv/ts-agent-memory` | `IFragmentLocator` / `IEmbeddedFragment` / `IFragmentVectorIndex` (sibling of `IVectorIndex`, **not** `extends`), additive `IVectorQueryHit.locator?`, `FragmentEmbedder`, `InMemoryFragmentCosineIndex`, `FragmentSemanticRetriever` (per-fragment hits, **not** an `IMemoryRetriever`), store `fragmentIndex?`/`fragmentEmbedder?` best-effort embed-on-write + remove lifecycle |
| #562 | `@fgv/ts-agent-memory-sqlite-vec` | `SqliteVecFragmentIndex` — durable `IFragmentVectorIndex` (`vec0` `PARTITION KEY` on `target_key`, `[start,end)` in aux columns; safe-integer-hardened) |
| #563 | `@fgv/testbed` | `sqlite-vec-fragment-persistence` scenario + a "Running scenarios" README section |
| #564 | docs | `LIBRARY_CAPABILITIES.md` + `FUTURE.md` marked SHIPPED; embed-guard backported to the record-index demo |

**Two deltas from the pre-build design sketch** (recorded in the `FUTURE.md` SHIPPED block):
`IFragmentVectorIndex` is a sibling not `extends IVectorIndex`; the persistent impl is a
separate `SqliteVecFragmentIndex` class (PARTITION KEY), **not** a `(target_key, locator)` PK
extension of `SqliteVecVectorIndex` (Q7's sketch). Both were deliberate simplifications found
implementing against the real code.

## Read these first (binding artifacts)

- `docs/FUTURE.md` § "`@fgv/ts-agent-memory` — deferred consumer asks" — the N-Ask5 SHIPPED
  block + the N-Ask8 RETIRED block + the one remaining conditional ask.
- `.ai/instructions/LIBRARY_CAPABILITIES.md` — the `ts-agent-memory` / `ts-agent-memory-sqlite-vec`
  entries now describe the shipped fragment surface (source of truth for "does this exist yet").
- `.ai/notes/orchestrator/lessons-pending.md` L38–L40 — this cycle's lessons (see below).

## Ask-queue state — CLOSED

The personaility→fgv agent-memory ask queue is **closed out**: four early asks built,
N-Ask5 shipped, N-Ask8 retired. Nothing firm is outstanding.

## Horizon items (surfaced, NOT formally requested — do not build unprompted)

1. **Publish.** `release` carries the whole tranche unpublished. The next `release`→`main`
   promotion ships it; bump `.ai/BASELINE.md` at that point. Erik's call.
2. **Unified record+fragment retrieval.** `FragmentSemanticRetriever` is deliberately *not* an
   `IMemoryRetriever` — a consumer wiring both semantic paths queries two retrievers. A
   `HybridRetriever`-style union (or a fragment capability on `HybridRetriever`) that merges
   record + fragment hits is the natural next increment **once a consumer actually uses both**.
   File as a deferred ask when that surfaces; don't pre-build.
3. **Per-fragment incremental update (N-Ask5 Q4, deferred).** v1 is whole-record re-embed
   (`addFragments` replace-all). Incremental per-fragment update becomes valuable only when
   knowledge docs are large / partially re-authored. Consumer-triggered.
4. **Fragment ANN / large-N.** Both fragment backends are brute-force (same "thousands of
   records" regime as the record index). ANN is a different backend behind the same seam;
   out of scope until N grows.
5. **Browser persistent fragment index.** `sqlite-vec` is Node-only, so a browser consumer has
   only `InMemoryFragmentCosineIndex` (ephemeral). No durable browser fragment backend exists.
   Gap only if a browser consumer wants persistent fragments.
6. **Conditional `resolveHandle`** (already in `FUTURE.md`) — the single remaining non-firm
   consumer ask (input-side handle → `(kind, entityId)`), build-ready, triggers only if the
   consumer adopts the substrate's `memory_context` / `memory_read` tool bodies.

## Lessons (L39 codified this PR; L38 + L40 parked for next batch)

- **L38** — native-boundary packages (wrapping a lib with runtime modes like better-sqlite3
  safe-integer mode) are a **layer-1 blind spot**; expect a *substantive* Copilot loop even
  after a clean `code-reviewer` pass. → CODING_STANDARDS review-loop discipline.
- **L39** — **CODIFIED 2026-07-20** (in this PR, #565) → `CODE_REVIEW_CHECKLIST.md` § Priority 3
  "Documentation / TSDoc": cross-package `{@link}` bakes an `ae-unresolved-link` warning into the
  checked-in api.md; only `{@link}` this package's own exports (code spans for other-package
  symbols; `{@inheritDoc OtherPkg.method}` is the one tolerated cross-package ref). Graduated
  immediately because it recurred (#558 → #562).
- **L40** — release-durable docs must cite PRs / on-release artifacts, never active-branch task
  files (N-Ask5's `FUTURE.md` had a dangling `n-ask5-firmup/` reference). → artifact-protocol.

## What a fresh orchestrator should do first

1. If Erik wants to publish: run the `release`→`main` promotion and bump `.ai/BASELINE.md`.
   Otherwise nothing — this cycle is idle-clean.
2. Do **not** re-open #561–#564 or rebuild anything above; the tranche is done.
3. The other active board items (`messages-log-levels`, `prompt-assist-screeners` in
   `docs/WORKSTREAMS.md`) are **separate streams, not part of this cycle** — don't assume ownership.

## Things NOT to do

- Don't build any horizon item (2–6) without an explicit request — they are intentionally
  deferred with consumer triggers.
- Don't reference active-branch task artifacts from release docs (L40).
- Don't stack a new PR on a merged branch; branch fresh from `release`.
