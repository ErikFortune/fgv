# Phase B brief — `ai-assist-client-tools`

**Status:** 🟢 Phase B in flight — decisions surfaced to Erik; B4 empirical verification may be required.
**Workflow shape:** design-triage-implement; Phase B = decision lock-in pass (most questions have clear recommendations from Phase A; B4 is the only one that needs empirical work).
**Integration branch:** `ai-assist-client-tools` (off `release`).
**Phase A artifact:** `.ai/tasks/active/ai-assist-client-tools/design.md` (merged via PR #436 on 2026-06-03).
**Phase B output:** this brief + a Phase C kickoff brief once decisions lock.

---

## Mission

Resolve the six open Phase B questions named in design.md §4.1, producing a Phase C kickoff brief that the implementing agent can run cold.

Five of the six are decision-confirmations against clear recommendations. **B4 is the only one that may require an empirical spike** (Anthropic thinking + tools round-trip continuation behavior) — and only if personaility's near-term roadmap actually needs thinking + client tools simultaneously.

## Open questions (from design.md §4.1)

### B1 — Event type naming

`IAiStreamToolUseStart` / `IAiStreamToolUseDelta` / `IAiStreamToolUseComplete` as new variants of `IAiStreamEvent`. No strong alternative; recommend as-named.

**Decision needed:** confirm naming, or surface an alternative.

### B2 — Extend `IAiStreamEvent` directly (resolved)

Already resolved 2026-06-02 per Erik's review: extend directly; update exhaustive switches in lockstep. `IAiStreamEventWithClientTools` dropped.

**Decision needed:** none.

### B3 — Round-trip helper API shape

`executeClientToolTurn({events, nextTurn})` returning the consumed event stream + the next-turn input. Consumer drives the outer loop (Example A in design.md §2.X); the helper is a single-turn primitive.

**Decision needed:** confirm the shape matches personaility's mental model. If you'd rather have the helper return a richer object (e.g. parsed tool calls separately from raw events), surface it.

### B4 — Anthropic thinking + tools

**Open question, gates the C3 continuation builder.** Anthropic docs claim the follow-up request must include thinking blocks from the original assistant turn when thinking is active alongside tool use. If true, the adapter must accumulate thinking blocks across the round-trip — non-trivial extra work.

**Decision needed:** does personaility's near-term use case require thinking + client tools simultaneously?

- **Yes** → commission a focused B4 empirical spike (small agent: call Anthropic with thinking + a synthetic tool, observe the required round-trip shape, document the result). Phase C absorbs the thinking-block accumulation.
- **No** → defer thinking + tools interaction to a follow-on stream. Phase C C3 ships without it; the design notes the gap.

### B5 — `maxRoundTrips` default

`runToolUseConversation` helper (Example B; layer-2 follow-on, not Phase C) takes an optional max-iteration cap. Recommended default: 10.

**Decision needed:** confirm 10, or surface a different cap.

### B6 — Testbed scenario scope

Phase C ships a testbed scenario demonstrating the end-to-end consumer flow. Options:

- **(a)** Memory tool only (canonical example from the design).
- **(b)** Memory tool + a broader example chaining a client tool with a server tool (`web_search`).

**Decision needed:** scope. (b) is more compelling demo-wise but adds testbed-scenario work to Phase C; (a) is faster.

---

## Phase B workflow

1. Surface B1-B6 to Erik directly (in chat or via this brief).
2. For any "needs empirical verification" answer (likely only B4 if Erik says "yes"), commission a focused spike. Otherwise lock decisions and proceed.
3. Once all six decisions lock, produce the Phase C kickoff brief on this branch and merge to integration.
4. Phase C implementation agent commissions against the integration branch.

## Out of scope for Phase B

- Re-relitigating Phase A design choices (the typed-schema authoring locked in commit `8e823b292`, the `IAiClientTool` seam, the consumer-driven-loop framing). Those are decided.
- Sizing the layer-2 (MCP) implementation. Layer 2 is sprint+1.
- Anthropic thinking + tools verification *if* B4 → no (Erik's call).

## Decisions log will track resolutions here

(populated as decisions land)
