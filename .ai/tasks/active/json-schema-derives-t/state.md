# Stream state: `json-schema-derives-t`

**Status:** 🟢 ready to commission — substrate prep in flight
**Integration branch:** `json-schema-derives-t` (off `release`, sitting on top of `chore/json-schema-derives-t-spike-prep` so the spike substrate + feasibility verdict ride into release in the same squash)
**Last updated:** 2026-06-02 (orchestrator — substrate prep)

---

## Phase status

| Phase | Status | Notes |
|---|---|---|
| Implementation | 🟢 ready | Single-PR feature implementing the feasibility-spike-validated design. ~505 lines impl + ~620 lines tests estimated. |
| Cluster close (integration → release) | ⏸ after implementation | Standard integration→release squash. |

---

## Decisions log

| Decision | Rationale |
|---|---|
| Commission implementation stream now; hold ai-assist-client-tools Phase B/C for it (Erik 2026-06-02) | Per Erik's runway assessment: enough time before the personaility sprint hits ai-assist-client-tools Phase C to land the alignment work first. Verify-not-assert end-to-end from day one of layer-1 tool-use is the prize. |
| Integration branch sits on top of `chore/json-schema-derives-t-spike-prep` | Lets the spike substrate (brief.md, state.md, research.md, derives-t-feasibility-brief.md, derives-t-feasibility.md) ride into release as part of the implementation stream's squash. Eliminates the dependency on landing PR #439 separately; both spike docs and the implementation land together. |
| Single implementation PR, no Phase B triage | Feasibility spike doc has concrete sketches for every shape; remaining open questions are 5 small calls (packlet name, strict numeric mode, additionalProperties default, error message strategy, fromJson out-of-subset cutoff) that the implementing agent resolves in-flight and documents in state.md. A full Phase B triage cycle would be overkill. |
| Spike substrate stays at `.ai/tasks/active/json-schema-converter-alignment/` for the stream's lifetime | The spike's docs are the design specification; keeping them under their original directory preserves the design lineage. On stream completion, both substrates move to `.ai/tasks/completed/2026-06/` (spike dir + stream dir as separate sub-directories). |
| `code-reviewer` (L32) + agent-driven Copilot loop (L33) required for the implementation PR | This is exactly the focused-diff shape where the pre-PR `code-reviewer` gate shines (recent precedent: `capture-async-result-upgrade` PR #433). |
| Hold ai-assist-client-tools Phase B/C — handled in that stream's substrate | The hold is recorded in `.ai/tasks/active/ai-assist-client-tools/state.md`. PR #436 (Phase A design) can still land; Phase B commission waits until this stream squashes. |

---

## Origin

2026-06-02. Phase-2 sub-spike `json-schema-derives-t-feasibility` returned a clean **feasible** verdict (~505 lines impl + ~620 lines tests, single new packlet in `ts-json-base`, no surface change anywhere). Erik picked Option 1 from the verdict's sequencing options: commission the alignment stream now, hold ai-assist-client-tools Phase B/C for it.

The motivating chain: Erik review of phase-1 research retracted AJV-style consumer-supplied `T` (assertion ≠ verification, false sense of safety). Direction B retracted earlier (blast radius + fails at MCP boundary). Schema-derives-T (TypeBox-style) is the only direction with verify-not-assert end-to-end; phase-2 spike confirmed it's tractable for the LLM-tool subset.

---

## History

| Date | Event | Notes |
|---|---|---|
| 2026-06-02 | Stream commissioned + substrate prepped | brief.md + state.md + integration branch off `chore/json-schema-derives-t-spike-prep`. Implementation agent commission pending merge of this substrate-prep PR. |

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep | (this PR) | open → integration branch |
| Implementation | TBD | not yet commissioned |
| Cluster close (integration → release) | TBD | after implementation merges to integration |
