/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { FileTree, JsonValue } from '@fgv/ts-json-base';
import { Result, fail, succeed, succeedWithDetail } from '@fgv/ts-utils';
import {
  ExternalCommandResult,
  defaultTaskCapacityProfile,
  FileTreeTaskRepository,
  ICommandReceipt,
  ITaskCommitRecord,
  ITaskFailure,
  ITaskRegistrationRequest,
  ITaskRepository,
  ITaskRepositoryWriter,
  ITaskSource,
  OperationId,
  SourceRead,
  SubscriptionId,
  TaskAudienceResolver,
  TaskBroker,
  TaskResult,
  TaskRevision
} from '../../../index';
import { alpha, op, rev, tid } from '../../helpers/brokerFixtures';
import { FaultyRoot } from '../../helpers/faultyRoot';
import {
  IJobDetails,
  ISourceHarness,
  SimulatedExecutor,
  harnessWith,
  jobKind,
  observationOnlySource,
  recordOf,
  registerJob,
  sourceHarness,
  sourceRegistry
} from '../../helpers/sourceFixtures';
import { catalogOp, environment, memoryRoot } from '../../helpers/storageFixtures';

const everyone: TaskAudienceResolver = () => ['watcher' as SubscriptionId];

async function ready(options?: Parameters<typeof sourceHarness>[0]): Promise<ISourceHarness> {
  const h = await sourceHarness(options);
  h.executor.addJob('j1');
  await registerJob(h, 'j1');
  return h;
}

function execute(
  h: { readonly writer: ISourceHarness['writer'] },
  command: string,
  parameters: JsonValue,
  key: OperationId = op(),
  expectedRevision: TaskRevision = rev(1)
): Promise<TaskResult<ICommandReceipt>> {
  return h.writer.execute({ taskId: tid('j1'), operationId: key, expectedRevision, command, parameters });
}

/** A repository whose writer misbehaves on chosen calls. */
function misbehaving(
  repository: ITaskRepository,
  options: {
    readonly readCommit?: (
      call: number,
      real: () => ReturnType<ITaskRepositoryWriter['readCommit']>
    ) => ReturnType<ITaskRepositoryWriter['readCommit']>;
    readonly commit?: (
      request: Parameters<ITaskRepositoryWriter['commit']>[0],
      real: () => ReturnType<ITaskRepositoryWriter['commit']>
    ) => ReturnType<ITaskRepositoryWriter['commit']>;
    readonly repositoryReadCommit?: ITaskRepository['readCommit'];
  }
): ITaskRepository {
  let calls = 0;
  return Object.assign(Object.create(repository), {
    ...(options.repositoryReadCommit !== undefined ? { readCommit: options.repositoryReadCommit } : {}),
    withWriter: <T>(action: (w: ITaskRepositoryWriter) => Promise<T>) =>
      repository.withWriter(
        (w) =>
          action({
            readCommit: (id) => {
              const call = ++calls;
              return options.readCommit !== undefined
                ? options.readCommit(call, () => w.readCommit(id))
                : w.readCommit(id);
            },
            register: (r) => w.register(r),
            commit: (r) =>
              options.commit !== undefined ? options.commit(r, () => w.commit(r)) : w.commit(r),
            readSource: (id) => w.readSource(id),
            commitSource: (r) => w.commitSource(r),
            extendReplayEnvelope: (id, add) => w.extendReplayEnvelope(id, add),
            raiseCapacityLimits: (p) => w.raiseCapacityLimits(p)
          }) as never
      )
  });
}

function brokerOver(h: ISourceHarness, repository: ITaskRepository): ISourceHarness {
  const next = harnessWith(repository, h.env, h.root, h.logger, h.executor, h.source, h.registry);
  Object.assign(next.policy, { deny: h.policy.deny });
  return next;
}

