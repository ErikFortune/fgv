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
 * Chat completion client for AI assist with support for multiple provider APIs.
 *
 * Supports OpenAI-compatible providers (xAI, OpenAI, Groq, Mistral) directly,
 * plus adapters for Anthropic and Google Gemini.
 *
 * @packageDocumentation
 */

import { fail, Result, succeed } from '@fgv/ts-utils';

import { AiPrompt, type IAiProviderDescriptor, type IChatMessage } from './model';

// ============================================================================
// Types
// ============================================================================

/**
 * Internal API configuration built from a provider descriptor.
 * @internal
 */
interface IAiApiConfig {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly model: string;
}

/**
 * Parameters for a provider completion request.
 * @public
 */
export interface IProviderCompletionParams {
  /** The provider descriptor */
  readonly descriptor: IAiProviderDescriptor;
  /** API key for authentication */
  readonly apiKey: string;
  /** The structured prompt to send */
  readonly prompt: AiPrompt;
  /**
   * Additional messages to append after system+user (e.g. for correction retries).
   * These are appended in order after the initial system and user messages.
   */
  readonly additionalMessages?: ReadonlyArray<IChatMessage>;
  /** Sampling temperature (default: 0.7) */
  readonly temperature?: number;
  /** Optional model override (uses descriptor.defaultModel otherwise) */
  readonly modelOverride?: string;
}

// ============================================================================
// Shared helpers
// ============================================================================

/**
 * Builds the messages array from prompt + optional correction messages.
 * @internal
 */
function buildMessages(
  prompt: AiPrompt,
  additionalMessages?: ReadonlyArray<IChatMessage>
): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: prompt.system },
    { role: 'user', content: prompt.user }
  ];
  if (additionalMessages) {
    for (const msg of additionalMessages) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }
  return messages;
}

/**
 * Makes an HTTP request and returns the parsed JSON, or a failure.
 * @internal
 */
async function fetchJson(
  url: string,
  headers: Record<string, string>,
  body: unknown
): Promise<Result<Record<string, unknown>>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(body)
    });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    return fail(`AI API request failed: ${detail}`);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown error');
    return fail(`AI API returned ${response.status}: ${errorText}`);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return fail('AI API returned invalid JSON response');
  }

  return succeed(json as Record<string, unknown>);
}

// ============================================================================
// OpenAI-compatible client
// ============================================================================

/**
 * Calls an OpenAI-compatible chat completion endpoint.
 * Works for xAI Grok, OpenAI, Groq, and Mistral.
 * @internal
 */
function callOpenAiCompletion(
  config: IAiApiConfig,
  prompt: AiPrompt,
  additionalMessages?: ReadonlyArray<IChatMessage>,
  temperature: number = 0.7
): Promise<Result<string>> {
  const url = `${config.baseUrl}/chat/completions`;
  const messages = buildMessages(prompt, additionalMessages);
  const body = { model: config.model, messages, temperature };

  return fetchJson(url, { Authorization: `Bearer ${config.apiKey}` }, body).then((jsonResult) => {
    if (jsonResult.isFailure()) {
      return fail(jsonResult.message);
    }
    const obj = jsonResult.value;
    const choices = obj.choices;
    if (!Array.isArray(choices) || choices.length === 0) {
      return fail('AI API returned no choices');
    }
    const firstChoice = choices[0] as Record<string, unknown>;
    const message = firstChoice.message as Record<string, unknown> | undefined;
    const content = message?.content;
    if (typeof content !== 'string') {
      return fail('AI API response missing message content');
    }
    return succeed(content);
  });
}

// ============================================================================
// Anthropic adapter
// ============================================================================

/**
 * Calls the Anthropic Messages API.
 * @internal
 */
