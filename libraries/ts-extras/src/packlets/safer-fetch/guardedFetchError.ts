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

import type { FetchFailureReason } from './failureReason';

/**
 * The error a {@link SaferFetch.GuardedFetch} rejects with, for every failure: a guard refusal, a
 * rejected redirect, a headers timeout, a caller's abort, a network failure, an unsupported
 * request, or a declared body over `maxResponseBytes`. It is also the error a capped body stream
 * errors with once the count passes `maxResponseBytes`.
 *
 * @remarks
 * **The message is fixed text** — `guarded fetch failed: <kind>` — so that a fetch-shaped caller
 * that logs or surfaces `error.message` does not leak the URL or the guard's detail by default. The
 * one addition is for `'too-large'`, which names `maxResponseBytes` and the caller's own limit, so
 * that the failure is identifiable from a body read that errors with it (see
 * {@link SaferFetch.IGuardedFetchOptions.maxResponseBytes}). Nothing in it comes from the server.
 *
 * **`reason` holds URLs and guard detail.** It is the same `FetchFailureReason` the buffered entry
 * points return, and the same warning applies: it is an internal-network scanning oracle. Log it;
 * never echo it, or anything derived from it beyond `reason.kind`, to an untrusted caller.
 *
 * It deliberately extends `Error` and not `TypeError`. `fetch` rejects a network failure with a
 * `TypeError`, and some fetch-shaped callers read a `TypeError` as a CORS failure and retry the
 * request differently or swallow it — which would turn a guard's refusal into a retry.
 * @public
 */
export class GuardedFetchError extends Error {
  /** Why the request failed. Carries URLs; see the class remarks before logging or echoing it. */
  public readonly reason: FetchFailureReason;

  public constructor(reason: FetchFailureReason) {
    super(
      reason.kind === 'too-large'
        ? `guarded fetch failed: too-large: the response body exceeded maxResponseBytes (${reason.limit} bytes)`
        : `guarded fetch failed: ${reason.kind}`
    );
    this.name = 'GuardedFetchError';
    this.reason = reason;
  }
}
