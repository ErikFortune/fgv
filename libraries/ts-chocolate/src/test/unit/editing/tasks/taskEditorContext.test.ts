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
import { TaskEditorContext } from '../../../../packlets/editing/tasks';
import { Tasks, Converters as EntityConverters } from '../../../../packlets/entities';
import { BaseTaskId, TaskId, CollectionId } from '../../../../index';

type IRawTaskEntity = Tasks.IRawTaskEntity;

const TEST_SOURCE_ID = 'test-tasks' as CollectionId;
const testKeyConverter = Converters.string as unknown as Converter<BaseTaskId>;

describe('TaskEditorContext', () => {
  const createTestCollection = (
    items: Map<BaseTaskId, IRawTaskEntity> = new Map(),
    isMutable: boolean = true
  ): EditableCollection<IRawTaskEntity, BaseTaskId> => {
    return EditableCollection.createEditable<IRawTaskEntity, BaseTaskId>({
      collectionId: TEST_SOURCE_ID,
      metadata: { name: 'Test Tasks' },
      isMutable,
      initialItems: items,
      keyConverter: testKeyConverter,
      valueConverter: EntityConverters.Tasks.rawTaskEntity
    }).orThrow();
  };

  const createValidTask = (baseId?: string, name?: string): IRawTaskEntity => ({
    baseId: (baseId ?? 'test-task') as BaseTaskId,
    name: name ?? 'Test Task',
    template: 'Do {{thing}} for {{time}} minutes'
  });

  describe('createFromCollection', () => {
    test('succeeds with an empty mutable collection', () => {
      const collection = createTestCollection();
      expect(TaskEditorContext.createFromCollection(collection)).toSucceedAndSatisfy((context) => {
        expect(context).toBeInstanceOf(TaskEditorContext);
      });
    });

    test('fails for immutable collection', () => {
      const collection = createTestCollection(new Map(), false);
      expect(TaskEditorContext.createFromCollection(collection)).toFailWith(/immutable.*cannot be edited/i);
    });

    test('succeeds with a populated collection', () => {
      const items = new Map<BaseTaskId, IRawTaskEntity>();
      items.set('task-1' as BaseTaskId, createValidTask('task-1', 'Task One'));
      const collection = createTestCollection(items);
      expect(TaskEditorContext.createFromCollection(collection)).toSucceedAndSatisfy((context) => {
        expect(context.exists('test-tasks.task-1' as TaskId)).toBe(true);
      });
    });
  });

  describe('getTaskDisplayName', () => {
    test('returns the task name', () => {
      const collection = createTestCollection();
      const ctx = TaskEditorContext.createFromCollection(collection).orThrow();
      const task = createValidTask('my-task', 'My Task');
      expect(ctx.getTaskDisplayName(task)).toBe('My Task');
    });
  });

  describe('validate', () => {
    test('validates a valid task', () => {
      const collection = createTestCollection();
      const ctx = TaskEditorContext.createFromCollection(collection).orThrow();
      const task = createValidTask();

      expect(ctx.validate(task)).toSucceedAndSatisfy((report) => {
        expect(report.isValid).toBe(true);
      });
    });

    test('reports invalid task via validating.validate', () => {
      const collection = createTestCollection();
      const ctx = TaskEditorContext.createFromCollection(collection).orThrow();
      const task = { ...createValidTask(), name: '' };

      expect(ctx.validating.validate(task)).toSucceedAndSatisfy((report) => {
        expect(report.isValid).toBe(false);
        expect(report.generalErrors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('inherited CRUD operations', () => {
    test('create new task with base method', () => {
      const collection = createTestCollection();
      const ctx = TaskEditorContext.createFromCollection(collection).orThrow();
      const task = createValidTask();

      expect(ctx.create('my-task' as BaseTaskId, task)).toSucceedAndSatisfy((id) => {
        expect(id).toBe('test-tasks.my-task');
        expect(ctx.exists(id)).toBe(true);
      });
    });

    test('create new task with validating method', () => {
      const collection = createTestCollection();
      const ctx = TaskEditorContext.createFromCollection(collection).orThrow();
      const task = createValidTask();

      expect(ctx.validating.create('my-task', task)).toSucceedAndSatisfy((id) => {
        expect(id).toBe('test-tasks.my-task');
        expect(ctx.exists(id)).toBe(true);
      });
    });

    test('auto-generate ID from task name when baseId is undefined', () => {
      const collection = createTestCollection();
      const ctx = TaskEditorContext.createFromCollection(collection).orThrow();
      const task = createValidTask();

      expect(ctx.create(undefined, task)).toSucceedAndSatisfy((id) => {
        expect(id).toBe('test-tasks.test-task');
        expect(ctx.exists(id)).toBe(true);
      });
    });

    test('get existing task', () => {
      const task = createValidTask('task-1', 'Task One');
      const collection = createTestCollection(new Map([['task-1' as BaseTaskId, task]]));
      const ctx = TaskEditorContext.createFromCollection(collection).orThrow();

      expect(ctx.get('test-tasks.task-1' as TaskId)).toSucceedWith(task);
    });

    test('update existing task', () => {
      const task = createValidTask('task-1', 'Task One');
      const collection = createTestCollection(new Map([['task-1' as BaseTaskId, task]]));
      const ctx = TaskEditorContext.createFromCollection(collection).orThrow();

      const updated = { ...task, name: 'Updated Task' };
      expect(ctx.update('test-tasks.task-1' as TaskId, updated)).toSucceed();
      expect(ctx.get('test-tasks.task-1' as TaskId)).toSucceedWith(updated);
    });

    test('delete existing task', () => {
      const task = createValidTask('task-1', 'Task One');
      const collection = createTestCollection(new Map([['task-1' as BaseTaskId, task]]));
      const ctx = TaskEditorContext.createFromCollection(collection).orThrow();

      expect(ctx.delete('test-tasks.task-1' as TaskId)).toSucceed();
      expect(ctx.exists('test-tasks.task-1' as TaskId)).toBe(false);
    });
  });
});
