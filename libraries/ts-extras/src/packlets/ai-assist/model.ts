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
 * Core types for AI assist: prompt class, provider descriptors, settings, and chat messages.
 * @packageDocumentation
 */

import { fail, type Result, succeed } from '@fgv/ts-utils';
import { type JsonObject, type JsonSchema } from '@fgv/ts-json-base';

// ============================================================================
// Image Data
// ============================================================================

/**
 * Universal image representation used for both image input (vision prompts)
 * and image output (generation responses).
 *
 * @remarks
 * The base64 string is raw — no `data:` URL prefix. Use {@link AiAssist.toDataUrl} to
 * format it for browser-display contexts.
 *
 * @public
 */
export interface IAiImageData {
  /** MIME type, e.g. `'image/png'`, `'image/jpeg'`, `'image/webp'`. */
  readonly mimeType: string;
  /** Base64-encoded image bytes (no `data:` prefix). */
  readonly base64: string;
}

/**
 * Formats an {@link IAiImageData} as a `data:` URL suitable for browser display.
 * @param image - The image to format
 * @returns A `data:<mime>;base64,<data>` URL string
 * @public
 */
export function toDataUrl(image: IAiImageData): string {
  return `data:${image.mimeType};base64,${image.base64}`;
}

/**
 * Image attachment for a vision (image-input) prompt.
 *
 * @remarks
 * Extends {@link IAiImageData} with an OpenAI-specific `detail` hint that is
 * silently ignored by Anthropic, Gemini, and other providers.
 *
 * @public
 */
export interface IAiImageAttachment extends IAiImageData {
  /**
   * OpenAI vision detail hint:
   * - `'low'`: faster, cheaper, lower fidelity
   * - `'high'`: slower, more expensive, higher fidelity
   * - `'auto'` (default): provider chooses
   *
   * Ignored by providers other than OpenAI.
   */
  readonly detail?: 'low' | 'high' | 'auto';
}

// ============================================================================
// AiPrompt
// ============================================================================

/**
 * A structured AI prompt with system/user split for direct API calls,
 * and a lazily-constructed combined version for copy/paste workflows.
 * @public
 */
export class AiPrompt {
  /** System instructions: schema documentation, format rules, general guidance. */
  public readonly system: string;
  /** User request: the specific entity generation request. */
  public readonly user: string;
  /**
   * Optional image attachments. When present, vision-capable providers will
   * include them in the user message; non-vision providers will reject the
   * call up front (see {@link AiAssist.IAiProviderDescriptor.acceptsImageInput}).
   */
  public readonly attachments: ReadonlyArray<IAiImageAttachment>;

  public constructor(user: string, system: string, attachments?: ReadonlyArray<IAiImageAttachment>) {
    this.system = system;
    this.user = user;
    this.attachments = attachments ?? [];
  }

  /**
   * Combined single-string version (user + system joined) for copy/paste.
   * When attachments are present, includes a sentinel noting they aren't
   * part of the copied text.
   */
  public get combined(): string {
    const sentinel =
      this.attachments.length > 0
        ? `\n\n[${this.attachments.length} image attachment(s) — not included in copied text]`
        : '';
    return `${this.user}${sentinel}\n\n${this.system}`;
  }

  /**
   * Lowers this prompt to the unified {@link AiAssist.IChatRequest} shape consumed
   * by the turn entry points (`callProviderCompletion`,
   * `callProviderCompletionStream`, `generateJsonCompletion`,
   * `executeClientToolTurn`). The prompt becomes a single current `user` turn
   * (carrying any attachments) with the system instructions in the distinct
   * `system` field.
   */
  public toRequest(): IChatRequest {
    return {
      system: this.system,
      messages: [
        {
          role: 'user',
          content: this.user,
          ...(this.attachments.length > 0 ? { attachments: this.attachments } : {})
        }
      ]
    };
  }
}

// ============================================================================
// Chat Message
// ============================================================================

/**
 * A single chat message in OpenAI format.
 * @public
 */
export interface IChatMessage {
  /** Message role */
  readonly role: 'system' | 'user' | 'assistant';
  /** Message content */
  readonly content: string;
  /**
   * Optional image attachments. Only honoured on the **current turn** (the last
   * message of an {@link AiAssist.IChatRequest}); vision-capable providers include
   * them in that user message, non-vision providers reject the call up front (see
   * {@link AiAssist.IAiProviderDescriptor.acceptsImageInput}). Attachments on
   * history (non-final) messages are ignored.
   */
  readonly attachments?: ReadonlyArray<IAiImageAttachment>;
}

// ============================================================================
// Chat Request
// ============================================================================

/**
 * An ordered chat request: optional system instructions plus the conversation
 * turns. The **last** entry in `messages` is the current turn (always a `user`
 * turn); everything before it is prior conversation history.
 *
 * @remarks
 * This is the unified shape accepted by every turn entry point. Both the
 * completion path and the client-tool turn path linearize it identically:
 * `[system, ...history, current user turn, ...continuation]`. Keeping `system`
 * as a distinct field (rather than a `system`-role message) matches how the
 * per-provider request builders already separate system from the turn list
 * (Anthropic top-level `system`, Gemini `systemInstruction`, OpenAI a leading
 * `system`-role message). `messages` should therefore carry only `user` /
 * `assistant` turns.
 *
 * @public
 */
export interface IChatRequest {
  /** System instructions (schema docs, format rules, general guidance). */
  readonly system?: string;
  /**
   * The ordered conversation turns. Must be non-empty; the last entry is the
   * current `user` turn and the preceding entries are history.
   */
  readonly messages: ReadonlyArray<IChatMessage>;
}

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
}

// ============================================================================
// Model Specification
// ============================================================================

/**
 * Known context keys for model specification maps.
 * @public
 */
export type ModelSpecKey = 'base' | 'tools' | 'image' | 'thinking' | 'embedding';

/**
 * All valid {@link ModelSpecKey} values.
 * @public
 */
export const allModelSpecKeys: ReadonlyArray<ModelSpecKey> = [
  'base',
  'tools',
  'image',
  'thinking',
  'embedding'
];

/**
 * Default context key used as fallback when resolving a {@link ModelSpec}.
 * @public
 */
export const MODEL_SPEC_BASE_KEY: ModelSpecKey = 'base';

