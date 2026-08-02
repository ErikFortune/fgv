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
 * The entire packlet is runtime-agnostic and contains no `node:` imports, so this barrel is
 * currently identical in content to the Node one. It exists as a distinct barrel because the
 * Node-only address guards land beside the core, and this is the file that must **not** export
 * them.
 *
 * Note: the resolved-address (private-IP) guard and per-hop redirect revalidation are NOT
 * available in a browser, and not for want of implementation. There is no browser API that
 * returns a hostname's A/AAAA records, nothing in `fetch` or `Response` exposes the peer
 * address, and `redirect: 'manual'` yields an opaque response whose `Location` is not
 * readable. `allowAnyAddress()` is the honest choice there, and its name says so.
 *
 * @packageDocumentation
 */

export {
  DEFAULT_HEADERS_TIMEOUT_MS,
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