describe('observation edges', () => {
  test('health returning to current with a newer projection owes an observation update', async () => {
    const h = await ready({ audience: everyone });
    h.executor.down = true;
    expect(await h.broker.observe(tid('j1'))).toSucceed();
    h.executor.down = false;
    h.executor.change('j1', (j) => (j.step = 1));
    expect(await h.broker.observe(tid('j1'))).toSucceed();
    const record = await recordOf(h, 'j1');
    const latest = record.recordType === 'resolved' ? record.task.envelope.revision : rev(0);
    expect(
      record.recordType === 'resolved' &&
        record.updates.filter((u) => u.revision === latest).map((u) => u.category)
    ).toEqual(['progress', 'observation']);
  });

  test('an archived task takes no observation and no health change', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1', { status: 'succeeded', outcome: { summary: 'ok', artifacts: [] } });
    await registerJob(h, 'j1');
    expect(
      await h.writer.archive({ taskId: tid('j1'), operationId: op(), expectedRevision: rev(1) })
    ).toSucceed();
    const before = await recordOf(h, 'j1');
    h.executor.change('j1', (j) => (j.step = 3));
    expect(await h.broker.observe(tid('j1'))).toSucceedAndSatisfy((report) =>
      expect(report.outcome).toBe('unchanged')
    );
    h.executor.down = true;
    expect(await h.broker.observe(tid('j1'))).toSucceedAndSatisfy((report) =>
      expect(report.outcome).toBe('source-unavailable')
    );
    expect(await recordOf(h, 'j1')).toEqual(before);
  });

  test('an unresolved task has no health to change', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1', { unresolved: true });
    const before = await recordOf(h, 'j1');
    h.executor.down = true;
    expect(await h.broker.observe(tid('j1'))).toSucceedAndSatisfy((report) =>
      expect(report.outcome).toBe('source-unavailable')
    );
    expect(await recordOf(h, 'j1')).toEqual(before);
  });

  test('a push for a source that is not attached is refused before anything is read', async () => {
    const h = await sourceHarness({ attach: false });
    expect(await h.broker.hint(h.executor.binding('j1'))).toFailWithDetail(/not attached/, {
      code: 'source-unavailable',
      retry: 'after-host-action'
    });
  });

  test('a source that throws is unavailable; one whose read does not convert breaks its contract', async () => {
    const h = await ready();
    const throwing: ITaskSource = {
      ...(h.source as unknown as ITaskSource),
      id: 'exec',
      history: 'observed-state',
      compare: (a, b) => h.source.compare(a, b),
      observe: async () => {
        throw new Error('socket closed');
      },
      reconcile: (c) => h.source.reconcile(c),
      dispatch: (b, r) => h.source.dispatch(b, r),
      recover: (b) => h.source.recover(b)
    };
    const thrown = harnessWith(
      h.repository,
      h.env,
      h.root,
      h.logger,
      h.executor,
      throwing as never,
      h.registry
    );
    expect(await thrown.broker.observe(tid('j1'))).toSucceedAndSatisfy((report) => {
      expect(report.outcome).toBe('source-unavailable');
      expect(report.message).toMatch(/threw: socket closed/);
      expect(report.revision).toBe(2);
    });
    const garbage: ITaskSource = {
      ...throwing,
      observe: async () =>
        succeedWithDetail<SourceRead, ITaskFailure>({ state: 'observed' } as unknown as SourceRead)
    };
    const bad = harnessWith(h.repository, h.env, h.root, h.logger, h.executor, garbage as never, h.registry);
    expect(await bad.broker.observe(tid('j1'))).toSucceedAndSatisfy((report) => {
      expect(report.outcome).toBe('contract-violation');
    });
  });

  test('a feed page may carry a health entry among ordered revisions', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
    h.executor.change('j1', (j) => (j.step = 1));
    const page = h.executor.page.bind(h.executor);
    Object.assign(h.executor, {
      page: (cursor: string | undefined) =>
        page(cursor).onSuccess((p) =>
          succeed({
            ...p,
            observations: [
              {
                binding: h.executor.binding('j1'),
                observation: { state: 'unavailable' as const, reason: 'lagging' }
              },
              ...p.observations
            ]
          })
        )
    });
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceedAndSatisfy((report) => {
      expect(report.observations.map((o) => o.outcome)).toEqual(['source-unavailable', 'applied']);
    });
  });

  test('a feed revision short of an awaited command revision leaves the command awaiting', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
    h.executor.change('j1', (j) => (j.step = 1)); // feed revision 2
    const key = op();
    expect(await execute(h, 'pause', { reason: 'x' }, key, rev(2))).toSucceed(); // effect at revision 3
    h.executor.pageSize = 1;
    // Only revision 2 arrives.
    expect(await h.broker.reconcile({ sourceId: 'exec', maxPages: 1 })).toSucceed();
    const record = await recordOf(h, 'j1');
    const command = record.operations.find((o) => o.operationId === key);
    expect(command?.type === 'command' && command.receipt.result).toEqual({ state: 'accepted' });
  });

  test('a cursor the repository cannot store stops the pass as a storage stop, after the page committed', async () => {
    const h = await ready({
      profile: {
        ...defaultTaskCapacityProfile,
        encoded: { ...defaultTaskCapacityProfile.encoded, maxSourceCursorBytes: 4 }
      }
    });
    h.executor.change('j1', (j) => (j.step = 5));
    const page = h.executor.page.bind(h.executor);
    Object.assign(h.executor, {
      page: (cursor: string | undefined) =>
        page(cursor).onSuccess((p) => succeed({ ...p, checkpoint: 'far-too-long' }))
    });
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceedAndSatisfy((report) => {
      expect(report.stopped).toBe('storage');
      expect(report.observations.map((o) => o.outcome)).toEqual(['applied']);
      expect(report.cursor).toBeUndefined();
    });
  });

  test('a resolved external task registered without a source revision takes its first observation as newer', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    const registration = await import('../../helpers/storageFixtures');
    const reg = registration.registration('j1');
    const draft = reg.record as Extract<ITaskRegistrationRequest['record'], { recordType: 'resolved' }>;
    const request: ITaskRegistrationRequest = {
      ...reg,
      record: {
        ...draft,
        task: {
          envelope: {
            ...draft.task.envelope,
            kind: jobKind,
            binding: h.executor.binding('j1'),
            recovery: 'reattach'
          },
          details: { step: 0, ref: 'x' }
        },
        operations: [catalogOp(reg.operationId, 'register-external', reg.request)],
        updates: []
      }
    };
    expect(await h.repository.withWriter((w) => w.register(request))).toSucceed();
    expect(await h.broker.observe(tid('j1'))).toSucceedAndSatisfy((report) =>
      expect(report.outcome).toBe('applied')
    );
  });

  test('an unresolved record whose registration evidence is not an external registration is reported corrupt', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    const request: JsonValue = { taskId: 'j1', title: 'raw' };
    const registration: ITaskRegistrationRequest = {
      taskId: tid('j1'),
      operationId: 'op-raw' as OperationId,
      request,
      record: {
        recordType: 'unresolved',
        reference: {
          id: tid('j1'),
          revision: 1 as TaskRevision,
          kind: jobKind,
          detailVersion: 1,
          title: 'raw',
          scopes: [alpha],
          binding: h.executor.binding('j1'),
          reason: 'waiting'
        },
        operations: [catalogOp('op-raw', 'register-external', request)]
      }
    };
    expect(await h.repository.withWriter((w) => w.register(registration))).toSucceed();
    expect(await h.broker.observe(tid('j1'))).toFailWithDetail(/registration evidence does not convert/, {
      code: 'storage-corrupt',
      retry: 'after-host-action'
    });
  });
});

