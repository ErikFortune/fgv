# Spike state: `json-schema-converter-alignment`

**Status:** 🔵 research in flight — agent commissioned
**Workflow shape:** parallel research spike
**Last updated:** 2026-06-02 (orchestrator — substrate prep + commission)

---

## Phase status

| Phase | Status | Notes |
|---|---|---|
| Research | 🔵 in flight | general-purpose agent commissioned; output is `research.md`. |
| Follow-on stream (conditional) | ⏸ depends on recommendation | If spike recommends building (A) or (B), commission a separate stream then. If recommendation is (C) status quo, no follow-on. |

---

## Decisions log

| Decision | Rationale |
|---|---|
| Parallel research spike, not a Phase-A of a triage cycle | This is "is there an alignment story worth building" — single-pass research, not a full design-triage-implement cycle. If the answer is "yes, build," we commission a separate stream with its own Phase A. |
| general-purpose agent (not senior-developer) | Research-shaped: survey existing libraries, sketch fgv-native options, compare costs. senior-developer is reserved for architectural-design output; this is a design-feasibility scope. |
| Does NOT block `ai-assist-client-tools` Phase B | The `IAiClientTool` seam is right regardless. The spike answers the authoring story for tool parameters — Phase C can adopt the spike's recommendation if it lands in time, or stick with `JsonObject`/JSON Schema as authored. |
| Out of scope: implementation | Research only. Follow-on stream commissions if needed. |
| Out of scope: generalizing beyond LLM tool-use schemas | LLM function-calling is the forcing function; the spike's scope is bounded by what those providers accept. Other use cases can drive their own rounds. |

---

## Origin

2026-06-02. Erik reviewing the `ai-assist-client-tools` Phase A design surfaced authoring concern: a consumer authoring both a JSON Schema (for the wire) and a Converter/Validator (for runtime validation) over the same shape is error-prone and likely to drift. Worth investigating whether fgv can align them — either direction (Schema → Converter, Converter → Schema, or status quo with a drift-detection test pattern).

Spike runs in parallel with Phase B of `ai-assist-client-tools`; output may inform Phase C's authoring story but doesn't block Phase B commission.

---

## History

| Date | Event | Notes |
|---|---|---|
| 2026-06-02 | Substrate prepped + agent commissioned | brief.md + state.md + general-purpose agent run with target `research.md`. |

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep + research | (this PR) | open → release; research.md added once complete |
| Follow-on stream | TBD | not yet commissioned |
