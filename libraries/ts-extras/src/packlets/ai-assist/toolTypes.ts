// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Tool types for AI assist: server-side tool configs, client-defined ("function")
 * tools, the streaming events a tool call produces, the provider-exclusion vocabulary,
 * and the client-tool round-trip result types.
 *
 * @remarks
 * Split out of `model.ts` when the provider-exclusion types pushed that file past the
 * 2000-line lint ceiling. The cut is along a real seam rather than an arbitrary one:
 * everything here is about tools and nothing here depends on the rest of `model.ts`,
 * so the module is a leaf. `model.ts` re-exports all of it, which is why no consumer
 * import changed.
 * @packageDocumentation
 */

import { type Result } from '@fgv/ts-utils';
import { type JsonObject, type JsonSchema } from '@fgv/ts-json-base';

// ============================================================================
// Server-Side Tools
// ============================================================================

/**
 * Built-in server-side tool types supported across providers.
 * @public
 */
export type AiServerToolType = 'web_search';

/**
 * Configuration specific to web search tools.
 * @public
 */
export interface IAiWebSearchToolConfig {
  readonly type: 'web_search';
  /** Optional: restrict search to these domains. */
  readonly allowedDomains?: ReadonlyArray<string>;
  /** Optional: exclude these domains from search. */
  readonly blockedDomains?: ReadonlyArray<string>;
  /** Optional: max number of searches per request. */
  readonly maxUses?: number;
  /**
   * Optional: enable image understanding during web search.
   * When true, the model can view and analyze images found during search.
   * Currently supported by xAI only; ignored by other providers.
   */
  readonly enableImageUnderstanding?: boolean;
}

/**
 * Union of all server-side tool configurations. Discriminated on `type`.
 * @public
 */
export type AiServerToolConfig = IAiWebSearchToolConfig;

/**
 * Declares a tool as enabled/disabled in provider settings.
 * Tools are disabled by default — consuming apps must opt in explicitly.
 * @public
 */
export interface IAiToolEnablement {
  /** Which tool type. */
  readonly type: AiServerToolType;
  /** Whether this tool is enabled by default for this provider. */
  readonly enabled: boolean;
  /** Optional tool-specific configuration. */
  readonly config?: AiServerToolConfig;
}

// ============================================================================
// Client-Defined Tools
// ============================================================================

/**
 * Behavior annotations for a client-defined tool.
 *
 * @remarks
 * These are **host-advisory-only hints** describing a tool's side-effect profile.
 * They are consumed by the host's tool loop (e.g. a before-execute gate) and are
 * **never serialized to the model** — the provider wire tool-schemas whitelist
 * `{name, description, parameters}` and ignore this field.
 *
 * Field names mirror MCP's `ToolAnnotations` (`@modelcontextprotocol/sdk`) 1:1 so
 * an MCP tool's annotations pass through unchanged. Per the MCP spec, all fields
 * are hints — a host should never make tool-use decisions based on annotations
 * received from an untrusted server without its own validation.
 *
 * @public
 */
export interface IAiToolAnnotations {
  /** Optional human-readable display title for the tool. */
  readonly title?: string;
  /** Hint: the tool does not modify its environment (read-only). */
  readonly readOnlyHint?: boolean;
  /** Hint: the tool may perform destructive updates (only meaningful when not read-only). */
  readonly destructiveHint?: boolean;
  /** Hint: repeated calls with the same arguments have no additional effect. */
  readonly idempotentHint?: boolean;
  /** Hint: the tool interacts with an open world of external entities. */
  readonly openWorldHint?: boolean;
}

/**
 * Configuration for a client-defined (harness-supplied) tool.
 *
 * @remarks
 * The `parametersSchema` is the single source of truth for both the wire-format
 * JSON Schema sent to the provider (via `.toJson()`) and the runtime argument
 * validation (via `.validate(rawArgs)`). Use `JsonSchema.object(...)` from
 * `@fgv/ts-json-base` to author the schema as a const (e.g. `const mySchema = JsonSchema.object({...})`);
 * the static type `TParams` is then derived via `JsonSchema.Static<typeof mySchema>` —
 * no drift between wire schema and runtime validation.
 *
 * @public
 */
