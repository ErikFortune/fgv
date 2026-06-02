# Design — `ai-assist-client-tools`

**Stream:** ai-assist-client-tools  
**Phase:** A — design exploration  
**Date:** 2026-06-02  
**Author:** senior-developer agent  
**Status:** Complete — Phase A design amended per Erik review (2026-06-02)

---

## Table of Contents

1. [Cross-provider survey](#1-cross-provider-survey)
2. [fgv-native client-tool surface sketch](#2-fgv-native-client-tool-surface-sketch)
3. [Harness-tools / MCP separation](#3-harness-tools--mcp-separation)
4. [Phase B / C sizing](#4-phase-b--c-sizing)
5. [Recommendation](#5-recommendation)

---

## §1 Cross-provider survey

This section maps each provider's function-calling / tool-use API shape, then closes with the union-of-surface-variation the fgv-native abstraction must cover.

**Empirical baseline for §1:** The streaming adapter source (`streamingAdapters/anthropic.ts`, `openaiResponses.ts`, `gemini.ts`) is the authoritative account of what each provider actually emits — the code handles these shapes today. The non-streaming adapters (`apiClient.ts`) are similarly authoritative for the request shapes. Provider API documentation is used for client-tool (function-calling) shapes not yet present in the codebase; those assertions are marked _[doc-derived]_ and must be verified in Phase C's testbed scenario before any implementation decision finalizes.

---

### 1.1 OpenAI / xAI — Responses API (openai format providers)

**Current state in codebase:** `callOpenAiResponsesCompletion` and `callOpenAiResponsesStream` send `tools: toResponsesApiTools(tools)` for server-side tools only. The `translateOpenAiResponsesStream` generator handles `response.web_search_call.in_progress` and `response.web_search_call.completed` events.

**Client tool request shape** _[doc-derived, Responses API]:_

```json
{
  "model": "gpt-4o",
  "input": [...],
  "tools": [
    {
      "type": "function",
      "name": "recall_memory",
      "description": "Recall stored user context",
      "parameters": {
        "type": "object",
        "properties": {
          "query": { "type": "string", "description": "What to recall" }
        },
        "required": ["query"]
      }
    }
  ]
}
```

Client tools use `type: "function"` and a standard JSON Schema `parameters` object. This is structurally distinct from server tools (`type: "web_search"`) and both can coexist in the same `tools` array.

**Streaming response shape** _[doc-derived]:_

When the model decides to call a tool, it emits a sequence of SSE events:

```
event: response.output_item.added
data: { "item": { "type": "function_call", "id": "call_abc123", "name": "recall_memory" } }

event: response.function_call_arguments.delta
data: { "item_id": "call_abc123", "delta": "{\"query\":" }

event: response.function_call_arguments.delta
data: { "item_id": "call_abc123", "delta": "\"last preference\"}" }

event: response.function_call_arguments.done
data: { "item_id": "call_abc123", "arguments": "{\"query\":\"last preference\"}" }
```

**Key properties:**
- Tool calls identified by `id` (correlation across streaming deltas)
- Arguments arrive as partial JSON deltas — the adapter must accumulate per-call
- Multiple tool calls can be in-flight simultaneously (parallel tool calling); each has its own `id`
- Text deltas (`response.output_text.delta`) and function call argument deltas can interleave

**Round-trip shape** _[doc-derived]:_

After collecting results, the consumer submits a follow-up request with the full conversation history including the model's tool call outputs:

```json
{
  "model": "gpt-4o",
  "input": [
    { "role": "user", "content": "..." },
    {
      "type": "function_call",
      "id": "call_abc123",
      "name": "recall_memory",
      "arguments": "{\"query\":\"last preference\"}"
    },
    {
      "type": "function_call_output",
      "call_id": "call_abc123",
      "output": "{\"result\": \"user prefers dark mode\"}"
    }
  ],
  "tools": [...]
}
```

Tool results go into the `input` array as `function_call_output` items, not as a top-level `tool_result` field. The model's original function call item (`type: "function_call"`) must also be included.

**Parallel tool calls:** Supported. Multiple `response.function_call_arguments.done` events can appear with different `id`s. The consumer must execute all and feed results back in a single follow-up request.

**Thinking + tools:** _[doc-derived]_ The Responses API `reasoning` field and `tools` array coexist. There is no documented restriction for gpt-5.x class models. For o-series models, tools are available and composable with reasoning. The existing `resolvedThinking?.openAiEffort` handling in `callOpenAiResponsesStream` already gates the `reasoning` field correctly for `grok-4` — the same logic applies here.

**Model variants:** No dedicated `tools` model needed for client tools on OpenAI (unlike the xAI `grok-4.3` convention which is just a preference, not a strict requirement). The existing `ModelSpec` `tools` context key is sufficient.

---

### 1.2 Anthropic Messages API

**Current state in codebase:** `callAnthropicStream` sends `body.tools = toAnthropicTools(tools)` for server tools. The `translateAnthropicStream` generator handles `content_block_start` events with `block.type === 'server_tool_use'` but only routes `name === 'web_search'` to the existing `tool-event` surface. Client tools use a structurally different block type: `tool_use` (not `server_tool_use`).

**Client tool request shape** _[doc-derived, Messages API]:_

```json
{
  "model": "claude-sonnet-4-5",
  "messages": [{ "role": "user", "content": "..." }],
  "tools": [
    {
      "name": "recall_memory",
      "description": "Recall stored user context",
      "input_schema": {
        "type": "object",
        "properties": {
          "query": { "type": "string" }
        },
        "required": ["query"]
      }
    }
  ]
}
```

Note: Anthropic uses `input_schema` (not `parameters`), and there is no `type` discriminator on client tools (server tools have `type: "web_search_20250305"`). This is a key per-provider adapter difference.

**Streaming response shape** — _empirically verifiable against existing adapter:_

The existing adapter already handles `content_block_start` and `content_block_delta` by block type. Client tool calls produce:

```
event: content_block_start
data: { "index": 1, "content_block": { "type": "tool_use", "id": "toolu_01abc", "name": "recall_memory", "input": {} } }

event: content_block_delta
data: { "index": 1, "delta": { "type": "input_json_delta", "partial_json": "{\"query\":" } }

event: content_block_delta
data: { "index": 1, "delta": { "type": "input_json_delta", "partial_json": "\"last preference\"}" } }

event: content_block_stop
data: { "index": 1 }
```

The adapter currently ignores `input_json_delta` deltas (comment in `anthropicContentBlockDeltaPayload`: "other values (e.g. `input_json_delta` for tool args) are ignored"). This is the correct current behavior since we don't handle client tools yet — but it means the adapter already has the correct filtering structure; extending it means handling `tool_use` blocks in addition to `server_tool_use`.

**Round-trip shape** _[doc-derived]:_

After tool execution, the consumer constructs a new messages request with the assistant's turn (including the `tool_use` block) and a new `user` turn containing the result:

```json
{
  "messages": [
    { "role": "user", "content": "..." },
    {
      "role": "assistant",
      "content": [
        { "type": "text", "text": "Let me check your preferences." },
        {
          "type": "tool_use",
          "id": "toolu_01abc",
          "name": "recall_memory",
          "input": { "query": "last preference" }
        }
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "tool_result",
          "tool_use_id": "toolu_01abc",
          "content": "User prefers dark mode"
        }
      ]
    }
  ]
}
```

The `tool_use_id` correlates the result to the original call. The assistant turn must include the complete assistant message block (text + tool_use) from the streaming response — ai-assist needs to accumulate this during streaming.

**Parallel tool calls:** Supported. Multiple `tool_use` blocks can appear in the same assistant message (different `index` values in the stream). All must be executed; results go into a single new `user` turn as an array of `tool_result` blocks.

**Thinking + tools:** _[doc-derived]_ Anthropic's extended thinking composes with tools. The thinking output appears as a `thinking` content block before the `tool_use` block in the assistant message. The round-trip must include the thinking block in the reconstructed assistant message — omitting it causes an API error. This is a material constraint: when thinking is active, the accumulated assistant message for round-trip purposes must include any thinking blocks, not just text + tool_use.

**Server + client tool coexistence:** Anthropic supports mixing server tools (`web_search_20250305`) and client tools (`tool_use`) in the same `tools` array. The `toAnthropicTools` function must be extended to handle client tool entries.

---

### 1.3 Google Gemini

**Current state in codebase:** `callGeminiStream` passes `body.tools = toGeminiTools(tools)` for server tools. `toGeminiTools` maps `web_search` to `{ google_search: {} }`. The gemini stream adapter notes explicitly: "Gemini emits no explicit tool-progress events even when `google_search` is enabled — grounding metadata arrives attached to text chunks." Parts with `type !== 'text'` are currently ignored.

**Client tool request shape** _[doc-derived, generateContent API]:_

```json
{
  "contents": [...],
  "tools": [
    {
      "function_declarations": [
        {
          "name": "recall_memory",
          "description": "Recall stored user context",
          "parameters": {
            "type": "object",
            "properties": {
              "query": { "type": "string" }
            },
            "required": ["query"]
          }
        }
      ]
    }
  ]
}
```

Gemini groups client tools under a `function_declarations` key inside the `tools` array entry — structurally different from OpenAI and Anthropic. Server tools (`google_search`) and client tools appear as separate entries in the `tools` array.

**Streaming response shape** _[doc-derived]:_

Function call parts appear as parts in candidate content:

```json
{
  "candidates": [{
    "content": {
      "parts": [
        { "functionCall": { "name": "recall_memory", "args": { "query": "last preference" } } }
      ]
    }
  }]
}
```

**Key difference from OpenAI/Anthropic:** Gemini does NOT stream partial argument deltas. Function calls arrive complete in a single chunk. No `id` field on function calls — correlation in multi-call scenarios uses name + position. This simplifies the streaming adapter significantly but means parallel tool call tracking uses name (not an opaque id).

**Round-trip shape** _[doc-derived]:_

```json
{
  "contents": [
    { "role": "user", "parts": [{ "text": "..." }] },
    { "role": "model", "parts": [{ "functionCall": { "name": "recall_memory", "args": {...} } }] },
    { "role": "user", "parts": [{ "functionResponse": { "name": "recall_memory", "response": { "result": "dark mode" } } }] }
  ]
}
```

Results go into the next `user` turn as `functionResponse` parts. Correlation is by name, not by id.

**Parallel tool calls:** Supported. Multiple `functionCall` parts can appear in the same model turn. All must be executed; results go into the next user turn as multiple `functionResponse` parts.

**Thinking + tools:** _[doc-derived]_ Gemini 2.5 models support both thinking and tools. Thinking tokens appear in a separate `thought: true` part before the function call. Unlike Anthropic, the round-trip does not require including thinking content in the history. Gemini appears to accept the stripped history (model turn with only the `functionCall` part).

---

### 1.4 xAI Grok

**Current state in codebase:** xAI uses `apiFormat: 'openai'`, so it routes through the same OpenAI adapters. For server tools, it uses the Responses API path (`callOpenAiResponsesStream`). The registry notes `tools: 'grok-4.3'` as the preferred model for tool-augmented calls.

**Client tool API shape:** xAI's Responses API is OpenAI-compatible for function calling _[doc-derived]_. The request, streaming event names, and round-trip shapes are identical to §1.1. The same adapter handles both.

**xAI quirks:**
- `grok-4` rejects `reasoning_effort` parameter (handled by the existing `supportsReasoning = config.model !== 'grok-4'` check in `callOpenAiResponsesStream`).
- xAI is CORS-restricted (`corsRestricted: true, streamingCorsRestricted: true`) — direct browser calls require a proxy, which the existing architecture already enforces.

**Thinking + tools:** The existing `callOpenAiResponsesStream` already handles this correctly via `resolvedThinking?.xaiEffort`. The same logic applies to client tools.

---

### 1.5 Union of surface variation

The fgv-native abstraction must accommodate:

| Dimension | OpenAI / xAI | Anthropic | Gemini |
|---|---|---|---|
| Tool declaration field | `parameters` (JSON Schema) | `input_schema` (JSON Schema) | `parameters` inside `function_declarations` |
| Tool type discriminator | `type: "function"` | none (implicit) | `function_declarations` grouping |
| Call ID | string id, stable across stream | string id, per-block | no id — name-based correlation |
| Argument delivery | partial JSON deltas + done event | partial JSON deltas + block_stop | complete JSON in one chunk |
| Round-trip: assistant representation | `function_call` input items | assistant message with `tool_use` content blocks | model turn with `functionCall` parts |
| Round-trip: result representation | `function_call_output` input items | user turn with `tool_result` content blocks | user turn with `functionResponse` parts |
| Parallel tool support | yes, by id | yes, by id | yes, by name |
| Thinking + tools round-trip | no extra complexity | thinking blocks must be in assistant history | thinking parts excluded from history |
| Server + client tool coexistence | yes, same `tools` array | yes, same `tools` array (different type) | yes, separate entries in `tools` array |
| Streaming: text + tool call interleave | yes | yes | yes (different chunks) |

**Surface variation the fgv abstraction must hide:**
1. JSON Schema field name (`parameters` vs `input_schema`) — handled in `toAnthropicTools` extension
2. Tool array grouping (`function_declarations` wrapper) — handled in `toGeminiTools` extension
3. Call ID vs name-based correlation — unified event surface must carry name; id is an optional detail
4. Argument delta accumulation vs complete arrival — streaming adapter accumulates per-provider; upstream consumer receives complete JSON
5. Round-trip message construction — per-provider history format is entirely internal plumbing

---

## §2 fgv-native client-tool surface sketch

### 2.1 Core types

```typescript
// ============================================================================
// Client tool config (consumer-authored)
// ============================================================================

/**
 * A client-defined tool the consumer supplies for the model to call.
 * Name + description go to the model as-is; parametersSchema is a JSON Schema
 * object describing the expected arguments.
 */
export interface IAiClientToolConfig {
  readonly type: 'client_tool';
  readonly name: string;
  readonly description: string;
  /**
   * JSON Schema describing the tool's parameters.
   * Must be a JSON Schema object (type: "object") at the root.
   * Passed directly to provider toolFormat adapters with per-provider
   * field renaming (parameters → input_schema for Anthropic).
   * The consumer authors this; ai-assist does not generate it.
   */
  readonly parametersSchema: JsonObject;
}

/**
 * Callback invoked when the model calls a client-defined tool.
 * Returns the result as a string (JSON or plain text, provider-agnostic).
 * Result<string> allows the callback to surface tool execution failures
 * back to the round-trip orchestrator.
 */
export type AiClientToolCallback = (
  toolName: string,
  args: JsonObject
) => Promise<Result<string>>;

/**
 * A client tool paired with its execution callback.
 * Passed per-call alongside IAiClientToolConfig.
 */
export interface IAiClientTool {
  readonly config: IAiClientToolConfig;
  readonly callback: AiClientToolCallback;
}

// ============================================================================
// Extended union types
// ============================================================================

/**
 * Union of all tool configs (server-side + client-defined).
 * Discriminated on `type`.
 */
export type AiToolConfig = AiServerToolConfig | IAiClientToolConfig;
```

**JSON Schema vs Converter/Validator:**

Recommendation: **consumer-authored JSON Schema only** (not generated from Converter). Rationale:
- Converters are designed for conversion at runtime; JSON Schema is the lingua franca of LLM tool APIs
- Generating JSON Schema from a `Converter<T>` would require a reflection step that doesn't exist in the library
- The consumer already knows the tool's parameter structure; writing JSON Schema is not burdensome for simple tool configs (memory tool: one string field)
- If the consumer wants to validate the model's returned arguments before passing to the callback, they can define a Converter separately — ai-assist converts the raw JSON string to `JsonObject` but the consumer validates it

**No separate type for the arguments object:** The adapter parses `arguments` as `JsonObject`. The consumer's callback receives `JsonObject` and can validate as needed.

---

### 2.2 Streaming event types

**Override (2026-06-02):** Erik: _"We own all consumers and can change them, so let's just extend `IAiStreamEvent`."_ The three new client-tool variants are added directly to `IAiStreamEvent`; exhaustive switches in existing consumers are updated in lockstep. The `IAiStreamEventWithClientTools` union is dropped.

```typescript
/**
 * The model has decided to call a client-defined tool and is beginning
 * to emit arguments. Emitted once per tool call when we have the name.
 *
 * Added directly to IAiStreamEvent (no separate extended union).
 */
export interface IAiStreamToolUseStart {
  readonly type: 'client-tool-call-start';
  /** Tool name as declared in IAiClientToolConfig.name */
  readonly toolName: string;
  /**
   * Provider-specific call ID. Present for OpenAI/xAI/Anthropic;
   * absent for Gemini (correlation by name + position).
   */
  readonly callId?: string;
}

/**
 * The model has completed emitting arguments for a tool call.
 * At this point the consumer knows the complete argument set.
 * The round-trip orchestrator waits for all 'client-tool-call-done'
 * events before executing callbacks.
 *
 * Added directly to IAiStreamEvent (no separate extended union).
 */
export interface IAiStreamToolUseDelta {
  readonly type: 'client-tool-call-done';
  readonly toolName: string;
  readonly callId?: string;
  /** Complete parsed arguments as JsonObject. */
  readonly args: JsonObject;
}

/**
 * The round-trip orchestrator has executed the tool callback and
 * received a result. Surfaced for observability (e.g. a UI can show
 * "tool executed" indicators). Not emitted by the provider — emitted
 * by the round-trip loop itself.
 *
 * Added directly to IAiStreamEvent (no separate extended union).
 */
export interface IAiStreamToolUseComplete {
  readonly type: 'client-tool-result';
  readonly toolName: string;
  readonly callId?: string;
  /** The string result the callback returned (or error message on failure). */
  readonly result: string;
  /** Whether the callback returned a failure. */
  readonly isError: boolean;
}

/**
 * IAiStreamEvent is extended directly with the three client-tool variants.
 * We own all consumers and update exhaustive switches in lockstep.
 *
 * (Sketch — actual union definition lives in model.ts and is extended here.)
 */
export type IAiStreamEvent =
  | IAiStreamTextDelta
  | IAiStreamToolEvent          // server tool events (existing)
  | IAiStreamToolUseStart       // new: client tool call starting
  | IAiStreamToolUseDelta       // new: client tool call complete (arguments ready)
  | IAiStreamToolUseComplete    // new: client tool result (callback executed)
  | IAiStreamDone
  | IAiStreamError;
```

**Naming convention:** `client-tool-call-start`, `client-tool-call-done`, `client-tool-result` — mirrors the `tool-event` lifecycle but uses `client-tool-*` prefix to distinguish from server tool events. This follows the `IAiStreamThinkingDelta` naming pattern from the thinking-events stream brief.

**Why emit argument deltas vs only done?** For the harness-tools layer, consumers don't need partial argument access — the round-trip loop accumulates internally. `client-tool-call-start` and `client-tool-call-done` are the two surfaced events; argument deltas are internal. This keeps the streaming API surface minimal. If a consumer wants to show a spinner while arguments stream in, `client-tool-call-start` is sufficient.

---

### 2.3 Round-trip loop ownership recommendation

**Recommendation: consumer drives the loop; ai-assist provides a round-trip helper function.**

Specifically:

```typescript
/**
 * Extended params for a streaming call that includes client-defined tools.
 * Extends IProviderCompletionStreamParams with clientTools and an options bag.
 */
export interface IProviderCompletionStreamWithClientToolsParams extends IProviderCompletionStreamParams {
  /**
   * Client-defined tools. When present, tool-use events are surfaced and
   * the round-trip helper (if used) executes callbacks automatically.
   */
  readonly clientTools?: ReadonlyArray<IAiClientTool>;

  /**
   * Maximum number of tool-call round-trips before the loop terminates
   * with an error. Prevents infinite tool-call loops.
   * Default: 10.
   */
  readonly maxRoundTrips?: number;
}

/**
 * Executes one tool-call round-trip against a streaming provider.
 *
 * This is the ai-assist-provided helper, not an agentic loop.
 * The consumer calls this once per "turn"; it:
 * 1. Starts the streaming request
 * 2. Accumulates tool calls from the stream
 * 3. Executes client tool callbacks
 * 4. Constructs the next conversation turn with tool results
 * 5. Returns the iterable of events AND the next-turn messages for the consumer to feed back in
 *
 * The consumer drives the outer loop (how many turns, stopping conditions).
 */
export interface IAiClientToolRoundTrip {
  /**
   * The event stream for this turn. Includes text-delta events for
   * content before/after tool calls, and client-tool-* events.
   * Consumers iterate this to drive UI.
   */
  readonly events: AsyncIterable<IAiStreamEvent>;

  /**
   * Promise that resolves when the turn's event stream is exhausted.
   * Resolves to the conversation context update for the next turn
   * (messages to prepend as messagesBefore).
   * If no tool calls occurred, resolves to undefined (no follow-up needed).
   */
  readonly nextTurn: Promise<IAiClientToolTurnResult>;
}

export interface IAiClientToolTurnResult {
  /**
   * When defined, the consumer should call callProviderCompletionStream again
   * with these messages prepended (via messagesBefore) to continue the conversation.
   * When undefined, the model produced a final response without tool calls.
   */
  readonly continuation?: IAiClientToolContinuation;
}

export interface IAiClientToolContinuation {
  /** Messages representing this turn's assistant response + tool results, ready to prepend next call */
  readonly messages: ReadonlyArray<IChatMessage>;
  /** The tool calls that were executed this turn */
  readonly toolCallsSummary: ReadonlyArray<IAiClientToolCallSummary>;
}

export interface IAiClientToolCallSummary {
  readonly toolName: string;
  readonly callId?: string;
  readonly args: JsonObject;
  readonly result: string;
  readonly isError: boolean;
}
```

**Why not hide the loop inside `callProviderCompletionStream`?**

1. The consumer must own stopping conditions: infinite loop detection, max-turn policy, error recovery strategy
2. The consumer may want to inspect state between turns (logging, UI update, aborting)
3. Some consumers won't want automatic loop management at all — they want the raw events and will build their own continuation logic
4. A helper function that returns `(events, nextTurn)` is ergonomic for the common case without forcing an agentic pattern on consumers who don't want it

**Alternative rejected: hide the loop entirely in a `runWithClientTools()` function.** This would require the consumer to pass a complete conversation controller to ai-assist, inverting the ownership. Per the brief's explicit constraint: "the consumer drives the conversation loop; ai-assist makes the tool-use round-trip safe and ergonomic."

**Alternative rejected: return only raw events and force consumers to build their own continuation.** This is ergonomic for advanced consumers but inconvenient for the common case (personaility's memory tool). The `nextTurn` promise bridges the gap — consumers who want manual control can ignore it; consumers who want the ergonomic path use it.

---

### 2.X Consumer-driven vs ai-assist-driven loop: layered approach

This section provides concrete pseudo-code examples for both loop ownership modes and confirms they layer — a consumer-driven Phase C implementation is the foundation that a future ai-assist-driven helper wraps without breaking changes.

#### Example A — Consumer-driven loop (layer 1, ships in Phase C)

```typescript
// Define the memory tool
const memoryTool: IAiClientTool = {
  config: {
    type: 'client_tool',
    name: 'recall_memory',
    description: 'Recall stored context for the current user',
    parametersSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'What to recall' } },
      required: ['query']
    }
  },
  // Consumer owns the callback — ai-assist invokes it, consumer implements it
  callback: async (_name, args) =>
    captureAsyncResult(() => memoryStore.recall((args as { query: string }).query))
};

// Consumer drives the outer loop
let conversationHistory: ReadonlyArray<IChatMessage> = [];
let roundTrips = 0;
const MAX_ROUND_TRIPS = 5;

while (roundTrips < MAX_ROUND_TRIPS) {
  // Consumer calls the per-turn helper — one streaming request per iteration
  const turn = await executeClientToolTurn({
    descriptor,
    apiKey,
    prompt: buildPrompt(userMessage),
    messagesBefore: conversationHistory,  // accumulated from prior turns
    clientTools: [memoryTool]
  });

  // Consumer iterates the event stream for this turn — drives UI, logging, etc.
  // Consumer is responsible for: collecting events, error-handling mid-stream,
  // deciding whether to abort early
  for await (const event of turn.events) {
    if (event.type === 'text-delta') updateUI(event.delta);
    if (event.type === 'client-tool-call-start') showToolSpinner(event.toolName);
    if (event.type === 'client-tool-result') logToolExecution(event.toolName, event.result, event.isError);
    if (event.type === 'done') finalizeUI(event.fullText);
    if (event.type === 'error') handleError(event.message);  // consumer decides: abort? retry?
  }

  // Consumer awaits the turn's outcome — was a continuation needed?
  // Consumer is responsible for: inspecting the result, deciding whether to loop,
  // feeding messages back, enforcing their own stopping policy
  const turnResult = await turn.nextTurn;
  if (turnResult.isFailure()) {
    handlePipelineError(turnResult.message);
    break;
  }
  if (!turnResult.value.continuation) {
    break;  // Model produced a final response — consumer exits the loop
  }

  // Consumer prepends the continuation messages for the next turn
  // Consumer is responsible for: accumulation, history management
  conversationHistory = [...conversationHistory, ...turnResult.value.continuation.messages];
  roundTrips++;
}
// Note: the consumer drives every aspect of loop control, accumulation, and policy.
// This is intentionally verbose — the consumer has maximum visibility and control.
```

#### Example B — ai-assist-driven loop (additive, ships in a follow-on stream)

```typescript
// Same memory tool definition — identical IAiClientTool, no changes
const memoryTool: IAiClientTool = {
  config: {
    type: 'client_tool',
    name: 'recall_memory',
    description: 'Recall stored context for the current user',
    parametersSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'What to recall' } },
      required: ['query']
    }
  },
  callback: async (_name, args) =>
    captureAsyncResult(() => memoryStore.recall((args as { query: string }).query))
};

// Higher-level helper drives the loop internally — consumer gets the final turn only
// Helper signature (design question for the follow-on stream — names and knobs are illustrative):
//
//   function runToolUseConversation(params: {
//     descriptor: IAiProviderDescriptor;
//     apiKey: string;
//     prompt: string;
//     clientTools: ReadonlyArray<IAiClientTool>;
//     maxRoundTrips?: number;         // cap on iterations (default 10)
//     onTurnEvent?: (event: IAiStreamEvent) => void;  // optional: observe mid-stream events
//     // design questions for Phase B: tool-call timeout, per-tool retry policy, etc.
//   }): Promise<Result<IToolUseConversationResult>>;

const result = await runToolUseConversation({
  descriptor,
  apiKey,
  prompt: buildPrompt(userMessage),
  clientTools: [memoryTool],
  maxRoundTrips: 5,
  onTurnEvent: (event) => {
    if (event.type === 'text-delta') updateUI(event.delta);
    if (event.type === 'client-tool-result') logToolExecution(event.toolName, event.result, event.isError);
  }
});

if (result.isSuccess()) {
  finalizeUI(result.value.finalText);
} else {
  handleError(result.message);  // hit max iterations, tool failure, provider error
}
// The helper internally runs Example A's loop. Consumer sees only the final outcome.
```

#### Layering confirmation

**Phase C (layer 1) ships Example A only.** The `executeClientToolTurn` primitive — the per-turn helper returning `{ events, nextTurn }` — is the deliverable. Consumers drive the outer loop themselves, with full visibility and control over each turn.

**A follow-on stream adds Example B.** The higher-level `runToolUseConversation` helper (or equivalent name, to be decided in that stream's Phase B) wraps `executeClientToolTurn` internally. It drives Example A's loop with a standard stopping policy and an optional event observer. This is a **new export** — no changes to `executeClientToolTurn`, `IAiClientTool`, the event types, or the continuation builder.

**The primitives are the same at both layers.** Example B's helper uses `executeClientToolTurn`, `IAiClientTool`, `IAiStreamEvent`, and `IAiClientToolContinuation` internally — the same types the consumer uses directly in Example A. No parallel implementation; no abstraction bypass.

**Consumers who want maximum control stay on Example A.** Consumers who want the ergonomic fire-and-forget path adopt Example B when it ships. Both coexist; neither removes the other. The layering is confirmed: **start with a consumer-driven loop, add an ai-assist-driven helper in a later stream, no breaking change.**

---

### 2.4 Per-call vs registered tools

**Recommendation: per-call, matching the existing `tools?: ReadonlyArray<AiServerToolConfig>` pattern.**

```typescript
// Extended params — client tools alongside server tools
export interface IProviderCompletionStreamParams {
  // ... existing fields ...
  readonly tools?: ReadonlyArray<AiServerToolConfig>;       // existing server tools
  readonly clientTools?: ReadonlyArray<IAiClientTool>;      // new: client-defined tools
}
```

**Rationale:** Registered-tool patterns (like a registry with `register(name, config, callback)`) add lifecycle complexity (registration/deregistration, thread-safety for browser use, re-registration across component mounts). Per-call is simpler, matches the existing server-tool pattern, and is sufficient for the harness-tools layer. MCP's discovery + lifecycle management is where a registry pattern makes more sense — and that lives in `@fgv/ts-extras-mcp`, not in `ts-extras/ai-assist`.

---

### 2.5 Server + client tool coexistence

`AiToolConfig = AiServerToolConfig | IAiClientToolConfig` (discriminated on `type`) allows both in the same call. The `toAnthropicTools`, `toGeminiTools`, and `toResponsesApiTools` functions each need to handle both cases:

```typescript
export type AiToolConfig = AiServerToolConfig | IAiClientToolConfig;

// Updated signatures:
export function toAnthropicTools(tools: ReadonlyArray<AiToolConfig>): ReadonlyArray<JsonObject>;
export function toGeminiTools(tools: ReadonlyArray<AiToolConfig>): ReadonlyArray<JsonObject>;
export function toResponsesApiTools(tools: ReadonlyArray<AiToolConfig>): ReadonlyArray<JsonObject>;
```

For `toGeminiTools`: server tools produce `{ google_search: {} }`; client tools accumulate into `{ function_declarations: [...] }` — a single entry in the output array collecting all client tools.

For `toAnthropicTools`: server tools produce `{ type: "web_search_20250305", name: "web_search", ... }`; client tools produce `{ name, description, input_schema: parametersSchema }` (no `type` discriminator per Anthropic's API).

For `toResponsesApiTools`: server tools produce `{ type: "web_search" }`; client tools produce `{ type: "function", name, description, parameters: parametersSchema }`.

---

### 2.6 Error and refusal handling

**Model calls a tool that isn't in the client tools list:**
The streaming adapter receives a `client-tool-call-done` event for an unknown tool name. The round-trip helper returns `Result.fail` via the `nextTurn` promise: `"model called unknown tool: ${toolName}"`. The consumer sees a `client-tool-result` event with `isError: true` before the fail surfaces.

**Tool callback returns `Result.fail`:**
The round-trip helper treats this as a tool error. It constructs a `tool_result` with an error indicator (provider-specific: Anthropic has `is_error: true` on `tool_result`; OpenAI/xAI and Gemini receive the error text as the result string). The model is given the error result and continues. The `client-tool-result` event has `isError: true`. If the model produces a `tool_use` for the same tool again immediately (retry loop), `maxRoundTrips` protects against infinite cycles.

**Tool callback throws / rejects:**
`captureAsyncResult` wraps the callback invocation; any thrown error converts to `Result.fail` via the standard pattern.

**Tool callback times out:**
The consumer is responsible for timeout logic within their callback (they own the callback). The `AbortSignal` from the outer params can be passed to the callback by convention, but ai-assist does not enforce this.

**`maxRoundTrips` exceeded:**
The round-trip helper yields `{ type: 'error', message: 'client tool round-trip limit exceeded (10)' }` and resolves `nextTurn` with `Result.fail`. The outer stream terminates.

---

### 2.7 Composability with thinking-mode

**Per-provider summary:**

| Provider | Thinking + client tools | Round-trip constraint |
|---|---|---|
| OpenAI / xAI (Responses API) | Composable — `reasoning` + `tools` in same request | No extra round-trip complexity |
| Anthropic | Composable — thinking blocks appear before `tool_use` blocks | **Must include thinking blocks in reconstructed assistant turn for the follow-up request** |
| Gemini | Composable — thinking parts appear in model turn before `functionCall` | Thinking parts can be omitted from history (Gemini accepts stripped history) |

**The Anthropic constraint is load-bearing.** When `thinking` is active and the Anthropic adapter accumulates a streaming response for round-trip purposes, it must preserve any `thinking`-type content blocks in addition to `text` and `tool_use` blocks. The reconstructed assistant message for the follow-up must include the thinking block. Failing to include it produces an Anthropic API error.

**Streaming surface:** Thinking events (from the future `ai-assist-thinking-events` stream) and client-tool-call events can both appear in the same stream. Because we now extend `IAiStreamEvent` directly (override 2026-06-02), thinking events will similarly be added as new variants of `IAiStreamEvent` — the union grows in lockstep with each stream that adds new event types, and all consumers' exhaustive switches are updated together:

```typescript
// IAiStreamEvent after client-tool variants land (Phase C) and thinking variants
// are added by the future ai-assist-thinking-events stream:
export type IAiStreamEvent =
  | IAiStreamTextDelta
  | IAiStreamToolEvent          // server tool events (existing)
  | IAiStreamToolUseStart       // client tool call starting
  | IAiStreamToolUseDelta       // client tool call complete (arguments ready)
  | IAiStreamToolUseComplete    // client tool result (callback executed)
  // | IAiStreamThinkingDelta   ← added by thinking-events stream; exhaustive switches updated then
  | IAiStreamDone
  | IAiStreamError;
```

The thinking-events stream adds its event type directly to `IAiStreamEvent` and updates consumer exhaustive switches in that stream's PR — same lockstep discipline.

---

## §3 Harness-tools / MCP separation

### 3.1 Layer split table

| Piece | Layer 1 (harness tools) | Shared internal | Layer 2 (MCP) |
|---|---|---|---|
| `IAiClientToolConfig` type | owner | via ts-extras | referenced |
| `IAiClientTool` (config + callback) | owner | | |
| `AiClientToolCallback` type | owner | | |
| `IAiStreamClientToolCallStart/Done/Result` event types | owner | | |
| `toResponsesApiTools` extension for client tools | owner | | |
| `toAnthropicTools` extension | owner | | |
| `toGeminiTools` extension | owner | | |
| Streaming accumulation of tool call arguments | owner | | |
| `nextTurn` promise + continuation construction (per-provider) | owner | | |
| Round-trip loop helper (`executeClientToolRoundTrip` or similar) | owner | | |
| `maxRoundTrips` guard | owner | | |
| MCP client transport (stdio, SSE, HTTP) | | | owner |
| MCP tool discovery / listing | | | owner |
| MCP tool schema introspection → `IAiClientToolConfig` | | | owner |
| MCP session lifecycle | | | owner |
| MCP error propagation boundary | | | owner |
| `IAiClientToolConfig` as shared type | | ✓ (in ts-extras) | imports |
| `AiClientToolCallback` signature | | ✓ (in ts-extras) | imports |
| Event types for streaming | | ✓ (in ts-extras) | imports |

---

### 3.2 Where the seam lives

**The seam is `IAiClientTool`: a config + callback pair.**

Layer 1 consumers construct `IAiClientTool` directly:
```typescript
const memoryTool: IAiClientTool = {
  config: {
    type: 'client_tool',
    name: 'recall_memory',
    description: '...',
    parametersSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }
  },
  callback: async (name, args) => {
    const query = (args as { query: string }).query;
    return succeed(await memoryStore.recall(query));
  }
};
```

Layer 2 (MCP) constructs `IAiClientTool[]` from MCP server discovery:
```typescript
// Inside @fgv/ts-extras-mcp:
function mcpToolsToAiClientTools(
  session: IMcpSession,
  toolList: MCPTool[]
): ReadonlyArray<IAiClientTool> {
  return toolList.map((tool) => ({
    config: {
      type: 'client_tool',
      name: tool.name,
      description: tool.description,
      parametersSchema: tool.inputSchema
    },
    callback: async (name, args) => {
      return session.callTool(name, args);
    }
  }));
}
```

Both layers produce `IAiClientTool[]` and pass it to the same `clientTools` parameter on the streaming params. No changes to the core streaming or round-trip logic are required when MCP is added.

**The seam is designed to be additive.** Layer 2 is a new package (`@fgv/ts-extras-mcp`) that imports `IAiClientTool` and `AiClientToolCallback` from `ts-extras/ai-assist` and implements the MCP-specific plumbing. No changes to `ts-extras` are required when layer 2 ships.

---

### 3.3 MCP package shape

Following the Result-integration-boundary convention:

**Package:** `@fgv/ts-extras-mcp`

**Mission:** Wrap a well-maintained upstream MCP client SDK (likely `@modelcontextprotocol/sdk`) and adapt its throw-based API to `Result<T>`, while providing the glue that converts MCP tool descriptors to `IAiClientTool[]`.

**Six primitive operations (boundary surface):**

| Function | Return |
|---|---|
| `createMcpSession(transport)` | `Promise<Result<IMcpSession>>` |
| `listMcpTools(session)` | `Promise<Result<ReadonlyArray<IAiClientTool>>>` |
| `callMcpTool(session, name, args)` | `Promise<Result<string>>` |
| `closeMcpSession(session)` | `Promise<Result<void>>` — acceptable here as lifecycle |
| `createStdioTransport(command, args)` | `Result<IMcpTransport>` |
| `createHttpSseTransport(url, opts?)` | `Result<IMcpTransport>` |

**Shared types that must live in `ts-extras/ai-assist`** (to avoid a dependency inversion):
- `IAiClientToolConfig`
- `IAiClientTool`
- `AiClientToolCallback`

`@fgv/ts-extras-mcp` imports these from `@fgv/ts-extras` (workspace dep) and the consumer imports both independently.

**Explicitly NOT in scope for `@fgv/ts-extras-mcp`:** MCP server orchestration, process spawning beyond transport setup, tool result validation, schema conversion beyond basic JSON Schema passthrough, credential management for MCP servers.

---

## §4 Phase B / C sizing

### 4.1 Phase B open questions (decisions Erik needs to make)

| # | Question | Clear answer? | Options |
|---|---|---|---|
| B1 | **Event type naming**: `client-tool-call-start` / `client-tool-call-done` / `client-tool-result` vs alternative naming? | No strong alternative — recommend as-is | |
| B2 | **Extend `IAiStreamEvent` directly vs additive `IAiStreamEventWithClientTools` union?** | **Resolved (2026-06-02)** — Erik: "We own all consumers and can change them." Extend `IAiStreamEvent` directly; update exhaustive switches in lockstep. `IAiStreamEventWithClientTools` is dropped. | n/a — decided |
| B3 | **Round-trip helper API shape**: `executeClientToolRoundTrip()` returning `{events, nextTurn}` vs alternative? | Clear recommendation in §2.3, but Erik should confirm the ergonomics match personaility's mental model | |
| B4 | **Anthropic thinking + tools**: in Phase C, does personaility's use case require thinking + tools simultaneously? If yes, the Anthropic adapter must accumulate thinking blocks for the round-trip continuation. This is non-trivial extra work. | Erik decides based on personaility's roadmap | Yes (add thinking block accumulation) vs No (defer to later) |
| B5 | **`maxRoundTrips` default**: 10? Less? | Advisory — 10 is reasonable for a memory tool | |
| B6 | **Testbed scenario scope**: memory tool only, or also a broader example (e.g. web lookup tool that chains with web_search server tool)? | Erik decides scope | |

---

### 4.2 Phase C sub-phase sketch (layer 1 — harness tools)

**Estimated complexity: moderate** — touches 4 files in the main package, requires new streaming logic, 1 new file for round-trip helper, ~4 new test files.

**Sub-phases:**

**C1: Types + converters + toolFormat adapters (2–3 days, 1 implementer)**
- New types in `model.ts`: `IAiClientToolConfig`, `IAiClientTool`, `AiClientToolCallback`, `IAiStreamToolUseStart`, `IAiStreamToolUseDelta`, `IAiStreamToolUseComplete`, `IAiClientToolTurnResult`, `IAiClientToolContinuation`; extend `IAiStreamEvent` union with the three new variants
- New converter in `converters.ts`: `aiClientToolConfig` (validates name, description, parametersSchema is a `JsonObject`)
- Extensions to `toolFormats.ts`: `toAnthropicTools`, `toGeminiTools`, `toResponsesApiTools` each extended to handle `IAiClientToolConfig` entries
- **Exhaustive-switch updates:** Because `IAiStreamEvent` is widened directly (override 2026-06-02), every consumer file that has an exhaustive switch over `IAiStreamEvent` must be updated to handle the three new variants. Current known switch sites: `streamingClient.ts` and any test harness files that switch on event type. The implementer must grep for `IAiStreamEvent` consumers before closing C1. Each additional consumer file adds to the blast radius.
- Blast radius: `model.ts` (modify), `converters.ts` (modify), `toolFormats.ts` (modify), `converters.test.ts` (modify), `toolFormats.test.ts` (modify), + N consumer files with exhaustive switches — **~5 + N files** (N to be confirmed by implementer grep in Phase C)

**C2: Streaming adapter extensions for client tool events (3–4 days, 1 implementer)**
- `anthropic.ts`: handle `content_block_start` with `type === 'tool_use'` (not `server_tool_use`); accumulate `input_json_delta` deltas; emit `client-tool-call-start` on block start, `client-tool-call-done` on block stop
- `openaiResponses.ts`: handle `response.output_item.added` for `function_call` type; accumulate `response.function_call_arguments.delta` per call id; emit on `response.function_call_arguments.done`
- `gemini.ts`: handle `functionCall` parts in chunks; emit `client-tool-call-done` immediately (no delta accumulation needed)
- Per-adapter accumulator state: `Map<callId, { name, argsBuffer }>` (OpenAI/Anthropic); `Array<{ name, args }>` (Gemini)
- Blast radius: `anthropic.ts` (modify), `openaiResponses.ts` (modify), `gemini.ts` (modify), plus test files — 6 files

**C3: Round-trip continuation builder (2 days, 1 implementer)**
- New file: `clientToolContinuationBuilder.ts` (or integrated into a new `streamingAdapters/clientTools.ts`)
- Per-provider continuation message construction: Anthropic assistant turn (text + thinking blocks [if B4=yes] + tool_use blocks) + user turn (tool_result blocks); OpenAI input items (function_call + function_call_output); Gemini model turn (functionCall) + user turn (functionResponse)
- `executeClientToolTurn()` helper function — orchestrates: accumulate events, invoke callbacks via `captureAsyncResult`, build continuation, return `{events, nextTurn}` pair
- Blast radius: 1 new file + 1 new test file — 2 files

**C4: Integration + testbed scenario (2 days, 1 implementer)**
- Update `streamingClient.ts`: extend `IProviderCompletionStreamParams` with `clientTools?`; pass through to per-adapter calls; export `executeClientToolTurn` helper
- Add `memory-tool` scenario to `samples/testbed`: simple in-memory key-value store as the tool, exercising the full round-trip with at least one of Anthropic or OpenAI
- Update `LIBRARY_CAPABILITIES.md` ai-assist entry with client-tool surface
- Blast radius: `streamingClient.ts` (modify), `samples/testbed` (new scenario file), `LIBRARY_CAPABILITIES.md` (modify) — 3 files

**Total layer 1 blast radius:** ~16 files across `libraries/ts-extras` (ai-assist packlet) and `samples/testbed`, plus N additional consumer files that have exhaustive switches over `IAiStreamEvent` (implementer grep required in Phase C). No new packages created for layer 1.

---

### 4.3 Layer 2 (MCP) high-level estimate

**When:** Sprint+1 or later, depending on personaility's timeline for wanting MCP server connectivity.

**Work units:**
- Create `libraries/ts-extras-mcp/` with standard Rush package scaffolding (package.json, tsconfig.json, jest config, Heft config)
- Implement `createMcpSession`, `listMcpTools`, `callMcpTool`, `closeMcpSession` + two transport factories
- Test with an in-process MCP server mock (the upstream SDK's testing utilities are well-regarded)
- Add testbed scenario (MCP local server + memory tool served via MCP)

**Estimated blast radius (new package):** ~8–10 new files in the new package, no changes to `ts-extras`.

**Risk:** MCP SDK API stability. The `@modelcontextprotocol/sdk` is on an active major-version cadence. If the SDK changes between commission and implementation, the boundary layer needs updating. This risk is mitigated by the thin-boundary design — changes stay inside `@fgv/ts-extras-mcp` and don't propagate to consumers.

---

### 4.4 Risks / unknowns

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Anthropic thinking + tool_use round-trip requires thinking blocks in history — untested empirically | Medium | High | **Phase C must test this before finalizing the continuation builder.** If Anthropic accepts stripped history (thinking omitted), C3 simplifies; if not, the complexity stays. B4 decision gate. |
| Gemini function call correlation by name breaks with parallel calls having the same tool name | Low | Medium | Tool names are unique by definition — the schema validates name uniqueness. In practice, parallel calls to the same tool with different arguments are correlated by position in the `functionCall` parts array. This is fragile. Consider surfacing a `callIndex` in Gemini client-tool events. |
| xAI Responses API behavior for client tools differs from OpenAI Responses API | Low | Medium | The APIs are documented as compatible. The testbed scenario must exercise xAI specifically. The proxy path handles CORS restriction already. |
| `maxRoundTrips` not sufficient for deeply nested tool chains | Low | Low | 10 rounds is ample for a memory tool. Consumers can configure higher limits. |
| MCP SDK (`@modelcontextprotocol/sdk`) breaking changes | Medium | Low (contained to ts-extras-mcp) | Thin boundary design absorbs SDK churn. |
| OpenAI Responses API function-calling streaming event names differ from documentation | Medium | Medium | **Phase C testbed must verify event names against live API before finalizing the streaming adapter.** The event names in §1.1 are doc-derived and need empirical confirmation. |

---

## §5 Recommendation

### TL;DR

**Ship layer 1 (harness tools) in one sprint.** The seam is `IAiClientTool`; layer 2 (MCP) adds a new package that lowers into the same seam without touching `ts-extras`.

**Surface sketch (one code block):**

```typescript
// Consumer usage — memory tool with harness tools
const memoryTool: IAiClientTool = {
  config: {
    type: 'client_tool',
    name: 'recall_memory',
    description: 'Recall stored context for the current user',
    parametersSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'What to recall' } },
      required: ['query']
    }
  },
  callback: async (_name, args) => captureAsyncResult(() => memoryStore.recall((args as { query: string }).query))
};

// Per-turn call — consumer drives the loop
const turn = await executeClientToolTurn({
  descriptor,
  apiKey,
  prompt: buildPrompt(userMessage),
  clientTools: [memoryTool],
  maxRoundTrips: 5
});

// Stream events for UI
for await (const event of turn.events) {
  if (event.type === 'text-delta') updateUI(event.delta);
  if (event.type === 'client-tool-result') logToolExecution(event);
  if (event.type === 'done') finalizeUI(event.fullText);
}

// If there's a continuation (tool calls happened), loop
const result = await turn.nextTurn;
if (result.isSuccess() && result.value.continuation) {
  // Feed messages back for next turn
}
```

**Layer-split table:**

| Layer | Package | Key additions |
|---|---|---|
| 1 — harness tools | `@fgv/ts-extras` (ai-assist packlet) | `IAiClientToolConfig`, `IAiClientTool`, streaming events, per-provider adapters, round-trip helper |
| 2 — MCP | `@fgv/ts-extras-mcp` (new) | MCP session lifecycle, tool discovery → `IAiClientTool[]` |

**Phase C sub-phases:**

| Sub-phase | Work | Files |
|---|---|---|
| C1 | Types + converters + toolFormat adapters + exhaustive-switch updates | ~5 + N files (N = IAiStreamEvent switch sites) |
| C2 | Streaming adapter extensions | 6 files |
| C3 | Round-trip continuation builder | 2 files |
| C4 | Integration + testbed | 3 files |
| **Total** | | **~16 + N files** (N = IAiStreamEvent switch sites) |

---

### Full recommendation

**What I recommend and why:**

1. **Per-call client tools (not registered)** — matches the existing server-tool pattern; lifecycle simplicity; MCP brings its own registration concept
2. **JSON Schema as the parameter source-of-truth** — no Converter generation; consumers author it directly; it's the wire format the providers expect
3. **Extend `IAiStreamEvent` directly** — Erik override (2026-06-02): we own all consumers and update exhaustive switches in lockstep; the cleaner single-union shape beats the additive opt-in ergonomics
4. **Consumer drives the outer loop; `executeClientToolTurn` as a helper** — follows the brief's constraint; personaility gets ergonomics without ai-assist becoming an agentic framework
5. **`IAiClientTool` as the seam** — MCP adds a new package that converts MCP tool descriptors to `IAiClientTool[]`; the core library is untouched

**Alternatives Erik should consider:**

- **`tool_call` mode where ai-assist handles the entire conversation loop:** Would simplify consumer code further but violates the "no agentic framework" constraint from the brief. Consider only if personaility's mental model strongly prefers a fully opaque loop. (See §2.X Example B — this becomes available in a follow-on stream without requiring a breaking change to Phase C's primitives.)
- **Defer xAI empirical verification to Phase C:** §1.4 asserts xAI Responses API is OpenAI-compatible for client tools, doc-derived. If this proves wrong in Phase C testing, the adapter extension for xAI may need a separate path.

**One known stop-and-surface item:**

The Anthropic thinking + tools interaction (B4) is the most material unknown. If thinking is active and Anthropic requires the thinking blocks in the round-trip history, the C3 continuation builder must accumulate thinking-typed content blocks from the stream, which adds meaningful complexity. This should be verified empirically in Phase C before finalizing the C3 design — the testbed scenario should exercise `thinking + client tools` on Anthropic and observe whether omitting thinking blocks from the history causes an API error.

If that verification reveals that Anthropic _does_ require thinking blocks (which is the current documentation claim), the design in §2.7 stands. If it reveals they're optional, the continuation builder simplifies.
