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

import { captureResult, type Result } from '@fgv/ts-utils';

import { ALWAYS_STRIPPED_HEADERS } from './defaults';
import type { SaferFetchMethod } from './model';

/** Headers describing a body that is about to be dropped, so they must go with it. */
const BODY_DESCRIBING_HEADERS: ReadonlyArray<string> = ['content-type', 'content-length'];

/**
 * Builds the set of header names to drop on a cross-origin hop.
 *
 * @remarks
 * Lowercased on the way in so the comparison is case-insensitive: HTTP header names are, and a
 * request guard returning a replacement request spelled `Authorization` must not slip a
 * credential past a set keyed on `authorization`.
 * @internal
 */
export function sensitiveHeaderSet(extra?: ReadonlyArray<string>): ReadonlySet<string> {
  return new Set<string>([...ALWAYS_STRIPPED_HEADERS, ...(extra ?? [])].map((n) => n.toLowerCase()));
}

/**
 * Resolves a `Location` header against the URL of the hop that sent it.
 *
 * @remarks
 * Resolved against the **current** hop, not the caller's original URL: a relative `Location` on
 * the third hop of a chain is relative to the third hop.
 * @internal
 */
export function resolveLocation(location: string, base: URL): Result<URL> {
  return captureResult(() => new URL(location, base)).withErrorFormat(
    (message) => `cannot resolve redirect target "${location}": ${message}`
  );
}

/** The request to issue on the next hop. @internal */
export interface IRedirectRewrite {
  readonly method: SaferFetchMethod;
  /** Header names are lowercased; credential headers are absent on a cross-origin hop. */
  readonly headers: Record<string, string>;
  readonly body: string | Uint8Array | undefined;
  /** Whether this hop left the previous hop's origin, and so dropped credential headers. */
  readonly crossOrigin: boolean;
}

/** Inputs to {@link rewriteForRedirect}. @internal */
export interface IRedirectRewriteParams {
  /** The URL that was requested and answered with the redirect. */
  readonly from: URL;
  /** The already-resolved redirect target. */
  readonly to: URL;
  readonly status: number;
  readonly method: SaferFetchMethod;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string | Uint8Array | undefined;
  readonly sensitiveHeaders: ReadonlySet<string>;
}

/**
 * Derives the next hop's method, headers and body from the hop that redirected.
 *
 * @remarks
 * **Method and body** follow the platform, because a primitive that redirects differently from
 * `fetch` surprises callers in a way no documentation repairs. Per the Fetch standard: `301` and
 * `302` convert a `POST` to a `GET` and drop the body, and leave every other method alone; `303`
 * converts anything that is not already `GET`/`HEAD`; `307` and `308` preserve both. `status` is
 * on `IRequestHop` for exactly this reason. A dropped body takes `Content-Type` and
 * `Content-Length` with it — describing a body that is no longer there is not a rounding error
 * on a request a guard is about to inspect.
 *
 * **Credential stripping is monotonic.** The comparison is against the hop that redirected, and
 * the headers carried in are the *previous hop's* headers, not the caller's original set. That
 * distinction is the whole game: `A`(authenticated) → `B` → `A` must not re-attach on the final
 * hop. Re-deriving each hop's headers from the caller's original request and comparing to the
 * caller's original origin finds the last hop same-origin with `A` and hands the token back —
 * after `B` has already observed the chain. It reviews as correct and it is a real leak.
 * @internal
 */
export function rewriteForRedirect(params: IRedirectRewriteParams): IRedirectRewrite {
  const crossOrigin: boolean = params.to.origin !== params.from.origin;
  const method: SaferFetchMethod = _rewriteMethod(params.status, params.method);
  const dropsBody: boolean = method !== params.method;
  const drop: ReadonlySet<string> = new Set<string>([
    ...(crossOrigin ? params.sensitiveHeaders : []),
    ...(dropsBody ? BODY_DESCRIBING_HEADERS : [])
  ]);

  const headers: Record<string, string> = {};
  for (const [name, value] of Object.entries(params.headers)) {
    const lowered = name.toLowerCase();
    if (!drop.has(lowered)) {
      headers[lowered] = value;
    }
  }

  return { method, headers, body: dropsBody ? undefined : params.body, crossOrigin };
}

function _rewriteMethod(status: number, method: SaferFetchMethod): SaferFetchMethod {
  if ((status === 301 || status === 302) && method === 'POST') {
    return 'GET';
  }
  if (status === 303 && method !== 'GET' && method !== 'HEAD') {
    return 'GET';
  }
  return method;
}