/**
 * A model specification: either a simple model string or a record mapping
 * context keys to nested model specs.
 *
 * @remarks
 * A bare string is equivalent to `{ base: string }`. This keeps the simple
 * case simple while allowing context-aware model selection (e.g. different
 * models for tool-augmented vs. base completions).
 *
 * @example
 * ```typescript
 * // Simple — same model for all contexts:
 * const simple: ModelSpec = 'grok-4.3';
 *
 * // Context-aware — different model for tools and thinking:
 * const split: ModelSpec = { base: 'grok-4.3', tools: 'grok-4.3', thinking: 'grok-4.3' };
 *
 * // Future nested — per-tool model selection:
 * const nested: ModelSpec = { base: 'grok-fast', tools: { base: 'grok-r', image: 'grok-v' } };
 * ```
 * @public
 */
export interface IModelSpecMap {
  readonly [key: string]: ModelSpec;
}

/**
 * @public
 */
export type ModelSpec = string | IModelSpecMap;

/**
 * Resolves a {@link ModelSpec} to a concrete model string given an optional context key.
 *
 * @remarks
 * Resolution rules:
 * 1. If the spec is a string, return it directly (context is irrelevant).
 * 2. If the spec is an object and the context key exists, recurse into that branch.
 * 3. Otherwise, fall back to the {@link MODEL_SPEC_BASE_KEY | 'base'} key.
 * 4. If neither context nor `'base'` exists, use the first available value.
 *
 * @param spec - The model specification to resolve
 * @param context - Optional context key (e.g. `'tools'`)
 * @returns The resolved model string
 * @public
 */
export function resolveModel(spec: ModelSpec, context?: string): string {
  if (typeof spec === 'string') {
    return spec;
  }

  // Try the requested context key first
  if (context !== undefined && context in spec) {
    return resolveModel(spec[context]);
  }

  // Fall back to 'base'
  if (MODEL_SPEC_BASE_KEY in spec) {
    return resolveModel(spec[MODEL_SPEC_BASE_KEY]);
  }

  // Last resort: first value in the record
  const first = Object.values(spec)[0];
  /* c8 ignore next 3 - defensive: only reachable with empty object (prevented by converter) */
  if (first === undefined) {
    return '';
  }
  return resolveModel(first);
}

// ============================================================================
// Model Alias Layer
// ============================================================================

/**
 * Canonical fgv alias → concrete provider model map.
 *
 * @remarks
 * Keys are full fgv aliases (`@<providerId>:<role>`, e.g. `@google-gemini:flash`);
 * values are the current concrete provider model id (or a provider-native alias,
 * which is resolved with one further indirection hop). Additive; absence of an
 * `aliases` field on a descriptor means "this provider defines no aliases" and
 * every model string passes through verbatim.
 * @public
 */
export interface IModelAliasMap {
  readonly [alias: string]: string;
}

/**
 * Marker prefix for an fgv model alias.
 *
 * @remarks
 * A model string is an fgv alias **iff** it begins with this sigil. Everything
 * else is a raw provider model id and passes through {@link resolveModelAlias}
 * untouched — this is what keeps the alias layer back-compatible (no current
 * `defaultModel`, `modelOverride`, or self-hosted `model:tag` id starts with `@`).
 * @public
 */
export const MODEL_ALIAS_SIGIL: '@' = '@';

function resolveModelAliasInner(
  descriptor: IAiProviderDescriptor,
  model: string,
  visited: Set<string>
): Result<string> {
  // No sigil → raw provider id; return verbatim (back-compat passthrough).
  if (!model.startsWith(MODEL_ALIAS_SIGIL)) {
    return succeed(model);
  }
  // Cycle guard: an `@`→`@` loop would otherwise recurse forever.
  if (visited.has(model)) {
    return fail(`provider "${descriptor.id}": cyclic model alias "${model}"`);
  }
  visited.add(model);
  const target = descriptor.aliases?.[model];
  if (target === undefined) {
    return fail(`provider "${descriptor.id}": unknown model alias "${model}"`);
  }
  // Follow the target. A concrete (non-sigil) target terminates the recursion on
  // the next call; an aliased target (the canonical case: fgv alias → provider-
  // native alias) is followed in turn, with the visited-set guarding against an
  // `@`→`@` cycle.
  return resolveModelAliasInner(descriptor, target, visited);
}

/**
 * Resolves a single (possibly-aliased) model string against a provider descriptor.
 *
 * @remarks
 * Resolution rules:
 * 1. No leading {@link MODEL_ALIAS_SIGIL} → raw provider id, returned verbatim.
 * 2. Leading sigil + registered in `descriptor.aliases` → the registered target,
 *    which is itself resolved — so a chain of `@` aliases is followed until a
 *    non-`@` (concrete provider) id is reached. The canonical case is a single
 *    hop (an fgv alias targeting a provider-native alias), but longer chains
 *    resolve too.
 * 3. Leading sigil + unregistered → fails loudly, naming the provider and alias.
 *
 * An `@`→`@` cycle is guarded by a visited-set and fails rather than exhausting
 * the stack.
 *
 * @param descriptor - The provider descriptor whose `aliases` map is consulted.
 * @param model - The (possibly-aliased) model string to resolve.
 * @returns `Result` with the concrete provider model id, or a failure.
 * @public
 */
export function resolveModelAlias(descriptor: IAiProviderDescriptor, model: string): Result<string> {
  return resolveModelAliasInner(descriptor, model, new Set<string>());
}

/**
 * The full provider model-resolution chokepoint: the {@link ModelSpecKey} walk
 * (via {@link resolveModel}) THEN {@link resolveModelAlias}.
 *
 * @remarks
 * Replaces the bare `resolveModel(modelOverride ?? descriptor.defaultModel, context)`
 * call plus the duplicated empty-result check at each call-time chokepoint. The
 * `ModelSpec` branch is selected first; the resulting string — which may itself
 * be an fgv alias — is then resolved to a concrete id.
 *
 * @param descriptor - The provider descriptor (supplies `defaultModel` and `aliases`).
 * @param modelOverride - An optional caller-supplied `ModelSpec` that takes precedence
 * over `descriptor.defaultModel`. May itself contain or be an alias.
 * @param context - Optional {@link ModelSpecKey} selecting the spec branch.
 * @returns `Result` with the concrete provider model id, or a failure.
 * @public
 */
export function resolveProviderModel(
  descriptor: IAiProviderDescriptor,
  modelOverride: ModelSpec | undefined,
  context?: ModelSpecKey
): Result<string> {
  const resolved = resolveModel(modelOverride ?? descriptor.defaultModel, context);
  if (resolved.length === 0) {
    return fail(
      `provider "${descriptor.id}": no model resolved; pass modelOverride or set descriptor.defaultModel`
    );
  }
  return resolveModelAlias(descriptor, resolved);
}

