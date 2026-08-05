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

import {
  captureAsyncResult,
  captureResult,
  failWithDetail,
  Logging,
  succeed,
  succeedWithDetail,
  type Converter,
  type DetailedFailure,
  type DetailedResult,
  type Result,
  type Validator
} from '@fgv/ts-utils';
import { Converters as JsonBaseConverters, type JsonValue } from '@fgv/ts-json-base';

import { parseCharset, parseContentLength } from './contentType';
import { DeadlineWatch, type DeadlineStopCause } from './deadline';
import {
  DEFAULT_HEADERS_TIMEOUT_MS,
  DEFAULT_MAX_REDIRECTS,
  DEFAULT_MAX_RESPONSE_BYTES,
  DEFAULT_TIMEOUT_MS,
  REDIRECT_STATUSES,
  SUPPORTED_SCHEMES
} from './defaults';
import type { FetchFailureReason } from './failureReason';
import { resolveGuards } from './guards';
import {
  computeRetryDelayMs,
  honorsRetryAfter,
  isRetryableFailure,
  isRetryableMethod,
  parseRetryAfterMs,
  resolveRetryPolicy,
  type IResolvedRetryPolicy
} from './retry';
import type {
  IGuardVerdict,
  IRequestHop,
  IResolvedGuards,
  ISaferFetchOptions,
  ISaferFetchRequest,
  ISaferFetchResponse,
  ISaferFetchResponseHead,
  SaferFetchMethod,
  SaferFetchRedirectPolicy
} from './model';
import { resolveLocation, rewriteForRedirect, sensitiveHeaderSet } from './redirect';
import { platformFetchTransport } from './transport';

/** Every entry point's carrier: a value, or a machine-readable reason it failed. */
type Outcome<T> = DetailedResult<T, FetchFailureReason>;

/**
 * The raw outcome of a call, before the body bytes are interpreted as bytes, text, or JSON.
 * @internal
 */
interface IRawOutcome {
  readonly bytes: Uint8Array;
  readonly head: ISaferFetchResponseHead;
  readonly urlChain: ReadonlyArray<string>;
}

/** Resolved, validated per-call settings. Every field concrete from here down. */
interface IResolvedCallOptions {
  readonly method: SaferFetchMethod;
  readonly headers: Record<string, string>;
  readonly body: string | Uint8Array | undefined;
  readonly timeoutMs: number;
  readonly headersTimeoutMs: number;
  readonly maxResponseBytes: number;
  readonly redirectPolicy: SaferFetchRedirectPolicy;
  readonly maxRedirects: number;
  /** Lowercased; the always-stripped three unioned with the caller's additions. */
  readonly sensitiveHeaders: ReadonlySet<string>;
  /** Never absent once resolved: an omitted `retry` option resolves to zero attempts. */
  readonly retry: IResolvedRetryPolicy;
  readonly logger: Logging.ILogger;
}

/**
 * Per-attempt out-channel for scheduling information the failure taxonomy deliberately does not
 * carry.
 *
 * @remarks
 * `Retry-After` is advice to this process about when to come back, not a fact about the response
 * — and it is chosen by a server this threat model treats as potentially hostile, so it does not
 * belong on a `FetchFailureReason` that callers are invited to log and map. Carrying it beside
 * the failure instead of on it keeps the taxonomy's surface unchanged.
 *
 * A fresh instance is created per attempt, so a stale header from the attempt before cannot
 * schedule the attempt after.
 */
interface IAttemptNotes {
  /** Raw `Retry-After` header of the response that failed, when one was sent. */
  retryAfter?: string;
}

/**
 * A hop the address guard has cleared: the URL that will actually be requested, and the address
 * the guard requires the connection to be pinned to, if any.
 */
interface IClearedHop {
  readonly url: URL;
  readonly pinnedAddress: string | undefined;
}

/**
 * A hop that has already been requested and redirected away from.
 *
 * @remarks
 * Narrows `IRequestHop.status` from optional to required. A completed hop always has one — it
 * is the redirect status that produced its successor — and typing it as present is what lets
 * loop detection name that status without inventing a fallback for a case that cannot occur.
 */
interface ICompletedHop extends IRequestHop {
  readonly status: number;
}

/**
 * What one attempt produced: either the response this call was after, or a redirect to follow.
 *
 * @remarks
 * A discriminated union rather than a sentinel because the redirect branch carries fields the
 * final branch does not have and vice versa — and because the alternative, letting `_receive`
 * decide whether to recurse, would put the hop loop inside the response-handling path where the
 * hop cap and the credential rule are much harder to see.
 */
type AttemptOutcome =
  | { readonly kind: 'final'; readonly bytes: Uint8Array; readonly head: ISaferFetchResponseHead }
  | { readonly kind: 'redirect'; readonly status: number; readonly location: string };

/** One completed attempt, with the URL that was actually requested. */
interface IAttempt {
  /**
   * The URL the transport was given — the address guard's cleared, possibly normalized URL,
   * not necessarily the spelling the caller or a `Location` header used. This is what a relative
   * `Location` resolves against, and what lands in `urlChain`.
   */
  readonly url: URL;
  readonly connectedAddress: string | undefined;
  readonly outcome: AttemptOutcome;
}

const METHODS_WITHOUT_BODY: ReadonlyArray<SaferFetchMethod> = ['GET', 'HEAD'];

const REDIRECT_POLICIES: ReadonlyArray<SaferFetchRedirectPolicy> = ['reject', 'validate-each-hop'];

function _succeed<T>(value: T): Outcome<T> {
  return succeedWithDetail<T, FetchFailureReason>(value);
}

function _fail<T>(detail: FetchFailureReason, message: string): Outcome<T> {
  return failWithDetail<T, FetchFailureReason>(message, detail);
}

/** Re-types a failure for the next stage without re-deriving its message or detail. */
function _propagate<TFrom, TTo>(from: DetailedFailure<TFrom, FetchFailureReason>): Outcome<TTo> {
  return failWithDetail<TTo, FetchFailureReason>(from.message, from.detail);
}

