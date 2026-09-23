/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { JsonValue } from '@fgv/ts-json-base';
import { failWithDetail, succeed, succeedWithDetail } from '@fgv/ts-utils';
import {
  ITaskFailure,
  ITaskRepository,
  ITaskRepositoryWriter,
  OperationId,
  TaskBroker,
  TaskConverters,
  TaskEnvironment,
  TaskId,
  TaskResult,
  noAudience
} from '../../../index';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { BrokerCore } from '../../../packlets/broker/core';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { codeOf } from '../../../packlets/broker/failures';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { WriterQueue, maxWaitingWriters } from '../../../packlets/broker/writerQueue';
import {
  IBrokerHarness,
  TestPolicy,
  alpha,
  ada,
  bindWriter,
  brokerHarness,
  list,
  op,
  registerVendor,
  rev,
  revisionOf,
  succeedTask,
  tid,
  track
} from '../../helpers/brokerFixtures';
import { at } from '../../helpers/storageFixtures';

const storageDown = <T>(): TaskResult<T> =>
  failWithDetail<T, ITaskFailure>('storage down', { code: 'storage-unavailable', retry: 'safe' });

/**
 * A broker over a repository that misbehaves: `patch` replaces repository methods, and
 * `writerPatch` replaces methods of the writer a gated section receives. Everything else delegates.
 */
function faulty(
  h: IBrokerHarness,
  patch: (r: ITaskRepository) => Partial<ITaskRepository>,
  writerPatch?: (w: ITaskRepositoryWriter) => Partial<ITaskRepositoryWriter>
): TaskBroker {
  const real: ITaskRepository = h.repository;
  const repository: ITaskRepository = Object.assign(Object.create(real), {
    withWriter: <T>(action: (w: ITaskRepositoryWriter) => Promise<TaskResult<T>>) =>
      real.withWriter((w) => action(writerPatch !== undefined ? { ...bindAll(w), ...writerPatch(w) } : w)),
    ...patch(real)
  });
  return TaskBroker.create({ repository, environment: h.env }).orThrow();
}

function bindAll(w: ITaskRepositoryWriter): ITaskRepositoryWriter {
  return {
    readCommit: (id) => w.readCommit(id),
    register: (r) => w.register(r),
    commit: (r) => w.commit(r),
    raiseCapacityLimits: (p) => w.raiseCapacityLimits(p)
  };
}

function writerOf(
  broker: TaskBroker,
  h: IBrokerHarness
): ReturnType<TaskBroker['bind']> extends TaskResult<infer W> ? W : never {
  return broker.bind({ principal: 'alice', scopes: [alpha], authorization: h.policy }).orThrow();
}

