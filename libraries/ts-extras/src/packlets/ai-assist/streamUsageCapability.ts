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
 * The completion paths it gates — `callOpenAiCompletion`,
 * `callOpenAiResponsesCompletion`, the Responses streaming adapter, and
 * `executeClientToolTurn`'s direct Responses call — are shared by every
 * `apiFormat: 'openai'` descriptor — xAI Grok, Groq, Mistral, Ollama, and self-hosted
 * `openai-compat` all route through the same adapter as OpenAI. Only OpenAI
 * and xAI Grok are confirmed to report cache-relevant `usage` fields; an
 * ordinary `usage` block from one of the other descriptors (e.g. Groq's plain
 * `prompt_tokens` / `completion_tokens`, with no cache sub-object at all)
 * carries no cache information. Normalizing it anyway would stamp
 * `reports: 'reads'` on a provider that has no prompt-caching concept —
 * a false cache-reporting signal, not an absent one. So this gate is checked
 * before every normalize call it governs; when it's `false`, `usage` stays
 * absent entirely rather than being guessed from whatever shape the wire
 * happens to send.
 *
 * **Streaming Chat Completions is gated by a different predicate.** That path
 * consults {@link AiAssist.supportsStreamUsageOption} instead, because the
 * request has to opt in via `stream_options: { include_usage: true }` before
 * there is any usage to normalize — and that opt-in is `'openai'`-only, since
 * the other descriptors' tolerance for the unrecognized field is unverified.
 * The practical consequence is that xAI Grok, which *is* confirmed here, still
 * gets no `usage` on streaming Chat Completions. If you are tracing a missing
 * xAI streaming figure, that predicate is the one to read, not this one.
 * @public
 */
export function supportsCacheUsageReporting(descriptor: IAiProviderDescriptor): boolean {
  return descriptor.id === 'openai' || descriptor.id === 'xai-grok';
}

/**
 * Whether a provider has confirmed tolerance for the request-shape change
 * {@link AiAssist.IAiCacheRequest.systemBreakpoints} produces on the shared Chat Completions /
 * Responses paths: splitting `system` into content parts each carrying a
 * `prompt_cache_breakpoint` field.
 *
 * This governs **breakpoints only**. The routing key is a separate capability with a different
 * support set — see {@link AiAssist.supportsPromptCacheRouting}. An earlier version of this
 * predicate gated both, which withheld the routing key from xAI, the one provider that most
 * needs it.
 *
 * @remarks
 * Same sharing problem as {@link AiAssist.supportsStreamUsageOption}, on the write side instead of the
 * read side: `callOpenAiCompletion` and `callOpenAiResponsesCompletion` are shared by every
 * `apiFormat: 'openai'` descriptor (xAI Grok, Groq, Mistral, Ollama, self-hosted
 * `openai-compat`), but only OpenAI's own API is confirmed to accept a `system`/first-item
 * `content` restructured into an array of parts each carrying an unrecognized
 * `prompt_cache_breakpoint` field. A
 * schema-strict server on one of the other descriptors could 400 on it — the identical
 * failure mode `supportsStreamUsageOption` was written to avoid for `stream_options`. So `cache`
 * is gated to `descriptor.id === 'openai'` at the dispatch site before it ever reaches these
 * builders; every other descriptor gets the same request body it would have gotten had the
 * caller passed no `cache` at all.
 * @public
 */
export function supportsPromptCacheBreakpoints(descriptor: IAiProviderDescriptor): boolean {
  return descriptor.id === 'openai';
}

/**
 * How a provider carries an {@link AiAssist.IAiCacheRequest.cacheKey} on the wire.
 *
 * @remarks
 * Returned by {@link AiAssist.supportsPromptCacheRouting}. The Responses API takes the key as a
 * `prompt_cache_key` body field on every provider that supports it, so only the Chat Completions
 * transport varies and only that is described here.
 * @public
 */
export interface IAiPromptCacheRoutingSupport {
  /**
   * Header name to carry the key on Chat Completions, or `undefined` when the provider takes it
   * as a `prompt_cache_key` body field there (OpenAI). xAI uses `x-grok-conv-id`.
   */
  readonly chatCompletionsHeader: string | undefined;
}

/**
 * Whether a provider accepts an opaque prompt-cache **routing** key, and by what transport.
 *
 * @remarks
 * Distinct from {@link AiAssist.supportsPromptCacheBreakpoints}, and deliberately so. A breakpoint
 * restructures the request body and needs the server to tolerate an unrecognized field inside
 * `content`; a routing key is a single opaque string whose only job is to make repeated requests
 * with a shared prefix land on the same cache-holding server.
 *
 * The two were originally gated together, which had a perverse effect: xAI does byte-for-byte
 * prefix matching from the start of the `messages` array, and its cache is **per-server and
 * evictable**, so without a routing key a caller can miss on an identical prefix simply by being
 * routed elsewhere. Measured on `grok-4.3`: two requests sharing an 8,684-token system prefix but
 * differing in their final user turn returned 2.2% cached, while a byte-identical pair returned
 * 99.5%. Withholding the routing key from xAI withheld it from the provider whose caching depends
 * on it most.
 *
 * The transport differs by route, which is why this returns a descriptor rather than a boolean:
 *
 * | provider | Chat Completions | Responses |
 * |---|---|---|
 * | `openai` | `prompt_cache_key` body field | `prompt_cache_key` body field |
 * | `xai-grok` | `x-grok-conv-id` **header** | `prompt_cache_key` body field |
 *
 * Every other `apiFormat: 'openai'` descriptor (Groq, Mistral, Ollama, self-hosted
 * `openai-compat`) returns `undefined` and gets the request it would have gotten had the caller
 * passed no `cache` at all — the same unconfirmed-tolerance reasoning as
 * {@link AiAssist.supportsStreamUsageOption}.
 * @public
 */
export function supportsPromptCacheRouting(
  descriptor: IAiProviderDescriptor
): IAiPromptCacheRoutingSupport | undefined {
  if (descriptor.id === 'openai') {
    return { chatCompletionsHeader: undefined };
  }
  if (descriptor.id === 'xai-grok') {
    return { chatCompletionsHeader: 'x-grok-conv-id' };
  }
  return undefined;
}
