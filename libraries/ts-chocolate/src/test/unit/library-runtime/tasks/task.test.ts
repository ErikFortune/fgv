import '@fgv/ts-utils-jest';
import { Task, type ITaskContext } from '../../../../packlets/library-runtime';
import type { IRawTaskEntity } from '../../../../packlets/entities';
import { BaseTaskId, Celsius, Minutes, Model as CommonModel, TaskId } from '../../../../packlets/common';

describe('Task', () => {
  const stubContext = {} as unknown as ITaskContext;

  const createEntity = (overrides?: Partial<IRawTaskEntity>): IRawTaskEntity => ({
    baseId: 'test-task' as BaseTaskId,
    name: 'Test Task',
    template: 'Mix {{ingredient}} for {{time}} minutes',
    ...overrides
  });

  describe('create', () => {
    test('creates task from valid entity with simple template', () => {
      const entity = createEntity({
        template: 'Mix {{ingredient}}'
      });

      expect(Task.create(stubContext, 'task-1' as TaskId, entity)).toSucceedAndSatisfy((task) => {
        expect(task.id).toBe('task-1' as TaskId);
        expect(task.baseId).toBe('test-task' as BaseTaskId);
        expect(task.name).toBe('Test Task');
        expect(task.template).toBe('Mix {{ingredient}}');
      });
    });

    test('creates task from entity with complex template (multiple variables)', () => {
      const entity = createEntity({
        template: 'Mix {{ingredient}} at {{temperature}} for {{time}} minutes'
      });

      expect(Task.create(stubContext, 'task-2' as TaskId, entity)).toSucceedAndSatisfy((task) => {
        expect(task.template).toBe('Mix {{ingredient}} at {{temperature}} for {{time}} minutes');
      });
    });

    test('extracts required variables from template', () => {
      const entity = createEntity({
        template: 'Mix {{ingredient}} for {{time}} minutes'
      });

      expect(Task.create(stubContext, 'task-3' as TaskId, entity)).toSucceedAndSatisfy((task) => {
        expect(task.requiredVariables).toEqual(['ingredient', 'time']);
      });
    });

    test('handles template with no variables', () => {
      const entity = createEntity({
        template: 'Mix thoroughly'
      });

      expect(Task.create(stubContext, 'task-4' as TaskId, entity)).toSucceedAndSatisfy((task) => {
        expect(task.requiredVariables).toEqual([]);
      });
    });
  });

  describe('property accessors', () => {
    test('returns id, baseId, name, template correctly', () => {
      const entity = createEntity();

      expect(Task.create(stubContext, 'task-5' as TaskId, entity)).toSucceedAndSatisfy((task) => {
        expect(task.id).toBe('task-5' as TaskId);
        expect(task.baseId).toBe('test-task' as BaseTaskId);
        expect(task.name).toBe('Test Task');
        expect(task.template).toBe('Mix {{ingredient}} for {{time}} minutes');
      });
    });

    test('returns requiredVariables extracted from template', () => {
      const entity = createEntity({
        template: 'Add {{item1}}, {{item2}}, and {{item3}}'
      });

      expect(Task.create(stubContext, 'task-6' as TaskId, entity)).toSucceedAndSatisfy((task) => {
        expect(task.requiredVariables).toEqual(['item1', 'item2', 'item3']);
      });
    });

    test('returns defaultActiveTime when set', () => {
      const entity = createEntity({
        defaultActiveTime: 15 as Minutes
      });

      expect(Task.create(stubContext, 'task-7' as TaskId, entity)).toSucceedAndSatisfy((task) => {
        expect(task.defaultActiveTime).toBe(15 as Minutes);
      });
    });

    test('returns undefined for optional properties not set', () => {
      const entity = createEntity();

      expect(Task.create(stubContext, 'task-8' as TaskId, entity)).toSucceedAndSatisfy((task) => {
        expect(task.defaultActiveTime).toBeUndefined();
        expect(task.defaultTemperature).toBeUndefined();
        expect(task.notes).toBeUndefined();
        expect(task.tags).toBeUndefined();
        expect(task.defaults).toBeUndefined();
      });
    });

    test('returns defaultTemperature when set', () => {
      const entity = createEntity({
        defaultTemperature: 180 as Celsius
      });

      expect(Task.create(stubContext, 'task-9' as TaskId, entity)).toSucceedAndSatisfy((task) => {
        expect(task.defaultTemperature).toBe(180 as Celsius);
      });
    });

    test('returns notes when present', () => {
      const notes: ReadonlyArray<CommonModel.ICategorizedNote> = [
        { category: 'general', note: 'Test note' }
      ] as CommonModel.ICategorizedNote[];
      const entity = createEntity({ notes });

      expect(Task.create(stubContext, 'task-10' as TaskId, entity)).toSucceedAndSatisfy((task) => {
        expect(task.notes).toEqual(notes);
      });
    });

    test('returns tags when present', () => {
      const tags = ['mixing', 'prep'];
      const entity = createEntity({ tags });

      expect(Task.create(stubContext, 'task-11' as TaskId, entity)).toSucceedAndSatisfy((task) => {
        expect(task.tags).toEqual(tags);
      });
    });

    test('returns defaults when present', () => {
      const defaults = { ingredient: 'sugar', time: '10' };
      const entity = createEntity({ defaults });

      expect(Task.create(stubContext, 'task-12' as TaskId, entity)).toSucceedAndSatisfy((task) => {
        expect(task.defaults).toEqual(defaults);
      });
    });

    test('returns entity reference', () => {
      const entity = createEntity();

      expect(Task.create(stubContext, 'task-13' as TaskId, entity)).toSucceedAndSatisfy((task) => {
        expect(task.entity).toBe(entity);
      });
    });
  });

  describe('render', () => {
    test('renders template with all required params', () => {
      const entity = createEntity({
        template: 'Mix {{ingredient}} for {{time}} minutes'
      });
      const task = Task.create(stubContext, 'task-14' as TaskId, entity).orThrow();

      const params = { ingredient: 'flour', time: '5' };

      expect(task.render(params)).toSucceedWith('Mix flour for 5 minutes');
    });

    test('renders with defaults (no explicit params needed for defaulted vars)', () => {
      const entity = createEntity({
        template: 'Mix {{ingredient}} for {{time}} minutes',
        defaults: { ingredient: 'sugar', time: '10' }
      });
      const task = Task.create(stubContext, 'task-15' as TaskId, entity).orThrow();

      expect(task.render({})).toSucceedWith('Mix sugar for 10 minutes');
    });

    test('params override defaults', () => {
      const entity = createEntity({
        template: 'Mix {{ingredient}} for {{time}} minutes',
        defaults: { ingredient: 'sugar', time: '10' }
      });
      const task = Task.create(stubContext, 'task-16' as TaskId, entity).orThrow();

      const params = { ingredient: 'flour' };

      expect(task.render(params)).toSucceedWith('Mix flour for 10 minutes');
    });

    test('renders template with no variables (static text)', () => {
      const entity = createEntity({
        template: 'Mix thoroughly'
      });
      const task = Task.create(stubContext, 'task-17' as TaskId, entity).orThrow();

      expect(task.render({})).toSucceedWith('Mix thoroughly');
    });

    test('renders with missing params (Mustache substitutes empty string)', () => {
      const entity = createEntity({
        template: 'Mix {{ingredient}} for {{time}} minutes'
      });
      const task = Task.create(stubContext, 'task-18' as TaskId, entity).orThrow();

      const params = { ingredient: 'flour' };

      // Note: render() doesn't validate - Mustache just renders missing vars as empty string
      expect(task.render(params)).toSucceedWith('Mix flour for  minutes');
    });
  });

  describe('validateParams', () => {
    test('returns valid for complete params', () => {
      const entity = createEntity({
        template: 'Mix {{ingredient}} for {{time}} minutes'
      });
      const task = Task.create(stubContext, 'task-19' as TaskId, entity).orThrow();

      const params = { ingredient: 'flour', time: '5' };

      expect(task.validateParams(params)).toSucceedAndSatisfy((validation) => {
        expect(validation.isValid).toBe(true);
        expect(validation.taskFound).toBe(true);
        expect(validation.missingVariables).toEqual([]);
        expect(validation.extraVariables).toEqual([]);
        expect(validation.messages).toEqual([]);
      });
    });

    test('reports missing variables', () => {
      const entity = createEntity({
        template: 'Mix {{ingredient}} for {{time}} minutes'
      });
      const task = Task.create(stubContext, 'task-20' as TaskId, entity).orThrow();

      const params = { ingredient: 'flour' };

      expect(task.validateParams(params)).toSucceedAndSatisfy((validation) => {
        expect(validation.isValid).toBe(false);
        expect(validation.taskFound).toBe(true);
        expect(validation.missingVariables).toEqual(['time']);
        expect(validation.extraVariables).toEqual([]);
        expect(validation.messages.length).toBeGreaterThan(0);
      });
    });

    test('reports extra variables', () => {
      const entity = createEntity({
        template: 'Mix {{ingredient}}'
      });
      const task = Task.create(stubContext, 'task-21' as TaskId, entity).orThrow();

      const params = { ingredient: 'flour', time: '5', temperature: '180' };

      expect(task.validateParams(params)).toSucceedAndSatisfy((validation) => {
        // Extra variables don't make validation invalid (only missing vars do)
        expect(validation.isValid).toBe(true);
        expect(validation.taskFound).toBe(true);
        expect(validation.missingVariables).toEqual([]);
        expect(validation.extraVariables).toContain('time');
        expect(validation.extraVariables).toContain('temperature');
        expect(validation.messages.length).toBeGreaterThan(0);
      });
    });

    test('reports both missing and extra', () => {
      const entity = createEntity({
        template: 'Mix {{ingredient}} for {{time}} minutes'
      });
      const task = Task.create(stubContext, 'task-22' as TaskId, entity).orThrow();

      const params = { ingredient: 'flour', temperature: '180' };

      expect(task.validateParams(params)).toSucceedAndSatisfy((validation) => {
        expect(validation.isValid).toBe(false);
        expect(validation.taskFound).toBe(true);
        expect(validation.missingVariables).toEqual(['time']);
        expect(validation.extraVariables).toEqual(['temperature']);
        expect(validation.messages.length).toBeGreaterThan(0);
      });
    });

    test('returns valid when defaults cover required variables', () => {
      const entity = createEntity({
        template: 'Mix {{ingredient}} for {{time}} minutes',
        defaults: { ingredient: 'sugar', time: '10' }
      });
      const task = Task.create(stubContext, 'task-23' as TaskId, entity).orThrow();

      expect(task.validateParams({})).toSucceedAndSatisfy((validation) => {
        expect(validation.isValid).toBe(true);
        expect(validation.taskFound).toBe(true);
        expect(validation.missingVariables).toEqual([]);
        expect(validation.extraVariables).toEqual([]);
        expect(validation.messages).toEqual([]);
      });
    });
  });

  describe('validateAndRender', () => {
    test('succeeds with valid params', () => {
      const entity = createEntity({
        template: 'Mix {{ingredient}} for {{time}} minutes'
      });
      const task = Task.create(stubContext, 'task-24' as TaskId, entity).orThrow();

      const params = { ingredient: 'flour', time: '5' };

      expect(task.validateAndRender(params)).toSucceedWith('Mix flour for 5 minutes');
    });

    test('fails with missing required params (no defaults)', () => {
      const entity = createEntity({
        template: 'Mix {{ingredient}} for {{time}} minutes'
      });
      const task = Task.create(stubContext, 'task-25' as TaskId, entity).orThrow();

      const params = { ingredient: 'flour' };

      expect(task.validateAndRender(params)).toFailWith(/missing.*time/i);
    });

    test('succeeds when defaults cover missing params', () => {
      const entity = createEntity({
        template: 'Mix {{ingredient}} for {{time}} minutes',
        defaults: { time: '10' }
      });
      const task = Task.create(stubContext, 'task-26' as TaskId, entity).orThrow();

      const params = { ingredient: 'flour' };

      expect(task.validateAndRender(params)).toSucceedWith('Mix flour for 10 minutes');
    });
  });
});