describe('host failures', () => {
  test('a closed repository fails every source operation', async () => {
    const h = await ready();
    expect(h.repository.close()).toSucceed();
    const closed = { code: 'storage-unavailable', retry: 'after-host-action' };
    expect(await h.broker.observe(tid('j1'))).toFailWithDetail(/closed/, closed);
    expect(await h.broker.hint(h.executor.binding('j1'))).toFailWithDetail(/closed/, closed);
    expect(await h.broker.recover(tid('j1'))).toFailWithDetail(/closed/, closed);
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toFailWithDetail(/closed/, closed);
    expect(await h.writer.resolveCommands({ limit: 10 })).toFailWithDetail(/closed/, closed);
  });

  test('a failing clock fails the observation and stops a pass as storage', async () => {
    let broken = false;
    const h = await ready({
      clock: () => (broken ? Number.NaN : Date.parse('2026-09-24T10:00:00.000Z'))
    });
    h.executor.change('j1', (j) => (j.step = 1));
    broken = true;
    expect(await h.broker.observe(tid('j1'))).toFailWith(/clock/);
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceedAndSatisfy((report) => {
      expect(report.stopped).toBe('storage');
      expect(report.issues.join()).toMatch(/clock/);
    });
    h.executor.down = true;
    expect(await h.broker.observe(tid('j1'))).toFailWith(/clock/);
  });

  test('a host ID factory that fails refuses the command intent, recording nothing', async () => {
    let broken = false;
    let next = 0;
    const h = await ready({ newId: () => (broken ? fail('no ids') : succeed(`edge-${++next}`)) });
    const before = await recordOf(h, 'j1');
    broken = true;
    expect(await execute(h, 'pause', { reason: 'x' })).toFailWithDetail(/no ids/, {
      code: 'storage-unavailable',
      retry: 'safe',
      operationId: expect.anything()
    } as never);
    expect(await recordOf(h, 'j1')).toEqual(before);
    expect(h.executor.dispatches.size).toBe(0);
  });

  test('a policy epoch that fails at the dispatch boundary leaves the intent unsent', async () => {
    const h = await ready();
    let calls = 0;
    Object.assign(h.policy, {
      policyEpoch: () => {
        if (++calls > 2) {
          throw new Error('epoch gone');
        }
        return 'e';
      }
    });
    const key = op();
    expect(await execute(h, 'pause', { reason: 'x' }, key)).toFailWith(/epoch/);
    const record = await recordOf(h, 'j1');
    const command = record.operations.find((o) => o.operationId === key);
    expect(command?.type === 'command' && command.dispatch).toBe('not-sent');
  });

  test('two sources may not share an id', () => {
    const executor = new SimulatedExecutor('exec', 'observed-state');
    const source = observationOnlySource(executor);
    const repository = {} as ITaskRepository;
    expect(
      TaskBroker.create({ repository, environment: environment('d').env, sources: [source, source] })
    ).toFailWith(/two sources share the id 'exec'/);
  });
});

describe('command edges', () => {
  test('the same key sent twice at once is dispatched once; the second answers from the record', async () => {
    const h = await ready();
    const key = op();
    const [a, b] = await Promise.all([
      execute(h, 'pause', { reason: 'x' }, key),
      execute(h, 'pause', { reason: 'x' }, key)
    ]);
    expect(a).toSucceed();
    expect(b).toSucceed();
    expect(h.executor.dispatches.get(key)).toBe(1);
  });

  test('a source-replay registration is refused when its source is not attached', async () => {
    const h = await sourceHarness({ history: 'source-replay', attach: false });
    h.executor.addJob('j1');
    expect(
      await h.broker.registerExternal('host', {
        taskId: tid('j1'),
        operationId: op(),
        kind: jobKind,
        detailVersion: 1,
        title: 'j1',
        scopes: [alpha],
        binding: h.executor.binding('j1'),
        recovery: 'reattach',
        history: {
          history: 'source-replay',
          envelope: { remainingRequiredUpdates: 1, remainingRequiredBytes: 1 }
        }
      })
    ).toFailWithDetail(
      /not an attached source-replay source/,
      expect.objectContaining({ code: 'unsupported' })
    );
  });

  test('a replay envelope past the safe-integer range is refused', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    expect(
      await h.broker.registerExternal('host', {
        taskId: tid('j1'),
        operationId: op(),
        kind: jobKind,
        detailVersion: 1,
        title: 'j1',
        scopes: [alpha],
        binding: h.executor.binding('j1'),
        recovery: 'reattach',
        history: {
          history: 'source-replay',
          envelope: { remainingRequiredUpdates: Number.MAX_SAFE_INTEGER, remainingRequiredBytes: 1 }
        }
      })
    ).toFailWith(/safe-integer range/);
  });

  test('a storage registration may reserve an envelope only for its own binding’s source', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    const request: JsonValue = { taskId: 'j1' };
    expect(
      await h.repository.withWriter((w) =>
        w.register({
          taskId: tid('j1'),
          operationId: 'op-r' as OperationId,
          request,
          record: {
            recordType: 'unresolved',
            reference: {
              id: tid('j1'),
              revision: 1 as TaskRevision,
              kind: jobKind,
              detailVersion: 1,
              title: 'j1',
              scopes: [alpha],
              binding: h.executor.binding('j1'),
              reason: 'waiting'
            },
            operations: [catalogOp('op-r', 'register-external', request)]
          },
          sourceReplay: {
            sourceId: 'elsewhere',
            envelope: { remainingRequiredUpdates: 1, remainingRequiredBytes: 1 }
          }
        })
      )
    ).toFailWith(/only for the source the task's own binding names/);
  });

  test('a dispatch answer that breaks the source contract is uncertain, never a receipt', async () => {
    const h = await ready();
    const dispatch = h.executor.dispatch.bind(h.executor);
    Object.assign(h.executor, {
      dispatch: async (...args: Parameters<typeof dispatch>) => {
        await dispatch(...args);
        return succeed({ state: 'accepted', sourceReceipt: 'two\nlines' });
      }
    });
    expect(await execute(h, 'pause', { reason: 'x' })).toSucceedAndSatisfy((receipt) => {
      expect(receipt.result.state).toBe('indeterminate');
      expect(receipt.result.state === 'indeterminate' && receipt.result.reason).toMatch(
        /breaks its contract/
      );
    });
  });

  test('an applied answer whose projection the broker cannot order leaves the command accepted', async () => {
    const h = await ready();
    const dispatch = h.executor.dispatch.bind(h.executor);
    Object.assign(h.executor, {
      dispatch: async (...args: Parameters<typeof dispatch>) => {
        const answer = await dispatch(...args);
        return answer.onSuccess((a) =>
          a.state === 'applied'
            ? succeed<ExternalCommandResult<IJobDetails>>({
                ...a,
                observation: { ...a.observation, revision: { epoch: 'e9', token: '1' } }
              })
            : succeed<ExternalCommandResult<IJobDetails>>(a)
        );
      }
    });
    expect(await execute(h, 'pause', { reason: 'x' })).toSucceedAndSatisfy((receipt) => {
      expect(receipt.result).toEqual({ state: 'accepted' });
    });
  });

  test('a failure applying an applied answer’s projection is commit-indeterminate', async () => {
    let broken = false;
    const h = await ready({ clock: () => (broken ? Number.NaN : Date.parse('2026-09-24T10:00:00.000Z')) });
    Object.assign(h.executor, {
      onDispatch: async () => {
        broken = true;
      }
    });
    const key = op();
    expect(await execute(h, 'pause', { reason: 'x' }, key)).toFailWithDetail(
      /persisting its outcome failed/,
      {
        code: 'commit-indeterminate',
        retry: 'reconcile-first',
        operationId: key
      }
    );
  });
});

