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
          (context: TsRes.Import.IImportContext) => {
            expect(context.baseId).toBeUndefined();
            expect(context.conditions).toEqual([]);
          }
        );
      });

      test('creates a new ImportContext with specified baseId and conditions', () => {
        const baseId = 'baseId';
        const conditions: TsRes.Conditions.IConditionDecl[] = [{ qualifierName: 'test', value: 'value' }];

        expect(TsRes.Import.ImportContext.create(baseId, conditions)).toSucceedAndSatisfy(
          (context: TsRes.Import.IImportContext) => {
            expect(context.baseId).toBe(baseId);
            expect(context.conditions).toEqual(conditions);
          }
        );
      });

      test('fails if the baseId is not a valid ResourceId', () => {
        expect(TsRes.Import.ImportContext.create('bogus id')).toFailWith(/not a valid resource/i);
      });
    });

    describe('withConditions', () => {
      test('adds a name to an empty base context', () => {
        const context = TsRes.Import.ImportContext.create().orThrow();
        expect(context.withName('someName')).toSucceedAndSatisfy((c2: TsRes.Import.IImportContext) => {
          expect(c2.baseId).toBe('someName');
          expect(c2.conditions).toEqual([]);
        });
      });

      test('adds conditions to an empty base context', () => {
        const context = TsRes.Import.ImportContext.create().orThrow();
        const conditions: TsRes.Conditions.IConditionDecl[] = [{ qualifierName: 'test', value: 'value' }];

        expect(context.withConditions(conditions)).toSucceedAndSatisfy((c2: TsRes.Import.IImportContext) => {
          expect(c2.baseId).toBeUndefined();
          expect(c2.conditions).toEqual(conditions);
        });
      });

      test('adds a name to a context with a name', () => {
        const context = TsRes.Import.ImportContext.create('baseId').orThrow();
        expect(context.withName('someName', 'more.stuff')).toSucceedAndSatisfy(
          (c2: TsRes.Import.IImportContext) => {
            expect(c2.baseId).toBe('baseId.someName.more.stuff');
            expect(c2.conditions).toEqual([]);
          }
        );
      });

      test('adds conditions to a context with conditions', () => {
        const conditions1 = [{ qualifierName: 'test', value: 'value' }];
        const context = TsRes.Import.ImportContext.create('baseId', conditions1).orThrow();
        const conditions2: TsRes.Conditions.IConditionDecl[] = [{ qualifierName: 'test2', value: 'value2' }];

        expect(context.withConditions(conditions2)).toSucceedAndSatisfy((c2: TsRes.Import.IImportContext) => {
          expect(c2.baseId).toBe('baseId');
          expect(c2.conditions).toEqual([...conditions1, ...conditions2]);
        });
      });

      test('fails if any of the names to be added are not valid ResourceIds', () => {
        const context = TsRes.Import.ImportContext.create('baseId').orThrow();
        expect(context.withName('bogus id')).toFailWith(/not a valid resource/i);
      });
    });
  });
});
