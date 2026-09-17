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
 * Per-wire-shape `usage` block normalization, shared by the non-streaming
 * adapters (`completionClient.ts`) and the streaming adapters
 * (`streamingAdapters/*.ts`) so the same JSON layout is parsed once.
 *
 * @remarks
 * Every function here follows one rule throughout: a field that is absent
 * from the wire response stays absent on {@link AiAssist.IAiCompletionUsage} —
 * never defaulted to `0`, and never derived from a sibling field unless the
 * value that sibling would need is itself known. See `IAiCompletionUsage`
 * for why.
 * @packageDocumentation
 */

/* eslint-disable @typescript-eslint/naming-convention -- wire field names are snake_case */

import { type JsonObject } from '@fgv/ts-json-base';
import { type Validator, Validators } from '@fgv/ts-utils';

import { type AiCacheReportingLevel, type IAiCompletionUsage } from './usageTypes';

// ============================================================================
// Anthropic Messages
// ============================================================================

/** @internal */
interface IAnthropicRawUsage {
  readonly input_tokens: number;
  readonly output_tokens?: number;
  readonly cache_creation_input_tokens?: number;
  readonly cache_read_input_tokens?: number;
}

const anthropicRawUsage: Validator<IAnthropicRawUsage> = Validators.object<IAnthropicRawUsage>({
  input_tokens: Validators.number,
  output_tokens: Validators.number.optional(),
  cache_creation_input_tokens: Validators.number.optional(),
  cache_read_input_tokens: Validators.number.optional()
});

/**
 * Normalizes an Anthropic Messages API `usage` block. Anthropic always
 * reports both reads and writes, so `reports` is unconditionally
 * `'reads-and-writes'` — an absent `cache_creation_input_tokens` genuinely
 * means zero tokens were written this request.
 * @internal
 */
export function normalizeAnthropicUsage(raw: JsonObject | undefined): IAiCompletionUsage | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const parsed = anthropicRawUsage.validate(raw);
  if (parsed.isFailure()) {
    return undefined;
  }
  const {
    input_tokens: uncachedInputTokens,
    output_tokens: outputTokens,
    cache_creation_input_tokens: cacheWriteTokens,
    cache_read_input_tokens: cachedInputTokens
  } = parsed.value;
  return {
    reports: 'reads-and-writes',
    uncachedInputTokens,
    cachedInputTokens,
    cacheWriteTokens,
    outputTokens,
    totalInputTokens: cachedInputTokens !== undefined ? uncachedInputTokens + cachedInputTokens : undefined,
    raw
  };
}

// ============================================================================
// OpenAI / xAI Chat Completions
// ============================================================================

/** @internal */
interface IOpenAiChatPromptTokensDetails {
  readonly cached_tokens?: number;
}

const openAiChatPromptTokensDetails: Validator<IOpenAiChatPromptTokensDetails> =
  Validators.object<IOpenAiChatPromptTokensDetails>({ cached_tokens: Validators.number.optional() });

/** @internal */
interface IOpenAiChatRawUsage {
  readonly prompt_tokens?: number;
  readonly completion_tokens?: number;
  readonly prompt_tokens_details?: IOpenAiChatPromptTokensDetails;
}

const openAiChatRawUsage: Validator<IOpenAiChatRawUsage> = Validators.object<IOpenAiChatRawUsage>({
  prompt_tokens: Validators.number.optional(),
  completion_tokens: Validators.number.optional(),
  prompt_tokens_details: openAiChatPromptTokensDetails.optional()
});

/**
 * Normalizes an OpenAI/xAI Chat Completions `usage` block. `reports` is
 * unconditionally `'reads'`: `cache_write_tokens` does not exist on this API
 * for any provider reached through it, so `cacheWriteTokens` is never set —
 * not even to `0`.
 * @internal
 */
export function normalizeOpenAiChatUsage(raw: JsonObject | undefined): IAiCompletionUsage | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const parsed = openAiChatRawUsage.validate(raw);
  if (parsed.isFailure()) {
    return undefined;
  }
  const {
    prompt_tokens: promptTokens,
    completion_tokens: outputTokens,
    prompt_tokens_details
  } = parsed.value;
  const cachedInputTokens = prompt_tokens_details?.cached_tokens;
  const uncachedInputTokens =
    cachedInputTokens !== undefined && promptTokens !== undefined
      ? promptTokens - cachedInputTokens
      : undefined;
  return {
    reports: 'reads',
    uncachedInputTokens,
    cachedInputTokens,
    outputTokens,
    totalInputTokens:
      uncachedInputTokens !== undefined && cachedInputTokens !== undefined
        ? uncachedInputTokens + cachedInputTokens
        : undefined,
    raw
  };
}

