/*
 * Copyright (c) 2025 Erik Fortune
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

import '@fgv/ts-utils-jest';
import * as TsRes from '../../../index';

/**
 * Compile-time tests for the B-1 Decl-tree cascade parameterization.
 *
 * These tests verify that `TQualifierNames extends string = string` has been
 * threaded through the full container Decl chain so that consumers authoring
 * seeds in code get compile-time typo rejection.
 *
 * The `@ts-expect-error` directives are the load-bearing assertions — they
 * prove that TypeScript rejects the typo'd qualifier names at compile time.
 * The runtime assertions are secondary; they confirm that the valid forms
 * accepted by TS also work at runtime.
 */

describe('ResourceJson typed conditions (B-1 Decl-tree cascade)', () => {
  describe('IResourceCollectionDecl<TQualifierNames>', () => {
    test('accepts valid qualifier name in record-form ConditionSetDecl', () => {
      // TS should accept 'tone' since it's in the declared union.
      const valid: TsRes.ResourceJson.Json.IResourceCollectionDecl<'tone'> = {
        candidates: [
          {
            id: 'candidate-1',
            json: { value: 'hello' },
            conditions: { tone: 'formal' }
          }
        ]
      };
      // Runtime check: the object is assignable and has the expected shape.
      expect(valid.candidates).toHaveLength(1);
      expect(valid.candidates?.[0]?.conditions).toEqual({ tone: 'formal' });
    });

    test('accepts valid qualifier name in array-form ConditionSetDecl', () => {
      // TS should accept 'tone' in array form as well.
      const valid: TsRes.ResourceJson.Json.IResourceCollectionDecl<'tone'> = {
        candidates: [
          {
            id: 'candidate-1',
            json: { value: 'hello' },
            conditions: [{ qualifierName: 'tone', value: 'formal' }]
          }
        ]
      };
      expect(valid.candidates).toHaveLength(1);
    });

    test("rejects typo'd qualifier name at compile time", () => {
      // Compile-time check: 'tonr' is a typo for 'tone'.
      // The @ts-expect-error directive is the load-bearing assertion —
      // it proves TS rejects the invalid qualifier name.
      const _bad: TsRes.ResourceJson.Json.IResourceCollectionDecl<'tone'> = {
        candidates: [
          {
            id: 'candidate-1',
            json: { value: 'hello' },
            conditions: {
              // @ts-expect-error - 'tonr' is not assignable to 'tone'
              tonr: 'formal'
            }
          }
        ]
      };
      // The @ts-expect-error above is the point of this test.
      // We still need a runtime assertion to keep jest happy.
      expect(_bad).toBeDefined();
    });
  });

  describe('IChildResourceCandidateDecl<TQualifierNames>', () => {
    test('accepts valid qualifier name in conditions field', () => {
      const valid: TsRes.ResourceJson.Json.IChildResourceCandidateDecl<'language' | 'tone'> = {
        json: { value: 'hello' },
        conditions: { language: 'en', tone: 'formal' }
      };
      expect(valid.conditions).toBeDefined();
    });

    test("rejects typo'd qualifier name at compile time", () => {
      const _bad: TsRes.ResourceJson.Json.IChildResourceCandidateDecl<'language'> = {
        json: { value: 'hello' },
        conditions: {
          // @ts-expect-error - 'langauge' is not assignable to 'language'
          langauge: 'en'
        }
      };
      expect(_bad).toBeDefined();
    });
  });

  describe('IResourceTreeRootDecl<TQualifierNames>', () => {
    test('accepts valid qualifier name in resources candidates', () => {
      const valid: TsRes.ResourceJson.Json.IResourceTreeRootDecl<'tone'> = {
        resources: {
          'my-resource': {
            resourceTypeName: 'string',
            candidates: [
              {
                json: { value: 'hello' },
                conditions: { tone: 'formal' }
              }
            ]
          }
        }
      };
      expect(valid.resources).toBeDefined();
    });

    test("rejects typo'd qualifier name in resources candidates at compile time", () => {
      const _bad: TsRes.ResourceJson.Json.IResourceTreeRootDecl<'tone'> = {
        resources: {
          'my-resource': {
            resourceTypeName: 'string',
            candidates: [
              {
                json: { value: 'hello' },
                conditions: {
                  // @ts-expect-error - 'tonr' is not assignable to 'tone'
                  tonr: 'formal'
                }
              }
            ]
          }
        }
      };
      expect(_bad).toBeDefined();
    });

    test("rejects typo'd qualifier name in children resources at compile time", () => {
      const _bad: TsRes.ResourceJson.Json.IResourceTreeRootDecl<'tone'> = {
        children: {
          'my-child': {
            resources: {
              'child-resource': {
                resourceTypeName: 'string',
                candidates: [
                  {
                    json: { value: 'hello' },
                    conditions: {
                      // @ts-expect-error - 'tonr' is not assignable to 'tone'
                      tonr: 'formal'
                    }
                  }
                ]
              }
            }
          }
        }
      };
      expect(_bad).toBeDefined();
    });
  });

  describe('unparameterized (default string) form compiles unchanged', () => {
    test('unparameterized IResourceCollectionDecl accepts any string key', () => {
      // Default form (TQualifierNames = string) — existing callers unchanged.
      const untyped: TsRes.ResourceJson.Json.IResourceCollectionDecl = {
        candidates: [
          {
            id: 'candidate-1',
            json: { value: 'hello' },
            conditions: { anyKey: 'anyValue', anotherKey: 'anotherValue' }
          }
        ]
      };
      expect(untyped.candidates).toHaveLength(1);
    });

    test('unparameterized ConditionSetDecl accepts any string qualifier name', () => {
      // Default form — back-compat preserved.
      const untyped: TsRes.ResourceJson.Json.ConditionSetDecl = [
        { qualifierName: 'anyQualifier', value: 'anyValue' },
        { qualifierName: 'anotherQualifier', value: 'anotherValue' }
      ];
      expect(untyped).toHaveLength(2);
    });
  });
});
