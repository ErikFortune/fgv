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

import type { Logging, Result } from '@fgv/ts-utils';

import type { IRetryPolicy } from './retry';

/**
 * HTTP methods a safer-fetch call may use.
 * @public
 */
export type SaferFetchMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * How redirects are handled.
 *
 * @remarks
 * `'reject'` fails on any redirect status. It is the default, and the only mode with an
 * equivalent guarantee on every runtime — a browser cannot inspect a redirect hop at all, so a
 * per-hop revalidating mode is not implementable there.
 *
 * The *guarantee* is equivalent on both runtimes; the failure **reason** is not. Every call uses
 * `redirect: 'manual'`, so on Node a rejected redirect surfaces as `'redirect-rejected'` carrying
 * the status, while in a browser the response is opaque — `type` is `'opaqueredirect'` and
 * `status` is `0`, so there is no status to report — and the same redirect surfaces as
 * `'redirect-opaque'`. Callers that branch on the reason under `'reject'` must handle both.
 *
 * `'validate-each-hop'` follows redirects with `redirect: 'manual'` and runs the **full address
 * guard on every hop before any connection is made**, resolving `Location` against the hop that
 * sent it. Redirect handling and the address check are one mechanism, not two: a guard that
 * validated only the caller's URL is defeated by a single `302` to `http://169.254.169.254/`.
 * Following hops also makes this primitive responsible for credential stripping — see
 * `ISaferFetchOptions.sensitiveHeaders`.
 *
 * **`'validate-each-hop'` is accepted by the browser barrel but cannot succeed there, and fails
 * loudly rather than degrading.** The type is shared because one core serves both runtimes; the
 * runtime is not. A browser's `redirect: 'manual'` yields an opaque response — `type` is
 * `'opaqueredirect'`, `status` is `0`, and `Location` is not readable — so the first redirect
 * fails as `'redirect-opaque'`. That is the honest outcome: the hop information does not exist
 * on the browser side of the API, so there is nothing to guard and nothing to follow. Use
 * `'reject'` there, or handle `'redirect-opaque'`.
 *
 * A mode that defers to the platform's own redirect following is deliberately absent on Node:
 * it would put hops on the wire that the guard never saw.
 * @public
 */
export type SaferFetchRedirectPolicy = 'reject' | 'validate-each-hop';

/**
 * One hop in a redirect chain. Entry 0 is the caller's original request.
 * @public
 */
export interface IRequestHop {
  /** The URL under consideration for this hop. */
  readonly url: URL;
  /** The redirect status that produced the NEXT hop; absent on the current one. */
  readonly status?: number;
  /**
   * The address actually connected to on this hop, when address pinning was in effect.
   *
   * @remarks
   * Populated from the address guard's {@link SaferFetch.IGuardVerdict.pinnedAddress} once the
   * transport has accepted it — which is sound because a transport that cannot honor a pin is
   * required to fail rather than connect by hostname, so a completed request with a pin set is
   * evidence the pin held. **Undefined throughout this release**, since no shipped guard pins
   * and {@link SaferFetch.platformFetchTransport} cannot honor one; the field is where the
   * rebinding defense's per-hop evidence will live.
   */
  readonly connectedAddress?: string;
}

/**
 * An address guard's decision about a hop.
 * @public
 */
export interface IGuardVerdict {
  /**
   * The URL cleared for request. Guards may **normalize** it — lowercase the host, strip a
   * trailing dot, punycode an IDN — and the normalized URL is what gets requested. Guards
   * must not **retarget** it to a different destination.
   *
   * @remarks
   * That contract is documented rather than enforced: origin-equality enforcement would
   * reject exactly the normalizations the guard is supposed to perform. Guards are trusted
   * first-party code; a malicious in-process caller is out of this primitive's threat model.
   * The one check that is enforced is the scheme — a verdict URL whose scheme is not
   * `http:` or `https:` is rejected.
   */
  readonly url: URL;