describe('the pump, at its edges', () => {
  async function uncertain(
    options?: Parameters<typeof sourceHarness>[0],
    command: string = 'pause'
  ): Promise<ISourceHarness> {
    const h = await ready(options);
    h.executor.loseNextResponse = true;
    expect(await execute(h, command, { reason: 'x' })).toSucceed();
    return h;
  }

  test('a task whose source is not attached is reported unavailable', async () => {
    const h = await uncertain();
    const detached = harnessWith(h.repository, h.env, h.root, h.logger, h.executor, h.source, h.registry, {
      attach: false
    });
    expect(await detached.writer.resolveCommands({ limit: 10 })).toSucceedAndSatisfy((report) => {
      expect(report.resolutions.map((r) => r.action)).toEqual(['unavailable']);
    });
  });

  test('a lookup that fails is unavailable; one that does not convert falls through to the idempotency rule', async () => {
    const h = await uncertain({ lookup: true }, 'cancel');
    Object.assign(h.executor, { lookup: () => fail('lookup down') });
    expect(await h.writer.resolveCommands({ limit: 10 })).toSucceedAndSatisfy((report) => {
      expect(report.resolutions.map((r) => r.action)).toEqual(['unavailable']);
    });
    Object.assign(h.executor, { lookup: () => succeed({ state: 'maybe' }) });
    expect(await h.writer.resolveCommands({ limit: 10 })).toSucceedAndSatisfy((report) => {
      expect(report.resolutions.map((r) => r.action)).toEqual(['held']);
    });
  });

  test('a source-key resend that is still uncertain stays eligible and changes nothing', async () => {
    const h = await uncertain();
    h.executor.answerIndeterminate = true;
    h.executor.keys.clear();
    expect(await h.writer.resolveCommands({ limit: 10 })).toSucceed();
    const before = await recordOf(h, 'j1');
    expect(await h.writer.resolveCommands({ limit: 10 })).toSucceedAndSatisfy((report) => {
      expect(report.resolutions.map((r) => r.action)).toEqual(['unavailable']);
    });
    expect((await recordOf(h, 'j1')).recordRevision).toBe(before.recordRevision);
  });

  test('a command its kind no longer declares is held', async () => {
    const h = await uncertain();
    h.repository.close();
    const registry = sourceRegistry(observationOnlySource(h.executor));
    const reopened = (
      await FileTreeTaskRepository.open({
        root: h.root,
        mode: 'session',
        environment: environment('k').env,
        registry
      })
    ).orThrow();
    const repository = reopened.state === 'ready' ? reopened.repository : undefined;
    const broker = harnessWith(repository!, h.env, h.root, h.logger, h.executor, h.source, registry);
    expect(await broker.writer.resolveCommands({ limit: 10 })).toSucceedAndSatisfy((report) => {
      expect(report.resolutions.map((r) => r.action)).toEqual(['held']);
    });
  });

  test('a record read that fails, outside or inside the writer, fails the pass', async () => {
    const h = await uncertain();
    const outside = brokerOver(
      h,
      misbehaving(h.repository, { repositoryReadCommit: async () => fail('read failed') as never })
    );
    expect(await outside.writer.resolveCommands({ limit: 10 })).toFailWith(/read failed/);
    const inside = brokerOver(
      h,
      misbehaving(h.repository, { readCommit: async () => fail('in-writer read failed') as never })
    );
    expect(await inside.writer.resolveCommands({ limit: 10 })).toFailWith(
      /persisting its outcome failed.*in-writer read failed/
    );
  });
});

describe('a writer that breaks its contract', () => {
  test.each<[string, number]>([
    ['the intent section', 1],
    ['the marker section', 2],
    ['the result section', 3]
  ])('a failed read in %s fails the command', async (__, call) => {
    const h = await ready();
    const broken = brokerOver(
      h,
      misbehaving(h.repository, {
        readCommit: (n, real) => (n === call ? Promise.resolve(fail('read failed') as never) : real())
      })
    );
    expect(await execute(broken, 'pause', { reason: 'x' })).toFail();
  });

  test.each<[string, number, string]>([
    // Before the send: the repository's inconsistency, as it is.
    ['the marker section', 2, 'storage-corrupt'],
    // After the send: the outcome is uncertain, whatever made persisting it fail.
    ['the result section', 3, 'commit-indeterminate']
  ])('a command that vanishes in %s is reported, not guessed at', async (__, call, code) => {
    const h = await ready({ history: 'source-replay' });
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
    const resolved = await recordOf(h, 'j1');
    const revision = resolved.recordType === 'resolved' ? resolved.task.envelope.revision : rev(0);
    const broken = brokerOver(
      h,
      misbehaving(h.repository, {
        readCommit: (n, real) =>
          n === call
            ? real().then(
                (r) =>
                  r.onSuccess((record: ITaskCommitRecord | undefined) =>
                    succeedWithDetail<ITaskCommitRecord | undefined, ITaskFailure>(
                      record === undefined || record.recordType !== 'resolved'
                        ? record
                        : { ...record, operations: record.operations.filter((o) => o.type !== 'command') }
                    )
                  ) as never
              )
            : real()
      })
    );
    expect(await execute(broken, 'pause', { reason: 'x' }, op(), revision)).toFailWithDetail(
      /no longer holds command/,
      expect.objectContaining({ code })
    );
  });

  test('an intent commit that returns a record without the command is reported', async () => {
    const h = await ready();
    const broken = brokerOver(
      h,
      misbehaving(h.repository, {
        commit: async () => (await recordOf(h, 'j1')) && (succeedWithDetail(await recordOf(h, 'j1')) as never)
      })
    );
    expect(await execute(broken, 'pause', { reason: 'x' })).toFailWithDetail(
      /no longer holds command/,
      expect.objectContaining({ code: 'storage-corrupt' })
    );
  });

  test('an applied answer’s settlement read that fails is commit-indeterminate', async () => {
    const h = await ready();
    // Four writer reads: intent, marker, the projection's commit, the settlement.
    const broken = brokerOver(
      h,
      misbehaving(h.repository, {
        readCommit: (n, real) => (n === 4 ? Promise.resolve(fail('read failed') as never) : real())
      })
    );
    Object.assign(h.executor, {
      dispatch: async (...args: Parameters<SimulatedExecutor['dispatch']>) => {
        const answer = await SimulatedExecutor.prototype.dispatch.apply(h.executor, args);
        // Report the effect at the committed revision, so the projection commits nothing.
        return answer.onSuccess((a) =>
          a.state === 'applied'
            ? succeed<ExternalCommandResult<IJobDetails>>({
                ...a,
                observation: { ...a.observation, revision: { epoch: 'e1', token: '1' } }
              })
            : succeed<ExternalCommandResult<IJobDetails>>(a)
        );
      }
    });
    expect(await execute(broken, 'pause', { reason: 'x' })).toFail();
  });
});