describe('the broker checks what an injected repository returns', () => {
  let h: IBrokerHarness;
  beforeEach(async () => {
    h = await brokerHarness();
    await list(h.writer, 'l');
    await track(h.writer, 't', { parentId: 'l' });
    await track(h.writer, 'p');
  });

  test('read failures outside the writer are reported, not treated as absence', async () => {
    const w = writerOf(
      faulty(h, () => ({ readCommit: async () => storageDown() })),
      h
    );
    expect(
      await w.reassign({ taskId: tid('t'), operationId: op(), expectedRevision: rev(1), responsibility: ada })
    ).toFailWith(/storage down/);
    expect(
      await w.execute({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: rev(1),
        command: 'start',
        parameters: {}
      })
    ).toFailWith(/storage down/);
    expect(await w.createTracked({ taskId: tid('n'), operationId: op(), title: 'n' })).toFailWith(
      /storage down/
    );
    expect(await w.reconcileListCompletions({ limit: 5 })).toSucceedWith({ completed: [] });
  });

  test('read failures inside the writer are reported', async () => {
    const broker = faulty(
      h,
      () => ({}),
      () => ({ readCommit: async () => storageDown() })
    );
    const w = writerOf(broker, h);
    expect(
      await w.reassign({ taskId: tid('t'), operationId: op(), expectedRevision: rev(1), responsibility: ada })
    ).toFailWith(/storage down/);
    expect(
      await w.execute({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: rev(1),
        command: 'start',
        parameters: {}
      })
    ).toFailWith(/storage down/);
    expect(
      await w.createTracked({ taskId: tid('n'), operationId: op(), title: 'n', parentId: tid('p') })
    ).toFailWith(/storage down/);
    expect(await broker.registerExternal('host', vendorRequest('v', 'p'))).toFailWith(/storage down/);
  });

  test('a subject or parent that vanishes or changes type inside the writer refuses the commit', async () => {
    const vanish = (): Partial<ITaskRepositoryWriter> => ({
      readCommit: async () => succeedWithDetail(undefined)
    });
    const w = writerOf(
      faulty(h, () => ({}), vanish),
      h
    );
    expect(
      await w.reassign({ taskId: tid('t'), operationId: op(), expectedRevision: rev(1), responsibility: ada })
    ).toFailWith(/found no record/);
    expect(
      await w.execute({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: rev(1),
        command: 'start',
        parameters: {}
      })
    ).toFailWith(/changed after the operation was authorized/);
    expect(
      await w.createTracked({ taskId: tid('n'), operationId: op(), title: 'n', parentId: tid('p') })
    ).toFailWith(/the parent of n changed/);
    // A parent re-read as something else fails the related-task check.
    const other = writerOf(
      faulty(
        h,
        () => ({}),
        (real) => ({
          readCommit: async (id: TaskId) => (id === 'p' ? succeedWithDetail(undefined) : real.readCommit(id))
        })
      ),
      h
    );
    expect(
      await other.reparent({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: rev(1),
        parent: { taskId: tid('p') }
      })
    ).toFailWith(/a task related to t changed/);
  });

  test('graph and candidate reads that fail stop the operation', async () => {
    await succeedTask(h, h.writer, 't');
    const noChildren = writerOf(
      faulty(h, () => ({ childStates: async () => storageDown() })),
      h
    );
    expect(
      await noChildren.completeList({
        taskId: tid('l'),
        operationId: op(),
        expectedRevision: rev(1),
        outcome: { summary: 's', artifacts: [] }
      })
    ).toFailWith(/storage down/);
    expect(await noChildren.reconcileListCompletions({ limit: 5 })).toFailWith(/storage down/);
    const noCandidates = writerOf(
      faulty(h, () => ({ listCompletionCandidates: async () => storageDown() })),
      h
    );
    expect(await noCandidates.reconcileListCompletions({ limit: 5 })).toFailWith(/storage down/);
  });

  test('a candidate the index should never have offered is rechecked and left alone', async () => {
    await list(h.writer, 'manual', 'manual');
    const w = writerOf(
      faulty(h, () => ({
        listCompletionCandidates: async () => succeedWithDetail([tid('manual'), tid('t')])
      })),
      h
    );
    expect(await w.reconcileListCompletions({ limit: 5 })).toSucceedWith({ completed: [] });
  });

  test('a read after a successful registration that finds nothing is reported as not found', async () => {
    const broker = faulty(h, (r) => ({
      read: async () => succeedWithDetail(undefined),
      readCommit: (id) => r.readCommit(id)
    }));
    expect(await broker.registerExternal('host', vendorRequest('v'))).toFailWith(/^task v: not found/);
    expect(await writerOf(broker, h).inspect(tid('t'))).toFailWith(/^task t: not found/);
    const failing = faulty(h, () => ({ read: async () => storageDown() }));
    expect(await failing.registerExternal('host', vendorRequest('v2'))).toFailWith(/storage down/);
  });

  test('a query the repository refuses is reported', async () => {
    expect(await h.writer.query({ filter: { lifecycleClass: 'open', statuses: ['succeeded'] } })).toFailWith(
      /not in lifecycle class/
    );
  });

  test('stored evidence that does not convert is storage-corrupt, never a fabricated receipt', async () => {
    // Evidence written through the trusted repository API, with receipts the broker never wrote.
    const request: JsonValue = { taskId: 'x', operationId: 'op-x', title: 'x' };
    (
      await h.repository.withWriter((w) =>
        w.register({
          taskId: tid('x'),
          operationId: 'op-x' as OperationId,
          request,
          record: {
            recordType: 'resolved',
            task: {
              envelope: {
                schemaVersion: 1,
                id: tid('x'),
                kind: 'fgv.tracked' as never,
                detailVersion: 1,
                revision: rev(1),
                title: 'x',
                stopPolicy: 'none',
                scopes: [alpha],
                lifecycle: { status: 'pending' },
                attention: [],
                recovery: 'host-resume',
                observation: { state: 'current', observedAt: at as never },
                createdAt: at as never,
                changedAt: at as never
              },
              details: {}
            },
            operations: [
              {
                type: 'catalog',
                operationId: 'op-x' as OperationId,
                operation: 'create-tracked',
                request,
                principalKey: 'alice',
                receipt: null
              }
            ],
            updates: [],
            archived: false
          }
        })
      )
    ).orThrow();
    expect(
      await h.writer.createTracked({ taskId: tid('x'), operationId: 'op-x' as OperationId, title: 'x' })
    ).toFailWith(/creation receipt does not convert/);
  });
});