function _unknown<T>(message: string): Outcome<T> {
  return _fail<T>({ kind: 'unknown', detail: message }, message);
}

function _blocked<T>(seam: string, url: URL, hop: number, guard: string, detail: string): Outcome<T> {
  return _fail<T>(
    { kind: 'blocked-by-guard', url: url.toString(), hop, guard, detail },
    `${seam} guard "${guard}" rejected ${url.toString()} at hop ${hop}: ${detail}`
  );
}

/**
 * Awaits a guard or transport call, converting a thrown error or rejected promise into a
 * `Failure` so a misbehaving implementation cannot escape the taxonomy as an exception.
 */
async function _capture<T>(fn: () => Promise<Result<T>>): Promise<Result<T>> {
  return captureAsyncResult(fn).onSuccess((inner) => inner);
}

/**
 * Runs a guard or transport call against the deadlines and folds all three outcomes — stopped,
 * refused, cleared — into one `DetailedResult` the caller can chain from.
 *
 * @remarks
 * Exists so the request path reads as a chain rather than as five copies of the same
 * stopped-then-failed ladder. The taxonomy mapping stays per-site, because it genuinely differs
 * per site: an address guard's refusal is `'blocked-by-guard'`, a transport's is `'network'`,
 * and a content-type guard's is `'unsupported-content-type'`.
 *
 * **A stop is checked first and is never re-derived afterwards.** A stop resolves every
 * in-flight race the instant it fires, so reaching the failure branch means the work settled
 * *before* the call gave up — and relabelling that as a timeout because the deadline expired a
 * microsecond later would be the taxonomy lying about which came first.
 *
 * @param onAbandon - Released whenever the value will not be used — on a stop and on a refusal
 * alike. In practice this is the response body: leaving one unconsumed holds the connection
 * open for a call that has already failed.
 */
async function _raced<T>(
  watch: DeadlineWatch,
  work: () => Promise<Result<T>>,
  toFailure: (message: string) => Outcome<T>,
  onAbandon?: () => void
): Promise<Outcome<T>> {
  const race = await watch.race(_capture(work));
  if (race.stopped) {
    onAbandon?.();
    return _stopped<T>(watch, race.cause);
  }
  if (race.value.isFailure()) {
    onAbandon?.();
    return toFailure(race.value.message);
  }
  return _succeed(race.value.value);
}

function _stopMessage(cause: DeadlineStopCause): string {
  return cause === 'caller-aborted' ? 'request aborted by caller.' : `request timed out (${cause}).`;
}

function _stopped<T>(watch: DeadlineWatch, cause: DeadlineStopCause): Outcome<T> {
  return _fail<T>(watch.toFailureReason(cause), _stopMessage(cause));
}

/**
 * Rejects any scheme this primitive will never request.
 *
 * `file:`, `data:`, `blob:`, `ftp:`, `gopher:` and `ws:` are refused here, in the core, because
 * none is a legitimate network fetch and each is a standard SSRF payload. Choosing between
 * `http:` and `https:`, and deciding which ports are acceptable, is the address guard's job —
 * which is why the core does not narrow further, and why `allowInsecureHttp` can exist there.
 */
function _checkScheme(url: URL): Outcome<URL> {
  if (!SUPPORTED_SCHEMES.includes(url.protocol)) {
    const detail = `scheme "${url.protocol}" is not supported (expected ${SUPPORTED_SCHEMES.join(' or ')})`;
    return _fail<URL>({ kind: 'invalid-url', url: url.toString(), detail }, `invalid URL: ${detail}`);
  }
  return _succeed(url);
}

function _parseUrl(url: string | URL): Outcome<URL> {
  const text = String(url);
  const parsed = captureResult(() => new URL(text));
  if (parsed.isFailure()) {
    return _fail<URL>(
      { kind: 'invalid-url', url: text, detail: parsed.message },
      `invalid URL "${text}": ${parsed.message}`
    );
  }
  return _checkScheme(parsed.value);
}

function _lowercaseHeaders(headers: Readonly<Record<string, string>>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    result[name.toLowerCase()] = value;
  }
  return result;
}

function _readHeaders(response: Response): Record<string, string> {
  const headers: Record<string, string> = {};
  response.headers.forEach((value: string, name: string) => {
    headers[name.toLowerCase()] = value;
  });
  return headers;
}

/** Releases a response body that will not be read, so the socket is not held open. */
function _discardBody(response: Response): void {
  const body = response.body ?? undefined;
  if (body !== undefined) {
    // Best-effort and deliberately not awaited: the failure is already decided, and a cancel
    // that rejects (an already-errored stream) must not replace it.
    body.cancel().catch(() => undefined);
  }
}

async function _cancelReader(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
  // A cancel that rejects (an already-errored or already-released stream) must not mask the
  // failure that prompted it.
  await reader.cancel().catch(() => undefined);
}