  /**
   * The address the guard validated and to which the connection SHOULD be pinned.
   *
   * @remarks
   * **Always `undefined` in this release** — reserved for the pinned-connect work that
   * closes the DNS-rebinding hole. A transport that receives a defined value it cannot
   * honor MUST fail rather than connect by hostname; {@link SaferFetch.platformFetchTransport}
   * does exactly that. Ignoring the hint would give a deployment that wired a pinning guard
   * but forgot the matching transport precisely the rebinding exposure it believed it had
   * closed, silently.
   */
  readonly pinnedAddress?: string;
}

/**
 * Decides whether a connection may be made. Invoked once per redirect hop, never only on
 * the initial URL.
 *
 * @remarks
 * This is the SSRF boundary and the one guard whose failure is catastrophic, which is why
 * it is a separate seam from the request and response policy guards: "did the address check
 * run, and run correctly?" should be answerable by reading one small implementation.
 *
 * The seam is **asynchronous and hop-chain-aware so that it can wrap a pure classifier**: a
 * real guard resolves `url.hostname` to an address list and then delegates the judgement to a
 * synchronous, address-list-in policy. That split keeps the part with the adversarial test
 * matrix — the address classification itself — free of transports, DNS, and hop bookkeeping,
 * and keeps exactly one implementation of it. A guard is the resolving, chain-aware half; it
 * should not re-derive what the classifier already decides.
 *
 * Classify `url.hostname`, never raw URL text: the WHATWG parser has already normalized
 * `127.0x.1` to `127.0.0.1` and `::ffff:169.254.169.254` to `::ffff:a9fe:a9fe`, and text
 * matching misses both.
 * @public
 */
export interface IAddressGuard {
  /** Stable identifier, surfaced in `'blocked-by-guard'` failures. */
  readonly name: string;

  /**
   * @param chain - Every hop so far, oldest first. The URL under consideration is the last
   * entry; `chain.length === 1` is the initial request. There is deliberately no separate
   * "is this a redirect" flag — hop 0 is not a special case, and a guard that compares only
   * against the immediately previous hop cannot see an `A → B → A` laundering hop.
   */
  check(chain: ReadonlyArray<IRequestHop>): Promise<Result<IGuardVerdict>>;
}

/**
 * The request a safer-fetch call is about to issue.
 * @public
 */
export interface ISaferFetchRequest {
  readonly url: URL;
  readonly method: SaferFetchMethod;
  /** Header names are lowercased. */
  readonly headers: Readonly<Record<string, string>>;
  readonly body?: string | Uint8Array;
}

/**
 * Response status and headers, available before any body bytes are read.
 * @public
 */
export interface ISaferFetchResponseHead {
  readonly status: number;
  readonly statusText: string;
  /** Header names are lowercased. */
  readonly headers: Readonly<Record<string, string>>;
  /** Raw `content-type` header value, including any parameters. */
  readonly contentType?: string;
  /** Parsed `content-length`, present only when the header was sent and is a valid count. */
  readonly contentLength?: number;
}

/**
 * Policy guard over the outbound request.
 *
 * @remarks
 * **Reject-only.** Silently rewriting a caller's headers or body inside a fetch primitive
 * means the caller no longer knows what was sent. To alter the request, return an explicit
 * replacement the caller could have observed.
 *
 * Runs **before** the address guard, so an address guard is always the last word before the
 * connect: a replacement request that changed the URL is still address-checked.
 * @public
 */
export interface IRequestGuard {
  readonly name: string;
  check(request: ISaferFetchRequest, chain: ReadonlyArray<IRequestHop>): Promise<Result<ISaferFetchRequest>>;
}

/**
 * Policy guard over the response head.
 *
 * @remarks
 * Runs before any body bytes are read, so a rejection costs a header comparison instead of a
 * partial body transfer. This is the right layer for content-type gating — see
 * {@link SaferFetch.allowContentTypes}.
 * @public
 */
export interface IResponseHeadersGuard {
  readonly name: string;

  /**
   * The media types this guard accepts, when it is a content-type allowlist.
   *
   * @remarks
   * Present so that a rejection can be reported as `'unsupported-content-type'` carrying the
   * accepted list, rather than as an opaque policy rejection the caller has to parse a message
   * to understand. A guard that is not a content-type allowlist omits it and its rejections are
   * reported as `'blocked-by-guard'`.
   */
  readonly acceptedContentTypes?: ReadonlyArray<string>;

