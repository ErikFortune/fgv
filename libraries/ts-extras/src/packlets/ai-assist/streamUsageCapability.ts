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
 * Whether a provider on the shared Chat Completions streaming path should be
 * asked for a usage block.
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