describe('the remaining refusals', () => {
  let h: IBrokerHarness;
  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 't');
    await track(h.writer, 'p');
  });

  test('a stored catalog receipt that does not convert is storage-corrupt on replay', async () => {
    const key = 'op-bad' as OperationId;
    const request: JsonValue = {
      taskId: 't',
      operationId: key,
      expectedRevision: 1,
      responsibility: 'unassigned'
    };
    const current = (await h.repository.readCommit(tid('t'))).orThrow()!;
    if (current.recordType !== 'resolved') {
      throw new Error('resolved expected');
    }
    (
      await h.repository.withWriter((w) =>
        w.commit({
          purpose: 'operation',
          operationId: key,
          taskId: tid('t'),
          expectedRevision: rev(1),
          expectedRecordRevision: current.recordRevision,
          record: {
            recordType: 'resolved',
            task: current.task,
            operations: [
              ...current.operations,
              {
                type: 'catalog',
                operationId: key,
                operation: 'reassign',
                request,
                principalKey: 'alice',
                receipt: 'garbage'
              }
            ],
            updates: current.updates,
            archived: false
          }
        })
      )
    ).orThrow();
    expect(
      await h.writer.reassign({
        taskId: tid('t'),
        operationId: key,
        expectedRevision: rev(1),
        responsibility: 'unassigned'
      })
    ).toFailWith(/stored receipt of 'op-bad' does not convert/);
  });

  test('a related record that cannot be re-read inside the writer stops the move', async () => {
    const w = writerOf(
      faulty(
        h,
        () => ({}),
        (real) => ({
          readCommit: async (id: TaskId) => (id === 'p' ? storageDown() : real.readCommit(id))
        })
      ),
      h
    );
    expect(
      await w.reparent({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: rev(1),
        parent: { taskId: tid('p') }
      })
    ).toFailWith(/storage down/);
  });

  test('a candidate whose record cannot be read stops the pump', async () => {
    await list(h.writer, 'l');
    await track(h.writer, 'c', { parentId: 'l' });
    await succeedTask(h, h.writer, 'c');
    const w = writerOf(
      faulty(h, (real) => ({
        readCommit: async (id: TaskId) => (id === 'l' ? storageDown() : real.readCommit(id))
      })),
      h
    );
    expect(await w.reconcileListCompletions({ limit: 5 })).toFailWith(/storage down/);
  });

  test('a patch that changes nothing is recorded as unchanged; setting and clearing one field is refused', async () => {
    expect(
      await h.writer.updateTracked({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: rev(1),
        patch: { title: 'task t' }
      })
    ).toSucceedWith(expect.objectContaining({ disposition: 'unchanged', revision: 1 }));
    expect(
      await h.writer.updateTracked({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: rev(1),
        patch: { description: 'x', clear: ['description'] }
      })
    ).toFailWith(/both set and cleared/);
  });

  test('a creation replay is re-authorized', async () => {
    const request = {
      taskId: tid('n'),
      operationId: op(),
      title: 'n',
      description: 'with a description',
      stopPolicy: 'cascade-pause' as const
    };
    const first = (await h.writer.createTracked(request)).orThrow();
    expect(await h.writer.createTracked(request)).toSucceedWith(first);
    h.policy.deny.push((r) => r.action === 'create');
    expect(await h.writer.createTracked(request)).toFailWith(/'create' is not permitted/);
    const record = (await h.repository.readCommit(tid('n'))).orThrow()!;
    expect(record.recordType === 'resolved' && record.task.envelope).toEqual(
      expect.objectContaining({ description: 'with a description', stopPolicy: 'cascade-pause' })
    );
  });

  test('an external registration keeps its description and first observed progress', async () => {
    (
      await h.broker.registerExternal('host', {
        ...vendorRequest('v'),
        description: 'described',
        initialObservation: {
          revision: { epoch: 'e', token: '1' },
          observedAt: at,
          lifecycle: { status: 'running' },
          progress: { completed: 3 },
          attention: [],
          details: { job: 'j' }
        }
      })
    ).orThrow();
    const record = (await h.repository.readCommit(tid('v'))).orThrow()!;
    expect(record.recordType === 'resolved' && record.task.envelope).toEqual(
      expect.objectContaining({ description: 'described', progress: { completed: 3 } })
    );
  });

  test('an unresolved reference that cannot be projected fails the page', async () => {
    (await h.broker.registerExternal('host', { ...vendorRequest('u'), title: 'y'.repeat(200) })).orThrow();
    const strict = TaskConverters.create({ bounds: { maxTitleLength: 100 } }).orThrow();
    const broker = TaskBroker.create({
      repository: h.repository,
      environment: h.env,
      converters: strict
    }).orThrow();
    const view = broker.bindView({ principal: 'p', scopes: [alpha], authorization: h.policy }).orThrow();
    expect(await view.query({})).toFailWith(/projection failed/);
  });
});

