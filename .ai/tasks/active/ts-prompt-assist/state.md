# Stream State: ts-prompt-assist

**Status:** 🟢 phase A ready — substrate prepped; integration branch + phase A agent commission pending
**Last updated:** 2026-05-13 (orchestrator — substrate prep)

---

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| A — research and design | 🟢 ready | `brief.md` + `design-brief.md` authored; awaiting phase A agent commission against `claude/ts-prompt-assist-features` integration branch |
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
| First-consumer port = personaility | Pressure-test plan: 1–2 follow-up PRs on the integration branch absorb gaps surfaced by the port |
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

### Deferred (not phase A's concern)

| ID | Question | Where it lives |
|---|---|---|
| F-1 | Samples app shape — standalone vs folded into `ai-assist-image-generator` | `docs/FUTURE.md` (post-v0.1 stream) |
| F-2 | Generic editor UX feasibility — `@fgv/ts-prompt-assist-ui` or consumer-specific | `docs/FUTURE.md` (post-v0.1 stream) |

---

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

Substrate-prep PR: TBD (pending push)

---

## Resume protocol

Phase A agent: read `brief.md` (binding contract) + `design-brief.md` (binding input — conceptual model is locked, data shapes are proposals) + this `state.md` to resume.