describe('storage edges for source records', () => {
  test('the writer reads a source record, and refuses a malformed id', async () => {
    const h = await sourceHarness();
    expect(
      await h.repository.withWriter(async (w) =>
        (
          await w.commitSource({
            sourceId: 'exec',
            history: 'observed-state',
            expectedRecordRevision: 0,
            pages: 1
          })
        ).onSuccess(() => w.readSource('exec') as never)
      )
    ).toSucceed();
    expect(await h.repository.withWriter((w) => w.readSource('exec'))).toSucceedAndSatisfy((r) =>
      expect(r?.id).toBe('exec')
    );
    expect(await h.repository.withWriter((w) => w.readSource('bad id!'))).toFailWith(/source id/i);
  });

  test('two sources keep the inventory ordered', async () => {
    const h = await sourceHarness();
    for (const id of ['zed', 'alp']) {
      expect(
        await h.repository.withWriter((w) =>
          w.commitSource({ sourceId: id, history: 'observed-state', expectedRecordRevision: 0, pages: 1 })
        )
      ).toSucceed();
    }
    const manifest = JSON.parse(
      (
        (h.root.getChildren().orThrow() as ReadonlyArray<FileTree.FileTreeItem>).find(
          (c) => c.name === 'repository.json'
        ) as FileTree.IFileTreeFileItem
      )
        .getRawContents()
        .orThrow()
    );
    expect(manifest.sources.map((s: { id: string }) => s.id)).toEqual(['alp', 'zed']);
  });

  test('a root that cannot be listed refuses source creation and replacement safely', async () => {
    const inner = memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem;
    const root = new FaultyRoot(inner);
    const h = await sourceHarness({ root: root as unknown as FileTree.IFileTreeDirectoryItem });
    expect(
      await h.repository.withWriter((w) =>
        w.commitSource({ sourceId: 'a', history: 'observed-state', expectedRecordRevision: 0, pages: 1 })
      )
    ).toSucceed();
    root.failChildren = true;
    expect(
      await h.repository.withWriter((w) =>
        w.commitSource({ sourceId: 'b', history: 'observed-state', expectedRecordRevision: 0, pages: 1 })
      )
    ).toFailWithDetail(/cannot list/, { code: 'storage-unavailable', retry: 'safe' });
    expect(
      await h.repository.withWriter((w) =>
        w.commitSource({ sourceId: 'a', history: 'observed-state', expectedRecordRevision: 1, pages: 2 })
      )
    ).toFailWithDetail(/cannot be re-read/, { code: 'storage-unavailable', retry: 'safe' });
  });
});

export type { Result };

