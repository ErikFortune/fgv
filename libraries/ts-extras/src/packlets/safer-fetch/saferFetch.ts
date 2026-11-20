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
  MAX_TIMER_DELAY_MS,
  REDIRECT_STATUSES,
  SUPPORTED_SCHEMES
} from './defaults';
import type { FetchFailureReason } from './failureReason';
import { GuardedFetchError } from './guardedFetchError';
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
  GuardedFetch,
  IGuardedFetchOptions,
  IGuardVerdict,
  IRequestHop,
  IResolvedGuards,
  ISaferFetchOptions,
  ISaferFetchRequest,
  ISaferFetchResponse,
  ISaferFetchResponseHead,
  IFetchTransport,
  SaferFetchMethod,
  SaferFetchRedirectPolicy
} from './model';
import { SAFER_FETCH_METHODS } from './model';
import { resolveLocation, rewriteForRedirect, sensitiveHeaderSet } from './redirect';
import { platformFetchTransport } from './transport';

/** Every entry point's carrier: a value, or a machine-readable reason it failed. */
type Outcome<T> = DetailedResult<T, FetchFailureReason>;

/**
 * What a completed hop walk produced: the finisher's value for the final hop, and every URL that
 * was actually requested on the way to it.
 */
interface IWalked<T> {
  readonly value: T;
  readonly urlChain: ReadonlyArray<string>;
}

/** The buffered entry points' final-hop value: the body as bytes, and the head it came with. */
interface IBufferedBody {
  readonly bytes: Uint8Array;
  readonly head: ISaferFetchResponseHead;
}

/**
 * The raw outcome of a buffered call, before the body bytes are interpreted as bytes, text, or
 * JSON.
 * @internal
 */
type IRawOutcome = IWalked<IBufferedBody>;

/** The redirect settings every walk needs, resolved and validated. */
interface IResolvedRedirectOptions {
  readonly redirectPolicy: SaferFetchRedirectPolicy;
  readonly maxRedirects: number;
  /** Lowercased; the always-stripped three unioned with the caller's additions. */
  readonly sensitiveHeaders: ReadonlySet<string>;
}

/**
 * Everything the hop walk itself reads, resolved and validated. Shared by every entry point, so
 * the walk cannot tell which one called it.
 */
interface IResolvedWalkOptions extends IResolvedRedirectOptions {
  readonly method: SaferFetchMethod;
  readonly headers: Record<string, string>;
  readonly body: string | Uint8Array | undefined;
  readonly transport: IFetchTransport;
  readonly logger: Logging.ILogger;
}

/** Resolved, validated per-call settings of a buffered call. Every field concrete from here down. */
interface IResolvedCallOptions extends IResolvedWalkOptions {
  readonly timeoutMs: number;
  readonly headersTimeoutMs: number;
  readonly maxResponseBytes: number;
  /** Never absent once resolved: an omitted `retry` option resolves to zero attempts. */
  readonly retry: IResolvedRetryPolicy;
}

/**
 * Turns the final hop's response — one that is neither a redirect nor opaque — into the value its
 * entry point returns. The buffered entry points read and cap the body here; the hop walk itself
 * never touches a final response's body.
 *
 * @param response - The final hop's platform response, body unread.
 * @param head - Its status and headers.
 * @param url - The URL that was requested on this hop, as the address guard cleared it.
 * @param chain - Every hop requested so far, this one last.
 */
type HopFinisher<T> = (
  response: Response,
  head: ISaferFetchResponseHead,
  url: URL,
  chain: ReadonlyArray<IRequestHop>
) => Promise<Outcome<T>>;

/**
 * One walk's collaborators: the guards, the resolved walk settings, the deadlines it races
 * against, and the finisher that decides what the final hop yields.
 */
