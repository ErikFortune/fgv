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
 * Per-format chat request shape builders. Shared between the synchronous
 * (`apiClient.ts`) and streaming (`streamingClient.ts`) paths so the wire
 * shapes stay consistent.
 *
 * @packageDocumentation
 */

import { isJsonObject, type JsonObject } from '@fgv/ts-json-base';
import { type Converter, Converters, fail, Result, succeed } from '@fgv/ts-utils';

import { AiPrompt, type IAiImageAttachment, type IChatMessage, toDataUrl } from './model';

/**
 * The result of splitting an {@link AiAssist.IChatRequest} into the per-builder
 * inputs: the current turn (as an {@link AiPrompt}, carrying system + the final
 * user message + any attachments) and the preceding conversation history.
 * @internal
 */
export interface ISplitChatRequest {
  /** The current turn lowered to an {@link AiPrompt} (system + user + attachments). */
  readonly prompt: AiPrompt;
  /** Prior conversation history — every message before the current turn. */
  readonly head: ReadonlyArray<IChatMessage>;
}

/**
 * Splits a unified {@link AiAssist.IChatRequest} into `{ prompt, head }` for the
 * per-provider builders. The **last** message is the current `user` turn; the
 * preceding messages are history (`head`). This is the single linearization
 * shared by every turn entry point, so the completion path and the client-tool
 * turn path place history at the identical position relative to the current turn.
 *
 * Fails when `messages` is empty (no current turn) or when the last message is
 * not a `user` turn — relabelling a trailing assistant message as the user turn
 * would be a silent footgun, so it is rejected loudly instead.
 *
 * @internal
 */
export function splitChatRequest(
  system: string | undefined,
  messages: ReadonlyArray<IChatMessage>
): Result<ISplitChatRequest> {
  if (messages.length === 0) {
    return fail('messages must contain at least one entry (the current user turn)');
  }
  const current = messages[messages.length - 1];
  if (current.role !== 'user') {
    return fail(`the last message must be the current user turn (role 'user'); got '${current.role}'`);
  }
  const head = messages.slice(0, messages.length - 1);
  const prompt = new AiPrompt(current.content, system ?? '', current.attachments);
  return succeed({ prompt, head });
}

/**
 * Rebuilds the ordered messages for a proxy wire body so that only the current
 * turn can carry attachments — history (non-current) messages are reduced to
 * `{ role, content }`. The direct per-provider builders already drop attachments
 * on history turns (only the current user turn's attachments are honored), so
 * normalizing here keeps the proxy wire shape consistent with the direct paths
 * and avoids transmitting attachment payloads the upstream provider would ignore.
 *
 * @internal
 */
export function normalizeOutboundMessages(split: ISplitChatRequest): IChatMessage[] {
  return [
    ...split.head.map((m) => ({ role: m.role, content: m.content })),
    ...split.prompt.toRequest().messages
  ];
}

/**
 * Converter for a rawTail message entry. Narrows a `JsonObject` to
 * `{ role: string; content: string | unknown[] }` at runtime using the
 * Converter pattern. Entries that fail validation are silently skipped — the
 * surrounding function is infallible, and a malformed continuation message is
 * better omitted than transmitted verbatim.
 * @internal
 */
const rawTailMessageConverter: Converter<{ role: 'user' | 'assistant'; content: string | unknown[] }> =
  Converters.object<{ role: 'user' | 'assistant'; content: string | unknown[] }>(
    {
      role: Converters.enumeratedValue<'user' | 'assistant'>(['user', 'assistant']),
      content: Converters.oneOf<string | unknown[]>([
        Converters.string,
        Converters.isA('array', (v): v is unknown[] => Array.isArray(v))
      ])
    },
    { strict: false }
  );

/**
 * Converter for an OpenAI / xAI Responses API `rawTail` item. These are
 * provider-native input items (`function_call`, `function_call_output`) whose
 * fields differ per item type, so — unlike the Anthropic `{ role, content }`
 * projection — the whole object is preserved verbatim.
 *
 * The static input is already typed `JsonObject`, so the `isJsonObject` guard
 * is a runtime backstop, not a compile-time narrowing: continuation messages
 * originate from a prior turn's `IAiClientToolContinuation.messages` and a
 * consumer may persist and reload them through untyped JSON before passing them
 * back. The guard preserves the same "a malformed continuation message is
 * better omitted than transmitted verbatim" posture as the Anthropic path —
 * non-object entries fail conversion and are skipped by the caller.
 * @internal
 */
