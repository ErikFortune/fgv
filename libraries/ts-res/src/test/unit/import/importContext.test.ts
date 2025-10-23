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

describe('importContext', () => {
  describe('importContext', () => {
    describe('create', () => {
      test('creates a new ImportContext with undefined baseId and empty conditions if not specified', () => {
        expect(TsRes.Import.ImportContext.create()).toSucceedAndSatisfy(
          (context: TsRes.Import.IValidatedImportContext) => {
            expect(context.baseId).toBeUndefined();
            expect(context.conditions).toEqual([]);
          }
        );
      });

      test('creates a new ImportContext with specified baseId and conditions', () => {
        const baseId = 'baseId';
        const conditions: TsRes.Conditions.IConditionDecl[] = [{ qualifierName: 'test', value: 'value' }];

        expect(TsRes.Import.ImportContext.create({ baseId, conditions })).toSucceedAndSatisfy(
          (context: TsRes.Import.IValidatedImportContext) => {
            expect(context.baseId).toBe(baseId);
            expect(context.conditions).toEqual(conditions);
          }
        );
      });

      test('fails if the baseId is invalid ResourceId', () => {
        expect(TsRes.Import.ImportContext.create({ baseId: 'bogus id' })).toFailWith(/invalid resource/i);
      });
    });

    describe('withConditions', () => {
      test('adds a name to an empty base context', () => {
        const context = TsRes.Import.ImportContext.create().orThrow();
        expect(context.withName('someName')).toSucceedAndSatisfy(
          (c2: TsRes.Import.IValidatedImportContext) => {
            expect(c2.baseId).toBe('someName');
            expect(c2.conditions).toEqual([]);
          }
        );
      });

      test('adds conditions to an empty base context', () => {
        const context = TsRes.Import.ImportContext.create().orThrow();
        const conditions: TsRes.Conditions.IConditionDecl[] = [{ qualifierName: 'test', value: 'value' }];

        expect(context.withConditions(conditions)).toSucceedAndSatisfy(
          (c2: TsRes.Import.IValidatedImportContext) => {
            expect(c2.baseId).toBeUndefined();
            expect(c2.conditions).toEqual(conditions);
          }
        );
      });

      test('adds a name to a context with a name', () => {
        const context = TsRes.Import.ImportContext.create({ baseId: 'baseId' }).orThrow();
        expect(context.withName('someName', 'more.stuff')).toSucceedAndSatisfy(
          (c2: TsRes.Import.IValidatedImportContext) => {
            expect(c2.baseId).toBe('baseId.someName.more.stuff');
            expect(c2.conditions).toEqual([]);
          }
        );
      });

      test('adds conditions to a context with conditions', () => {
        const conditions1 = [{ qualifierName: 'test', value: 'value' }];
        const context = TsRes.Import.ImportContext.create({
          baseId: 'baseId',
          conditions: conditions1
        }).orThrow();
        const conditions2: TsRes.Conditions.IConditionDecl[] = [{ qualifierName: 'test2', value: 'value2' }];

        expect(context.withConditions(conditions2)).toSucceedAndSatisfy(
          (c2: TsRes.Import.IValidatedImportContext) => {
            expect(c2.baseId).toBe('baseId');
            expect(c2.conditions).toEqual([...conditions1, ...conditions2]);
          }
        );
      });

      test('fails if any of the names to be added are not valid ResourceIds', () => {
        const context = TsRes.Import.ImportContext.create({ baseId: 'baseId' }).orThrow();
        expect(context.withName('bogus id')).toFailWith(/invalid resource/i);
      });
    });
  });

  describe('extend', () => {
    test('extends a context with a new baseId and conditions', () => {
      const conditions1 = [{ qualifierName: 'test', value: 'value' }];
      const context = TsRes.Import.ImportContext.create({
        baseId: 'baseId',
        conditions: conditions1
      }).orThrow();
      const conditions2: TsRes.Conditions.IConditionDecl[] = [{ qualifierName: 'test2', value: 'value2' }];

      expect(
        context.extend({ baseId: 'newBaseId' as TsRes.ResourceId, conditions: conditions2 })
      ).toSucceedAndSatisfy((c2: TsRes.Import.IValidatedImportContext) => {
        expect(c2.baseId).toBe('baseId.newBaseId');
        expect(c2.conditions).toEqual([...conditions1, ...conditions2]);
      });
    });
  });

  describe('forContainerImport', () => {
    let container: TsRes.ResourceJson.Normalized.IContainerContextDecl;
    let importer: TsRes.Import.ImportContext;

    beforeEach(() => {
      container = {
        baseId: 'baseId',
        conditions: [
          { qualifierName: 'test', value: 'value' },
          { qualifierName: 'test2', value: 'value2' }
        ]
      };
      importer = TsRes.Import.ImportContext.create({
        baseId: 'importerBaseId',
        conditions: [
          { qualifierName: 'importerTest', value: 'importerValue' },
          { qualifierName: 'importerTest2', value: 'importerValue2' }
        ]
      }).orThrow();
    });
    test('succeeds with undefined if importer context is undefined', () => {
      expect(TsRes.Import.ImportContext.forContainerImport()).toSucceedWith(undefined);
      expect(TsRes.Import.ImportContext.forContainerImport(container, undefined)).toSucceedWith(undefined);
    });

    test('succeeds with the importer context if the container context is undefined', () => {
      expect(TsRes.Import.ImportContext.forContainerImport(undefined, importer)).toSucceedWith(importer);
    });

    test('succeeds with the importer context if the container context has undefined merge method', () => {
      expect(TsRes.Import.ImportContext.forContainerImport(container, importer)).toSucceedWith(importer);
    });

    test('succeeds with the importer context if the container context has augment merge method', () => {
      container = { ...container, mergeMethod: 'augment' };
      expect(TsRes.Import.ImportContext.forContainerImport(container, importer)).toSucceedWith(importer);
    });

    test('succeeds with a reduced context if the container contains the replace merge method', () => {
      container = { ...container, mergeMethod: 'replace' };
      expect(TsRes.Import.ImportContext.forContainerImport(container, importer)).toSucceedAndSatisfy(
        (merged) => {
          expect(merged?.baseId).toBeUndefined();
          expect(merged?.conditions).toEqual([]);
        }
      );

      const c2: TsRes.ResourceJson.Normalized.IContainerContextDecl = {
        baseId: 'baseId',
        mergeMethod: 'replace'
      };
      expect(TsRes.Import.ImportContext.forContainerImport(c2, importer)).toSucceedAndSatisfy((merged) => {
        expect(merged?.baseId).toBeUndefined();
        expect(merged?.conditions).toEqual([
          { qualifierName: 'importerTest', value: 'importerValue' },
          { qualifierName: 'importerTest2', value: 'importerValue2' }
        ]);
      });

      const c3: TsRes.ResourceJson.Normalized.IContainerContextDecl = {
        conditions: [],
        mergeMethod: 'replace'
      };
      expect(TsRes.Import.ImportContext.forContainerImport(c3, importer)).toSucceedAndSatisfy((merged) => {
        expect(merged?.baseId).toEqual(importer.baseId);
        expect(merged?.conditions).toEqual([]);
      });
    });
  });
});
