/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Logging, Result, fail, failWithDetail, succeed, succeedWithDetail } from '@fgv/ts-utils';
import {
  IBoundTaskWriter,
  ITaskEnvironment,
  ITaskFailure,
  ITaskMutationResult,
  OperationId,
  TaskId
} from '../../../index';
import { IBrokerHarness, bob, brokerHarness, track, watch } from '../../helpers/brokerFixtures';
import { IToolSet, call, mutatingTools, toolSet } from '../../helpers/toolFixtures';

/** A writer that records every request it is sent and answers with whatever the test scripts. */
function scriptedWriter(
  real: IBoundTaskWriter,
  answer: (method: string, request: Record<string, unknown>) => unknown
): { writer: IBoundTaskWriter; sent: Array<[string, Record<string, unknown>]> } {
  const sent: Array<[string, Record<string, unknown>]> = [];
  const writer = new Proxy(real, {
    get(target: IBoundTaskWriter, property: string | symbol): unknown {
      if (property === 'createTracked' || property === 'updateTracked' || property === 'reassign') {
        return async (request: Record<string, unknown>): Promise<unknown> => {
          sent.push([property, request]);
          return answer(property, request);
        };
      }
      const value: unknown = Reflect.get(target, property, target);
      return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value;
    }
  });
  return { writer, sent };
}

/** The receipt a correct writer would answer a request with. */
function honest(request: Record<string, unknown>, extra?: Record<string, unknown>): unknown {
  return succeedWithDetail<ITaskMutationResult, ITaskFailure>({
    taskId: request.taskId as TaskId,
    revision: 2 as never,
    operationId: request.operationId as OperationId,
    disposition: 'changed',
    updateIds: [],
    ...extra
  } as ITaskMutationResult);
}

const update = { taskId: 't1', expectedRevision: 1, title: 'x' };
const reassign = { taskId: 't1', expectedRevision: 1, responsibility: bob };

