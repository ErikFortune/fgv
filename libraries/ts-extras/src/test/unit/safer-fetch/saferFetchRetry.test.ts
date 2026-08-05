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
 * Retry on the request path: that the rules in `retry.test.ts` are actually consulted, and that
 * an attempt is a full re-walk rather than a resume.
 *
 * Delays are configured in single-digit milliseconds throughout, so these tests measure
 * behaviour rather than waiting on a backoff. The one place a duration is asserted is the
 * `Retry-After` clamp, where the unclamped value would be an hour and the test's own timeout is
 * the assertion.
 */

import '@fgv/ts-utils-jest';

import { Logging, fail, succeed, type Result } from '@fgv/ts-utils';

import { SaferFetch } from '../../..';
import { mockTransport, neverResponds, type IMockTransport, type IRecordedCall } from './mockTransport';

const { allowAnyAddress, saferFetchText } = SaferFetch;

const URL_UNDER_TEST: string = 'https://example.com/thing';

function options(
  transport: SaferFetch.IFetchTransport,
  overrides?: Partial<SaferFetch.ISaferFetchOptions>
): SaferFetch.ISaferFetchOptions {
  return {
    addressGuard: allowAnyAddress(),
    transport,
    retry: { attempts: 2, baseDelayMs: 1, maxDelayMs: 2 },
    ...overrides
  };
}