const openAiRawTailItemConverter: Converter<JsonObject> = Converters.isA<JsonObject>(
  'JsonObject',
  (v): v is JsonObject => isJsonObject(v)
);

/**
 * Converter for a Gemini `rawTail` item. Gemini continuation messages are
 * `{ role, parts }` turns (a model turn with `functionCall` parts followed by a
 * user turn with `functionResponse` parts). Narrows a `JsonObject` to
 * `{ role: 'user' | 'model'; parts: Array<Record<string, unknown>> }`; entries
 * that fail validation are skipped by the caller.
 * @internal
 */
const geminiRawTailMessageConverter: Converter<{
  role: 'user' | 'model';
  parts: unknown[];
}> = Converters.object<{ role: 'user' | 'model'; parts: unknown[] }>(
  {
    role: Converters.enumeratedValue<'user' | 'model'>(['user', 'model']),
    // `parts` is preserved verbatim and serialized into the request body, so the
    // element shape is not narrowed here — `Array.isArray` soundly guarantees
    // `unknown[]` (narrowing to `Record<string, unknown>[]` would be an unchecked cast).
    parts: Converters.isA('array', (v): v is unknown[] => Array.isArray(v))
  },
  { strict: false }
);

/**
 * Optional history (`head`) and raw continuation (`rawTail`) messages to weave
 * around the prompt's current user message.
 *
 * @internal
 */
export interface IBuildMessagesOptions {
  /**
   * Prior conversation history inserted between the system prompt and the
   * prompt's current user message (multi-turn chat / correction retries). The
   * single ordered linearization is `[system, ...head, user, ...rawTail]`.
   */
  readonly head?: ReadonlyArray<IChatMessage>;
  /**
   * Raw JSON objects appended after the prompt's user message. Used to
   * inject provider-specific continuation messages (e.g. Anthropic assistant
   * turns with thinking blocks, OpenAI Responses `function_call` /
   * `function_call_output` items, Gemini `functionCall` / `functionResponse`
   * turns) that cannot be expressed as plain {@link IChatMessage} objects.
   *
   * Each builder applies its own provider-specific shape guard:
   * - {@link buildAnthropicMessages} projects each entry to `{ role, content }`.
   * - {@link buildMessages} (OpenAI / xAI Responses) preserves each item
   *   verbatim (item fields differ per `type`), guarding only that it is a
   *   JSON object.
   * - {@link buildGeminiContents} projects each entry to `{ role, parts }`.
   *
   * Entries that fail their builder's shape check are silently skipped (the
   * caller is responsible for supplying well-formed continuation messages).
   * Appended after the current user message.
   */
  readonly rawTail?: ReadonlyArray<JsonObject>;
}

/**
 * Builds the messages array from prompt + optional history (`head`) and raw
 * continuation (`rawTail`) messages. The caller supplies the user content
 * (string for text-only, parts array for vision prompts) since the parts shape
 * differs by format.
 *
 * `rawTail` items (OpenAI / xAI Responses `function_call` /
 * `function_call_output` continuation items) are appended verbatim after the
 * user message — their fields differ per item `type`, so they are preserved
 * rather than projected. The return type is `Array<Record<string, unknown>>`
 * to accommodate both `{ role, content }` messages and these heterogeneous
 * input items.
 *
 * @internal
 */
export function buildMessages(
  systemPrompt: string,
  userContent: string | unknown[],
  options?: IBuildMessagesOptions
): Array<Record<string, unknown>> {
  const messages: Array<Record<string, unknown>> = [{ role: 'system', content: systemPrompt }];
  if (options?.head) {
    for (const msg of options.head) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }
  messages.push({ role: 'user', content: userContent });
  // OpenAI / xAI Responses continuation items (function_call /
  // function_call_output) are appended verbatim — their field set differs per
  // item type, so the whole object is preserved rather than projected.
  if (options?.rawTail) {
    for (const item of options.rawTail) {
      const converted = openAiRawTailItemConverter.convert(item);
      if (converted.isSuccess()) {
        messages.push(converted.value);
      }
    }
  }
  return messages;
}

