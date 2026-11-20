# Phase C kickoff brief — `ai-assist-client-tools` (layer 1 — harness tools)

**Status:** 🟢 Phase C ready to commission — all Phase B decisions locked; B4 spike findings absorbed into C2/C3 scope below.
**Workflow shape:** design-triage-implement; Phase C = implementation of layer 1 (harness tools). Layer 2 (MCP, `@fgv/ts-extras-mcp`) is sprint+1.
**Integration branch:** `ai-assist-client-tools` (off `release`).
**Implementation branch:** create `chore/ai-assist-client-tools-phase-c-impl` off the integration branch once PR #446 (Phase B substrate) merges.
**Phase A design:** `.ai/tasks/active/ai-assist-client-tools/design.md` (locked; do not relitigate).
**Phase B decisions:** `.ai/tasks/active/ai-assist-client-tools/phase-b-brief.md` § Locked 2026-06-03.
**B4 empirical findings:** `.ai/tasks/active/ai-assist-client-tools/b4-spike-findings.md` (load-bearing for C2 + C3).

---

## Mission

Implement layer-1 client-defined tool support in `@fgv/ts-extras/ai-assist`: typed-schema-authored tool configs, streaming events, per-provider format adapters, per-provider streaming-adapter extensions for `tool_use` round-trip, the per-turn `executeClientToolTurn` helper, and a testbed scenario exercising the full round-trip on at least one provider with Anthropic thinking + client tools active end-to-end.

**Out of scope for Phase C:** the higher-level `runToolUseConversation` ai-assist-driven loop helper (deferred to a follow-on stream per design §2.X Example B); MCP support (layer 2, sprint+1); any agentic-orchestration framework.

---

## Status entering

