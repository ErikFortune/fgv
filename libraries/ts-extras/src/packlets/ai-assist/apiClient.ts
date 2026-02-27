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

import { isJsonObject, type JsonObject } from '@fgv/ts-json-base';
import { fail, Result, succeed, type Validator, Validators } from '@fgv/ts-utils';

import { AiPrompt, type IAiCompletionResponse, type IAiProviderDescriptor, type IChatMessage } from './model';

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
): Promise<Result<JsonObject>> {
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

  if (!isJsonObject(json)) {
    return fail('AI API returned non-object JSON response');
  }
  return succeed(json);
}

// ============================================================================
// Response validators (non-strict — extra API fields preserved for debugging)
// ============================================================================

/** @internal */
interface IOpenAiMessage {
  content: string;
}
/** @internal */
interface IOpenAiChoice {
  message: IOpenAiMessage;
  finish_reason: string;
}
/** @internal */
interface IOpenAiResponse {
  choices: IOpenAiChoice[];
}

const openAiMessage: Validator<IOpenAiMessage> = Validators.object<IOpenAiMessage>({
  content: Validators.string
});
const openAiChoice: Validator<IOpenAiChoice> = Validators.object<IOpenAiChoice>({
  message: openAiMessage,
  finish_reason: Validators.string
});
const openAiResponse: Validator<IOpenAiResponse> = Validators.object<IOpenAiResponse>({
  choices: Validators.arrayOf(openAiChoice).withConstraint((arr) => arr.length > 0)
});

/** @internal */
interface IAnthropicContentBlock {
  text: string;
}
/** @internal */
interface IAnthropicResponse {
  content: IAnthropicContentBlock[];
  stop_reason: string;
}

const anthropicContentBlock: Validator<IAnthropicContentBlock> = Validators.object<IAnthropicContentBlock>({
  text: Validators.string
});
const anthropicResponse: Validator<IAnthropicResponse> = Validators.object<IAnthropicResponse>({
  content: Validators.arrayOf(anthropicContentBlock).withConstraint((arr) => arr.length > 0),
  stop_reason: Validators.string
});

/** @internal */
interface IGeminiPart {
  text: string;
}
/** @internal */
interface IGeminiContent {
  parts: IGeminiPart[];
}
/** @internal */
interface IGeminiCandidate {
  content: IGeminiContent;
  finishReason: string;
}
/** @internal */
interface IGeminiResponse {
  candidates: IGeminiCandidate[];
}

const geminiPart: Validator<IGeminiPart> = Validators.object<IGeminiPart>({
  text: Validators.string
});
const geminiContent: Validator<IGeminiContent> = Validators.object<IGeminiContent>({
  parts: Validators.arrayOf(geminiPart).withConstraint((arr) => arr.length > 0)
});
const geminiCandidate: Validator<IGeminiCandidate> = Validators.object<IGeminiCandidate>({
  content: geminiContent,
  finishReason: Validators.string
});
const geminiResponse: Validator<IGeminiResponse> = Validators.object<IGeminiResponse>({
  candidates: Validators.arrayOf(geminiCandidate).withConstraint((arr) => arr.length > 0)
});

// ============================================================================
// OpenAI-compatible client
// ============================================================================

/**
 * Calls an OpenAI-compatible chat completion endpoint.
 * Works for xAI Grok, OpenAI, Groq, and Mistral.
 * @internal
 */
async function callOpenAiCompletion(
  config: IAiApiConfig,
  prompt: AiPrompt,
  additionalMessages?: ReadonlyArray<IChatMessage>,
  temperature: number = 0.7
): Promise<Result<IAiCompletionResponse>> {
  const url = `${config.baseUrl}/chat/completions`;
  const messages = buildMessages(prompt, additionalMessages);
  const body = { model: config.model, messages, temperature };

  const jsonResult = await fetchJson(url, { Authorization: `Bearer ${config.apiKey}` }, body);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }
  return openAiResponse
    .validate(jsonResult.value)
    .withErrorFormat((msg) => `OpenAI API response: ${msg}`)
    .onSuccess((response) => {
      const choice = response.choices[0];
      return succeed({
        content: choice.message.content,
        truncated: choice.finish_reason === 'length'
      });
    });
}

// ============================================================================
// Anthropic adapter
// ============================================================================

/**
 * Calls the Anthropic Messages API.
 * @internal
 */
async function callAnthropicCompletion(
  config: IAiApiConfig,
  prompt: AiPrompt,
  additionalMessages?: ReadonlyArray<IChatMessage>,
  temperature: number = 0.7
): Promise<Result<IAiCompletionResponse>> {
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

  const jsonResult = await fetchJson(url, headers, body);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }
  return anthropicResponse
    .validate(jsonResult.value)
    .withErrorFormat((msg) => `Anthropic API response: ${msg}`)
    .onSuccess((response) => {
      return succeed({
        content: response.content[0].text,
        truncated: response.stop_reason === 'max_tokens'
      });
    });
}

// ============================================================================
// Google Gemini adapter
// ============================================================================

/**
 * Calls the Google Gemini generateContent API.
 * @internal
 */
async function callGeminiCompletion(
  config: IAiApiConfig,
  prompt: AiPrompt,
  additionalMessages?: ReadonlyArray<IChatMessage>,
  temperature: number = 0.7
): Promise<Result<IAiCompletionResponse>> {
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

  const jsonResult = await fetchJson(url, headers, body);
  if (jsonResult.isFailure()) {
    return fail(jsonResult.message);
  }
  return geminiResponse
    .validate(jsonResult.value)
    .withErrorFormat((msg) => `Gemini API response: ${msg}`)
    .onSuccess((response) => {
      const candidate = response.candidates[0];
      return succeed({
        content: candidate.content.parts[0].text,
        truncated: candidate.finishReason === 'MAX_TOKENS'
      });
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
 * @returns The completion response with content and truncation status, or a failure
 * @public
 */
export async function callProviderCompletion(
  params: IProviderCompletionParams
): Promise<Result<IAiCompletionResponse>> {
  const { descriptor, apiKey, prompt, additionalMessages, temperature = 0.7, modelOverride } = params;

  if (!descriptor.baseUrl) {
    return fail(`provider "${descriptor.id}" has no API endpoint configured`);
  }

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
    default: {
      const _exhaustive: never = descriptor.apiFormat;
      return fail(`unsupported API format: ${String(_exhaustive)}`);
    }
  }
}
