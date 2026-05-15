# Stream State: ts-prompt-assist

**Status:** 🟢 phase A drafted — `design.md` locked; PR pending
**Last updated:** 2026-05-15 (phase A agent — design lock)

---

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| A — research and design | 🟢 drafted | `design.md` locked; OQ-1 through OQ-6 resolved; PR pending against `claude/ts-prompt-assist-features` |
| B — implementation | ⏸ blocked on phase A signoff | Brief to be authored by orchestrator post-triage |
| Refine — consumer-port pressure-test | ⏸ blocked on phase B publish | personaility port surfaces gaps; 1–2 follow-up PRs absorb refinements before integration→release promotion |

---

## Cluster context

**Cluster name:** `ts-prompt-assist-features`
**Integration branch:** `claude/ts-prompt-assist-features` (off `release`; created by orchestrator before phase A commission)
**Workflow shape:** design-triage-implement-refine (per Erik 2026-05-13)

---

## Decisions log (orchestrator, substrate prep)

| Decision | Rationale |
|---|---|
| Standalone package above `ts-res` | Folding into `ts-extras` would create a cycle (`ts-res` already depends on `ts-extras`). Confirmed in design-brief.md §"Why a separate package" |
| Workflow shape: design-triage-implement-refine | Conceptual model is binding but data shapes are proposed; 3+ open questions warrant a phase A signoff before implementation. Consumer-port pressure-test ("refine") absorbed via integration-branch follow-up PRs |
| Integration branch (vs direct-off-release stream) | Cluster expected to be multi-stream (library v0.1 → consumer-port refinements → possibly samples / editor UX). Long-lived branch allows v0.1 alpha + pressure-test absorption + v0.2 to ship as one cohesive merge to `release` |
| First-consumer port = an agent chat application | Pressure-test plan: 1–2 follow-up PRs on the integration branch absorb gaps surfaced by the port |
| ts-extras `mustache` packlet is in cluster scope | Erik's direction (2026-05-13): "instead of dancing around ts-extras mustache limitations, fix ts-extras and use the fixed API." Cluster will additively extend `MustacheTemplate` to support verbatim-passthrough rendering; `ts-prompt-assist` consumes the extended API. Phase A picks the specific API shape (OQ-6 candidates a/b/c) |
| Active surface registration | Added `ts-prompt-assist` to `.ai/instructions/ACTIVE_DEVELOPMENT.md` table (free hand on breaking changes during v0.x) |
| Alpha target | `5.1.0-29` or later; may accumulate to `6.0` based on API-stability evidence after pressure-test |
| Sequencing | Independent of `ai-assist-thinking-events` (queued). Streams can run in parallel; no conflicting surface |
| Future streams (queued) | `ts-prompt-assist-samples` and `ts-prompt-assist-editor-ui` — both in `docs/FUTURE.md` |

---

## Open questions

### Orchestrator-flagged for phase A (must resolve)

