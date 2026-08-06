/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import 'jest-extended';
import '../helpers/jest';

import {
  AsyncDetailedResult,
  AsyncResult,
  DetailedResult,
  IResultReporter,
  MessageAggregator,
  Result,
  succeed,
  failWithDetail,
  succeedWithDetail
} from '../../packlets/base';

/** A failure taxonomy standing in for the kind of detail a real consumer carries. */
type Reason = 'network' | 'parse' | 'timeout';

describe('AsyncDetailedResult module', () => {
  /**
   * The bug this module closes type-checked, so the runtime tests below could all have passed
   * against the broken code. These assertions are the ones that could not: before the
   * `thenOnSuccess` / `thenOnFailure` overrides existed, a detailed result inherited
   * `Success.thenOnSuccess` and produced `AsyncResult<TN>`, whose awaited type is `Result<TN>` —
   * and `Equals<Result<TN>, DetailedResult<TN, Reason>>` is `false`, so every `Assert<true>`
   * here fails to compile.
   *
   * `Equals` uses the conditional-type identity trick rather than mutual `extends`, because
   * `DetailedResult<T, TD>` *is* assignable to `Result<T>` — a bivariant check would pass
   * against the very bug under test.
   */
  describe('type-level detail preservation', () => {
    type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;
    type Assert<T extends true> = T;

    test('the chained types are asserted at compile time', async () => {
      // `thenOnSuccess` off a DetailedSuccess keeps TD and mutates only the success type.
      const fromSuccess: AsyncDetailedResult<number, Reason> = succeedWithDetail<string, Reason>(
        'x'
      ).thenOnSuccess(async (v) => succeedWithDetail<number, Reason>(v.length));
      type _S = Assert<Equals<Awaited<typeof fromSuccess>, DetailedResult<number, Reason>>>;

      // `thenOnSuccess` off a DetailedFailure keeps TD across the skipped callback.
      const fromFailure: AsyncDetailedResult<number, Reason> = failWithDetail<string, Reason>(
        'nope',
        'network'
      ).thenOnSuccess(async (v) => succeedWithDetail<number, Reason>(v.length));
      type _F = Assert<Equals<Awaited<typeof fromFailure>, DetailedResult<number, Reason>>>;

      // `thenOnFailure` keeps TD on the recovery path.
      const fromRecovery: AsyncDetailedResult<string, Reason> = failWithDetail<string, Reason>(
        'nope',
        'timeout'
      ).thenOnFailure(async () => succeedWithDetail<string, Reason>('recovered'));
      type _R = Assert<Equals<Awaited<typeof fromRecovery>, DetailedResult<string, Reason>>>;

      // A mixed sync/async ladder keeps TD all the way down.
      const fromLadder: AsyncDetailedResult<boolean, Reason> = succeedWithDetail<string, Reason>('x')
        .thenOnSuccess(async (v) => succeedWithDetail<number, Reason>(v.length))
        .onSuccess((n) => succeedWithDetail<boolean, Reason>(n > 0))
        .thenOnSuccess(async (b) => succeedWithDetail<boolean, Reason>(!b));
      type _L = Assert<Equals<Awaited<typeof fromLadder>, DetailedResult<boolean, Reason>>>;

      // The negative control: the plain-`Result` path is untouched and still yields `Result<T>`,
      // which is what makes this extension additive rather than a change in disguise.
      const fromPlain: AsyncResult<number> = succeed('x').thenOnSuccess(async (v) => succeed(v.length));
      type _P = Assert<Equals<Awaited<typeof fromPlain>, Result<number>>>;

      // Consume the aliases so `noUnusedLocals` stays satisfied without weakening the checks.
      const asserted: [_S, _F, _R, _L, _P] = [true, true, true, true, true];
      expect(asserted).toHaveLength(5);

      // The chains are awaited as well, so a compile-time-only regression cannot hide behind an
      // assertion that never ran.
      expect(await fromSuccess).toSucceedWith(1);
      expect(await fromFailure).toFailWith(/nope/);
      expect(await fromRecovery).toSucceedWith('recovered');
      expect(await fromLadder).toSucceedWith(false);
      expect(await fromPlain).toSucceedWith(1);
    });
  });

  describe('AsyncDetailedResult class', () => {
    describe('constructor rejection normalization', () => {
      test('converts a rejected promise to a DetailedFailure with no detail', async () => {
        const result = await new AsyncDetailedResult<string, Reason>(Promise.reject(new Error('rejected')));
        expect(result).toFailWith(/rejected/);
        expect(result.detail).toBeUndefined();
      });

      test('converts a non-Error rejection to a DetailedFailure', async () => {
        const result = await new AsyncDetailedResult<string, Reason>(Promise.reject('string rejection'));
        expect(result).toFailWith(/string rejection/);
      });

      test('resolves a DetailedSuccess unchanged, detail intact', async () => {
        const result = await new AsyncDetailedResult<string, Reason>(
          Promise.resolve(succeedWithDetail<string, Reason>('ok', 'parse'))
        );
        expect(result).toSucceedWith('ok');
        expect(result.detail).toBe('parse');
      });
    });

    describe('fromDetailed', () => {
      test('wraps a DetailedSuccess, preserving its detail', async () => {
        const result = await AsyncDetailedResult.fromDetailed(
          succeedWithDetail<string, Reason>('ok', 'parse')
        );
        expect(result).toSucceedWith('ok');
        expect(result.detail).toBe('parse');
      });

      test('wraps a DetailedFailure, preserving its detail', async () => {
        const result = await AsyncDetailedResult.fromDetailed(
          failWithDetail<string, Reason>('bad', 'network')
        );
        expect(result).toFailWith(/bad/);
        expect(result.isFailure() && result.detail).toBe('network');
      });
    });

    describe('onSuccess', () => {
      test('invokes the continuation with the value and detail', async () => {
        const seen: Array<Reason | undefined> = [];
        const result = await AsyncDetailedResult.fromDetailed(
          succeedWithDetail<string, Reason>('hello', 'parse')
        ).onSuccess((v, d) => {
          seen.push(d);
          return succeedWithDetail<number, Reason>(v.length);
        });
        expect(seen).toEqual(['parse']);
        expect(result).toSucceedWith(5);
      });

      test('skips the continuation and preserves the failure detail', async () => {
        const cb = jest.fn();
        const result = await AsyncDetailedResult.fromDetailed(
          failWithDetail<string, Reason>('oops', 'network')
        ).onSuccess(cb);
        expect(cb).not.toHaveBeenCalled();
        expect(result).toFailWith(/oops/);
        expect(result.isFailure() && result.detail).toBe('network');
      });
    });

    describe('thenOnSuccess', () => {
      test('invokes the async continuation with the value and detail', async () => {
        const seen: Array<Reason | undefined> = [];
        const result = await AsyncDetailedResult.fromDetailed(
          succeedWithDetail<string, Reason>('hello', 'parse')
        ).thenOnSuccess(async (v, d) => {
          seen.push(d);
          return succeedWithDetail<number, Reason>(v.length, 'timeout');
        });
        expect(seen).toEqual(['parse']);
        expect(result).toSucceedWith(5);
        expect(result.detail).toBe('timeout');
      });

      test('propagates an upstream failure detail without invoking the continuation', async () => {
        const cb = jest.fn();
        const result = await AsyncDetailedResult.fromDetailed(
          failWithDetail<string, Reason>('oops', 'network')
        ).thenOnSuccess(cb);
        expect(cb).not.toHaveBeenCalled();
        expect(result).toFailWith(/oops/);
        expect(result.isFailure() && result.detail).toBe('network');
      });

      test('converts a rejected promise to a DetailedFailure with no detail', async () => {
        const result = await AsyncDetailedResult.fromDetailed(
          succeedWithDetail<string, Reason>('hello', 'parse')
        ).thenOnSuccess(async () => {
          throw new Error('boom');
        });
        expect(result).toFailWith(/boom/);
        expect(result.isFailure() && result.detail).toBeUndefined();
      });

      test('converts a synchronous throw to a DetailedFailure with no detail', async () => {
        const result = await AsyncDetailedResult.fromDetailed(
          succeedWithDetail<string, Reason>('hello', 'parse')
        ).thenOnSuccess((): Promise<DetailedResult<number, Reason>> => {
          throw new Error('sync boom');
        });
        expect(result).toFailWith(/sync boom/);
        expect(result.isFailure() && result.detail).toBeUndefined();
      });
    });

    describe('onFailure', () => {
      test('invokes the continuation with the message and detail', async () => {
        const seen: Array<Reason | undefined> = [];
        const result = await AsyncDetailedResult.fromDetailed(
          failWithDetail<string, Reason>('oops', 'network')
        ).onFailure((m, d) => {
          seen.push(d);
          return succeedWithDetail<string, Reason>(`recovered from ${m}`);
        });
        expect(seen).toEqual(['network']);
        expect(result).toSucceedWith('recovered from oops');
      });

      test('skips the continuation on success', async () => {
        const cb = jest.fn();
        const result = await AsyncDetailedResult.fromDetailed(
          succeedWithDetail<string, Reason>('ok', 'parse')
        ).onFailure(cb);
        expect(cb).not.toHaveBeenCalled();
        expect(result).toSucceedWith('ok');
      });
    });

    describe('thenOnFailure', () => {
      test('invokes the async continuation with the message and detail', async () => {
        const seen: Array<Reason | undefined> = [];
        const result = await AsyncDetailedResult.fromDetailed(
          failWithDetail<string, Reason>('oops', 'timeout')
        ).thenOnFailure(async (m, d) => {
          seen.push(d);
          return succeedWithDetail<string, Reason>(`recovered from ${m}`);
        });
        expect(seen).toEqual(['timeout']);
        expect(result).toSucceedWith('recovered from oops');
      });

      test('skips the continuation and preserves the success detail', async () => {
        const cb = jest.fn();
        const result = await AsyncDetailedResult.fromDetailed(
          succeedWithDetail<string, Reason>('ok', 'parse')
        ).thenOnFailure(cb);
        expect(cb).not.toHaveBeenCalled();
        expect(result).toSucceedWith('ok');
        expect(result.detail).toBe('parse');
      });

      test('converts a rejected promise to a DetailedFailure with no detail', async () => {
        const result = await AsyncDetailedResult.fromDetailed(
          failWithDetail<string, Reason>('oops', 'network')
        ).thenOnFailure(async () => {
          throw new Error('recovery boom');
        });
        expect(result).toFailWith(/recovery boom/);
        expect(result.isFailure() && result.detail).toBeUndefined();
      });

      test('converts a synchronous throw to a DetailedFailure with no detail', async () => {
        const result = await AsyncDetailedResult.fromDetailed(
          failWithDetail<string, Reason>('oops', 'network')
        ).thenOnFailure((): Promise<DetailedResult<string, Reason>> => {
          throw new Error('sync recovery boom');
        });
        expect(result).toFailWith(/sync recovery boom/);
        expect(result.isFailure() && result.detail).toBeUndefined();
      });
    });

    describe('withErrorFormat', () => {
      test('formats the message with access to the detail, keeping the detail', async () => {
        const result = await AsyncDetailedResult.fromDetailed(
          failWithDetail<string, Reason>('inner', 'network')
        ).withErrorFormat((msg, detail) => `[${detail}] ${msg}`);
        expect(result).toFailWith(/\[network\] inner/);
        expect(result.isFailure() && result.detail).toBe('network');
      });

      test('leaves a success untouched', async () => {
        const cb = jest.fn();
        const result = await AsyncDetailedResult.fromDetailed(
          succeedWithDetail<string, Reason>('ok', 'parse')
        ).withErrorFormat(cb);
        expect(cb).not.toHaveBeenCalled();
        expect(result).toSucceedWith('ok');
      });
    });

    describe('aggregateError', () => {
      test('appends a failure message and propagates the result', async () => {
        const errors = new MessageAggregator();
        const result = await AsyncDetailedResult.fromDetailed(
          failWithDetail<string, Reason>('bad', 'network')
        ).aggregateError(errors);
        expect(errors.messages).toEqual(['bad']);
        expect(result).toFailWith(/bad/);
      });

      test('passes the detail to the supplied formatter', async () => {
        const errors = new MessageAggregator();
        await AsyncDetailedResult.fromDetailed(failWithDetail<string, Reason>('bad', 'parse')).aggregateError(
          errors,
          (msg, detail) => `[${detail}] ${msg}`
        );
        expect(errors.messages).toEqual(['[parse] bad']);
      });

      test('aggregates nothing for a success', async () => {
        const errors = new MessageAggregator();
        const result = await AsyncDetailedResult.fromDetailed(
          succeedWithDetail<string, Reason>('ok', 'parse')
        ).aggregateError(errors);
        expect(errors.hasMessages).toBe(false);
        expect(result).toSucceedWith('ok');
      });
    });

    describe('report', () => {
      test('reports a failure with its detail and propagates the result', async () => {
        const reporter: IResultReporter<string, unknown> = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const result = await AsyncDetailedResult.fromDetailed(
          failWithDetail<string, Reason>('bad', 'network')
        ).report(reporter);
        expect(reporter.reportFailure).toHaveBeenCalledWith('error', 'bad', 'network');
        expect(result).toFailWith(/bad/);
      });

      test('reports a success with its detail and propagates the result', async () => {
        const reporter: IResultReporter<string, unknown> = {
          reportSuccess: jest.fn(),
          reportFailure: jest.fn()
        };
        const result = await AsyncDetailedResult.fromDetailed(
          succeedWithDetail<string, Reason>('ok', 'parse')
        ).report(reporter, { success: 'info' });
        expect(reporter.reportSuccess).toHaveBeenCalledWith('info', 'ok', 'parse', undefined);
        expect(result).toSucceedWith('ok');
      });

      test('tolerates an absent reporter', async () => {
        const result = await AsyncDetailedResult.fromDetailed(
          succeedWithDetail<string, Reason>('ok', 'parse')
        ).report();
        expect(result).toSucceedWith('ok');
      });
    });

    describe('then', () => {
      test('supports an explicit onfulfilled callback', async () => {
        const detail = await AsyncDetailedResult.fromDetailed(
          failWithDetail<string, Reason>('bad', 'timeout')
        ).then((r) => (r.isFailure() ? r.detail : undefined));
        expect(detail).toBe('timeout');
      });

      test('forwards an onrejected handler which the wrapped promise never triggers', async () => {
        // The wrapped promise is guarded in the constructor, so it never rejects and this arm is
        // unreachable through the public surface — including for a chain built from a rejection.
        // It is forwarded rather than dropped so `AsyncDetailedResult` remains a faithful
        // `PromiseLike`.
        const onrejected = jest.fn();
        const value = await new AsyncDetailedResult<string, Reason>(
          Promise.reject(new Error('rejected'))
        ).then((r) => r.message, onrejected);
        expect(onrejected).not.toHaveBeenCalled();
        expect(value).toMatch(/rejected/);
      });
    });

    /**
     * `AsyncDetailedResult` extends `AsyncResult` so a detailed chain is usable anywhere a plain
     * one is — the same relationship `DetailedSuccess`/`Success` already have, and the property
     * that makes the `thenOnSuccess` overrides on the detailed classes legal.
     */
    describe('inheritance from AsyncResult', () => {
      test('is an instance of AsyncResult', () => {
        const chain = AsyncDetailedResult.fromDetailed(succeedWithDetail<string, Reason>('ok'));
        expect(chain).toBeInstanceOf(AsyncResult);
      });

      test('is accepted where an AsyncResult is expected, and still awaits correctly', async () => {
        const widened: AsyncResult<string> = AsyncDetailedResult.fromDetailed(
          succeedWithDetail<string, Reason>('ok', 'parse')
        );
        expect(await widened).toSucceedWith('ok');
      });

      test('a rejection is caught once, as a DetailedFailure, under both views', async () => {
        const chain = new AsyncDetailedResult<string, Reason>(Promise.reject(new Error('rejected')));
        const widened: AsyncResult<string> = chain;
        expect(await widened).toFailWith(/rejected/);
        expect(await chain).toFailWith(/rejected/);
      });
    });
  });

  describe('bridge methods on DetailedResult', () => {
    describe('DetailedSuccess.thenOnSuccess', () => {
      test('calls the async continuation with the value and detail', async () => {
        const result = await succeedWithDetail<string, Reason>('hello', 'parse').thenOnSuccess(async (v, d) =>
          succeedWithDetail<number, Reason>(v.length, d)
        );
        expect(result).toSucceedWith(5);
        expect(result.detail).toBe('parse');
      });

      test('returns the failure detail produced by the continuation', async () => {
        const result = await succeedWithDetail<string, Reason>('hello').thenOnSuccess(async () =>
          failWithDetail<number, Reason>('async fail', 'network')
        );
        expect(result).toFailWith(/async fail/);
        expect(result.isFailure() && result.detail).toBe('network');
      });

      test('catches a rejected promise as a DetailedFailure with no detail', async () => {
        const result = await succeedWithDetail<string, Reason>('hello', 'parse').thenOnSuccess(async () => {
          throw new Error('boom');
        });
        expect(result).toFailWith(/boom/);
        expect(result.isFailure() && result.detail).toBeUndefined();
      });

      test('catches a synchronous throw as a DetailedFailure with no detail', async () => {
        const result = await succeedWithDetail<string, Reason>('hello', 'parse').thenOnSuccess(
          (): Promise<DetailedResult<number, Reason>> => {
            throw new Error('sync boom');
          }
        );
        expect(result).toFailWith(/sync boom/);
        expect(result.isFailure() && result.detail).toBeUndefined();
      });

      test('catches a non-Error rejection', async () => {
        const result = await succeedWithDetail<string, Reason>('hello').thenOnSuccess(
          () => Promise.reject('string rejection') as Promise<DetailedResult<number, Reason>>
        );
        expect(result).toFailWith(/string rejection/);
      });
    });

    describe('DetailedSuccess.thenOnFailure', () => {
      test('skips the continuation and propagates the success with its detail', async () => {
        const cb = jest.fn();
        const result = await succeedWithDetail<string, Reason>('hello', 'parse').thenOnFailure(cb);
        expect(cb).not.toHaveBeenCalled();
        expect(result).toSucceedWith('hello');
        expect(result.detail).toBe('parse');
      });
    });

    describe('DetailedFailure.thenOnSuccess', () => {
      test('skips the continuation and propagates the failure with its detail', async () => {
        const cb = jest.fn();
        const result = await failWithDetail<string, Reason>('oops', 'network').thenOnSuccess(cb);
        expect(cb).not.toHaveBeenCalled();
        expect(result).toFailWith(/oops/);
        expect(result.isFailure() && result.detail).toBe('network');
      });
    });

    describe('DetailedFailure.thenOnFailure', () => {
      test('calls the async continuation with the message and detail', async () => {
        const result = await failWithDetail<string, Reason>('oops', 'timeout').thenOnFailure(async (m, d) =>
          succeedWithDetail<string, Reason>(`${m}/${d}`)
        );
        expect(result).toSucceedWith('oops/timeout');
      });

      test('returns the failure detail produced by the continuation', async () => {
        const result = await failWithDetail<string, Reason>('oops', 'timeout').thenOnFailure(async () =>
          failWithDetail<string, Reason>('still bad', 'network')
        );
        expect(result).toFailWith(/still bad/);
        expect(result.isFailure() && result.detail).toBe('network');
      });

      test('catches a rejected promise as a DetailedFailure with no detail', async () => {
        const result = await failWithDetail<string, Reason>('oops', 'network').thenOnFailure(async () => {
          throw new Error('recovery boom');
        });
        expect(result).toFailWith(/recovery boom/);
        expect(result.isFailure() && result.detail).toBeUndefined();
      });

      test('catches a synchronous throw as a DetailedFailure with no detail', async () => {
        const result = await failWithDetail<string, Reason>('oops', 'network').thenOnFailure(
          (): Promise<DetailedResult<string, Reason>> => {
            throw new Error('sync recovery boom');
          }
        );
        expect(result).toFailWith(/sync recovery boom/);
        expect(result.isFailure() && result.detail).toBeUndefined();
      });

      test('catches a non-Error rejection', async () => {
        const result = await failWithDetail<string, Reason>('oops', 'network').thenOnFailure(
          () => Promise.reject('string rejection') as Promise<DetailedResult<string, Reason>>
        );
        expect(result).toFailWith(/string rejection/);
      });
    });

    describe('end-to-end detailed chain', () => {
      test('carries the detail through a mixed sync/async ladder', async () => {
        const result = await succeedWithDetail<string, Reason>('input')
          .onSuccess((v) => succeedWithDetail<string, Reason>(v.toUpperCase()))
          .thenOnSuccess(async (v) => succeedWithDetail<string, Reason>(`${v}!`))
          .onSuccess((v) => succeedWithDetail<number, Reason>(v.length))
          .thenOnSuccess(async (v) => succeedWithDetail<number, Reason>(v * 2));
        expect(result).toSucceedWith(12);
      });

      test('a failure detail introduced mid-chain survives every later step', async () => {
        const result = await succeedWithDetail<string, Reason>('input')
          .thenOnSuccess(async () => failWithDetail<string, Reason>('parse failed', 'parse'))
          .onSuccess((v) => succeedWithDetail<number, Reason>(v.length))
          .thenOnSuccess(async (v) => succeedWithDetail<number, Reason>(v * 2));
        expect(result).toFailWith(/parse failed/);
        expect(result.isFailure() && result.detail).toBe('parse');
      });

      test('withErrorFormat after an async step still sees the detail', async () => {
        const result = await succeedWithDetail<string, Reason>('input')
          .thenOnSuccess(async () => failWithDetail<string, Reason>('inner error', 'network'))
          .withErrorFormat((msg, detail) => `context (${detail}): ${msg}`);
        expect(result).toFailWith(/context \(network\): inner error/);
        expect(result.isFailure() && result.detail).toBe('network');
      });
    });
  });
});
