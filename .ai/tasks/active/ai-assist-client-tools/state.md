# Stream state: `ai-assist-client-tools`

**Status:** 🔵 Phase A in flight (design exploration; no code)
**Workflow shape:** design-triage-implement
**Last updated:** 2026-05-30 (orchestrator — substrate prep + Phase A commission)

---

## Phase status

| Phase | Status | Notes |
|---|---|---|
| A — design exploration | 🔵 in flight | Senior-developer agent commissioned; output is `design.md`. |
| B — triage | ⏸ not yet commissioned | Erik reviews Phase A design first. |
| C — implementation (layer 1 — harness tools) | ⏸ not yet commissioned | Sprint-window decision after Phase B. |
| Layer 2 — MCP | ⏸ deferred | Sprint+1 or later; Phase A names the seam but doesn't sub-phase it. |

---

## Decisions log

| Decision | Rationale |
|---|---|
| design-triage-implement workflow shape, not direct stream | This is "what would it take" research, not "implement X" execution. Erik wants the sizing + design before committing the sprint window. |
| Two sequenced layers: harness tools first, MCP later | Harness tools are the near-term consumer requirement (personaility memory tool); MCP is longer-term and structurally additive on top of harness tools if Phase A designs the seam correctly. Sequencing keeps the first layer shippable. |
| Phase A senior-developer agent run, foreground design output | The work is architectural-design-shaped: cross-provider API survey + native-surface sketch + sub-phase sizing. senior-developer is the canonical fit. Output is `design.md`, not a code PR. |
| Phase A is design only — no code changes | Keeps the artifact reviewable in one read; Erik decides on Phase B/C before any code lands. |
| MCP as a separate `@fgv/ts-extras-mcp` Result-integration boundary package (working assumption — Phase A confirms or refutes) | Per the integration-boundary convention emerging from `crypto-batch-2-webauthn` / `local-ai-exploration-transformers`. MCP wraps an upstream client SDK; the boundary is the whole product. |
| No agentic-orchestration framework | The consumer drives the conversation loop; ai-assist makes the tool-use round-trip safe and ergonomic. Out of scope for this stream. |

---

## Origin

2026-05-30 conversation. Erik tracking personaility's roadmap into agentic territory (memory tool, harness-supplied capabilities), realized client-tool support in ai-assist is **one sprint out**. Today ai-assist supports server tools only and only `web_search` (`AiServerToolType = 'web_search'` is a single-value union; toolFormat adapters switch only on that case). Personaility's near-term work needs the harness-tools layer; MCP is the natural longer-term extension.

Phase A commissioned as research+design now so the sizing exists before Erik commits the sprint window.

---

## History

| Date | Event | Notes |
|---|---|---|
| 2026-05-30 | FUTURE.md entry added; substrate prepped | brief.md + state.md + design-doc target named. |
| 2026-05-30 | Phase A senior-developer agent commissioned | Design doc target: `.ai/tasks/active/ai-assist-client-tools/design.md`. |

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep | (this PR) | open → release |
| Phase A design | n/a — design.md is the artifact | agent in flight |
| Phase B triage | TBD | not yet commissioned |
| Phase C implementation | TBD | not yet commissioned |
