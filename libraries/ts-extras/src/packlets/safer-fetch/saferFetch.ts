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
import type {
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
  readonly logger: Logging.ILogger;
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
  watch: DeadlineWatch
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
  // header was never sent; these two are read as optional everywhere downstream.
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
    return _fail<AttemptOutcome>(
      // `bodyPreview` is deliberately never populated: error bodies routinely echo request
      // content, including credentials.
      { kind: 'http-status', status: response.status, statusText: response.statusText },
      `${url.toString()} returned ${response.status} ${response.statusText}.`
    );
  }

  const hop = chain.length - 1;
  const headGuarded = await watch.race(_capture(() => guards.responseHeaders.check(head, chain)));
  if (headGuarded.stopped) {
    _discardBody(response);
    return _stopped<AttemptOutcome>(watch, headGuarded.cause);
  }
  if (headGuarded.value.isFailure()) {
    _discardBody(response);
    const accepted = guards.responseHeaders.acceptedContentTypes ?? undefined;
    if (accepted !== undefined) {
      return _fail<AttemptOutcome>(
        { kind: 'unsupported-content-type', contentType: head.contentType, accepted },
        `${url.toString()}: ${headGuarded.value.message}`
      );
    }
    return _blocked<AttemptOutcome>(
      'response-headers',
      url,
      hop,
      guards.responseHeaders.name,
      headGuarded.value.message
    );
  }

  const body = await _readCappedBody(response, head, resolved.maxResponseBytes, watch);
  if (body.isFailure()) {
    return _propagate<Uint8Array, AttemptOutcome>(body);
  }

  const bodyGuarded = await watch.race(_capture(() => guards.responseBody.check(body.value, head)));
  if (bodyGuarded.stopped) {
    return _stopped<AttemptOutcome>(watch, bodyGuarded.cause);
  }
  if (bodyGuarded.value.isFailure()) {
    return _blocked<AttemptOutcome>(
      'response-body',
      url,
      hop,
      guards.responseBody.name,
      bodyGuarded.value.message
    );
  }

  return _succeed<AttemptOutcome>({ kind: 'final', bytes: body.value, head });
}

async function _connect(
  request: ISaferFetchRequest,
  chain: ReadonlyArray<IRequestHop>,
  guards: IResolvedGuards,
  options: ISaferFetchOptions,
  resolved: IResolvedCallOptions,
  watch: DeadlineWatch
): Promise<Outcome<IAttempt>> {
  const transport = options.transport ?? platformFetchTransport;

  // The address guard runs immediately before the connect, and after the request guard, so a
  // request guard that returned a replacement request cannot route around it. It runs on every
  // hop, not only the first: a `302` to `http://169.254.169.254/` is exactly what a guard that
  // only saw the caller's URL would miss.
  const verdict = await watch.race(_capture(() => guards.address.check(chain)));
  if (verdict.stopped) {
    return _stopped<IAttempt>(watch, verdict.cause);
  }
  if (verdict.value.isFailure()) {
    return _blocked<IAttempt>(
      'address',
      request.url,
      chain.length - 1,
      guards.address.name,
      verdict.value.message
    );
  }

  // A guard may normalize the URL it cleared; the normalized URL is what gets requested. The
  // scheme is re-checked because normalization must never be able to widen it.
  const cleared = _checkScheme(verdict.value.value.url);
  if (cleared.isFailure()) {
    return _propagate<URL, IAttempt>(cleared);
  }
  const url = cleared.value;
  const pinnedAddress = verdict.value.value.pinnedAddress ?? undefined;

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

  const sent = await watch.race(_capture(() => transport.fetch(url, init, { pinnedAddress })));
  if (sent.stopped) {
    return _stopped<IAttempt>(watch, sent.cause);
  }
  if (sent.value.isFailure()) {
    // No `watch.cause` re-check here: a stop resolves every in-flight race the instant it
    // fires, so reaching this line means the transport settled *before* we gave up. Reporting
    // it as a network failure is the honest answer — relabelling it as a timeout because the
    // deadline expired a microsecond later would be the taxonomy lying about which came first.
    return _fail<IAttempt>(
      { kind: 'network', detail: sent.value.message },
      `transport "${transport.name}" failed: ${sent.value.message}`
    );
  }
  watch.headersReceived();

  // Downstream guards see the chain as it was actually requested, so the URL a response guard
  // reads is the URL the address guard cleared — not the pre-normalization spelling.
  const requested: ReadonlyArray<IRequestHop> = [...chain.slice(0, -1), { ...chain[chain.length - 1], url }];
  return (await _receive(sent.value.value, url, requested, guards, resolved, watch)).onSuccess((outcome) =>
    // The pin is recorded only once the transport has accepted it. A transport that cannot honor
    // a pin is required to fail rather than connect by hostname, so a settled request with a pin
    // set is evidence the pin held — which is the only basis on which recording it would be
    // honest.
    _succeed({ url, connectedAddress: pinnedAddress, outcome })
  );
}

