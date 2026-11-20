# Phase B triage decisions — `ts-prompt-assist-observability`

**Date:** 2026-06-04
**Orchestrator:** triage on Phase A `design.md` (PR #455 merged 9794da60c)
**Status:** Phase B complete — all eight OQs locked; Phase C ready to commission.

---

## Lock summary

All eight OQs lock at the **Phase A leans** (no divergences). Phase A's design is the implementation contract for Phase C.

| OQ | Decision | Notes |
|---|---|---|
| **OQ-1** | id-key: **`seq` + `contentHash` side-by-side** | Both fields on every record. `seq` is the ordering / paging key. `contentHash` is CRC32 over RFC 8785 canonical JSON of `{ promptId, chain, qualifierContext, substitutions }` via `Hash.Crc32Normalizer`. Consumer picks which to use as map/dedupe key. |
| **OQ-2** | observer-error fallback: **log to the existing `this.logger` at warn**, no new param | Reuses the already-injected diagnostic logger (defaults to `NoOpLogger`, so silent unless a deployment wires a real logger). |
| **OQ-3** | observer interface: **async, awaited, per-observer error swallow**; fire-and-forget as an **opt-in mode** | Default-awaited is correct for the cheap default in-memory store. **Load-bearing for Phase C**: fire-and-forget mode must be explicitly documented and **tested** so that consumers wiring slow remote observers can opt in cleanly. A consumer running an awaited SIEM observer that adds 100ms/call to every resolve silently is the failure mode to prevent via docs + a fire-and-forget integration test. |
| **OQ-4** | failure records: **error-only for v0.1**; partial-trace threading deferred | The Phase A finding ("trace built only on success path") is real and structural — threading partial trace out of `_resolveOnce`'s early-return paths is `PromptLibrary` internals work that doesn't belong in this stream. Recorded in `docs/FUTURE.md` after Phase C ships. |
| **OQ-5** | output methods: **two cross-linked records** (resolve + output) via `linkedResolveSeq` | Single record either drops information or option-soups. Cross-linked preserves single-responsibility and lets the consumer correlate. |
| **OQ-6** | substrate: **hybrid C-minimal + D** (LOCKED earlier on 2026-06-04 via the Phase A PR's second commit) | Phase C ships `RetainingRingBuffer<T>` in `@fgv/ts-utils` + schema-aware `PromptObservationStore` in `@fgv/ts-prompt-assist`. `RetainingLogger` is **not** refactored to compose the new buffer in Phase C (keeps Phase C additive) — the refactor is a **committed fast-follow stream** (see below), not a parking-lot reference. |
| **OQ-7** | standalone `MultiPromptObserver` class: **NO for v0.1** | The library is the fan-out point (it holds the `observers` array and runs `_observe`). Add a standalone class only if a consumer surfaces a need to compose observers outside the library — file as a `findings/inbox/` item if it comes up. |
| **OQ-8** | output record references body via `linkedResolveSeq`, **does not duplicate** | Body already lives on the linked resolve record. Re-storing is bloat. |

---

## Committed fast-follow stream

The OQ-6 lock defers the `RetainingLogger` → `RetainingRingBuffer` composition refactor out of Phase C to keep Phase C additive. That deferral is **a committed stream commission, not a parking-lot reference.** The brief lives alongside this triage doc:

- **Stream id:** `retaining-logger-ring-buffer-refactor`
- **Substrate:** `.ai/tasks/active/retaining-logger-ring-buffer-refactor/brief.md` (committed on this integration branch; lands on `release` when the observability cluster closes)
- **Commission trigger:** after the observability cluster closes to `release` and PR-453-style follow-ups (if any) are clear.
- **Scope:** refactor `RetainingLogger` internally to compose `RetainingRingBuffer<ILogRecord>` while preserving the public `ILogger` / `LogReporter` surface. Drops the duplicated ring implementation. Provides the **existing** second consumer of `RetainingRingBuffer` that Phase A's falsifiability argument named.

If this fast-follow doesn't actually get commissioned, the falsifiability argument for OQ-6 retroactively degrades — both rings live in parallel codepaths and the Q1 "abstraction earns its keep via existing second consumer" claim becomes hypothetical. Hence the commitment status.

---

## Phase C scope discipline (what the kickoff names)

The Phase C kickoff names these as load-bearing implementation details, not just acceptance criteria:

1. **Field list is locked from Phase A's Q3 sketch.** `IPromptObservationBase` + `IPromptResolveObservation` + `IPromptOutputObservation` ship exactly as drafted (modulo TSDoc polish). Type adjustments only if a real TypeScript constraint forces it; structural changes go through a finding doc + re-triage.
2. **OQ-3's fire-and-forget opt-in must be documented and tested.** A unit test that wires a deliberately-slow observer in fire-and-forget mode and asserts that `resolve()` returns before the observer completes is the canonical evidence.
3. **`PromptObservationStore` implements `IPromptObserver`** (observe + query on the same class). No separate Store + Observer types.
4. **DI wiring:** one new field `observers?: ReadonlyArray<IPromptObserver>` on `IPromptLibraryCreateParams` — purely additive on the active-development surface; existing consumers unaffected when absent.
5. **`RetainingRingBuffer<T>` lands in `@fgv/ts-utils`** in whichever packlet is the right home (Phase A didn't pin this; likely `collections` or a sibling to `logging`). The agent picks based on what fits the existing packlet seams.
6. **Hook fires at the public method boundary** (`resolve` / `resolveJsonOutput` / `resolveFreeTextOutput`), **never** inside the re-entrant `_resolveInternal`. Resource-binding inner resolves roll up under the outer record's `trace.resourceBindingResolutions[].innerTrace` — that's already the existing trace shape; the observer doesn't duplicate it.
7. **No source/test changes outside the two libraries.** No testbed scenarios, no sample apps. The Phase A scope discipline carries forward.
8. **`code-reviewer` agent runs on the diff BEFORE 100%-coverage closure** — L37 reference observation is the `ai-assist-client-tools` cluster (`completed/2026-06/ai-assist-client-tools/README.md`). Coverage-chasing-first locks in imperative tests and `c8 ignore` directives that would have been refactors.

---

## Phase C acceptance criteria (the cluster-close gate)

- [ ] `RetainingRingBuffer<T>` shipped in `@fgv/ts-utils`; 100% covered; documented per TSDoc conventions.
- [ ] `IPromptObserver`, `IPromptObservationRecord`, `IPromptObservationQuery`, `PromptObservationStore` shipped in `@fgv/ts-prompt-assist`; 100% covered.
- [ ] DI wiring on `IPromptLibraryCreateParams.observers?` — additive only.
- [ ] Hook fires at the three public method boundaries; resource-binding inner resolves do NOT fire an additional observer call.
- [ ] OQ-3 awaited-default + fire-and-forget-opt-in behavior documented and tested (the slow-observer test described above).
- [ ] Privacy posture documented in TSDoc: default store is most-permissive; deployments wrap or substitute.
- [ ] `rushx build` / `rushx lint` (no warnings) / `rushx test` (100% coverage) PASS in both `@fgv/ts-utils` and `@fgv/ts-prompt-assist`.
- [ ] `rushx fixlint` run before final commit.
- [ ] `code-reviewer` agent run on the cumulative diff BEFORE chasing 100% measured coverage (L37).
- [ ] LIBRARY_CAPABILITIES.md updated: `@fgv/ts-prompt-assist` entry mentions the observer surface; `@fgv/ts-utils` entry mentions `RetainingRingBuffer`.
- [ ] Artifact migration bundled into the cluster-close PR (active → completed/2026-06/, polished README). Per the PR #452 codification, the migration ships in the close-out PR, NOT a follow-up.

---

## Open after Phase C

The fast-follow stream (`retaining-logger-ring-buffer-refactor`) is commissioned after the cluster closes. That stream brings `RetainingLogger` onto the new buffer, retiring the duplicated ring code.