| ID | Question | Source |
|---|---|---|
| OQ-1 | Scope encoding flexibility — flat default vs nested directories | design-brief.md §"Open questions" |
| OQ-2 | Resource-binding substitution merge semantics — strict (replace) vs relaxed (layered) | design-brief.md §"Resource-binding semantics" |
| OQ-3 | `watch()` semantics — include in interface? optional? full event-shape definition? | design-brief.md §"Open questions" |
| OQ-4 | Three separate registries vs one unified `IPromptRegistry` with namespaced sub-registries | orchestrator review |
| OQ-5 | Output-contract growth path — is the `IJsonOutputContract<TKIND>` generic pulling its weight at v0.1? | orchestrator review |
| OQ-6 | Mustache canonical form — extend ts-extras `MustacheTemplate` for verbatim-passthrough; pick API shape (option on create / strict-passthrough mode / sibling primitive) | orchestrator review (Erik direction: extend ts-extras, don't work around it) |

### Deferred (not phase A's concern)

| ID | Question | Where it lives |
|---|---|---|
| F-1 | Samples app shape — standalone vs folded into `ai-assist-image-generator` | `docs/FUTURE.md` (post-v0.1 stream) |
| F-2 | Generic editor UX feasibility — `@fgv/ts-prompt-assist-ui` or consumer-specific | `docs/FUTURE.md` (post-v0.1 stream) |

---

## Phase A decision log (agent, 2026-05-15)

| OQ | Decision | Summary |
|---|---|---|
| OQ-1 | flat default + function override | Default rejects `/ \ \0 :` + reserved Win device names + non-portable POSIX chars; consumers supply `scopeEncoding` / `scopeDecoding` for nested-directory layouts. Rationale: simplest path that doesn't paint v0.2 into a corner; tightening defaults later is breaking. |
| OQ-2 | strict (replace) | Binding-supplied `substitutions` entirely replace parent's for inner resolve; trace records `'replace'` vs `'inherit'` mode. Rationale: clean mental model for shared fragments; relaxing later is additive. |
| OQ-3 | interface includes `watch?`; FileTree stubs; InMemory implements; event shape pinned | `IPromptStoreEvent.kind: 'descriptor-changed' \| 'descriptor-removed' \| 'bindings-changed' \| 'qualifier-axes-changed'`. Rationale: pinning event shape under InMemory tests prevents v0.2 interface churn. |
| OQ-4 | unified `IPromptRegistry` with four typed sub-registries | One `registry` create-param exposing `converters` / `qualifierEnums` / `slotKinds` / `outputValidations` sub-registries. Splits qualifier enums out of the original combined shape registry. Rationale: distinct concerns deserve distinct typed namespaces, but consumers want one bag to pass around. |
| OQ-5 | drop the generic on `IJsonOutputContract`; minimal free-text; `outputValidations` on descriptor | Future JSON variants extend the discriminated union (`'json-array'`, `'json-stream'`) rather than parameterizing. `outputValidations` stays on `IPromptDescriptor`, not on the JSON contract, to keep growth open for future free-text validators. |
| OQ-6 | shape (a) — `escape?` option on `MustacheTemplate.create` | Additive `escape: 'html' \| 'none' \| (s) => string` on the canonical primitive in ts-extras. Default `'html'` preserves back-compat. Implementation MUST use `Mustache.Writer` instance, not `Mustache.escape` global. Double-brace rejection stays in ts-prompt-assist (consumer-discipline concern, not Mustache concern). |

## New questions surfaced (non-blocking)

| ID | Question | Where it lives |
|---|---|---|
| NQ-1 | `extractJsonText` export status from `@fgv/ts-extras/ai-assist` — currently public or internal? | design.md §8 step 1; phase B verifies / promotes |
| NQ-2 | YAML loader: does `@fgv/ts-json-base/json-file` already cover it, or does phase B need to add `js-yaml`? | design.md §11.2; phase B surfaces if new dep needed |
| NQ-3 | Exact `IFileTreeItem` import path/symbol from `@fgv/ts-json-base/file-tree` | design.md §5.1; phase B verifies |
| NQ-4 | `PromptRegistry.empty()` infallible factory — keep alongside `.create()` or collapse? | design.md §4.3; default: keep both for v0.1 |

## Cluster-scope summary (for orchestrator)

The `ts-prompt-assist-features` cluster touches **two libraries**:

1. **`@fgv/ts-extras`** (existing, established surface) — strictly **additive** change to the `mustache` packlet: `escape?: MustacheEscapeStrategy` option on `MustacheTemplate.create` (default `'html'`, preserves back-compat). Implementation MUST use a per-instance `Mustache.Writer` rather than mutating `Mustache.escape` globally. No removed / renamed / behavior-changed exports.
2. **`@fgv/ts-prompt-assist`** (new library) — full v0.1 implementation per this design.

Phase B implementation order: ts-extras Mustache extension lands first (B.0), then ts-prompt-assist consumes it from the start (B.1 onward).

## Substrate prep checklist (orchestrator)

- [x] Add stream entry to `docs/WORKSTREAMS.md` (Active section, before `ai-assist-thinking-events`)
- [x] Add `ts-prompt-assist` to `.ai/instructions/ACTIVE_DEVELOPMENT.md` (Currently active surfaces table)
- [x] Add `ts-prompt-assist-samples` and `ts-prompt-assist-editor-ui` parking-lot entries to `docs/FUTURE.md`
- [x] Author `design-brief.md` (consumer-supplied, verbatim)
- [x] Author `brief.md` (orchestrator's phase A binding contract)
- [x] Author `state.md` (this file)
- [ ] Open substrate-prep PR → `release`
- [ ] After merge: create `claude/ts-prompt-assist-features` integration branch off post-merge `release` HEAD
- [ ] Commission phase A agent against the integration branch (kickoff prompt drafted by orchestrator)

---

## PR

Substrate-prep PR: merged (#356, 2026-05-13).
Phase A PR: TBD (pending push of `claude/ts-prompt-assist-phase-a-Y8JIM` → `claude/ts-prompt-assist-features`).

---

## Resume protocol

Phase A agent: read `brief.md` (binding contract) + `design-brief.md` (binding input — conceptual model is locked, data shapes are proposals) + this `state.md` to resume.
