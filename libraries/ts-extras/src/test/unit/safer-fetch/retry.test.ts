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
 * The retry *rules*, tested where they live: as pure functions over a failure reason, a method,
 * a policy and a clock. The rules are decisions rather than arithmetic details, so each gets its
 * own assertion, and the delay computation is exercised with an injected `random` so a jittered
 * value is a fact rather than a range.
 *
 * The wiring — that these rules are actually consulted on the request path — is tested end to
 * end in `saferFetchRetry.test.ts`.
 */

import '@fgv/ts-utils-jest';

/* eslint-disable @rushstack/packlets/mechanics */
import {
  computeRetryDelayMs,
  honorsRetryAfter,
  isRetryableFailure,
  isRetryableMethod,
  parseRetryAfterMs,
  resolveRetryPolicy,
  type IResolvedRetryPolicy
} from '../../../packlets/safer-fetch/retry';
import type { FetchFailureReason } from '../../../packlets/safer-fetch/failureReason';
import type { SaferFetchMethod } from '../../../packlets/safer-fetch/model';
/* eslint-enable @rushstack/packlets/mechanics */

function policy(overrides?: Partial<IResolvedRetryPolicy>): IResolvedRetryPolicy {
  return {
    attempts: 3,
    baseDelayMs: 100,
    maxDelayMs: 5_000,
    retryNonIdempotent: false,
    respectRetryAfter: true,
    ...overrides
  };
}

describe('retry policy resolution', () => {
  test('an absent policy resolves to zero attempts, so retry is off by default', () => {
    expect(resolveRetryPolicy()).toSucceedAndSatisfy((resolved: IResolvedRetryPolicy) => {
      expect(resolved.attempts).toBe(0);
    });
  });

  test('a null policy is treated as absent rather than as installed', () => {
    // A JavaScript caller, or an `unknown` escape hatch, can supply `null`; every other option
    // in this packlet treats it as absence and this one must not differ.
    expect(resolveRetryPolicy(null as unknown as undefined)).toSucceedAndSatisfy(
      (resolved: IResolvedRetryPolicy) => {
        expect(resolved.attempts).toBe(0);
      }
    );
  });

  test('applies the documented defaults', () => {
    expect(resolveRetryPolicy({ attempts: 2 })).toSucceedWith({
      attempts: 2,
      baseDelayMs: 250,
      maxDelayMs: 5_000,
      retryNonIdempotent: false,
      respectRetryAfter: true
    });
  });

  test('carries the caller-supplied values through', () => {
    expect(
      resolveRetryPolicy({
        attempts: 1,
        baseDelayMs: 10,
        maxDelayMs: 20,
        retryNonIdempotent: true,
        respectRetryAfter: false
      })
    ).toSucceedWith({
      attempts: 1,
      baseDelayMs: 10,
      maxDelayMs: 20,
      retryNonIdempotent: true,
      respectRetryAfter: false
    });
  });

  test.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 'two' as unknown as number])(
    'rejects attempts of %p',
    (attempts: number) => {
      expect(resolveRetryPolicy({ attempts })).toFailWith(/attempts must be a non-negative integer/i);
    }
  );

  test.each([Number.NaN, Number.POSITIVE_INFINITY, -1])('rejects a baseDelayMs of %p', (ms: number) => {
    // A `NaN` delay becomes `setTimeout(NaN)`, which fires immediately — a backoff that silently
    // becomes a tight loop against a service that is already struggling.
    expect(resolveRetryPolicy({ attempts: 1, baseDelayMs: ms })).toFailWith(
      /baseDelayMs must be a non-negative finite number/i
    );
  });

  test.each([Number.NaN, Number.POSITIVE_INFINITY, -1])('rejects a maxDelayMs of %p', (ms: number) => {
    expect(resolveRetryPolicy({ attempts: 1, maxDelayMs: ms })).toFailWith(
      /maxDelayMs must be a non-negative finite number/i
    );
  });
});