// ============================================================================
// Provider Descriptor
// ============================================================================

/**
 * All known AI provider identifiers.
 * @public
 */
export type AiProviderId =
  | 'copy-paste'
  | 'xai-grok'
  | 'openai'
  | 'openai-compat'
  | 'anthropic'
  | 'google-gemini'
  | 'groq'
  | 'mistral'
  | 'ollama';

/**
 * API format categories for provider routing.
 * @public
 */
export type AiApiFormat = 'openai' | 'anthropic' | 'gemini';

/**
 * API format categories for image-generation provider routing.
 *
 * @remarks
 * - `'openai-images'` — OpenAI Images API. Routes to `/images/generations`
 *   (text-only) or `/images/edits` (when reference images are present).
 * - `'xai-images'` — xAI Images API. Text-only JSON generation request.
 * - `'xai-images-edits'` — xAI Images API for Grok Imagine models. Uses JSON
 *   body with `{ type: "image_url" }` objects (not multipart).
 * - `'gemini-imagen'` — Google Imagen `:predict` endpoint. Text-only.
 * - `'gemini-image-out'` — Google Gemini chat-style `:generateContent`
 *   endpoint that returns image parts (Gemini 2.5 Flash Image / "Nano
 *   Banana"). Accepts reference images.
 *
 * @public
 */
export type AiImageApiFormat =
  | 'openai-images'
  | 'gemini-imagen'
  | 'xai-images'
  | 'xai-images-edits'
  | 'gemini-image-out';

/**
 * API format categories for embedding provider routing.
 *
 * @remarks
 * - `'openai-embeddings'` — OpenAI `/v1/embeddings` shape. Serves OpenAI,
 *   Ollama (via `/v1`), openai-compat self-hosted servers (vLLM, LM Studio,
 *   llama.cpp's openai-server), and Mistral (`mistral-embed`) — all of which
 *   speak the same request/response shape.
 * - `'gemini-embeddings'` — Google Gemini `:batchEmbedContents` endpoint. A
 *   genuinely divergent shape (different route, auth header, request body, and
 *   the `taskType` retrieval-asymmetry knob that has no OpenAI analog).
 *
 * Named with the `ApiFormat` suffix for symmetry with `AiApiFormat` and
 * `AiImageApiFormat`.
 *
 * @public
 */
export type AiEmbeddingApiFormat = 'openai-embeddings' | 'gemini-embeddings';

// ============================================================================
// Completion Response
// ============================================================================

/**
 * Result of an AI provider completion call.
 * @public
 */
export interface IAiCompletionResponse {
  /** The generated text content */
  readonly content: string;
  /** Whether the response was truncated due to token limits */
  readonly truncated: boolean;
}

// ============================================================================
// Streaming Events
// ============================================================================

/**
 * A text-content delta arriving during a streaming completion.
 * @public
 */
export interface IAiStreamTextDelta {
  readonly type: 'text-delta';
  /** The newly arrived text fragment. */
  readonly delta: string;
}

/**
 * A server-side tool progress event arriving during a streaming completion.
 * Surfaced for providers that emit explicit tool-progress markers (OpenAI
 * Responses API, Anthropic). Gemini's grounding doesn't emit these.
 * @public
 */
export interface IAiStreamToolEvent {
  readonly type: 'tool-event';
  /** Which server-side tool this event describes. */
  readonly toolType: AiServerToolType;
  /** Tool lifecycle phase. */
  readonly phase: 'started' | 'completed';
  /**
   * Optional provider-specific detail. For web_search this is typically the
   * search query when available; format varies by provider.
   */
  readonly detail?: string;
}

/**
 * Terminal success event for a streaming completion. Carries the aggregated
 * full text and truncation status for callers that want both the progressive
 * UI and the complete result.
 * @public
 */
export interface IAiStreamDone {
  readonly type: 'done';
  /** Whether the response was truncated due to token limits. */
  readonly truncated: boolean;
  /** The full concatenated text from all `text-delta` events. */
  readonly fullText: string;
  /**
   * Provider-reported reason a truncated response was cut short (e.g.
   * `'max_output_tokens'`, `'content_filter'`), when the provider supplies one.
   * Currently populated only by the OpenAI / xAI Responses adapter, from the
   * completed payload's `incomplete_details.reason`. Meaningful only when
   * `truncated === true`; `undefined` otherwise (and whenever the provider
   * reports truncation without a reason).
   */
  readonly incompleteReason?: string;
}

/**
 * Terminal failure event for a streaming completion. After this event no
 * further events are emitted.
 *
 * @remarks
 * Connection-time failures (auth, network, pre-flight CORS rejection) are
 * surfaced via the outer `Result.fail` returned by
 * `callProviderCompletionStream` rather than as an `error` event, so callers
 * can distinguish "didn't start" from "started but errored mid-stream."
 *
 * @public
 */
export interface IAiStreamError {
  readonly type: 'error';
  readonly message: string;
}

/**
 * Discriminated union of events emitted by a streaming completion.
 *
 * @remarks
 * **Exhaustive-switch consumers must handle all variants.** The three
 * `client-tool-*` variants were added when client-tool support shipped;
 * update every exhaustive switch over this union in lockstep.
 *
 * @public
 */
export type IAiStreamEvent =
  | IAiStreamTextDelta
  | IAiStreamToolEvent
  | IAiStreamToolUseStart
  | IAiStreamToolUseDelta
  | IAiStreamToolUseComplete
  | IAiStreamDone
  | IAiStreamError;

/**
 * Thinking/reasoning mode support for a provider.
 * @public
 */
export type AiThinkingMode = 'optional' | 'required' | 'unsupported';

/**
 * Describes a single AI provider — single source of truth for all metadata.
 * @public
 */