describe('execute re-validates its arguments with no harness in front', () => {
  let h: IBrokerHarness;
  let tools: IToolSet;
  let sent: Array<[string, Record<string, unknown>]>;

  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 't1');
    const scripted = scriptedWriter(h.writer, (__m, request) => honest(request));
    sent = scripted.sent;
    tools = mutatingTools(h, scripted.writer);
  });

  test('a model-supplied operation id is refused, never honoured', async () => {
    const forged = 'model-op' as OperationId;
    expect(await call(tools, 'task_create', { title: 'x', operationId: forged })).toFailWith(
      /^task_create: invalid arguments.*operationId/
    );
    expect(await call(tools, 'task_update', { ...update, operationId: forged })).toFailWith(
      /^task_update: invalid arguments.*operationId/
    );
    expect(await call(tools, 'task_reassign', { ...reassign, operationId: forged })).toFailWith(
      /^task_reassign: invalid arguments.*operationId/
    );
    expect(sent).toEqual([]);
    // The operation id the writer is sent is the one the host minted, fresh on every call.
    await call(tools, 'task_update', update);
    await call(tools, 'task_update', update);
    const ids = sent.map(([, request]) => request.operationId);
    expect(ids).toHaveLength(2);
    expect(ids[0]).toMatch(/^b-/);
    expect(ids[0]).not.toEqual(ids[1]);
  });

  test('a model cannot name the new task id, a scope, a stop policy or anything that grants authority', async () => {
    const surplus: ReadonlyArray<Record<string, unknown>> = [
      { taskId: 'mine' },
      { principal: 'bob' },
      { scopes: [{ namespace: 'project', key: 'beta' }] },
      { scope: 'beta' },
      { consumer: 'watcher' },
      { actor: 'bob' },
      { stopPolicy: 'cascade-cancel' },
      { kind: 'fgv.tracked' },
      { binding: { sourceId: 'acme' } },
      { recovery: 'reattach' },
      { initialObservation: {} },
      { lifecycle: { status: 'running' } },
      { attention: [] },
      { responsibility: { namespace: 'agent', key: 'ada', principal: 'bob' } }
    ];
    for (const extra of surplus) {
      expect(await call(tools, 'task_create', { title: 'x', ...extra })).toFailWith(
        /^task_create: invalid arguments/
      );
    }
    expect(sent).toEqual([]);
  });

  test('surplus and malformed fields on an update or reassignment fail before the writer is asked', async () => {
    const updates: ReadonlyArray<unknown> = [
      undefined,
      null,
      't1',
      {},
      { taskId: 't1', title: 'x' },
      { ...update, expectedRevision: '1' },
      { ...update, expectedRevision: 0 },
      { ...update, expectedRevision: 1.5 },
      { ...update, taskId: '../t1' },
      { ...update, principal: 'bob' },
      { ...update, lifecycle: { status: 'succeeded' } },
      { ...update, responsibility: bob },
      { ...update, parentId: 'x' },
      { ...update, attention: [{ namespace: 'artifact', key: 'secret' }] },
      { ...update, clear: ['title'] },
      { ...update, clear: ['description'], description: 'both' },
      { ...update, progress: { completed: 3, total: 1 } },
      { ...update, progress: { percent: 5 } }
    ];
    for (const args of updates) {
      expect(await call(tools, 'task_update', args)).toFailWith(/^task_update: invalid arguments/);
    }
    const reassigns: ReadonlyArray<unknown> = [
      { taskId: 't1', expectedRevision: 1 },
      { ...reassign, responsibility: 'unassigned' },
      { ...reassign, responsibility: { namespace: 'agent' } },
      { ...reassign, responsibility: { ...bob, scope: 'beta' } },
      { ...reassign, scopes: [] },
      { ...reassign, parent: 'root' }
    ];
    for (const args of reassigns) {
      expect(await call(tools, 'task_reassign', args)).toFailWith(/^task_reassign: invalid arguments/);
    }
    expect(sent).toEqual([]);
  });

  test('well-formed calls send exactly the request the arguments describe', async () => {
    await call(tools, 'task_create', { title: 'x', parentId: 't1' });
    await call(tools, 'task_update', { ...update, clear: ['progress'] });
    await call(tools, 'task_reassign', { ...reassign, responsibility: null });
    expect(sent.map(([method, request]) => [method, { ...request, taskId: '*', operationId: '*' }])).toEqual([
      ['createTracked', { taskId: '*', operationId: '*', title: 'x', parentId: 't1' }],
      [
        'updateTracked',
        { taskId: '*', operationId: '*', expectedRevision: 1, patch: { title: 'x', clear: ['progress'] } }
      ],
      ['reassign', { taskId: '*', operationId: '*', expectedRevision: 1, responsibility: 'unassigned' }]
    ]);
    // The new task's id is minted, like the operation id; the others are the model's.
    expect(sent[0][1].taskId).toMatch(/^b-/);
    expect(sent[1][1].taskId).toBe('t1');
  });
});

