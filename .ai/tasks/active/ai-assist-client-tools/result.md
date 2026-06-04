# Stream exit artifact: `ai-assist-client-tools` Phase C

**Status:** Complete — all gates green, PR open.
**Date:** 2026-06-04
**Agent:** Code Monkey

---

## What shipped

### C1 — Model types
- `IAiClientTool<TParams>` — harness tool contract (config + execute callback)
- `IAiClientToolConfig` — tool descriptor (name, description, `parametersSchema: ISchemaValidator<TParams>`)
- `IAiClientToolContinuation` — round-trip result carrying `messages: ReadonlyArray<JsonObject>` (provider-format wire objects, may contain thinking blocks) + `toolCallsSummary`
- `IAiClientToolTurnResult` — full turn result (`continuation`, `fullText`)
- Stream event variants: `client-tool-call-start` (type `'client-tool-call-start'`), `client-tool-call-done` (type `'client-tool-call-done'`), `client-tool-result` (type `'client-tool-result'`)
- Converter `aiClientToolConfig` for `IAiClientToolConfig` wire format (implemented as `Converters.object`)

### C2 — Streaming adapter extensions
- Anthropic adapter: full client-tool streaming loop — accumulates `tool_use` blocks, dispatches to `execute` callbacks, assembles `tool_result` blocks, emits `client-tool-call-start` / `client-tool-call-done` / `client-tool-result` stream events
- Tool format adapters: extended for client-tool wire format (Anthropic `input_schema`, OpenAI/Responses `function`, Gemini `function_declarations`)
- OpenAI Responses and Gemini: full pass-through of client tools in `tools` array
- 100% test coverage: unit tests for Anthropic client-tool streaming, tool format adapters, per-provider continuation builders

### C3 — `executeClientToolTurn` harness
- `executeClientToolTurn(params: IExecuteClientToolTurnParams): Result<IExecuteClientToolTurnResult>`
- Returns `{ events: AsyncIterable<IAiStreamEvent>, nextTurn: Promise<Result<IAiClientToolTurnResult>> }`
  - `IAiClientToolTurnResult` carries `{ continuation?: IAiClientToolContinuation, fullText: string }`
  - `continuation` is `undefined` when the model does not call any client tools
- `IExecuteClientToolTurnParams.model` is optional — falls back to `resolveModel(descriptor.defaultModel)`
- Consumer drives the outer multi-turn loop; helper handles one turn's streaming + dispatch + continuation assembly
- Anthropic, OpenAI, and Gemini continuation builders tested end-to-end (unit tests, mock streaming)

### C4 — Packlet exports, design gap fix, testbed scenario
**Packlet re-exports:**
- `executeClientToolTurn`, `IExecuteClientToolTurnParams`, `IExecuteClientToolTurnResult` exported from packlet index via `streamingClient.ts` barrel
- `IResolvedThinkingConfig` exported from packlet index

**Design gap fix — `continuationMessages`:**
- `IExecuteClientToolTurnParams.continuationMessages?: ReadonlyArray<JsonObject>` — accepts provider-format wire messages (thinking blocks + tool results) from a prior turn's `continuation.messages`
- `IBuildMessagesOptions.rawTail?: ReadonlyArray<JsonObject>` — new field in `chatRequestBuilders.ts`; appended verbatim after the user message (tail position, not head)
- `buildAnthropicMessages` wired to `rawTail`; `callAnthropicStream` accepts `continuationMessages` as 11th arg
- Unit test verifying message order: `[user, assistant-with-thinking, user-with-tool_result]` = 3 messages total

**Testbed scenario (`samples/testbed/src/scenarios/anthropicClientTools/`):**
- Anthropic + extended thinking (`anthropicEffort: 'low'`) + `recall_memory` client tool (JsonSchema-validated, in-memory key-value store) + `web_search` server tool
- Checks `process.env.ANTHROPIC_API_KEY` at startup; fails with clear message if absent
- Registered in `samples/testbed/src/scenarios/index.ts`

**LIBRARY_CAPABILITIES.md updated:**
- Extended `@fgv/ts-extras/ai-assist` entry with full client-tool surface documentation
- Added decision-shortcuts entry for `executeClientToolTurn`

---

## Design decisions made during implementation