export interface IAiProviderDescriptor {
  /** Provider identifier (e.g. 'xai-grok', 'anthropic') */
  readonly id: AiProviderId;
  /** Human-readable label (e.g. "xAI Grok") */
  readonly label: string;
  /** Button label for action buttons (e.g. "AI Assist | Grok") */
  readonly buttonLabel: string;
  /** Whether this provider requires an API key secret */
  readonly needsSecret: boolean;
  /** Which API adapter format to use */
  readonly apiFormat: AiApiFormat;
  /** Base URL for the API (e.g. 'https://api.x.ai/v1') */
  readonly baseUrl: string;
  /** Default model specification — string or context-aware map. */
  readonly defaultModel: ModelSpec;
  /**
   * Canonical fgv alias → concrete model map for this provider. Absent means the
   * provider defines no aliases and every model string passes through verbatim.
   *
   * @remarks
   * Keys are full fgv aliases (`@<providerId>:<role>`); values are the current
   * concrete model id (or a provider-native alias). Consulted by
   * {@link resolveModelAlias} / {@link resolveProviderModel} at each call-time
   * resolution chokepoint, downstream of the {@link ModelSpecKey} walk. Additive
   * and optional — composes with the existing per-descriptor `imageGeneration` /
   * `embedding` capability arrays.
   */
  readonly aliases?: IModelAliasMap;
  /** Which server-side tools this provider supports (empty = none). */
  readonly supportedTools: ReadonlyArray<AiServerToolType>;
  /** Whether this provider's API enforces CORS restrictions that prevent direct browser calls. */
  readonly corsRestricted: boolean;
  /**
   * Whether this provider's streaming completion endpoint requires a proxy
   * for direct browser calls. Some providers gate streaming separately from
   * non-streaming (rare), so this is tracked independently from
   * {@link IAiProviderDescriptor.corsRestricted}.
   *
   * @remarks
   * When `true`, `callProviderCompletionStream` rejects up front unless the
   * call is being routed through a proxy.
   */
  readonly streamingCorsRestricted: boolean;
  /**
   * Whether this provider's chat completions API accepts image input
   * (i.e. supports vision prompts). When false, calls with
   * `prompt.attachments` are rejected up front.
   */
  readonly acceptsImageInput: boolean;
  /**
   * Whether this provider supports thinking/reasoning mode.
   * - 'optional': thinking can be enabled but is not required
   * - 'required': thinking is always active (e.g. o-series models)
   * - 'unsupported': thinking is not supported
   */
  readonly thinkingMode: AiThinkingMode;
  /**
   * Image-generation capabilities, scoped to model id prefixes. Empty or
   * undefined means the provider does not support image generation.
   *
   * @remarks
   * The dispatcher matches the resolved model id against each rule's
   * `modelPrefix` and selects the longest match (see
   * {@link AiAssist.resolveImageCapability}). An empty `modelPrefix` is the
   * catch-all and matches every model id.
   *
   * Multiple entries support providers that host more than one image-API
   * surface under one baseUrl. Google Gemini is the canonical case: the
   * `imagen-*` family is predict-only via `:predict`, while
   * `gemini-2.5-flash-image` uses chat-style `:generateContent` and accepts
   * reference images. Listing both lets callers pick the right model and the
   * dispatcher routes accordingly.
   *
   * Image-model selection reuses the existing `image` {@link ModelSpecKey}.
   * Providers that declare `imageGeneration` should declare a model in
   * `defaultModel.image`, e.g. `{ base: 'gpt-4o', image: 'dall-e-3' }`.
   */
  readonly imageGeneration?: ReadonlyArray<IAiImageModelCapability>;
  /**
   * Embedding capabilities, scoped to model id prefixes. Empty or undefined
   * means the provider does not support embeddings.
   *
   * @remarks
   * The dispatcher matches the resolved embedding model id against each rule's
   * `modelPrefix` and selects the longest match (see
   * {@link AiAssist.resolveEmbeddingCapability}). An empty `modelPrefix` is the
   * catch-all and matches every model id.
   *
   * Embedding-model selection uses the `embedding` {@link ModelSpecKey}.
   * Providers that declare `embedding` should declare a model in
   * `defaultModel.embedding`, e.g. `{ base: 'gpt-4o', embedding: 'text-embedding-3-small' }`.
   * Self-hosted providers (`ollama`, `openai-compat`) leave it unset — the
   * caller supplies the embedding model via `modelOverride`.
   */
  readonly embedding?: ReadonlyArray<IAiEmbeddingModelCapability>;
}

/**
 * Image-generation capability for a model family within a provider. Used as
 * an entry in {@link IAiProviderDescriptor.imageGeneration}.
 *
 * @public
 */
export interface IAiImageModelCapability {
  /**
   * Prefix matched against the resolved image model id. The empty string is
   * the catch-all and matches every model. When multiple rules' prefixes
   * match a model id, the longest prefix wins; ties are broken by
   * first-encountered.
   */
  readonly modelPrefix: string;
  /** API format used to dispatch requests for matching models. */
  readonly format: AiImageApiFormat;
  /**
   * Whether matching models accept reference images via
   * {@link AiAssist.IAiImageGenerationParams.referenceImages}. When false or
   * undefined, calls that include reference images are rejected up front.
   */
  readonly acceptsImageReferenceInput?: boolean;
  /** Accepted size strings. When present, dispatcher pre-validates. */
  readonly acceptedSizes?: ReadonlyArray<string>;
  /** When true, quality param is sent. When false/undefined, don't send quality. */
  readonly supportsQualityParam?: boolean;
  /** Accepted quality values when supportsQualityParam is true. */
  readonly acceptedQualities?: ReadonlyArray<string>;
  /** Maximum count (n). When present, dispatcher pre-validates. */
  readonly maxCount?: number;
  /**
   * How to encode the output format on the wire:
   * - 'response-format': send response_format: 'b64_json' (dall-e-2, dall-e-3)
   * - 'output-format': send output_format (gpt-image-1)
   * - 'none': send neither (Imagen, Gemini Flash)
   */
  readonly outputParamStyle?: 'response-format' | 'output-format' | 'none';
  /** Default MIME type for response images. */
  readonly defaultOutputMimeType?: string;
}

// ============================================================================
// Embedding — capability + request/result types
// ============================================================================

/**
 * Embedding capability for a model family within a provider. Used as an entry
 * in {@link IAiProviderDescriptor.embedding}.
 *
 * @public
 */
