# `ts-prompt-assist-observability` — state

**Stream:** `ts-prompt-assist-observability`
**Integration branch:** `ts-prompt-assist-observability`
**Status:** Phase A complete; Phase B ready to commission

---

## Phase A — design spike (complete)

- [x] Read `RetainingLogger` + `MultiLogger` + `LoggerBase` source (load-bearing for Q1)
- [x] Read `PromptLibrary` + `IPromptResolveTrace` source (load-bearing for Q2/Q3)
- [x] Q1 — RetainingLogger fit: answer + rejection rationale for 3 unchosen options
- [x] Q2 — hook firing surface: sketch wiring point(s) with code references
- [x] Q3 — `IPromptObservationRecord` field list
- [x] Q4 — filter axis API
- [x] Critical semantics (observer-error swallow + storage-layer privacy) in proposed interface
- [x] Open questions for Phase B named
- [x] `design.md` complete
- [x] `state.md` flipped to "Phase A complete; Phase B ready to commission"

## Phase B — design triage (pending Phase A)

(not yet commissioned)

## Phase C — implementation (pending Phase B lock)

(not yet commissioned)

---

## Decisions made

Phase A sub-decisions (recommendations; Phase B locks the headline):

- **Q1 (headline, for Phase B):** Recommend **C-minimal + D hybrid** — extract the proven ring/seq/since-cursor machinery as a generic `RetainingRingBuffer<T>` in `@fgv/ts-utils`, and build a schema-aware `PromptObservationStore` (Option D) in `@fgv/ts-prompt-assist` that composes it. Reject pure-A / pure-B (log-funnel: untyped `args[0]`, no prompt-axis filter) and full-C (generic `RetainingObserver<T>` with a generic filter API — over-abstraction across unknown record types). Falsifiability: the ring extraction has an **existing** second consumer (`RetainingLogger` itself can compose it), not a speculative one.
- **Q2:** Hook fires at the **public method boundary** (`resolve` / `resolveJsonOutput` / `resolveFreeTextOutput`), never inside `_resolveInternal` — so resource-binding inner resolves (depth > 0) roll up under the outer record's `trace.resourceBindingResolutions[].innerTrace`, no separate fire.
- **Q3:** `IPromptObservationRecord` is a `phase`-discriminated union (resolve-observation vs output-observation); `seq` + `contentHash` side-by-side; failure records carry error-only in v0.1 (no partial trace threaded out today — Phase B option).
- **Q4:** Schema-aware `query(criteria)` echoing `getRecords` (sinceSeq / limit) plus prompt axes (promptId, scope, qualifiers partial-match, outputKind, outcome, safeguard disposition) compiling down to the `RetainingRingBuffer<T>` predicate.
- **Semantics:** observer-error swallow reuses the **existing** injected `this.logger`; storage-layer privacy = default store is most-permissive, redaction is a consumer observer/store substitution.

### Orchestrator locks (Erik, 2026-06-04, on PR #455 review)

- **Q1 / OQ-6 LOCKED:** hybrid C-minimal + D accepted. Phase C ships the generic `RetainingRingBuffer<T>` in `@fgv/ts-utils` + the schema-aware `PromptObservationStore` in `@fgv/ts-prompt-assist`.
- **RetainingLogger composition deferred (agreed):** Phase C does **not** refactor `RetainingLogger` to compose `RetainingRingBuffer<T>` — keeps Phase C's blast radius additive. **This is a committed fast-follow, not a parking-lot item** — schedule it to follow Phase C quickly so the two ring implementations don't diverge.

---

## Follow-up findings filed

(empty — agent files findings in `findings/inbox/<YYYY-MM-DD>-<topic>.md`)