describe('the writer queue and host callbacks', () => {
  test('a queue at its bound refuses rather than waiting without limit', async () => {
    const queue = new WriterQueue();
    let release: () => void = () => undefined;
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });
    const waiting: Array<Promise<TaskResult<number>>> = [];
    for (let i = 0; i < maxWaitingWriters; i++) {
      waiting.push(
        queue.run(async () => {
          await blocked;
          return succeedWithDetail<number, ITaskFailure>(i);
        })
      );
    }
    expect(await queue.run(async () => succeedWithDetail<number, ITaskFailure>(-1))).toFailWith(
      /already waiting/
    );
    release();
    expect((await Promise.all(waiting)).map((r) => r.orThrow())).toHaveLength(maxWaitingWriters);
    // A section that throws is a failure, and the queue keeps going.
    expect(
      await queue.run(async (): Promise<TaskResult<number>> => {
        throw new Error('section blew up');
      })
    ).toFailWith(/a gated section threw: section blew up/);
    expect(await queue.run(async () => succeedWithDetail<number, ITaskFailure>(7))).toSucceedWith(7);
  });

  test('a host clock that fails stops a mutation before it commits', async () => {
    const h = await brokerHarness();
    await track(h.writer, 't');
    const broken = TaskEnvironment.create({
      logger: h.logger,
      clock: () => Number.NaN,
      newId: () => succeed('id')
    }).orThrow();
    const broker = TaskBroker.create({ repository: h.repository, environment: broken }).orThrow();
    const w = broker.bind({ principal: 'alice', scopes: [alpha], authorization: new TestPolicy() }).orThrow();
    expect(await w.createTracked({ taskId: tid('n'), operationId: op(), title: 'n' })).toFailWith(/clock/);
    expect(
      await w.reassign({ taskId: tid('t'), operationId: op(), expectedRevision: rev(1), responsibility: ada })
    ).toFailWith(/clock/);
    expect(
      await w.execute({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: rev(1),
        command: 'start',
        parameters: {}
      })
    ).toFailWith(/clock/);
    expect(await broker.registerExternal('host', vendorRequest('v'))).toFailWith(/clock/);
    expect(await revisionOf(h.repository, 't')).toBe(1);
  });

  test('toJson refuses what is not JSON; an unclassified failure has no code', () => {
    const core = new BrokerCore({
      repository: undefined as unknown as ITaskRepository,
      environment: undefined as unknown as TaskEnvironment,
      converters: TaskConverters.create().orThrow(),
      audience: noAudience
    });
    expect(core.toJson(() => 1)).toFail();
    expect(
      codeOf(failWithDetail<number, ITaskFailure>('x', undefined as unknown as ITaskFailure))
    ).toBeUndefined();
  });

  test('an unknown tracked command name does not convert', () => {
    const converters = TaskConverters.create().orThrow();
    expect(converters.broker.trackedCommand.convert({ command: 'frobnicate', parameters: {} })).toFailWith(
      /not a fgv.tracked@1 command/
    );
  });
});

