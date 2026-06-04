# `ts-prompt-assist-observability` — state

**Stream:** `ts-prompt-assist-observability`
**Integration branch:** `ts-prompt-assist-observability`
**Status:** Phase B complete; Phase C ready to commission (2026-06-04)

---

## Phase A — design spike — COMPLETE

PR #455 merged 2026-06-04 (squash `9794da60c`). Output: `design.md` answering Q1/Q2/Q3/Q4 + 8 OQs + a resolved hook-ordering note.

Headline: **hybrid C-minimal + D** — `RetainingRingBuffer<T>` in `@fgv/ts-utils` + schema-aware `PromptObservationStore` in `@fgv/ts-prompt-assist`. Falsifiability cleared by an existing second consumer (`RetainingLogger` itself).

## Phase B — triage — COMPLETE

Triage doc: `.ai/tasks/active/ts-prompt-assist-observability/phase-b-triage.md`. All eight OQs locked at the Phase A leans (no divergences). `RetainingLogger` refactor to compose the new buffer **deferred out of Phase C** to preserve additive scope; committed as a separate stream — see below.

## Phase C — implementation — READY TO COMMISSION

Targets the existing integration branch `ts-prompt-assist-observability`. Agent forks a new work branch off integration. PR targets integration.

- [ ] Read the merged `design.md` and `phase-b-triage.md` on the integration branch
- [ ] `RetainingRingBuffer<T>` lands in `@fgv/ts-utils`
- [ ] `IPromptObserver`, `IPromptObservationRecord` (`phase`-discriminated union), `IPromptObservationQuery`, `PromptObservationStore` land in `@fgv/ts-prompt-assist`
- [ ] DI wiring: additive `observers?: ReadonlyArray<IPromptObserver>` on `IPromptLibraryCreateParams`
- [ ] Hook fires at the three public method boundaries (`resolve` / `resolveJsonOutput` / `resolveFreeTextOutput`); never inside `_resolveInternal`
- [ ] OQ-3: async + awaited default + fire-and-forget opt-in; **documented + tested** (slow-observer test asserting `resolve()` returns before observer completes in fire-and-forget mode)
- [ ] Privacy posture documented in TSDoc
- [ ] `code-reviewer` agent runs BEFORE 100%-coverage closure (L37)
- [ ] Gates green: build / lint clean / 100% coverage in both libraries
- [ ] LIBRARY_CAPABILITIES.md updated for both `@fgv/ts-utils` and `@fgv/ts-prompt-assist`
- [ ] Artifact migration in the cluster-close PR (per PR #452 codification)

## Companion stream — committed, not parking-lot

`.ai/tasks/active/retaining-logger-ring-buffer-refactor/brief.md` — sibling brief committed on this integration branch (lands on `release` when the cluster closes). Commission immediately after the observability cluster closes. Brings `RetainingLogger` onto the new buffer, retiring the duplicated ring.

---

## Decisions made (Phase A → Phase B)

| Decision | Source |
|---|---|
| Hybrid C-minimal + D for the storage substrate | OQ-6 (locked Phase A; reconfirmed Phase B) |
| `seq` + `contentHash` side-by-side on every record | OQ-1 |
| Observer error → `this.logger.warn` (no new param) | OQ-2 |
| Async, awaited default; fire-and-forget opt-in | OQ-3 |
| v0.1 failure records error-only (no partial trace) | OQ-4 |
| Two cross-linked records via `linkedResolveSeq` | OQ-5 |
| No standalone `MultiPromptObserver` class for v0.1 | OQ-7 |
| Output record references body via `linkedResolveSeq`, not duplicate | OQ-8 |
| `PromptObservationStore` IS the `IPromptObserver` (observe + query on one class) | Phase A design |
| Hook fires at public method boundary only; inner resolves roll up under outer trace | Phase A design |
| `RetainingLogger` refactor deferred out of Phase C to a committed fast-follow | Phase B triage + OQ-6 amendment |

---

## Follow-up findings filed

- `findings/inbox/2026-06-04-ring-buffer-seq-authority.md` — Phase C refinement of the Phase A buffer sketch: `RetainingRingBuffer<T>` ships as a **pure seq-ring** (caller mints seq+timestamp); `PromptLibrary` owns the single seq authority. Forced by OQ-5 `linkedResolveSeq` cross-store consistency under multi-observer fan-out. Also the minimal-blast-radius shape for the `retaining-logger-ring-buffer-refactor` fast-follow. **Read this before the fast-follow.**

## Phase C progress (implementation in flight)

- [x] `RetainingRingBuffer<T>` in `@fgv/ts-utils` collections packlet; 25 unit tests; 100% on the file
- [x] `observe` packlet in `@fgv/ts-prompt-assist`: `IPromptObserver`, `IPromptObservationRecord` union, `IPromptObservationQuery`, `PromptObservationStore`
- [x] additive `observers?` on `IPromptLibraryCreateParams`; `_observe` fan-out at the three public boundaries
- [x] OQ-3 awaited-default + fire-and-forget opt-in (per-observer `fireAndForget` flag) — tested both directions
- [x] build + lint clean in both libraries; 224 ts-prompt-assist tests green
- [x] `code-reviewer` pass on cumulative diff — 0 P1, 3 P2, 3 P3:
  - P2-1 (swallow airtight): verified correct, no change.
  - P2-2 (2 new `ae-unresolved-link` warnings): **fixed** — promoted `IRetainedRecord` / `IRetainingRingBufferCreateParams` / `IRetainingRingBufferQuery` to top-level exports; warnings cleared.
  - P2-3 (`_observationNow` no test seam): accepted — intentional (single additive field); reviewer confirmed no coverage gap.
  - P3-1 (`onFailure` returning `fail` misleading): **applied** — `_safeObserve` now uses `isFailure()`.
  - P3-2 (`IPromptObservationStoreCreateParams` placement): accepted — matches `IPromptLibraryCreateParams` (co-located with its class).
  - P3-3 (member-level `@link`): accepted — pre-existing API Extractor limitation.
  - Coverage rec (mixed awaited+fire-and-forget test): **added**.
- [x] coverage closure: `@fgv/ts-utils` 1594 tests, `RetainingRingBuffer` 100%; `@fgv/ts-prompt-assist` 226 tests, observe + promptLibrary.ts 100% (all metrics)
- [x] LIBRARY_CAPABILITIES.md updates (both libraries)
- [x] `rushx build` / `rushx lint` (clean) / `rushx test` (100%) / `rushx fixlint` — both libraries
- [ ] PR onto integration branch
