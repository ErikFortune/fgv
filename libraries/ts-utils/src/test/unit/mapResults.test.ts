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
  allSucceed,
  fail,
  failWithDetail,
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
      const aggregatedErrors: string[] = ['earlier error'];
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
      expect(aggregatedErrors).toEqual(['earlier error', ...errors]);
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
      const aggregatedErrors = ['earlier error'];
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
      expect(aggregatedErrors).toEqual(['earlier error', ...errors]);
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
      const aggregatedErrors = ['earlier error'];
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
      expect(aggregatedErrors).toEqual(['earlier error', ...errors]);
    });
  });

  describe('mapFailures function', () => {
    const strings = ['string1', 'STRING2', 'String_3'];
    test('reports all error messages ignoring successful results', () => {
      const results = [fail('failure 1'), ...strings.map((s) => succeed(s)), fail('failure 2')];
      expect(mapFailures(results)).toEqual(['failure 1', 'failure 2']);
    });

    test('appends errors to aggregatedErrors if supplied', () => {
      const aggregatedErrors = ['earlier errors'];
      const results = [fail('failure 1'), ...strings.map((s) => succeed(s)), fail('failure 2')];
      expect(mapFailures(results, aggregatedErrors)).toEqual(['failure 1', 'failure 2']);
      expect(aggregatedErrors).toEqual(['earlier errors', 'failure 1', 'failure 2']);
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
      const aggregatedErrors = ['earlier errors'];
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
      expect(aggregatedErrors).toEqual(['earlier errors', ...errors]);
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
      const aggregatedErrors = ['earlier errors'];
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
      expect(aggregatedErrors).toEqual(['earlier errors', 'oops 1', 'oops 2']);
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
});