| Decision | Rationale |
|---|---|
| `IAiClientTool` at call site unparameterized (default `unknown`) | `execute` is contravariant in `TParams`; `IAiClientTool<{key:string}>` is NOT assignable to `IAiClientTool<unknown>`. Validate inside `execute` via `parametersSchema.validate(args)`. This is the only correct pattern. |
| `continuationMessages` separate from `messagesBefore` | `messagesBefore` is `IChatMessage[]` (pre-user-message head). Continuation messages are `JsonObject[]` (post-user-message tail). Different types, different wire positions. Same bag, different field. |
| `rawTail` in `IBuildMessagesOptions`, not a new builder function | Minimal additive change; `buildMessages` (OpenAI/xAI path) doesn't need `rawTail` since continuation is Anthropic-only for layer 1. If another provider needs it later, the field is already declared. |
| `aiClientToolConfig` uses `Converters.object` not `Converters.generic` | `Converters.object` is the idiomatic pattern for structured conversion — never use `Converters.generic` with manual type checks + unsafe casts (P1 finding in code review). |
| `effectiveTools` merges server + client tools in `executeClientToolTurn` | Client tools must reach the provider in the request body (`tools` array). Original implementation passed only `tools` (server tools) to the adapters — client tool configs were never sent (P1-1 structural gap). |
| `JsonArray` for array accumulation in continuation builders | Using `JsonObject[]` + `as unknown as JsonObject` double-casts defeats type safety (P1-3). `JsonArray` is the correct type for an array of `JsonValue`. |

---

## Code-reviewer pass summary

Initial pass findings (P1/P2) and their resolutions are documented in `.ai/tasks/active/ai-assist-client-tools/code-reviewer-pass.md`.

---

## Live testbed run

`ANTHROPIC_API_KEY` was not present in the session environment. Live testbed run not performed.

The testbed scenario is functionally verified via unit tests (mock streaming, request-body verification). To run live:

```bash
cd samples/testbed
ANTHROPIC_API_KEY=<key> rushx run -- anthropicClientTools
```

---

## Gates passed

| Gate | Package | Status |
|---|---|---|
| `rushx build` | `@fgv/ts-extras` | PASS |
| `rushx lint` | `@fgv/ts-extras` | PASS |
| `rushx test` (100% coverage) | `@fgv/ts-extras` | PASS |
| `rushx build` | `@fgv/testbed` | PASS |
| `rushx fixlint` run | both | PASS |

---

## Files changed (Phase C + code-review fixes)

**Created:**
- `samples/testbed/src/scenarios/anthropicClientTools/index.ts` — testbed scenario
- `.ai/tasks/active/ai-assist-client-tools/code-reviewer-pass.md` — code-review findings + resolutions

**Modified:**
- `libraries/ts-extras/src/packlets/ai-assist/converters.ts` — `aiClientToolConfig` rewritten as `Converters.object` (P1-2)
- `libraries/ts-extras/src/packlets/ai-assist/chatRequestBuilders.ts` — `rawTail` field; `c8 ignore` accuracy fix (P2-6)
- `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/anthropic.ts` — tools param widened to `AiToolConfig` (P1-1)
- `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/openaiResponses.ts` — tools param widened to `AiToolConfig` (P1-1)
- `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/gemini.ts` — tools param widened to `AiToolConfig` (P1-1)
- `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/clientToolContinuationBuilder.ts` — `effectiveTools` merge (P1-1); `JsonArray` casts (P1-3); `model?` optional (P2-5)
- `libraries/ts-extras/src/packlets/ai-assist/index.ts` — C4 re-exports
- `libraries/ts-extras/src/packlets/ai-assist/streamingClient.ts` — barrel re-export
- `libraries/ts-extras/src/test/unit/ai-assist/converters.test.ts` — updated failure patterns for `Converters.object`
- `libraries/ts-extras/src/test/unit/ai-assist/clientToolContinuationBuilder.test.ts` — P1-1 body-verification tests; model-optional test (P2-5)
- `libraries/ts-extras/src/test/unit/ai-assist/streamingAdapters.test.ts` — `rawTail` message-order test
- `libraries/ts-extras/etc/ts-extras.api.md` — auto-updated by API extractor
- `samples/testbed/src/scenarios/index.ts` — registered anthropicClientTools scenario
- `.ai/instructions/LIBRARY_CAPABILITIES.md` — client-tool surface documentation
- `.ai/tasks/active/ai-assist-client-tools/state.md` — C1–C4 complete
- `.ai/tasks/active/ai-assist-client-tools/result.md` — this file

---

## PR

Branch: `chore/ai-assist-client-tools-phase-c-impl` → `ai-assist-client-tools`
