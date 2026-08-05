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

import { fail, succeed, type Result } from '@fgv/ts-utils';

import {
  DEFAULT_RETRY_BASE_DELAY_MS,
  DEFAULT_RETRY_MAX_DELAY_MS,
  IDEMPOTENT_METHODS,
  RETRY_AFTER_STATUSES,
  RETRYABLE_HTTP_STATUSES
} from './defaults';
import type { FetchFailureReason } from './failureReason';
import type { SaferFetchMethod } from './model';

/**
 * Opt-in retry policy.
 *
 * @remarks
 * **Retry is off by default and has to be asked for.** A primitive that silently retries
 * changes the semantics of every call site and amplifies load against a service that is already
 * struggling.
 *
 * Two rules are load-bearing rather than incidental, and are worth reading before enabling this:
 *
 * **Every attempt re-runs the address guard from hop 0 — a full re-walk, never a resume and
 * never a cached verdict.** Reusing an earlier attempt's verdict would make retry its own
 * DNS-rebinding vector: an attacker needs the guard to pass once and a connect to land on a
 * private address, so `N` connects against **one** check multiplies their odds by the retry
 * count — and a retry delay is precisely when a short-TTL rebind lands. A resume is
 * independently wrong because the redirect chain is not stable across attempts: attempt 2's
 * server may answer with a different `Location`, so revalidating only the current hop would
 * validate a chain the request no longer follows. The consequence is that retries cost more
 * than a naive implementation would suggest — each carries full re-resolution — and that cost
 * is deliberate.
 *
 * **The overall deadline is the ceiling.** Retries consume `timeoutMs` and never reset it, so
 * `{ timeoutMs: 30_000, retry: { attempts: 3 } }` is a thirty-second call, not a two-minute
 * one. When the remaining budget is shorter than the computed delay, the call fails with the
 * attempt's own failure rather than sleeping past its deadline.
 * @public
 */
export interface IRetryPolicy {
  /**
   * Additional attempts after the first, **not** a total. `attempts: 2` means up to three
   * requests. Must be a non-negative integer; `0` disables retry.
   */
  readonly attempts: number;

  /**
   * First backoff delay, in milliseconds, doubled per attempt before jitter. Default
   * {@link SaferFetch.DEFAULT_RETRY_BASE_DELAY_MS}.
   */
  readonly baseDelayMs?: number;

  /**
   * Ceiling on any single delay, in milliseconds. Default
   * {@link SaferFetch.DEFAULT_RETRY_MAX_DELAY_MS}. Also clamps a server-supplied
   * `Retry-After`, which is the security-relevant half of its job.
   */
  readonly maxDelayMs?: number;

  /**
   * Retries `POST` / `PUT` / `PATCH` / `DELETE` as well as `GET` / `HEAD`. Default `false`.
   *
   * @remarks
   * Off by default because a timeout does not tell you whether the server processed the
   * request: a retried `POST` after a timeout can double-charge. Turn it on for endpoints you
   * know are idempotent — an idempotency key, a `PUT` of a whole resource — and not otherwise.
   */
  readonly retryNonIdempotent?: boolean;

  /**
   * Honors a `Retry-After` header on `429` and `503`. Default `true`.
   *
   * @remarks
   * Always clamped to `maxDelayMs`, whatever this is set to. The header is chosen by the
   * server, which in this threat model may be the adversary.
   */
  readonly respectRetryAfter?: boolean;
}

/**
 * A {@link SaferFetch.IRetryPolicy} with every default applied, so no downstream code path
 * branches on a field's absence.
 * @internal
 */
export interface IResolvedRetryPolicy {
  readonly attempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly retryNonIdempotent: boolean;
  readonly respectRetryAfter: boolean;
}

/** No retry. The resolved shape of an absent `retry` option. @internal */
export const NO_RETRY: IResolvedRetryPolicy = {
  attempts: 0,
  baseDelayMs: DEFAULT_RETRY_BASE_DELAY_MS,
  maxDelayMs: DEFAULT_RETRY_MAX_DELAY_MS,
  retryNonIdempotent: false,
  respectRetryAfter: true
};

/**
 * Applies the retry defaults, rejecting a policy that cannot mean anything.
 *
 * @remarks
 * Validated for the same reason `redirectPolicy` and `sensitiveHeaders` are: a JavaScript
 * caller can pass anything, and a `NaN` delay silently becomes a `setTimeout(NaN)` that fires
 * immediately — turning a backoff into a tight retry loop against a struggling service.
 * @internal
 */
export function resolveRetryPolicy(retry?: IRetryPolicy): Result<IResolvedRetryPolicy> {
  // `?? undefined` rather than `!== undefined`, matching every other option: a `null` from a
  // JavaScript caller means "absent", never "installed".
  const policy = retry ?? undefined;
  if (policy === undefined) {
    return succeed(NO_RETRY);
  }

  const attempts = policy.attempts;
  if (!Number.isInteger(attempts) || attempts < 0) {
    return fail(`retry.attempts must be a non-negative integer; got ${attempts}.`);
  }

  const baseDelayMs = policy.baseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;
  const maxDelayMs = policy.maxDelayMs ?? DEFAULT_RETRY_MAX_DELAY_MS;
  const delays: ReadonlyArray<readonly [string, number]> = [
    ['retry.baseDelayMs', baseDelayMs],
    ['retry.maxDelayMs', maxDelayMs]
  ];
  for (const [name, value] of delays) {
    if (!Number.isFinite(value) || value < 0) {
      return fail(`${name} must be a non-negative finite number; got ${value}.`);
    }
  }

  return succeed({
    attempts,
    baseDelayMs,
    maxDelayMs,
    retryNonIdempotent: policy.retryNonIdempotent === true,
    // Defaults to honoring the header, so `?? true` rather than the `=== true` the other two
    // flags use.
    respectRetryAfter: policy.respectRetryAfter ?? true
  });
}