describe('the remaining windows', () => {
  test('an observation that lands while a command is being authorized refuses its intent', async () => {
    const h = await ready();
    let checks = 0;
    Object.assign(h.policy, {
      afterDecision: async (request: { action: string }) => {
        if (request.action === 'command' && checks++ === 0) {
          h.executor.change('j1', (j) => (j.step = 2));
          expect(await h.broker.observe(tid('j1'))).toSucceed();
        }
      }
    });
    const before = h.executor.dispatches.size;
    expect(await execute(h, 'pause', { reason: 'x' })).toFailWithDetail(
      /changed after the operation was authorized/,
      expect.objectContaining({ code: 'conflict' })
    );
    expect(h.executor.dispatches.size).toBe(before);
    const record = await recordOf(h, 'j1');
    expect(record.operations.some((o) => o.type === 'command')).toBe(false);
  });

  test.each<[string, number]>([
    ['before the intent', 0],
    ['at the dispatch boundary', 1]
  ])('a policy change %s refuses the step it would authorize', async (__, at) => {
    const h = await ready();
    let checks = 0;
    Object.assign(h.policy, {
      afterDecision: (request: { action: string }) => {
        if (request.action === 'command' && checks++ === at) {
          h.policy.epoch = 'epoch-2';
        }
      }
    });
    expect(await execute(h, 'pause', { reason: 'x' })).toFailWithDetail(
      /authorization policy changed/,
      expect.objectContaining({ code: 'conflict' })
    );
    expect(h.executor.dispatches.size).toBe(0);
  });

  test('a result another pump settled first is answered as it stands', async () => {
    const h = await ready({ lookup: true });
    h.executor.acceptOnly = true;
    h.executor.loseNextResponse = true;
    const key = op();
    expect(await execute(h, 'cancel', { reason: 'x' }, key)).toSucceed();
    let nested = true;
    const lookup = h.executor.lookup.bind(h.executor);
    Object.assign(h.source, {
      lookupCommand: async (binding: unknown, request: Parameters<typeof lookup>[0]) => {
        if (nested) {
          nested = false;
          // Another pump settles the command while this one is asking.
          expect(await h.writer.resolveCommands({ limit: 10 })).toSucceed();
        }
        return succeedWithDetail(lookup(request).orThrow());
      }
    });
    expect(await h.writer.resolveCommands({ limit: 10 })).toSucceedAndSatisfy((report) => {
      expect(report.resolutions.map((r) => r.action)).toEqual(['resolved']);
    });
    expect(h.executor.dispatches.get(key)).toBe(1);
  });

  test('a settlement that cannot be persisted fails the pump pass', async () => {
    const h = await ready({ lookup: true });
    h.executor.loseNextResponse = true;
    expect(await execute(h, 'cancel', { reason: 'x' })).toSucceed();
    const broken = brokerOver(
      h,
      misbehaving(h.repository, { readCommit: async () => fail('in-writer read failed') as never })
    );
    expect(await broken.writer.resolveCommands({ limit: 10 })).toFailWith(/in-writer read failed/);
  });

  test.each<[string, number]>([
    ['applying a projection', 2],
    ['recording an outage', 2]
  ])('a binding lookup that fails while %s fails the call', async (what, failAt) => {
    const h = await ready();
    let calls = 0;
    const repository = Object.assign(Object.create(h.repository), {
      lookupSource: (b: Parameters<ITaskRepository['lookupSource']>[0]) =>
        ++calls === failAt ? Promise.resolve(fail('lookup failed') as never) : h.repository.lookupSource(b)
    });
    const broken = brokerOver(h, repository);
    if (what === 'recording an outage') {
      h.executor.down = true;
    } else {
      h.executor.change('j1', (j) => (j.step = 1));
    }
    expect(await broken.broker.hint(h.executor.binding('j1'))).toFailWith(/lookup failed/);
  });

  test('a binding lookup that finds nothing while recording an outage reports the binding unknown', async () => {
    const h = await ready();
    let calls = 0;
    const repository = Object.assign(Object.create(h.repository), {
      lookupSource: (b: Parameters<ITaskRepository['lookupSource']>[0]) =>
        ++calls === 2 ? Promise.resolve(succeedWithDetail(undefined) as never) : h.repository.lookupSource(b)
    });
    h.executor.down = true;
    expect(await brokerOver(h, repository).broker.hint(h.executor.binding('j1'))).toSucceedAndSatisfy((r) =>
      expect(r.outcome).toBe('unknown-binding')
    );
  });

  test('an in-writer read that fails or vanishes is reported', async () => {
    const h = await ready();
    h.executor.change('j1', (j) => (j.step = 1));
    const vanishing = brokerOver(
      h,
      misbehaving(h.repository, { readCommit: async () => succeedWithDetail(undefined) as never })
    );
    expect(await vanishing.broker.observe(tid('j1'))).toSucceedAndSatisfy((r) =>
      expect(r.outcome).toBe('unknown-binding')
    );
    const failing = brokerOver(
      h,
      misbehaving(h.repository, { readCommit: async () => fail('read failed') as never })
    );
    expect(await failing.broker.observe(tid('j1'))).toFailWith(/read failed/);
    h.executor.down = true;
    expect(await failing.broker.observe(tid('j1'))).toFailWith(/read failed/);
  });

  test('recovery with a failing clock fails, whatever the source answered', async () => {
    let broken = false;
    const h = await ready({ clock: () => (broken ? Number.NaN : Date.parse('2026-09-24T10:00:00.000Z')) });
    broken = true;
    // reattached: applying the projection needs the clock.
    h.executor.change('j1', (j) => (j.step = 1));
    expect(await h.broker.recover(tid('j1'))).toFailWith(/clock/);
    // unavailable: recording the outage needs it too.
    h.executor.down = true;
    expect(await h.broker.recover(tid('j1'))).toFailWith(/clock/);
    // and a source that throws.
    h.executor.down = false;
    Object.assign(h.executor, {
      recover: () => {
        throw new Error('crashed');
      }
    });
    expect(await h.broker.recover(tid('j1'))).toFailWith(/clock/);
  });
});

describe('open-time and registry edges', () => {
  test('getCommand fails for a kind that is not registered', async () => {
    const h = await sourceHarness();
    expect(h.registry.getCommand('no.kind' as never, 1, 'pause')).toFailWith(/no command 'pause'/);
    expect(h.registry.getCommand(jobKind, 1, 'pause')).toSucceed();
  });

  test('the writer answers undefined for a source with no record', async () => {
    const h = await sourceHarness();
    expect(await h.repository.withWriter((w) => w.readSource('none'))).toSucceedWith(undefined);
  });

  test('a pending source-replay registration opens with its envelope claim validated against its request', async () => {
    const inner = memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem;
    const root = new FaultyRoot(inner);
    const h = await sourceHarness({
      history: 'source-replay',
      root: root as unknown as FileTree.IFileTreeDirectoryItem
    });
    h.executor.addJob('j1');
    root.faults.push({ name: 'task-j1.json', when: 'before', visibility: 'unchanged' });
    expect(
      await h.broker.registerExternal('host', {
        taskId: tid('j1'),
        operationId: op(),
        kind: jobKind,
        detailVersion: 1,
        title: 'j1',
        scopes: [alpha],
        binding: h.executor.binding('j1'),
        recovery: 'reattach',
        history: {
          history: 'source-replay',
          envelope: { remainingRequiredUpdates: 1, remainingRequiredBytes: 1 }
        }
      })
    ).toFail();
    h.repository.close();
    const reopened = (
      await FileTreeTaskRepository.open({
        root: inner,
        mode: 'session',
        environment: environment('p').env,
        registry: sourceRegistry(h.source)
      })
    ).orThrow();
    expect(reopened.state).toBe('ready');
    expect(reopened.state === 'ready' && reopened.repository.report.pendingRegistrations).toEqual([
      expect.objectContaining({ taskId: 'j1' })
    ]);
  });

  test('a resolved record with a replay envelope and no source revision can still be extended', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    const helpers = await import('../../helpers/storageFixtures');
    const reg = helpers.registration('j1');
    const draft = reg.record as Extract<ITaskRegistrationRequest['record'], { recordType: 'resolved' }>;
    expect(
      await h.repository.withWriter((w) =>
        w.register({
          ...reg,
          record: {
            ...draft,
            task: {
              envelope: {
                ...draft.task.envelope,
                kind: jobKind,
                binding: h.executor.binding('j1'),
                recovery: 'reattach'
              },
              details: { step: 0, ref: 'x' }
            },
            operations: [catalogOp(reg.operationId, 'register-external', reg.request)],
            updates: []
          },
          sourceReplay: {
            sourceId: 'exec',
            envelope: { remainingRequiredUpdates: 1, remainingRequiredBytes: 0 }
          }
        })
      )
    ).toSucceed();
    expect(
      await h.broker.extendReplayEnvelope(tid('j1'), {
        remainingRequiredUpdates: 1,
        remainingRequiredBytes: 0
      })
    ).toSucceedWith({
      remainingRequiredUpdates: 2,
      remainingRequiredBytes: 0
    });
  });
});