// ============================================================================
// OpenAI / xAI Responses
// ============================================================================

/** @internal */
interface IOpenAiResponsesInputTokensDetails {
  readonly cached_tokens?: number;
  readonly cache_write_tokens?: number;
}

const openAiResponsesInputTokensDetails: Validator<IOpenAiResponsesInputTokensDetails> =
  Validators.object<IOpenAiResponsesInputTokensDetails>({
    cached_tokens: Validators.number.optional(),
    cache_write_tokens: Validators.number.optional()
  });

/** @internal */
interface IOpenAiResponsesRawUsage {
  readonly input_tokens?: number;
  readonly output_tokens?: number;
  readonly input_tokens_details?: IOpenAiResponsesInputTokensDetails;
}

const openAiResponsesRawUsage: Validator<IOpenAiResponsesRawUsage> =
  Validators.object<IOpenAiResponsesRawUsage>({
    input_tokens: Validators.number.optional(),
    output_tokens: Validators.number.optional(),
    input_tokens_details: openAiResponsesInputTokensDetails.optional()
  });

/**
 * Normalizes an OpenAI/xAI Responses API `usage` block. This route is shared
 * by two providers that disagree about write reporting — OpenAI always sends
 * `cache_write_tokens` (even when `0`), xAI never does — so `reports` is
 * derived from field **presence**, not from provider identity: a wire that
 * sends the field, however small its value, is `'reads-and-writes'`; a wire
 * that omits it entirely is `'reads'`.
 * @internal
 */
export function normalizeOpenAiResponsesUsage(raw: JsonObject | undefined): IAiCompletionUsage | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const parsed = openAiResponsesRawUsage.validate(raw);
  if (parsed.isFailure()) {
    return undefined;
  }
  const { input_tokens: inputTokens, output_tokens: outputTokens, input_tokens_details } = parsed.value;
  const cachedInputTokens = input_tokens_details?.cached_tokens;
  const cacheWriteTokens = input_tokens_details?.cache_write_tokens;
  const reports: AiCacheReportingLevel = cacheWriteTokens !== undefined ? 'reads-and-writes' : 'reads';
  const uncachedInputTokens =
    cachedInputTokens !== undefined && inputTokens !== undefined
      ? inputTokens - cachedInputTokens
      : undefined;
  return {
    reports,
    uncachedInputTokens,
    cachedInputTokens,
    cacheWriteTokens,
    outputTokens,
    totalInputTokens:
      uncachedInputTokens !== undefined && cachedInputTokens !== undefined
        ? uncachedInputTokens + cachedInputTokens
        : undefined,
    raw
  };
}

// ============================================================================
// Gemini generateContent / streamGenerateContent
// ============================================================================

/** @internal */
interface IGeminiRawUsage {
  readonly promptTokenCount?: number;
  readonly candidatesTokenCount?: number;
  readonly cachedContentTokenCount?: number;
}

const geminiRawUsage: Validator<IGeminiRawUsage> = Validators.object<IGeminiRawUsage>({
  promptTokenCount: Validators.number.optional(),
  candidatesTokenCount: Validators.number.optional(),
  cachedContentTokenCount: Validators.number.optional()
});

/**
 * Normalizes a Gemini `usageMetadata` block. `reports` is unconditionally
 * `'reads'` — Gemini has no cache-write concept in a `generateContent` call;
 * writes happen out-of-band via the explicit `cachedContents` resource,
 * out of scope per the design (§10).
 *
 * @remarks
 * The Gemini-specific footgun: `promptTokenCount` already **includes**
 * `cachedContentTokenCount` (it is the total effective prompt size), unlike
 * OpenAI where the cached figure sits in a sub-object alongside a separate
 * total. `uncachedInputTokens` subtracts to correct for it — but only when
 * `cachedContentTokenCount` is itself present, per the module's absent-means-
 * absent rule.
 * @internal
 */
export function normalizeGeminiUsage(raw: JsonObject | undefined): IAiCompletionUsage | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const parsed = geminiRawUsage.validate(raw);
  if (parsed.isFailure()) {
    return undefined;
  }
  const {
    promptTokenCount,
    candidatesTokenCount: outputTokens,
    cachedContentTokenCount: cachedInputTokens
  } = parsed.value;
  const uncachedInputTokens =
    cachedInputTokens !== undefined && promptTokenCount !== undefined
      ? promptTokenCount - cachedInputTokens
      : undefined;
  return {
    reports: 'reads',
    uncachedInputTokens,
    cachedInputTokens,
    outputTokens,
    totalInputTokens:
      uncachedInputTokens !== undefined && cachedInputTokens !== undefined
        ? uncachedInputTokens + cachedInputTokens
        : undefined,
    raw
  };
}