  check(head: ISaferFetchResponseHead, chain: ReadonlyArray<IRequestHop>): Promise<Result<true>>;
}

/**
 * Policy guard over the buffered response body.
 *
 * @remarks
 * Runs on the buffered body, after the size cap has been enforced — so it can never be handed
 * an unbounded stream.
 * @public
 */
export interface IResponseBodyGuard {
  readonly name: string;
  check(body: Uint8Array, head: ISaferFetchResponseHead): Promise<Result<true>>;
}

/**
 * Out-of-band information a transport may need that `RequestInit` cannot express.
 * @public
 */
export interface IFetchTransportHints {
  /**
   * The address the address guard validated, to which this connection must be pinned.
   * A transport that cannot pin MUST fail rather than connect by hostname.
   */
  readonly pinnedAddress?: string;
}

/**
 * Performs the actual request.
 *
 * @remarks
 * Injectable for two reasons. It is the seam through which a pinned-connect implementation
 * drops in without any caller-visible signature change — which is what keeps closing the
 * DNS-rebinding hole additive rather than breaking. And it is the test seam: redirect chains,
 * lying `Content-Length` headers, compression-bomb shapes, and trickling bodies are all
 * unit-testable through a scripted transport, with no live server anywhere in the suite.
 * @public
 */
export interface IFetchTransport {
  readonly name: string;
  fetch(url: URL, init: RequestInit, hints: IFetchTransportHints): Promise<Result<Response>>;
}

/**
 * Options common to every safer-fetch entry point.
 * @public
 */
export interface ISaferFetchOptions {
  /**
   * **Required, with no default.** A passthrough default here would be exactly the failure
   * this primitive exists to avoid — advertising a guarantee it does not have. Requiring it
   * makes omission a *compile* error rather than a runtime surprise or a lint rule, and makes
   * every call site's posture greppable in one search with no ambient default to overlook.
   *
   * Use a named factory. `allowAnyAddress()` is the explicit, deliberately uncomfortable
   * opt-out, and is the only correct choice in a browser, where neither DNS resolution nor
   * redirect interposition exists.
   */
  readonly addressGuard: IAddressGuard;

  /**
   * Policy guard over the outbound request. Optional here and non-optional once resolved —
   * it defaults to silent passthrough, applied once at the boundary, so no downstream code
   * path branches on a guard's absence.
   */
  readonly requestGuard?: IRequestGuard;

  /**
   * Policy guard over the response head. Defaults to silent passthrough. Content-type gating
   * lives here — see {@link SaferFetch.allowContentTypes}; it is deliberately not a separate
   * option, which would be a second mechanism for one job.
   */
  readonly responseHeadersGuard?: IResponseHeadersGuard;

  /** Policy guard over the buffered body. Defaults to silent passthrough. */
  readonly responseBodyGuard?: IResponseBodyGuard;

  /** Defaults to `'GET'`. */
  readonly method?: SaferFetchMethod;

  /** Request headers. Names are lowercased before the request guard sees them. */
  readonly headers?: Readonly<Record<string, string>>;

  /** Request body. Not permitted with `'GET'` or `'HEAD'`. */
  readonly body?: string | Uint8Array;

  /**
   * Overall deadline in milliseconds, covering the connect, the response headers, and the
   * body read. Default {@link SaferFetch.DEFAULT_TIMEOUT_MS}. This is the deadline that stops
   * a response dribbling one byte every 25 seconds, which passes every per-read check.
   */
  readonly timeoutMs?: number;

  /**
   * Deadline to first response headers, in milliseconds. Default
   * {@link SaferFetch.DEFAULT_HEADERS_TIMEOUT_MS}. Distinguishes "the host is not answering"
   * from "the host is answering slowly", which the failure taxonomy then reports as
   * `timeout.phase`.
   *
   * @remarks
   * Measured from the start of the attempt, which includes guard evaluation — an address guard
   * that resolves DNS spends this budget too. That is deliberate: the deadline bounds the time
   * a caller waits for a usable response, not the time one layer of the implementation spends.
   */
  readonly headersTimeoutMs?: number;