describe('optional fields through observations', () => {
  test('first resolution carries the registration’s description, parent and responsibility, and a first progress', async () => {
    const h = await sourceHarness();
    h.executor.addJob('parent');
    await registerJob(h, 'parent');
    const job = h.executor.addJob('j1');
    job.progress = { completed: 1, total: 10 };
    expect(
      await h.broker.registerExternal('host', {
        taskId: tid('j1'),
        operationId: op(),
        kind: jobKind,
        detailVersion: 1,
        title: 'j1',
        description: 'a described job',
        parentId: tid('parent'),
        responsibility: { namespace: 'agent', key: 'ada' },
        scopes: [alpha],
        binding: h.executor.binding('j1'),
        recovery: 'host-resume'
      })
    ).toSucceed();
    expect(await h.broker.observe(tid('j1'))).toSucceed();
    const record = await recordOf(h, 'j1');
    const envelope = record.recordType === 'resolved' ? record.task.envelope : undefined;
    expect(envelope).toEqual(
      expect.objectContaining({
        description: 'a described job',
        parentId: 'parent',
        responsibility: { namespace: 'agent', key: 'ada' },
        progress: { completed: 1, total: 10 },
        recovery: 'host-resume'
      })
    );
    // A newer projection keeps them, and a changed progress owes a progress update.
    h.executor.change('j1', (j) => (j.progress = { completed: 2, total: 10 }));
    expect(await h.broker.observe(tid('j1'))).toSucceed();
    const after = await recordOf(h, 'j1');
    expect(after.recordType === 'resolved' && after.task.envelope).toEqual(
      expect.objectContaining({
        description: 'a described job',
        parentId: 'parent',
        progress: { completed: 2, total: 10 }
      })
    );
    // The same revision observed later, with progress present, is still only a refresh.
    const read = h.executor.read.bind(h.executor);
    Object.assign(h.executor, {
      read: (b: ReturnType<typeof h.executor.binding>) => read(b, '2026-09-24T12:00:00.000Z' as never)
    });
    expect(await h.broker.observe(tid('j1'))).toSucceedAndSatisfy((r) => expect(r.outcome).toBe('refreshed'));
  });

  test('an outage after staleness keeps the last observed time; a health change needs a source revision', async () => {
    const h = await ready();
    h.executor.jobs.delete('j1');
    expect(await h.broker.observe(tid('j1'))).toSucceedAndSatisfy((r) => expect(r.outcome).toBe('missing'));
    h.executor.down = true;
    expect(await h.broker.observe(tid('j1'))).toSucceedAndSatisfy((r) =>
      expect(r.outcome).toBe('source-unavailable')
    );
    const record = await recordOf(h, 'j1');
    expect(record.recordType === 'resolved' && record.task.envelope.observation).toEqual(
      expect.objectContaining({ state: 'unavailable', lastObservedAt: '2026-09-24T10:00:00.000Z' })
    );
  });

  test('health on a record with no source revision, or no last observation, is handled as the record allows', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    const helpers = await import('../../helpers/storageFixtures');
    const reg = helpers.registration('j1');
    const draft = reg.record as Extract<ITaskRegistrationRequest['record'], { recordType: 'resolved' }>;
    expect(
      await h.repository.withWriter((w) =>
        w.register({
          ...reg,
          record: {
            ...draft,
            task: {
              envelope: {
                ...draft.task.envelope,
                kind: jobKind,
                binding: h.executor.binding('j1'),
                recovery: 'reattach',
                observation: {
                  state: 'stale',
                  checkedAt: '2026-09-22T12:00:00.000Z' as never,
                  reason: 'never seen'
                }
              },
              details: { step: 0, ref: 'x' }
            },
            operations: [catalogOp(reg.operationId, 'register-external', reg.request)],
            updates: []
          }
        })
      )
    ).toSucceed();
    Object.assign(h.executor, { down: true });
    // Storage refuses a health observation without the source revision that deduplicates it.
    expect(await h.broker.observe(tid('j1'))).toSucceedAndSatisfy((r) =>
      expect(r.outcome).toBe('contract-violation')
    );
  });

  test('a settled command’s consumed reservation validates at reopen', async () => {
    const h = await ready();
    expect(await execute(h, 'pause', { reason: 'x' })).toSucceed();
    h.repository.close();
    const reopened = (
      await FileTreeTaskRepository.open({
        root: h.root,
        mode: 'session',
        environment: environment('v').env,
        registry: sourceRegistry(h.source)
      })
    ).orThrow();
    expect(reopened.state).toBe('ready');
  });
});

