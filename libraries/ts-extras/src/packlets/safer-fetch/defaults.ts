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
 * Default overall deadline, in milliseconds — comfortably above a slow-but-real API and far
 * below "a hung request pins a socket for minutes". Streaming LLM calls should not use this
 * primitive at all; that is what `AiAssist` is for.
 * @public
 */
export const DEFAULT_TIMEOUT_MS: number = 30_000;

/**
 * Default deadline to first response headers, in milliseconds. A host that has not sent
 * headers in ten seconds is not answering.
 * @public
 */
export const DEFAULT_HEADERS_TIMEOUT_MS: number = 10_000;

/**
 * Default cap on decoded response bytes (5 MiB) — roughly an order of magnitude above a
 * realistic JSON API response and well below a size that threatens a Node heap.
 *
 * @remarks
 * Raising it is a per-call option, not a construction-time setting, precisely because real
 * documents clear this. See `ISaferFetchOptions.maxResponseBytes`.
 * @public
 */
export const DEFAULT_MAX_RESPONSE_BYTES: number = 5 * 1024 * 1024;

/**
 * Redirect statuses this primitive recognizes as redirects. Other 3xx statuses (`300`, `304`,
 * …) do not direct the client at a new URL and are reported as ordinary non-2xx responses.
 * @public
 */
export const REDIRECT_STATUSES: ReadonlyArray<number> = [301, 302, 303, 307, 308];

/**
 * Default cap on redirect hops followed under `'validate-each-hop'`.
 *
 * @remarks
 * Five is enough for the ordinary shortener-then-canonicalize-then-CDN chains real services
 * produce and small enough that a chain designed to burn budget is refused quickly. Every hop
 * costs a full guard evaluation — including a DNS resolution — against the same overall
 * deadline, so the cap bounds work, not just politeness.
 * @public
 */
export const DEFAULT_MAX_REDIRECTS: number = 5;

/**
 * Header names dropped on every cross-origin redirect hop, whatever the caller configured.
 *
 * @remarks
 * Turning on manual redirects makes this primitive responsible for a rule the platform was
 * applying for free: browsers and `curl` both strip credential headers when a redirect leaves
 * the origin, and a hand-rolled loop that replays them hands `Authorization: Bearer …` to
 * whatever host the redirect names. Callers add their own names with
 * `ISaferFetchOptions.sensitiveHeaders`; these three are not removable.
 * @public
 */
export const ALWAYS_STRIPPED_HEADERS: ReadonlyArray<string> = [
  'authorization',
  'cookie',
  'proxy-authorization'
];

/**
 * URL schemes this primitive will ever request.
 *
 * @remarks
 * Core rejects everything else — `file:`, `data:`, `blob:`, `ftp:`, `gopher:`, `ws:` — outright
 * and at every hop, because none of them is a legitimate network fetch and each is a standard
 * SSRF payload. Deciding between `http:` and `https:`, and which ports are acceptable, belongs
 * to the address guard, which is why core does not narrow this further.
 * @public
 */
export const SUPPORTED_SCHEMES: ReadonlyArray<string> = ['http:', 'https:'];

/**
 * Default base delay for {@link SaferFetch.IRetryPolicy | retry} backoff, in milliseconds.
 * @public
 */
export const DEFAULT_RETRY_BASE_DELAY_MS: number = 250;

/**
 * Default ceiling on a single {@link SaferFetch.IRetryPolicy | retry} delay, in milliseconds.
 *
 * @remarks
 * It bounds the computed backoff **and** a server-supplied `Retry-After`. That second role is
 * the security-relevant one: `Retry-After` is a header an attacker-controlled server chooses
 * freely, so an unclamped `Retry-After: 86400` is a denial of service on the caller.
 * @public
 */
export const DEFAULT_RETRY_MAX_DELAY_MS: number = 5_000;

/**
 * HTTP statuses a {@link SaferFetch.IRetryPolicy | retry policy} will retry.
 *
 * @remarks
 * Every other status — including every other 4xx — is terminal. A `401`, a `403` and a `404`
 * mean the same thing on the second attempt as on the first, and retrying them turns a client
 * bug into load against a service that already said no.
 * @public
 */
export const RETRYABLE_HTTP_STATUSES: ReadonlyArray<number> = [408, 429, 500, 502, 503, 504];

/**
 * Statuses whose `Retry-After` header is honored.
 *
 * @remarks
 * `429` and `503` are the two the header is specified for and the two where it carries real
 * scheduling information. Honoring it on a `500` would let any failing endpoint dictate the
 * caller's schedule for no benefit.
 * @public
 */
export const RETRY_AFTER_STATUSES: ReadonlyArray<number> = [429, 503];

/**
 * Methods retried without an explicit opt-in.
 *
 * @remarks
 * A timeout does not tell you whether the server processed the request, so a retried `POST`
 * can double-charge. `retryNonIdempotent` opts out, per call, visibly.
 * @public
 */
export const IDEMPOTENT_METHODS: ReadonlyArray<string> = ['GET', 'HEAD'];
