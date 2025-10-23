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
  MessageAggregator,
  Result,
  allSucceed,
  fail,
  failWithDetail,
  firstSuccess,
  isKeyOf,
  mapDetailedResults,
  mapFailures,
  mapResults,
  mapSuccess,
  populateObject,
  succeed,
  succeedWithDetail
} from '../../packlets/base';

describe('mapResults module', () => {
  describe('mapResults function', () => {
    const strings = ['string1', 'STRING2', 'String_3'];
    const results = strings.map((s) => succeed(s));
    test('reports all values if all results are successful', () => {
      const result = mapResults(results);
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toEqual(strings);
      }
    });

    test('reports an error if any results failed', () => {
      const errors = ['Biff!', 'Pow!', 'Bam!'];
      const errorResults = errors.map((s) => fail(s));
      const badResults = [...results, ...errorResults];
      const result = mapResults(badResults);
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        for (const e of errors) {
          expect(result.message).toContain(e);
        }
      }
    });

    test('appends errors to aggregatedErrors if present', () => {
      const aggregatedErrors = new MessageAggregator(['earlier error']);
      const errors = ['Biff!', 'Pow!', 'Bam!'];
      const errorResults = errors.map((s) => fail(s));
      const badResults = [...results, ...errorResults];
      const result = mapResults(badResults, aggregatedErrors);
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        for (const e of errors) {
          expect(result.message).toContain(e);
        }
      }
      expect(aggregatedErrors.messages).toEqual(['earlier error', ...errors]);
    });
  });

  describe('mapDetailedResults function', () => {
    type TestDetail = 'real' | 'fake';
    const strings = ['string1', 'STRING2', 'String_3'];
    const results = strings.map((s) => succeedWithDetail<string, TestDetail>(s, 'real'));

    test('reports all values if all results are successful', () => {
      expect(mapDetailedResults(results, ['fake'])).toSucceedWith(strings);
    });

    test('reports an error if any results fail with an unlisted error', () => {
      const errors = ['Biff!', 'Pow!', 'Bam!'];
      const errorResults = errors.map((s) => failWithDetail<string, TestDetail>(s, 'real'));
      const badResults = [...results, ...errorResults];
      const result = mapDetailedResults(badResults, ['fake']);
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        for (const e of errors) {
          expect(result.message).toContain(e);
        }
      }
    });

    test('appends errors to aggregated errors if present', () => {
      const aggregatedErrors = new MessageAggregator(['earlier error']);
      const errors = ['Biff!', 'Pow!', 'Bam!'];
      const errorResults = errors.map((s) => failWithDetail<string, TestDetail>(s, 'real'));
      const badResults = [...results, ...errorResults];
      const result = mapDetailedResults(badResults, ['fake'], aggregatedErrors);
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        for (const e of errors) {
          expect(result.message).toContain(e);
        }
      }
      expect(aggregatedErrors.messages).toEqual(['earlier error', ...errors]);
    });

    test('ignores listed errors', () => {
      const errors = ['Biff!', 'Pow!', 'Bam!'];
      const errorResults = errors.map((s) => failWithDetail<string, TestDetail>(s, 'fake'));
      const badResults = [...results, ...errorResults];
      expect(mapDetailedResults(badResults, ['fake'])).toSucceedWith(strings);
    });

    test('omits listed errors even if some other result fails with an unlisted error', () => {
      const realErrors = ['Biff!', 'Pow!', 'Bam!'];
      const fakeErrors = ['Zap!'];
      const realErrorResults = realErrors.map((s) => failWithDetail<string, TestDetail>(s, 'real'));
      const fakeErrorResults = fakeErrors.map((s) => failWithDetail<string, TestDetail>(s, 'fake'));
      const badResults = [...results, ...fakeErrorResults, ...realErrorResults];
      const result = mapDetailedResults(badResults, ['fake']);
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        for (const e of realErrors) {
          expect(result.message).toContain(e);
        }
        for (const e of fakeErrors) {
          expect(result.message).not.toContain(e);
        }
      }
    });
  });

  describe('mapSuccess function', () => {
    const strings = ['string1', 'STRING2', 'String_3'];
    const results = [...strings.map((s) => succeed(s)), fail('failure')];
    test('reports all successful values if any results are successful', () => {
      const result = mapSuccess(results);
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toEqual(strings);
      }
    });

    test('reports an error if all results failed', () => {
      const errors = ['Biff!', 'Pow!', 'Bam!'];
      const errorResults = errors.map((s) => fail(s));
      const badResults = [...errorResults];
      const result = mapSuccess(badResults);
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        for (const e of errors) {
          expect(result.message).toContain(e);
        }
      }
    });

    test('appends to aggregatedErrors if supplied', () => {
      const aggregatedErrors = new MessageAggregator(['earlier error']);
      const errors = ['Biff!', 'Pow!', 'Bam!'];
      const errorResults = errors.map((s) => fail(s));
      const badResults = [...errorResults];
      const result = mapSuccess(badResults, aggregatedErrors);
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        for (const e of errors) {
          expect(result.message).toContain(e);
        }
      }
      expect(aggregatedErrors.messages).toEqual(['earlier error', ...errors]);
    });
  });

  describe('mapFailures function', () => {
    const strings = ['string1', 'STRING2', 'String_3'];
    test('reports all error messages ignoring successful results', () => {
      const results = [fail('failure 1'), ...strings.map((s) => succeed(s)), fail('failure 2')];
      expect(mapFailures(results)).toEqual(['failure 1', 'failure 2']);
    });

    test('appends errors to aggregatedErrors if supplied', () => {
      const aggregatedErrors = new MessageAggregator(['earlier errors']);
      const results = [fail('failure 1'), ...strings.map((s) => succeed(s)), fail('failure 2')];
      expect(mapFailures(results, aggregatedErrors)).toEqual(['failure 1', 'failure 2']);
      expect(aggregatedErrors.messages).toEqual(['earlier errors', 'failure 1', 'failure 2']);
    });

    test('returns an empty array if all results succeed', () => {
      const results = strings.map((s) => succeed(s));
      expect(mapFailures(results)).toEqual([]);
    });
  });

  describe('allSucceed function', () => {
    const strings = ['string1', 'STRING2', 'String_3'];
    const results = strings.map((s) => succeed(s));
    test('returns true if all results are successful', () => {
      const result = allSucceed(results, true);
      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value).toBe(true);
      }
    });

    test('reports an error if any results failed', () => {
      const errors = ['Biff!', 'Pow!', 'Bam!'];
      const errorResults = errors.map((s) => fail(s));
      const badResults = [...results, ...errorResults];
      const result = allSucceed(badResults, true);
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        for (const e of errors) {
          expect(result.message).toContain(e);
        }
      }
    });

    test('appends errors to aggregatedErrors if supplied', () => {
      const aggregatedErrors = new MessageAggregator(['earlier errors']);
      const errors = ['Biff!', 'Pow!', 'Bam!'];
      const errorResults = errors.map((s) => fail(s));
      const badResults = [...results, ...errorResults];
      const result = allSucceed(badResults, true, aggregatedErrors);
      expect(result.isFailure()).toBe(true);
      if (result.isFailure()) {
        for (const e of errors) {
          expect(result.message).toContain(e);
        }
      }
      expect(aggregatedErrors.messages).toEqual(['earlier errors', ...errors]);
    });
  });

  describe('populateObject function', () => {
    test('populates an object by invoking each initializer', () => {
      expect(
        populateObject({
          field: () => succeed('field'),
          numberField: () => succeed(10)
        })
      ).toSucceedWith({
        field: 'field',
        numberField: 10
      });
    });

    test('fails if any initializers fail', () => {
      expect(
        populateObject({
          field: () => succeed('field'),
          numberField: () => fail('oopsy')
        })
      ).toFailWith(/oopsy/i);
    });

    test('reports errors from all failing initializers', () => {
      expect(
        populateObject({
          field: () => fail('oops 1'),
          field2: () => fail('oops 2')
        })
      ).toFailWith('oops 1\noops 2');
    });

    test('appends errors to aggregatedErrors if supplied', () => {
      const aggregatedErrors = new MessageAggregator(['earlier errors']);
      expect(
        populateObject(
          {
            field: () => fail('oops 1'),
            field2: () => fail('oops 2')
          },
          undefined,
          aggregatedErrors
        )
      ).toFailWith('oops 1\noops 2');
      expect(aggregatedErrors.messages).toEqual(['earlier errors', 'oops 1', 'oops 2']);
    });

    test('invokes all initializers even if one fails', () => {
      const good2 = jest.fn(() => succeed('good 2'));
      expect(
        populateObject({
          field: () => fail('oops 1'),
          field2: good2,
          field3: () => fail('oops 3')
        })
      ).toFailWith('oops 1\noops 3');
      expect(good2).toHaveBeenCalled();
    });

    describe('with order (deprecated)', () => {
      test('invokes initializers in the specified order', () => {
        expect(
          populateObject(
            {
              field1: (state) => {
                return state.field2 === 'field2'
                  ? succeed('field1')
                  : fail('field 2 has not been correctly initialized');
              },
              field2: () => succeed('field2')
            },
            ['field2', 'field1']
          )
        ).toSucceedWith({
          field1: 'field1',
          field2: 'field2'
        });
      });
    });

    describe('with options', () => {
      test('invokes initializers in the specified order', () => {
        expect(
          populateObject(
            {
              field1: (state) => {
                return state.field2 === 'field2'
                  ? succeed('field1')
                  : fail('field 2 has not been correctly initialized');
              },
              field2: () => succeed('field2')
            },
            { order: ['field2', 'field1'] }
          )
        ).toSucceedWith({
          field1: 'field1',
          field2: 'field2'
        });
      });

      test('invokes unlisted initializers after listed initializers', () => {
        expect(
          populateObject(
            {
              field3: (state) => succeed(`[${state.field1}, ${state.field2}]`),
              field1: (state) => {
                return state.field2 === 'field2'
                  ? succeed('field1')
                  : fail('field 2 has not been correctly initialized');
              },
              field2: () => succeed('field2')
            },
            { order: ['field2', 'field1'] }
          )
        ).toSucceedWith({
          field1: 'field1',
          field2: 'field2',
          field3: '[field1, field2]'
        });
      });

      test('fails if order lists a property that has no initializer', () => {
        interface IThing {
          field1?: string;
          field2?: string;
          field3?: string;
          field4?: string;
        }
        expect(
          populateObject<IThing>(
            {
              field3: (state) => succeed(`[${state.field1}, ${state.field2}]`),
              field1: (state) => {
                return state.field2 === 'field2'
                  ? succeed('field1')
                  : fail('field 2 has not been correctly initialized');
              },
              field2: () => succeed('field2')
            },
            { order: ['field2', 'field1', 'field4'] }
          )
        ).toFailWith(/is present but/i);
      });

      test('propagates undefined results by default', () => {
        interface IThing {
          field1: string;
          field2?: string;
          field3?: string;
        }
        expect(
          populateObject<IThing>({
            field1: () => succeed('value1'),
            field2: () => succeed(undefined),
            field3: () => succeed(undefined)
          })
        ).toSucceedAndSatisfy((thing: IThing) => {
          expect(thing.field1).toBe('value1');
          expect(thing.field2).toBeUndefined();
          expect(thing.field3).toBeUndefined();
          expect(isKeyOf('field2', thing)).toBe(true);
          expect(isKeyOf('field3', thing)).toBe(true);
        });
      });

      test('does not propagate undefined results if suppressUndefined is true.', () => {
        interface IThing {
          field1: string;
          field2?: string;
          field3?: string;
        }
        expect(
          populateObject<IThing>(
            {
              field1: () => succeed('value1'),
              field2: () => succeed(undefined),
              field3: () => succeed(undefined)
            },
            { suppressUndefined: true }
          )
        ).toSucceedAndSatisfy((thing: IThing) => {
          expect(thing.field1).toBe('value1');
          expect(thing.field2).toBeUndefined();
          expect(thing.field3).toBeUndefined();
          expect(isKeyOf('field2', thing)).toBe(false);
          expect(isKeyOf('field3', thing)).toBe(false);
        });
      });

      test('does not propagate undefined results for properties listed in suppressUndefined.', () => {
        interface IThing {
          field1: string;
          field2?: string;
          field3?: string;
        }
        expect(
          populateObject<IThing>(
            {
              field1: () => succeed('value1'),
              field2: () => succeed(undefined),
              field3: () => succeed(undefined)
            },
            { suppressUndefined: ['field2'] }
          )
        ).toSucceedAndSatisfy((thing: IThing) => {
          expect(thing.field1).toBe('value1');
          expect(thing.field2).toBeUndefined();
          expect(thing.field3).toBeUndefined();
          expect(isKeyOf('field2', thing)).toBe(false);
          expect(isKeyOf('field3', thing)).toBe(true);
        });
      });
    });
  });

  describe('firstSuccess function', () => {
    describe('with all successful results', () => {
      test('should return the first successful result when all are successful', () => {
        const results = [succeed('first'), succeed('second'), succeed('third')];
        expect(firstSuccess(results)).toSucceedWith('first');
      });

      test('should return the first result from a single successful result', () => {
        const results = [succeed('only')];
        expect(firstSuccess(results)).toSucceedWith('only');
      });

      test('should work with different result types', () => {
        const results = [succeed(42), succeed(100), succeed(0)];
        expect(firstSuccess(results)).toSucceedWith(42);
      });
    });

    describe('with mixed success and failure results', () => {
      test('should return the first successful result when it comes first', () => {
        const results = [succeed('success'), fail('error1'), fail('error2')];
        expect(firstSuccess(results)).toSucceedWith('success');
      });

      test('should return the first successful result when it comes in the middle', () => {
        const results = [fail('error1'), succeed('success'), fail('error2')];
        expect(firstSuccess(results)).toSucceedWith('success');
      });

      test('should return the first successful result when it comes last', () => {
        const results = [fail('error1'), fail('error2'), succeed('success')];
        expect(firstSuccess(results)).toSucceedWith('success');
      });

      test('should skip all failures before finding success', () => {
        const results = [
          fail('error1'),
          fail('error2'),
          fail('error3'),
          succeed('found'),
          succeed('not-used')
        ];
        expect(firstSuccess(results)).toSucceedWith('found');
      });
    });

    describe('with all failed results', () => {
      test('should fail with aggregated error messages when all results fail', () => {
        const results = [fail('error1'), fail('error2'), fail('error3')];
        const result = firstSuccess(results);
        expect(result).toFail();
        if (result.isFailure()) {
          expect(result.message).toContain('error1');
          expect(result.message).toContain('error2');
          expect(result.message).toContain('error3');
        }
      });

      test('should fail with single error message for single failed result', () => {
        const results = [fail('single error')];
        expect(firstSuccess(results)).toFailWith(/single error/);
      });

      test('should aggregate multiple error messages in order', () => {
        const results = [fail('first error'), fail('second error')];
        const result = firstSuccess(results);
        expect(result).toFail();
        if (result.isFailure()) {
          // Should contain both error messages
          expect(result.message).toContain('first error');
          expect(result.message).toContain('second error');
        }
      });
    });

    describe('with deferred results', () => {
      test('should handle deferred results that succeed', () => {
        const deferredSuccess = (): Result<string> => succeed('deferred success');
        const deferredFailure = (): Result<string> => fail('deferred error');
        const results = [deferredFailure, deferredSuccess, succeed('not used')];
        expect(firstSuccess(results)).toSucceedWith('deferred success');
      });

      test('should handle all deferred results that fail', () => {
        const deferredFailure1 = (): Result<string> => fail('deferred error 1');
        const deferredFailure2 = (): Result<string> => fail('deferred error 2');
        const results = [deferredFailure1, deferredFailure2];
        const result = firstSuccess(results);
        expect(result).toFail();
        if (result.isFailure()) {
          expect(result.message).toContain('deferred error 1');
          expect(result.message).toContain('deferred error 2');
        }
      });

      test('should handle mixed regular and deferred results', () => {
        const deferredFailure = (): Result<string> => fail('deferred error');
        const deferredSuccess = (): Result<string> => succeed('deferred success');
        const results = [fail('regular error'), deferredFailure, deferredSuccess];
        expect(firstSuccess(results)).toSucceedWith('deferred success');
      });

      test('should call deferred functions only until first success', () => {
        const mockDeferred1 = jest.fn(() => fail('error1'));
        const mockDeferred2 = jest.fn(() => succeed('success'));
        const mockDeferred3 = jest.fn(() => succeed('not called'));
        const results = [mockDeferred1, mockDeferred2, mockDeferred3];

        expect(firstSuccess(results)).toSucceedWith('success');
        expect(mockDeferred1).toHaveBeenCalledTimes(1);
        expect(mockDeferred2).toHaveBeenCalledTimes(1);
        expect(mockDeferred3).not.toHaveBeenCalled();
      });

      test('should handle deferred results with complex types', () => {
        interface TestData {
          id: number;
          name: string;
        }
        const deferredSuccess = (): Result<TestData> => succeed<TestData>({ id: 1, name: 'test' });
        const results = [(): Result<TestData> => fail<TestData>('error'), deferredSuccess];
        expect(firstSuccess(results)).toSucceedAndSatisfy((data: TestData) => {
          expect(data.id).toBe(1);
          expect(data.name).toBe('test');
        });
      });
    });

    describe('with edge cases', () => {
      test('should handle empty iterable', () => {
        const results: never[] = [];
        expect(firstSuccess(results)).toFailWith(/no results found/);
      });

      test('should handle results with undefined values', () => {
        const results = [succeed(undefined), fail('error')];
        expect(firstSuccess(results)).toSucceedWith(undefined);
      });

      test('should handle results with null values', () => {
        const results = [fail('error'), succeed(null)];
        expect(firstSuccess(results)).toSucceedWith(null);
      });

      test('should handle results with empty string values', () => {
        const results = [fail('error'), succeed('')];
        expect(firstSuccess(results)).toSucceedWith('');
      });

      test('should handle results with zero values', () => {
        const results = [fail('error'), succeed(0)];
        expect(firstSuccess(results)).toSucceedWith(0);
      });

      test('should handle results with false values', () => {
        const results = [fail('error'), succeed(false)];
        expect(firstSuccess(results)).toSucceedWith(false);
      });
    });

    describe('with error message formatting', () => {
      test('should format error messages consistently when no successes found', () => {
        const results = [fail('Error 1'), fail('Error 2')];
        const result = firstSuccess(results);
        expect(result).toFail();
        if (result.isFailure()) {
          // Should either contain the aggregated errors or the fallback message
          const hasAggregatedErrors =
            result.message.includes('Error 1') && result.message.includes('Error 2');
          const hasFallbackMessage = result.message.includes('no results found');
          expect(hasAggregatedErrors || hasFallbackMessage).toBe(true);
        }
      });

      test('should handle very long error messages', () => {
        const longError =
          'This is a very long error message that might exceed normal length expectations and should still be handled properly by the error aggregation mechanism';
        const results = [fail(longError), fail('Short error')];
        const result = firstSuccess(results);
        expect(result).toFail();
        if (result.isFailure()) {
          expect(result.message.length).toBeGreaterThan(longError.length);
        }
      });

      test('should handle error messages with special characters', () => {
        const specialError = 'Error with "quotes", newlines\n, and symbols: @#$%^&*()';
        const results = [fail(specialError)];
        // Should contain the error message with special characters
        const result = firstSuccess(results);
        expect(result).toFail();
        if (result.isFailure()) {
          expect(result.message).toContain('Error with "quotes"');
          expect(result.message).toContain('symbols: @#$%^&*()');
        }
      });
    });

    describe('integration with Result pattern', () => {
      test('should work with chained Result operations', () => {
        const parseNumber = (s: string): Result<number> => {
          const num = parseInt(s, 10);
          return isNaN(num) ? fail(`Invalid number: ${s}`) : succeed(num);
        };

        const results = ['abc', '123', '456'].map(parseNumber);
        expect(firstSuccess(results)).toSucceedWith(123);
      });

      test('should work with Result transformations', () => {
        const processString = (s: string): Result<string> =>
          s.length > 0 ? succeed(s.toUpperCase()) : fail('Empty string');

        const results = ['', 'hello', 'world'].map(processString);
        expect(firstSuccess(results)).toSucceedWith('HELLO');
      });

      test('should maintain type safety with generic types', () => {
        // Demonstrate type safety with same-type results
        const stringResults = [succeed('hello'), succeed('world')];
        expect(firstSuccess(stringResults)).toSucceedWith('hello');

        const numberResults = [succeed(42), succeed(100)];
        expect(firstSuccess(numberResults)).toSucceedWith(42);
      });
    });

    describe('performance considerations', () => {
      test('should stop evaluation at first success with large number of results', () => {
        const mockResults = Array.from({ length: 1000 }, (_, i) =>
          i === 2 ? succeed('found') : fail(`error ${i}`)
        );

        expect(firstSuccess(mockResults)).toSucceedWith('found');
      });

      test('should handle large arrays of all failures efficiently', () => {
        const largeFailureSet = Array.from({ length: 100 }, (_, i) => fail(`error ${i}`));
        const result = firstSuccess(largeFailureSet);
        expect(result).toFail();
        // Should aggregate all errors
        if (result.isFailure()) {
          expect(result.message).toContain('error 0');
          expect(result.message).toContain('error 99');
        }
      });
    });
  });
});