export interface IAiEmbeddingModelCapability {
  /**
   * Prefix matched against the resolved embedding model id. The empty string is
   * the catch-all and matches every model. When multiple rules' prefixes match
   * a model id, the longest prefix wins; ties are broken by first-encountered.
   */
  readonly modelPrefix: string;
  /** API format used to dispatch requests for matching models. */
  readonly format: AiEmbeddingApiFormat;
  /**
   * Whether matching models honor a requested output `dimensions`
   * (OpenAI `text-embedding-3-*`, Gemini `gemini-embedding-001` via MRL
   * truncation). When false/undefined, a caller-supplied `dimensions` is a
   * no-op (logged, not failed — see {@link AiAssist.IAiEmbeddingParams}).
   */
  readonly supportsDimensions?: boolean;
  /**
   * Whether matching models honor a `taskType` hint (Gemini only today). When
   * false/undefined, a caller-supplied `taskType` is a no-op (logged, not
   * failed).
   */
  readonly supportsTaskType?: boolean;
  /** Native fixed output dimension, when the model has one (metadata only). */
  readonly defaultDimensions?: number;
  /**
   * Maximum number of inputs accepted per request. When present, the dispatcher
   * rejects batches larger than this up front (no auto-chunking in v1).
   */
  readonly maxBatchSize?: number;
}

/**
 * A single embedding task-type hint (Gemini-style). Cross-provider; providers
 * that don't support task typing ignore it (logged, not failed). Open string
 * union so new Gemini task types don't force a churn, with the known set
 * enumerated for ergonomics.
 *
 * @remarks
 * Values are the kebab-case cross-provider form; the Gemini adapter maps them to
 * `SCREAMING_SNAKE_CASE` on the wire (e.g. `'retrieval-document'` →
 * `RETRIEVAL_DOCUMENT`).
 *
 * @public
 */
export type AiEmbeddingTaskType =
  | 'retrieval-query'
  | 'retrieval-document'
  | 'semantic-similarity'
  | 'classification'
  | 'clustering'
  | 'code-retrieval-query'
  | 'question-answering'
  | 'fact-verification'
  | (string & {});

/**
 * Parameters for an embedding request. Batch is the norm: `input` accepts a
 * single string or an array; the result always exposes a vector array aligned
 * by index to the input.
 *
 * @public
 */
export interface IAiEmbeddingParams {
  /** One or more input strings. A bare string is treated as a single-element batch. */
  readonly input: string | ReadonlyArray<string>;
  /**
   * Requested output dimensionality. Honored only by models whose capability
   * declares `supportsDimensions` (OpenAI `text-embedding-3-*`, Gemini
   * `gemini-embedding-001` via MRL truncation). Ignored — with a `logger.info`
   * note — by models that don't.
   */
  readonly dimensions?: number;
  /**
   * Task-type hint. Mapped to Gemini `taskType`; a no-op (with a `logger.info`
   * note) on OpenAI/Ollama/compat/Mistral. Preserves Gemini's
   * query-vs-document retrieval asymmetry.
   */
  readonly taskType?: AiEmbeddingTaskType;
}

/**
 * Token-usage accounting for an embedding call, when the provider reports it.
 * @public
 */
export interface IAiEmbeddingUsage {
  /** Tokens consumed by the input(s). */
  readonly promptTokens?: number;
  /** Total tokens billed. */
  readonly totalTokens?: number;
}

/**
 * Result of an embedding call. `vectors[i]` is the embedding for `input[i]`,
 * in request order.
 *
 * @remarks
 * Vectors are plain `number[]` (not `Float32Array`) for JSON-wire fidelity and
 * validator-friendliness — consumers who want a typed array call
 * `Float32Array.from(vector)` at the vector-store / WebGPU boundary. The
 * library does not L2-normalize; Gemini's MRL truncation (when
 * `dimensions < native`) returns un-normalized vectors that the consumer should
 * normalize if their similarity metric requires it.
 *
 * @public
 */
export interface IAiEmbeddingResult {
  /** One vector per input, aligned by index to the request order. */
  readonly vectors: ReadonlyArray<ReadonlyArray<number>>;
  /** The resolved provider-native model id that produced the vectors. */
  readonly model: string;
  /** Dimensionality of each returned vector (`vectors[0].length`; `0` for empty input). */
  readonly dimensions: number;
  /** Token usage, when the provider reports it (OpenAI-format; absent for Gemini). */
  readonly usage?: IAiEmbeddingUsage;
}

// ============================================================================
// Image Generation — Layered Options Types
// ============================================================================

/** Pixel dimension sizes accepted by dall-e-2. @public */
export type DallE2Size = '256x256' | '512x512' | '1024x1024';

/** Pixel dimension sizes accepted by dall-e-3. @public */
export type DallE3Size = '1024x1024' | '1792x1024' | '1024x1792';

/** Pixel dimension sizes accepted by gpt-image-1. @public */
export type GptImageSize = '1024x1024' | '1536x1024' | '1024x1536' | 'auto';

/** All accepted image size strings across all providers. @public */
export type AiImageSize = DallE2Size | DallE3Size | GptImageSize;

/** Quality values for dall-e-3. @public */
export type DallE3Quality = 'standard' | 'hd';

/** Quality values for gpt-image-1. @public */
export type GptImageQuality = 'low' | 'medium' | 'high' | 'auto';

/** All accepted quality strings across all providers. @public */
export type AiImageQuality = DallE3Quality | GptImageQuality;

/** Model names in the DALL-E family. @public */
export type DallEModelNames = 'dall-e-2' | 'dall-e-3';

/** Model names in the GPT Image family. @public */
export type GptImageModelNames = 'gpt-image-1';

/** Model names in the xAI Grok Imagine family. @public */
export type GrokImagineModelNames = 'grok-imagine-image' | 'grok-imagine-image-quality';

/** Model names in the Imagen 4 family. @public */
export type Imagen4ModelNames =
  | 'imagen-4.0-generate-001'
  | 'imagen-4.0-ultra-generate-001'
  | 'imagen-4.0-fast-generate-001';

/** Model names in the Gemini Flash Image family. @public */
export type GeminiFlashImageModelNames = 'gemini-2.5-flash-image';

// ---- Family-level config shapes ----

/**
 * Provider-specific config for DALL-E models (dall-e-2, dall-e-3).
 * @remarks
 * style is only valid for dall-e-3; the runtime validator rejects it for dall-e-2.
 * @public
 */
export interface IDallEImageGenerationConfig {
  /** Image dimensions (dall-e-2: 256x256|512x512|1024x1024; dall-e-3: 1024x1024|1792x1024|1024x1792). */
  readonly size?: DallE2Size | DallE3Size;
  /** dall-e-3 only. Quality tier. */
  readonly quality?: DallE3Quality;
  /** dall-e-3 only. Visual style. */
  readonly style?: 'vivid' | 'natural';
}

/**
 * Provider-specific config for gpt-image-1.
 * @public
 */
