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
 * Helper for resolving a request's effective base URL from a provider
 * descriptor and an optional caller-supplied endpoint override.
 *
 * @packageDocumentation
 */

import { fail, Result, succeed } from '@fgv/ts-utils';

import { type IAiProviderDescriptor } from './model';

/**
 * Builds an OpenAI-style `Authorization: Bearer ${key}` header, or an empty
 * record when the key is empty. Self-hosted/local OpenAI-compatible servers
 * (Ollama, LM Studio, llama.cpp) often reject `Authorization: Bearer ` with
 * an empty key, so we omit the header entirely in that case.
 *
 * @internal
 */
export function bearerAuthHeader(apiKey: string): Record<string, string> {
  return apiKey.length > 0 ? { Authorization: `Bearer ${apiKey}` } : {};
}

/**
 * Resolves the effective base URL for a request, validating the optional
 * `endpoint` override when present. Returns the URL with any trailing slash
 * stripped so per-route suffix concatenation (e.g. `/chat/completions`)
 * produces the same shape regardless of whether the caller supplied an
 * override or the descriptor's default is used.
 *
 * @internal
 */
export function resolveEffectiveBaseUrl(
  descriptor: IAiProviderDescriptor,
  endpoint?: string
): Result<string> {
  if (endpoint === undefined) {
    if (!descriptor.baseUrl) {
      return fail(`provider "${descriptor.id}" has no API endpoint configured`);
    }
    return succeed(descriptor.baseUrl.replace(/\/+$/, ''));
  }
  if (typeof endpoint !== 'string' || endpoint.length === 0) {
    return fail(`provider "${descriptor.id}": endpoint must be a non-empty http(s) URL`);
  }
  let parsed: URL;
  try {
    parsed = new URL(endpoint);
  } catch {
    return fail(`provider "${descriptor.id}": endpoint is not a valid URL`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return fail(`provider "${descriptor.id}": endpoint must use http or https (got ${parsed.protocol})`);
  }
  if (parsed.search.length > 0 || parsed.hash.length > 0) {
    return fail(`provider "${descriptor.id}": endpoint must not include a query string or fragment`);
  }
  if (parsed.username.length > 0 || parsed.password.length > 0) {
    return fail(
      `provider "${descriptor.id}": endpoint must not include userinfo; pass credentials via apiKey instead`
    );
  }
  // Reconstruct from origin + pathname so the returned URL is normalized
  // (no userinfo, no query, no fragment) and the suffix concat in callers
  // produces a well-formed request URL.
  return succeed(`${parsed.origin}${parsed.pathname}`.replace(/\/+$/, ''));
}
