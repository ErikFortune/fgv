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

import { AiPrompt, type IAiImageAttachment, type IChatMessage, toDataUrl } from './model';

/**
 * Builds the messages array from prompt + optional correction messages.
 * The caller supplies the user content (string for text-only, parts array
 * for vision prompts) since the parts shape differs by format.
 *
 * @internal
 */
export function buildMessages(
  systemPrompt: string,
  userContent: string | unknown[],
  additionalMessages?: ReadonlyArray<IChatMessage>
): Array<{ role: string; content: string | unknown[] }> {
  const messages: Array<{ role: string; content: string | unknown[] }> = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent }
  ];
  if (additionalMessages) {
    for (const msg of additionalMessages) {
      messages.push({ role: msg.role, content: msg.content });
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
 * Builds the Anthropic messages array (user + correction messages), supplying
 * the user content from {@link buildAnthropicUserContent} and filtering out
 * any system messages from `additionalMessages` (Anthropic uses a top-level
 * system field).
 *
 * @internal
 */
export function buildAnthropicMessages(
  prompt: AiPrompt,
  additionalMessages?: ReadonlyArray<IChatMessage>
): Array<{ role: string; content: string | unknown[] }> {
  const messages: Array<{ role: string; content: string | unknown[] }> = [
    { role: 'user', content: buildAnthropicUserContent(prompt) }
  ];
  if (additionalMessages) {
    for (const msg of additionalMessages) {
      if (msg.role !== 'system') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
  }
  return messages;
}

/**
 * Builds the Gemini `contents` array (user + correction messages), supplying
 * the user parts from {@link buildGeminiUserParts}.
 *
 * @internal
 */
export function buildGeminiContents(
  prompt: AiPrompt,
  additionalMessages?: ReadonlyArray<IChatMessage>
): Array<{ role: string; parts: Array<Record<string, unknown>> }> {
  const contents: Array<{ role: string; parts: Array<Record<string, unknown>> }> = [
    { role: 'user', parts: buildGeminiUserParts(prompt) }
  ];
  if (additionalMessages) {
    for (const msg of additionalMessages) {
      if (msg.role !== 'system') {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : msg.role,
          parts: [{ text: msg.content }]
        });
      }
    }
  }
  return contents;
}
