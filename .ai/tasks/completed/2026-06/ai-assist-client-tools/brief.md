# Stream brief: `ai-assist-client-tools` — Phase A (design exploration)

**Status:** 🔵 Phase A in flight — design agent commissioned
**Workflow shape:** design-triage-implement (Phase A: design exploration → Phase B: triage → Phase C: implementation)
**Phase A target output:** design doc at `.ai/tasks/active/ai-assist-client-tools/design.md`
**Package surface (target, for design context — Phase A doesn't change code):** `@fgv/ts-extras/ai-assist` (model types, converters, registry, apiClient, streaming adapters, toolFormats) + `LIBRARY_CAPABILITIES.md`; new MCP work likely a separate `@fgv/ts-extras-mcp` Result-integration boundary package.

---

## Phase A mission

Produce a design doc covering what it would take to add **client-defined tool support** to `@fgv/ts-extras/ai-assist`, in two sequenced layers:

1. **Harness-supplied tools (first requirement).** Consumer defines tool schemas in their own code (name + description + JSON Schema for parameters), supplies callbacks, and ai-assist orchestrates the model's `tool_use` → consumer-callback → `tool_result` round-trip. Canonical motivating example: a memory tool the agent calls to recall or store user-specific context. Likely first consumer: personaility.

2. **MCP tools (longer term).** Same conceptual surface, but the tool catalog comes from one or more MCP servers the consumer has connected to. Adds: MCP client transport, tool discovery, schema introspection, lifecycle management. Should lower into the same internal client-tool plumbing as layer 1.

**Phase A is design and sizing only. No code changes.**

---

## Current state of the world (verified pre-commission)

What ships today in `@fgv/ts-extras/ai-assist`:

- **`AiServerToolType = 'web_search'`** at `model.ts:145` — single-value union.
- **`AiServerToolConfig = IAiWebSearchToolConfig`** at `model.ts:171` — single-member "union."
- **`toResponsesApiTools` / `toAnthropicTools` / `toGeminiTools`** at `toolFormats.ts` — all switch on `case 'web_search'` only.
- **Anthropic streaming adapter** parses `server_tool_use` blocks (`anthropic.ts:159`) only for web-search citations — not as a general tool-use round-trip loop.
- **Provider registry** declares per-model tool variants (`registry.ts:237` `tools: 'grok-4.3'` etc.) but that's about which model variant gets called when tools are enabled, not about what tools exist.

**What does not exist:** client-supplied tool schemas, `tool_use` / `tool_result` event types in streaming, tool-call round-trip orchestration, MCP support, function-calling protocols at any layer.

**What composes today and should continue to compose:** `thinking-config` and tools (both options-bag fields, both ride the same call paths). Phase A output should name any per-provider thinking + tools interaction gotchas.

---

## Phase A scope — what the design doc must answer

### 1. Cross-provider API survey

For each of the four supported providers — **OpenAI Responses, Anthropic Messages, Google Gemini, xAI** — survey the function-calling / tool-use API:

- Request shape: how tools are declared (name, description, JSON-schema-shaped params, top-level array vs per-call options bag).
- Response/streaming shape: how `tool_use` blocks appear in the streamed event sequence (delta granularity, identity/correlation IDs, partial vs final).
- Round-trip shape: how the consumer feeds `tool_result` back into the conversation (separate message? continuation? per-call ID correlation).
- Parallel tool calls: which providers emit them, what the round-trip pattern is.
- **Composability with thinking-mode**: does each provider's thinking-config compose with tools? Quirks? Empirically verifiable assertions, not docs-only (per L4 — if a path looks broken in docs, test before flagging).
- Authentication / model-variant prerequisites (e.g. xAI `grok-4.3` for tools per `registry.ts`).

Output: a per-provider table or section. The goal is to name the **union of surface variation** the fgv-native abstraction must cover.

### 2. fgv-native client-tool surface sketch

Sketch the public types and call shapes:

- **`IAiClientToolConfig`** (or similar name): `{ name, description, parametersSchema }`. Decide JSON Schema vs Converter/Validator vs both. Decide where the schema source-of-truth lives (consumer-authored JSON Schema, or generated from a fgv Converter, or both).
- **Event types on the streaming surface**: `IAiStreamToolUse` (start, params delta, complete) + `IAiStreamToolResult` (consumer-supplied, fed back into the conversation). Borrow shape language from the existing thinking-event surface where possible.
- **Round-trip loop**: who drives it — the consumer, or `callProviderCompletion`? Recommend a shape. The consumer is **always** responsible for *executing* tool calls; the question is whether they manage the conversation continuation explicitly or whether ai-assist hides it behind a higher-level "agentic loop" call.
- **Per-call vs registered tools**: are tools passed per-call (like the current `tools?: ReadonlyArray<AiServerToolConfig>` shape) or registered up-front in a registry? Recommend.
- **Server + client tool coexistence**: can a call have `web_search` and a client-defined memory tool active simultaneously? Sketch how the surface accommodates both.
- **Error / refusal handling**: model returns `tool_use` for a tool that doesn't exist; tool callback throws or returns failure; tool callback times out. Define the boundary.
- **Composability with thinking-mode**: name the API-level interaction (e.g. is thinking applied to the tool-call decision step? to the tool-result interpretation step? both? does the consumer see thinking events around tool-calls in the stream?).

Recommended approach + rationale. Alternatives considered + why rejected.

### 3. Harness-tools vs MCP separation

The brief explicitly sequences harness-tools first, MCP later. Phase A design should answer:

- **Which pieces are layer-1 only?** (Schema authoring, callback execution, the per-tool consumer-side ergonomics.)
- **Which pieces are shared internal plumbing?** (Tool-use event types, round-trip loop, provider toolFormat adapters, streaming integration.)
- **Which pieces are MCP-only?** (Transport, discovery, lifecycle, error-propagation across the MCP boundary.)
- **Where does the seam live?** If MCP support is added later, what's the smallest possible internal change — i.e. design layer 1 so layer 2 is additive, not a refactor.
- **MCP package shape**: if MCP support lives in a separate `@fgv/ts-extras-mcp` (Result-integration boundary over an upstream MCP client SDK), name the boundary and any shared types that have to live in `ts-extras`.

### 4. Phase B / C sizing

Concretely:

- **Phase B (triage)**: list the decisions Erik needs to make before implementation. (Recommended JSON Schema source-of-truth, recommended round-trip loop ownership, recommended per-call vs registry, etc. — flag which are 50/50 calls vs which have a clear better answer.)
- **Phase C (implementation)**: sketch the sub-phases for layer 1 (harness tools). Likely shape: types + converters + toolFormat adapters → streaming-surface tool-use events → round-trip loop → testbed scenario for a memory tool → `LIBRARY_CAPABILITIES.md` entry. Estimate each sub-phase's blast radius (file count, packages touched).
- **Layer 2 (MCP)**: high-level sketch only — not a phase-by-phase plan. Estimate when it would be commissioned (sprint cadence: next sprint? sprint+1?).
- **Risks / unknowns**: provider-specific quirks the survey couldn't resolve, MCP ecosystem maturity questions, thinking + tools edge cases.

### 5. Non-goals for Phase A

- **No code changes.** Phase A is design only.
- **No commitment to a sprint window.** Erik decides when Phase C lands; Phase A informs the sizing.
- **No MCP implementation sizing beyond high-level.** MCP is sprint+1-or-later; Phase A names the seam but doesn't sub-phase the implementation.
- **No agentic-orchestration framework.** This is "tool-use round-trip support," not "an agent framework." The consumer drives the conversation loop; ai-assist just makes the round-trip safe and ergonomic.

---

## Reading list (start here)

Required:

1. **`libraries/ts-extras/src/packlets/ai-assist/model.ts`** — `AiServerToolType`, `AiServerToolConfig`, `IAiWebSearchToolConfig`, `ModelSpec`, thinking-config types.
2. **`libraries/ts-extras/src/packlets/ai-assist/toolFormats.ts`** — the three provider adapters; understand the shape of the existing `web_search` mapping per provider.
3. **`libraries/ts-extras/src/packlets/ai-assist/apiClient.ts`** — entry point (`callProviderCompletion`, `callProviderCompletionStream`); options bag shape; how `tools` flows through.
4. **`libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/{openaiResponses,anthropic,gemini}.ts`** — current per-provider streaming event handling; particularly the `server_tool_use` parsing in anthropic.ts as a partial precedent.
5. **`libraries/ts-extras/src/packlets/ai-assist/converters.ts`** — how `aiServerToolConfig` is converted; mirror for client-tool config.
6. **`libraries/ts-extras/src/packlets/ai-assist/registry.ts`** — provider/model registry; current per-model tool capabilities.
7. **`.ai/instructions/LIBRARY_CAPABILITIES.md`** — current ai-assist entry; understand what gets updated in Phase C.

Reference:

8. **`.ai/tasks/active/ai-assist-thinking-events/` (if present)** — the thinking-event surface design, which the client-tool event surface should mirror for consistency.
9. **`.ai/tasks/completed/2026-05/ai-assist-thinking-config/`** — how `thinking` got bolted onto the options-bag pattern.
10. **`.ai/tasks/completed/2026-05/local-ai-exploration/`** — the testbed scenario harness, where a memory-tool scenario would live in Phase C.
11. **`docs/FUTURE.md`** — find the `Client-defined tools for @fgv/ts-extras/ai-assist` entry that frames the intent.
12. **`.ai/instructions/CODING_STANDARDS.md`** — Result pattern, type-safe validation, extending-vs-working-around discipline. The new client-tool surface must conform.
13. **`.ai/instructions/ACTIVE_DEVELOPMENT.md`** — ai-assist is on the active-development surface; additive-by-default but breaking is acceptable when the new shape is clearly better.

---

## Phase A deliverable

A single design document at `.ai/tasks/active/ai-assist-client-tools/design.md` covering Phase A scope §§ 1–5 above. Suggested shape:

```
# Design — `ai-assist-client-tools`

## §1 Cross-provider survey
  - One subsection per provider
  - Closing "union of surface variation" summary

## §2 fgv-native client-tool surface
  - Type sketches (TypeScript pseudocode is fine)
  - Round-trip loop recommendation + alternatives considered
  - Composability with server tools + thinking-mode

## §3 Harness-tools / MCP separation
  - Layer split table
  - Seam location
  - MCP package shape sketch

## §4 Phase B / C sizing
  - Phase B open questions (one per decision)
  - Phase C sub-phase sketch (one per sub-phase) with blast-radius estimates
  - Layer 2 (MCP) high-level estimate
  - Risks / unknowns

## §5 Recommendation
  - "If we ship Phase C in one sprint, here's what it looks like."
  - Explicit recommendation vs alternatives Erik should consider.
```

State.md gets updated with progress; design.md is the consumer-facing artifact.

---

## Phase B / C are not yet commissioned

Phase B (triage) commissions after Erik reviews the Phase A design doc. Phase C (implementation) commissions after Phase B closes. This brief is scoped to Phase A only.

---

## PRs

| Phase | PR | Status |
|---|---|---|
| Substrate prep | (this PR) | open → release directly (single-PR prep, no integration branch — Phase A is research only, no code) |
| Phase A design | n/a | agent commissioned; output is a design doc, not a code PR |
| Phase B triage | TBD | not yet commissioned |
| Phase C implementation (layer 1 — harness tools) | TBD | not yet commissioned |
| Layer 2 (MCP) | TBD | sprint+1 or later |