function _resolveCallOptions(options: ISaferFetchOptions): Outcome<IResolvedCallOptions> {
  const method = options.method ?? 'GET';
  const body = options.body ?? undefined;
  if (body !== undefined && METHODS_WITHOUT_BODY.includes(method)) {
    return _unknown<IResolvedCallOptions>(`a ${method} request cannot carry a body.`);
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const headersTimeoutMs = options.headersTimeoutMs ?? DEFAULT_HEADERS_TIMEOUT_MS;
  const maxResponseBytes = options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES;
  const limits: ReadonlyArray<readonly [string, number]> = [
    ['timeoutMs', timeoutMs],
    ['headersTimeoutMs', headersTimeoutMs],
    ['maxResponseBytes', maxResponseBytes]
  ];
  for (const [name, value] of limits) {
    if (!Number.isFinite(value) || value <= 0) {
      return _unknown<IResolvedCallOptions>(`${name} must be a positive finite number; got ${value}.`);
    }
  }

  // `String(...)` and a lookup rather than a literal comparison, so that a JavaScript caller
  // supplying a policy this release does not implement is rejected instead of silently getting a
  // different one. The lookup also narrows to the union with no cast.
  const requestedPolicy = String(options.redirectPolicy ?? 'reject');
  const redirectPolicy = REDIRECT_POLICIES.find((p) => p === requestedPolicy);
  if (redirectPolicy === undefined) {
    return _unknown<IResolvedCallOptions>(
      `redirectPolicy "${requestedPolicy}" is not supported; expected ${REDIRECT_POLICIES.join(' or ')}.`
    );
  }

  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  if (!Number.isInteger(maxRedirects) || maxRedirects < 0) {
    return _unknown<IResolvedCallOptions>(
      `maxRedirects must be a non-negative integer; got ${maxRedirects}.`
    );
  }

  // Same reasoning as `redirectPolicy` above, and the stakes are higher: these name the headers
  // that get stripped on a cross-origin hop. A JavaScript caller can pass anything, and a
  // non-string entry would throw out of an API contracted to only ever return a `Result`.
  // Coercing instead of rejecting would be worse than either — `String(123)` is a header name
  // that silently never matches, so a caller who fumbled the type would believe a credential was
  // being stripped while it was carried across origins. A non-array is rejected for the same
  // reason: spreading a bare string would enumerate it into single characters.
  const extraSensitive = options.sensitiveHeaders;
  if (extraSensitive !== undefined) {
    if (!Array.isArray(extraSensitive)) {
      return _unknown<IResolvedCallOptions>(
        `sensitiveHeaders must be an array of header names; got ${typeof extraSensitive}.`
      );
    }
    // `findIndex`, not `find`: an array containing `undefined` is itself invalid, and `find`
    // cannot distinguish that from "no offender".
    const badIndex = extraSensitive.findIndex((n) => typeof n !== 'string');
    if (badIndex >= 0) {
      return _unknown<IResolvedCallOptions>(
        `sensitiveHeaders[${badIndex}] must be a string header name; got ${typeof extraSensitive[badIndex]}.`
      );
    }
  }

  const retry = resolveRetryPolicy(options.retry);
  if (retry.isFailure()) {
    return _unknown<IResolvedCallOptions>(retry.message);
  }

  return _succeed({
    method,
    headers: _lowercaseHeaders(options.headers ?? {}),
    body,
    timeoutMs,
    headersTimeoutMs,
    maxResponseBytes,
    redirectPolicy,
    maxRedirects,
    sensitiveHeaders: sensitiveHeaderSet(options.sensitiveHeaders),
    retry: retry.value,
    logger: options.logger ?? new Logging.NoOpLogger()
  });
}

/**
 * Reads the body, counting decoded bytes as they arrive and failing the moment the cap is
 * exceeded.
 *
 * `Content-Length` is a fast-reject path only. It is absent on chunked responses, and it is a
 * value a hostile server chooses freely — a `Content-Length: 12` on a ten-gigabyte body costs
 * the attacker nothing. The cap must therefore hold with no help from it, which is what
 * counting during the read buys.
 *
 * The count is of *decoded* bytes, because the platform transparently decompresses
 * `Content-Encoding`. That is also the decompression-bomb defense: a 2 KB gzip that expands to
 * 10 GB clears the fast reject and then trips the cap after `limit` decoded bytes. It is why
 * `too-large.declared` reads as "what the wire claimed", never as "how big it was".
 */
async function _readCappedBody(
  response: Response,
  head: ISaferFetchResponseHead,
  limit: number,
  watch: DeadlineWatch
): Promise<Outcome<Uint8Array>> {
  const declared = head.contentLength;
  if (declared !== undefined && declared > limit) {
    _discardBody(response);
    return _fail<Uint8Array>(
      { kind: 'too-large', bytesRead: 0, limit, declared },
      `response declares ${declared} bytes, over the ${limit}-byte cap.`
    );
  }

  const body = response.body ?? undefined;
  if (body === undefined) {
    return _succeed(new Uint8Array(0));
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total: number = 0;
  for (;;) {
    // The read must be captured, not raced raw. `reader.read()` rejects whenever the connection
    // drops mid-transfer — a server reset, a proxy killing an idle connection, a TLS teardown —
    // which is ordinary AC2 behaviour, not an exotic one. Racing the bare promise would let that
    // rejection escape as a throw out of an entry point documented to always return a Result,
    // which is precisely the guarantee this primitive sells.
    const race = await watch.race(_capture(() => reader.read().then(succeed)));
    if (race.stopped) {
      // Cancelling is what makes the deadline effective rather than decorative: without it the
      // transfer continues against a call that has already given up.
      await _cancelReader(reader);
      return _stopped<Uint8Array>(watch, race.cause);
    }
    if (race.value.isFailure()) {
      // No cancel: the stream has already errored, so there is nothing left to cancel. Reported
      // as `network` — the same kind a transport-level failure gets, because it is the same
      // class of event, observed a few frames later.
      return _fail<Uint8Array>(
        { kind: 'network', detail: race.value.message },
        `response body read failed: ${race.value.message}`
      );
    }
    if (race.value.value.done) {
      break;
    }
    const chunk = race.value.value.value;
    total += chunk.byteLength;
    if (total > limit) {
      // Returning without cancelling would leave the body unconsumed and the connection held,
      // turning the size-cap rejection into the exact resource exhaustion the cap exists to
      // prevent.
      await _cancelReader(reader);
      return _fail<Uint8Array>(
        { kind: 'too-large', bytesRead: total, limit, declared },
        `response exceeded the ${limit}-byte cap after ${total} bytes.`
      );
    }
    chunks.push(chunk);
  }

  const bytes = new Uint8Array(total);
  let offset: number = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return _succeed(bytes);
}
async function _receive(
  response: Response,
  url: URL,
  chain: ReadonlyArray<IRequestHop>,
  guards: IResolvedGuards,
  resolved: IResolvedCallOptions,
  watch: DeadlineWatch,
  notes: IAttemptNotes
): Promise<Outcome<AttemptOutcome>> {
  if (response.type === 'opaqueredirect') {
    _discardBody(response);
    return _fail<AttemptOutcome>(
      { kind: 'redirect-opaque' },
      'the platform returned an opaque redirect, whose target cannot be inspected or guarded.'
    );
  }

  if (REDIRECT_STATUSES.includes(response.status)) {
    // The body of a redirect is never the body this call wanted, and leaving it unconsumed holds
    // the connection open for the whole rest of the chain.
    _discardBody(response);
    if (resolved.redirectPolicy === 'reject') {
      return _fail<AttemptOutcome>(
        { kind: 'redirect-rejected', url: url.toString(), status: response.status },
        `${url.toString()} redirected with status ${response.status}; redirects are rejected.`
      );
    }
    const location = response.headers.get('location') ?? undefined;
    if (location === undefined || location.trim().length === 0) {
      return _fail<AttemptOutcome>(
        { kind: 'redirect-rejected', url: url.toString(), status: response.status },
        `${url.toString()} redirected with status ${response.status} but sent no usable Location header.`
      );
    }
    return _succeed<AttemptOutcome>({ kind: 'redirect', status: response.status, location });
  }

  const headers = _readHeaders(response);
  // Annotated because a `Record<string, string>` lookup is typed as present even when the
  // header was never sent; these are read as optional everywhere downstream.
  const contentType: string | undefined = headers['content-type'];
  const contentLength: string | undefined = headers['content-length'];
  const head: ISaferFetchResponseHead = {
    status: response.status,
    statusText: response.statusText,
    headers,
    contentType,
    contentLength: parseContentLength(contentLength)
  };

  if (!response.ok) {
    _discardBody(response);
    // Recorded before the failure is built rather than carried on it: `Retry-After` is
    // scheduling advice for this process, not a fact about the response worth widening the
    // taxonomy — and the taxonomy is a surface callers may echo, which advice from an
    // attacker-controlled server should not join.
    notes.retryAfter = headers['retry-after'];
    return _fail<AttemptOutcome>(
      // `bodyPreview` is deliberately never populated: error bodies routinely echo request
      // content, including credentials.
      { kind: 'http-status', status: response.status, statusText: response.statusText },
      `${url.toString()} returned ${response.status} ${response.statusText}.`
    );
  }

  const hop = chain.length - 1;
  const headGuarded = await _raced(
    watch,
    () => guards.responseHeaders.check(head, chain),
    (message) => {
      // A content-type allowlist names itself by exposing `acceptedContentTypes`, and its
      // rejections carry a more useful payload than an opaque policy refusal would.
      const accepted = guards.responseHeaders.acceptedContentTypes ?? undefined;
      return accepted !== undefined
        ? _fail<true>(
            { kind: 'unsupported-content-type', contentType: head.contentType, accepted },
            `${url.toString()}: ${message}`
          )
        : _blocked<true>('response-headers', url, hop, guards.responseHeaders.name, message);
    },
    () => _discardBody(response)
  );
  if (headGuarded.isFailure()) {
    return _propagate<true, AttemptOutcome>(headGuarded);
  }

  const body = await _readCappedBody(response, head, resolved.maxResponseBytes, watch);
  if (body.isFailure()) {
    return _propagate<Uint8Array, AttemptOutcome>(body);
  }

  return (
    await _raced(
      watch,
      () => guards.responseBody.check(body.value, head),
      (message) => _blocked<true>('response-body', url, hop, guards.responseBody.name, message)
    )
  ).onSuccess(() => _succeed<AttemptOutcome>({ kind: 'final', bytes: body.value, head }));
}

/**
 * Runs the address guard on the hop about to be requested and returns the URL it cleared.
 *
 * @remarks
 * Split out of {@link _connect} so that the guard's verdict is available to the caller *before*
 * anything is put on the wire. Redirect loop detection needs exactly that: it compares the hop
 * about to be requested against the hops already requested, and both sides have to be
 * guard-cleared URLs for the comparison to mean anything (see {@link _detectLoop}).
 *
 * It runs after the request guard, so a request guard that returned a replacement request
 * cannot route around it, and it runs on **every** hop rather than only the first: a `302` to
 * `http://169.254.169.254/` is exactly what a guard that only saw the caller's URL would miss.
 */
async function _clearAddress(
  chain: ReadonlyArray<IRequestHop>,
  guards: IResolvedGuards,
  watch: DeadlineWatch
): Promise<Outcome<IClearedHop>> {
  const hop = chain[chain.length - 1];
  const hopIndex = chain.length - 1;
  return (
    await _raced(
      watch,
      () => guards.address.check(chain),
      (message) => _blocked<IGuardVerdict>('address', hop.url, hopIndex, guards.address.name, message)
    )
  ).onSuccess((verdict) =>
    // A guard may normalize the URL it cleared; the normalized URL is what gets requested. The
    // scheme is re-checked because normalization must never be able to widen it.
    _checkScheme(verdict.url).onSuccess((url) =>
      _succeed<IClearedHop>({ url, pinnedAddress: verdict.pinnedAddress ?? undefined })
    )
  );
}

/**
 * Rejects a hop that revisits a URL already requested on this walk.
 *
 * @remarks
 * `A → B → A → B` passes every per-hop check while consuming the whole redirect budget, and the
 * hop cap alone would let it — the same reason the address guard is handed the chain rather
 * than a counter.
 *
 * **Both sides of the comparison are guard-cleared URLs**, which is why this runs after
 * {@link _clearAddress} rather than on the raw `Location` target. A guard may normalize the URL
 * it clears — `IGuardVerdict.url` explicitly permits lowercasing a host, stripping a trailing
 * dot, punycoding an IDN — so comparing a cleared URL against an uncleared one lets a repeat
 * escape detection and run to `maxRedirects` instead. Comparing like with like is the whole
 * fix; special-casing particular normalizations here would be worse than leaving it, because
 * this layer does not own normalization and cannot anticipate what a custom guard does.
 *
 * `url` on the failure is the URL that **issued** the redirect, never the repeated target — the
 * contract `FetchFailureReason.redirect-rejected` documents. The target is named in the message.
 */
function _detectLoop(cleared: URL, completed: ReadonlyArray<ICompletedHop>): Outcome<URL> {
  const issuer = completed[completed.length - 1] ?? undefined;
  // Hop 0 cannot repeat anything, so an empty chain is trivially clear — and there would be no
  // issuing hop to name if it could.
  if (issuer === undefined || !completed.some((hop) => hop.url.toString() === cleared.toString())) {
    return _succeed(cleared);
  }
  return _fail<URL>(
    { kind: 'redirect-rejected', url: issuer.url.toString(), status: issuer.status },
    `${issuer.url.toString()} redirected with status ${
      issuer.status
    } to ${cleared.toString()}, which is already in the chain.`
  );
}

async function _connect(
  request: ISaferFetchRequest,
  cleared: IClearedHop,
  chain: ReadonlyArray<IRequestHop>,
  guards: IResolvedGuards,
  options: ISaferFetchOptions,
  resolved: IResolvedCallOptions,
  watch: DeadlineWatch,
  notes: IAttemptNotes
): Promise<Outcome<IAttempt>> {
  const transport = options.transport ?? platformFetchTransport;

  const init: RequestInit = {
    method: request.method,
    headers: request.headers,
    // `'manual'` rather than `'follow'`: the platform must not follow anything on our behalf,
    // because a hop the guard never sees is a hop the guard never guarded.
    redirect: 'manual',
    signal: watch.signal
  };
  if (request.body !== undefined) {
    // A byte body is copied into a fresh buffer rather than handed over by reference: it keeps
    // the platform's non-shared `BufferSource` requirement satisfied without a cast, and it
    // means a caller mutating its array after the call cannot change what goes on the wire.
    init.body = typeof request.body === 'string' ? request.body : new Uint8Array(request.body);
  }

  const sent = await _raced(
    watch,
    () => transport.fetch(cleared.url, init, { pinnedAddress: cleared.pinnedAddress }),
    (message) =>
      _fail<Response>(
        { kind: 'network', detail: message },
        `transport "${transport.name}" failed: ${message}`
      )
  );
  if (sent.isFailure()) {
    return _propagate<Response, IAttempt>(sent);
  }
  watch.headersReceived();

  return (await _receive(sent.value, cleared.url, chain, guards, resolved, watch, notes)).onSuccess(
    (outcome) =>
      // The pin is recorded only once the transport has accepted it. A transport that cannot
      // honor a pin is required to fail rather than connect by hostname, so a settled request
      // with a pin set is evidence the pin held — which is the only basis on which recording it
      // would be honest.
      _succeed({ url: cleared.url, connectedAddress: cleared.pinnedAddress, outcome })
  );
}

/**
 * Derives the next hop's request from a redirect, or explains why the chain stops here.
 *
 * @remarks
 * The hop cap is checked before the target is resolved: a chain that has already run out of
 * budget stops for that reason, whatever the `Location` header happens to contain.
 *
 * Loop detection is deliberately **not** here — it belongs after the address guard has cleared
 * the next hop, where both sides of the comparison are cleared URLs. See {@link _detectLoop}.
 */
function _nextHop(
  from: URL,
  completed: ReadonlyArray<ICompletedHop>,
  redirect: { readonly status: number; readonly location: string },
  request: ISaferFetchRequest,
  resolved: IResolvedCallOptions
): Outcome<ISaferFetchRequest> {
  const followed = completed.length;
  if (followed >= resolved.maxRedirects) {
    return _fail<ISaferFetchRequest>(
      { kind: 'too-many-redirects', hops: followed + 1, limit: resolved.maxRedirects },
      `redirect chain exceeded the limit of ${resolved.maxRedirects} hops.`
    );
  }

  // The plain-`Result`-to-`DetailedResult` conversion is done here rather than chained, for the
  // same reason `_parseUrl` and `_decodeText` do it: it is the boundary where a `Result` becomes
  // an `Outcome`, and naming the boundary is what lets everything downstream of it chain.
  const located = resolveLocation(redirect.location, from);
  if (located.isFailure()) {
    return _fail<ISaferFetchRequest>(
      { kind: 'invalid-url', url: redirect.location, detail: located.message },
      `invalid redirect target: ${located.message}`
    );
  }

  return _checkScheme(located.value).onSuccess((to) => {
    // Headers come from the request that was actually sent on this hop, never from the
    // caller's original set — that carry-forward is what makes credential stripping monotonic.
    const rewritten = rewriteForRedirect({
      from,
      to,
      status: redirect.status,
      method: request.method,
      headers: request.headers,
      body: request.body,
      sensitiveHeaders: resolved.sensitiveHeaders
    });
    return _succeed<ISaferFetchRequest>({
      url: to,
      method: rewritten.method,
      headers: rewritten.headers,
      ...(rewritten.body !== undefined ? { body: rewritten.body } : {})
    });
  });
}

/**
 * Walks one attempt: the caller's URL, then every redirect hop it leads to, each fully guarded.
 *
 * @remarks
 * **A retry calls this again from the top, with a request rebuilt from the caller's resolved
 * options.** Nothing is carried across attempts — not the guard's verdict, not the redirect
 * chain, not the headers a previous attempt's cross-origin hop had already stripped. That is
 * what makes a retry a full re-walk rather than a resume, and the reason is in
 * {@link SaferFetch.IRetryPolicy}: a cached verdict would turn retry into a DNS-rebinding
 * amplifier, and a resumed chain would revalidate hops the new attempt no longer follows.
 */
async function _walk(
  url: URL,
  guards: IResolvedGuards,
  options: ISaferFetchOptions,
  resolved: IResolvedCallOptions,
  watch: DeadlineWatch,
  notes: IAttemptNotes
): Promise<Outcome<IRawOutcome>> {
  let request: ISaferFetchRequest = {
    url,
    method: resolved.method,
    headers: resolved.headers,
    ...(resolved.body !== undefined ? { body: resolved.body } : {})
  };
  /** Hops already requested and redirected away from, oldest first. */
  const completed: ICompletedHop[] = [];

  for (;;) {
    // Re-arms the per-attempt headers deadline. Without this, the first hop's
    // `headersReceived()` would retire it for the whole call and a later host that never
    // answers would be bounded only by the overall deadline.
    watch.attemptStarted();

    const guarded = await _raced(
      watch,
      () => guards.request.check(request, [...completed, { url: request.url }]),
      (message) =>
        _blocked<ISaferFetchRequest>('request', request.url, completed.length, guards.request.name, message)
    );
    if (guarded.isFailure()) {
      return _propagate<ISaferFetchRequest, IRawOutcome>(guarded);
    }

    const checked = guarded.value;
    const rechecked = _checkScheme(checked.url);
    if (rechecked.isFailure()) {
      return _propagate<URL, IRawOutcome>(rechecked);
    }

    // The address guard runs immediately before the connect and after the request guard, so it
    // is always the last word before anything reaches the wire.
    const cleared = await _clearAddress([...completed, { url: checked.url }], guards, watch);
    if (cleared.isFailure()) {
      return _propagate<IClearedHop, IRawOutcome>(cleared);
    }

    const unrepeated = _detectLoop(cleared.value.url, completed);
    if (unrepeated.isFailure()) {
      resolved.logger.detail(`saferFetch: ${cleared.value.url.toString()} failed: ${unrepeated.message}`);
      return _propagate<URL, IRawOutcome>(unrepeated);
    }

    // Downstream guards see the chain as it was actually requested, so the URL a response guard
    // reads is the URL the address guard cleared — not the pre-normalization spelling.
    const requested: ReadonlyArray<IRequestHop> = [...completed, { url: cleared.value.url }];
    const attempted = await _connect(
      checked,
      cleared.value,
      requested,
      guards,
      options,
      resolved,
      watch,
      notes
    );
    if (attempted.isFailure()) {
      resolved.logger.detail(`saferFetch: ${cleared.value.url.toString()} failed: ${attempted.message}`);
      return _propagate<IAttempt, IRawOutcome>(attempted);
    }
    const attempt = attempted.value;

    if (attempt.outcome.kind === 'final') {
      return _succeed({
        bytes: attempt.outcome.bytes,
        head: attempt.outcome.head,
        urlChain: [...completed.map((hop) => hop.url.toString()), attempt.url.toString()]
      });
    }

    const next = _nextHop(attempt.url, completed, attempt.outcome, checked, resolved);
    if (next.isFailure()) {
      resolved.logger.detail(`saferFetch: ${attempt.url.toString()} failed: ${next.message}`);
      return _propagate<ISaferFetchRequest, IRawOutcome>(next);
    }

    completed.push({
      url: attempt.url,
      status: attempt.outcome.status,
      ...(attempt.connectedAddress !== undefined ? { connectedAddress: attempt.connectedAddress } : {})
    });
    request = next.value;
  }
}

/**
 * Decides how long to wait before retrying a failed walk, or that it must not be retried.
 *
 * @remarks
 * Every rule that can refuse a retry is applied here, in one place, so "would this have been
 * retried?" is answerable by reading one function: the attempt budget, the retryable-failure
 * set, the idempotency rule, the `Retry-After` clamp, and the overall deadline as ceiling.
 *
 * **The deadline is the last word.** When the remaining budget is shorter than the computed
 * delay, the call fails with the attempt's own failure rather than sleeping past the deadline
 * the caller set — a `timeout` reported at `timeoutMs` is what the caller asked for, and one
 * reported at `timeoutMs + backoff` is a primitive that does not keep its own promises.
 */
function _retryDelayMs(
  reason: FetchFailureReason | undefined,
  attempt: number,
  resolved: IResolvedCallOptions,
  notes: IAttemptNotes,
  watch: DeadlineWatch
): number | undefined {
  const policy = resolved.retry;
  if (attempt >= policy.attempts) {
    return undefined;
  }
  if (!isRetryableFailure(reason) || !isRetryableMethod(resolved.method, policy)) {
    return undefined;
  }
  const retryAfterMs = honorsRetryAfter(reason, policy)
    ? parseRetryAfterMs(notes.retryAfter, Date.now())
    : undefined;
  const delay = computeRetryDelayMs({
    attempt,
    policy,
    ...(retryAfterMs !== undefined ? { retryAfterMs } : {}),
    random: Math.random
  });
  return delay <= watch.remainingMs ? delay : undefined;
}

/**
 * Runs one attempt and, if the policy says so, the next one after it.
 *
 * @remarks
 * Recursive rather than a loop, because **a retry is a fresh start rather than another turn of
 * something already in progress**: every attempt is a full {@link _walk} from hop 0, and nothing
 * survives the boundary — not the guard's verdict, not the redirect chain, not the headers a
 * cross-origin hop stripped, not the previous response's `Retry-After`. Expressing that as a
 * self-call keeps the "nothing carries over" property visible in the shape of the code rather
 * than resting on a reader noticing which variables are declared inside the loop body.
 *
 * Depth is bounded by `retry.attempts` and each level is `await`ed, so the frames unwind rather
 * than nest.
 *
 * @param attempt - 0-based index of the attempt about to run; `0` is the caller's first request.
 */
async function _runAttempt(
  url: URL,
  guards: IResolvedGuards,
  options: ISaferFetchOptions,
  resolved: IResolvedCallOptions,
  watch: DeadlineWatch,
  attempt: number
): Promise<Outcome<IRawOutcome>> {
  // Fresh per attempt: notes describe the attempt that just failed, and carrying a previous
  // attempt's `Retry-After` into a later decision would schedule against a response that is no
  // longer the reason we are retrying.
  const notes: IAttemptNotes = {};
  const walked = await _walk(url, guards, options, resolved, watch, notes);
  // `!isFailure()` rather than `isSuccess()`: only the former narrows to the failure branch
  // below, where `detail` is known to be present.
  if (!walked.isFailure()) {
    return walked;
  }

  const delay = _retryDelayMs(walked.detail, attempt, resolved, notes, watch);
  if (delay === undefined) {
    return walked;
  }
  // Clears an attempt-scoped stop — a headers timeout ends the attempt, not the call — so the
  // backoff below is not answered instantly by the previous attempt's own deadline. A terminal
  // stop deliberately survives, and ends the call at the first race below.
  watch.attemptEnded();
  resolved.logger.detail(
    `saferFetch: ${url.toString()} failed (${walked.message}); retrying in ` +
      `${Math.round(delay)}ms — attempt ${attempt + 2} of ${resolved.retry.attempts + 1}.`
  );

  // Delayed on the same watch the request races against, so a caller who aborts during a backoff
  // is answered then rather than after the sleep.
  const slept = await watch.delay(delay);
  return slept.stopped
    ? _stopped<IRawOutcome>(watch, slept.cause)
    : _runAttempt(url, guards, options, resolved, watch, attempt + 1);
}

async function _execute(url: string | URL, options: ISaferFetchOptions): Promise<Outcome<IRawOutcome>> {
  const resolvedOptions = _resolveCallOptions(options);
  if (resolvedOptions.isFailure()) {
    return _propagate<IResolvedCallOptions, IRawOutcome>(resolvedOptions);
  }
  const resolved = resolvedOptions.value;

  const resolvedGuards = resolveGuards(options);
  if (resolvedGuards.isFailure()) {
    return _unknown<IRawOutcome>(resolvedGuards.message);
  }
  const guards = resolvedGuards.value;

  const parsed = _parseUrl(url);
  if (parsed.isFailure()) {
    return _propagate<URL, IRawOutcome>(parsed);
  }

  const watch = new DeadlineWatch(resolved.timeoutMs, resolved.headersTimeoutMs, options.signal);
  // `captureAsyncResult` rather than `try`/`finally`, for the same reason `_capture` wraps every
  // guard and transport call: an entry point documented to always return a `Result` has to keep
  // that promise even when a collaborator breaks its own. Nothing inside is *supposed* to throw
  // — guards, transports and the body read are each captured already — but the caller's
  // `logger` is collaborator code this primitive does not wrap, and a thrown diagnostic must not
  // become the caller's problem. The watch is disposed on both paths because the capture has
  // already converted the throw into a value.
  const ran = await captureAsyncResult(async () =>
    _runAttempt(parsed.value, guards, options, resolved, watch, 0)
  );
  watch.dispose();
  return ran.isFailure()
    ? // `'unknown'` is the taxonomy's honest slot for "something violated its contract", rather
      // than a guess at a more specific kind.
      _unknown<IRawOutcome>(`saferFetch: unexpected error: ${ran.message}`)
    : ran.value;
}

function _toResponse<T>(value: T, raw: IRawOutcome): ISaferFetchResponse<T> {
  return {
    value,
    status: raw.head.status,
    headers: raw.head.headers,
    urlChain: raw.urlChain,
    bytesRead: raw.bytes.byteLength
  };
}

/**
 * Applies the caller's parser to the decoded body.
 *
 * @remarks
 * Exists for the same reason as {@link _decodeText}: it is the boundary where a plain
 * `Result` from a `Converter` becomes a `DetailedResult` carrying a `FetchFailureReason`.
 * Isolating that conversion in a named helper is what lets the entry points stay chained.
 */
function _parseJson<T>(text: string, parser: Converter<T | JsonValue>): Outcome<T | JsonValue> {
  const parsed = parser.convert(text);
  if (parsed.isFailure()) {
    return _fail<T | JsonValue>(
      { kind: 'parse', detail: parsed.message },
      `failed to parse response as JSON: ${parsed.message}`
    );
  }
  return _succeed(parsed.value);
}

function _decodeText(raw: IRawOutcome): Outcome<string> {
  const charset = parseCharset(raw.head.contentType) ?? 'utf-8';
  // `fatal: true` so an unknown charset, or a byte sequence invalid in the declared one,
  // surfaces as a decode failure rather than as silent mojibake some caller treats as data.
  const decoded = captureResult(() => new TextDecoder(charset, { fatal: true }).decode(raw.bytes));
  if (decoded.isFailure()) {
    return _fail<string>(
      { kind: 'decode', detail: decoded.message },
      `failed to decode response as "${charset}": ${decoded.message}`
    );
  }
  return _succeed(decoded.value);
}

/**
 * Fetches a URL and returns the raw response bytes, subject to the scheme check, the address
 * guard, the request and response guards, the deadlines, and the response size cap.
 *
 * @remarks
 * **What this does not protect against.** It is not a sandbox: a caller who wants to reach
 * `127.0.0.1` can call `globalThis.fetch` directly, so this guards untrusted *data*, never
 * untrusted *code in the same process*. It does no certificate pinning and adds nothing
 * against a network-position attacker — TLS is that control. It does not resist DNS rebinding:
 * an address guard validates a resolved address and the transport then re-resolves, so a
 * hostile resolver can answer the two lookups differently. And it inspects nothing in the
 * response body. If your deployment has an egress proxy or firewall, that control is strictly
 * stronger than this one; this is defense in depth for deployments that do not.
 *
 * **The failure detail is an internal-network scanning oracle.** Log it; do not echo it, or
 * any string derived from it, to an untrusted caller. The detail is structured precisely so
 * that mapping it to a coarse public code is trivial.
 *
 * **Redirects are rejected unless you ask for them.** `redirectPolicy: 'validate-each-hop'`
 * follows them, runs the address guard on every hop before any connection, and drops credential
 * headers the first time the chain leaves an origin — and never restores them, so an
 * `A` → `B` → `A` chain does not hand the token back to `A`.
 *
 * @param url - The URL to fetch. Only `http:` and `https:` are ever requested; every other
 * scheme fails as `'invalid-url'`.
 * @param options - Call options. `addressGuard` is required and has no default — use
 * `blockPrivateNetworks()` on Node, or `allowAnyAddress()` to name the absence of the
 * guarantee at the call site. `maxResponseBytes` defaults to 5 MiB and is meant to be tuned
 * per call: real documents clear that, and raising it for the calls that need it is the
 * intended use, not a workaround.
 * @public
 */
export async function saferFetchBytes(
  url: string | URL,
  options: ISaferFetchOptions
): Promise<DetailedResult<ISaferFetchResponse<Uint8Array>, FetchFailureReason>> {
  return (await _execute(url, options)).onSuccess((raw) => _succeed(_toResponse(raw.bytes, raw)));
}

/**
 * Fetches a URL and decodes the response body as text.
 *
 * @remarks
 * The charset comes from the `Content-Type` parameter and defaults to UTF-8. Decoding is
 * strict: an unknown charset, or a byte sequence that is not valid in the declared one, fails
 * as `'decode'` rather than silently producing mojibake that some caller downstream treats as
 * data.
 *
 * See {@link SaferFetch.saferFetchBytes} for what this primitive does **not** protect against,
 * and for the warning about echoing failure detail to untrusted callers.
 *
 * @param url - The URL to fetch.
 * @param options - Call options. `addressGuard` is required. `maxResponseBytes` defaults to
 * 5 MiB and is meant to be tuned per call.
 * @public
 */
export async function saferFetchText(
  url: string | URL,
  options: ISaferFetchOptions
): Promise<DetailedResult<ISaferFetchResponse<string>, FetchFailureReason>> {
  // Nested rather than flat: `_toResponse` needs both the decoded text and the raw outcome it
  // came from, and nesting is what keeps `raw` in scope for it.
  return (await _execute(url, options)).onSuccess((raw) =>
    _decodeText(raw).onSuccess((text) => _succeed(_toResponse(text, raw)))
  );
}

/**
 * Options for the validating form of {@link SaferFetch.saferFetchJson}.
 *
 * @remarks
 * `converter` is **required** here, and `T` is inferred from it. There is deliberately no way
 * to assert a `T` without supplying the converter that evidences it at runtime: a caller-named
 * type with nothing checking it is a claim the primitive cannot keep. Omit the whole options
 * type and the value comes back as `JsonValue`, which is what the wire actually guarantees.
 * @public
 */
export interface ISaferFetchJsonOptions<T> extends ISaferFetchOptions {
  /** Applied to the parsed JSON, taking the caller from wire to validated `T` in one step. */
  readonly converter: Converter<T> | Validator<T>;
}

/**
 * Fetches a URL and parses the response body as JSON, yielding the raw `JsonValue` for the
 * caller to validate.
 *
 * @remarks
 * **This does not gate on `Content-Type` by itself.** A server returning an HTML error page
 * with a `200` will be decoded and parsed, and fail as `'parse'` — twenty frames from where it
 * actually went wrong. Pass `responseHeadersGuard: allowContentTypes(['application/json'])`
 * to reject on the header instead: it costs a header comparison rather than a body transfer,
 * and the failure names the type. Content-type gating is a guard rather than an option so that
 * there is exactly one mechanism for it.
 *
 * See {@link SaferFetch.saferFetchBytes} for what this primitive does **not** protect against,
 * and for the warning about echoing failure detail to untrusted callers.
 *
 * @param url - The URL to fetch.
 * @param options - Call options. `addressGuard` is required. `maxResponseBytes` defaults to
 * 5 MiB and is meant to be tuned per call.
 * @public
 */
export async function saferFetchJson(
  url: string | URL,
  options: ISaferFetchOptions
): Promise<DetailedResult<ISaferFetchResponse<JsonValue>, FetchFailureReason>>;
/**
 * Fetches a URL, parses the response body as JSON, and runs it through the supplied converter
 * or validator so the caller reaches a validated `T` in one step.
 *
 * @remarks
 * `T` is inferred from `converter` and is never caller-asserted, so the returned type is
 * evidenced at runtime rather than claimed.
 *
 * See {@link SaferFetch.saferFetchBytes} for what this primitive does **not** protect against,
 * and for the warning about echoing failure detail to untrusted callers.
 *
 * @param url - The URL to fetch.
 * @param options - Call options plus the required `converter`. `addressGuard` is required.
 * `maxResponseBytes` defaults to 5 MiB and is meant to be tuned per call.
 * @public
 */
export async function saferFetchJson<T>(
  url: string | URL,
  options: ISaferFetchJsonOptions<T>
): Promise<DetailedResult<ISaferFetchResponse<T>, FetchFailureReason>>;
export async function saferFetchJson<T>(
  url: string | URL,
  options: ISaferFetchOptions | ISaferFetchJsonOptions<T>
): Promise<DetailedResult<ISaferFetchResponse<T | JsonValue>, FetchFailureReason>> {
  const converter = (options as Partial<ISaferFetchJsonOptions<T>>).converter ?? undefined;
  const parser: Converter<T | JsonValue> =
    converter !== undefined
      ? JsonBaseConverters.stringifiedJson<T>(converter)
      : JsonBaseConverters.stringifiedJson();

  // Nested for the same reason as `saferFetchText`: the response needs the raw outcome as well
  // as the parsed value, and nesting is what keeps `raw` in scope.
  return (await _execute(url, options)).onSuccess((raw) =>
    _decodeText(raw).onSuccess((text) =>
      _parseJson(text, parser).onSuccess((parsed) => _succeed(_toResponse(parsed, raw)))
    )
  );
}
