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
 * Provider-capability gates for `usage` reporting and cache-breakpoint emission on the shared
 * `apiFormat: 'openai'` completion paths (Chat Completions and Responses, streaming and
 * non-streaming).
 *
 * @remarks
 * Its own module rather than part of `model.ts` because `model.ts` was at the
 * `max-lines` cap. Same rationale as `structuredOutputTypes.ts` and
 * `usageTypes.ts`.
 * @packageDocumentation
 */

import type { IAiProviderDescriptor } from './model';

/**
 * Whether a provider's streaming Chat Completions request should carry
 * `stream_options: { include_usage: true }`. A request-shape gate, not a
 * capability guess: the shared adapter also carries providers (xAI, Groq,
 * Mistral, Ollama, self-hosted `openai-compat`) not verified to tolerate an
 * unrecognized field, so this is `true` only for `'openai'`; every other
 * provider simply never gets a streaming `usage` block — a safe degradation,
 * since `IAiStreamDone.usage` is optional everywhere.
 * @public
 */
export function supportsStreamUsageOption(descriptor: IAiProviderDescriptor): boolean {
  return descriptor.id === 'openai';
}

/**
 * Whether a provider has confirmed prompt-cache-relevant `usage` reporting on
 * the shared Chat Completions / Responses completion paths (streaming and
 * non-streaming alike).
 *
 * @remarks
 * All four call sites (`callOpenAiCompletion`, `callOpenAiResponsesCompletion`,
 * and their streaming counterparts) are shared by every `apiFormat: 'openai'`
 * descriptor — xAI Grok, Groq, Mistral, Ollama, and self-hosted
 * `openai-compat` all route through the same adapter as OpenAI. Only OpenAI
 * and xAI Grok are confirmed to report cache-relevant `usage` fields; an
 * ordinary `usage` block from one of the other descriptors (e.g. Groq's plain
 * `prompt_tokens` / `completion_tokens`, with no cache sub-object at all)
 * carries no cache information. Normalizing it anyway would stamp
 * `reports: 'reads'` on a provider that has no prompt-caching concept —
 * a false cache-reporting signal, not an absent one. So this gate is checked
 * before every normalize call; when it's `false`, `usage` stays absent
 * entirely rather than being guessed from whatever shape the wire happens to
 * send.
 * @public
 */
export function supportsCacheUsageReporting(descriptor: IAiProviderDescriptor): boolean {
  return descriptor.id === 'openai' || descriptor.id === 'xai-grok';
}

/**
 * Whether a provider has confirmed tolerance for the request-shape changes an
 * {@link AiAssist.IAiCacheRequest} produces on the shared Chat Completions / Responses paths: splitting
 * `system` into content parts carrying `prompt_cache_breakpoint`, and the top-level
 * `prompt_cache_key` field.
 *
 * @remarks
 * Same sharing problem as {@link AiAssist.supportsStreamUsageOption}, on the write side instead of the
 * read side: `callOpenAiCompletion` and `callOpenAiResponsesCompletion` are shared by every
 * `apiFormat: 'openai'` descriptor (xAI Grok, Groq, Mistral, Ollama, self-hosted
 * `openai-compat`), but only OpenAI's own API is confirmed to accept a `system`/first-item
 * `content` restructured into an array of parts each carrying an unrecognized
 * `prompt_cache_breakpoint` field, or the extra top-level `prompt_cache_key` field. A
 * schema-strict server on one of the other descriptors could 400 on either — the identical
 * failure mode `supportsStreamUsageOption` was written to avoid for `stream_options`. So `cache`
 * is gated to `descriptor.id === 'openai'` at the dispatch site before it ever reaches these
 * builders; every other descriptor gets the same request body it would have gotten had the
 * caller passed no `cache` at all.
 * @public
 */
export function supportsPromptCacheBreakpoints(descriptor: IAiProviderDescriptor): boolean {
  return descriptor.id === 'openai';
}
