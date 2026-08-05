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
 * An HTTP fetch primitive with an explicit threat model (browser version).
 *
 * This barrel deliberately omits `blockPrivateNetworks` and the resolver seam beneath it: that
 * module imports `node:dns/promises`, and exporting it here would pull a Node builtin into a
 * browser bundle.
 *
 * That is not the only difference. The address-classification layer — `classifyAddress`, and the
 * pure synchronous policies `allowAnyAddressPolicy` / `blockPrivateNetworksPolicy` — is
 * runtime-agnostic but is currently exported from the Node barrel only. Nothing prevents a
 * browser from using it; it simply has not been part of this barrel's surface, and widening a
 * public surface is left to the stream that owns the browser packlet. What ships here today is
 * the entry points, the guard/transport seams, `allowAnyAddress`, `allowContentTypes`, and the
 * shared types and constants.
 *
 * Note: the resolved-address (private-IP) guard and per-hop redirect revalidation are NOT
 * available in a browser, and not for want of implementation. There is no browser API that
 * returns a hostname's A/AAAA records, nothing in `fetch` or `Response` exposes the peer
 * address, and `redirect: 'manual'` yields an opaque response whose `Location` is not
 * readable — a `'validate-each-hop'` call there fails as `'redirect-opaque'` rather than
 * quietly following anything. `allowAnyAddress()` is the honest choice, and its name says so.
 *
 * @packageDocumentation
 */

export {
  ALWAYS_STRIPPED_HEADERS,
  DEFAULT_HEADERS_TIMEOUT_MS,
  DEFAULT_MAX_REDIRECTS,
  DEFAULT_MAX_RESPONSE_BYTES,
  DEFAULT_TIMEOUT_MS,
  REDIRECT_STATUSES,
  SUPPORTED_SCHEMES
} from './defaults';

export type { FetchFailureReason, FetchTimeoutPhase } from './failureReason';

export type {
  IAddressGuard,
  IFetchTransport,
  IFetchTransportHints,
  IGuardVerdict,
  IRequestGuard,
  IRequestHop,
  IResolvedGuards,
  IResponseBodyGuard,
  IResponseHeadersGuard,
  ISaferFetchOptions,
  ISaferFetchRequest,
  ISaferFetchResponse,
  ISaferFetchResponseHead,
  SaferFetchMethod,
  SaferFetchRedirectPolicy
} from './model';

export { allowAnyAddress, allowContentTypes } from './guards';

export { platformFetchTransport } from './transport';

export { saferFetchBytes, saferFetchJson, saferFetchText, type ISaferFetchJsonOptions } from './saferFetch';