describe('request and precondition refusals on every operation', () => {
  let h: IBrokerHarness;
  beforeEach(async () => {
    h = await brokerHarness();
    await track(h.writer, 't');
  });

  test('malformed requests are invalid', async () => {
    const bad = { nope: true } as never;
    for (const call of [
      h.writer.updateTracked(bad),
      h.writer.reassign(bad),
      h.writer.changeScopes(bad),
      h.writer.reparent(bad),
      h.writer.completeList(bad),
      h.writer.archive(bad),
      h.writer.createTracked(bad),
      h.writer.createTaskList(bad),
      h.writer.reconcileListCompletions(bad),
      h.writer.query(bad),
      h.writer.inspect('../escape' as TaskId)
    ]) {
      expect(await call).toFailWith(/./);
      const failed = await call;
      expect(failed.isFailure() && failed.detail?.code).toBe('invalid');
    }
  });

  test('a stale expected revision is refused before authorization', async () => {
    h.policy.calls.splice(0);
    expect(
      await h.writer.reassign({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: rev(5),
        responsibility: ada
      })
    ).toFailWith(/expected revision 5, found resolved revision 1/);
    expect(h.policy.calls.map((c) => c.action)).toEqual(['read']);
  });

  test('only a terminal task can be archived', async () => {
    expect(
      await h.writer.archive({ taskId: tid('t'), operationId: op(), expectedRevision: rev(1) })
    ).toFailWith(/only a terminal task/);
  });

  test('creation retries: a hidden existing task is not found, a different request conflicts, denial holds', async () => {
    expect(await h.writer.createTracked({ taskId: tid('t'), operationId: op(), title: 'other' })).toFailWith(
      /already registered by a different operation or request/
    );
    h.policy.hide('t');
    expect(await h.writer.createTracked({ taskId: tid('t'), operationId: op(), title: 'other' })).toFailWith(
      /^task t: not found or not visible$/
    );
    h.policy.deny.splice(0);
    h.policy.deny.push((r) => r.action === 'create');
    expect(await h.writer.createTracked({ taskId: tid('n'), operationId: op(), title: 'n' })).toFailWith(
      /'create' is not permitted/
    );
    // and a replay of an existing creation is re-authorized
    const again = await h.writer.createTracked({
      taskId: tid('t'),
      operationId: 'create-t-1' as OperationId,
      title: 'task t'
    });
    expect(again.isFailure()).toBe(true);
  });

  test('a policy epoch that cannot be read stops commands and creation', async () => {
    const w = bindWriter(h, {
      authorization: {
        check: async () => succeed(true),
        policyEpoch: () => {
          throw new Error('gone');
        }
      }
    });
    expect(
      await w.execute({
        taskId: tid('t'),
        operationId: op(),
        expectedRevision: rev(1),
        command: 'start',
        parameters: {}
      })
    ).toFailWith(/policy epoch unavailable/);
    expect(await w.createTracked({ taskId: tid('n'), operationId: op(), title: 'n' })).toFailWith(
      /policy epoch unavailable/
    );
  });

  test('a registration the repository refuses is reported', async () => {
    (await h.broker.registerExternal('host', vendorRequest('v'))).orThrow();
    // The same binding a second time: storage refuses a second task bound to it.
    const second = await h.broker.registerExternal('host', {
      ...vendorRequest('w'),
      binding: vendorRequest('v').binding
    });
    expect(second).toFailWith(/already binds this reference/);
  });

  test('concurrent identical commands apply once; the second replays', async () => {
    const request = {
      taskId: tid('t'),
      operationId: op(),
      expectedRevision: rev(1),
      command: 'start',
      parameters: {}
    };
    const [a, b] = await Promise.all([h.writer.execute(request), h.writer.execute(request)]);
    expect(b).toSucceedWith(a.orThrow());
  });

  test('an unresolved registration with a parent and responsibility projects both, never its binding', async () => {
    await registerVendor(h, 'u', { unresolved: true, parentId: 't', responsibility: ada });
    expect(await h.writer.inspect(tid('u'))).toSucceedAndSatisfy((i) => {
      expect(i.state === 'unresolved' && i.reference).toEqual(
        expect.objectContaining({ parentId: 't', responsibility: ada })
      );
    });
  });

  test('set-description and set-attention through execute', async () => {
    const cases: ReadonlyArray<[string, JsonValue]> = [
      ['set-description', { description: 'd' }],
      ['set-attention', { attention: [{ namespace: 'q', key: '1' }] }]
    ];
    for (const [name, parameters] of cases) {
      expect(
        await h.writer.execute({
          taskId: tid('t'),
          operationId: op(),
          expectedRevision: await revisionOf(h.repository, 't'),
          command: name,
          parameters
        })
      ).toSucceedWith(expect.objectContaining({ result: expect.objectContaining({ state: 'applied' }) }));
    }
  });
});

function vendorRequest(
  id: string,
  parentId?: string
): {
  taskId: TaskId;
  operationId: OperationId;
  kind: string;
  detailVersion: number;
  title: string;
  scopes: (typeof alpha)[];
  binding: { sourceId: string; referenceVersion: number; reference: JsonValue };
  recovery: 'reattach';
  parentId?: TaskId;
} {
  return {
    taskId: tid(id),
    operationId: op(),
    kind: 'acme.job',
    detailVersion: 1,
    title: `vendor ${id}`,
    scopes: [alpha],
    binding: { sourceId: 'acme', referenceVersion: 1, reference: { job: id } },
    recovery: 'reattach',
    ...(parentId !== undefined ? { parentId: tid(parentId) } : {})
  };
}
