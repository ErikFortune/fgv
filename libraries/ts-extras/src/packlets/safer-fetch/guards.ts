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

import { fail, mapResults, Result, succeed } from '@fgv/ts-utils';

import { IMediaType, mediaTypeMatches, parseMediaType, parseMediaTypePattern } from './contentType';
import type {
  IAddressGuard,
  IGuardVerdict,
  IRequestGuard,
  IRequestHop,
  IResolvedGuards,
  IResponseBodyGuard,
  IResponseHeadersGuard,
  ISaferFetchOptions,
  ISaferFetchRequest,
  ISaferFetchResponseHead
} from './model';

/**
 * An address guard that permits every address.
 *
 * @remarks
 * **This is the absence of the SSRF guarantee, given a name.** It performs no address
 * classification, no DNS resolution, and no scheme or port narrowing beyond the core's
 * refusal of non-`http(s)` schemes. A call site using it is reachable at any address the
 * process can route to, including cloud metadata endpoints, loopback admin ports, and
 * RFC-1918 hosts.
 *
 * It ships anyway, for two reasons. It is the honest and only possible choice in a browser,
 * where neither DNS resolution nor redirect interposition exists. And omitting it would not
 * make anyone safer — it would make consumers hand-roll something worse. It is deliberately
 * named to be uncomfortable in review and to grep as a distinct posture.
 * @public
 */
export function allowAnyAddress(): IAddressGuard {
  return {
    name: 'allowAnyAddress',
    check: async (chain: ReadonlyArray<IRequestHop>): Promise<Result<IGuardVerdict>> => {
      const hop = chain[chain.length - 1] ?? undefined;
      if (hop === undefined) {
        return fail('allowAnyAddress: hop chain is empty.');
      }
      // pinnedAddress is deliberately left undefined: this guard validates nothing, so it has
      // no address to pin, and a transport must never be told otherwise.
      return succeed({ url: hop.url });
    }
  };
}

/**
 * A response-headers guard that accepts only the listed media types.
 *
 * @remarks
 * Rejecting on `Content-Type` is strictly cheaper than capping mid-read — a header comparison
 * instead of a partial body transfer — so a consumer ingesting URLs wants it on every call. It
 * is also what keeps an HTML error page served with a `200` from being parsed as JSON twenty
 * frames away from where it went wrong.
 *
 * Entries are media types, optionally with a wildcard subtype (`text/*`); a wildcard type
 * requires a wildcard subtype. Matching is case-insensitive and ignores parameters, so
 * `text/html` accepts `text/html; charset=utf-8`. A response with **no** `Content-Type` is
 * rejected: an untyped response has not satisfied a content-type allowlist.
 *
 * Construction is fallible because a malformed entry in a security-adjacent allowlist must be
 * reported to its author rather than silently compiled into a pattern that never matches.
 *
 * @param types - Accepted media types. Must be non-empty.
 * @public
 */
export function allowContentTypes(types: ReadonlyArray<string>): Result<IResponseHeadersGuard> {
  if (types.length === 0) {
    return fail('allowContentTypes: at least one media type is required.');
  }
  return mapResults(types.map((t) => parseMediaTypePattern(t)))
    .withErrorFormat((message) => `allowContentTypes: ${message}`)
    .onSuccess((patterns: IMediaType[]) => {
      const accepted: ReadonlyArray<string> = patterns.map((p) => `${p.type}/${p.subtype}`);
      return succeed({
        name: 'allowContentTypes',
        acceptedContentTypes: accepted,
        check: async (head: ISaferFetchResponseHead): Promise<Result<true>> => {
          const contentType = head.contentType ?? undefined;
          if (contentType === undefined) {
            return fail(`response has no content-type; expected one of [${accepted.join(', ')}].`);
          }
          return parseMediaType(contentType)
            .withErrorFormat((message) => `content-type ${message}`)
            .onSuccess((actual) => {
              if (patterns.some((p) => mediaTypeMatches(actual, p))) {
                return succeed(true as const);
              }
              return fail(
                `content-type "${contentType}" is not accepted; expected one of [${accepted.join(', ')}].`
              );
            });
        }
      });
    });
}

const passthroughRequestGuard: IRequestGuard = {
  name: 'passthrough',
  check: async (request: ISaferFetchRequest): Promise<Result<ISaferFetchRequest>> => succeed(request)
};

const passthroughResponseHeadersGuard: IResponseHeadersGuard = {
  name: 'passthrough',
  check: async (): Promise<Result<true>> => succeed(true as const)
};

const passthroughResponseBodyGuard: IResponseBodyGuard = {
  name: 'passthrough',
  check: async (): Promise<Result<true>> => succeed(true as const)
};

/**
 * Resolves the guards a call will use, applying defaults once at the boundary so that no
 * downstream code path branches on a guard's absence.
 *
 * @remarks
 * Every optional guard resolves with `??`, uniformly. That uniformity is the point: a
 * `!== undefined` test in one slot where its siblings use `??` lets a `null` — from a
 * JavaScript caller, or through an `unknown` escape hatch — pass straight through and install
 * itself as a guard, which is a real defect that has shipped in this repo before. A `null`
 * guard here is treated as *absent*, never as *installed*.
 *
 * `addressGuard` has no default, so a `null` or missing value is a hard failure rather than a
 * silent passthrough.
 * @internal
 */
export function resolveGuards(options: ISaferFetchOptions): Result<IResolvedGuards> {
  const address = options.addressGuard ?? undefined;
  if (address === undefined) {
    return fail(
      'addressGuard is required and has no default. Supply a named factory — ' +
        'allowAnyAddress() is the explicit opt-out.'
    );
  }
  return succeed({
    address,
    request: options.requestGuard ?? passthroughRequestGuard,
    responseHeaders: options.responseHeadersGuard ?? passthroughResponseHeadersGuard,
    responseBody: options.responseBodyGuard ?? passthroughResponseBodyGuard
  });
}