describe("a writer's answer is checked the way a view's answer is", () => {
  let h: IBrokerHarness;
  let logger: Logging.InMemoryLogger;

  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 't1');
    logger = new Logging.InMemoryLogger('detail');
  });

  function over(answer: (method: string, request: Record<string, unknown>) => unknown): IToolSet {
    return mutatingTools(h, scriptedWriter(h.writer, answer).writer, { logger });
  }

  test('a receipt for another task, another operation, or with fields a receipt lacks fails the call', async () => {
    const cases: ReadonlyArray<Record<string, unknown>> = [
      { taskId: 'someone-else' },
      { operationId: 'another-op' },
      { disposition: 'maybe' },
      { revision: 0 },
      { updateIds: ['u:1:0', 'u:1:1', 'u:1:2', 'u:1:3', 'u:1:4', 'u:1:5', 'u:1:6', 'u:1:7', 'u:1:8'] },
      { binding: { sourceId: 'acme' } }
    ];
    for (const extra of cases) {
      const tools = over((__m, request) => honest(request, extra));
      for (const [name, args] of [
        ['task_create', { title: 'x' }],
        ['task_update', update],
        ['task_reassign', reassign]
      ] as const) {
        expect(await call(tools, name, args)).toFailWith(
          `${name}: invalid: the request was refused, or a task could not be presented`
        );
      }
    }
    // What was wrong is the host's to read, never the model's.
    expect(logger.logged.some((line) => /receipt/.test(line))).toBe(true);
  });

  test('a reassignment receipt naming a party other than the one asked for fails the call', async () => {
    const tools = over((__m, request) =>
      honest(request, { current: { namespace: 'agent', key: 'mallory' } })
    );
    expect(await call(tools, 'task_reassign', reassign)).toFailWith(/^task_reassign: invalid: /);
    const unassigned = over((__m, request) => honest(request, { current: bob }));
    expect(await call(unassigned, 'task_reassign', { ...reassign, responsibility: null })).toFailWith(
      /^task_reassign: invalid: /
    );
    const silent = over((__m, request) => honest(request));
    expect(await call(silent, 'task_reassign', reassign)).toFailWith(/^task_reassign: invalid: /);
  });

  test('a writer that throws, rejects or fails with host text tells the model only a code', async () => {
    const secret = 'postgres://admin:hunter2@db';
    const answers: ReadonlyArray<() => unknown> = [
      () => {
        throw new Error(secret);
      },
      () => Promise.reject(new Error(secret)),
      () =>
        failWithDetail<ITaskMutationResult, ITaskFailure>(secret, {
          code: 'storage-unavailable',
          retry: 'safe'
        }),
      () => fail(secret)
    ];
    for (const answer of answers) {
      const tools = over(() => answer());
      const result = await call(tools, 'task_update', update);
      expect(result).toFailWith(/^task_update: /);
      expect(result).not.toFailWith(/hunter2/);
    }
    expect(logger.logged.filter((line) => line.includes('hunter2'))).toHaveLength(4);
  });

  test('the model is told the task, its revision and the disposition — never update ids or the operation id', async () => {
    await watch(h.broker);
    const tools = mutatingTools(h);
    const created = (await call<Record<string, unknown>>(tools, 'task_create', { title: 'x' })).orThrow();
    const updated = (await call<Record<string, unknown>>(tools, 'task_update', update)).orThrow();
    const moved = (
      await call<Record<string, unknown>>(tools, 'task_reassign', { ...reassign, expectedRevision: 2 })
    ).orThrow();
    expect(Object.keys(created).sort()).toEqual(['disposition', 'revision', 'taskId']);
    expect(Object.keys(updated).sort()).toEqual(['disposition', 'revision', 'taskId']);
    expect(Object.keys(moved).sort()).toEqual(['current', 'disposition', 'revision', 'taskId']);
    // The writer did retain updates for the watcher: the model is not told so.
    expect(
      (
        await h.writer.updateTracked({
          taskId: 't1' as TaskId,
          operationId: 'host' as OperationId,
          expectedRevision: 3 as never,
          patch: { title: 'y' }
        })
      ).orThrow().updateIds.length
    ).toBeGreaterThan(0);
  });
});

describe('ids the host mints', () => {
  let h: IBrokerHarness;
  let logger: Logging.InMemoryLogger;

  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 't1');
    logger = new Logging.InMemoryLogger('detail');
  });

  function over(environment: Pick<ITaskEnvironment, 'newTaskId' | 'newOperationId'>): IToolSet {
    return toolSet({
      view: h.writer,
      logger,
      mutations: { writer: h.writer, environment, enable: ['tracked', 'reassign'] }
    });
  }

  test('an environment that fails, throws or mints a malformed id fails the call, and names nothing', async () => {
    let n = 0;
    const good = (): Result<TaskId & OperationId> => succeed(`fresh-${++n}` as TaskId & OperationId);
    const down = (): Result<never> => fail('id service /var/run/ids.sock down');
    const throws = (): never => {
      throw new Error('id service /var/run/ids.sock down');
    };
    const malformed = (): Result<TaskId & OperationId> => succeed('../etc/passwd' as TaskId & OperationId);
    // An operation id is minted for every call.
    for (const newOperationId of [down, throws, malformed]) {
      const tools = over({ newTaskId: good, newOperationId });
      for (const [name, args] of [
        ['task_create', { title: 'x' }],
        ['task_update', update],
        ['task_reassign', reassign]
      ] as const) {
        expect(await call(tools, name, args)).toFailWith(`${name}: the request failed`);
      }
    }
    // A task id only for a creation.
    for (const newTaskId of [down, throws, malformed]) {
      expect(await call(over({ newTaskId, newOperationId: good }), 'task_create', { title: 'x' })).toFailWith(
        /^task_create: the request failed$/
      );
    }
    expect(logger.logged.filter((line) => line.includes('ids.sock'))).toHaveLength(8);
    expect(logger.logged.filter((line) => line.includes('passwd'))).toHaveLength(4);
    expect((await h.writer.inspect('t1' as TaskId)).orThrow()).toEqual(
      expect.objectContaining({ envelope: expect.objectContaining({ revision: 1 }) })
    );
  });
});
