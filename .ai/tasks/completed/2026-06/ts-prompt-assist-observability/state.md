# `ts-prompt-assist-observability` — state

**Stream:** `ts-prompt-assist-observability`
**Integration branch:** `ts-prompt-assist-observability`
**Status:** Cluster CLOSED 2026-06-05 via PR #460 (integration → release). Substrate archived to `.ai/tasks/completed/2026-06/`.

---

## Phase A — design spike — COMPLETE

PR #455 merged 2026-06-04 (squash `9794da60c`). Output: `design.md` answering Q1/Q2/Q3/Q4 + 8 OQs + a resolved hook-ordering note.

Headline: **hybrid C-minimal + D** — `RetainingRingBuffer<T>` in `@fgv/ts-utils` + schema-aware `PromptObservationStore` in `@fgv/ts-prompt-assist`. Falsifiability cleared by an existing second consumer (`RetainingLogger` itself).

## Phase B — triage — COMPLETE

Triage doc: `.ai/tasks/completed/2026-06/ts-prompt-assist-observability/phase-b-triage.md`. All eight OQs locked at the Phase A leans (no divergences). `RetainingLogger` refactor to compose the new buffer **deferred out of Phase C** to preserve additive scope; committed as a separate stream — see Companion stream below.

## Phase C — implementation — COMPLETE

PR #456 merged 2026-06-04 to the `ts-prompt-assist-observability` integration branch. Cluster-close PR #460 squash-merged the integration branch → `release` on 2026-06-05.

- [x] Design + triage docs internalized (`design.md` / `phase-b-triage.md`)
- [x] `RetainingRingBuffer<T>` shipped in `@fgv/ts-utils` collections packlet
- [x] `observe` packlet shipped in `@fgv/ts-prompt-assist`: `IPromptObserver`, `IPromptObservationRecord` (`phase`-discriminated union), `IPromptObservationQuery`, `PromptObservationStore`
- [x] DI wiring: additive `observers?: ReadonlyArray<IPromptObserver>` on `IPromptLibraryCreateParams`
- [x] Hook fires at the three public method boundaries (`resolve` / `resolveJsonOutput` / `resolveFreeTextOutput`); never inside `_resolveInternal`
- [x] OQ-3: async + awaited default + fire-and-forget opt-in (per-observer `fireAndForget` flag); documented + tested both directions including the mixed-mode case
- [x] Privacy posture documented in TSDoc on `PromptObservationStore`
- [x] `code-reviewer` agent ran BEFORE 100%-coverage closure (L37) — 0 P1, 3 P2, 3 P3; dispositions below
- [x] Gates green: build / lint clean / 100% coverage in both libraries
- [x] LIBRARY_CAPABILITIES.md updated for both `@fgv/ts-utils` and `@fgv/ts-prompt-assist` (table-cell entries from Phase C; cluster-close PR #460 added decision shortcuts)
- [x] Artifact migration in cluster-close PR #460 (per PR #452 codification)

### Layer-1 code-reviewer pass dispositions

- **P2-1** (swallow airtight): verified correct, no change.
- **P2-2** (2 new `ae-unresolved-link` warnings): **fixed** — promoted `IRetainedRecord` / `IRetainingRingBufferCreateParams` / `IRetainingRingBufferQuery` to top-level exports; warnings cleared.
- **P2-3** (`_observationNow` no test seam): accepted — intentional (single additive field); reviewer confirmed no coverage gap.
- **P3-1** (`onFailure` returning `fail` misleading): **applied** — `_safeObserve` now uses `isFailure()`.
- **P3-2** (`IPromptObservationStoreCreateParams` placement): accepted — matches `IPromptLibraryCreateParams` (co-located with its class).
- **P3-3** (member-level `@link`): accepted — pre-existing API Extractor limitation.
- **Coverage rec** (mixed awaited + fire-and-forget test): **added**.

### Layer-2 Copilot loop on PR #456

Implementer-driven, stopped at round 2 on diminishing returns:
- **Round 1**: 10 substantive comments (contentHash doc/impl drift; additive-default invariant; flaky-timing tests). All resolved.
- **Round 2**: 1 doc-clarification nitpick (`durationMs` semantics). Resolved.
- **No round 3 requested.**

### Final gate totals

- `@fgv/ts-utils`: 1594 tests; `RetainingRingBuffer` 100% (all metrics).
- `@fgv/ts-prompt-assist`: 228 tests; `observe` packlet + `promptLibrary.ts` 100% (all metrics).
- `rushx build` / `rushx lint` (clean) / `rushx test` (100%) / `rushx fixlint` — both libraries.

## Companion stream — committed, not parking-lot

`.ai/tasks/completed/2026-06/retaining-logger-ring-buffer-refactor/brief.md` — sibling brief that rides into `release` with this cluster. **Commission immediately after this cluster closes.** Brings `RetainingLogger` onto the new `RetainingRingBuffer<T>`, retiring the duplicated ring. The deferral was sound **only if this commission actually lands** — otherwise the two ring implementations drift and the Q1/OQ-6 falsifiability argument retroactively degrades from "existing second consumer" to "hypothetical second consumer."

---

## Decisions made (Phase A → Phase B → Phase C)

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
| `RetainingRingBuffer<T>` ships as a **pure seq-ring** — caller mints `seq` + `timestamp`; `PromptLibrary` owns the single seq authority | Phase C — see seq-authority finding |

---

## Follow-up findings filed

- `findings/inbox/2026-06-04-ring-buffer-seq-authority.md` — Phase C refinement of the Phase A buffer sketch: `RetainingRingBuffer<T>` ships as a **pure seq-ring** (caller mints seq+timestamp); `PromptLibrary` owns the single seq authority. Forced by OQ-5 `linkedResolveSeq` cross-store consistency under multi-observer fan-out. Also the minimal-blast-radius shape for the `retaining-logger-ring-buffer-refactor` fast-follow. **Read this before the fast-follow.**
