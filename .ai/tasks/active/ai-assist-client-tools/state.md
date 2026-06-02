# Stream state: `ai-assist-client-tools`

**Status:** 🟡 Phase A complete + amended; **Phase B/C held** pending `json-schema-derives-t` stream landing
**Workflow shape:** design-triage-implement
**Last updated:** 2026-06-02 (orchestrator — hold recorded; alignment stream `json-schema-derives-t` commissioned)

---

## Phase status

| Phase | Status | Notes |
|---|---|---|
| A — design exploration | ✅ complete | `design.md` written and amended per Erik review (extend `IAiStreamEvent` directly; §2.X consumer-driven vs ai-assist-driven loop examples + layering). PR #436 carries the amended design. |
| B — triage | ⏸ HELD | **Held pending `json-schema-derives-t` stream landing.** When that stream merges to `release`, Phase B commissions with the alignment work as a prerequisite — Phase C will adopt typed-schema authoring (`JsonSchema.object(...)`) for `IAiClientToolConfig.parametersSchema` from day one rather than shipping `JsonObject` and migrating later. |
| C — implementation (layer 1 — harness tools) | ⏸ HELD | Held downstream of Phase B's hold. |
| Layer 2 — MCP | ⏸ deferred | Sprint+1 or later; Phase A names the seam but doesn't sub-phase it. Layer 2 will use `JsonSchema.fromJson` for MCP-discovered tools. |

---

## Decisions log

| Decision | Rationale |
|---|---|
| design-triage-implement workflow shape, not direct stream | This is "what would it take" research, not "implement X" execution. Erik wants the sizing + design before committing the sprint window. |
| Two sequenced layers: harness tools first, MCP later | Harness tools are the near-term consumer requirement (personaility memory tool); MCP is longer-term and structurally additive on top of harness tools if Phase A designs the seam correctly. Sequencing keeps the first layer shippable. |
| Phase A senior-developer agent run, foreground design output | The work is architectural-design-shaped: cross-provider API survey + native-surface sketch + sub-phase sizing. senior-developer is the canonical fit. Output is `design.md`, not a code PR. |
| Phase A is design only — no code changes | Keeps the artifact reviewable in one read; Erik decides on Phase B/C before any code lands. |
| MCP as a separate `@fgv/ts-extras-mcp` Result-integration boundary package (working assumption — Phase A confirms) | Per the integration-boundary convention. Phase A design confirms: the seam is `IAiClientTool`; MCP adds a new package that converts MCP tool descriptors to `IAiClientTool[]` without touching ts-extras. |
| No agentic-orchestration framework | The consumer drives the conversation loop; ai-assist makes the tool-use round-trip safe and ergonomic. Recommendation: `executeClientToolTurn` helper returns `{events, nextTurn}` — consumer drives the outer loop. |
| Per-call client tools (not registered) | Matches existing server-tool pattern; lifecycle simplicity; MCP brings its own registration concept via discovery. |
| JSON Schema as parameter source-of-truth | Consumers author it directly; it's the wire format providers expect; no Converter→Schema generation step needed. |
| Extend `IAiStreamEvent` directly with tool-use variants (override 2026-06-02) | Erik: we own all consumers and update exhaustive switches in lockstep; the cleaner shape beats backwards-compat ergonomics. `IAiStreamEventWithClientTools` dropped. |
| Seam is `IAiClientTool` (config + callback pair) | Layer 1 consumers construct directly; layer 2 (MCP) converts MCP tool descriptors to `IAiClientTool[]`. Same streaming/round-trip plumbing serves both. |
| Anthropic thinking + tools B4 flag | Material unknown: Anthropic may require thinking blocks in round-trip history. Must be verified empirically in Phase C before finalizing continuation builder. See design.md §2.7 and §4.4. |
| Phase B/C held for `json-schema-derives-t` to land (Erik 2026-06-02) | Erik picked Option 1 from the phase-2 alignment-spike verdict: commission `json-schema-derives-t` now, hold ai-assist-client-tools Phase B/C until it lands. Goal: Phase C adopts typed-schema authoring (`JsonSchema.object(...)`) for `IAiClientToolConfig.parametersSchema` from day one — verify-not-assert end-to-end; no two-step authoring migration for personaility. When `json-schema-derives-t` merges to `release`, Phase B commissions against an updated design that swaps `parametersSchema: JsonObject` for typed `ILlmSchema<TParams>` authoring (`toJson(schema)` produces the wire format at the call site). MCP boundary (layer 2) uses `JsonSchema.fromJson` for tool descriptors arriving from MCP servers. |

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
| 2026-06-02 | Phase A design complete | design.md written. Covers §§1–5: cross-provider survey, fgv-native surface sketch, harness/MCP split, Phase C sizing, recommendation. Key open item: Anthropic thinking + tools round-trip empirical verification (B4). |
| 2026-06-02 | Phase A design amended per Erik review | Dropped `IAiStreamEventWithClientTools` union (extending `IAiStreamEvent` directly); added §2.X consumer-driven vs ai-assist-driven loop examples with layering confirmation. JSON-Schema-Converter alignment spike commissioned separately. |
| 2026-06-02 | Phase B/C placed on HOLD pending `json-schema-derives-t` | Erik picked Option 1 from the phase-2 alignment spike verdict: commission `json-schema-derives-t` now, hold ai-assist-client-tools Phase B/C until it lands. Phase C will adopt typed-schema authoring for `IAiClientToolConfig.parametersSchema` from day one (verify-not-assert end-to-end). When `json-schema-derives-t` merges to `release`, Phase B commissions against an updated design.md that swaps `parametersSchema: JsonObject` for typed `ILlmSchema<TParams>` authoring. |

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep + Phase A design | draft PR → release | design.md complete; PR opened for Erik review |
| Phase B triage | TBD | not yet commissioned |
| Phase C implementation | TBD | not yet commissioned |