export interface IAiClientToolConfig<TParams = unknown> {
  /** Discriminator — always `'client_tool'`. */
  readonly type: 'client_tool';
  /** Tool name sent to the model (must be unique within a call). */
  readonly name: string;
  /** Human-readable description of what the tool does, shown to the model. */
  readonly description: string;
  /**
   * JSON Schema validator for the tool's parameters. Emits wire format via
   * `.toJson()` and validates model-returned args via `.validate(rawArgs)`.
   */
  readonly parametersSchema: JsonSchema.ISchemaValidator<TParams>;
  /**
   * Optional host-advisory behavior annotations (read-only / destructive /
   * idempotent / open-world hints + display title). Consumed by the host's
   * tool loop; never serialized to the model. See {@link AiAssist.IAiToolAnnotations}.
   */
  readonly annotations?: IAiToolAnnotations;
}

/**
 * A client-defined tool: configuration + execution callback pair.
 *
 * @remarks
 * The `execute` callback receives typed `TParams` (already validated by
 * `config.parametersSchema.validate()`) and returns a `Promise<Result<unknown>>`.
 * Thrown errors are caught via `captureAsyncResult` in the round-trip helper.
 *
 * @public
 */
export interface IAiClientTool<TParams = unknown> {
  /** The tool's configuration (name, description, parameters schema). */
  readonly config: IAiClientToolConfig<TParams>;
  /**
   * Execute the tool with validated parameters.
   * @param args - Typed arguments, already validated against `config.parametersSchema`.
   * @returns A `Promise<Result<unknown>>` — the result is stringified and sent back to the model.
   */
  readonly execute: (args: TParams) => Promise<Result<unknown>>;
}

/**
 * Union of all tool configurations: server-side or client-defined.
 * Discriminated on `type`.
 * @public
 */
export type AiToolConfig = AiServerToolConfig | IAiClientToolConfig;

// ============================================================================
// Client Tool Streaming Events
// ============================================================================

/**
 * Emitted when a client-defined tool call begins streaming. Carries the tool name
 * and optional provider-assigned call ID (Anthropic / OpenAI Responses API; absent
 * for Gemini which does not assign call IDs).
 * @public
 */
export interface IAiStreamToolUseStart {
  readonly type: 'client-tool-call-start';
  /** The name of the client tool being called. */
  readonly toolName: string;
  /**
   * Provider-assigned call identifier (Anthropic: `toolu_*`; OpenAI: `call_*`).
   * Absent for Gemini (correlation by name).
   */
  readonly callId?: string;
}

/**
 * Emitted when a client-defined tool call is complete and its arguments are fully
 * accumulated. The `args` object is the fully parsed JSON object — no further
 * streaming deltas follow for this call.
 * @public
 */
export interface IAiStreamToolUseDelta {
  readonly type: 'client-tool-call-done';
  /** The name of the client tool being called. */
  readonly toolName: string;
  /**
   * Provider-assigned call identifier. Absent for Gemini.
   */
  readonly callId?: string;
  /** The fully accumulated and parsed tool arguments. */
  readonly args: JsonObject;
}

/**
 * Emitted after a client-defined tool has been executed and the result is ready
 * to be fed back to the model in the round-trip continuation.
 * @public
 */
export interface IAiStreamToolUseComplete {
  readonly type: 'client-tool-result';
  /** The name of the client tool that was executed. */
  readonly toolName: string;
  /**
   * Provider-assigned call identifier. Absent for Gemini.
   */
  readonly callId?: string;
  /** The stringified result returned by the tool's execute callback. */
  readonly result: string;
  /** Whether the tool execution failed (schema validation failure, execute error, or unknown tool). */
  readonly isError: boolean;
}

// ============================================================================
// Server/Client Tool Conflicts
// ============================================================================

/**
 * What to do when a request would combine a server tool with client (function)
 * tools on a provider that declares the two mutually exclusive (see
 * `IAiProviderDescriptor.serverToolsExclusiveWithClientTools`).
 *
 * @remarks
 * - `'drop-server-tools'` (the default) removes the offending server tools and
 *   keeps every client tool. Client tools are what the host registered
 *   explicitly for this turn; a built-in like grounding is a per-provider
 *   nicety, and dropping it degrades the turn rather than losing it.
 * - `'prefer-server-tools'` is the mirror image: keep the server tools and drop
 *   every client tool. For hosts whose turn is *about* the grounded answer.
 * - `'fail'` refuses the request up front with a message naming the conflict —
 *   the behavior before this policy existed. For hosts that would rather
 *   choose themselves than have either half silently disappear.
 *
 * Whichever is chosen, what actually happened is reported, never inferred: see
 * {@link AiAssist.IAiToolConflictReport}.
 * @public
 */
export type AiToolConflictPolicy = 'drop-server-tools' | 'prefer-server-tools' | 'fail';

