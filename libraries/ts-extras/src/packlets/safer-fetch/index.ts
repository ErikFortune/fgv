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
 * A safer `fetch` primitive with an explicit threat model.
 *
 * This is deliberately **not** a thin, unopinionated boundary over an upstream library. There
 * is no upstream to wrap — `fetch` is a platform global — and the opinion *is* the product:
 * the deadlines, the scheme refusal, the streaming size cap, the redirect posture, and the
 * required address guard are the deliverable. A caller who strips the opinion out has `fetch`,
 * which is where they started.
 *
 * The guiding constraint: *a primitive that advertises a guarantee it does not have is worse
 * than five lines at a call site, because it transfers responsibility without transferring
 * protection.* Every entry point's documentation names what it does **not** protect against
 * next to what it does.
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

// Two layers, one naming rule: an **unsuffixed** factory returns the asynchronous,
// hop-chain-aware, name-resolving `IAddressGuard` that an entry point's `addressGuard` option
// takes (`allowAnyAddress`, `blockPrivateNetworks`), while a **`Policy`-suffixed** factory
// returns the pure, synchronous `IAddressPolicy` over an already-resolved address list that such
// a guard delegates to (`allowAnyAddressPolicy`, `blockPrivateNetworksPolicy`). The unsuffixed
// names are the ones callers reach for, which is why they are the ones that fit the call site.
export {
  allowAnyAddressPolicy,
  blockPrivateNetworksPolicy,
  type IAddressCheckVerdict,
  type IAddressPolicy,
  type IBlockPrivateNetworksOptions
} from './addressPolicy';

// Node only — it resolves names, and no browser API returns a hostname's A/AAAA records. This
// is the one module in the packlet that performs I/O, and the reason this barrel and the browser
// barrel differ at all.
export {
  blockPrivateNetworks,
  nodeHostResolver,
  type HostResolver,
  type IBlockPrivateNetworksGuardOptions
} from './nodeAddressGuard';

export {
  classifyAddress,
  type AddressClassification,
  type AddressFamily,
  type IClassifiedAddress,
  type IEmbeddedIpv4,
  type Ipv4EmbeddingKind
} from './addressClassification';
