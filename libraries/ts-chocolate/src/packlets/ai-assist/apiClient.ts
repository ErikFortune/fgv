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

import { AiAssistProvider } from '../settings';
import { IAiPrompt } from './model';

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for an API-based AI provider.
 * @public
 */
export interface IAiApiConfig {
  /** Base URL for the API (e.g. `https://api.x.ai/v1`) */
  readonly baseUrl: string;
  /** API key for Bearer auth */
  readonly apiKey: string;
  /** Model identifier (e.g. `grok-4-1-fast`) */
  readonly model: string;
}

/**
 * A single chat message in OpenAI format.
 * @public
 */
export interface IChatMessage {
  /** Message role */
  readonly role: 'system' | 'user' | 'assistant';
  /** Message content */
  readonly content: string;
}

/**
 * Parameters for a chat completion request.
 * @public
 */
export interface IAiApiRequestParams {
  /** Provider configuration */
  readonly config: IAiApiConfig;
  /** The structured prompt to send */
  readonly prompt: IAiPrompt;
  /**
   * Additional messages to append after system+user (e.g. for correction retries).
   * These are appended in order after the initial system and user messages.
   */
  readonly additionalMessages?: ReadonlyArray<IChatMessage>;
  /** Sampling temperature (default: 0.7) */
  readonly temperature?: number;
}

/**
 * Default provider configuration (base URL and default model).
 * @internal
 */
interface IProviderDefaults {
  readonly baseUrl: string;
  readonly defaultModel: string;
}

/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Default configurations for known API providers.
 * @public
 */
export const PROVIDER_DEFAULTS: Readonly<Record<string, IProviderDefaults>> = {
  'xai-grok': { baseUrl: 'https://api.x.ai/v1', defaultModel: 'grok-4-1-fast' },
  openai: { baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o' },
  groq: { baseUrl: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.3-70b-versatile' },
  mistral: { baseUrl: 'https://api.mistral.ai/v1', defaultModel: 'mistral-large-latest' },
  anthropic: { baseUrl: 'https://api.anthropic.com/v1', defaultModel: 'claude-sonnet-4-5-20250929' },
  'google-gemini': {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.5-flash'
  }
};

/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Providers that use the OpenAI-compatible `/chat/completions` format.
 * @internal
 */
const OPENAI_COMPATIBLE_PROVIDERS: ReadonlySet<string> = new Set(['xai-grok', 'openai', 'groq', 'mistral']);

// ============================================================================
// Shared helpers
// ============================================================================

/**
 * Builds the messages array from prompt + optional correction messages.
 * @internal
 */
function buildMessages(
  prompt: IAiPrompt,
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
        'Content-Type': 'application/json', // eslint-disable-line @typescript-eslint/naming-convention
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
 *
 * Works for xAI Grok, OpenAI, Groq, and Mistral.
 *
 * @param params - Request parameters including config and prompt
 * @returns The assistant's response content string, or a failure
 * @public
 */
export async function callChatCompletion(params: IAiApiRequestParams): Promise<Result<string>> {
  const { config, prompt, additionalMessages, temperature = 0.7 } = params;

  const url = `${config.baseUrl}/chat/completions`;
  const messages = buildMessages(prompt, additionalMessages);
  const body = { model: config.model, messages, temperature };

  return fetchJson(url, { Authorization: `Bearer ${config.apiKey}` }, body) // eslint-disable-line @typescript-eslint/naming-convention
    .then((jsonResult) => {
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
 *
 * Adapts from the common IAiApiRequestParams format to Anthropic's:
 * - `system` as top-level field (not in messages array)
 * - `x-api-key` header instead of Bearer auth
 * - `anthropic-version` header required
 * - `max_tokens` required
 * - Response text in `content[0].text`
 *
 * @param params - Request parameters
 * @returns The assistant's response content string, or a failure
 * @public
 */
export async function callAnthropicCompletion(params: IAiApiRequestParams): Promise<Result<string>> {
  const { config, prompt, additionalMessages, temperature = 0.7 } = params;

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
    max_tokens: 4096, // eslint-disable-line @typescript-eslint/naming-convention
    temperature
  };

  /* eslint-disable @typescript-eslint/naming-convention */
  const headers: Record<string, string> = {
    'x-api-key': config.apiKey,
    'anthropic-version': '2023-06-01'
  };
  /* eslint-enable @typescript-eslint/naming-convention */

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
 *
 * Adapts from the common IAiApiRequestParams format to Gemini's:
 * - Endpoint: `${baseUrl}/models/${model}:generateContent`
 * - Auth via `x-goog-api-key` header
 * - `systemInstruction` as top-level field with `parts` array
 * - `contents` array with `parts` instead of `messages` with `content`
 * - Response text in `candidates[0].content.parts[0].text`
 *
 * @param params - Request parameters
 * @returns The assistant's response content string, or a failure
 * @public
 */
export async function callGeminiCompletion(params: IAiApiRequestParams): Promise<Result<string>> {
  const { config, prompt, additionalMessages, temperature = 0.7 } = params;

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
    'x-goog-api-key': config.apiKey // eslint-disable-line @typescript-eslint/naming-convention
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
 * Routes OpenAI-compatible providers (xAI, OpenAI, Groq, Mistral) to
 * {@link callChatCompletion}, Anthropic to {@link callAnthropicCompletion},
 * and Google Gemini to {@link callGeminiCompletion}.
 *
 * @param provider - The AI assist provider identifier
 * @param params - Request parameters
 * @returns The assistant's response content string, or a failure
 * @public
 */
export async function callProviderCompletion(
  provider: AiAssistProvider,
  params: IAiApiRequestParams
): Promise<Result<string>> {
  if (OPENAI_COMPATIBLE_PROVIDERS.has(provider)) {
    return callChatCompletion(params);
  }
  switch (provider) {
    case 'anthropic':
      return callAnthropicCompletion(params);
    case 'google-gemini':
      return callGeminiCompletion(params);
    default:
      return fail(`Unsupported provider for direct API: ${provider}`);
  }
}

// ============================================================================
// Config helper
// ============================================================================

/**
 * Gets the default API configuration for a provider.
 * @param provider - The AI assist provider
 * @param apiKey - The API key
 * @param modelOverride - Optional model override
 * @returns The API config, or failure if provider has no defaults
 * @public
 */
export function getApiConfig(
  provider: AiAssistProvider,
  apiKey: string,
  modelOverride?: string
): Result<IAiApiConfig> {
  const defaults = PROVIDER_DEFAULTS[provider];
  if (!defaults) {
    return fail(`No API defaults for provider: ${provider}`);
  }
  return succeed({
    baseUrl: defaults.baseUrl,
    apiKey,
    model: modelOverride ?? defaults.defaultModel
  });
}