describe('the retryable set', () => {
  test.each<FetchFailureReason>([
    { kind: 'network', detail: 'connection reset' },
    { kind: 'timeout', phase: 'headers', elapsedMs: 1, limitMs: 1 },
    { kind: 'http-status', status: 408, statusText: 'Request Timeout' },
    { kind: 'http-status', status: 429, statusText: 'Too Many Requests' },
    { kind: 'http-status', status: 500, statusText: 'Internal Server Error' },
    { kind: 'http-status', status: 502, statusText: 'Bad Gateway' },
    { kind: 'http-status', status: 503, statusText: 'Service Unavailable' },
    { kind: 'http-status', status: 504, statusText: 'Gateway Timeout' }
  ])('retries $kind', (reason: FetchFailureReason) => {
    expect(isRetryableFailure(reason)).toBe(true);
  });

  test.each<FetchFailureReason>([
    { kind: 'blocked-by-guard', url: 'https://x/', hop: 0, guard: 'g', detail: 'no' },
    { kind: 'invalid-url', url: 'nope', detail: 'bad' },
    { kind: 'too-large', bytesRead: 10, limit: 5 },
    { kind: 'unsupported-content-type', accepted: ['application/json'] },
    { kind: 'aborted' },
    { kind: 'parse', detail: 'bad json' },
    { kind: 'decode', detail: 'bad bytes' },
    { kind: 'too-many-redirects', hops: 6, limit: 5 },
    { kind: 'redirect-rejected', url: 'https://x/', status: 302 },
    { kind: 'redirect-opaque' },
    { kind: 'unknown', detail: 'something' }
  ])('never retries $kind', (reason: FetchFailureReason) => {
    expect(isRetryableFailure(reason)).toBe(false);
  });

  test.each([400, 401, 403, 404, 409, 418, 422, 451])('never retries HTTP %i', (status: number) => {
    // Every other 4xx is terminal: it means the same thing on the second attempt as on the first.
    expect(isRetryableFailure({ kind: 'http-status', status, statusText: '' })).toBe(false);
  });

  test('does not retry a failure it could not classify', () => {
    // A failure carrying no detail is one this primitive cannot explain, and the whole basis for
    // retrying is knowing what went wrong.
    expect(isRetryableFailure(undefined)).toBe(false);
  });
});

describe('the idempotency rule', () => {
  test.each<SaferFetchMethod>(['GET', 'HEAD'])('retries %s by default', (method: SaferFetchMethod) => {
    expect(isRetryableMethod(method, policy())).toBe(true);
  });

  test.each<SaferFetchMethod>(['POST', 'PUT', 'PATCH', 'DELETE'])(
    'does not retry %s without retryNonIdempotent',
    (method: SaferFetchMethod) => {
      // A timeout does not say whether the server processed the request, so a retried POST can
      // double-charge.
      expect(isRetryableMethod(method, policy())).toBe(false);
    }
  );

  test.each<SaferFetchMethod>(['POST', 'PUT', 'PATCH', 'DELETE'])(
    'retries %s once retryNonIdempotent is set',
    (method: SaferFetchMethod) => {
      expect(isRetryableMethod(method, policy({ retryNonIdempotent: true }))).toBe(true);
    }
  );
});

