# Spike state: `json-schema-converter-alignment`

**Status:** 🟢 research complete — recommendation Direction A (after `ai-assist-client-tools` Phase C); awaiting Erik review
**Workflow shape:** parallel research spike
**Last updated:** 2026-06-02 (research agent — research.md delivered)

---

## Phase status

| Phase | Status | Notes |
|---|---|---|
| Research | 🟢 complete | `research.md` delivered. Recommendation: Direction A (Schema → Converter) as a new `JsonSchema.toConverter<T>(schema)` factory in `ts-json-base`, landing **after** `ai-assist-client-tools` Phase C (not as a Phase-C blocker). |
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
| Direction A over Direction B (research output) | Direction B would require reflection retrofit on every Converter combinator in `ts-utils/conversion` (closures-over-data pattern is everywhere; `arrayOf`/`recordOf`/`oneOf`/`tuple` need to expose inner converters as public fields). Direction A is a single new packlet in `ts-json-base` with no surface change. Schema is the contract (LLM provider defines it); Converter is internal validation. Schema-first authoring matches how consumers actually write LLM tools. |
| Direction A lands *after* `ai-assist-client-tools` Phase C, not alongside | Phase C's `IAiClientToolConfig.parametersSchema: JsonObject` shape is correct whether or not `JsonSchema.toConverter` exists. Direction A is a convenience layered on top. Coupling them adds Phase-C risk without unblocking anything. Consumers building tools today (status-quo schema + converter + drift test) migrate trivially later (drop hand-written converter, replace with generated one — no deprecation churn). |
| Out of scope (Direction A follow-on): static `T`-from-schema inference | TypeBox-style `Type.Static<typeof S>` is a separable type-system project. AJV-style consumer-supplied `T` is sufficient for LLM-tool-use. Defer until forced. |

---

## Origin

2026-06-02. Erik reviewing the `ai-assist-client-tools` Phase A design surfaced authoring concern: a consumer authoring both a JSON Schema (for the wire) and a Converter/Validator (for runtime validation) over the same shape is error-prone and likely to drift. Worth investigating whether fgv can align them — either direction (Schema → Converter, Converter → Schema, or status quo with a drift-detection test pattern).

Spike runs in parallel with Phase B of `ai-assist-client-tools`; output may inform Phase C's authoring story but doesn't block Phase B commission.

---

## History

| Date | Event | Notes |
|---|---|---|
| 2026-06-02 | Substrate prepped + agent commissioned | brief.md + state.md + general-purpose agent run with target `research.md`. |
| 2026-06-02 | Research complete | `research.md` delivered (~440 lines). Recommendation: Direction A (Schema → Converter) — small additive new packlet in `ts-json-base`, ~300–500 lines impl + ~300–400 lines tests, no surface change to existing exports. Direction B rejected (would require reflection retrofit across ts-utils combinators — broad blast radius). Direction C (status quo) viable but loses at scale (10+ tools). Sequencing: lands as **independent follow-on stream after `ai-assist-client-tools` Phase C is in `release`**, not as a Phase-C blocker. OSS verification: AJV (`ajv.compile<T>`), Zod v4 (`z.toJSONSchema` ✓, `fromJSONSchema` still open as #5233), TypeBox (schema IS the runtime rep). One advisory item surfaced: `Converters.number` accepts numeric strings — design decision deferred to follow-on stream. |

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep + research | open draft PR `research(json-schema-converter-alignment): spike output` → release | research.md added; awaiting Erik review |
| Follow-on stream (Direction A) | TBD | not yet commissioned — orchestrator's call after Erik reviews the recommendation |
