# `ai-assist-client-tools` — shipped

**Shipped:** 2026-06-04 via PR #451 (squash-merge of `ai-assist-client-tools` integration → `release`). Implements the harness-supplied (Layer 1) half of the FUTURE.md "Client-defined tools for `@fgv/ts-extras/ai-assist`" entry. MCP integration (Layer 2) remains queued in FUTURE.md.

**Package surface:** new client-tool surface on `@fgv/ts-extras/ai-assist` (additive, no breaking changes to existing exports) + browser-barrel fix to `@fgv/ts-json-base` (`JsonSchema` namespace) + new `samples/testbed` scenario (`anthropicClientTools`).

---

## What shipped

### Public surface — `@fgv/ts-extras/ai-assist`

**Types:**
- `IAiClientTool<TParams>` — harness tool contract (`config` + `execute(args: unknown) => Promise<Result<unknown>>`). Use the unparameterized form `IAiClientTool` at the call site; `execute` is contravariant in `TParams`, so a typed `IAiClientTool<{ key: string }>` is NOT assignable to `IAiClientTool<unknown>`.
- `IAiClientToolConfig<TParams>` — tool descriptor (`name`, `description`, `parametersSchema: ISchemaValidator<TParams>`). Author `parametersSchema` with `JsonSchema.object(...)` from `@fgv/ts-json-base`; `parametersSchema.validate(args)` is the round-trip arg verification.
- `IAiClientToolContinuation` — round-trip result: `messages: ReadonlyArray<JsonObject>` (**provider-native wire-format objects** — Anthropic thinking + tool_use blocks, OpenAI function_call / function_call_output items, Gemini functionCall / functionResponse parts) + `toolCallsSummary`.
- `IAiClientToolTurnResult` — `{ continuation?, fullText }`; `continuation` is `undefined` when the model completed without invoking any client tools.
- `IExecuteClientToolTurnParams` / `IExecuteClientToolTurnResult` — the per-turn primitive's input/output types.
- `IExecuteClientToolTurnParams.continuationMessages?: ReadonlyArray<JsonObject>` — accepts provider-format wire messages from a prior turn's `continuation.messages`. **NOT** `IChatMessage[]`; **NOT** prepended via `messagesBefore` — the normalized-message path would strip the provider-native fields the server requires for signature verification.
- `IBuildMessagesOptions.rawTail?: ReadonlyArray<JsonObject>` — new field in `chatRequestBuilders.ts`; appended verbatim after the user message (tail position, not head).
- Stream event variants on `IAiStreamEvent`: `client-tool-call-start`, `client-tool-call-done` (carries `args: JsonObject` — non-object `JSON.parse` results coerced to `{}` to preserve the contract), `client-tool-result`.
- `IResolvedThinkingConfig` widened to `@public`.
- `anthropicEffortToBudgetTokens(effort)` exported from packlet barrel (low=2048, medium=8192, high=24000, max=32000).

**Helpers:**
- `executeClientToolTurn(params): Result<{ events: AsyncIterable<IAiStreamEvent>, nextTurn: Promise<Result<IAiClientToolTurnResult>> }>` — per-turn primitive. Consumer drives the outer multi-turn loop; helper handles one turn's streaming + dispatch + continuation assembly. `model` is optional (falls back to `resolveModel(descriptor.defaultModel)`). Fail-fast on duplicate client-tool names.
- Per-provider continuation builders (Anthropic, OpenAI Responses, Gemini) — reconstruct the assistant turn from the streaming accumulation buffer + assemble the user-turn tool_results. Internal; surfaced via `executeClientToolTurn`.

**Converters:**
- `aiClientToolConfig` — `Converters.object`-based converter for `IAiClientToolConfig` wire-format validation. Exported from the converters barrel.
- `rawTailMessageConverter` (`@internal`) — `role` constrained to `'user' | 'assistant'` via `Converters.enumeratedValue` (invalid roles surface as converter failures rather than producing malformed wire requests).