function ok(text: string): Response {
  return new Response(text, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

function status(code: number, headers?: Record<string, string>): Response {
  return new Response(null, { status: code, statusText: `status ${code}`, headers });
}

/** A transport that answers the nth call with the nth scripted response. */
function answering(...responses: ReadonlyArray<() => Response>): IMockTransport {
  let index: number = 0;
  return mockTransport(() => {
    const responder = responses[Math.min(index, responses.length - 1)];
    index += 1;
    return succeed(responder());
  });
}

/** A transport whose every call fails at the transport layer. */
function alwaysNetworkFailure(): IMockTransport {
  return mockTransport(() => fail('connection reset'));
}

/**
 * An address guard that records every chain it was handed, so "did the guard re-run, and did it
 * re-run from hop 0?" is answerable from the recording rather than from a call count.
 */
interface IRecordingGuard extends SaferFetch.IAddressGuard {
  /** One entry per invocation: the URLs of the chain the guard was shown, oldest first. */
  readonly chains: ReadonlyArray<ReadonlyArray<string>>;
}

function recordingAddressGuard(): IRecordingGuard {
  const chains: string[][] = [];
  return {
    name: 'recordingGuard',
    chains,
    check: async (
      chain: ReadonlyArray<SaferFetch.IRequestHop>
    ): Promise<Result<SaferFetch.IGuardVerdict>> => {
      chains.push(chain.map((hop) => hop.url.toString()));
      return succeed({ url: chain[chain.length - 1].url });
    }
  };
}

describe('retry', () => {
  describe('is off unless asked for', () => {
    test('a failing call is not retried when no policy is supplied', async () => {
      const transport = alwaysNetworkFailure();
      await expect(
        saferFetchText(URL_UNDER_TEST, { addressGuard: allowAnyAddress(), transport })
      ).resolves.toFailWith(/connection reset/i);
      expect(transport.calls).toHaveLength(1);
    });

    test('attempts: 0 is a policy that disables retry rather than an invalid one', async () => {
      const transport = alwaysNetworkFailure();
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { retry: { attempts: 0 } }))
      ).resolves.toFail();
      expect(transport.calls).toHaveLength(1);
    });
  });

  describe('the attempt budget', () => {
    test('attempts counts additional attempts, not the total', async () => {
      const transport = alwaysNetworkFailure();
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { retry: { attempts: 2, baseDelayMs: 1 } }))
      ).resolves.toFailWithDetail(/connection reset/i, { kind: 'network', detail: 'connection reset' });
      expect(transport.calls).toHaveLength(3);
    });

    test('stops as soon as an attempt succeeds', async () => {
      const transport = answering(
        () => status(503),
        () => ok('recovered')
      );
      await expect(saferFetchText(URL_UNDER_TEST, options(transport))).resolves.toSucceedAndSatisfy(
        (response: SaferFetch.ISaferFetchResponse<string>) => {
          expect(response.value).toBe('recovered');
        }
      );
      expect(transport.calls).toHaveLength(2);
    });

    test('reports the last attempt’s failure, not the first', async () => {
      const transport = answering(
        () => status(503),
        () => status(500)
      );
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { retry: { attempts: 1, baseDelayMs: 1 } }))
      ).resolves.toFailWithDetail(/returned 500/i, {
        kind: 'http-status',
        status: 500,
        statusText: 'status 500'
      });
    });
  });

  describe('the guard re-runs on every attempt, from hop 0', () => {
    test('a retried call re-invokes the address guard with a chain that starts at hop 0', async () => {
      const guard = recordingAddressGuard();
      const transport = answering(
        () => status(503),
        () => status(503),
        () => ok('finally')
      );
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { addressGuard: guard }))
      ).resolves.toSucceed();

      // Three attempts, three independent guard evaluations. A cached verdict would show one.
      expect(guard.chains).toHaveLength(3);
      // Every one of them a fresh walk beginning at the caller's URL: a resume would show a
      // chain that started somewhere else, and a cached verdict would show no chain at all.
      expect(guard.chains).toEqual([[URL_UNDER_TEST], [URL_UNDER_TEST], [URL_UNDER_TEST]]);
      expect(transport.calls).toHaveLength(3);
    });

    test('a retry re-walks a redirect chain from hop 0 rather than resuming it', async () => {
      const guard = recordingAddressGuard();
      const first: string = 'https://first.example/a';
      const second: string = 'https://second.example/b';
      // The second host answers 503 on its first visit and 200 on its second, so the call can
      // only succeed if the retry re-walked the chain rather than resuming at the failed hop.
      let secondVisits: number = 0;
      const transport = mockTransport((call: IRecordedCall) => {
        if (call.url.toString() === first) {
          return succeed(new Response(null, { status: 302, headers: { location: second } }));
        }
        secondVisits += 1;
        return succeed(secondVisits === 1 ? status(503) : ok('second time lucky'));
      });

      await expect(
        saferFetchText(
          first,
          options(transport, { addressGuard: guard, redirectPolicy: 'validate-each-hop' })
        )
      ).resolves.toSucceedAndSatisfy((response: SaferFetch.ISaferFetchResponse<string>) => {
        expect(response.value).toBe('second time lucky');
        expect(response.urlChain).toEqual([first, second]);
      });

      // Four evaluations: hops 0 and 1 of attempt 1, then hops 0 and 1 of attempt 2. The retry
      // re-requested `first` — a resume would have gone straight back to `second` and the guard
      // would have seen three chains, the third of them starting mid-chain.
      expect(guard.chains).toEqual([[first], [first, second], [first], [first, second]]);
      expect(transport.calls.map((c) => c.url.toString())).toEqual([first, second, first, second]);
    });

    test('a guard that refuses on the retry stops the call there', async () => {
      // The reason the re-walk matters: the guard's answer is allowed to change between
      // attempts, and the second answer is the one that governs the second connect.
      let checks: number = 0;
      const guard: SaferFetch.IAddressGuard = {
        name: 'changesItsMind',
        check: async (
          chain: ReadonlyArray<SaferFetch.IRequestHop>
        ): Promise<Result<SaferFetch.IGuardVerdict>> => {
          checks += 1;
          return checks === 1 ? succeed({ url: chain[chain.length - 1].url }) : fail('now private');
        }
      };
      const transport = answering(() => status(503));

      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { addressGuard: guard }))
      ).resolves.toFailWithDetail(/now private/i, {
        kind: 'blocked-by-guard',
        url: URL_UNDER_TEST,
        hop: 0,
        guard: 'changesItsMind',
        detail: 'now private'
      });
      // One connect, two guard evaluations: the second attempt was guarded and refused before
      // anything reached the wire.
      expect(transport.calls).toHaveLength(1);
      expect(checks).toBe(2);
    });

    test('a retried attempt sends the caller’s original headers, not a stripped carry-over', async () => {
      // Attempt state does not survive: the first attempt's cross-origin hop stripped the
      // credential, and the second attempt starts from the caller's request again.
      const first: string = 'https://first.example/a';
      const other: string = 'https://other.example/b';
      let firstVisits: number = 0;
      const transport = mockTransport((call: IRecordedCall) => {
        if (call.url.toString() === first) {
          firstVisits += 1;
          return succeed(
            firstVisits === 1 ? new Response(null, { status: 302, headers: { location: other } }) : ok('done')
          );
        }
        return succeed(status(503));
      });

      await expect(
        saferFetchText(
          first,
          options(transport, {
            redirectPolicy: 'validate-each-hop',
            headers: { authorization: 'Bearer secret' }
          })
        )
      ).resolves.toSucceed();

      const sent = transport.calls.map((c) => new Headers(c.init.headers).get('authorization'));
      // Hop 0 carries it; the cross-origin hop does not; the retry's hop 0 carries it again.
      expect(sent).toEqual(['Bearer secret', null, 'Bearer secret']);
    });
  });

  describe('the retryable set on the request path', () => {
    test.each([408, 429, 500, 502, 503, 504])('retries a %i response', async (code: number) => {
      const transport = answering(
        () => status(code),
        () => ok('recovered')
      );
      await expect(saferFetchText(URL_UNDER_TEST, options(transport))).resolves.toSucceed();
      expect(transport.calls).toHaveLength(2);
    });

    test.each([400, 401, 403, 404, 410])('does not retry a %i response', async (code: number) => {
      const transport = answering(() => status(code));
      await expect(saferFetchText(URL_UNDER_TEST, options(transport))).resolves.toFail();
      expect(transport.calls).toHaveLength(1);
    });

    test('retries a headers-phase timeout', async () => {
      // The attempt-scoped headers deadline must not stop the whole call, or a timeout — the
      // failure retry exists for — could never be retried.
      let calls: number = 0;
      const transport = mockTransport(async (call: IRecordedCall) => {
        calls += 1;
        if (calls === 1) {
          return new Promise<Result<Response>>((resolve) => {
            call.init.signal?.addEventListener('abort', () => resolve(fail('aborted')));
          });
        }
        return succeed(ok('answered on the retry'));
      });

      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { headersTimeoutMs: 20, timeoutMs: 5_000 }))
      ).resolves.toSucceedAndSatisfy((response: SaferFetch.ISaferFetchResponse<string>) => {
        expect(response.value).toBe('answered on the retry');
      });
      expect(transport.calls).toHaveLength(2);
    });

    test('does not retry a guard block', async () => {
      const transport = answering(() => ok('never reached'));
      const guard: SaferFetch.IAddressGuard = {
        name: 'alwaysRefuses',
        check: async (): Promise<Result<SaferFetch.IGuardVerdict>> => fail('private address')
      };
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { addressGuard: guard }))
      ).resolves.toFailWith(/private address/i);
      expect(transport.calls).toHaveLength(0);
    });

    test('does not retry a caller abort', async () => {
      const controller = new AbortController();
      const transport = neverResponds();
      const pending = saferFetchText(URL_UNDER_TEST, options(transport, { signal: controller.signal }));
      // A tick, so the request is genuinely in flight when the abort lands — aborting before the
      // first await would test the pre-flight path rather than the cancellation one.
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
      controller.abort();
      await expect(pending).resolves.toFailWithDetail(/aborted by caller/i, { kind: 'aborted' });
      expect(transport.calls).toHaveLength(1);
    });

    test('does not retry an over-cap response', async () => {
      // Retrying `too-large` re-downloads up to the cap every time, turning a defense into an
      // amplifier aimed at the caller's own bandwidth.
      const transport = answering(() => ok('0123456789'));
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { maxResponseBytes: 4 }))
      ).resolves.toFailWith(/cap/i);
      expect(transport.calls).toHaveLength(1);
    });
  });

  describe('the idempotency rule on the request path', () => {
    test('does not retry a POST by default', async () => {
      const transport = answering(() => status(503));
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { method: 'POST', body: 'payload' }))
      ).resolves.toFail();
      expect(transport.calls).toHaveLength(1);
    });

    test('retries a POST once retryNonIdempotent is set', async () => {
      const transport = answering(
        () => status(503),
        () => ok('accepted')
      );
      await expect(
        saferFetchText(
          URL_UNDER_TEST,
          options(transport, {
            method: 'POST',
            body: 'payload',
            retry: { attempts: 1, baseDelayMs: 1, retryNonIdempotent: true }
          })
        )
      ).resolves.toSucceed();
      expect(transport.calls).toHaveLength(2);
    });

    test('a retried request carries the same body', async () => {
      const transport = answering(
        () => status(503),
        () => ok('accepted')
      );
      await expect(
        saferFetchText(
          URL_UNDER_TEST,
          options(transport, {
            method: 'PUT',
            body: 'payload',
            retry: { attempts: 1, baseDelayMs: 1, retryNonIdempotent: true }
          })
        )
      ).resolves.toSucceed();
      expect(transport.calls.map((c) => c.init.body)).toEqual(['payload', 'payload']);
    });
  });

  describe('Retry-After on the request path', () => {
    test('is clamped to maxDelayMs', async () => {
      // Unclamped, this call would sleep for an hour and the test would time out. The assertion
      // is that it completes at all — and quickly.
      const transport = answering(
        () => status(503, { 'retry-after': '3600' }),
        () => ok('recovered')
      );
      const startedAt: number = Date.now();
      await expect(
        saferFetchText(
          URL_UNDER_TEST,
          options(transport, { retry: { attempts: 1, baseDelayMs: 1, maxDelayMs: 5 } })
        )
      ).resolves.toSucceed();
      expect(Date.now() - startedAt).toBeLessThan(1_000);
      expect(transport.calls).toHaveLength(2);
    });

    test('a Retry-After longer than the remaining budget fails now rather than sleeping past it', async () => {
      const transport = answering(() => status(503, { 'retry-after': '3600' }));
      const startedAt: number = Date.now();
      await expect(
        saferFetchText(
          URL_UNDER_TEST,
          options(transport, {
            timeoutMs: 5_000,
            // A ceiling above the remaining budget, so the clamp cannot rescue this one.
            retry: { attempts: 1, baseDelayMs: 1, maxDelayMs: 60_000 }
          })
        )
      ).resolves.toFailWith(/returned 503/i);
      expect(Date.now() - startedAt).toBeLessThan(1_000);
      expect(transport.calls).toHaveLength(1);
    });

    test('is ignored when respectRetryAfter is off', async () => {
      const transport = answering(
        () => status(503, { 'retry-after': '3600' }),
        () => ok('recovered')
      );
      await expect(
        saferFetchText(
          URL_UNDER_TEST,
          options(transport, {
            retry: { attempts: 1, baseDelayMs: 1, maxDelayMs: 60_000, respectRetryAfter: false }
          })
        )
      ).resolves.toSucceed();
      expect(transport.calls).toHaveLength(2);
    });
  });

  describe('the overall deadline is the ceiling', () => {
    test('retries do not extend the deadline', async () => {
      const transport = mockTransport(
        async (call: IRecordedCall) =>
          new Promise<Result<Response>>((resolve) => {
            call.init.signal?.addEventListener('abort', () => resolve(fail('aborted')));
          })
      );
      const startedAt: number = Date.now();
      await expect(
        saferFetchText(
          URL_UNDER_TEST,
          options(transport, {
            timeoutMs: 60,
            headersTimeoutMs: 20,
            // Twenty attempts at a one-second floor would be twenty seconds if the deadline did
            // not govern; it governs, so this finishes inside the 60ms budget plus slack.
            retry: { attempts: 20, baseDelayMs: 1_000, maxDelayMs: 1_000 }
          })
        )
      ).resolves.toFailWith(/timed out/i);
      expect(Date.now() - startedAt).toBeLessThan(1_000);
    });

    test('an exhausted deadline fails with the attempt’s own failure', async () => {
      const transport = answering(() => status(503));
      await expect(
        saferFetchText(
          URL_UNDER_TEST,
          options(transport, { timeoutMs: 30, retry: { attempts: 5, baseDelayMs: 10_000 } })
        )
      ).resolves.toFailWithDetail(/returned 503/i, {
        kind: 'http-status',
        status: 503,
        statusText: 'status 503'
      });
      expect(transport.calls).toHaveLength(1);
    });

    test('a caller abort during a backoff is answered during the backoff', async () => {
      const controller = new AbortController();
      const transport = answering(() => status(503));
      const pending = saferFetchText(
        URL_UNDER_TEST,
        options(transport, {
          signal: controller.signal,
          timeoutMs: 10_000,
          retry: { attempts: 1, baseDelayMs: 400, maxDelayMs: 400 }
        })
      );
      // Inside the 400ms backoff, after the first attempt has certainly failed.
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
      controller.abort();
      const startedAt: number = Date.now();
      await expect(pending).resolves.toFailWithDetail(/aborted by caller/i, { kind: 'aborted' });
      // Answered promptly rather than after the remaining backoff elapsed.
      expect(Date.now() - startedAt).toBeLessThan(300);
      expect(transport.calls).toHaveLength(1);
    });
  });

  describe('invalid policies', () => {
    test('a malformed retry policy fails the call before anything is requested', async () => {
      const transport = answering(() => ok('never reached'));
      await expect(
        saferFetchText(URL_UNDER_TEST, options(transport, { retry: { attempts: -1 } }))
      ).resolves.toFailWithDetail(/attempts must be a non-negative integer/i, {
        kind: 'unknown',
        detail: expect.stringMatching(/attempts must be a non-negative integer/i) as unknown as string
      });
      expect(transport.calls).toHaveLength(0);
    });
  });

  describe('diagnostics', () => {
    test('logs each retry with the failure that prompted it', async () => {
      const logger = new Logging.InMemoryLogger('all');
      const transport = answering(
        () => status(503),
        () => ok('recovered')
      );
      await expect(saferFetchText(URL_UNDER_TEST, options(transport, { logger }))).resolves.toSucceed();
      expect(logger.logged.join('\n')).toMatch(/retrying in \d+ms — attempt 2 of 3/i);
    });
  });
});