export interface IGptImageGenerationConfig {
  /** Image dimensions. */
  readonly size?: GptImageSize;
  /** Quality tier. */
  readonly quality?: GptImageQuality;
  /** Output format (replaces response_format for this model). */
  readonly outputFormat?: 'png' | 'jpeg' | 'webp';
  /** JPEG/WebP compression level 0–100. */
  readonly outputCompression?: number;
  /** Background transparency control. */
  readonly background?: 'transparent' | 'opaque' | 'auto';
  /** Content moderation strictness. */
  readonly moderation?: 'low' | 'auto';
}

/**
 * Provider-specific config for xAI Grok Imagine models.
 * @public
 */
export interface IGrokImagineImageGenerationConfig {
  /** Aspect ratio string (xAI uses aspect ratios, not pixel dimensions). */
  readonly aspectRatio?: string;
  /** Resolution hint. */
  readonly resolution?: string;
}

/**
 * Provider-specific config for Google Imagen 4 models.
 * @public
 */
export interface IImagen4GenerationConfig {
  /** Aspect ratio string. */
  readonly aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  /** Output resolution. */
  readonly imageSize?: '1K' | '2K';
  /** Whether to add SynthID watermark. Must be false to use seed. */
  readonly addWatermark?: boolean;
  /** LLM-based prompt rewriting. */
  readonly enhancePrompt?: boolean;
  /** Output MIME type. */
  readonly outputMimeType?: 'image/jpeg' | 'image/png';
  /** JPEG compression quality. */
  readonly outputCompressionQuality?: number;
  /** Person generation policy. */
  readonly personGeneration?: 'allow_all' | 'allow_adult' | 'dont_allow';
}

/**
 * Provider-specific config for Gemini Flash Image.
 * @public
 */
export interface IGeminiFlashImageGenerationConfig {
  /** Aspect ratio string. */
  readonly aspectRatio?: string;
}

// ---- Model-family option blocks ----

/**
 * Base shape shared by all named family option blocks.
 * Provides a typed `models` field for applicability filtering without unsafe casts.
 * @internal
 */
export interface INamedModelFamilyConfig {
  readonly models?: readonly string[];
}

/**
 * Options block scoped to DALL-E family models.
 * @public
 */
export interface IDallEModelOptions extends INamedModelFamilyConfig {
  /** Discriminator: openai provider lineage. */
  readonly provider: 'openai';
  /** Family identifier. */
  readonly family: 'dall-e';
  /** Optional model names this block applies to. Omit = applies to all DALL-E models. */
  readonly models?: DallEModelNames[];
  /** Family-specific config. */
  readonly config: IDallEImageGenerationConfig;
}

/**
 * Options block scoped to GPT Image family models.
 * @public
 */
export interface IGptImageModelOptions extends INamedModelFamilyConfig {
  readonly provider: 'openai';
  readonly family: 'gpt-image';
  readonly models?: GptImageModelNames[];
  readonly config: IGptImageGenerationConfig;
}

/**
 * Options block scoped to xAI Grok Imagine family models.
 * @public
 */
export interface IGrokImagineModelOptions extends INamedModelFamilyConfig {
  readonly provider: 'xai';
  readonly family: 'grok-imagine';
  readonly models?: GrokImagineModelNames[];
  readonly config: IGrokImagineImageGenerationConfig;
}

/**
 * Options block scoped to Google Imagen 4 models.
 * @public
 */
export interface IImagen4ModelOptions extends INamedModelFamilyConfig {
  readonly provider: 'google';
  readonly family: 'imagen-4';
  readonly models?: Imagen4ModelNames[];
  readonly config: IImagen4GenerationConfig;
}

/**
 * Options block scoped to Gemini Flash Image models.
 * @public
 */
export interface IGeminiFlashImageModelOptions extends INamedModelFamilyConfig {
  readonly provider: 'google';
  readonly family: 'gemini-flash-image';
  readonly models?: GeminiFlashImageModelNames[];
  readonly config: IGeminiFlashImageGenerationConfig;
}

/**
 * Escape-hatch options block for models not covered by a named family.
 * @remarks
 * `models` is required — there is no implicit "all" for unknown model families.
 * `config` is `JsonObject` — passed verbatim to the wire request with no validation.
 * This is the "trust me, I know what I'm doing" path for callers who need to send
 * wire params our typed configs don't yet expose.
 * @public
 */
export interface IOtherModelOptions {
  readonly provider: 'other';
  readonly models: string[];
  readonly config: JsonObject;
}

/**
 * Discriminated union of all model-family option blocks.
 * Discriminated on `provider` + `family` fields.
 * @public
 */
export type IModelFamilyConfig =
  | IDallEModelOptions
  | IGptImageModelOptions
  | IGrokImagineModelOptions
  | IImagen4ModelOptions
  | IGeminiFlashImageModelOptions
  | IOtherModelOptions;

// ============================================================================
// Image Generation
// ============================================================================

/**
 * Options for image generation requests.
 *
 * @remarks
 * Uses a layered architecture:
 * 1. Generic top-level options (size, count, quality, seed) apply across providers
 *    via the resolved model's registry mapping.
 * 2. Optional `models` array contains model-family-scoped blocks; the resolver
 *    picks applicable blocks based on the resolved model and applies them in
 *    declaration order.
 *
 * **Merge precedence (later wins):**
 * 1. Generic top-level options (lowest precedence)
 * 2. Family-generic blocks (matching family, models field omitted)
 * 3. Model-specific blocks (models array includes resolved model name)
 * 4. Other blocks (provider: 'other', models array includes resolved model name)
 *
 * Provider-mismatch: blocks whose provider doesn't match the dispatcher's
 * provider lineage are silently skipped.
 *
 * @public
 */
export interface IAiImageGenerationOptions {
  /**
   * Image dimensions for OpenAI models (mapped to `size` field).
   * For xAI aspect ratio or Imagen aspect ratio, use the corresponding `models` family block.
   */
  readonly size?: AiImageSize;
  /** Number of images. Default 1. Some models enforce a maximum. */
  readonly count?: number;
  /**
   * Quality tier. Accepted values differ per model:
   * - dall-e-3: 'standard' | 'hd'
   * - gpt-image-1: 'low' | 'medium' | 'high' | 'auto'
   * Other models ignore this field.
   */
  readonly quality?: AiImageQuality;
  /** Reproducibility seed, where supported. */
  readonly seed?: number;
  /**
   * Optional precision via model-family-scoped blocks. The resolver picks
   * applicable blocks dynamically based on the resolved model.
   */
  readonly models?: ReadonlyArray<IModelFamilyConfig>;
}

