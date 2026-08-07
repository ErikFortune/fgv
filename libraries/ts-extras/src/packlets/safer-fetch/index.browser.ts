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
 * The address-classification layer — `classifyAddress`, and the pure synchronous policies
 * `allowAnyAddressPolicy` / `blockPrivateNetworksPolicy` — **is** exported here: it is pure
 * arithmetic over parsed octets, it works identically in a browser, and it is useful for a
 * URL-zero check. It is not a substitute for the guard, and cannot be: it classifies an address
 * a caller already holds, while what the browser lacks is any way to learn the address a
 * hostname resolves to.
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
  DEFAULT_RETRY_BASE_DELAY_MS,
  DEFAULT_RETRY_MAX_DELAY_MS,
  DEFAULT_TIMEOUT_MS,
  IDEMPOTENT_METHODS,
  REDIRECT_STATUSES,
  RETRY_AFTER_STATUSES,
  RETRYABLE_HTTP_STATUSES,
  SUPPORTED_SCHEMES
} from './defaults';

export type { FetchFailureReason, FetchTimeoutPhase } from './failureReason';
export type { IRetryPolicy } from './retry';

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

// Runtime-agnostic and exported from both barrels: the address *classification* layer is pure
// arithmetic over parsed octets with no I/O, so it works in a browser exactly as it does on
// Node. It is useful there for a URL-zero check — a caller can refuse an IP-literal URL that
// classifies as private before ever calling `fetch`.
//
// **It cannot substitute for the resolved-address guard.** It classifies an address you already
// have; the guarantee the browser lacks is *obtaining* the address a hostname resolves to, which
// no browser API provides. `https://internal.example.com/` resolving to `10.0.0.5` is invisible
// to every function exported here.
export {
  allowAnyAddressPolicy,
  blockPrivateNetworksPolicy,
  type IAddressCheckVerdict,
  type IAddressPolicy,
  type IBlockPrivateNetworksOptions
} from './addressPolicy';

export {
  classifyAddress,
  type AddressClassification,
  type AddressFamily,
  type IClassifiedAddress,
  type IEmbeddedIpv4,
  type Ipv4EmbeddingKind
} from './addressClassification';