describe('command paths at their failure points', () => {
  async function uncertainCancel(
    options?: Parameters<typeof sourceHarness>[0]
  ): Promise<{ h: ISourceHarness; key: OperationId }> {
    const h = await ready(options);
    h.executor.loseNextResponse = true;
    const key = op();
    expect(await execute(h, 'cancel', { reason: 'x' }, key)).toSucceed();
    return { h, key };
  }

  test('a command on a record with no source revision is dispatched without a precondition', async () => {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    const helpers = await import('../../helpers/storageFixtures');
    const reg = helpers.registration('j1');
    const draft = reg.record as Extract<ITaskRegistrationRequest['record'], { recordType: 'resolved' }>;
    expect(
      await h.repository.withWriter((w) =>
        w.register({
          ...reg,
          record: {
            ...draft,
            task: {
              envelope: {
                ...draft.task.envelope,
                kind: jobKind,
                binding: h.executor.binding('j1'),
                recovery: 'reattach'
              },
              details: { step: 0, ref: 'x' }
            },
            operations: [catalogOp(reg.operationId, 'register-external', reg.request)],
            updates: []
          }
        })
      )
    ).toSucceed();
    Object.assign(h.executor, { acceptOnly: true });
    expect(await execute(h, 'cancel', { reason: 'x' })).toSucceedAndSatisfy((r) =>
      expect(r.result.state).toBe('accepted')
    );
  });

  test('a replaying source’s applied answer on a record with no source revision awaits the feed', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    const helpers = await import('../../helpers/storageFixtures');
    const reg = helpers.registration('j1');
    const draft = reg.record as Extract<ITaskRegistrationRequest['record'], { recordType: 'resolved' }>;
    expect(
      await h.repository.withWriter((w) =>
        w.register({
          ...reg,
          record: {
            ...draft,
            task: {
              envelope: {
                ...draft.task.envelope,
                kind: jobKind,
                binding: h.executor.binding('j1'),
                recovery: 'reattach'
              },
              details: { step: 0, ref: 'x' }
            },
            operations: [catalogOp(reg.operationId, 'register-external', reg.request)],
            updates: []
          }
        })
      )
    ).toSucceed();
    expect(await execute(h, 'pause', { reason: 'x' })).toSucceedAndSatisfy((r) =>
      expect(r.result).toEqual({ state: 'accepted' })
    );
  });

  test('a command on a task under a parent authorizes against its placement', async () => {
    const h = await sourceHarness();
    h.executor.addJob('p');
    await registerJob(h, 'p');
    h.executor.addJob('j1');
    expect(
      await h.broker.registerExternal('host', {
        taskId: tid('j1'),
        operationId: op(),
        kind: jobKind,
        detailVersion: 1,
        title: 'j1',
        parentId: tid('p'),
        scopes: [alpha],
        binding: h.executor.binding('j1'),
        recovery: 'reattach',
        initialObservation: {
          ...h.executor.projection(h.executor.jobs.get('j1')!),
          details: { step: 0, ref: 'x' }
        }
      })
    ).toSucceed();
    expect(await execute(h, 'pause', { reason: 'x' })).toSucceedAndSatisfy((r) =>
      expect(r.result.state).toBe('applied')
    );
  });

  test('a record that vanishes entirely at the marker is reported', async () => {
    const h = await ready();
    const broken = brokerOver(
      h,
      misbehaving(h.repository, {
        readCommit: (n, real) => (n === 2 ? Promise.resolve(succeedWithDetail(undefined) as never) : real())
      })
    );
    expect(await execute(broken, 'pause', { reason: 'x' })).toFailWithDetail(
      /no longer holds command/,
      expect.objectContaining({ code: 'storage-corrupt' })
    );
  });

  test('a marker that cannot be written leaves the intent unsent', async () => {
    const h = await ready();
    let commits = 0;
    const broken = brokerOver(
      h,
      misbehaving(h.repository, {
        commit: (__, real) => (++commits === 2 ? Promise.resolve(fail('disk full') as never) : real())
      })
    );
    const key = op();
    expect(await execute(broken, 'pause', { reason: 'x' }, key)).toFailWith(/disk full/);
    const record = await recordOf(h, 'j1');
    const command = record.operations.find((o) => o.operationId === key);
    expect(command?.type === 'command' && command.dispatch).toBe('not-sent');
  });

  test('an accepted answer that cannot be persisted is commit-indeterminate', async () => {
    const h = await ready();
    h.executor.acceptOnly = true;
    let commits = 0;
    const broken = brokerOver(
      h,
      misbehaving(h.repository, {
        commit: (__, real) => (++commits === 3 ? Promise.resolve(fail('disk full') as never) : real())
      })
    );
    expect(await execute(broken, 'pause', { reason: 'x' })).toFailWithDetail(
      /persisting its outcome failed/,
      expect.objectContaining({ code: 'commit-indeterminate' })
    );
  });

  test('a write whose outcome is unknown passes through as commit-indeterminate', async () => {
    const inner = memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem;
    const root = new FaultyRoot(inner);
    const h = await ready({ root: root as unknown as FileTree.IFileTreeDirectoryItem });
    h.executor.acceptOnly = true;
    // Intent and marker land; the result's write may or may not have.
    root.faults.push({ name: 'task-j1.json', when: 'after', visibility: 'unknown', skip: 2 });
    const key = op();
    expect(await execute(h, 'pause', { reason: 'x' }, key)).toFailWithDetail(
      /may have landed/,
      expect.objectContaining({ code: 'commit-indeterminate', operationId: key })
    );
    // It was the result's write, after the send.
    expect(h.executor.dispatches.get(key)).toBe(1);
  });

  test('an applied answer already reflected by the committed projection settles applied at the current revision', async () => {
    const h = await ready();
    const dispatch = h.executor.dispatch.bind(h.executor);
    Object.assign(h.executor, {
      dispatch: async (...args: Parameters<typeof dispatch>) => {
        const answer = await dispatch(...args);
        return answer.onSuccess((a) =>
          a.state === 'applied'
            ? succeed<ExternalCommandResult<IJobDetails>>({
                ...a,
                observation: {
                  ...h.executor.projection({
                    ...h.executor.jobs.get('j1')!,
                    token: 1,
                    lifecycle: { status: 'running' }
                  }),
                  details: { step: 0, ref: 'exec-a/j1' }
                }
              })
            : succeed<ExternalCommandResult<IJobDetails>>(a)
        );
      }
    });
    expect(await execute(h, 'pause', { reason: 'x' })).toSucceedAndSatisfy((r) =>
      expect(r.result).toEqual({ state: 'applied', appliedRevision: 1 })
    );
  });

  test('a pump whose dispatch of an unsent intent fails reports the failure', async () => {
    const h = await ready();
    let checks = 0;
    Object.assign(h.policy, {
      afterDecision: (request: { action: string }) => {
        if (request.action === 'command' && checks++ === 1) {
          h.policy.epoch = 'epoch-2';
        }
      }
    });
    expect(await execute(h, 'pause', { reason: 'x' })).toFail();
    Object.assign(h.policy, {
      policyEpoch: () => {
        throw new Error('epoch gone');
      }
    });
    expect(await h.writer.resolveCommands({ limit: 10 })).toFailWith(/epoch/);
  });

  test('a pump that cannot record a held command reports the failure', async () => {
    const { h } = await uncertainCancel();
    const broken = brokerOver(
      h,
      misbehaving(h.repository, { readCommit: async () => fail('in-writer read failed') as never })
    );
    expect(await broken.writer.resolveCommands({ limit: 10 })).toFailWith(/in-writer read failed/);
  });
});