/**
 * Parameters for an image-generation request.
 * @public
 */
export interface IAiImageGenerationParams {
  /** The text prompt describing the desired image. */
  readonly prompt: string;
  /** Optional generation options. */
  readonly options?: IAiImageGenerationOptions;
  /**
   * Optional reference images. When present, the provider will use them as
   * visual context (e.g. to preserve a character's appearance across multiple
   * generations). The dispatcher resolves the
   * {@link AiAssist.IAiImageModelCapability} for the requested model and
   * rejects the call up front if `acceptsImageReferenceInput` is not set on
   * the matching capability. An empty array is treated identically to
   * `undefined`.
   */
  readonly referenceImages?: ReadonlyArray<IAiImageAttachment>;
}

/**
 * A single generated image.
 * @public
 */
export interface IAiGeneratedImage extends IAiImageData {
  /**
   * The prompt as rewritten by the provider, if any. OpenAI's image models
   * commonly rewrite prompts; other providers do not.
   */
  readonly revisedPrompt?: string;
}

// ============================================================================
// Model Catalog (listModels)
// ============================================================================

/**
 * Capability vocabulary used to describe what a model can do. Used as both
 * a filter and as a tag in {@link AiAssist.IAiModelInfo.capabilities}.
 *
 * @remarks
 * Adding a new capability is cheap; adding the *first* one after consumers
 * already exist forces churn. The initial vocabulary is intentionally broad
 * even though only `image-generation` is fully exercised today.
 *
 * @public
 */
export type AiModelCapability = 'chat' | 'tools' | 'vision' | 'image-generation' | 'thinking' | 'embedding';

/**
 * All valid `AiModelCapability` values — the single source of truth for
 * the capability vocabulary (used by validators and capability filters).
 * @public
 */
export const allModelCapabilities: ReadonlyArray<AiModelCapability> = [
  'chat',
  'tools',
  'vision',
  'image-generation',
  'thinking',
  'embedding'
];

/**
 * Information about a single model returned by a provider's list endpoint,
 * with capabilities already resolved (native + config rules).
 * @public
 */
export interface IAiModelInfo {
  /** Provider-native model identifier. */
  readonly id: string;
  /** Resolved capability set — union of native declarations and config rules. */
  readonly capabilities: ReadonlySet<AiModelCapability>;
  /** Friendly name for display, when known. */
  readonly displayName?: string;
}

/**
 * One rule in an {@link IAiModelCapabilityConfig}. Multiple rules can match
 * a single model — their capability arrays are unioned.
 * @public
 */
export interface IAiModelCapabilityRule {
  /** RegExp tested against the model id (using `.test`). */
  readonly idPattern: RegExp;
  /** Capabilities this rule attributes to matching models. */
  readonly capabilities: ReadonlyArray<AiModelCapability>;
  /**
   * Friendly display-name override for matching models. The function form
   * lets one rule format many ids (e.g. `(id) => id.toUpperCase()`).
   * If multiple matching rules supply `displayName`, the first match wins.
   */
  readonly displayName?: string | ((id: string) => string);
}

/**
 * Configuration that maps model id patterns to capabilities. Used to
 * augment (or, where the provider supplies no capability info, fully
 * derive) the capability set for each listed model.
 * @public
 */
export interface IAiModelCapabilityConfig {
  /** Per-provider rules. Tried before {@link AiAssist.IAiModelCapabilityConfig.global}. */
  readonly perProvider?: { readonly [P in AiProviderId]?: ReadonlyArray<IAiModelCapabilityRule> };
  /** Cross-provider fallback rules. */
  readonly global?: ReadonlyArray<IAiModelCapabilityRule>;
}

/**
 * Result of an image-generation call.
 * @public
 */
export interface IAiImageGenerationResponse {
  /** The generated images, in provider-returned order. */
  readonly images: ReadonlyArray<IAiGeneratedImage>;
}

// ============================================================================
// Thinking / Reasoning Config — Layered Options Types
// ============================================================================

/**
 * Model IDs for Anthropic thinking-capable models.
 * @public
 */
export type AnthropicThinkingModelNames =
  | 'claude-sonnet-4-5'
  | 'claude-sonnet-4-6'
  | 'claude-opus-4-6'
  | 'claude-opus-4-7';

/**
 * Model IDs for OpenAI thinking-capable models.
 * @public
 */
export type OpenAiThinkingModelNames =
  | 'o3'
  | 'o4-mini'
  | 'o3-deep-research'
  | 'o4-mini-deep-research'
  | 'gpt-5'
  | 'gpt-5.1'
  | 'gpt-5.2'
  | 'gpt-5.5'
  | 'gpt-5-pro';

/**
 * Model IDs for Google Gemini thinking-capable models.
 * @public
 */
export type GeminiThinkingModelNames = 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite';

/**
 * Model IDs for xAI thinking-capable models.
 * @public
 */
export type XAiThinkingModelNames = 'grok-3-mini' | 'grok-4.3' | 'grok-4';

/**
 * Anthropic-specific thinking configuration.
 * @public
 */
export interface IAnthropicThinkingConfig {
  /**
   * Anthropic effort level. The emit-site converts to `thinking.budget_tokens`
   * (the integer budget the Anthropic API requires). Mapping policy: low = 2048,
   * medium = 8192, high = 24000, max = 32000.
   * - 'low' | 'medium' | 'high': all thinking-capable models
   * - 'max': Opus 4.6 only
   */
  readonly effort?: 'low' | 'medium' | 'high' | 'max';
}

/**
 * OpenAI-specific thinking configuration.
 * @remarks
 * Maps to `reasoning_effort` (Chat Completions path) or `reasoning.effort`
 * (Responses API path) on the wire. The adapter selects the correct field.
 * @public
 */
export interface IOpenAiThinkingConfig {
  /**
   * OpenAI reasoning effort. Maps 1:1 to the wire field.
   * - 'none': disables reasoning (gpt-5.x only; rejected by o-series)
   * - 'minimal': fastest (gpt-5.x)
   * - 'low' | 'medium' | 'high': standard tiers
   * - 'xhigh': highest (select gpt-5.x models only)
   *
   * @remarks
   * When effective effort is 'none', reasoning is disabled and temperature is
   * accepted by gpt-5.x models. This is the only case where temperature and
   * thinking config co-exist without a Result.fail.
   */
  readonly effort?: 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
}

