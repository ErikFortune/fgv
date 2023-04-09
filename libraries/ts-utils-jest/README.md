<div align="center">
  <h1>ts-utils-jest</h1>
  Jest matchers and utilities (mostly) for working with ts-utils
</div>

<hr />

## Summary

A collection of additional Jest matchers primarily intended for code that uses ts-utils' Result<T> type.

Also includes a handful of custom matchers to simplify the testing of other custom matchers.  Who will test the testers?

---

- [Summary](#summary)
- [Installation](#installation)
- [Setup](#setup)
- [API](#api)
  - [Testing Result\<T\>](#testing-resultt)
    - [.toFail()](#tofail)
    - [.toFailWith(expected)](#tofailwithexpected)
    - [.toFailWithDetail(expectedMessage, expectedDetail)](#tofailwithdetailexpectedmessage-expecteddetail)
    - [.toSucceed()](#tosucceed)
    - [.toSucceedWith(expected)](#tosucceedwithexpected)
    - [.toSucceedAndSatisfy(cb)](#tosucceedandsatisfycb)
    - [.toSucceedAndMatchSnapshot()](#tosucceedandmatchsnapshot)
    - [.toSucceedAndMatchInlineSnapshot(snapshot)](#tosucceedandmatchinlinesnapshotsnapshot)
  - [Testing Custom Matchers](#testing-custom-matchers)
    - [.toFailTest()](#tofailtest)
    - [.toFailTestWith(expected)](#tofailtestwithexpected)
    - [.toFailTestAndMatchSnapshot()](#tofailtestandmatchsnapshot)
- [LICENSE](#license)

## Installation

With npm:
```sh
npm install --save-dev ts-utils-jest
```

## Setup

Note that snapshot testing for Jest itself can be tricky because different environments (e.g. CLI vs IDE vs CICD) might generate slightly different output due to e.g. differences in color display of diffs.   To facilitate snapshot testing across multiple environments, this library also provides an extensible set of snapshot resolvers that can be used to capture environment-specific snapshots.

## API

### Testing Result\<T\>

#### .toFail()

Use '.toFail' to verify that a Result\<T\> is a failure result.
```ts
test('passes with a failure result', () => {
    expect(fail('oops')).toFail();
});

test('fails with a success result', () => {
    expect(succeed('hello')).not.toFail();
});
```

#### .toFailWith(expected)

Use '.toFailWith' to verify that a Result\<T\> is a failure result with a message that matches a supplied
string or regular expression.

```ts
    test('passes with a failure result and matching string or RegExp', () => {
        expect(fail('oops')).toFailWith('oops');
        expect(fail('oops')).toFailWith(/o.*/i);
    });

    test('fails with a success result', () => {
        expect(succeed('hello')).not.toFailWith('hello');
    });

    test('fails with a failure result but non-matching string or RegExp', () => {
        expect(fail('oops')).not.toFailWith('error');
        expect(fail('oops')).not.toFailWith(/x.*/i);
    });
```

#### .toFailWithDetail(expectedMessage, expectedDetail)

Use '.toFailWithDetail' to verify that a DetailedResult\<T\> is a failure result that matches both
a supplied expected failure message (string, RegExp or undefined) and a supplied failure detail.

```ts
    test('passes with a failure result and matching string or RegExp', () => {
        expect(failWithDetail('oops', 'detail')).toFailWithDetail('oops', 'detail');
        expect(failWithDetail('oops', { detail: 'detail' })).toFailWithDetail(/o.*/i, { detail: 'detail' });
    });

    test('fails with a success result', () => {
        expect(succeed('hello')).not.toFailWithDetail('hello', 'detail');
    });

    test('fails with a failure result but non-matching string or RegExp, or with a non-matching detail', () => {
        expect(failWithDetail('oops', 'detail')).not.toFailWithDetail('error', 'detail');
        expect(failWithDetail('oops', 'detail')).not.toFailWithDetail(/x.*/i, 'detail');
        expect(failWithDetail('error', 'other detail')).not.toFailWithDetail('error', 'detail');
    });
```

#### .toSucceed()

Use '.toSucceed' to verify that a Result\<T\> is a success result.

```ts
    test('passes with a success result', () => {
        expect(succeed('hello')).toSucceed();
    });

    test('fails with a failure result', () => {
        expect(fail('oops')).not.toSucceed();
    });
```

#### .toSucceedWith(expected)

Use '.toSucceedWith' to verify that a Result\<T\> is a success and that the result value
matches the supplied value.  Works with asymmetric matchers.

```ts
    test('succeeds with a success result that matches expected', () => {
        expect(succeed('hello')).toSucceedWith('hello');
        expect(succeed('hello')).toSucceedWith(expect.stringMatching(/h.*/i));
    });

    test('fails with a failure result', () => {
        expect(fail('oops')).not.toSucceedWith('oops');
    });

    test('fails with a success result but a non-matching value', () => {
        expect(succeed('hello')).not.toSucceedWith('goodbye');
    });

    test('passes with a matching asymmetric match', () => {
        expect(succeed({
            title: 'A title string',
            subtitles: ['subtitle 1', 'subtitle 2'],
        })).toSucceedWith(expect.objectContaining({
            title: expect.stringMatching(/.*title*/),
            subtitles: expect.arrayContaining([
                'subtitle 1',
                expect.stringContaining('2'),
            ]),
        }));
    });

    test('fails with a non-matching asymmetric match', () => {
        expect(succeed({
            title: 'A title string',
            subtitles: ['subtitle 1', 'subtitle 2'],
        })).not.toSucceedWith(expect.objectContaining({
            title: expect.stringMatching(/.*title*/),
            subtitles: expect.arrayContaining([
                'subtitle 1',
                expect.stringContaining('3'),
            ]),
        }));
    });
```

#### .toSucceedAndSatisfy(cb)

Use '.toSucceedAndSatisfy' to verify that a Result\<T\> is a success and that the result
matches the supplied predicate.  Handles predicates that also use 'expect' to test the result object.

```ts
    test('passes with a success value and a callback that returns true', () => {
        expect(succeed('hello')).toSucceedAndSatisfy((value: string) => value === 'hello');
    });

    test('fails with a success value but a callback that returns false', () => {
        expect(succeed('hello')).not.toSucceedAndSatisfy((value: string) => value !== 'hello');
    });

    test('fails with a success value but a callback that fails an expectation', () => {
        expect(succeed('hello')).not.toSucceedAndSatisfy((value: string) => {
            expect(value).toBe('goodbye');
            return true;
        });
    });

    test('fails with a success value but a callback that throws an exception', () => {
        expect(succeed('hello')).not.toSucceedAndSatisfy((_value: string) => {
            throw new Error('UH OH AN ERRROR');
        });
    });

    test('fails with a failure value', () => {
        expect(fail('oops')).not.toSucceedAndSatisfy((value: string) => value === 'oops');
    });
```

#### .toSucceedAndMatchSnapshot()

Use .toSucceedAndMatchSnapshot to verify that a Result<T> is a success and that the result
value matches a stored snapshot.

```ts
    test('passes for a success result that matches the snapshot', () => {
        expect(succeed({
            someField: 'this is a value',
            nestedObject: {
                anArray: ['element 1', 'element 2'],
            },
        })).toSucceedAndMatchSnapshot();
    });

    test('fails for a failure result', () => {
        expect(fail('oops')).not.toSucceedAndMatchSnapshot();
    });
```

#### .toSucceedAndMatchInlineSnapshot(snapshot)

Use .toSucceedAndMatchInlineSnapshot to verify that a Result<T> is a success
and that the result value matches an inline snapshot.

```ts
    test('passes for a success result that matches the snapshot', () => {
        expect(
            succeed({
                someField: 'this is a value',
                nestedObject: {
                    anArray: ['element 1', 'element 2'],
                },
            })
        ).toSucceedAndMatchInlineSnapshot(`
      Object {
        "nestedObject": Object {
          "anArray": Array [
            "element 1",
            "element 2",
          ],
        },
        "someField": "this is a value",
      }
    `);
    });
```

### Testing Custom Matchers

#### .toFailTest()

Use '.toFailTest' to test a custom matcher by verifying that a test case fails.

```js
    test('passes for a callback that fails', () => {
        expect(() => {
            expect(true).toBe(false);
        }).toFailTest();
    });

    test('fails for a callback that succeeds', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        expect(() => {}).not.toFailTest();
    });
```

#### .toFailTestWith(expected)

Use '.toFailTestWith' to test a custom matcher by verifying that a test case fails as
expected and reports an error matching a supplied value.

```js
    test('fails for a callback that succeeds', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        expect(() => {}).not.toFailTestWith('whatever');
    });

    test('passes for a callback that fails with an error matching a supplied RegExp', () => {
        expect(() => {
            expect('hello').toEqual('goodbye');
        }).toFailTestWith(/expect/i);
    });

    test('passes for a callback that fails with an error matching a supplied string', () => {
        expect(() => {
            throw new Error('This is an error');
        }).toFailTestWith('This is an error');
    });

    test('passes for a callback that fails with an error matching a supplied array of strings', () => {
        expect(() => {
            throw new Error('This is an error\n  that spills over to a second line');
        }).toFailTestWith([
            'This is an error',
            '  that spills over to a second line',
        ]);
    });

    test('passes for a callback that fails with an error matching a supplied array of matchers', () => {
        expect(() => {
            throw new Error('This is an error\n  that spills over to a second line');
        }).toFailTestWith([
            expect.stringMatching(/error/i),
            expect.stringMatching(/spills/i),
        ]);
    });

    test('fails for a callback that fails with an unexpected value', () => {
        expect(() => {
            expect('hello').toBe('goodbye');
        }).not.toFailTestWith(/random text/i);
    });
```

#### .toFailTestAndMatchSnapshot()

Use '.toFailTestAndMatchSnapshot' to test a custom matcher by verifying that a test case
fails as expected and reports an error matching a stored snapshot.

```js
    test('passes for a test that fails with a result matching the snapshot', () => {
        expect(() => {
            expect(true).toBe(false);
        }).toFailTestAndMatchSnapshot();
    });

    test('fails for a test that does not fail', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        expect(() => {}).not.toFailTestAndMatchSnapshot();
    });
```

Note that snapshot testing for Jest itself can be tricky because different environments (e.g. CLI vs IDE vs CICD) might generate slightly different output due to e.g. differences in color display of diffs.   To facilitate snapshot testing across multiple environments, this library also provides an extensible set of snapshot resolvers that can be used to capture environment-specific snapshots.

## LICENSE

[MIT](/LICENSE)
