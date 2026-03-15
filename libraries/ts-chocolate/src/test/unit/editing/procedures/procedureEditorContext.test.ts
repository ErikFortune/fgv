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
import { ProcedureEditorContext } from '../../../../packlets/editing/procedures';
import { Procedures, Converters as EntityConverters } from '../../../../packlets/entities';
import { BaseProcedureId, ProcedureId, CollectionId, TaskId } from '../../../../index';

type IProcedureEntity = Procedures.IProcedureEntity;

const TEST_SOURCE_ID = 'test-procedures' as CollectionId;
const testKeyConverter = Converters.string as unknown as Converter<BaseProcedureId>;

describe('ProcedureEditorContext', () => {
  const createTestCollection = (
    items: Map<BaseProcedureId, IProcedureEntity> = new Map(),
    isMutable: boolean = true
  ): EditableCollection<IProcedureEntity, BaseProcedureId> => {
    return EditableCollection.createEditable<IProcedureEntity, BaseProcedureId>({
      collectionId: TEST_SOURCE_ID,
      metadata: { name: 'Test Procedures' },
      isMutable,
      initialItems: items,
      keyConverter: testKeyConverter,
      valueConverter: EntityConverters.Procedures.procedureEntity
    }).orThrow();
  };

  const createValidProcedure = (baseId?: string, name?: string): IProcedureEntity => ({
    baseId: (baseId ?? 'test-procedure') as BaseProcedureId,
    name: name ?? 'Test Procedure',
    steps: [
      {
        order: 1,
        task: {
          taskId: 'common.melt' as TaskId,
          params: { temp: 45 }
        }
      }
    ]
  });

  describe('createFromCollection', () => {
    test('succeeds with an empty mutable collection', () => {
      const collection = createTestCollection();
      expect(ProcedureEditorContext.createFromCollection(collection)).toSucceedAndSatisfy((context) => {
        expect(context).toBeInstanceOf(ProcedureEditorContext);
      });
    });

    test('fails for immutable collection', () => {
      const collection = createTestCollection(new Map(), false);
      expect(ProcedureEditorContext.createFromCollection(collection)).toFailWith(
        /immutable.*cannot be edited/i
      );
    });

    test('succeeds with a populated collection', () => {
      const items = new Map<BaseProcedureId, IProcedureEntity>();
      items.set('proc-1' as BaseProcedureId, createValidProcedure('proc-1', 'Procedure One'));
      const collection = createTestCollection(items);
      expect(ProcedureEditorContext.createFromCollection(collection)).toSucceedAndSatisfy((context) => {
        expect(context.exists('test-procedures.proc-1' as ProcedureId)).toBe(true);
      });
    });
  });

  describe('inherited CRUD operations', () => {
    test('create new procedure with base method', () => {
      const collection = createTestCollection();
      const ctx = ProcedureEditorContext.createFromCollection(collection).orThrow();
      const procedure = createValidProcedure();

      expect(ctx.create('my-procedure' as BaseProcedureId, procedure)).toSucceedAndSatisfy((id) => {
        expect(id).toBe('test-procedures.my-procedure');
        expect(ctx.exists(id)).toBe(true);
      });
    });

    test('create new procedure with auto-generated ID', () => {
      const collection = createTestCollection();
      const ctx = ProcedureEditorContext.createFromCollection(collection).orThrow();
      const procedure = createValidProcedure('test-procedure', 'My New Procedure');

      expect(ctx.create(undefined, procedure)).toSucceedAndSatisfy((id) => {
        expect(ctx.exists(id)).toBe(true);
      });
    });

    test('get existing procedure', () => {
      const procedure = createValidProcedure('proc-1', 'Procedure One');
      const collection = createTestCollection(new Map([['proc-1' as BaseProcedureId, procedure]]));
      const ctx = ProcedureEditorContext.createFromCollection(collection).orThrow();

      expect(ctx.get('test-procedures.proc-1' as ProcedureId)).toSucceedWith(procedure);
    });

    test('update existing procedure', () => {
      const procedure = createValidProcedure('proc-1', 'Procedure One');
      const collection = createTestCollection(new Map([['proc-1' as BaseProcedureId, procedure]]));
      const ctx = ProcedureEditorContext.createFromCollection(collection).orThrow();

      const updated = { ...procedure, name: 'Updated Procedure' };
      expect(ctx.update('test-procedures.proc-1' as ProcedureId, updated)).toSucceed();
      expect(ctx.get('test-procedures.proc-1' as ProcedureId)).toSucceedWith(updated);
    });

    test('delete existing procedure', () => {
      const procedure = createValidProcedure('proc-1', 'Procedure One');
      const collection = createTestCollection(new Map([['proc-1' as BaseProcedureId, procedure]]));
      const ctx = ProcedureEditorContext.createFromCollection(collection).orThrow();

      expect(ctx.delete('test-procedures.proc-1' as ProcedureId)).toSucceed();
      expect(ctx.exists('test-procedures.proc-1' as ProcedureId)).toBe(false);
    });
  });
});
