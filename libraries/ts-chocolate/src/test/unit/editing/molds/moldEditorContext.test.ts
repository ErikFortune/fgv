// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import '@fgv/ts-utils-jest';
import { Converter, Converters } from '@fgv/ts-utils';
import { EditableCollection } from '../../../../packlets/editing';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { MoldEditorContext } from '../../../../packlets/editing/molds';
import { Molds, Converters as EntityConverters } from '../../../../packlets/entities';
import { BaseMoldId, MoldId, CollectionId } from '../../../../index';

type IMoldEntity = Molds.IMoldEntity;

const TEST_SOURCE_ID = 'test-molds' as CollectionId;
const testKeyConverter = Converters.string as unknown as Converter<BaseMoldId>;

describe('MoldEditorContext', () => {
  const createTestCollection = (
    items: Map<BaseMoldId, IMoldEntity> = new Map(),
    isMutable: boolean = true
  ): EditableCollection<IMoldEntity, BaseMoldId> => {
    return EditableCollection.createEditable<IMoldEntity, BaseMoldId>({
      collectionId: TEST_SOURCE_ID,
      metadata: { name: 'Test Molds' },
      isMutable,
      initialItems: items,
      keyConverter: testKeyConverter,
      valueConverter: EntityConverters.Molds.moldEntity
    }).orThrow();
  };

  const createValidMold = (baseId?: string, manufacturer?: string, productNumber?: string): IMoldEntity => ({
    baseId: (baseId ?? 'test-mold') as BaseMoldId,
    manufacturer: manufacturer ?? 'Test Manufacturer',
    productNumber: productNumber ?? 'TM-123',
    cavities: { kind: 'count', count: 24 },
    format: 'series-1000'
  });

  describe('createFromCollection', () => {
    test('succeeds with an empty mutable collection', () => {
      const collection = createTestCollection();
      expect(MoldEditorContext.createFromCollection(collection)).toSucceedAndSatisfy((context) => {
        expect(context).toBeInstanceOf(MoldEditorContext);
      });
    });

    test('fails for immutable collection', () => {
      const collection = createTestCollection(new Map(), false);
      expect(MoldEditorContext.createFromCollection(collection)).toFailWith(/immutable.*cannot be edited/i);
    });

    test('succeeds with a populated collection', () => {
      const items = new Map<BaseMoldId, IMoldEntity>();
      items.set('mold-1' as BaseMoldId, createValidMold('mold-1', 'Acme', 'AC-001'));
      const collection = createTestCollection(items);
      expect(MoldEditorContext.createFromCollection(collection)).toSucceedAndSatisfy((context) => {
        expect(context.exists('test-molds.mold-1' as MoldId)).toBe(true);
      });
    });
  });

  describe('getMoldDisplayName', () => {
    test('returns manufacturer and product number', () => {
      const collection = createTestCollection();
      const ctx = MoldEditorContext.createFromCollection(collection).orThrow();
      const mold = createValidMold('my-mold', 'Acme Corp', 'AC-789');
      expect(ctx.getMoldDisplayName(mold)).toBe('Acme Corp AC-789');
    });
  });

  describe('getMoldFormat', () => {
    test('returns the mold format', () => {
      const collection = createTestCollection();
      const ctx = MoldEditorContext.createFromCollection(collection).orThrow();
      const mold = createValidMold('my-mold', 'Acme', 'AC-123');
      expect(ctx.getMoldFormat(mold)).toBe('series-1000');
    });
  });

  describe('inherited CRUD operations', () => {
    test('create new mold with base method', () => {
      const collection = createTestCollection();
      const ctx = MoldEditorContext.createFromCollection(collection).orThrow();
      const mold = createValidMold();

      expect(ctx.create('my-mold' as BaseMoldId, mold)).toSucceedAndSatisfy((id) => {
        expect(id).toBe('test-molds.my-mold');
        expect(ctx.exists(id)).toBe(true);
      });
    });

    test('create new mold with auto-generated ID', () => {
      const collection = createTestCollection();
      const ctx = MoldEditorContext.createFromCollection(collection).orThrow();
      const mold = createValidMold('test-mold', 'Acme Corp', 'AC-789');

      expect(ctx.create(undefined, mold)).toSucceedAndSatisfy((id) => {
        expect(ctx.exists(id)).toBe(true);
      });
    });

    test('get existing mold', () => {
      const mold = createValidMold('mold-1', 'Acme', 'AC-001');
      const collection = createTestCollection(new Map([['mold-1' as BaseMoldId, mold]]));
      const ctx = MoldEditorContext.createFromCollection(collection).orThrow();

      expect(ctx.get('test-molds.mold-1' as MoldId)).toSucceedWith(mold);
    });

    test('update existing mold', () => {
      const mold = createValidMold('mold-1', 'Acme', 'AC-001');
      const collection = createTestCollection(new Map([['mold-1' as BaseMoldId, mold]]));
      const ctx = MoldEditorContext.createFromCollection(collection).orThrow();

      const updated = { ...mold, productNumber: 'AC-002' };
      expect(ctx.update('test-molds.mold-1' as MoldId, updated)).toSucceed();
      expect(ctx.get('test-molds.mold-1' as MoldId)).toSucceedWith(updated);
    });

    test('delete existing mold', () => {
      const mold = createValidMold('mold-1', 'Acme', 'AC-001');
      const collection = createTestCollection(new Map([['mold-1' as BaseMoldId, mold]]));
      const ctx = MoldEditorContext.createFromCollection(collection).orThrow();

      expect(ctx.delete('test-molds.mold-1' as MoldId)).toSucceed();
      expect(ctx.exists('test-molds.mold-1' as MoldId)).toBe(false);
    });
  });
});
