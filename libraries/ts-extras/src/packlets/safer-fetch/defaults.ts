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