/**
 * Derives the next hop's request from a redirect, or explains why the chain stops here.
 *
 * @remarks
 * The hop cap is checked before the target is resolved: a chain that has already run out of
 * budget stops for that reason, whatever the `Location` header happens to contain.
 *
 * Loop detection compares against every URL already requested, not just the previous one.
 * `A→B→A→B` passes every per-hop check while consuming the whole budget, and a cap alone would
 * let it — which is the same reason the address guard is handed the chain rather than a counter.
 */
function _nextHop(
  from: URL,
  completed: ReadonlyArray<IRequestHop>,
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

  const located = resolveLocation(redirect.location, from);
  if (located.isFailure()) {
    return _fail<ISaferFetchRequest>(
      { kind: 'invalid-url', url: redirect.location, detail: located.message },
      `invalid redirect target: ${located.message}`
    );
  }
  const cleared = _checkScheme(located.value);
  if (cleared.isFailure()) {
    return _propagate<URL, ISaferFetchRequest>(cleared);
  }
  const to = cleared.value;

  const visited: ReadonlyArray<string> = [...completed.map((h) => h.url.toString()), from.toString()];
  if (visited.includes(to.toString())) {
    return _fail<ISaferFetchRequest>(
      { kind: 'redirect-rejected', url: from.toString(), status: redirect.status },
      `${from.toString()} redirected with status ${
        redirect.status
      } to ${to.toString()}, which is already in the chain.`
    );
  }

  // Headers come from the request that was actually sent on this hop, never from the caller's
  // original set — that carry-forward is what makes credential stripping monotonic.
  const rewritten = rewriteForRedirect({
    from,
    to,
    status: redirect.status,
    method: request.method,
    headers: request.headers,
    body: request.body,
    sensitiveHeaders: resolved.sensitiveHeaders
  });
  return _succeed({
    url: to,
    method: rewritten.method,
    headers: rewritten.headers,
    ...(rewritten.body !== undefined ? { body: rewritten.body } : {})
  });
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
  try {
    let request: ISaferFetchRequest = {
      url: parsed.value,
      method: resolved.method,
      headers: resolved.headers,
      ...(resolved.body !== undefined ? { body: resolved.body } : {})
    };
    /** Hops already requested and redirected away from, oldest first. */
    const completed: IRequestHop[] = [];

    for (;;) {
      // Re-arms the per-attempt headers deadline. Without this, the first hop's
      // `headersReceived()` would retire it for the whole call and a later host that never
      // answers would be bounded only by the overall deadline.
      watch.attemptStarted();

      const guarded = await watch.race(
        _capture(() => guards.request.check(request, [...completed, { url: request.url }]))
      );
      if (guarded.stopped) {
        return _stopped<IRawOutcome>(watch, guarded.cause);
      }
      if (guarded.value.isFailure()) {
        return _blocked<IRawOutcome>(
          'request',
          request.url,
          completed.length,
          guards.request.name,
          guarded.value.message
        );
      }

      const checked = guarded.value.value;
      const rechecked = _checkScheme(checked.url);
      if (rechecked.isFailure()) {
        return _propagate<URL, IRawOutcome>(rechecked);
      }

      const attempted = await _connect(
        checked,
        [...completed, { url: checked.url }],
        guards,
        options,
        resolved,
        watch
      );
      if (attempted.isFailure()) {
        resolved.logger.detail(`saferFetch: ${checked.url.toString()} failed: ${attempted.message}`);
        return _propagate<IAttempt, IRawOutcome>(attempted);
      }
      const attempt = attempted.value;

      if (attempt.outcome.kind === 'final') {
        return _succeed({
          bytes: attempt.outcome.bytes,
          head: attempt.outcome.head,
          urlChain: [...completed.map((h) => h.url.toString()), attempt.url.toString()]
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
  } finally {
    watch.dispose();
  }
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
  const raw = await _execute(url, options);
  if (raw.isFailure()) {
    return _propagate<IRawOutcome, ISaferFetchResponse<Uint8Array>>(raw);
  }
  return _succeed(_toResponse(raw.value.bytes, raw.value));
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
  const raw = await _execute(url, options);
  if (raw.isFailure()) {
    return _propagate<IRawOutcome, ISaferFetchResponse<string>>(raw);
  }
  const text = _decodeText(raw.value);
  if (text.isFailure()) {
    return _propagate<string, ISaferFetchResponse<string>>(text);
  }
  return _succeed(_toResponse(text.value, raw.value));
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
  const raw = await _execute(url, options);
  if (raw.isFailure()) {
    return _propagate<IRawOutcome, ISaferFetchResponse<T | JsonValue>>(raw);
  }
  const text = _decodeText(raw.value);
  if (text.isFailure()) {
    return _propagate<string, ISaferFetchResponse<T | JsonValue>>(text);
  }

  const converter = (options as Partial<ISaferFetchJsonOptions<T>>).converter ?? undefined;
  const parser: Converter<T | JsonValue> =
    converter !== undefined
      ? JsonBaseConverters.stringifiedJson<T>(converter)
      : JsonBaseConverters.stringifiedJson();
  const parsed = parser.convert(text.value);
  if (parsed.isFailure()) {
    return _fail<ISaferFetchResponse<T | JsonValue>>(
      { kind: 'parse', detail: parsed.message },
      `failed to parse response as JSON: ${parsed.message}`
    );
  }
  return _succeed(_toResponse(parsed.value, raw.value));
}