/**
 * What the conflict resolution did to a turn's tools.
 *
 * @remarks
 * Required on {@link AiAssist.IAiClientToolTurnResult}, not optional, for the same reason
 * `structuredOutput` is required on a completion response: an absent report is
 * three-ways ambiguous — nothing conflicted / this build predates the feature /
 * the resolution ran and said nothing — and disambiguating exactly that is what
 * it is for. A turn where nothing conflicted reports the policy that was in
 * force and two empty arrays.
 * @public
 */
export interface IAiToolConflictReport {
  /** The policy that was in force for this turn (the default when none was passed). */
  readonly policy: AiToolConflictPolicy;
  /** Server tool types removed from the request. Empty when nothing was dropped. */
  readonly droppedServerTools: ReadonlyArray<AiServerToolType>;
  /** Names of client tools removed from the request. Empty when nothing was dropped. */
  readonly droppedClientTools: ReadonlyArray<string>;
}

// ============================================================================
// Client Tool Round-Trip Types
// ============================================================================

/**
 * Summary of a single client tool call within a turn: the tool name, call ID,
 * raw arguments, execution result, and whether the execution was an error.
 * @public
 */
export interface IAiClientToolCallSummary {
  /** The name of the tool that was called. */
  readonly toolName: string;
  /** Provider-assigned call identifier (absent for Gemini). */
  readonly callId?: string;
  /** The fully accumulated raw arguments object as parsed JSON. */
  readonly args: JsonObject;
  /** The stringified result (success value or error message). */
  readonly result: string;
  /** Whether execution failed (schema validation failure, execute error, or unknown tool). */
  readonly isError: boolean;
}

/**
 * The provider-specific continuation data needed to build the follow-up request
 * for the next round of the conversation.
 *
 * @remarks
 * `messages` are provider-native request objects (Anthropic: content-block arrays,
 * OpenAI Responses API: input items, Gemini: content parts). The continuation
 * builder in `clientToolContinuationBuilder.ts` populates this.
 *
 * @public
 */
export interface IAiClientToolContinuation {
  /**
   * **Cumulative** provider-native wire-format message objects covering all
   * tool rounds so far. On each turn, `executeClientToolTurn` prepends the
   * inbound `continuationMessages` so that this array always contains the
   * complete wire tail from round 1 through the current round.
   *
   * To drive a multi-round loop, simply **replace** `continuationMessages`
   * with this value — do not manually concatenate:
   *
   * ```ts
   * let tail: JsonObject[] | undefined;
   * while (true) {
   *   const { events, nextTurn } = executeClientToolTurn({
   *     ..., continuationMessages: tail
   *   }).orThrow();
   *   for await (const e of events) { /* observe *\/ }
   *   const outcome = (await nextTurn).orThrow();
   *   if (!outcome.continuation) break;
   *   tail = [...outcome.continuation.messages]; // replace — already cumulative
   * }
   * ```
   *
   * The exact shape is provider-native and may include provider-specific
   * blocks (e.g. Anthropic thinking/redacted_thinking/tool_use, OpenAI
   * function_call/function_call_output items, Gemini functionCall/functionResponse
   * parts). These are NOT `IChatMessage[]` and must NOT be placed in the
   * `messages` parameter — the normalized-message path strips provider-native
   * fields (thinking signatures, redacted_thinking data) that the server
   * requires for continuation validation.
   *
   * `toolCallsSummary` is per-round only (the calls executed in the current
   * turn). Only `messages` is cumulative.
   */
  readonly messages: ReadonlyArray<JsonObject>;
  /** Summary of each tool call executed in this turn (per-round, not cumulative). */
  readonly toolCallsSummary: ReadonlyArray<IAiClientToolCallSummary>;
}

/**
 * The result of a single client-tool turn: the optional continuation for the next
 * call (absent when no tool calls occurred) and whether the stream was truncated.
 * @public
 */
export interface IAiClientToolTurnResult {
  /**
   * The continuation data for the next round-trip. `undefined` when the model
   * completed without invoking any client tools.
   */
  readonly continuation: IAiClientToolContinuation | undefined;
  /** Whether the stream was truncated (token limit or stop reason). */
  readonly truncated: boolean;
  /** The full concatenated text from all `text-delta` events in this turn. */
  readonly fullText: string;
  /**
   * What the provider tool-conflict resolution did to this turn's tools.
   * Always present; empty arrays mean nothing conflicted.
   *
   * @remarks
   * Read this to tell the person (or the model, on a later turn) that a
   * capability they expected was unavailable — e.g. that web search was dropped
   * because the pinned model cannot ground and call functions in one request.
   */
  readonly toolConflicts: IAiToolConflictReport;
}