/**
 * Decides whether a failure is one a later attempt could plausibly answer differently.
 *
 * @remarks
 * The `switch` is exhaustive over the taxonomy on purpose: a new failure kind should have to be
 * classified deliberately rather than inherit "retryable" or "not" from a default branch.
 *
 * `'blocked-by-guard'` can never succeed on a retry — the guard's answer is about the
 * destination, not about the moment. `'too-large'` is the sharper case: retrying it
 * re-downloads up to the cap every time, which turns a defense into an amplifier aimed at the
 * caller's own bandwidth.
 * @internal
 */
export function isRetryableFailure(reason: FetchFailureReason | undefined): boolean {
  // A failure with no detail is one this primitive could not classify, and an unclassifiable
  // failure is not one to retry — the whole basis for retrying is knowing what went wrong.
  if (reason === undefined) {
    return false;
  }
  switch (reason.kind) {
    case 'network':
    case 'timeout':
      return true;
    case 'http-status':
      return RETRYABLE_HTTP_STATUSES.includes(reason.status);
    case 'invalid-url':
    case 'blocked-by-guard':
    case 'redirect-rejected':
    case 'redirect-opaque':
    case 'too-many-redirects':
    case 'aborted':
    case 'too-large':
    case 'unsupported-content-type':
    case 'decode':
    case 'parse':
    case 'unknown':
      return false;
  }
}

/**
 * Whether this method may be retried under the supplied policy.
 * @internal
 */
export function isRetryableMethod(method: SaferFetchMethod, policy: IResolvedRetryPolicy): boolean {
  return policy.retryNonIdempotent || IDEMPOTENT_METHODS.includes(method);
}

/**
 * Whether a `Retry-After` header on this failure is one to honor.
 *
 * @remarks
 * Only on `429` and `503`, and only when the policy asks for it. A `500` carrying a
 * `Retry-After` does not get to dictate the caller's schedule.
 * @internal
 */
export function honorsRetryAfter(
  reason: FetchFailureReason | undefined,
  policy: IResolvedRetryPolicy
): boolean {
  return (
    policy.respectRetryAfter && reason?.kind === 'http-status' && RETRY_AFTER_STATUSES.includes(reason.status)
  );
}

/**
 * Parses a `Retry-After` header value into milliseconds.
 *
 * @remarks
 * Both RFC 9110 forms: delta-seconds, and an HTTP-date which is converted to a delay relative
 * to `nowMs`. An unparseable value, a negative delta, or a date already in the past yields
 * `undefined` — "the server said nothing usable", which falls back to ordinary backoff rather
 * than to zero delay. Returning `0` for a past date would let a stale clock produce a hot loop.
 *
 * The value is **not** clamped here. Clamping belongs with the rest of the delay arithmetic in
 * {@link computeRetryDelayMs}, so there is exactly one place the ceiling is applied.
 * @internal
 */
export function parseRetryAfterMs(value: string | undefined, nowMs: number): number | undefined {
  const text = (value ?? '').trim();
  if (text.length === 0) {
    return undefined;
  }
  // Digits only: a delta-seconds value. Tested before `Date.parse`, which accepts bare numbers
  // as years in some engines and would read `Retry-After: 120` as the year 120.
  if (/^\d+$/.test(text)) {
    return Number(text) * 1000;
  }
  const at = Date.parse(text);
  if (Number.isNaN(at)) {
    return undefined;
  }
  const delay = at - nowMs;
  return delay > 0 ? delay : undefined;
}

/** Inputs to {@link computeRetryDelayMs}. @internal */
export interface IRetryDelayParams {
  /** 0-based index of the retry about to be scheduled: `0` is the first retry. */
  readonly attempt: number;
  readonly policy: IResolvedRetryPolicy;
  /** A honored, parsed `Retry-After`, in milliseconds, when the server sent a usable one. */
  readonly retryAfterMs?: number;
  /** Injected for determinism in tests; the call path passes `Math.random`. */
  readonly random: () => number;
}

/**
 * Computes how long to wait before the next attempt.
 *
 * @remarks
 * **Exponential backoff with full jitter**: the delay is uniform on `[0, cap)` where `cap` is
 * `baseDelayMs * 2^attempt` bounded by `maxDelayMs`. Full jitter rather than a fixed backoff
 * because every caller that failed against the same struggling host would otherwise retry in
 * the same instant, which is the thundering herd the backoff was supposed to prevent.
 *
 * **A honored `Retry-After` replaces the computed backoff and is clamped to `maxDelayMs`.** The
 * clamp is not a rounding detail: `Retry-After` is chosen by the server, which in this threat
 * model may be the adversary, so an unclamped `Retry-After: 86400` is a day-long sleep the
 * caller never agreed to. Jitter is not applied to it — the server named an instant, and
 * scattering around it is the caller's herd problem, not the server's instruction.
 *
 * `2 ** attempt` overflows to `Infinity` for a large enough `attempt`; `Math.min` with a finite
 * ceiling absorbs that, which is why the cap is computed in this order.
 * @internal
 */
export function computeRetryDelayMs(params: IRetryDelayParams): number {
  const { attempt, policy, random } = params;
  const retryAfterMs = params.retryAfterMs ?? undefined;
  if (retryAfterMs !== undefined) {
    return Math.min(retryAfterMs, policy.maxDelayMs);
  }
  const cap = Math.min(policy.baseDelayMs * 2 ** attempt, policy.maxDelayMs);
  return random() * cap;
}
