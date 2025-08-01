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

import { JsonObject, JsonValue, isJsonObject, isJsonPrimitive } from '@fgv/ts-json-base';
import { DetailedResult, failWithDetail, succeedWithDetail } from '@fgv/ts-utils';
import '@fgv/ts-utils-jest';
import {
  EditorRules,
  IJsonEditorRule,
  JsonEditFailureReason,
  JsonEditor,
  JsonEditorState,
  JsonPropertyEditFailureReason
} from '../../../packlets/editor';

/* test data necessarily has lots of non-conformant names */
/* eslint-disable @typescript-eslint/naming-convention */

describe('JsonObjectEditor', () => {
  describe('create static method', () => {
    test('succeeds with no rules or context', () => {
      expect(JsonEditor.create()).toSucceedWith(expect.any(JsonEditor));
    });
  });

  describe('with no rules', () => {
    describe('mergeObjectsInPlace method', () => {
      const editor = JsonEditor.create().orThrow();

      describe('with valid json', () => {
        interface MergeSuccessCase {
          description: string;
          base: JsonObject;
          source: JsonObject;
          expected: JsonObject;
        }

        const goodTests: MergeSuccessCase[] = [
          {
            description: 'clobbers or adds primitive fields',
            base: {
              stringField: 'string',
              numberField: 10,
              boolField: true,
              untouchedField: 'untouched'
            },
            source: {
              stringField: 'updated string',
              numberField: 20,
              boolField: false,
              newString: 'new string'
            },
            expected: {
              stringField: 'updated string',
              numberField: 20,
              boolField: false,
              newString: 'new string',
              untouchedField: 'untouched'
            }
          },
          {
            description: 'merges or adds child objects',
            base: {
              untouchedChild: {
                untouchedNumber: 10
              },
              child: {
                untouchedString: 'original',
                replacedString: 'original'
              }
            },
            source: {
              child: {
                replacedString: 'replaced'
              },
              newChild: {
                newString: 'new'
              }
            },
            expected: {
              untouchedChild: {
                untouchedNumber: 10
              },
              child: {
                untouchedString: 'original',
                replacedString: 'replaced'
              },
              newChild: {
                newString: 'new'
              }
            }
          },
          {
            description: 'merges or adds child arrays',
            base: {
              untouchedArray: ['string', 'another string'],
              mergedArray: ['base string', 'base string 2']
            },
            source: {
              mergedArray: ['added string 1'],
              newArray: ['new string 1', 27]
            },
            expected: {
              untouchedArray: ['string', 'another string'],
              mergedArray: ['base string', 'base string 2', 'added string 1'],
              newArray: ['new string 1', 27]
            }
          },
          {
            description: 'ignores undefined source values',
            base: {
              untouchedArray: ['string', 'another string'],
              mergedArray: ['base string', 'base string 2']
            },
            source: {
              mergedArray: ['added string 1'],
              newArray: ['new string 1', 27],
              ignoreMePlease: undefined as unknown as JsonValue
            },
            expected: {
              untouchedArray: ['string', 'another string'],
              mergedArray: ['base string', 'base string 2', 'added string 1'],
              newArray: ['new string 1', 27]
            }
          }
        ];

        for (const t of goodTests) {
          test(`${t.description}`, () => {
            expect(editor.mergeObjectsInPlace({}, [t.base, t.source])).toSucceedAndSatisfy((got) => {
              expect(got).toEqual(t.expected);
              // expect(got).not.toBe(base);
            });
          });
        }
      });

      describe('with invalid json', () => {
        interface MergeFailureCase {
          description: string;
          expected: string | RegExp;
          base(): Record<string, unknown>;
          source(): Record<string, unknown>;
        }

        const failureTests: MergeFailureCase[] = [
          {
            description: 'fails for objects with function properties',
            base: () => {
              return {
                stringValue: 'string'
              };
            },
            source: () => {
              return {
                child: {
                  funcValue: () => 'hello'
                }
              };
            },
            expected: /invalid json/i
          },
          {
            description: 'fails for objects with an invalid array element',
            base: () => {
              return {
                arrayValue: [1, 2, 3]
              };
            },
            source: () => {
              return {
                arrayValue: [4, (() => true) as unknown as JsonValue]
              };
            },
            expected: /invalid json/i
          },
          {
            description: 'fails for objects with inherited properties',
            base: () => {
              return {
                arrayValue: [1, 2, 3]
              };
            },
            source: () => {
              const obj1 = {
                baseProp: 'from base'
              };
              return Object.create(obj1, {
                myProp: {
                  value: 'from child',
                  enumerable: true
                }
              });
            },
            expected: /merge inherited/i
          }
        ];

        failureTests.forEach((t) => {
          test(t.description, () => {
            const base = t.base() as JsonObject;
            const source = t.source() as JsonObject;
            expect(editor.mergeObjectsInPlace({}, [base, source])).toFailWith(t.expected);
          });
        });
      });
    });

    describe('clone method', () => {
      const editor = JsonEditor.create().orThrow();

      describe('with valid json', () => {
        const good: JsonValue[] = [
          'literal string',
          123,
          false,
          ['array', 123],
          {
            child: {
              prop: 'value',
              array: [
                {
                  prop: 'object in array'
                }
              ]
            },
            arrayInArray: [
              ['hello', 'goodbye'],
              [123, true],
              {
                arrayInObjectInArrayInArray: ['deep']
              }
            ]
          }
        ];
        test('succeeds with valid JSON', () => {
          for (const t of good) {
            expect(editor.clone(t)).toSucceedAndSatisfy((cloned) => {
              expect(cloned).toEqual(t);
              if (!isJsonPrimitive(cloned)) {
                expect(cloned).not.toBe(t);
              }
            });
          }
        });
      });
    });
  });

  describe('merge methods', () => {
    const base = {
      baseString: 'baseString'
    };
    const toMerge = {
      mergedString: 'mergedString'
    };
    const expected = {
      baseString: 'baseString',
      mergedString: 'mergedString'
    };

    describe('mergeObjectInPlace method', () => {
      test('updates the supplied target object', () => {
        const b = JSON.parse(JSON.stringify(base));
        expect(JsonEditor.default.mergeObjectInPlace(b, toMerge)).toSucceedAndSatisfy((merged) => {
          expect(merged).toEqual(expected);
          expect(merged).toBe(b);
          expect(b).toEqual(expected);
        });
      });
    });

    describe('mergeObjectsInPlace method', () => {
      const toMerge2 = {
        mergedString: 'mergedOverride',
        extraMergedString: 'extraMerged'
      };
      const expected2 = {
        baseString: 'baseString',
        mergedString: 'mergedOverride',
        extraMergedString: 'extraMerged'
      };
      test('updates the supplied target object', () => {
        const b = JSON.parse(JSON.stringify(base));
        expect(JsonEditor.default.mergeObjectsInPlace(b, [toMerge, toMerge2])).toSucceedAndSatisfy(
          (merged) => {
            expect(merged).toEqual(expected2);
            expect(merged).toBe(b);
            expect(b).toEqual(expected2);
          }
        );
      });
    });
  });

  describe('with rules', () => {
    class TestRule implements IJsonEditorRule {
      public editProperty(
        key: string,
        value: JsonValue,
        _state: JsonEditorState
      ): DetailedResult<JsonObject, JsonPropertyEditFailureReason> {
        if (key === 'replace:flatten') {
          if (Array.isArray(value) || typeof value !== 'object' || value === null) {
            return failWithDetail(`${key}: cannot flatten non-object`, 'error');
          }
          return succeedWithDetail(value, 'edited');
        } else if (value === 'replace:object') {
          const toMerge: JsonObject = {};
          toMerge[key] = { child1: '{{var1}}', child2: 'value2' };
          return succeedWithDetail(toMerge, 'edited');
        } else if (key === 'replace:ignore') {
          return failWithDetail('ignored', 'ignore');
        } else if (key === 'replace:error') {
          return failWithDetail('forced error', 'error');
        } else if (key === 'replace:badChild') {
          return succeedWithDetail({
            badFunc: (() => true) as unknown as JsonValue
          });
        } else if (key === 'replace:defer') {
          if (isJsonObject(value)) {
            return succeedWithDetail(value, 'deferred');
          }
        }
        return failWithDetail('inapplicable', 'inapplicable');
      }

      public editValue(
        value: JsonValue,
        _state: JsonEditorState
      ): DetailedResult<JsonValue, JsonEditFailureReason> {
        if (value === 'replace:object') {
          return succeedWithDetail({ child1: '{{var1}}', child2: 'value2' }, 'edited');
        } else if (value === 'replace:error') {
          return failWithDetail('forced error', 'error');
        } else if (value === 'replace:badChild') {
          return succeedWithDetail({
            badFunc: (() => true) as unknown as JsonValue
          });
        } else if (value === 'replace:ignore') {
          return failWithDetail('ignored', 'ignore');
        }
        return failWithDetail('inapplicable', 'inapplicable');
      }

      public finalizeProperties(
        deferred: JsonObject[],
        _state: JsonEditorState
      ): DetailedResult<JsonObject[], JsonEditFailureReason> {
        if (deferred.length > 0) {
          const fail = deferred.filter((o) => Object.values(o).includes('replace:error'));
          if (fail.length > 0) {
            return failWithDetail('forced error', 'error');
          }
          const toUse = deferred.filter((o) => !Object.values(o).includes('replace:ignore'));
          if (toUse.length === 0) {
            return failWithDetail('forced ignore', 'ignore');
          }
          return succeedWithDetail(toUse);
        }
        return failWithDetail('inapplicable', 'inapplicable');
      }
    }

    describe('constructor', () => {
      test('succeeds with rules present', () => {
        expect(JsonEditor.create(undefined, [new TestRule()])).toSucceedWith(expect.any(JsonEditor));
      });
    });

    describe('clone method', () => {
      const context = { vars: { var1: 'value1' } };
      const rules = [new EditorRules.TemplatedJsonEditorRule(), new TestRule()];
      const editor = JsonEditor.create({ context }, rules).orThrow();
      test('edit function replaces literal values', () => {
        expect(
          editor.clone({
            someLiteral: '{{var1}}',
            'replace:flatten': {
              child1: '{{var1}}',
              child2: 'value2'
            },
            child: 'replace:object',
            c2: {
              c2obj: 'replace:object'
            },
            a1: ['replace:object']
          })
        ).toSucceedWith({
          someLiteral: 'value1',
          child1: 'value1',
          child2: 'value2',
          child: {
            child1: 'value1',
            child2: 'value2'
          },
          c2: {
            c2obj: {
              child1: 'value1',
              child2: 'value2'
            }
          },
          a1: [
            {
              child1: 'value1',
              child2: 'value2'
            }
          ]
        });
      });

      test('edit functions can ignore properties and values', () => {
        expect(
          editor.clone({
            used: 'used',
            'replace:ignore': 'ignored'
          })
        ).toSucceedWith({
          used: 'used'
        });

        expect(
          editor.clone({
            used: 'used',
            ignored: 'replace:ignore'
          })
        ).toSucceedWith({
          used: 'used'
        });

        expect(
          editor.clone({
            array: ['used', 'replace:ignore', 'also used']
          })
        ).toSucceedWith({
          array: ['used', 'also used']
        });
      });

      test('finalize functions can ignore deferred values', () => {
        expect(
          editor.clone({
            unconditional: 'value',
            'replace:defer': {
              ignore: 'replace:ignore'
            }
          })
        ).toSucceedWith({
          unconditional: 'value'
        });
      });

      test('propagates errors from the edit function', () => {
        expect(
          editor.clone({
            someLiteral: '{{var1}}',
            'replace:flatten': 'hello'
          })
        ).toFailWith(/cannot flatten/i);

        expect(
          editor.clone({
            'replace:error': 'hello'
          })
        ).toFailWith(/forced error/i);

        expect(
          editor.clone({
            bad: 'replace:error'
          })
        ).toFailWith(/forced error/i);

        expect(
          editor.clone({
            array: ['replace:error']
          })
        ).toFailWith(/forced error/i);

        expect(
          editor.clone({
            badChild: 'replace:badChild'
          })
        ).toFailWith(/invalid json/i);

        expect(
          editor.clone({
            'replace:badChild': 'whatever'
          })
        ).toFailWith(/invalid json/i);

        expect(
          editor.clone({
            child: {
              'replace:error': 'goodbye'
            }
          })
        ).toFailWith(/forced error/i);
      });

      test('propagates an error from the finalize function', () => {
        expect(
          editor.clone({
            'replace:defer': {
              property: 'replace:error'
            }
          })
        ).toFailWith(/forced error/i);
      });
    });
  });

  describe('array merge behavior configuration', () => {
    describe('with append behavior (default)', () => {
      const editor = JsonEditor.create({
        validation: {
          onInvalidPropertyName: 'error',
          onInvalidPropertyValue: 'error',
          onUndefinedPropertyValue: 'ignore'
        },
        merge: {
          arrayMergeBehavior: 'append'
        }
      }).orThrow();

      test('appends new array elements to existing arrays', () => {
        const base = {
          numbers: [1, 2],
          strings: ['a', 'b'],
          mixed: [1, 'a', true]
        };
        const source = {
          numbers: [3, 4],
          strings: ['c'],
          mixed: [false, 'z']
        };
        const expected = {
          numbers: [1, 2, 3, 4],
          strings: ['a', 'b', 'c'],
          mixed: [1, 'a', true, false, 'z']
        };

        expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
      });

      test('handles empty arrays correctly', () => {
        const base = { emptyArray: [], existingArray: [1, 2] };
        const source = { emptyArray: [1], existingArray: [] };
        const expected = { emptyArray: [1], existingArray: [1, 2] };

        expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
      });

      test('creates new arrays when base property does not exist', () => {
        const base = { existing: [1] };
        const source = { existing: [2], newArray: [3, 4] };
        const expected = { existing: [1, 2], newArray: [3, 4] };

        expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
      });
    });

    describe('with replace behavior', () => {
      const editor = JsonEditor.create({
        validation: {
          onInvalidPropertyName: 'error',
          onInvalidPropertyValue: 'error',
          onUndefinedPropertyValue: 'ignore'
        },
        merge: {
          arrayMergeBehavior: 'replace'
        }
      }).orThrow();

      test('replaces existing arrays completely with new arrays', () => {
        const base = {
          numbers: [1, 2, 3],
          strings: ['old1', 'old2'],
          mixed: [1, 'old', true]
        };
        const source = {
          numbers: [99],
          strings: ['new'],
          mixed: ['completely', 'different']
        };
        const expected = {
          numbers: [99],
          strings: ['new'],
          mixed: ['completely', 'different']
        };

        expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
      });

      test('replaces with empty arrays', () => {
        const base = { fullArray: [1, 2, 3, 4] };
        const source = { fullArray: [] };
        const expected = { fullArray: [] };

        expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
      });

      test('creates new arrays when base property does not exist', () => {
        const base = { existing: [1, 2, 3] };
        const source = { existing: [99], newArray: [5, 6] };
        const expected = { existing: [99], newArray: [5, 6] };

        expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
      });
    });

    describe('array merge behavior with nested objects', () => {
      test('append behavior works with nested structures', () => {
        const editor = JsonEditor.create({
          validation: {
            onInvalidPropertyName: 'error',
            onInvalidPropertyValue: 'error',
            onUndefinedPropertyValue: 'ignore'
          },
          merge: {
            arrayMergeBehavior: 'append'
          }
        }).orThrow();

        const base = {
          nested: {
            items: [{ id: 1 }, { id: 2 }]
          }
        };
        const source = {
          nested: {
            items: [{ id: 3 }]
          }
        };
        const expected = {
          nested: {
            items: [{ id: 1 }, { id: 2 }, { id: 3 }]
          }
        };

        expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
      });

      test('replace behavior works with nested structures', () => {
        const editor = JsonEditor.create({
          validation: {
            onInvalidPropertyName: 'error',
            onInvalidPropertyValue: 'error',
            onUndefinedPropertyValue: 'ignore'
          },
          merge: {
            arrayMergeBehavior: 'replace'
          }
        }).orThrow();

        const base = {
          nested: {
            items: [{ id: 1 }, { id: 2 }]
          }
        };
        const source = {
          nested: {
            items: [{ id: 99 }]
          }
        };
        const expected = {
          nested: {
            items: [{ id: 99 }]
          }
        };

        expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
      });
    });

    describe('clone method with array merge behaviors', () => {
      test('append behavior works in clone operations', () => {
        const editor = JsonEditor.create({
          validation: {
            onInvalidPropertyName: 'error',
            onInvalidPropertyValue: 'error',
            onUndefinedPropertyValue: 'ignore'
          },
          merge: {
            arrayMergeBehavior: 'append'
          }
        }).orThrow();

        const input = {
          arrays: [1, 2, 3],
          nested: {
            moreArrays: ['a', 'b']
          }
        };

        expect(editor.clone(input)).toSucceedAndSatisfy((cloned) => {
          expect(cloned).toEqual(input);
          expect(cloned).not.toBe(input);
        });
      });

      test('replace behavior works in clone operations', () => {
        const editor = JsonEditor.create({
          validation: {
            onInvalidPropertyName: 'error',
            onInvalidPropertyValue: 'error',
            onUndefinedPropertyValue: 'ignore'
          },
          merge: {
            arrayMergeBehavior: 'replace'
          }
        }).orThrow();

        const input = {
          arrays: [1, 2, 3],
          nested: {
            moreArrays: ['a', 'b']
          }
        };

        expect(editor.clone(input)).toSucceedAndSatisfy((cloned) => {
          expect(cloned).toEqual(input);
          expect(cloned).not.toBe(input);
        });
      });
    });

    describe('default options behavior', () => {
      test('default editor uses append behavior', () => {
        const editor = JsonEditor.create().orThrow();

        expect(editor.options.merge?.arrayMergeBehavior).toBe('append');

        const base = { arr: [1, 2] };
        const source = { arr: [3] };
        const expected = { arr: [1, 2, 3] };

        expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
      });

      test('partial options preserve default merge behavior', () => {
        const editor = JsonEditor.create({
          validation: {
            onInvalidPropertyName: 'ignore',
            onInvalidPropertyValue: 'ignore',
            onUndefinedPropertyValue: 'ignore'
          }
        }).orThrow();

        expect(editor.options.merge?.arrayMergeBehavior).toBe('append');
      });
    });

    describe('edge cases and error conditions', () => {
      test('handles mixed data types in array merge - append', () => {
        const editor = JsonEditor.create({
          validation: {
            onInvalidPropertyName: 'error',
            onInvalidPropertyValue: 'error',
            onUndefinedPropertyValue: 'ignore'
          },
          merge: {
            arrayMergeBehavior: 'append'
          }
        }).orThrow();

        const base: JsonObject = {
          mixed: [1, 'string', true, null, { key: 'value' }]
        };
        const source: JsonObject = {
          mixed: [false, 42, 'another', { other: 'data' }]
        };
        const expected: JsonObject = {
          mixed: [1, 'string', true, null, { key: 'value' }, false, 42, 'another', { other: 'data' }]
        };

        expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
      });

      test('handles mixed data types in array merge - replace', () => {
        const editor = JsonEditor.create({
          validation: {
            onInvalidPropertyName: 'error',
            onInvalidPropertyValue: 'error',
            onUndefinedPropertyValue: 'ignore'
          },
          merge: {
            arrayMergeBehavior: 'replace'
          }
        }).orThrow();

        const base: JsonObject = {
          mixed: [1, 'string', true, null, { key: 'value' }]
        };
        const source: JsonObject = {
          mixed: [false, 42]
        };
        const expected: JsonObject = {
          mixed: [false, 42]
        };

        expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
      });

      test('array merge behavior does not affect non-array properties', () => {
        const editor = JsonEditor.create({
          validation: {
            onInvalidPropertyName: 'error',
            onInvalidPropertyValue: 'error',
            onUndefinedPropertyValue: 'ignore'
          },
          merge: {
            arrayMergeBehavior: 'replace'
          }
        }).orThrow();

        const base = {
          arrays: [1, 2],
          objects: { a: 1, b: 2 },
          primitives: 'original'
        };
        const source = {
          arrays: [3],
          objects: { b: 99, c: 3 },
          primitives: 'updated'
        };
        const expected = {
          arrays: [3],
          objects: { a: 1, b: 99, c: 3 },
          primitives: 'updated'
        };

        expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
      });

      test('handles null and undefined values correctly with arrays', () => {
        const editor = JsonEditor.create({
          validation: {
            onInvalidPropertyName: 'error',
            onInvalidPropertyValue: 'error',
            onUndefinedPropertyValue: 'ignore'
          },
          merge: {
            arrayMergeBehavior: 'append'
          }
        }).orThrow();

        const base = {
          withNull: [null, 1],
          normalArray: [1, 2]
        };
        const source = {
          withNull: [2, null],
          normalArray: [3],
          undefinedValue: undefined as unknown as JsonValue
        };
        const expected = {
          withNull: [null, 1, 2, null],
          normalArray: [1, 2, 3]
        };

        expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
      });

      test('deeply nested array merge behavior', () => {
        const editor = JsonEditor.create({
          validation: {
            onInvalidPropertyName: 'error',
            onInvalidPropertyValue: 'error',
            onUndefinedPropertyValue: 'ignore'
          },
          merge: {
            arrayMergeBehavior: 'replace'
          }
        }).orThrow();

        const base = {
          level1: {
            level2: {
              level3: {
                deepArray: [1, 2, 3]
              }
            }
          }
        };
        const source = {
          level1: {
            level2: {
              level3: {
                deepArray: [99]
              }
            }
          }
        };
        const expected = {
          level1: {
            level2: {
              level3: {
                deepArray: [99]
              }
            }
          }
        };

        expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
      });

      test('large array performance with append', () => {
        const editor = JsonEditor.create({
          validation: {
            onInvalidPropertyName: 'error',
            onInvalidPropertyValue: 'error',
            onUndefinedPropertyValue: 'ignore'
          },
          merge: {
            arrayMergeBehavior: 'append'
          }
        }).orThrow();

        const largeArray1 = Array.from({ length: 1000 }, (_, i) => i);
        const largeArray2 = Array.from({ length: 500 }, (_, i) => i + 1000);

        const base = { large: largeArray1 };
        const source = { large: largeArray2 };
        const expected = { large: [...largeArray1, ...largeArray2] };

        expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
      });

      test('array replacement when base is not an array', () => {
        const editor = JsonEditor.create({
          validation: {
            onInvalidPropertyName: 'error',
            onInvalidPropertyValue: 'error',
            onUndefinedPropertyValue: 'ignore'
          },
          merge: {
            arrayMergeBehavior: 'replace'
          }
        }).orThrow();

        const base = {
          notArray: 'primitive value',
          alsoNotArray: { object: 'value' }
        };
        const source = {
          notArray: [1, 2, 3],
          alsoNotArray: ['a', 'b']
        };
        const expected = {
          notArray: [1, 2, 3],
          alsoNotArray: ['a', 'b']
        };

        expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
      });

      describe('nullAsDelete merge option', () => {
        test('deletes properties when nullAsDelete is true and value is null', () => {
          const editor = JsonEditor.create({
            validation: {
              onInvalidPropertyName: 'error',
              onInvalidPropertyValue: 'error',
              onUndefinedPropertyValue: 'ignore'
            },
            merge: {
              arrayMergeBehavior: 'append',
              nullAsDelete: true
            }
          }).orThrow();

          const base = {
            keepThisProperty: 'keep',
            deleteThisProperty: 'will be deleted',
            alsoDelete: { nested: 'object' }
          };
          const source = {
            keepThisProperty: 'updated',
            deleteThisProperty: null,
            alsoDelete: null,
            newProperty: 'new value'
          };
          const expected = {
            keepThisProperty: 'updated',
            newProperty: 'new value'
          };

          expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
        });

        test('preserves null values when nullAsDelete is false', () => {
          const editor = JsonEditor.create({
            validation: {
              onInvalidPropertyName: 'error',
              onInvalidPropertyValue: 'error',
              onUndefinedPropertyValue: 'ignore'
            },
            merge: {
              arrayMergeBehavior: 'append',
              nullAsDelete: false
            }
          }).orThrow();

          const base = {
            keepThisProperty: 'keep',
            willBecomeNull: 'will become null'
          };
          const source = {
            keepThisProperty: 'updated',
            willBecomeNull: null,
            newNullProperty: null
          };
          const expected = {
            keepThisProperty: 'updated',
            willBecomeNull: null,
            newNullProperty: null
          };

          expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
        });

        test('defaults to false when nullAsDelete is not specified', () => {
          const editor = JsonEditor.create({
            validation: {
              onInvalidPropertyName: 'error',
              onInvalidPropertyValue: 'error',
              onUndefinedPropertyValue: 'ignore'
            },
            merge: {
              arrayMergeBehavior: 'append'
            }
          }).orThrow();

          const base = {
            keepThisProperty: 'keep',
            willBecomeNull: 'will become null'
          };
          const source = {
            keepThisProperty: 'updated',
            willBecomeNull: null
          };
          const expected = {
            keepThisProperty: 'updated',
            willBecomeNull: null
          };

          expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
        });

        test('nullAsDelete works with nested objects', () => {
          const editor = JsonEditor.create({
            validation: {
              onInvalidPropertyName: 'error',
              onInvalidPropertyValue: 'error',
              onUndefinedPropertyValue: 'ignore'
            },
            merge: {
              arrayMergeBehavior: 'append',
              nullAsDelete: true
            }
          }).orThrow();

          const base = {
            level1: {
              keep: 'this',
              delete: 'this will be deleted',
              nested: {
                alsoKeep: 'this',
                alsoDelete: 'this will also be deleted'
              }
            }
          };
          const source = {
            level1: {
              keep: 'updated',
              delete: null,
              nested: {
                alsoKeep: 'updated nested',
                alsoDelete: null,
                newProp: 'new nested value'
              }
            }
          };
          const expected = {
            level1: {
              keep: 'updated',
              nested: {
                alsoKeep: 'updated nested',
                newProp: 'new nested value'
              }
            }
          };

          expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
        });

        test('nullAsDelete does not affect arrays with null elements', () => {
          const editor = JsonEditor.create({
            validation: {
              onInvalidPropertyName: 'error',
              onInvalidPropertyValue: 'error',
              onUndefinedPropertyValue: 'ignore'
            },
            merge: {
              arrayMergeBehavior: 'append',
              nullAsDelete: true
            }
          }).orThrow();

          const base = {
            arrayWithNulls: [1, null, 3],
            regularProperty: 'keep'
          };
          const source = {
            arrayWithNulls: [null, 4],
            regularProperty: null,
            newArray: [null, 'value', null]
          };
          const expected = {
            arrayWithNulls: [1, null, 3, null, 4],
            newArray: [null, 'value', null]
          };

          expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
        });

        test('clone method preserves null values when nullAsDelete is enabled', () => {
          const editor = JsonEditor.create({
            validation: {
              onInvalidPropertyName: 'error',
              onInvalidPropertyValue: 'error',
              onUndefinedPropertyValue: 'ignore'
            },
            merge: {
              arrayMergeBehavior: 'append',
              nullAsDelete: true
            }
          }).orThrow();

          const objectWithNulls = {
            keep: 'this value',
            shouldBePreserved: null,
            nested: {
              alsoKeep: 'nested value',
              alsoPreserved: null
            }
          };

          expect(editor.clone(objectWithNulls)).toSucceedAndSatisfy((cloned) => {
            expect(cloned).toEqual({
              keep: 'this value',
              shouldBePreserved: null,
              nested: {
                alsoKeep: 'nested value',
                alsoPreserved: null
              }
            });
          });
        });

        test('nullAsDelete works with arrayMergeBehavior replace', () => {
          const editor = JsonEditor.create({
            validation: {
              onInvalidPropertyName: 'error',
              onInvalidPropertyValue: 'error',
              onUndefinedPropertyValue: 'ignore'
            },
            merge: {
              arrayMergeBehavior: 'replace',
              nullAsDelete: true
            }
          }).orThrow();

          const base = {
            arrays: [1, 2, 3],
            deleteMe: 'will be deleted',
            keepMe: 'will be kept'
          };
          const source = {
            arrays: [4, 5],
            deleteMe: null,
            keepMe: 'updated'
          };
          const expected = {
            arrays: [4, 5],
            keepMe: 'updated'
          };

          expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
        });

        test('single object merge with nullAsDelete', () => {
          const editor = JsonEditor.create({
            validation: {
              onInvalidPropertyName: 'error',
              onInvalidPropertyValue: 'error',
              onUndefinedPropertyValue: 'ignore'
            },
            merge: {
              arrayMergeBehavior: 'append',
              nullAsDelete: true
            }
          }).orThrow();

          const target = {
            existing: 'value',
            toDelete: 'will be deleted'
          };
          const source = {
            existing: 'updated',
            toDelete: null,
            newProp: 'new value'
          };

          expect(editor.mergeObjectInPlace(target, source)).toSucceedAndSatisfy((result) => {
            expect(result).toBe(target); // Should modify in place
            expect(result).toEqual({
              existing: 'updated',
              newProp: 'new value'
            });
          });
        });

        test('empty object edge cases with nullAsDelete', () => {
          const editor = JsonEditor.create({
            validation: {
              onInvalidPropertyName: 'error',
              onInvalidPropertyValue: 'error',
              onUndefinedPropertyValue: 'ignore'
            },
            merge: {
              arrayMergeBehavior: 'append',
              nullAsDelete: true
            }
          }).orThrow();

          // Empty base, source with null
          expect(editor.mergeObjectsInPlace({}, [{}, { nullProp: null }])).toSucceedWith({});

          // Base with properties, source with only null
          expect(
            editor.mergeObjectsInPlace({}, [{ keep: 'value', delete: 'this' }, { delete: null }])
          ).toSucceedWith({ keep: 'value' });

          // Both empty
          expect(editor.mergeObjectsInPlace({}, [{}, {}])).toSucceedWith({});
        });

        test('mixed null and undefined behavior with nullAsDelete', () => {
          const editor = JsonEditor.create({
            validation: {
              onInvalidPropertyName: 'error',
              onInvalidPropertyValue: 'error',
              onUndefinedPropertyValue: 'ignore'
            },
            merge: {
              arrayMergeBehavior: 'append',
              nullAsDelete: true
            }
          }).orThrow();

          const base = {
            deleteWithNull: 'delete me',
            ignoreUndefined: 'keep me',
            normalProp: 'update me'
          };
          const source = {
            deleteWithNull: null,
            ignoreUndefined: undefined as unknown as JsonValue,
            normalProp: 'updated',
            newProp: 'new'
          };
          const expected = {
            ignoreUndefined: 'keep me',
            normalProp: 'updated',
            newProp: 'new'
          };

          expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
        });

        test('deeply nested null deletion', () => {
          const editor = JsonEditor.create({
            validation: {
              onInvalidPropertyName: 'error',
              onInvalidPropertyValue: 'error',
              onUndefinedPropertyValue: 'ignore'
            },
            merge: {
              arrayMergeBehavior: 'append',
              nullAsDelete: true
            }
          }).orThrow();

          const base = {
            level1: {
              level2: {
                level3: {
                  level4: {
                    deleteMe: 'deep deletion',
                    keepMe: 'deep value'
                  }
                }
              }
            }
          };
          const source = {
            level1: {
              level2: {
                level3: {
                  level4: {
                    deleteMe: null,
                    keepMe: 'updated deep value'
                  }
                }
              }
            }
          };
          const expected = {
            level1: {
              level2: {
                level3: {
                  level4: {
                    keepMe: 'updated deep value'
                  }
                }
              }
            }
          };

          expect(editor.mergeObjectsInPlace({}, [base, source])).toSucceedWith(expected);
        });
      });
    });
  });
});