- Phase A design is merged (PR #436, 2026-06-03). The typed-schema-authoring path (`JsonSchema.object(...)` + `Static<typeof schema>`) shipped to release via PR #444 and is the source of truth for `parametersSchema`.
- Phase B decisions are locked: event-type naming as-recommended (B1), `IAiStreamEvent` extended directly (B2), per-turn `executeClientToolTurn({events, nextTurn})` shape (B3), Anthropic thinking + client tools both required simultaneously (B4 = YES; spike findings drive C2 + C3 details), `maxRoundTrips` default 10 in the layer-2 helper (B5, informational — Phase C does not implement this helper), testbed scenario covers memory tool + chained `web_search` server tool (B6).
- B4 empirical findings (server-side enforcement, signature-delta append semantics, `redacted_thinking` and interleaved thinking handling, `tool_choice` restriction when thinking is active) are documented and inform C2 + C3 below.
- Nothing in `libraries/ts-extras/src/packlets/ai-assist/` has been modified for client tools yet. The current `tools` array surface is server-tools-only.

---

## In-scope paths (you may modify)

Files in `libraries/ts-extras/src/packlets/ai-assist/`:

- `model.ts` — add `IAiClientToolConfig<TParams>`, `IAiClientTool<TParams>`, `IAiStreamToolUseStart`, `IAiStreamToolUseDelta`, `IAiStreamToolUseComplete`, `IAiClientToolTurnResult`, `IAiClientToolContinuation`, `IAiClientToolCallSummary`; extend `AiToolConfig = AiServerToolConfig | IAiClientToolConfig`; extend `IAiStreamEvent` union with the three new client-tool variants; extend `IProviderCompletionStreamParams` with `clientTools?: ReadonlyArray<IAiClientTool>`.
- `converters.ts` — add `aiClientToolConfig` (validates name, description, and that `parametersSchema` exposes `.validate()` / `.toJson()` — no hand-rolled JSON Schema structural inspection).
- `toolFormats.ts` — extend `toResponsesApiTools`, `toAnthropicTools`, `toGeminiTools` to handle `IAiClientToolConfig` entries; each adapter calls `config.parametersSchema.toJson()` at the adapter site to emit wire-format JSON Schema (per-provider field name: `parameters` / `input_schema` / inside `function_declarations`).
- `streamingAdapters/anthropic.ts` — handle `content_block_start` with `type === 'tool_use'`; accumulate `input_json_delta`; emit `client-tool-call-start` on block start, `client-tool-call-done` on block stop. **Also** (B4 requirement): handle `content_block_start` with `type === 'thinking'` and `type === 'redacted_thinking'`; accumulate `thinking_delta` (append) and `signature_delta` (**append, not overwrite**); preserve all blocks in stream order in the ordered accumulation buffer for the round-trip continuation builder.
- `streamingAdapters/openaiResponses.ts` — handle `response.output_item.added` for `function_call` type; accumulate `response.function_call_arguments.delta` per call id; emit `client-tool-call-done` on `response.function_call_arguments.done`.
- `streamingAdapters/gemini.ts` — handle `functionCall` parts in chunks; emit `client-tool-call-done` immediately (no delta accumulation).
- `streamingAdapters/clientToolContinuationBuilder.ts` — **NEW.** Per-provider continuation message construction. Anthropic: assistant turn reconstructed from the ordered accumulation buffer with thinking / redacted_thinking / text / tool_use blocks in exact stream order + user turn with `tool_result` blocks. OpenAI/xAI: input items (`function_call` + `function_call_output`). Gemini: model turn (`functionCall`) + user turn (`functionResponse`). Exports `executeClientToolTurn` which orchestrates: stream events, call `config.parametersSchema.validate(rawArgs)` → `Result<TParams>`, invoke `execute(typedArgs)`, build continuation, emit `client-tool-result` events, return `{events, nextTurn}`. **Anthropic-specific constraint:** when thinking is active, the assistant-turn reconstruction must not set `tool_choice: { type: 'any' }` or `tool_choice: { type: 'tool', ... }` on follow-up requests (per E3 of the spike findings).
- `streamingClient.ts` — pass `clientTools` through to per-adapter calls; export `executeClientToolTurn` from the packlet index.
- `index.ts` / packlet barrel — export new public types and `executeClientToolTurn`.

Test files (mirror the source files):

- `src/test/unit/packlets/ai-assist/converters.test.ts` — extend with `aiClientToolConfig` coverage.
- `src/test/unit/packlets/ai-assist/toolFormats.test.ts` — extend for each provider's client-tool emission (typed schema → wire schema via `.toJson()`).
- `src/test/unit/packlets/ai-assist/streamingAdapters/anthropic.test.ts` — `tool_use` block handling; `thinking` + `signature_delta` accumulation (critical: signature append correctness); `redacted_thinking` passthrough; interleaved thinking ordering; parallel tool calls with thinking.
- `src/test/unit/packlets/ai-assist/streamingAdapters/openaiResponses.test.ts` — `function_call` accumulation.
- `src/test/unit/packlets/ai-assist/streamingAdapters/gemini.test.ts` — `functionCall` emission.
- `src/test/unit/packlets/ai-assist/streamingAdapters/clientToolContinuationBuilder.test.ts` — **NEW.** Per-provider continuation builders; the round-trip helper's typed-schema validate → execute path; error paths (unknown tool name, schema-validation failure on rawArgs, execute callback returns `Result.fail`, execute callback throws).

`samples/testbed/` (B6-driven scope):

- New scenario directory exercising the memory tool + chained `web_search` server tool flow on Anthropic with thinking enabled. Scenario shape mirrors the existing testbed conventions (one TypeScript scenario file + a README pointing to it). The scenario must actually call the live API at least once during testbed execution — the testbed is the empirical-verification layer for E5 (signature accumulation) per the spike's §3.4 and §5.3.

Docs:

- `.ai/instructions/LIBRARY_CAPABILITIES.md` — extend the `@fgv/ts-extras/ai-assist` entry with the client-tool surface (typed schema authoring, `IAiClientTool`, `executeClientToolTurn`, the per-turn round-trip pattern, server + client tool coexistence per design §2.5).
- `.ai/tasks/active/ai-assist-client-tools/state.md` — checkpoint per sub-phase.
- `.ai/tasks/active/ai-assist-client-tools/result.md` — required exit artifact (see "Required exit artifact" below).

**Exhaustive-switch update sweep (load-bearing for C1):** because `IAiStreamEvent` is widened directly (per B2), every file in the repo that has an exhaustive switch over `IAiStreamEvent` must add cases for the three new client-tool variants in the same PR. Known initial sites: `streamingClient.ts` and any `samples/testbed` scenarios that switch on event type. Run `grep -rn "IAiStreamEvent" libraries/ tools/ samples/` before closing C1; update every exhaustive-switch consumer in lockstep. Missing one is a CI break.

## Out-of-scope paths (you must NOT modify)

- `@fgv/ts-json-base` (`libraries/ts-json-base/`) — the `JsonSchema` namespace shipped via PR #444; consume `ISchemaValidator<T>` / `JsonSchema.Static<typeof schema>` from `@fgv/ts-json-base` as a workspace dependency. If you find the typed-schema surface is missing something Phase C needs, **STOP and surface** per the missing-input rule below — do not extend `ts-json-base` from this stream.
- `@fgv/ts-utils` core (Result, MessageAggregator, Logging, etc.) — consume; do not extend.
- Any other `libraries/*` package — out of scope.
- `@fgv/ts-extras-mcp` — does not exist yet; layer 2 / sprint+1.
- The higher-level `runToolUseConversation` helper (design §2.X Example B) — explicitly deferred to a follow-on stream. Do not ship it in Phase C.

## Required reading (load before writing code)

Decision substrate (read first):

1. `.ai/tasks/active/ai-assist-client-tools/design.md` — full design doc. §2 (surface), §2.7 (thinking + tools composability), §3 (layer split), §4.2 (Phase C sub-phases).
2. `.ai/tasks/active/ai-assist-client-tools/phase-b-brief.md` — locked decisions table (B1–B6).
3. `.ai/tasks/active/ai-assist-client-tools/b4-spike-findings.md` — full document. §3 (impact on C3), §4 (scope delta), §5 (edge cases), §6 (implementation recommendation).

Codebase substrate:

4. `libraries/ts-extras/src/packlets/ai-assist/model.ts` — current type surface; `AiServerToolType`, `AiServerToolConfig`, `IAiWebSearchToolConfig`, `IAiStreamEvent`, `IProviderCompletionStreamParams`.
5. `libraries/ts-extras/src/packlets/ai-assist/toolFormats.ts` — current adapter shape (the `switch ('web_search')` pattern that needs extending).
6. `libraries/ts-extras/src/packlets/ai-assist/apiClient.ts` — `callOpenAiResponsesStream`, `callAnthropicStream`, `callGeminiStream` entry shapes; how `tools` flows through.
7. `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/anthropic.ts` — the existing `content_block_start` / `content_block_delta` dispatcher; the `server_tool_use` precedent; the explicit comment that `input_json_delta` deltas are currently ignored (this is what C2 extends).
8. `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/openaiResponses.ts` — current event-type handling.
9. `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/gemini.ts` — current parts-iteration pattern.
10. `libraries/ts-extras/src/packlets/ai-assist/converters.ts` — `aiServerToolConfig` shape; mirror for `aiClientToolConfig`.
11. `libraries/ts-extras/src/packlets/ai-assist/streamingClient.ts` — public streaming entry; where `executeClientToolTurn` is exported.
12. `libraries/ts-json-base/src/packlets/json-schema-builder/` — `JsonSchema`, `ISchemaValidator<T>`, `Static<typeof schema>`, `JsonSchema.fromJson` — full namespace docs. The schema IS the validator; `.toJson()` emits the wire schema; `.validate()` returns `Result<TParams>`. **Do not** author a parallel Converter for client-tool args — the schema is the single source of truth.
13. `.ai/instructions/CODING_STANDARDS.md` — Result pattern, type-safe validation, extending-libraries-over-working-around discipline, the pre-PR gates (build / lint / test / `code-reviewer` / Copilot loop), the review-loop discipline section.
14. `.ai/instructions/TESTING_GUIDELINES.md` — 100% coverage requirement; Result matchers from `@fgv/ts-utils-jest`; the never-paper-over-failures rule.
15. `.ai/instructions/LIBRARY_CAPABILITIES.md` — the `JsonSchema` quick-reference entry (decision-shortcut row), the `ai-assist` row, the `Result-integration boundary` convention.
16. `.ai/instructions/ACTIVE_DEVELOPMENT.md` — `ai-assist` is on the active-development surface; breaking changes are acceptable. The `tools?: ReadonlyArray<AiServerToolConfig>` shape becomes `tools?: ReadonlyArray<AiToolConfig>` (union extended); update consumers in lockstep with the type change.

Skills to load just-in-time when the relevant work surface is touched (per the CLAUDE.md skill matrix):

- `/result-pattern` — any `Result<T>`-returning code in this stream (the round-trip helper, the per-provider continuation builders, converters).
- `/type-safe-validation` — the `aiClientToolConfig` converter; the schema-presence check.
- `/result-tests` — every new test file.
- `/value-hashing` — only if you need structural equality on accumulated tool calls; almost certainly not needed in Phase C.
- `/published-primitives-reflex` — before adding any utility-shaped code, check if a primitive exists.
- `/ts-utils-logging` — any diagnostic output emitted from the round-trip helper or the continuation builder.

## Missing-input rule (non-negotiable)

If any required-reading file or other declared input doesn't exist or you can't access it: **STOP**. Surface the gap to the orchestrator.

Do NOT:

- Recreate the missing input from your own analysis or codebase exploration.
- Re-derive followups / state / brief content from scratch.
- Improvise or guess at what the input was supposed to contain.
- Extend `ts-json-base` (or any other workspace package outside the in-scope list) if you find the typed-schema surface is missing something — that's an orchestrator-level scope expansion, not an implementer-level workaround.

Missing required-reading is an orchestrator-level provisioning gap, not an agent-level workaround.

## Dependencies

**Hard** (cannot start without):

- PR #446 (Phase B substrate + locked decisions) merged to the `ai-assist-client-tools` integration branch.
- `@fgv/ts-json-base` typed-schema surface (`JsonSchema` namespace, `ISchemaValidator<T>`, `Static<typeof schema>`, `JsonSchema.fromJson`) — already shipped to release via PR #444 (2026-06-03).

**Soft** (can stub if upstream not ready):

- None. The Phase B substrate is the only upstream dependency; once PR #446 is merged this stream is fully unblocked.

## v1 deliverables (in order)

### C1 — Types + converters + toolFormat adapters + exhaustive-switch sweep (2–3 days, 1 implementer)

1. New types in `model.ts`:
   - `IAiClientToolConfig<TParams = unknown>` with `type: 'client_tool'`, `name`, `description`, `parametersSchema: ISchemaValidator<TParams>`.
   - `IAiClientTool<TParams = unknown>` with `config: IAiClientToolConfig<TParams>` and `execute: (args: TParams) => Promise<Result<unknown>>`.
   - `IAiStreamToolUseStart` (`type: 'client-tool-call-start'`, `toolName`, `callId?`).
   - `IAiStreamToolUseDelta` (`type: 'client-tool-call-done'`, `toolName`, `callId?`, `args: JsonObject`).
   - `IAiStreamToolUseComplete` (`type: 'client-tool-result'`, `toolName`, `callId?`, `result: string`, `isError: boolean`).
   - `IAiClientToolCallSummary`, `IAiClientToolContinuation`, `IAiClientToolTurnResult`.
   - `AiToolConfig = AiServerToolConfig | IAiClientToolConfig`.
   - Extend `IAiStreamEvent` union with the three new variants.
   - Extend `IProviderCompletionStreamParams` with `clientTools?: ReadonlyArray<IAiClientTool>`.
2. Converter in `converters.ts`: `aiClientToolConfig` validates the wrapper shape and the presence of a usable `parametersSchema` (i.e. exposes `.validate()` / `.toJson()`). Do not inspect the inner JSON Schema structure — `JsonSchema.object(...)` already guarantees it.
3. Extensions to `toolFormats.ts`:
   - `toResponsesApiTools`: server tools → `{ type: "web_search" }` (existing); client tools → `{ type: "function", name, description, parameters: config.parametersSchema.toJson() }`.
   - `toAnthropicTools`: server tools → `{ type: "web_search_20250305", ... }` (existing); client tools → `{ name, description, input_schema: config.parametersSchema.toJson() }` (no `type` discriminator).
   - `toGeminiTools`: server tools → `{ google_search: {} }` (existing); client tools accumulate into a single `{ function_declarations: [...] }` entry, each function declaration's `parameters` from `.toJson()`.
4. **Exhaustive-switch sweep:** grep `IAiStreamEvent` consumers across `libraries/`, `tools/`, `samples/`; update every exhaustive switch to handle the three new variants. Add a default-handler / `assertNever` audit where appropriate.
5. Tests: `converters.test.ts` + `toolFormats.test.ts` extended; 100% coverage on the new code.

**Acceptance for C1:**

- `rushx build` passes in `@fgv/ts-extras`.
- `rushx lint` passes in `@fgv/ts-extras`.
- `rushx test` passes with 100% coverage in `@fgv/ts-extras`.
- `grep -rn "IAiStreamEvent" libraries/ tools/ samples/` shows zero exhaustive-switch consumers with missing cases.
- No `any` introduced; no manual JSON Schema structural validation (rely on `JsonSchema` from `ts-json-base`).

### C2 — Streaming adapter extensions (3–4 days, 1 implementer)

1. `anthropic.ts`:
   - Handle `content_block_start` with `type === 'tool_use'`: open a tool-use accumulator keyed by SSE `index`; record `id`, `name`, empty args buffer.
   - Handle `content_block_delta` with `delta.type === 'input_json_delta'`: append `partial_json` to the args buffer for the matching index.
   - Handle `content_block_stop` for a `tool_use` block: parse the accumulated args buffer as JSON; emit `client-tool-call-done` with the parsed `args`.
   - **B4 additions (load-bearing):**
     - Handle `content_block_start` with `type === 'thinking'`: open a thinking-block accumulator at the SSE `index`; empty thinking-text and signature buffers.
     - Handle `content_block_delta` with `delta.type === 'thinking_delta'`: **append** the `thinking` delta to the text buffer.
     - Handle `content_block_delta` with `delta.type === 'signature_delta'`: **append** (NOT overwrite — per E5 / §5.3 of the spike) the signature delta to the signature buffer. This is the most commonly-mishandled requirement and has a dedicated regression test (see below).
     - Handle `content_block_start` with `type === 'redacted_thinking'`: open a redacted-thinking accumulator at the SSE `index`; capture the opaque `data` field passthrough; no delta events follow.
     - **Ordered accumulation buffer:** maintain a positionally-ordered list of blocks (indexed by SSE `index`) that preserves the original stream order across all block types — `thinking`, `redacted_thinking`, `text`, `tool_use`. The C3 continuation builder reads this ordered buffer verbatim to reconstruct the assistant turn.
   - Emit `client-tool-call-start` on `content_block_start` for `tool_use` (when we have the `name`).
2. `openaiResponses.ts`:
   - Handle `response.output_item.added` for `type === 'function_call'`: open a call accumulator keyed by `id`; record `name`, empty args buffer.
   - Handle `response.function_call_arguments.delta`: append `delta` to the matching call's args buffer.
   - Handle `response.function_call_arguments.done`: parse the accumulated args as JSON; emit `client-tool-call-done` with the parsed `args`.
3. `gemini.ts`:
   - Handle `functionCall` parts in chunks: emit `client-tool-call-done` immediately with the part's `name` and `args` (no delta accumulation needed). No `callId`.
4. Each adapter's accumulator state is per-stream-instance; cleared on stream completion.
5. Tests:
   - Anthropic: `tool_use` block accumulation; multiple parallel `tool_use` blocks; **`thinking_delta` accumulation correctness; `signature_delta` append-not-overwrite regression test (a thinking block with a signature delivered across three deltas must produce the concatenated signature, not the last chunk); `redacted_thinking` passthrough; interleaved thinking + tool_use order preservation.**
   - OpenAI Responses: `function_call` accumulation; multiple parallel function calls.
   - Gemini: `functionCall` emission; multiple `functionCall` parts in one chunk.

**Acceptance for C2:**

- All gates as C1, plus:
- The signature-delta append regression test is named explicitly (e.g. `'accumulates signature_delta deltas by concatenation, not overwrite (E5 regression)'`) so a future reviewer can see the intent.
- The thinking + tool_use ordering is verified by a test using a representative stream fixture with interleaved blocks; the test asserts the ordered buffer matches the stream's positional order.

### C3 — Round-trip continuation builder + `executeClientToolTurn` (2–3 days, 1 implementer)

1. New file: `streamingAdapters/clientToolContinuationBuilder.ts`.
2. Per-provider continuation message builders:
   - `buildAnthropicContinuation`: reads the C2 ordered accumulation buffer; emits the assistant turn as a content-blocks array containing `thinking` (`{ type, thinking, signature }` — full signature, never truncated, never re-encoded), `redacted_thinking` (`{ type, data }` — opaque passthrough), `text` (`{ type, text }`), and `tool_use` (`{ type, id, name, input }`) blocks **in original stream order**; emits the user turn as content blocks of `tool_result` (`{ type, tool_use_id, content, is_error? }`) for each executed tool. Must NOT set `tool_choice: { type: 'any' }` or `tool_choice: { type: 'tool', ... }` on the follow-up request (per E3 / §5.4).
   - `buildOpenAiContinuation`: emits input items as `function_call` (`{ type, id, name, arguments }`) + `function_call_output` (`{ type, call_id, output }`).
   - `buildGeminiContinuation`: emits a model turn with `functionCall` parts + a user turn with `functionResponse` parts (correlation by name).
3. `executeClientToolTurn({descriptor, apiKey, prompt, messagesBefore, clientTools, maxRoundTrips?})` exported helper:
   - Builds the lookup map of `IAiClientTool` by tool name.
   - Starts the streaming request; iterates the underlying provider stream.
   - Forwards `text-delta`, `tool-event`, `client-tool-call-start`, `client-tool-call-done` events through to the consumer's iterable.
   - For each `client-tool-call-done` event:
     - Look up the tool by `toolName`. If unknown, surface a failure via `nextTurn` resolving to `Result.fail("model called unknown tool: ${toolName}")`; emit a `client-tool-result` event with `isError: true` first.
     - Call `tool.config.parametersSchema.validate(rawArgs)`. On `Result.fail`, surface as a tool error: emit `client-tool-result` with `isError: true` and the validation message; pass the error string back to the model via the continuation (provider-specific `is_error` / error text).
     - On `Result.ok`, invoke `tool.execute(typedArgs)` (wrapped via `captureAsyncResult` to convert thrown errors). On `Result.fail`, treat as tool error per above. On `Result.ok`, emit `client-tool-result` with `isError: false` and the stringified result.
   - When the stream completes:
     - If no tool calls occurred, resolve `nextTurn` with `{ continuation: undefined }`.
     - Otherwise, build the per-provider continuation via the appropriate builder; resolve `nextTurn` with `{ continuation: { messages, toolCallsSummary } }`.
   - Returns `{events: AsyncIterable<IAiStreamEvent>, nextTurn: Promise<Result<IAiClientToolTurnResult>>}`.
4. Tests in `clientToolContinuationBuilder.test.ts`:
   - **Anthropic builder:** thinking + tool_use happy path; `redacted_thinking` passthrough; interleaved thinking ordering; parallel tool_use blocks; non-thinking mode (must also work — no thinking blocks in buffer); the assertion that follow-up requests do not set forced `tool_choice` when thinking is active.
   - **OpenAI builder:** single call; parallel calls.
   - **Gemini builder:** single call; parallel calls; correlation by name.
   - **`executeClientToolTurn`:** happy-path round-trip (memory-tool-style); unknown tool name → `Result.fail`; schema validation failure → tool error in continuation; `execute` returning `Result.fail` → tool error in continuation; `execute` throwing → tool error in continuation; no tool calls → `continuation: undefined`.

**Acceptance for C3:**

- All gates as C1+C2, plus:
- The Anthropic-builder tests cover both thinking-active and thinking-inactive paths.
- The signature-passthrough is verified end-to-end (C2 accumulates → C3 emits the same string).
- A test confirms the `tool_choice` constraint (no forced choice when thinking is active).

### C4 — Integration + testbed scenario + docs (2–3 days, 1 implementer)

1. `streamingClient.ts`: re-export `executeClientToolTurn`; ensure `clientTools` flows through the existing `callProviderCompletionStream` entry where needed (or document why the helper is the only call path for client tools in Phase C).
2. Packlet `index.ts`: export `IAiClientTool`, `IAiClientToolConfig`, `executeClientToolTurn`, the new event-type interfaces.
3. **B6-driven testbed scenario** in `samples/testbed/`:
   - New scenario directory with a TypeScript scenario file + README.
   - Demonstrates a **memory tool (client) + `web_search` server tool** coexisting in the same call on Anthropic, with extended thinking enabled.
   - Scenario flow: user asks a question that benefits from both memory recall and web search; the model emits a `tool_use` for the memory tool first; the harness executes the memory callback and feeds the result back; the model then optionally invokes `web_search`; final response combines both.
   - The scenario calls the live API at least once during execution (this is the empirical verification step for E5 signature accumulation — the server validates the signature on the follow-up request).
   - The scenario surfaces a clear pass/fail summary so a future reader can re-run it after any change to `anthropic.ts` and verify the round-trip still works.
4. `.ai/instructions/LIBRARY_CAPABILITIES.md`: extend the `@fgv/ts-extras/ai-assist` entry with the client-tool surface. Cover: typed schema authoring (`JsonSchema.object` → `IAiClientToolConfig.parametersSchema`); the `IAiClientTool` shape and typed `execute`; `executeClientToolTurn` per-turn primitive; server + client tool coexistence; the `runToolUseConversation` follow-on-stream pointer for higher-level ergonomics; the cross-provider quirks table (call ID vs name correlation; thinking + tools by provider). Add a decision-shortcut row to the "Decision shortcuts (start here)" section.

**Acceptance for C4:**

- All gates as C1+C2+C3, plus:
- The testbed scenario runs end-to-end against Anthropic and reports success.
- `LIBRARY_CAPABILITIES.md` accurately describes the shipped surface (no aspirational claims about deferred follow-on work; the deferred `runToolUseConversation` is mentioned as a pointer, not as if it ships in Phase C).

---

## Acceptance criteria (the "stop point")

The stream's exit gate is the union of the four sub-phase acceptance criteria, plus:

- [ ] `rush build` passes from repo root.
- [ ] `rush test` passes from repo root with 100% coverage in every modified package.
- [ ] `rushx lint` passes in `@fgv/ts-extras` (load-bearing — not transitively run by build; see CODING_STANDARDS.md "rushx lint is a first-class gate").
- [ ] `rushx fixlint` run before the final commit (catches the mechanical class).
- [ ] No `any` types introduced; all fallible operations return `Result<T>`; no manual JSON Schema structural validation (`parametersSchema.toJson()` and `parametersSchema.validate()` are the only allowed paths).
- [ ] No `console.*` in business logic — use `@fgv/ts-utils` logging where any diagnostic is needed; the testbed scenario is the only exception (testbed is consumer-shaped).
- [ ] No backwards-compatibility shims for the widened `AiToolConfig` union or the widened `IAiStreamEvent` union — update consumers in lockstep with the type changes (per Erik's B2 override and the active-development surface rules).
- [ ] **B4-derived gates:**
  - [ ] Signature-delta append correctness has a named regression test in `anthropic.test.ts` (E5).
  - [ ] `redacted_thinking` passthrough is covered in `anthropic.test.ts` and the Anthropic-side continuation-builder tests (§5.5).
  - [ ] Interleaved thinking + tool_use ordering is verified by a test with a representative interleaved fixture (§5.1, E6).
  - [ ] The Anthropic continuation builder does not set forced `tool_choice` when thinking is active; verified by a test (§5.4, E3).
  - [ ] The testbed scenario in `samples/testbed/` exercises Anthropic thinking + memory tool + `web_search` end-to-end live (the only path that empirically verifies server-side signature acceptance — unit tests cannot).
- [ ] `code-reviewer` agent run on the final diff **before opening the PR**; findings resolved or dispositioned in the PR description (per CODING_STANDARDS.md "Review-loop discipline" — layer 1).
- [ ] Copilot review loop driven by the implementer; stopped on diminishing returns or 10-round cap; stop reason recorded in the PR description (layer 2).
- [ ] Required exit artifact (`result.md`) written.

## Handoff contract (what you publish for downstream streams)

Published artifacts (downstream streams import or extend these):

- **`IAiClientToolConfig<TParams>`** (export from `@fgv/ts-extras/ai-assist`) — consumed by:
  - the future `runToolUseConversation` follow-on stream (layer-1 ergonomics layer; design §2.X Example B).
  - `@fgv/ts-extras-mcp` (layer 2, sprint+1) — MCP tool descriptors are converted to `IAiClientToolConfig<JsonValue>` via `JsonSchema.fromJson`.
- **`IAiClientTool<TParams>`** (export from `@fgv/ts-extras/ai-assist`) — consumed by the same downstream streams. This is the seam between layer 1 and layer 2.
- **`AiToolConfig`** widened union (export from `@fgv/ts-extras/ai-assist`) — server + client tool coexistence; consumed by any caller passing tools to a streaming entry.
- **`IAiStreamEvent`** widened union (export from `@fgv/ts-extras/ai-assist`) — the three new client-tool event variants; consumed by every existing and future exhaustive-switch consumer.
- **`executeClientToolTurn`** (export from `@fgv/ts-extras/ai-assist`) — the per-turn helper; consumed directly by personaility and by the future `runToolUseConversation` helper as its internal primitive.
- **`LIBRARY_CAPABILITIES.md` ai-assist entry update** — the public-facing description of the new surface; consumed by all AI assistants and human developers working in this repo.

The seam is designed to be additive: the follow-on `runToolUseConversation` stream and the layer-2 `@fgv/ts-extras-mcp` package both build on these exports without modifying them.

## Open questions to resolve

None outstanding. All Phase B questions are locked (see `phase-b-brief.md`). If the implementing agent surfaces an unexpected ambiguity during implementation, surface it via a `findings/inbox/` entry — do not improvise.

Likely surfaces that may need a finding:

- **Empirical verification of OpenAI Responses API function-calling streaming event names** (design.md §4.4 risk row). The names in design.md §1.1 are doc-derived. If the testbed scenario or the C2 implementation reveals a discrepancy, surface as a finding before adapting the adapter to a name that contradicts the design's documented mapping.
- **Gemini parallel-call correlation when two calls hit the same tool name** (design.md §4.4 risk row). The positional `functionCall` array order is the de-facto correlation; if a real-world stream exposes a problem, surface as a finding and consider adding a `callIndex` to Gemini client-tool events.
- **Anthropic parallel tool calls + interleaved thinking** (spike findings §5.2). Docs are ambiguous on whether each `tool_use` gets its own preceding `thinking` block when emitted in parallel. The positional accumulation buffer is safe either way; surface a finding if the testbed scenario reveals a constraint the design hasn't named.

## Findings-inbox convention

Findings surfaced during the stream go to per-file inbox entries at `.ai/tasks/active/ai-assist-client-tools/findings/inbox/<timestamp>-<slug>.md` — one finding per file. The orchestrator periodically drains the inbox into the consolidated `followups.md`. Don't write to `followups.md` directly during the stream.

## Required exit artifact

On completion, write `.ai/tasks/active/ai-assist-client-tools/result.md` with:

- Branch name (`chore/ai-assist-client-tools-phase-c-impl`) and the PR number.
- One-paragraph summary of what shipped.
- Files changed (list).
- Build / test / lint status per package (pass/fail per command).
- **B4-derived self-audit (load-bearing):**
  - Confirm the named signature-delta append regression test exists and passes.
  - Confirm `redacted_thinking` passthrough coverage.
  - Confirm interleaved thinking + tool_use ordering coverage.
  - Confirm the `tool_choice` restriction test.
  - Confirm the testbed scenario ran end-to-end against Anthropic and reported success (paste the testbed scenario's summary output).
- **Observability self-audit:** grep in-scope paths for `console.*` in business logic; confirm zero hits or document each kept-as-is site with explicit rationale. (The testbed scenario is the only allowed exception.)
- **Convention-compliance sweep** (per `.ai/instructions/CODE_REVIEW_CHECKLIST.md`):
  - No `any` types.
  - No manual JSON Schema structural validation.
  - No double-cast patterns.
  - All fallible operations return `Result<T>`.
  - `orThrow` only in setup paths.
  - Result chaining used where it improves clarity.
- **Sibling-sweep pass:** for `IAiClientToolConfig` / `IAiClientTool` / the new event types / `executeClientToolTurn` — what siblings did they asymmetrically diverge from? (e.g. is the event-naming consistent with `IAiStreamThinkingDelta` naming that the future thinking-events stream will add?)
- `code-reviewer` agent run summary: priority findings and their disposition.
- Copilot review loop summary: round count, stop reason.
- Open questions or follow-ups for downstream streams (follow-on `runToolUseConversation`, layer 2 MCP).
- Any deviation from this brief (and why).

## Resume protocol

If interrupted, before resuming:

1. Read this brief in full again.
2. Read `.ai/tasks/active/ai-assist-client-tools/state.md` for the most recent checkpoint.
3. Read any `findings/inbox/` entries created since the last checkpoint.
4. Confirm with the orchestrator that scope and boundaries still apply.
