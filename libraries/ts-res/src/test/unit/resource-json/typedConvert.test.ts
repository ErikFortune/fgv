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
import { Converters } from '@fgv/ts-utils';
import * as TsRes from '../../../index';

// Phase B-2 cast-pressure regression tests for the ResourceJson typed
// Converter siblings. Mirrors conditions/typedConvert.test.ts but exercises
// the resource-json entry-point converters that consumers (e.g.
// ts-prompt-assist) wire into their importer / store layers.
describe('Phase B-2 ResourceJson typed Converter siblings (cast-pressure regression)', () => {
  const validNames = ['tone', 'language'] as const;
  type ValidName = (typeof validNames)[number];
  const qualifierNameConverter = Converters.enumeratedValue<ValidName>(validNames);

  describe('typedLooseConditionDecl', () => {
    test('accepts a declaration whose qualifierName is in the literal union', () => {
      const typedConverter = TsRes.ResourceJson.Convert.typedLooseConditionDecl(qualifierNameConverter);
      expect(typedConverter.convert({ qualifierName: 'tone', value: 'formal' })).toSucceedAndSatisfy((c) => {
        const narrowed: ValidName = c.qualifierName;
        expect(narrowed).toBe('tone');
      });
    });

    test("rejects a typo'd qualifierName at convert time", () => {
      const typedConverter = TsRes.ResourceJson.Convert.typedLooseConditionDecl(qualifierNameConverter);
      expect(typedConverter.convert({ qualifierName: 'tonr', value: 'formal' })).toFailWith(/tonr/);
    });

    test('the untyped default looseConditionDecl accepts arbitrary qualifierNames', () => {
      // Documents back-compat: default conversion still passes any string
      // qualifierName because `CommonConvert.qualifierName` is permissive at
      // the JSON shape level.
      expect(
        TsRes.ResourceJson.Convert.looseConditionDecl.convert({ qualifierName: 'tonr', value: 'formal' })
      ).toSucceed();
    });
  });

  describe('typedConditionSetDecl (array form)', () => {
    test("rejects a typo'd qualifierName in array form", () => {
      const typedConverter = TsRes.ResourceJson.Convert.typedConditionSetDecl(qualifierNameConverter);
      expect(typedConverter.convert([{ qualifierName: 'tonr', value: 'formal' }])).toFailWith(/tonr/);
    });

    test('accepts a valid array-form condition set', () => {
      const typedConverter = TsRes.ResourceJson.Convert.typedConditionSetDecl(qualifierNameConverter);
      expect(
        typedConverter.convert([
          { qualifierName: 'tone', value: 'formal' },
          { qualifierName: 'language', value: 'en' }
        ])
      ).toSucceed();
    });
  });

  describe('typedConditionSetDecl (record form)', () => {
    test("rejects a typo'd qualifierName in record form", () => {
      const typedConverter = TsRes.ResourceJson.Convert.typedConditionSetDecl(qualifierNameConverter);
      expect(typedConverter.convert({ tonr: 'formal' })).toFailWith(/tonr/);
    });

    test('accepts a valid record-form condition set', () => {
      const typedConverter = TsRes.ResourceJson.Convert.typedConditionSetDecl(qualifierNameConverter);
      expect(typedConverter.convert({ tone: 'formal', language: 'en' })).toSucceed();
    });

    test('rejects a non-object in record-form input via the underlying record guard', () => {
      const typedConverter = TsRes.ResourceJson.Convert.typedConditionSetDecl(qualifierNameConverter);
      // `oneOf` falls through to the record path when the array path fails;
      // a primitive fails both branches.
      expect(typedConverter.convert(42)).toFail();
    });

    test('accepts record-form values that supply IChildConditionDecl shape', () => {
      const typedConverter = TsRes.ResourceJson.Convert.typedConditionSetDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({
          tone: { value: 'formal', priority: 700 }
        })
      ).toSucceed();
    });
  });

  describe('typedLooseResourceCandidateDecl', () => {
    test("rejects a typo'd qualifierName inside conditions", () => {
      const typedConverter =
        TsRes.ResourceJson.Convert.typedLooseResourceCandidateDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({
          id: 'foo',
          json: { value: 'hello' },
          conditions: { tonr: 'formal' }
        })
      ).toFailWith(/tonr/);
    });

    test('accepts a valid candidate', () => {
      const typedConverter =
        TsRes.ResourceJson.Convert.typedLooseResourceCandidateDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({
          id: 'foo',
          json: { value: 'hello' },
          conditions: { tone: 'formal' }
        })
      ).toSucceed();
    });
  });

  describe('typedImporterResourceCandidateDecl', () => {
    test("rejects a typo'd qualifierName inside conditions", () => {
      const typedConverter =
        TsRes.ResourceJson.Convert.typedImporterResourceCandidateDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({
          json: { value: 'hello' },
          conditions: [{ qualifierName: 'tonr', value: 'formal' }]
        })
      ).toFailWith(/tonr/);
    });

    test('accepts a valid importer candidate', () => {
      const typedConverter =
        TsRes.ResourceJson.Convert.typedImporterResourceCandidateDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({
          json: { value: 'hello' },
          conditions: [{ qualifierName: 'tone', value: 'formal' }]
        })
      ).toSucceed();
    });
  });

  describe('typedChildResourceCandidateDecl', () => {
    test("rejects a typo'd qualifierName inside conditions", () => {
      const typedConverter =
        TsRes.ResourceJson.Convert.typedChildResourceCandidateDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({
          json: { value: 'hello' },
          conditions: { tonr: 'formal' }
        })
      ).toFailWith(/tonr/);
    });

    test('accepts a valid child candidate', () => {
      const typedConverter =
        TsRes.ResourceJson.Convert.typedChildResourceCandidateDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({
          json: { value: 'hello' },
          conditions: { tone: 'formal' }
        })
      ).toSucceed();
    });
  });

  describe('typedLooseResourceDecl', () => {
    test("rejects a typo'd qualifierName inside nested candidate conditions", () => {
      const typedConverter = TsRes.ResourceJson.Convert.typedLooseResourceDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({
          id: 'my-resource',
          resourceTypeName: 'string',
          candidates: [
            {
              json: { value: 'hello' },
              conditions: { tonr: 'formal' }
            }
          ]
        })
      ).toFailWith(/tonr/);
    });

    test('accepts a valid loose resource', () => {
      const typedConverter = TsRes.ResourceJson.Convert.typedLooseResourceDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({
          id: 'my-resource',
          resourceTypeName: 'string',
          candidates: [
            {
              json: { value: 'hello' },
              conditions: { tone: 'formal' }
            }
          ]
        })
      ).toSucceed();
    });
  });

  describe('typedChildResourceDecl', () => {
    test("rejects a typo'd qualifierName inside nested candidate conditions", () => {
      const typedConverter = TsRes.ResourceJson.Convert.typedChildResourceDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({
          resourceTypeName: 'string',
          candidates: [
            {
              json: { value: 'hello' },
              conditions: { tonr: 'formal' }
            }
          ]
        })
      ).toFailWith(/tonr/);
    });

    test('accepts a valid child resource', () => {
      const typedConverter = TsRes.ResourceJson.Convert.typedChildResourceDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({
          resourceTypeName: 'string',
          candidates: [{ json: { value: 'hello' } }]
        })
      ).toSucceed();
    });
  });

  describe('typedContainerContextDecl', () => {
    test("rejects a typo'd qualifierName inside container conditions", () => {
      const typedConverter = TsRes.ResourceJson.Convert.typedContainerContextDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({
          baseId: '',
          conditions: { tonr: 'formal' }
        })
      ).toFailWith(/tonr/);
    });

    test('accepts a valid container context', () => {
      const typedConverter = TsRes.ResourceJson.Convert.typedContainerContextDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({
          baseId: '',
          conditions: { tone: 'formal' }
        })
      ).toSucceed();
    });
  });

  describe('typedResourceTreeChildNodeDecl', () => {
    test("rejects a typo'd qualifierName deep in a tree node", () => {
      const typedConverter =
        TsRes.ResourceJson.Convert.typedResourceTreeChildNodeDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({
          resources: {
            r1: {
              resourceTypeName: 'string',
              candidates: [{ json: { value: 'hi' }, conditions: { tonr: 'formal' } }]
            }
          }
        })
      ).toFailWith(/tonr/);
    });

    test('handles nested children recursion', () => {
      const typedConverter =
        TsRes.ResourceJson.Convert.typedResourceTreeChildNodeDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({
          children: {
            sub: {
              resources: {
                r1: {
                  resourceTypeName: 'string',
                  candidates: [{ json: { value: 'hi' }, conditions: { tone: 'formal' } }]
                }
              }
            }
          }
        })
      ).toSucceed();
    });
  });

  describe('typedResourceTreeRootDecl', () => {
    test("rejects a typo'd qualifierName in tree root resources", () => {
      const typedConverter = TsRes.ResourceJson.Convert.typedResourceTreeRootDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({
          resources: {
            r1: {
              resourceTypeName: 'string',
              candidates: [{ json: { value: 'hi' }, conditions: { tonr: 'formal' } }]
            }
          }
        })
      ).toFailWith(/tonr/);
    });

    test('accepts a valid tree root with context and children', () => {
      const typedConverter = TsRes.ResourceJson.Convert.typedResourceTreeRootDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({
          context: { baseId: '', conditions: { tone: 'formal' } },
          resources: {
            r1: { resourceTypeName: 'string' }
          },
          children: {
            sub: { resources: { r2: { resourceTypeName: 'string' } } }
          }
        })
      ).toSucceed();
    });
  });

  describe('typedResourceCollectionDecl', () => {
    test("rejects a typo'd qualifierName in collection context conditions", () => {
      const typedConverter = TsRes.ResourceJson.Convert.typedResourceCollectionDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({
          context: { conditions: { tonr: 'formal' } }
        })
      ).toFailWith(/tonr/);
    });

    test('accepts a valid collection with candidates, resources, and nested collections', () => {
      const typedConverter = TsRes.ResourceJson.Convert.typedResourceCollectionDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({
          context: { conditions: { tone: 'formal' } },
          candidates: [{ id: 'cand', json: { value: 'hi' }, conditions: { language: 'en' } }],
          resources: [{ id: 'res', resourceTypeName: 'string' }],
          collections: [{}]
        })
      ).toSucceed();
    });
  });

  describe('typedImporterResourceCollectionDecl', () => {
    test("rejects a typo'd qualifierName in nested candidate", () => {
      const typedConverter =
        TsRes.ResourceJson.Convert.typedImporterResourceCollectionDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({
          candidates: [{ json: { value: 'hi' }, conditions: { tonr: 'formal' } }]
        })
      ).toFailWith(/tonr/);
    });

    test('accepts a valid importer collection with both loose and child resources', () => {
      const typedConverter =
        TsRes.ResourceJson.Convert.typedImporterResourceCollectionDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({
          context: { conditions: { tone: 'formal' } },
          candidates: [{ json: { value: 'hi' }, conditions: { tone: 'formal' } }],
          resources: [{ id: 'res1', resourceTypeName: 'string' }, { resourceTypeName: 'string' }],
          collections: [{}]
        })
      ).toSucceed();
    });
  });
});