describe('Retry-After', () => {
  const NOW: number = Date.parse('2026-08-05T12:00:00Z');

  test.each([429, 503])('is honored on %i', (status: number) => {
    expect(honorsRetryAfter({ kind: 'http-status', status, statusText: '' }, policy())).toBe(true);
  });

  test.each([408, 500, 502, 504])('is ignored on %i', (status: number) => {
    // Specified for 429 and 503; honoring it elsewhere would let any failing endpoint dictate
    // the caller's schedule for no benefit.
    expect(honorsRetryAfter({ kind: 'http-status', status, statusText: '' }, policy())).toBe(false);
  });

  test('is ignored on a non-http-status failure', () => {
    expect(honorsRetryAfter({ kind: 'network', detail: 'reset' }, policy())).toBe(false);
  });

  test('is ignored on a failure with no detail', () => {
    expect(honorsRetryAfter(undefined, policy())).toBe(false);
  });

  test('is ignored when respectRetryAfter is off', () => {
    expect(
      honorsRetryAfter(
        { kind: 'http-status', status: 503, statusText: '' },
        policy({ respectRetryAfter: false })
      )
    ).toBe(false);
  });

  test('parses delta-seconds', () => {
    expect(parseRetryAfterMs('120', NOW)).toBe(120_000);
    expect(parseRetryAfterMs('  7  ', NOW)).toBe(7_000);
    expect(parseRetryAfterMs('0', NOW)).toBe(0);
  });

  test('parses an HTTP-date as a delay from now', () => {
    expect(parseRetryAfterMs('Wed, 05 Aug 2026 12:00:30 GMT', NOW)).toBe(30_000);
  });

  test('treats a date already in the past as no advice rather than as zero', () => {
    // Zero would let a stale clock — or a server whose clock is ahead of ours — produce a hot
    // retry loop. Falling back to ordinary backoff is the safe reading.
    expect(parseRetryAfterMs('Wed, 05 Aug 2026 11:59:30 GMT', NOW)).toBeUndefined();
  });

  test.each(['', '   ', 'soon', '-5', '1.5', 'Wed, 32 Aug 2026 12:00:00 GMT'])(
    'yields no advice for %p',
    (value: string) => {
      expect(parseRetryAfterMs(value, NOW)).toBeUndefined();
    }
  );

  test('yields no advice when the header was absent', () => {
    expect(parseRetryAfterMs(undefined, NOW)).toBeUndefined();
  });

  test('reads a bare number as delta-seconds, never as a year', () => {
    // `Date.parse('120')` is a year in some engines, which would turn a two-minute delay into a
    // date nineteen centuries ago — and then into "no advice" — so digits are tested first.
    expect(parseRetryAfterMs('120', NOW)).toBe(120_000);
  });
});

describe('delay computation', () => {
  test('is exponential with full jitter: uniform on [0, cap)', () => {
    const p = policy({ baseDelayMs: 100, maxDelayMs: 5_000 });
    // Full jitter rather than a fixed backoff: every caller that failed against the same
    // struggling host would otherwise retry in the same instant.
    expect(computeRetryDelayMs({ attempt: 0, policy: p, random: () => 1 })).toBe(100);
    expect(computeRetryDelayMs({ attempt: 1, policy: p, random: () => 1 })).toBe(200);
    expect(computeRetryDelayMs({ attempt: 2, policy: p, random: () => 1 })).toBe(400);
    expect(computeRetryDelayMs({ attempt: 2, policy: p, random: () => 0.5 })).toBe(200);
    expect(computeRetryDelayMs({ attempt: 2, policy: p, random: () => 0 })).toBe(0);
  });

  test('caps the exponential growth at maxDelayMs', () => {
    const p = policy({ baseDelayMs: 100, maxDelayMs: 250 });
    expect(computeRetryDelayMs({ attempt: 10, policy: p, random: () => 1 })).toBe(250);
  });

  test('survives an attempt count large enough to overflow the exponential', () => {
    // `2 ** 2000` is `Infinity`; the cap is applied in the order that absorbs it.
    const p = policy({ baseDelayMs: 100, maxDelayMs: 250 });
    expect(computeRetryDelayMs({ attempt: 2_000, policy: p, random: () => 1 })).toBe(250);
  });

  test('a honored Retry-After replaces the computed backoff, unjittered', () => {
    const p = policy({ baseDelayMs: 100, maxDelayMs: 5_000 });
    expect(computeRetryDelayMs({ attempt: 0, policy: p, retryAfterMs: 1_500, random: () => 0 })).toBe(1_500);
  });

  test('clamps Retry-After to maxDelayMs', () => {
    // The load-bearing one: `Retry-After` is chosen by a server this threat model treats as
    // potentially hostile, so an unclamped `Retry-After: 86400` is a day-long denial of service
    // on the caller.
    const p = policy({ maxDelayMs: 5_000 });
    expect(computeRetryDelayMs({ attempt: 0, policy: p, retryAfterMs: 86_400_000, random: () => 1 })).toBe(
      5_000
    );
  });
});
