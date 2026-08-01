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
 * Which deadline a {@link SaferFetch.FetchFailureReason | timeout failure} belongs to.
 *
 * - `'headers'`: the per-attempt headers deadline elapsed before the server sent
 *   response headers — the host is not answering.
 * - `'body'`: the overall deadline elapsed while the response body was being read
 *   — the host answered and then trickled (the slowloris shape).
 * - `'overall'`: the overall deadline elapsed before response headers arrived.
 * @public
 */
export type FetchTimeoutPhase = 'headers' | 'body' | 'overall';

/**
 * Machine-readable reason a safer-fetch call failed, carried as the detail of the
 * `DetailedResult` every entry point returns.
 *
 * @remarks
 * **This value is an internal-network scanning oracle. Do not echo it, or any string
 * derived from it, to an untrusted caller.** A `'blocked-by-guard'` detail names the
 * URL, the hop, and the guard that rejected it; an attacker who can influence the
 * request URL and observe the error learns whether an internal host exists. Log the
 * detail; return a coarse code (the `kind` alone, or a generic message) to callers.
 *
 * Following the `AiAssist.JsonParseFailureReason` precedent in this package: a `kind`
 * discriminant with per-kind payload fields, and `'unknown'` as an honest catch-all
 * rather than a guess.
 * @public
 */
export type FetchFailureReason =
  /** The supplied URL could not be parsed, or its scheme is not `http:` or `https:`. */
  | { readonly kind: 'invalid-url'; readonly url: string; readonly detail: string }
  /**
   * A guard refused. `hop` is 0-based; hop 0 is the caller's URL, and `guard` names which
   * guard rejected — which is what makes "did the address check run, and was it the thing that
   * said no?" answerable from the failure alone. A content-type rejection is reported as
   * `'unsupported-content-type'` instead, because that case carries a more useful payload.
   */
  | {
      readonly kind: 'blocked-by-guard';
      readonly url: string;
      readonly hop: number;
      readonly guard: string;
      readonly detail: string;
    }
  /** A redirect status was received under a redirect policy that rejects redirects. */
  | { readonly kind: 'redirect-rejected'; readonly url: string; readonly status: number }
  /**
   * The platform returned an opaque redirect, whose `Location` is not readable. This is
   * what a browser yields for `redirect: 'manual'`; the hop cannot be inspected at all.
   */
  | { readonly kind: 'redirect-opaque' }
  /** The redirect hop budget was exhausted. */
  | { readonly kind: 'too-many-redirects'; readonly hops: number; readonly limit: number }
  /** One of the deadlines elapsed. Distinct from `'aborted'`, which is the caller's signal. */
  | {
      readonly kind: 'timeout';
      readonly phase: FetchTimeoutPhase;
      readonly elapsedMs: number;
      readonly limitMs: number;
    }
  /** The caller's `AbortSignal` fired. Distinct from `'timeout'`, which is our deadline. */
  | { readonly kind: 'aborted' }
  /** The transport could not complete the request. */
  | { readonly kind: 'network'; readonly detail: string }
  /**
   * A non-2xx response. `bodyPreview` is opt-in and length-capped because error bodies
   * routinely echo request content, including credentials.
   */
  | {
      readonly kind: 'http-status';
      readonly status: number;
      readonly statusText: string;
      readonly bodyPreview?: string;
    }
  /**
   * The response exceeded the byte cap. `declared` is what `Content-Length` claimed, present
   * only when the header was sent — and it counts *encoded* bytes where `bytesRead` counts
   * *decoded* bytes, so a `declared` far below `bytesRead` is evidence of a compression bomb
   * or a lying server rather than an arithmetic error.
   */
  | {
      readonly kind: 'too-large';
      readonly bytesRead: number;
      readonly limit: number;
      readonly declared?: number;
    }
  /** A response-headers guard rejected the response's content type. */
  | {
      readonly kind: 'unsupported-content-type';
      readonly contentType?: string;
      readonly accepted: ReadonlyArray<string>;
    }
  /** The response bytes could not be decoded to text with the indicated charset. */
  | { readonly kind: 'decode'; readonly detail: string }
  /** The decoded text could not be parsed, or failed the caller's converter. */
  | { readonly kind: 'parse'; readonly detail: string }
  /**
   * Anything else — including invalid options and a guard or transport that violated its
   * contract. Reports what it knows rather than guessing at a more specific kind.
   */
  | { readonly kind: 'unknown'; readonly detail: string };