interface IWalkContext<T> {
  readonly guards: IResolvedGuards;
  readonly resolved: IResolvedWalkOptions;
  readonly watch: DeadlineWatch;
  readonly finish: HopFinisher<T>;
  /**
   * The caller's signal, when the response outlives the walk: composed into every hop's transport
   * signal so that aborting it still cancels the body after the walk has returned. Absent for the
   * buffered entry points, which read the body inside the walk's deadlines.
   */
  readonly outliving?: AbortSignal;
  /**
   * Set when the finisher retires the headers deadline itself, once it has checked the head. The
   * streaming entry point has no overall deadline, so retiring it on arrival would leave its
   * response-headers guard unbounded.
   */
  readonly finisherRetiresHeadersDeadline?: boolean;
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

/** A redirect a hop answered with, still to be validated and followed. */
interface IRedirect {
  readonly kind: 'redirect';
  readonly status: number;
  readonly location: string;
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
type AttemptOutcome<T> = { readonly kind: 'final'; readonly value: T } | IRedirect;

/**
 * What a hop's response head says: a redirect to follow, or a final response for the finisher.
 */
type HeadOutcome = { readonly kind: 'final'; readonly head: ISaferFetchResponseHead } | IRedirect;

/** One completed attempt, with the URL that was actually requested. */
interface IAttempt<T> {
  /**
   * The URL the transport was given — the address guard's cleared, possibly normalized URL,
   * not necessarily the spelling the caller or a `Location` header used. This is what a relative
   * `Location` resolves against, and what lands in `urlChain`.
   */
  readonly url: URL;
  readonly connectedAddress: string | undefined;
  readonly outcome: AttemptOutcome<T>;
}

const METHODS_WITHOUT_BODY: ReadonlyArray<SaferFetchMethod> = ['GET', 'HEAD'];

const REDIRECT_POLICIES: ReadonlyArray<SaferFetchRedirectPolicy> = ['reject', 'validate-each-hop'];

function _succeed<T>(value: T): Outcome<T> {
  return succeedWithDetail<T, FetchFailureReason>(value);
}

function _fail<T>(detail: FetchFailureReason, message: string): Outcome<T> {
  return failWithDetail<T, FetchFailureReason>(message, detail);
}

function _unknown<T>(message: string): Outcome<T> {
  return _fail<T>({ kind: 'unknown', detail: message }, message);
}

/**
 * The reason every escaped-exception path reports, defined once so {@link _unexpected} and
 * {@link _reasonOf} agree exactly.
 */
function _unexpectedReason(message: string): FetchFailureReason & { readonly kind: 'unknown' } {
  return { kind: 'unknown', detail: `saferFetch: unexpected error: ${message}` };
}

/** The failure every escaped-exception path reports. */
function _unexpected<T>(message: string): Outcome<T> {
  const reason = _unexpectedReason(message);
  return _fail<T>(reason, reason.detail);
}

/**
 * Restores the taxonomy's invariant that **every** failure leaving this module carries a
 * `FetchFailureReason`.
 *
 * @remarks
 * A detail-less failure comes from a throw or rejection that a `thenOnSuccess` callback caught:
 * a bug inside this module, or collaborator code this module does not wrap — the caller's logger
 * (a hop failure is logged inside the walk's chain), a guard's `name` getter read while reporting
 * that guard's refusal on a redirect hop, or `DeadlineWatch.dispose` meeting a caller `signal`
 * that is not an `AbortSignal`. `AsyncDetailedResult` converts such a throw to a
 * `DetailedFailure` with `detail: undefined` — correctly, since a thrown error supplies no reason
 * and inventing one would be worse — but that is a *chaining* primitive's contract, not this
 * module's.
 *
 * Every such failure is reported exactly as a throw that reached {@link _runCall}'s
 * `captureAsyncResult` is: `'unknown'`, with the `saferFetch: unexpected error:` prefix. Without
 * this a caller switching on `detail.kind` — the documented way to consume this API — would fault
 * on `undefined`.
 */
function _withReason<T>(outcome: Outcome<T>): Outcome<T> {
  return outcome.isFailure() && outcome.detail === undefined ? _unexpected<T>(outcome.message) : outcome;
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
  // A call already stopped does not start the work at all. Racing it would report the same stop,
  // but only after starting a guard (a DNS lookup) or a transport call nobody will wait for.
  const stoppedBy = watch.cause;
  if (stoppedBy !== undefined) {
    onAbandon?.();
    return _stopped<T>(watch, stoppedBy);
  }
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

/**
 * A copy of the caller's bytes that nothing else holds.
 *
 * @remarks
 * `new Uint8Array(bytes)` rather than `bytes.slice()`: a Node `Buffer` is a `Uint8Array` whose
 * `slice()` returns a view over the same memory, which would copy nothing.
 */
function _ownBytes(bytes: Uint8Array): Uint8Array {
  return new Uint8Array(bytes);
}

/** The refusal for a timeout or delay option a timer cannot honour. */
function _overTimerMessage(name: string, value: number): string {
  return (
    `${name} must be no greater than ${MAX_TIMER_DELAY_MS} ms ` +
    `(a timer fires a larger delay after 1 ms); got ${value}.`
  );
}

function _resolveCallOptions(options: ISaferFetchOptions): Outcome<IResolvedCallOptions> {
  const method = options.method ?? 'GET';
  // Copied before the first `await`, for the same reason as a guarded fetch's body: the request
  // guard approves this copy, and a caller mutating its array during the walk cannot change it.
  const supplied = options.body ?? undefined;
  const body = supplied instanceof Uint8Array ? _ownBytes(supplied) : supplied;
  if (body !== undefined && METHODS_WITHOUT_BODY.includes(method)) {
    return _unknown<IResolvedCallOptions>(`a ${method} request cannot carry a body.`);
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const headersTimeoutMs = options.headersTimeoutMs ?? DEFAULT_HEADERS_TIMEOUT_MS;
  const maxResponseBytes = options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES;
  // The two deadlines reach `setTimeout`, so they are also bounded by what a timer honours.
  const limits: ReadonlyArray<readonly [string, number, number]> = [
    ['timeoutMs', timeoutMs, MAX_TIMER_DELAY_MS],
    ['headersTimeoutMs', headersTimeoutMs, MAX_TIMER_DELAY_MS],
    ['maxResponseBytes', maxResponseBytes, Number.POSITIVE_INFINITY]
  ];
  for (const [name, value, max] of limits) {
    if (!Number.isFinite(value) || value <= 0) {
      return _unknown<IResolvedCallOptions>(`${name} must be a positive finite number; got ${value}.`);
    }
    if (value > max) {
      return _unknown<IResolvedCallOptions>(_overTimerMessage(name, value));
    }
  }

  return _resolveRedirectOptions(options).onSuccess((redirect) =>
    _asOutcome(resolveRetryPolicy(options.retry)).onSuccess((retry) =>
      _succeed<IResolvedCallOptions>({
        method,
        headers: _lowercaseHeaders(options.headers ?? {}),
        body,
        timeoutMs,
        headersTimeoutMs,
        maxResponseBytes,
        ...redirect,
        retry,
        transport: options.transport ?? platformFetchTransport,
        logger: options.logger ?? new Logging.NoOpLogger()
      })
    )
  );
}

/**
 * Resolves and validates the redirect settings, in the order the buffered entry points have
 * always reported them: policy, hop cap, then the sensitive-header list.
 */
function _resolveRedirectOptions(
  options: Pick<ISaferFetchOptions, 'redirectPolicy' | 'maxRedirects' | 'sensitiveHeaders'>
): Outcome<IResolvedRedirectOptions> {
  // `String(...)` and a lookup rather than a literal comparison, so that a JavaScript caller
  // supplying a policy this release does not implement is rejected instead of silently getting a
  // different one. The lookup also narrows to the union with no cast.
  const requestedPolicy = String(options.redirectPolicy ?? 'reject');
  const redirectPolicy = REDIRECT_POLICIES.find((p) => p === requestedPolicy);
  if (redirectPolicy === undefined) {
    return _unknown<IResolvedRedirectOptions>(
      `redirectPolicy "${requestedPolicy}" is not supported; expected ${REDIRECT_POLICIES.join(' or ')}.`
    );
  }

  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  if (!Number.isInteger(maxRedirects) || maxRedirects < 0) {
    return _unknown<IResolvedRedirectOptions>(
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
      return _unknown<IResolvedRedirectOptions>(
        `sensitiveHeaders must be an array of header names; got ${typeof extraSensitive}.`
      );
    }
    // `findIndex`, not `find`: an array containing `undefined` is itself invalid, and `find`
    // cannot distinguish that from "no offender".
    const badIndex = extraSensitive.findIndex((n) => typeof n !== 'string');
    if (badIndex >= 0) {
      return _unknown<IResolvedRedirectOptions>(
        `sensitiveHeaders[${badIndex}] must be a string header name; got ${typeof extraSensitive[badIndex]}.`
      );
    }
  }

  return _succeed({
    redirectPolicy,
    maxRedirects,
    sensitiveHeaders: sensitiveHeaderSet(options.sensitiveHeaders)
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

/**
 * Reads a hop's response head: fails an opaque redirect, decides a redirect status, and otherwise
 * hands back the head of a final response with its body untouched.
 *
 * @remarks
 * This is the part of response handling that belongs to the **walk**, and so is shared by every
 * entry point: whether a hop is a redirect, and whether the redirect policy allows following it,
 * must not depend on what the caller will do with the final body.
 */
function _receiveHead(
  response: Response,
  url: URL,
  redirectPolicy: SaferFetchRedirectPolicy
): Outcome<HeadOutcome> {
  if (response.type === 'opaqueredirect') {
    _discardBody(response);
    return _fail<HeadOutcome>(
      { kind: 'redirect-opaque' },
      'the platform returned an opaque redirect, whose target cannot be inspected or guarded.'
    );
  }

  if (REDIRECT_STATUSES.includes(response.status)) {
    // The body of a redirect is never the body this call wanted, and leaving it unconsumed holds
    // the connection open for the whole rest of the chain.
    _discardBody(response);
    if (redirectPolicy === 'reject') {
      return _fail<HeadOutcome>(
        { kind: 'redirect-rejected', url: url.toString(), status: response.status },
        `${url.toString()} redirected with status ${response.status}; redirects are rejected.`
      );
    }
    const location = response.headers.get('location') ?? undefined;
    if (location === undefined || location.trim().length === 0) {
      return _fail<HeadOutcome>(
        { kind: 'redirect-rejected', url: url.toString(), status: response.status },
        `${url.toString()} redirected with status ${response.status} but sent no usable Location header.`
      );
    }
    return _succeed<HeadOutcome>({ kind: 'redirect', status: response.status, location });
  }

  const headers = _readHeaders(response);
  // Annotated because a `Record<string, string>` lookup is typed as present even when the
  // header was never sent; these are read as optional everywhere downstream.
  const contentType: string | undefined = headers['content-type'];
  const contentLength: string | undefined = headers['content-length'];
  return _succeed<HeadOutcome>({
    kind: 'final',
    head: {
      status: response.status,
      statusText: response.statusText,
      headers,
      contentType,
      contentLength: parseContentLength(contentLength)
    }
  });
}

/**
 * Runs the response-headers guard on a final response's head, releasing the body if it refuses.
 *
 * @remarks
 * Shared by every entry point, so a content-type allowlist refuses identically whether or not the
 * caller goes on to read the body.
 */
async function _checkResponseHead(
  response: Response,
  head: ISaferFetchResponseHead,
  url: URL,
  chain: ReadonlyArray<IRequestHop>,
  guards: IResolvedGuards,
  watch: DeadlineWatch
): Promise<Outcome<true>> {
  const hop = chain.length - 1;
  return _raced(
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
}

/**
 * The buffered entry points' finisher: refuses a non-2xx status, runs the response-headers guard,
 * reads the body under the size cap, and runs the body guard over it.
 *
 * @param notes - This attempt's out-channel, which a non-2xx answer's `Retry-After` is recorded on.
 */
function _bufferedFinisher(
  guards: IResolvedGuards,
  resolved: IResolvedCallOptions,
  watch: DeadlineWatch,
  notes: IAttemptNotes
): HopFinisher<IBufferedBody> {
  return async (response, head, url, chain) => {
    if (!response.ok) {
      _discardBody(response);
      // Recorded before the failure is built rather than carried on it: `Retry-After` is
      // scheduling advice for this process, not a fact about the response worth widening the
      // taxonomy — and the taxonomy is a surface callers may echo, which advice from an
      // attacker-controlled server should not join.
      notes.retryAfter = head.headers['retry-after'];
      return _fail<IBufferedBody>(
        // `bodyPreview` is deliberately never populated: error bodies routinely echo request
        // content, including credentials.
        { kind: 'http-status', status: response.status, statusText: response.statusText },
        `${url.toString()} returned ${response.status} ${response.statusText}.`
      );
    }

    const hop = chain.length - 1;
    // Chained rather than stepped: `thenOnSuccess` preserves `FetchFailureReason` across an async
    // step, so each stage's failure propagates with its detail intact.
    return (await _checkResponseHead(response, head, url, chain, guards, watch))
      .thenOnSuccess(async () => _readCappedBody(response, head, resolved.maxResponseBytes, watch))
      .thenOnSuccess(async (bytes) =>
        (
          await _raced(
            watch,
            () => guards.responseBody.check(bytes, head),
            (message) => _blocked<true>('response-body', url, hop, guards.responseBody.name, message)
          )
        ).onSuccess(() => _succeed<IBufferedBody>({ bytes, head }))
      );
  };
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

async function _connect<T>(
  request: ISaferFetchRequest,
  cleared: IClearedHop,
  chain: ReadonlyArray<IRequestHop>,
  context: IWalkContext<T>
): Promise<Outcome<IAttempt<T>>> {
  const { resolved, watch } = context;
  const transport = resolved.transport;

  const init: RequestInit = {
    method: request.method,
    headers: request.headers,
    // `'manual'` rather than `'follow'`: the platform must not follow anything on our behalf,
    // because a hop the guard never sees is a hop the guard never guarded.
    redirect: 'manual',
    // A composed signal rather than a listener on the caller's: the watch stops listening when the
    // walk returns, and a listener left behind on a long-lived caller signal (one per request, on a
    // signal that outlives a whole session) would be a leak. `AbortSignal.any` holds its sources
    // weakly, so the composite goes away with the response.
    signal:
      context.outliving === undefined ? watch.signal : AbortSignal.any([watch.signal, context.outliving])
  };
  if (request.body !== undefined) {
    // A byte body is copied into a fresh buffer rather than handed over by reference: it keeps
    // the platform's non-shared `BufferSource` requirement satisfied without a cast, and it
    // means a caller mutating its array after the call cannot change what goes on the wire.
    init.body = typeof request.body === 'string' ? request.body : new Uint8Array(request.body);
  }

  return (
    await _raced(
      watch,
      () => transport.fetch(cleared.url, init, { pinnedAddress: cleared.pinnedAddress }),
      (message) =>
        _fail<Response>(
          { kind: 'network', detail: message },
          `transport "${transport.name}" failed: ${message}`
        )
    )
  )
    .thenOnSuccess(async (response) => {
      // Inside the continuation rather than before it, which is where it already ran: the
      // headers deadline is retired only once a response has actually arrived.
      if (context.finisherRetiresHeadersDeadline !== true) {
        watch.headersReceived();
      }
      return _receiveHead(response, cleared.url, resolved.redirectPolicy).thenOnSuccess(
        async (received): Promise<Outcome<AttemptOutcome<T>>> =>
          received.kind === 'redirect'
            ? _succeed<AttemptOutcome<T>>(received)
            : (await context.finish(response, received.head, cleared.url, chain)).onSuccess((value) =>
                _succeed<AttemptOutcome<T>>({ kind: 'final', value })
              )
      );
    })
    .onSuccess((outcome) =>
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
  resolved: IResolvedRedirectOptions
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
async function _walk<T>(url: URL, context: IWalkContext<T>): Promise<Outcome<IWalked<T>>> {
  const { resolved } = context;
  return _walkHop<T>(
    {
      url,
      method: resolved.method,
      headers: resolved.headers,
      ...(resolved.body !== undefined ? { body: resolved.body } : {})
    },
    [],
    context
  );
}

/**
 * Walks one hop and, when it redirects, the hop it leads to.
 *
 * @remarks
 * The checks run in a fixed order, each before the request it guards: the request guard, the
 * scheme re-check, the address guard, loop detection, the connect, and — on a redirect — the next
 * hop's derivation. Each stage is reached only through the previous stage's success, so a refusal
 * anywhere ends the walk before anything after it starts.
 *
 * Recursive rather than a loop, as {@link _runAttempt} is: each hop is handed the hops before it
 * as a fresh array that nothing mutates, so a hop's view of the chain cannot change underneath it.
 * Depth is bounded by `maxRedirects`, and each level is `await`ed. Each pending level holds its
 * own copy of the chain, so memory retained by a walk is O(hops²) entries — bounded by
 * `maxRedirects`.
 *
 * @param request - The request this hop sends, before the request guard has seen it.
 * @param completed - Hops already requested and redirected away from, oldest first.
 */
async function _walkHop<T>(
  request: ISaferFetchRequest,
  completed: ReadonlyArray<ICompletedHop>,
  context: IWalkContext<T>
): Promise<Outcome<IWalked<T>>> {
  const { guards, watch } = context;
  // Re-arms the per-attempt headers deadline. Without this, the first hop's
  // `headersReceived()` would retire it for the whole call and a later host that never
  // answers would be bounded only by the overall deadline.
  watch.attemptStarted();

  return (
    await _raced(
      watch,
      () => guards.request.check(request, [...completed, { url: request.url }]),
      (message) =>
        _blocked<ISaferFetchRequest>('request', request.url, completed.length, guards.request.name, message)
    )
  )
    .onSuccess((checked) => _checkScheme(checked.url).onSuccess(() => _succeed(checked)))
    .thenOnSuccess(async (checked) => _clearAndConnect(checked, completed, context));
}

/**
 * The rest of one hop once its request guard has accepted: the address guard, loop detection and
 * the connect.
 *
 * @param checked - The request the request guard returned; it is what this hop sends.
 * @param completed - Hops already requested and redirected away from, oldest first.
 */
async function _clearAndConnect<T>(
  checked: ISaferFetchRequest,
  completed: ReadonlyArray<ICompletedHop>,
  context: IWalkContext<T>
): Promise<Outcome<IWalked<T>>> {
  const { guards, resolved, watch } = context;
  // The address guard runs immediately before the connect and after the request guard, so it
  // is always the last word before anything reaches the wire.
  return (await _clearAddress([...completed, { url: checked.url }], guards, watch))
    .onSuccess((cleared) =>
      _logFailure(resolved.logger, cleared.url, _detectLoop(cleared.url, completed)).onSuccess(() =>
        _succeed(cleared)
      )
    )
    .thenOnSuccess(async (cleared) =>
      _logFailure(
        resolved.logger,
        cleared.url,
        // Downstream guards see the chain as it was actually requested, so the URL a response
        // guard reads is the URL the address guard cleared — not the pre-normalization spelling.
        await _connect(checked, cleared, [...completed, { url: cleared.url }], context)
      )
    )
    .thenOnSuccess(async (attempt) => _settleHop(checked, attempt, completed, context));
}

/**
 * Ends the walk on a final response, or derives the next hop from a redirect and walks it.
 *
 * @param checked - The request this hop actually sent. The next hop's headers are derived from it,
 * never from the caller's original set, which is what keeps credential stripping monotonic.
 * @param attempt - This hop's completed attempt.
 * @param completed - Hops before this one, oldest first.
 */
async function _settleHop<T>(
  checked: ISaferFetchRequest,
  attempt: IAttempt<T>,
  completed: ReadonlyArray<ICompletedHop>,
  context: IWalkContext<T>
): Promise<Outcome<IWalked<T>>> {
  const { outcome } = attempt;
  if (outcome.kind === 'final') {
    return _succeed({
      value: outcome.value,
      urlChain: [...completed.map((hop) => hop.url.toString()), attempt.url.toString()]
    });
  }

  const { resolved } = context;
  return _logFailure(
    resolved.logger,
    attempt.url,
    _nextHop(attempt.url, completed, outcome, checked, resolved)
  ).thenOnSuccess(async (next) =>
    _walkHop(
      next,
      [
        ...completed,
        {
          url: attempt.url,
          status: outcome.status,
          ...(attempt.connectedAddress !== undefined ? { connectedAddress: attempt.connectedAddress } : {})
        }
      ],
      context
    )
  );
}

/** Logs a hop's failure, naming the URL it was for, and passes the outcome on unchanged. */
function _logFailure<T>(logger: Logging.ILogger, url: URL, outcome: Outcome<T>): Outcome<T> {
  if (outcome.isFailure()) {
    logger.detail(`saferFetch: ${url.toString()} failed: ${outcome.message}`);
  }
  return outcome;
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
  resolved: IResolvedCallOptions,
  watch: DeadlineWatch,
  attempt: number
): Promise<Outcome<IRawOutcome>> {
  // Fresh per attempt: notes describe the attempt that just failed, and carrying a previous
  // attempt's `Retry-After` into a later decision would schedule against a response that is no
  // longer the reason we are retrying.
  const notes: IAttemptNotes = {};
  const walked = await _walk(url, {
    guards,
    resolved,
    watch,
    finish: _bufferedFinisher(guards, resolved, watch, notes)
  });
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
    : _runAttempt(url, guards, resolved, watch, attempt + 1);
}

async function _execute(url: string | URL, options: ISaferFetchOptions): Promise<Outcome<IRawOutcome>> {
  // Every step up to and including the watch runs synchronously, in the caller's tick: `options`
  // is the caller's object, and nothing reads it after the first `await`.
  const call = _resolveCallOptions(options).onSuccess((resolved) =>
    _asOutcome(resolveGuards(options)).onSuccess((guards) =>
      _parseUrl(url).onSuccess((parsed) =>
        _succeed({
          parsed,
          guards,
          resolved,
          watch: new DeadlineWatch(resolved.timeoutMs, resolved.headersTimeoutMs, options.signal)
        })
      )
    )
  );
  // This is the single boundary where an `Outcome` becomes the caller's result, so it is the one
  // place the every-failure-has-a-reason invariant has to hold — see {@link _withReason}.
  return _withReason(
    await call.thenOnSuccess(async ({ parsed, guards, resolved, watch }) =>
      _runCall(parsed, guards, resolved, watch)
    )
  );
}

/** Runs a validated buffered call's attempts against its watch, disposing the watch on every path. */
async function _runCall(
  url: URL,
  guards: IResolvedGuards,
  resolved: IResolvedCallOptions,
  watch: DeadlineWatch
): Promise<Outcome<IRawOutcome>> {
  // `captureAsyncResult` rather than `try`/`finally`, for the same reason `_capture` wraps every
  // guard and transport call: an entry point documented to always return a `Result` has to keep
  // that promise even when a collaborator breaks its own. Guards, transports and the body read
  // are each captured already, and a throw inside the walk's chain is converted by `thenOnSuccess`
  // (see {@link _withReason}). What still reaches this capture is collaborator code outside both:
  // the caller's `logger` on `_runAttempt`'s retry line, and a throw raised before the walk's
  // first hand-off — a request guard's `name` getter while its hop-0 refusal is reported. The
  // watch is disposed on both paths because the capture has already converted the throw into a
  // value.
  const ran = await captureAsyncResult(async () => _runAttempt(url, guards, resolved, watch, 0));
  watch.dispose();
  // `'unknown'` is the taxonomy's honest slot for "something violated its contract", rather than a
  // guess at a more specific kind.
  return ran.isFailure() ? _unexpected<IRawOutcome>(ran.message) : ran.value;
}

function _toResponse<T>(value: T, raw: IRawOutcome): ISaferFetchResponse<T> {
  return {
    value,
    status: raw.value.head.status,
    headers: raw.value.head.headers,
    urlChain: raw.urlChain,
    bytesRead: raw.value.bytes.byteLength
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
  const charset = parseCharset(raw.value.head.contentType) ?? 'utf-8';
  // `fatal: true` so an unknown charset, or a byte sequence invalid in the declared one,
  // surfaces as a decode failure rather than as silent mojibake some caller treats as data.
  const decoded = captureResult(() => new TextDecoder(charset, { fatal: true }).decode(raw.value.bytes));
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
  return (await _execute(url, options)).onSuccess((raw) => _succeed(_toResponse(raw.value.bytes, raw)));
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

/** Methods a guarded fetch accepts — every {@link SaferFetch.SaferFetchMethod}. */
const GUARDED_FETCH_METHODS: ReadonlyArray<SaferFetchMethod> = SAFER_FETCH_METHODS;

/**
 * {@link SaferFetch.ISaferFetchOptions} members a guarded fetch refuses at creation: each needs the
 * body buffered, would cut off a long-lived stream, or would replay a request, so accepting one
 * silently would advertise a protection the function does not give. The per-request members are
 * refused too — they belong on the call's `RequestInit`, and accepting them here would leave a
 * caller believing they applied. `maxResponseBytes` is not in the set: it is enforced by counting
 * the body as the caller reads it.
 */
const GUARDED_FETCH_REFUSED_OPTIONS: ReadonlySet<string> = new Set([
  'timeoutMs',
  'responseBodyGuard',
  'retry',
  'method',
  'headers',
  'body',
  'signal'
]);

/** A guarded fetch's validated, per-function settings: resolved once, at creation. */
interface IPreparedGuardedFetch {
  readonly guards: IResolvedGuards;
  readonly redirect: IResolvedRedirectOptions;
  readonly headersTimeoutMs: number;
  /** The body cap, when the caller set one; `undefined` leaves the body unbounded and untouched. */
  readonly maxResponseBytes: number | undefined;
  readonly transport: IFetchTransport;
  readonly logger: Logging.ILogger;
}

/** One guarded call's request, normalized from the fetch-shaped arguments. */
interface IGuardedRequest {
  readonly url: string | URL;
  readonly method: SaferFetchMethod;
  readonly headers: Record<string, string>;
  readonly body: string | Uint8Array | undefined;
}

/**
 * Re-types a plain `Result` from a collaborator as an `Outcome`: a failure becomes `'unknown'`, the
 * taxonomy's slot for an invalid option, exactly as the buffered entry points report one.
 */
function _asOutcome<T>(result: Result<T>): Outcome<T> {
  return result.isSuccess() ? _succeed(result.value) : _unknown<T>(result.message);
}

/** Refuses every option that needs the body buffered, would retry, or belongs on the call. */
function _refuseUnsupportedOptions(options: IGuardedFetchOptions): Outcome<IGuardedFetchOptions> {
  // Read off the object's own entries rather than its type: a JavaScript caller, or a spread of a
  // buffered call's options, can carry any of these, and the type cannot see them.
  const refused = Object.entries(options)
    .filter(([name, value]) => value !== undefined && GUARDED_FETCH_REFUSED_OPTIONS.has(name))
    .map(([name]) => name);
  return refused.length > 0
    ? _unknown<IGuardedFetchOptions>(
        `createGuardedFetch does not support ${refused.join(', ')}: a guarded fetch never buffers the ` +
          'body, sets no deadline over it, never retries, and takes per-request inputs from each call.'
      )
    : _succeed(options);
}

function _validHeadersTimeout(headersTimeoutMs: number): Outcome<number> {
  if (!Number.isFinite(headersTimeoutMs) || headersTimeoutMs <= 0) {
    return _unknown<number>(`headersTimeoutMs must be a positive finite number; got ${headersTimeoutMs}.`);
  }
  return headersTimeoutMs <= MAX_TIMER_DELAY_MS
    ? _succeed(headersTimeoutMs)
    : _unknown<number>(_overTimerMessage('headersTimeoutMs', headersTimeoutMs));
}

/** Validates an opt-in body cap: absent (no cap), or a positive finite number of bytes. */
function _validMaxResponseBytes(maxResponseBytes: number | undefined): Outcome<number | undefined> {
  return maxResponseBytes === undefined || (Number.isFinite(maxResponseBytes) && maxResponseBytes > 0)
    ? _succeed(maxResponseBytes)
    : _unknown<number | undefined>(`maxResponseBytes must be a positive finite number; got ${maxResponseBytes}.`);
}

/** Validates a guarded fetch's options once, at creation, in the order the buffered entry points use. */
function _prepareGuardedFetch(options: IGuardedFetchOptions): Outcome<IPreparedGuardedFetch> {
  return _refuseUnsupportedOptions(options)
    .onSuccess(() => _validHeadersTimeout(options.headersTimeoutMs ?? DEFAULT_HEADERS_TIMEOUT_MS))
    .onSuccess((headersTimeoutMs) =>
      _validMaxResponseBytes(options.maxResponseBytes).onSuccess((maxResponseBytes) =>
        _succeed({ headersTimeoutMs, maxResponseBytes })
      )
    )
    .onSuccess(({ headersTimeoutMs, maxResponseBytes }) =>
      _resolveRedirectOptions(options).onSuccess((redirect) =>
        _asOutcome(resolveGuards(options)).onSuccess((guards) =>
          _succeed<IPreparedGuardedFetch>({
            guards,
            redirect,
            headersTimeoutMs,
            maxResponseBytes,
            transport: options.transport ?? platformFetchTransport,
            logger: options.logger ?? new Logging.NoOpLogger()
          })
        )
      )
    );
}

/**
 * Normalizes a request body to what the walk can carry: a string or a byte array.
 *
 * @remarks
 * `URLSearchParams` is accepted because OAuth token requests send one (the MCP SDK's do); it is
 * sent as its string form with the content type `fetch` would have given it, unless the caller set
 * one. A `ReadableStream`, `FormData` or `Blob` is refused: the walk may have to replay the body on
 * a `307`/`308` hop, and a stream cannot be replayed.
 */
function _guardedBody(
  body: unknown,
  headers: Record<string, string>
): Outcome<string | Uint8Array | undefined> {
  if (body === undefined || body === null || typeof body === 'string') {
    return _succeed(body ?? undefined);
  }
  // Bytes are copied here, before the first `await`: the guards approve this copy, and a caller
  // that mutates its buffer while they run cannot change what goes on the wire.
  if (body instanceof Uint8Array) {
    return _succeed(_ownBytes(body));
  }
  if (body instanceof ArrayBuffer) {
    return _succeed(new Uint8Array(body.slice(0)));
  }
  if (body instanceof URLSearchParams) {
    headers['content-type'] ??= 'application/x-www-form-urlencoded;charset=UTF-8';
    return _succeed(body.toString());
  }
  return _unknown<string | Uint8Array | undefined>(
    'a guarded fetch body must be a string, Uint8Array, ArrayBuffer or URLSearchParams.'
  );
}

/** Normalizes the fetch-shaped arguments, refusing every shape the walk cannot carry faithfully. */
function _guardedRequest(input: unknown, init: RequestInit | undefined): Outcome<IGuardedRequest> {
  if (typeof input !== 'string' && !(input instanceof URL)) {
    return _unknown<IGuardedRequest>(
      'a guarded fetch takes a string or URL; a Request object is not supported.'
    );
  }

  // Upper-cased, as `fetch` normalizes the methods it knows; anything outside the safer-fetch set is
  // refused rather than sent.
  const requestedMethod = String(init?.method ?? 'GET').toUpperCase();
  const method = GUARDED_FETCH_METHODS.find((m) => m === requestedMethod);
  if (method === undefined) {
    return _unknown<IGuardedRequest>(
      `method "${requestedMethod}" is not supported; expected one of ${GUARDED_FETCH_METHODS.join(', ')}.`
    );
  }

  // `Headers` accepts every `HeadersInit` shape — a `Headers`, an array of pairs, a record — and
  // validates names and values the way `fetch` would. It lowercases names as it goes.
  const parsedHeaders = captureResult(() => new Headers(init?.headers ?? undefined));
  if (parsedHeaders.isFailure()) {
    return _unknown<IGuardedRequest>(`invalid request headers: ${parsedHeaders.message}`);
  }
  const headers: Record<string, string> = {};
  parsedHeaders.value.forEach((value, name) => {
    headers[name] = value;
  });

  return _guardedBody(init?.body, headers).onSuccess((body) =>
    body !== undefined && METHODS_WITHOUT_BODY.includes(method)
      ? _unknown<IGuardedRequest>(`a ${method} request cannot carry a body.`)
      : _succeed<IGuardedRequest>({ url: input, method, headers, body })
  );
}

/**
 * Wraps `body` in a stream that passes each chunk through as the caller reads it, counting decoded
 * bytes, and errors the moment the count passes `limit`.
 *
 * @remarks
 * Nothing is read ahead (`highWaterMark: 0`): a chunk is pulled from upstream only when the caller
 * asks for one, so the wrapper buffers nothing. The chunk that takes the count past the cap is
 * withheld. The upstream body is cancelled **before** the stream is errored, so by the time the
 * caller sees the failure the connection has already been released. A cancel from the caller is
 * forwarded upstream with its reason; an upstream read that rejects (an abort through `init.signal`,
 * a dropped connection) errors this stream with the same reason.
 */
function _countingBody(
  body: ReadableStream<Uint8Array>,
  limit: number,
  declared: number | undefined
): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  let total: number = 0;
  return new ReadableStream<Uint8Array>(
    {
      pull: async (controller): Promise<void> => {
        const read = await reader.read();
        if (read.done) {
          controller.close();
          return;
        }
        total += read.value.byteLength;
        if (total > limit) {
          await _cancelReader(reader);
          controller.error(
            new GuardedFetchError({
              kind: 'too-large',
              bytesRead: total,
              limit,
              ...(declared !== undefined ? { declared } : {})
            })
          );
          return;
        }
        controller.enqueue(read.value);
      },
      cancel: async (reason: unknown): Promise<void> => {
        await reader.cancel(reason).catch(() => undefined);
      }
    },
    { highWaterMark: 0 }
  );
}

/**
 * Applies a guarded fetch's body cap to the final response: refuses one whose `Content-Length`
 * already declares more than the cap, and wraps any other body in {@link _countingBody}.
 *
 * @remarks
 * The wrapper is a new `Response`, because a platform `Response`'s body cannot be replaced; it
 * carries the original status, status text and headers, and `url` and `redirected` are copied onto
 * it — and onto every clone of it — as own properties, since the constructor cannot set them. A response without a body is
 * returned unchanged: there is nothing to count.
 */
function _capBody(response: Response, head: ISaferFetchResponseHead, limit: number): Outcome<Response> {
  const declared = head.contentLength;
  if (declared !== undefined && declared > limit) {
    _discardBody(response);
    return _fail<Response>(
      { kind: 'too-large', bytesRead: 0, limit, declared },
      `response declares ${declared} bytes, over the ${limit}-byte maxResponseBytes cap.`
    );
  }
  const body = response.body ?? undefined;
  if (body === undefined) {
    return _succeed(response);
  }
  const capped = new Response(_countingBody(body, limit, declared), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
  return _succeed(_keepOrigin(capped, response.url, response.redirected));
}

/**
 * Gives a constructed `Response` the `url` and `redirected` of the response it stands in for, as own
 * properties (the constructor cannot set them), and a `clone` that does the same for every clone.
 */
function _keepOrigin(target: Response, url: string, redirected: boolean): Response {
  const clone = target.clone.bind(target);
  Object.defineProperties(target, {
    url: { value: url },
    redirected: { value: redirected },
    clone: { value: (): Response => _keepOrigin(clone(), url, redirected) }
  });
  return target;
}

/**
 * The streaming finisher: runs the response-headers guard and hands the response back with its
 * body unread, whatever its status — wrapped in a counting stream when a body cap is set.
 */
function _streamingFinisher(
  guards: IResolvedGuards,
  watch: DeadlineWatch,
  maxResponseBytes: number | undefined
): HopFinisher<Response> {
  return async (response, head, url, chain) =>
    (await _checkResponseHead(response, head, url, chain, guards, watch)).onSuccess(() => {
      // Only now: the headers deadline also bounds the response-headers guard, which nothing else
      // would on this path.
      watch.headersReceived();
      return maxResponseBytes === undefined ? _succeed(response) : _capBody(response, head, maxResponseBytes);
    });
}

async function _executeGuarded(
  prepared: IPreparedGuardedFetch,
  input: unknown,
  init: RequestInit | undefined
): Promise<Outcome<Response>> {
  // First, before the request is even inspected: an aborted call starts nothing.
  const signal = init?.signal ?? undefined;
  if (signal?.aborted === true) {
    return _fail<Response>({ kind: 'aborted' }, _stopMessage('caller-aborted'));
  }
  return _guardedRequest(input, init)
    .onSuccess((request) => _parseUrl(request.url).onSuccess((url) => _succeed({ request, url })))
    .thenOnSuccess(async (target) => _walkGuarded(prepared, target.request, target.url, signal));
}

/** Runs the shared hop walk for one guarded call, and hands back the final response unread. */
async function _walkGuarded(
  prepared: IPreparedGuardedFetch,
  request: IGuardedRequest,
  url: URL,
  signal: AbortSignal | undefined
): Promise<Outcome<Response>> {
  // No overall deadline: the body this returns may be a stream that lives for an hour.
  const watch = new DeadlineWatch(undefined, prepared.headersTimeoutMs, signal);
  // Captured for the same reason as in `_runCall`: the logger is collaborator code.
  const ran = await captureAsyncResult(async () =>
    _walk(url, {
      guards: prepared.guards,
      resolved: {
        ...prepared.redirect,
        method: request.method,
        headers: request.headers,
        body: request.body,
        transport: prepared.transport,
        logger: prepared.logger
      },
      watch,
      finish: _streamingFinisher(prepared.guards, watch, prepared.maxResponseBytes),
      finisherRetiresHeadersDeadline: true,
      ...(signal !== undefined ? { outliving: signal } : {})
    })
  );
  // Read before the watch is disposed: an abort that landed after the last guard settled has
  // already cancelled the body through the composed signal, so the call must report it rather than
  // hand back a response whose first read fails.
  const stoppedBy = watch.cause;
  // Disposed on success too: the headers timer is already cleared, and the caller's signal now
  // reaches the body through the composed transport signal rather than through this watch.
  watch.dispose();
  return ran.isFailure()
    ? _unexpected<Response>(ran.message)
    : ran.value.onSuccess((walked) =>
        stoppedBy === undefined ? _succeed(walked.value) : _stoppedReleasing(walked.value, watch, stoppedBy)
      );
}

/** Reports a stop that landed after the walk returned, releasing the response it will not hand back. */
function _stoppedReleasing(
  response: Response,
  watch: DeadlineWatch,
  cause: DeadlineStopCause
): Outcome<Response> {
  _discardBody(response);
  return _stopped<Response>(watch, cause);
}

/**
 * The reason a guarded call failed.
 *
 * @remarks
 * A failure from inside a chaining callback can arrive without a reason (see {@link _withReason});
 * it gets the same `'unknown'` wrapping here, so a `GuardedFetchError` always carries one.
 */
function _reasonOf(failure: DetailedFailure<Response, FetchFailureReason>): FetchFailureReason {
  return failure.detail ?? _unexpectedReason(failure.message);
}

/**
 * Creates a `fetch`-shaped function that sends every request through the safer-fetch hop walk and
 * returns the response **without reading its body** — for streaming responses (Server-Sent Events,
 * MCP Streamable HTTP) and for libraries that take a `fetch`.
 *
 * @remarks
 * **What it does.** Every call runs the same walk as the buffered entry points: the scheme check,
 * the request guard, the address guard on **every** hop before any connection, the redirect policy
 * (`'reject'` by default), loop detection, monotonic credential stripping on a cross-origin hop,
 * and a headers deadline per hop. The response-headers guard runs on the final response's head.
 * The final hop's platform `Response` is then returned with its body stream intact: nothing is
 * buffered, so the first event of a stream reaches the caller as soon as the server sends it.
 *
 * **Cancellation.** The call's `init.signal` stops guard evaluation, the connect and a redirect
 * walk in progress, and — once the response has been returned — the body stream. A signal that is
 * already aborted fails the call before any guard runs. Cancelling the body after return relies on
 * the transport honoring `RequestInit.signal` for the body, as {@link SaferFetch.platformFetchTransport}
 * does; it needs `AbortSignal.any` (Node 20.3 or later; current browsers).
 *
 * **Size cap — opt-in.** With {@link SaferFetch.IGuardedFetchOptions.maxResponseBytes} set, a
 * response that declares a larger `Content-Length` is refused (`'too-large'`), and any other body
 * is returned wrapped in a stream that counts decoded bytes as the caller reads them and errors
 * with a `'too-large'` {@link SaferFetch.GuardedFetchError} — after cancelling the upstream body —
 * the moment the count passes the cap. The body is still never read here. There is no default cap.
 *
 * **What it does not protect against** — on top of everything {@link SaferFetch.saferFetchBytes}
 * lists, DNS rebinding included: there is **no deadline over the body**, **no body guard** and
 * **no retry**, and **no size cap unless `maxResponseBytes` is set**. A server can hold a returned
 * stream open for as long as the caller keeps reading, and without a cap send it without end;
 * bounding time is the caller's job, typically with `init.signal`. `timeoutMs`,
 * `responseBodyGuard` and `retry` are refused at creation rather than ignored.
 *
 * **Custom credential headers.** `fetch` strips only `authorization` on a cross-origin redirect.
 * Redirects are rejected by default; a caller who allows them must list every custom credential
 * header (`x-api-key`, a session token) in `sensitiveHeaders`, or it is carried to the next origin.
 *
 * **Request inputs.** The first argument is a string or `URL` (a `Request` object is refused). The
 * method is one of {@link SaferFetch.SaferFetchMethod}. Headers may be a `Headers`, an array of
 * pairs or a record. The body may be a string, `Uint8Array`, `ArrayBuffer` or `URLSearchParams`; a
 * stream or `FormData` is refused. Other `RequestInit` members (`redirect`, `credentials`, `mode`,
 * `cache`, …) are ignored.
 *
 * **Failures.** The function rejects with a {@link SaferFetch.GuardedFetchError}, whose message is
 * fixed text and whose `reason` is the `FetchFailureReason` — which holds URLs. A non-2xx response
 * is returned, not rejected.
 *
 * @param options - The guards and redirect settings, validated once, here. `addressGuard` is
 * required: use `blockPrivateNetworks()` on Node.
 * @returns `Success` with the function, or `Failure` if an option is invalid or refused.
 * @public
 */
export function createGuardedFetch(options: IGuardedFetchOptions): Result<GuardedFetch> {
  return _prepareGuardedFetch(options).asResult.onSuccess((prepared) =>
    succeed<GuardedFetch>(async (url: string | URL, init?: RequestInit): Promise<Response> => {
      const outcome = await _executeGuarded(prepared, url, init);
      if (outcome.isFailure()) {
        throw new GuardedFetchError(_reasonOf(outcome));
      }
      return outcome.value;
    })
  );
}