### Public surface — `@fgv/ts-json-base`

- Browser barrel (`src/index.browser.ts`) now exports `JsonSchema` alongside the Node barrel. Was missing since the `json-schema-derives-t` stream landed; surfaced as PR #448 during the cluster fix-loop.

### Sample

- `samples/testbed/src/scenarios/anthropicClientTools/` — new scenario exercising the full client-tool round-trip against the live Anthropic API. Anthropic + extended thinking (`anthropicEffort: 'low'`) + `recall_memory` client tool (JsonSchema-validated, in-memory key-value store with hyphen-delimited keys) + `web_search` server tool. CLI-only; requires `ANTHROPIC_API_KEY`. Pinned to the version alias `'claude-sonnet-4-6'` (not a dated snapshot, not `'sonnet'`).

```bash
cd samples/testbed
ANTHROPIC_API_KEY=<key> node bin/testbed.js --scenario anthropic-client-tools
```

### Substrate

- `.ai/instructions/LIBRARY_CAPABILITIES.md` — extended `@fgv/ts-extras/ai-assist` entry with the full client-tool surface (including `executeClientToolTurn`, the typed schema pattern, the continuation-messages wire-position constraint).
- `docs/FUTURE.md` — Layer 1 marked shipped; remaining MCP (Layer 2) scope retained.
- `docs/FUTURE.md` — new entry: per-provider live-wire-verification testbed scenarios + cross-provider generic-version-alias library work.

---

## Empirical gate — PASSED on live Anthropic API