/**
 * Builds the user content for OpenAI Chat Completions when attachments are
 * present. Returns a string when there are no attachments.
 *
 * @internal
 */
export function buildOpenAiChatUserContent(prompt: AiPrompt): string | unknown[] {
  if (prompt.attachments.length === 0) {
    return prompt.user;
  }
  return [
    { type: 'text', text: prompt.user },
    ...prompt.attachments.map((att: IAiImageAttachment) => ({
      type: 'image_url',
      image_url: {
        url: toDataUrl(att),
        ...(att.detail !== undefined ? { detail: att.detail } : {})
      }
    }))
  ];
}

/**
 * Builds the user content for OpenAI / xAI Responses API when attachments
 * are present. Responses API uses `input_text` / `input_image` part types,
 * distinct from Chat Completions' `text` / `image_url`.
 *
 * @internal
 */
export function buildOpenAiResponsesUserContent(prompt: AiPrompt): string | unknown[] {
  if (prompt.attachments.length === 0) {
    return prompt.user;
  }
  return [
    { type: 'input_text', text: prompt.user },
    ...prompt.attachments.map((att: IAiImageAttachment) => ({
      type: 'input_image',
      image_url: toDataUrl(att),
      ...(att.detail !== undefined ? { detail: att.detail } : {})
    }))
  ];
}

/**
 * Builds the user-message content for Anthropic when attachments are present.
 *
 * @internal
 */
export function buildAnthropicUserContent(prompt: AiPrompt): string | unknown[] {
  if (prompt.attachments.length === 0) {
    return prompt.user;
  }
  return [
    { type: 'text', text: prompt.user },
    ...prompt.attachments.map((att: IAiImageAttachment) => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: att.mimeType,
        data: att.base64
      }
    }))
  ];
}

/**
 * Builds the Gemini `parts` array for the user turn, including any image
 * attachments as `inlineData` parts.
 *
 * @internal
 */
export function buildGeminiUserParts(prompt: AiPrompt): Array<Record<string, unknown>> {
  const parts: Array<Record<string, unknown>> = [{ text: prompt.user }];
  for (const att of prompt.attachments) {
    parts.push({ inlineData: { mimeType: att.mimeType, data: att.base64 } });
  }
  return parts;
}

/**
 * Builds the Anthropic messages array, weaving any `head` history messages
 * between implicit system + the prompt's user message and appending `rawTail`
 * continuation messages after. System messages are filtered out (Anthropic uses
 * a top-level system field).
 *
 * @internal
 */
export function buildAnthropicMessages(
  prompt: AiPrompt,
  options?: IBuildMessagesOptions
): Array<{ role: string; content: string | unknown[] }> {
  const messages: Array<{ role: string; content: string | unknown[] }> = [];
  if (options?.head) {
    for (const msg of options.head) {
      if (msg.role !== 'system') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
  }
  messages.push({ role: 'user', content: buildAnthropicUserContent(prompt) });
  if (options?.rawTail) {
    for (const msg of options.rawTail) {
      const converted = rawTailMessageConverter.convert(msg);
      if (converted.isSuccess()) {
        messages.push(converted.value);
      }
    }
  }
  return messages;
}

/**
 * Builds the Gemini `contents` array, weaving any `head` history messages before
 * the prompt's user parts and appending `rawTail` continuation messages after.
 * System messages are filtered out (Gemini uses a top-level systemInstruction
 * field) and assistant roles are mapped to Gemini's `model` role.
 *
 * @internal
 */
export function buildGeminiContents(
  prompt: AiPrompt,
  options?: IBuildMessagesOptions
): Array<{ role: string; parts: unknown[] }> {
  const contents: Array<{ role: string; parts: unknown[] }> = [];
  if (options?.head) {
    for (const msg of options.head) {
      if (msg.role !== 'system') {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : msg.role,
          parts: [{ text: msg.content }]
        });
      }
    }
  }
  contents.push({ role: 'user', parts: buildGeminiUserParts(prompt) });
  // Gemini continuation turns (model `functionCall` parts + user
  // `functionResponse` parts) are projected to `{ role, parts }`.
  if (options?.rawTail) {
    for (const item of options.rawTail) {
      const converted = geminiRawTailMessageConverter.convert(item);
      if (converted.isSuccess()) {
        contents.push(converted.value);
      }
    }
  }
  return contents;
}
