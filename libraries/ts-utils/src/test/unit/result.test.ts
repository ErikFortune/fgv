/*
 * Copyright (c) 2020 Erik Fortune
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
  DetailedFailure,
  DetailedResult,
  DetailedSuccess,
  Failure,
  Logging,
  MessageAggregator,
  Result,
  Success,
  captureResult,
  fail,
  failWithDetail,
  fails,
  failsWithDetail,
  propagateWithDetail,
  succeed,
  succeedWithDetail,
  succeeds,
  succeedsWithDetail
} from '../../packlets/base';

describe('Result module', () => {
  describe('Result type', () => {
    describe('properties', () => {
      function testResult(ok: boolean): Result<boolean> {
        return ok ? succeed(true) : fail('oops');
      }

      test('isSuccess and isFailure return correctly for success', () => {
        expect(testResult(true).isSuccess()).toBe(true);
        expect(testResult(true).isFailure()).toBe(false);
      });

      test('isSuccess and isFailure return correctly for failure', () => {
        expect(testResult(false).isSuccess()).toBe(false);
        expect(testResult(false).isFailure()).toBe(true);
      });

      test('value and message return correctly for success', () => {
        expect(testResult(true).value).toBe(true);
        expect(testResult(true).message).toBeUndefined();
      });

      test('value and message return correctly for failure', () => {
        expect(testResult(false).value).toBeUndefined();
        expect(testResult(false).message).toBe('oops');
      });

      test('can destructure into value and message for success with inference', () => {
        const { value, message } = testResult(true);
        expect(value).toBe(true);
        expect(message).toBeUndefined();
        if (value === undefined) {
          // note that compiler inferred that message is defined, so no '!' or '?' needed.
          expect(message[0]).toBe('o');
        }
      });

      test('can destructure into value and message for failure with inference', () => {
        const { value, message } = testResult(false);
        expect(value).toBeUndefined();
        expect(message).toBe('oops');
        if (value === undefined) {
          // note that compiler inferred that message is defined, so no '!' or '?' needed.
          // cast testResult to IResult<boolean> and inference is no longer possible
          expect(message[0]).toBe('o');
        }
      });
    });
  });

  describe('Success class', () => {
    describe('properties', () => {
      test('isSuccess is true', () => {
        expect(succeed('hello').isSuccess()).toBe(true);
      });

      test('isFailure is false', () => {
        expect(succeed('hello').isFailure()).toBe(false);
      });

      test('value is the value', () => {
        expect(succeed('hello').value).toBe('hello');
      });

      test('message is undefined', () => {
        expect(succeed('hello').message).toBeUndefined();
      });

      test('can destructure into value and message', () => {
        const { value, message } = succeed('hello');
        expect(value).toBe('hello');
        expect(message).toBeUndefined();
      });
    });

    describe('orThrow method', () => {
      test('returns the value and not throw', () => {
        const value = 'hello';
        const s = new Success(value);
        let gotValue: string | undefined;

        expect(() => {
          gotValue = s.orThrow();
        }).not.toThrow();
        expect(gotValue).toEqual(value);

        expect(() => {
          gotValue = s.getValueOrThrow();
        }).not.toThrow();
        expect(gotValue).toEqual(value);
      });

      test('does not invoke a logger if supplied', () => {
        const logger = { error: jest.fn() };
        expect(() => {
          succeed('hello').orThrow(logger);
        }).not.toThrow();
        expect(logger.error).not.toHaveBeenCalled();

        expect(() => {
          succeed('hello').getValueOrThrow(logger);
        }).not.toThrow();
        expect(logger.error).not.toHaveBeenCalled();
      });

      test('does not invoke a callback if supplied', () => {
        const cb = jest.fn();
        const s = new Success('hello');
        expect(() => {
          s.orThrow(cb);
        }).not.toThrow();
        expect(cb).not.toHaveBeenCalled();
      });
    });

    describe('orDefault method', () => {
      test('returns the value and not throw', () => {
        const value = 'hello';
        const s = new Success(value);
        let gotValue: string | undefined;

        expect(() => {
          gotValue = s.orDefault();
        }).not.toThrow();
        expect(gotValue).toEqual(value);

        expect(() => {
          gotValue = s.getValueOrDefault();
        }).not.toThrow();
        expect(gotValue).toEqual(value);
      });

      describe('with an undefined value', () => {
        test('returns the supplied default and not throw', () => {
          const dflt = 'default value';
          const s = new Success<string | undefined>(undefined);
          let gotValue: string | undefined;

          expect(() => {
            gotValue = s.orDefault(dflt);
          }).not.toThrow();
          expect(gotValue).toEqual(dflt);

          expect(() => {
            gotValue = s.getValueOrDefault(dflt);
          }).not.toThrow();
          expect(gotValue).toEqual(dflt);
        });
      });

      describe('type checks', () => {
        const dflt = { prop: 'value' };
        const s: Result<typeof dflt> = fail<typeof dflt>('oops');
        // '?' is required because return can be undefined
        expect(s.orDefault()?.prop).toBeUndefined();
        // No '?' needed because 'undefined' is not possible
        expect(s.orDefault(dflt).prop).toEqual('value');
      });
    });

    describe('onSuccess method', () => {
      test('calls the continuation', () => {
        const cb = jest.fn();
        succeed('hello').onSuccess(cb);
        expect(cb).toHaveBeenCalled();
      });

      test('returns any result from the continuation', () => {
        let result = succeed('hello').onSuccess(() => succeed('goodbye'));
        expect(result.isSuccess()).toBe(true);
        if (result.isSuccess()) {
          expect(result.value).toBe('goodbye');
        }

        result = succeed('hello').onSuccess(() => fail('oops'));
        expect(result.isFailure()).toBe(true);
        if (result.isFailure()) {
          expect(result.message).toBe('oops');
        }
      });
    });

    describe('onFailure method', () => {
      test('calls the continuation and returns the original result', () => {
        const cb = jest.fn((__: string): Result<string> => fail('oops'));
        const result = succeed('hello').onFailure(cb);
        expect(cb).not.toHaveBeenCalled();
        expect(result.isSuccess()).toBe(true);
        if (result.isSuccess()) {
          expect(result.value).toBe('hello');
        }
      });
    });

    describe('withErrorFormat method', () => {
      test('propagates an incoming success result', () => {
        expect(succeed('yaay!').withErrorFormat((msg) => `failed with ${msg}`)).toSucceedWith('yaay!');
      });

      test('formats an incoming error', () => {
        expect(fail('oops').withErrorFormat((msg) => `failed with ${msg}`)).toFailWith('failed with oops');
      });
    });
    describe('withFailureDetail method', () => {
      test('reports success with no detail', () => {
        expect(succeed('hello').withFailureDetail('fred')).toSucceedWithDetail('hello', undefined);
      });
    });

    describe('withDetail method', () => {
      test('reports success with the supplied detail', () => {
        expect(succeed('hello').withDetail('fred')).toSucceedWithDetail('hello', 'fred');
      });

      test('reports success with the success detail if supplied', () => {
        expect(succeed('hello').withDetail('fred', 'wilma')).toSucceedWithDetail('hello', 'wilma');
      });
    });

    describe('aggregateError method', () => {
      test('does not update errors array', () => {
        const aggregatedErrors = new MessageAggregator(['earlier error']);
        const success = succeed('hello');
        const aggregated = success.aggregateError(aggregatedErrors);
        expect(aggregated).toBe(success); // explicit test for identity
        expect(aggregatedErrors.messages).toEqual(['earlier error']);
      });
    });
  });

  describe('Failure class', () => {
    describe('properties', () => {
      test('isSuccess is false', () => {
        expect(fail('oops').isSuccess()).toBe(false);
      });

      test('isFailure is true', () => {
        expect(fail('oops').isFailure()).toBe(true);
      });

      test('message is the message', () => {
        expect(fail('oops').message).toBe('oops');
      });

      test('value is undefined', () => {
        expect(fail('oops').value).toBeUndefined();
      });

      test('can destructure into value and message', () => {
        const { value, message } = fail('oops');
        expect(value).toBeUndefined();
        expect(message).toBe('oops');
      });
    });

    describe('orThrow method', () => {
      test('throws the message', () => {
        const errorMessage = 'this is an error message';
        const f = new Failure(errorMessage);

        expect(() => f.orThrow()).toThrowError(errorMessage);
        expect(() => f.getValueOrThrow()).toThrowError(errorMessage);
      });

      test('calls logger if supplied', () => {
        const logger = { error: jest.fn() };
        const errorMessage = 'this is an error message';
        const f = new Failure(errorMessage);

        expect(() => f.orThrow(logger)).toThrowError(errorMessage);
        expect(logger.error).toHaveBeenCalledWith(errorMessage);
      });

      test('calls callback if supplied', () => {
        const cb = jest.fn((s) => `got: ${s}`);
        const errorMessage = 'this is an error message';
        const f = new Failure(errorMessage);
        expect(() => f.orThrow(cb)).toThrow(`got: ${errorMessage}`);
        expect(cb).toHaveBeenCalledWith(errorMessage);
      });

      test('getValueOrThrow calls logger if supplied', () => {
        const logger = { error: jest.fn() };
        const errorMessage = 'this is an error message';
        const f = new Failure(errorMessage);

        expect(() => f.getValueOrThrow(logger)).toThrowError(errorMessage);
        expect(logger.error).toHaveBeenCalledWith(errorMessage);
      });

      test('works with the utility logger class', () => {
        const logger = new Logging.InMemoryLogger();
        const errorMessage = 'this is an error message';
        const f = new Failure(errorMessage);

        expect(() => f.orThrow(logger)).toThrowError(errorMessage);
        expect(logger.messages).toEqual([errorMessage]);
      });
    });

    describe('orDefault method', () => {
      test('returns undefined if default is omitted', () => {
        const f = new Failure<string>('this is an error message');
        let gotValue: string | undefined;

        expect(() => {
          gotValue = f.orDefault();
        }).not.toThrow();
        expect(gotValue).toBeUndefined();

        expect(() => {
          gotValue = f.getValueOrDefault();
        }).not.toThrow();
        expect(gotValue).toBeUndefined();
      });

      test('returns the supplied default and does not throw', () => {
        const dflt = 'default value';
        const f = new Failure<string>('this is an error message');
        let gotValue: string | undefined;
        expect(() => {
          gotValue = f.orDefault(dflt);
        }).not.toThrow();
        expect(gotValue).toEqual(dflt);
      });

      describe('aggregateError method', () => {
        test('appends the error to the supplied aggregated error array', () => {
          const aggregatedErrors = new MessageAggregator(['earlier error']);
          const failure = fail('new error');
          const aggregated = failure.aggregateError(aggregatedErrors);
          expect(aggregated).toBe(failure); // explicit test for identity
          expect(aggregated).toFailWith('new error');
          expect(aggregatedErrors.messages).toEqual(['earlier error', 'new error']);
        });
      });
    });

    describe('onSuccess method', () => {
      test('does not call the continuation and returns the original result', () => {
        const cb = jest.fn((__: unknown): Result<string> => fail('oops'));
        const result = fail('oops').onSuccess(cb);
        expect(cb).not.toHaveBeenCalled();
        expect(result.isFailure()).toBe(true);
        if (result.isFailure()) {
          expect(result.message).toBe('oops');
        }
      });
    });

    describe('onFailure method', () => {
      test('calls the continuation', () => {
        const cb = jest.fn();
        fail('oops').onFailure(cb);
        expect(cb).toHaveBeenCalled();
      });

      test('returns any result from the continuation', () => {
        let result = fail('bad').onFailure(() => fail('double bad'));
        expect(result.isFailure()).toBe(true);
        if (result.isFailure()) {
          expect(result.message).toBe('double bad');
        }

        result = fail('hello').onFailure(() => succeed('nice save'));
        expect(result.isSuccess()).toBe(true);
        if (result.isSuccess()) {
          expect(result.value).toBe('nice save');
        }
      });
    });

    describe('withFailureDetail method', () => {
      test('reports failure with the supplied detail', () => {
        expect(fail('oops').withFailureDetail('fred')).toFailWithDetail('oops', 'fred');
      });
    });

    describe('withDetail method', () => {
      test('reports failure with the supplied detail', () => {
        expect(fail('oops').withDetail('fred')).toFailWithDetail('oops', 'fred');
      });

      test('reports failure with the default detail even if success detail is supplied', () => {
        expect(fail('oops').withDetail('fred', 'wilma')).toFailWithDetail('oops', 'fred');
      });
    });

    describe('toString method', () => {
      test('returns the message', () => {
        expect(new Failure('oops').toString()).toBe('oops');
      });
    });
  });

  describe('detailedSuccess class', () => {
    test('reports value', () => {
      const result = succeedWithDetail('message');
      expect(result).toSucceedWith('message');
    });

    test('reports detail', () => {
      const result = succeedWithDetail('message', 'detail');
      expect(result).toSucceedWith('message');
      expect(result.detail).toBe('detail');
    });

    test('isSuccess indicates detailed success', () => {
      const result = succeedWithDetail<string, string>('original message') as DetailedResult<string, string>;
      // The only difference between Success and DetailedSuccess is the call signature for
      // onFailure and onSuccess
      expect(
        result.onFailure((__message, detail) => {
          expect(typeof detail).toBe('never');
          return succeedWithDetail('hello');
        })
      ).toSucceedWith('original message');
    });

    test('onSuccess passes value', () => {
      expect(
        succeedWithDetail('value').onSuccess((v) => {
          expect(v).toEqual('value');
          return succeedWithDetail('it worked!');
        })
      ).toSucceedWith('it worked!');
    });

    test('onSuccess propagates detail', () => {
      expect(
        succeedWithDetail('value', 'detail').onSuccess((v, d) => {
          expect(v).toEqual('value');
          expect(d).toEqual('detail');
          return succeedWithDetail('it worked!');
        })
      ).toSucceedWith('it worked!');
    });

    test('onFailure propagates success value', () => {
      expect(
        succeedWithDetail<string, string>('pass through').onFailure((__message, detail) => {
          expect(typeof detail).toBe('never');
          return failWithDetail('failed', 'should not happen');
        })
      ).toSucceedWith('pass through');
    });

    describe('withErrorFormat method', () => {
      test('propagates incoming success', () => {
        expect(
          succeedWithDetail('yaay!', 'blarg').withErrorFormat((msg) => `failed with ${msg}`)
        ).toSucceedWithDetail('yaay!', 'blarg');
      });
    });

    describe('withFailureDetail method', () => {
      test('reports success with detail undefined', () => {
        expect(succeedWithDetail('hello', 10).withFailureDetail('fred')).toSucceedWithDetail(
          'hello',
          undefined
        );
      });
    });

    describe('withDetail method', () => {
      test('reports success with the supplied detail, overriding original detail', () => {
        expect(succeedWithDetail('hello', 10).withDetail('fred')).toSucceedWithDetail('hello', 'fred');
      });

      test('reports success with the success detail if supplied, overriding original detail', () => {
        expect(succeedWithDetail('hello', 10).withDetail('fred', 'wilma')).toSucceedWithDetail(
          'hello',
          'wilma'
        );
      });
    });
  });

  describe('detailedFailure class', () => {
    test('reports detail in addition to message', () => {
      const result = failWithDetail('message', 'detail');
      expect(result).toFailWith('message');
      expect(result.detail).toBe('detail');
    });

    test('isFailure indicates detailed failure', () => {
      const result = failWithDetail('message', 'detail') as DetailedResult<string, string>;
      if (result.isFailure()) {
        expect(result.detail).toBe('detail');
      }
    });

    test('onSuccess propagates detail', () => {
      const detail = { detail: 'detail' };
      expect(
        failWithDetail('error', detail).onSuccess((__v) => {
          expect(typeof __v).toBe('never');
          return succeedWithDetail('weird');
        })
      ).toFailWithDetail('error', detail);
    });

    test('onFailure passes detail', () => {
      const detail = { detail: 'detail' };
      expect(
        failWithDetail('error', detail).onFailure((message, detail) => {
          expect(message).toBe('error');
          expect(detail).toEqual(detail);
          return succeedWithDetail('it worked');
        })
      ).toSucceedWith('it worked');
    });

    describe('withErrorFormat', () => {
      test('propagates incoming failure', () => {
        expect(failWithDetail('oops', 10).withErrorFormat((msg) => `failed with ${msg}`)).toFailWithDetail(
          'failed with oops',
          10
        );
      });
    });

    describe('withFailureDetail method', () => {
      test('reports failure with the supplied detail, overriding any original detail', () => {
        expect(failWithDetail('oops', 10).withFailureDetail('fred')).toFailWithDetail('oops', 'fred');
      });
    });

    describe('withDetail method', () => {
      test('reports failure with the supplied detail, overriding any original detail', () => {
        expect(failWithDetail('oops', 10).withDetail('fred')).toFailWithDetail('oops', 'fred');
      });

      test('reports failure with the default detail, overriding any original detail, even if success detail is supplied', () => {
        expect(failWithDetail('oops', 10).withDetail('fred', 'wilma')).toFailWithDetail('oops', 'fred');
      });
    });
  });

  describe('orThrow method', () => {
    test('throws the message', () => {
      const errorMessage = 'this is an error message';
      const f = failWithDetail(errorMessage, 'detail');

      expect(() => f.orThrow()).toThrow(errorMessage);
    });

    test('calls logger with detail if supplied', () => {
      const logger = { error: jest.fn((m, d) => `${d}: ${m}`) };
      const errorMessage = 'this is an error message';
      const f = failWithDetail(errorMessage, 'detail');

      expect(() => f.orThrow(logger)).toThrow(errorMessage);
      expect(logger.error).toHaveBeenCalledWith(errorMessage, 'detail');
    });

    test('calls callback if supplied', () => {
      const cb = jest.fn((s, d) => `${d}: ${s}`);
      const errorMessage = 'this is an error message';
      const f = failWithDetail(errorMessage, 'detail');
      expect(() => f.orThrow(cb)).toThrow(`detail: ${errorMessage}`);
      expect(cb).toHaveBeenCalledWith(errorMessage, 'detail');
    });
  });

  describe('propagateWithDetail function', () => {
    test('propagates value and success detail on success if defined', () => {
      expect(propagateWithDetail(succeed('hello'), 'e', 's')).toSucceedWithDetail('hello', 's');
    });

    test('propagates value and default detail on success if success detail is not defined', () => {
      expect(propagateWithDetail(succeed('hello'), 'detail')).toSucceedWithDetail('hello', 'detail');
    });

    test('propagates message and failure detail if success detail is not defined', () => {
      expect(propagateWithDetail(fail('oops'), 'detail')).toFailWithDetail('oops', 'detail');
    });

    test('propagates message and failure detail if success detail is defined', () => {
      expect(propagateWithDetail(fail('oops'), 'e', 's')).toFailWithDetail('oops', 'e');
    });
  });

  describe('captureResult function', () => {
    test('returns success and the value if the method does not throw', () => {
      const successfulReturn = 'This is a successful return';
      const result = captureResult(() => {
        return successfulReturn;
      });
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toBe(successfulReturn);
      }
    });

    test('returns failure and the thrown message if the method throws', () => {
      const failedReturn = 'This is a successful return';
      const result = captureResult(() => {
        throw new Error(failedReturn);
      });
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        expect(result.message).toBe(failedReturn);
      }
    });
  });

  describe('helpers', () => {
    test('success helpers return expected Success result', () => {
      expect(succeed('hello')).toSucceedWith('hello');
      expect(succeeds('hello')).toSucceedWith('hello');
      expect(Success.with('hello')).toSucceedWith('hello');
      expect(succeedWithDetail('hello', 'detail')).toSucceedWithDetail('hello', 'detail');
      expect(succeedsWithDetail('hello', 'detail')).toSucceedWithDetail('hello', 'detail');
      expect(DetailedSuccess.with('hello', 'detail')).toSucceedWithDetail('hello', 'detail');
    });

    test('failure helpers return expected Failure result', () => {
      expect(fail('oops')).toFailWith('oops');
      expect(fails('oops')).toFailWith('oops');
      expect(Failure.with('oops')).toFailWith('oops');
      expect(failWithDetail('oops', 'detail')).toFailWithDetail('oops', 'detail');
      expect(failsWithDetail('oops', 'detail')).toFailWithDetail('oops', 'detail');
      expect(DetailedFailure.with('oops', 'detail')).toFailWithDetail('oops', 'detail');
    });
  });
});