Verified end-to-end against the live Anthropic API on 2026-06-04 (after the fixes from PRs #448 / #449 + the direct-pushed model alias landed):

- ✅ Live API round-trip completed without HTTP 400
- ✅ Thinking-block signature preserved (server accepted continuation — E5 from `b4-spike-findings.md`)
- ✅ Client tool (`recall_memory`) invoked and executed (memory miss path, returning `{ found: false, ... }`)
- ✅ Server tool (`web_search`) events emitted
- ✅ Server + client tool coexistence verified in same request

This was the open verification gate from PR #447's open-gate disclosure. **Phase B's B4 spike findings on Anthropic's signature-append wire requirement (E5) were the load-bearing prediction; the live test confirmed the implementation matches them.**

---

## Iteration story — multi-fix cycle + 5-round Copilot loop

The cluster's path to merge had **three distinct fix layers**:

### Layer 1 — Initial Phase C submission + retroactive code-reviewer pass

Phase C (PR #447) landed with 100% test coverage but reached merge with three P1 findings the test architecture didn't catch:

- **P1-1 (structural):** Client tools never reached the provider's request body. The streaming-adapter `tools` parameter was typed as `AiServerToolConfig[]` (server tools only); `executeClientToolTurn` passed only server tools through. Caught by retroactive `code-reviewer` pass; fixed by widening adapter signatures to `AiToolConfig` and adding an `effectiveTools = [...serverTools, ...clientTools.map(c => c.config)]` merge step.
- **P1-2 (idiom):** `aiClientToolConfig` converter used `Converters.generic` with manual type checks and unsafe casts — the exact anti-pattern CODING_STANDARDS.md flags as Priority-1 CI-blocking. Rewritten with `Converters.object`.
- **P1-3 (type safety):** Continuation builders used `JsonObject[]` + `as unknown as JsonObject` double-casts where `JsonArray` was the correct type.

**This cluster is the canonical reference observation for L37** (codified separately in PR #445 — `code-reviewer` agent runs BEFORE 100%-measured-coverage closure, not after).

### Layer 2 — Live-wire bug fixes (PRs #448 + #449 + direct pushes)

The B-6 testbed scenario (the empirical gate) surfaced three additional bugs only the live API call could detect:

- **PR #448** — `@fgv/ts-json-base` browser barrel didn't export `JsonSchema` (regression from the prior `json-schema-derives-t` stream; latent until the testbed scenario consumed it from a browser-bundled path).
- **PR #449** — Anthropic thinking wire shape: implementation emitted `{ thinking: { type: 'enabled' }, output_config: { effort: 'low' } }`. Anthropic's API rejected this with HTTP 400. Correct shape: `{ thinking: { type: 'enabled', budget_tokens: <int> } }`. Added `anthropicEffortToBudgetTokens(effort)` helper and rewired the emit-site.
- **Direct pushes** — testbed scenario was pinned to dated snapshot `'claude-sonnet-4-6-20251022'` (HTTP 404, deprecated/never-existed); changed to the version-pinned alias `'claude-sonnet-4-6'`. System-prompt tightened to specify the hyphen-delimited memory-key convention so the model's tool call matches the store.

**All three were unit-test-passing-but-wire-shape-wrong** — the bugs reinforced the L37 codification's "test the request body, not just the emitter" principle.

### Layer 3 — 5-round Copilot review loop on the promotion PR

| Round | Findings | Character |
|---|---|---|
| R1 | 9 substantive | P1-level — client tools never reached provider (already known via L1; re-flagged), JSON.parse coercion in `client-tool-call-done` (runtime), duplicate-name fail-fast, doc-accuracy on substrate (FUTURE.md + result.md drift) |
| R2 | 1 hygiene | API Extractor `ae-unresolved-link` warning on `{@link anthropicEffortToBudgetTokens}` |
| R3 | 1 substantive | `JSON.stringify(executionResult.value)` runtime soundness (circular structures + non-serializable values like bare `undefined`) |
| R4 | 3 substantive | `IAiClientToolContinuation.messages` TSDoc drift (said append to `messagesBefore`; actually goes via `continuationMessages`/`rawTail`); `rawTailMessageConverter` role constraint (allowed any `string`; constrained to `'user' \| 'assistant'`); exhaustive-switch unsafe-cast in `toolFormats.ts` defaults |
| R5 | 3 small | Interface-vs-schema-as-SoT (testbed scenario `IMemoryToolArgs` duplicated the schema shape); grammar typo (`must be coexist` → `must coexist`); TSDoc example phrasing (`JsonSchema.Static<typeof parametersSchema>` → use a const identifier like `mySchema`) |

**17 substantive findings addressed across 5 rounds.** Loop stopped at R5 on diminishing-returns judgment (R5's character was hygiene-only; well under the 10-round cap). Implementer-driven per the codified review-loop discipline.

---

## Architectural decisions (locked during implementation)

| Decision | Rationale |
|---|---|
| **`IAiClientTool` unparameterized at call site (default `unknown`)** | `execute` is contravariant in `TParams`; consumers validate inside `execute` via `parametersSchema.validate(args)`. Only correct pattern. |
| **`continuationMessages` separate from `messagesBefore` (different bag, different field, different type, different wire position)** | `messagesBefore` is `IChatMessage[]` (pre-user-message head, normalized). Continuation messages are `JsonObject[]` (post-user-message tail, provider-native; carry signatures the server verifies). Different types prevent consumers putting the continuation in the wrong wire slot at compile time. |
| **`rawTail` in `IBuildMessagesOptions`, not a new builder function** | Minimal additive change; only Anthropic needs it for layer 1. Field declared on the interface so other providers can opt in later without an API churn. |
| **`aiClientToolConfig` uses `Converters.object` (not `Converters.generic`)** | Idiomatic structured-conversion pattern per CODING_STANDARDS.md. Never use `Converters.generic` with manual `typeof` checks + unsafe casts. |
| **`effectiveTools` merges server + client in `executeClientToolTurn`** | Client tools must reach the provider in the request body's `tools` array alongside server tools. Original implementation passed only server tools — the P1-1 structural gap. |
| **`JsonArray` for array accumulation in continuation builders** | `JsonObject[]` + double-cast defeats type safety. `JsonArray` is the correct type for an array of `JsonValue`. |
| **Fail-fast on duplicate client-tool names in `executeClientToolTurn`** | Tool names route the model's tool call to the implementation. Silent `Map.set` overwrite could route to the wrong impl. R1 finding from Copilot's review pass. |
| **Non-object `JSON.parse` results coerced to `{}` in `client-tool-call-done`** | The event is typed `args: JsonObject` but `JSON.parse` can return arrays/primitives/null. R1 finding. |
| **Non-serializable tool result emits `isError: true` event with diagnostic context** | `JSON.stringify` can throw (circular) or return `undefined` (bare `undefined`, functions). Either would crash the generator or emit malformed events. R3 finding. |

---

## Dependencies + sequencing

- **`json-schema-derives-t`** (PR #441 / cluster-close 2026-06-03) — the typed-schema authoring foundation. `IAiClientToolConfig.parametersSchema: ISchemaValidator<TParams>` is the public consumer of `JsonSchema.object` + `JsonSchema.Static`. Phase B/C of this stream was held until that stream landed.
- **`json-schema-derives-t` browser barrel oversight** — surfaced during this cluster's testbed run; fixed by PR #448. Part of Layer 2 above.
- **`@fgv/ts-extras/ai-assist` thinking-config stream** (prior work) — provided the `IResolvedThinkingConfig` plumbing; this cluster widened it to `@public` and added `anthropicEffortToBudgetTokens` for the corrected wire shape.

---

## Phase A → Phase B → Phase C lifecycle

This was a full **design-triage-implement** workflow:

- **Phase A** (PR #436): cross-provider design exploration — survey of the four providers' tool-use surfaces, fgv-native client-tool surface sketch, harness-tool vs MCP separation analysis, B/C sizing.
- **Phase B** (PR #446): substrate + decision surface — locked the seven design decisions documented in this cluster's `state.md`, including the B4 Anthropic-thinking-and-tools spike that predicted the E5 signature-append requirement.
- **Phase C** (PR #447 + the fix layers above): implementation, retroactive code-reviewer pass, live-wire fixes, and the 5-round Copilot loop.

The B4 spike findings (`b4-spike-findings.md`, also in this archive) were the **load-bearing pre-implementation prediction** — they specified exactly what the live-API test would verify (E5 signature append, E3 tool_choice constraint under thinking, accumulation buffer ordering). Phase C's implementation matched those predictions, and the live test confirmed it.

---

## Followups (queued in FUTURE.md)

- **MCP tools (Layer 2)** — `@fgv/ts-extras-mcp` separate package. Same conceptual surface but tool catalog comes from MCP servers; consumer connects, discovers, introspects.
- **Higher-level multi-turn orchestration** — `runToolUseConversation`-style helper above the per-turn `executeClientToolTurn` primitive. Consumer-driven outer loop is the v0.1 contract; the helper would automate the loop for the common case.
- **Per-provider live-wire-verification testbed scenarios** — OpenAI / Gemini / xAI equivalents of the Anthropic scenario, each gated on the relevant `<PROVIDER>_API_KEY`.
- **Cross-provider generic-version-alias library surface** — `<provider>:<family>-<major>-<minor>`-style canonical aliases per provider, matching each SDK's actual convention.

---

## Files at archive time

- `brief.md` — Phase A stream brief
- `design.md` — Phase A design exploration output
- `phase-b-brief.md` — Phase B kickoff brief
- `b4-spike-findings.md` — Phase B B4 spike on Anthropic thinking + tools continuation requirements (load-bearing for E5 verification)
- `phase-c-brief.md` — Phase C kickoff brief
- `state.md` — Phase A–C state tracking + locked design decisions
- `result.md` — Phase C stream exit artifact
- `code-reviewer-pass.md` — retroactive code-reviewer findings (P1-1, P1-2, P1-3) + resolutions
- `findings/inbox/2026-06-04-continuation-message-wire-position.md` — finding documenting the `continuationMessages`/`rawTail` design-gap discovery and resolution