function callAnthropicCompletion(
  config: IAiApiConfig,
  prompt: AiPrompt,
  additionalMessages?: ReadonlyArray<IChatMessage>,
  temperature: number = 0.7
): Promise<Result<string>> {
  const url = `${config.baseUrl}/messages`;

  // Anthropic uses system as a top-level field, not in messages
  const messages: Array<{ role: string; content: string }> = [{ role: 'user', content: prompt.user }];
  if (additionalMessages) {
    for (const msg of additionalMessages) {
      // Anthropic doesn't have a system role in messages
      if (msg.role !== 'system') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
  }

  const body = {
    model: config.model,
    system: prompt.system,
    messages,
    max_tokens: 4096,
    temperature
  };

  const headers: Record<string, string> = {
    'x-api-key': config.apiKey,
    'anthropic-version': '2023-06-01'
  };

  return fetchJson(url, headers, body).then((jsonResult) => {
    if (jsonResult.isFailure()) {
      return fail(jsonResult.message);
    }
    const obj = jsonResult.value;
    const contentArray = obj.content;
    if (!Array.isArray(contentArray) || contentArray.length === 0) {
      return fail('Anthropic API returned no content');
    }
    const first = contentArray[0] as Record<string, unknown>;
    const text = first.text;
    if (typeof text !== 'string') {
      return fail('Anthropic API response missing text content');
    }
    return succeed(text);
  });
}

// ============================================================================
// Google Gemini adapter
// ============================================================================

/**
 * Calls the Google Gemini generateContent API.
 * @internal
 */
function callGeminiCompletion(
  config: IAiApiConfig,
  prompt: AiPrompt,
  additionalMessages?: ReadonlyArray<IChatMessage>,
  temperature: number = 0.7
): Promise<Result<string>> {
  const url = `${config.baseUrl}/models/${config.model}:generateContent`;

  // Gemini uses 'contents' with 'parts', and 'model' role instead of 'assistant'
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [
    { role: 'user', parts: [{ text: prompt.user }] }
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

  const body = {
    systemInstruction: { parts: [{ text: prompt.system }] },
    contents,
    generationConfig: { temperature }
  };

  const headers: Record<string, string> = {
    'x-goog-api-key': config.apiKey
  };

  return fetchJson(url, headers, body).then((jsonResult) => {
    if (jsonResult.isFailure()) {
      return fail(jsonResult.message);
    }
    const obj = jsonResult.value;
    const candidates = obj.candidates;
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return fail('Gemini API returned no candidates');
    }
    const first = candidates[0] as Record<string, unknown>;
    const contentObj = first.content as Record<string, unknown> | undefined;
    const parts = contentObj?.parts;
    if (!Array.isArray(parts) || parts.length === 0) {
      return fail('Gemini API response missing content parts');
    }
    const text = (parts[0] as Record<string, unknown>).text;
    if (typeof text !== 'string') {
      return fail('Gemini API response missing text in parts');
    }
    return succeed(text);
  });
}

// ============================================================================
// Provider dispatcher
// ============================================================================

/**
 * Calls the appropriate chat completion API for a given provider.
 *
 * Routes based on the provider descriptor's `apiFormat` field:
 * - `'openai'` for xAI, OpenAI, Groq, Mistral
 * - `'anthropic'` for Anthropic Claude
 * - `'gemini'` for Google Gemini
 *
 * @param params - Request parameters including descriptor, API key, and prompt
 * @returns The assistant's response content string, or a failure
 * @public
 */
export async function callProviderCompletion(params: IProviderCompletionParams): Promise<Result<string>> {
  const { descriptor, apiKey, prompt, additionalMessages, temperature = 0.7, modelOverride } = params;

  const config: IAiApiConfig = {
    baseUrl: descriptor.baseUrl,
    apiKey,
    model: modelOverride ?? descriptor.defaultModel
  };

  switch (descriptor.apiFormat) {
    case 'openai':
      return callOpenAiCompletion(config, prompt, additionalMessages, temperature);
    case 'anthropic':
      return callAnthropicCompletion(config, prompt, additionalMessages, temperature);
    case 'gemini':
      return callGeminiCompletion(config, prompt, additionalMessages, temperature);
  }
}
