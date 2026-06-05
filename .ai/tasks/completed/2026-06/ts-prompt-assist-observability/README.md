# `ts-prompt-assist-observability` — shipped

**Shipped:** 2026-06-04. Phase A #455 + Phase B (commit `34ef9443`) + Phase C #456 on the `ts-prompt-assist-observability` integration branch; cluster-close squash → `release` opened by the orchestrator.

**Workflow:** `design-triage-implement` on a dedicated integration branch.

**Package surface:** `@fgv/ts-utils` (`collections/retainingRingBuffer.ts` + top-level exports) and `@fgv/ts-prompt-assist` (new `observe` packlet + `resolve/promptLibrary.ts` observer wiring). Both got `minor` change files + regenerated api-extractor reports.

---

## What shipped

A hook to **observe every prompt resolution as it flows**, with a filterable default store — built on a new generic ring-buffer primitive.

- **`@fgv/ts-utils`: `RetainingRingBuffer<T extends { seq: number }>`** (collections) — a generic bounded most-recent-N ring (O(1) eviction), monotonic-`seq` cursor paging, predicate filtering (`query({ sinceSeq?, limit?, filter? })`), `lastSeq` stable across `clear()`. A *pure* substrate: the caller mints each record's `seq`/`timestamp`.
- **`@fgv/ts-prompt-assist`: `observe` packlet** — `IPromptObserver` (async `observe` + `fireAndForget?`), the `phase`-discriminated `IPromptObservationRecord` union, `IPromptObservationQuery`, and `PromptObservationStore` (implements the observer, composes the ring, schema-aware `query`). `PromptLibrary` gains an additive `observers?` field and fans out at the three public resolve/output boundaries.

## How it answers the brief's framing

| Erik's framing | How it shipped |
|---|---|
| Record both the trace and the rendered prompt | Success resolve records carry `body` + full `IPromptResolveTrace` + `outputKind` + `safeguardFindings`; output records carry `rawOutput`, cross-linked via `linkedResolveSeq`. |
| Default store, but caller instantiates/injects | `PromptObservationStore.create(...)` injected via `IPromptLibraryCreateParams.observers?` — same DI shape as `store`/`registry`/`logger`. |
| Storage handles size/privacy/filtering | `maxRecords` bounds size; `query(criteria)` filters; redaction/retention are deployment policy (store is most-permissive; wrap or substitute). |
| `MultiLogger`-shaped fan-out, errors isolated | `_observe` fans to N observers; a failed/throwing/rejecting observer is swallowed + logged at warn, never affecting `resolve()`. |
| Reuse or extend `RetainingLogger`? (the spike) | Hybrid C-minimal + D: extracted the ring mechanism as a generic `RetainingRingBuffer` in ts-utils; built a schema-aware `PromptObservationStore` on top. `RetainingLogger` consolidation is the committed fast-follow. |

## The load-bearing decision

**`seq` + `timestamp` are assigned by `PromptLibrary`, not the buffer.** A single per-instance authority is required so a resolve record and its output record share a consistent `seq` across *every* observer — which is what makes `linkedResolveSeq` correlation work under multi-observer fan-out. This also makes the buffer a maximally-reusable pure ring (and is the minimal-blast-radius shape for the `RetainingLogger` fast-follow). See `findings/inbox/2026-06-04-ring-buffer-seq-authority.md`.

## Gates (all passed before merge)

- `rushx build` / `rushx lint` clean / `rushx fixlint` — both libraries.
- `rushx test`: ts-utils 1594 tests (`RetainingRingBuffer` 100%); ts-prompt-assist 228 tests, 100% statements/branches/functions/lines.
- api-extractor reports regenerated; `minor` change files for both packages.
- `code-reviewer` (L37) run before coverage closure — 0 P1; P2/P3 resolved or dispositioned.
- Copilot loop driven by implementer; stopped at round 2 on diminishing returns.

## Phases & PRs

| Phase | Output | PR |
|---|---|---|
| A — design spike | `design.md` (Q1–Q4 + 8 OQs) | #455 |
| B — triage | `phase-b-triage.md` (OQ-1…OQ-8 locked) | commit `34ef9443` |
| C — implementation | `RetainingRingBuffer` + observe packlet | #456 |

## Open after this cluster

`retaining-logger-ring-buffer-refactor` (committed brief, in `active/`) — refactor `RetainingLogger` to compose `RetainingRingBuffer<ILogRecord>`, retiring the duplicated ring. Commission after this cluster closes to `release`.