  /**
   * Cap on decoded response bytes. Default {@link SaferFetch.DEFAULT_MAX_RESPONSE_BYTES}
   * (5 MiB).
   *
   * @remarks
   * **This knob is meant to be reached for.** 5 MiB is roughly an order of magnitude above a
   * realistic JSON API response and is generous for text, but real documents clear it — raise
   * it per call for the calls that need it rather than treating the default as a ceiling. The
   * cap is enforced by counting decoded bytes during the read, so raising it raises the
   * buffer the process may be asked to hold; size it against the heap you are willing to
   * spend, not against the largest document you can imagine.
   */
  readonly maxResponseBytes?: number;

  /**
   * How redirects are handled. Defaults to `'reject'`.
   *
   * @remarks
   * The conservative default is deliberate, and is the same polarity as `addressGuard` having no
   * default: one core serves both runtimes, `'reject'` is the only mode whose guarantee is
   * identical on each, and following a redirect chain into hosts the caller never named is a
   * posture worth spelling at the call site. Callers ingesting real-world URLs want
   * `'validate-each-hop'`.
   */
  readonly redirectPolicy?: SaferFetchRedirectPolicy;

  /**
   * Cap on redirect hops followed under `'validate-each-hop'`. Default
   * {@link SaferFetch.DEFAULT_MAX_REDIRECTS} (5). Must be a non-negative integer; `0` refuses
   * to follow any redirect.
   */
  readonly maxRedirects?: number;

  /**
   * Additional header names to drop on a cross-origin redirect hop, on top of the always-dropped
   * `authorization`, `cookie` and `proxy-authorization`
   * ({@link SaferFetch.ALWAYS_STRIPPED_HEADERS}).
   *
   * @remarks
   * Matching is case-insensitive. Use this for bearer-equivalent headers a deployment invented —
   * `x-api-key`, `x-auth-token`, a signed-request header. Stripping is **monotonic**: once a hop
   * has left an origin the headers are gone for the rest of the chain, so an `A` → `B` → `A`
   * chain does not hand the credential back to `A` after `B` has watched it leave.
   */
  readonly sensitiveHeaders?: ReadonlyArray<string>;

  /**
   * Opt-in retry. **Off by default** — a primitive that silently retries changes the semantics
   * of every call site and amplifies load against a service that is already struggling.
   *
   * @remarks
   * Retries consume `timeoutMs` and never reset it, so enabling retry does not extend the
   * deadline; and every attempt re-runs the address guard from hop 0 as a full re-walk, never a
   * resume and never a cached verdict. Both rules are load-bearing rather than incidental — see
   * {@link SaferFetch.IRetryPolicy}, which states why.
   */
  readonly retry?: IRetryPolicy;

  /** Defaults to {@link SaferFetch.platformFetchTransport}. */
  readonly transport?: IFetchTransport;

  /** Caller's cancellation signal. Reported as `'aborted'`, never as `'timeout'`. */
  readonly signal?: AbortSignal;

  /** Diagnostics sink. Defaults to a no-op logger. */
  readonly logger?: Logging.ILogger;
}

/**
 * The guards a call will actually use. Every field is concrete: defaults are applied once, at
 * the boundary, and nothing downstream branches on a guard's absence.
 * @public
 */
export interface IResolvedGuards {
  /** Caller-supplied; there is no default. */
  readonly address: IAddressGuard;
  readonly request: IRequestGuard;
  readonly responseHeaders: IResponseHeadersGuard;
  readonly responseBody: IResponseBodyGuard;
}

/**
 * A successful safer-fetch response.
 * @public
 */
export interface ISaferFetchResponse<T> {
  readonly value: T;
  readonly status: number;
  /** Header names are lowercased. */
  readonly headers: Readonly<Record<string, string>>;
  /**
   * Every URL actually requested, in order, as cleared by the address guard. `[0]` is the
   * caller's; later entries are redirect hops. A caller that allowlisted `api.example.com`
   * and was redirected to `cdn.example.com` usually wants to know.
   */
  readonly urlChain: ReadonlyArray<string>;
  /** Decoded bytes read from the response body. */
  readonly bytesRead: number;
}