/**
 * Google Gemini-specific thinking configuration.
 * @public
 */
export interface IGeminiThinkingConfig {
  /**
   * Token budget for thinking. Maps 1:1 to `thinkingBudget` on the wire.
   * - 0: disable thinking (Flash and Flash-Lite only; error on Pro)
   * - positive integer: soft token cap
   * - -1: dynamic
   * - omitted: model default
   */
  readonly thinkingBudget?: number;
  /**
   * Whether to include thought summaries in the response.
   * @remarks
   * INERT in phase B. Adapters never send `includeThoughts: true`.
   * Wired up by the followup stream `ai-assist-thinking-events`.
   */
  readonly includeThoughts?: boolean;
}

/**
 * xAI-specific thinking configuration.
 * @public
 */
export interface IXAiThinkingConfig {
  /**
   * xAI reasoning effort. Maps 1:1 to `reasoning_effort` on the wire.
   * For grok-4, the adapter omits this field (grok-4 always reasons and
   * rejects the parameter).
   */
  readonly effort?: 'none' | 'low' | 'medium' | 'high';
}

/**
 * Anthropic-specific thinking options block.
 * @public
 */
export interface IAnthropicThinkingOptions {
  readonly provider: 'anthropic';
  readonly models?: ReadonlyArray<AnthropicThinkingModelNames>;
  readonly config: IAnthropicThinkingConfig;
}

/**
 * OpenAI-specific thinking options block.
 * @public
 */
export interface IOpenAiThinkingOptions {
  readonly provider: 'openai';
  readonly models?: ReadonlyArray<OpenAiThinkingModelNames>;
  readonly config: IOpenAiThinkingConfig;
}

/**
 * Google Gemini-specific thinking options block.
 * @public
 */
export interface IGeminiThinkingOptions {
  readonly provider: 'google';
  readonly models?: ReadonlyArray<GeminiThinkingModelNames>;
  readonly config: IGeminiThinkingConfig;
}

/**
 * xAI-specific thinking options block.
 * @public
 */
export interface IXAiThinkingOptions {
  readonly provider: 'xai';
  readonly models?: ReadonlyArray<XAiThinkingModelNames>;
  readonly config: IXAiThinkingConfig;
}

/**
 * Escape-hatch options block for providers not covered by typed configs.
 * @remarks
 * `models` is required — no implicit "all" for unknown providers.
 * `config` fields are merged verbatim into the wire request.
 * @public
 */
export interface IOtherThinkingOptions {
  readonly provider: 'other';
  readonly models: ReadonlyArray<string>;
  readonly config: JsonObject;
}

/**
 * Discriminated union of per-provider thinking config blocks.
 * @public
 */
export type IThinkingProviderConfig =
  | IAnthropicThinkingOptions
  | IOpenAiThinkingOptions
  | IGeminiThinkingOptions
  | IXAiThinkingOptions
  | IOtherThinkingOptions;

/**
 * Thinking/reasoning mode configuration for a completion request.
 *
 * @remarks
 * The generic `effort` field covers the common-subset cross-provider vocabulary.
 * For provider-specific precision (Anthropic 'max', OpenAI 'xhigh', Gemini token
 * budgets, xAI effort-level tuning), use the `providers` array.
 *
 * Absence (or undefined) means "no thinking mode" — existing callers are unaffected.
 *
 * @public
 */
export interface IThinkingConfig {
  /**
   * Cross-provider effort level. Common-subset mapping:
   * - 'low': Anthropic effort:low | OpenAI effort:low | Gemini thinkingBudget:1024 | xAI reasoning_effort:low
   * - 'medium': effort:medium | effort:medium | thinkingBudget:4096 | reasoning_effort:medium
   * - 'high': effort:high | effort:high | thinkingBudget:8192 | reasoning_effort:high
   */
  readonly effort?: 'low' | 'medium' | 'high';
  /**
   * Optional per-provider precision blocks. Blocks for providers that don't
   * match the resolved model's provider are silently skipped.
   */
  readonly providers?: ReadonlyArray<IThinkingProviderConfig>;
}

// ============================================================================
// Settings
// ============================================================================

/**
 * Configuration for a single AI assist provider.
 * @public
 */
export interface IAiAssistProviderConfig {
  /** Which provider this configures */
  readonly provider: AiProviderId;
  /** For API-based providers: the keystore secret name holding the API key */
  readonly secretName?: string;
  /** Optional model override — string or context-aware map. */
  readonly model?: ModelSpec;
  /** Tool enablement/configuration. Tools are disabled unless explicitly enabled. */
  readonly tools?: ReadonlyArray<IAiToolEnablement>;
  /**
   * Optional caller-supplied endpoint URL (http/https). Overrides
   * `descriptor.baseUrl` for this provider. Used to point a provider at a
   * self-hosted server (Ollama, LM Studio, llama.cpp's openai-server) or a
   * local proxy. Validation lives in `@fgv/ts-extras` — query strings,
   * fragments, and userinfo are rejected.
   */
  readonly endpoint?: string;
}

/**
 * AI assist settings — which providers are enabled and their configuration.
 * @public
 */
export interface IAiAssistSettings {
  /** Enabled providers and their configuration. */
  readonly providers: ReadonlyArray<IAiAssistProviderConfig>;
  /** Which enabled provider is the default for the main button. Falls back to first in list. */
  readonly defaultProvider?: AiProviderId;
  /** Optional proxy URL for routing API requests through a backend server (e.g. `http://localhost:3002`). */
  readonly proxyUrl?: string;
  /** When true, route all providers through the proxy. When false (default), only CORS-restricted providers use the proxy. */
  readonly proxyAllProviders?: boolean;
}

/**
 * Default AI assist settings (copy-paste only).
 * @public
 */
export const DEFAULT_AI_ASSIST: IAiAssistSettings = {
  providers: [{ provider: 'copy-paste' }]
};

// ============================================================================
// Keystore Interface
// ============================================================================

/**
 * Minimal keystore interface for AI assist API key resolution.
 * Satisfied structurally by the concrete `KeyStore` class from `@fgv/ts-extras`.
 * @public
 */
export interface IAiAssistKeyStore {
  /** Whether the keystore is currently unlocked */
  readonly isUnlocked: boolean;
  /** Check if a named secret exists */
  hasSecret(name: string): Result<boolean>;
  /** Get an API key by secret name */
  getApiKey(name: string): Result<string>;
}
