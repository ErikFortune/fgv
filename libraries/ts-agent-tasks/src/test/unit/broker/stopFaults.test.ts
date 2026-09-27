/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

// A stop over a repository or source that misbehaves: storage faults are reported, never absorbed; a
// repository whose answers contradict themselves is not trusted; and a source that fails, lags or
// refuses leaves each target in the state its evidence supports and no further.

import '@fgv/ts-utils-jest';
import { Logging, failWithDetail, succeed, succeedWithDetail } from '@fgv/ts-utils';
import {
  FileTreeTaskRepository,
  IResolvedTaskCommitRecord,
  ITaskCommitRecord,
  ITaskFailure,
  IStoredTaskOperation,
  OperationId,
  TaskEnvironment,
  TaskId,
  TaskResult
} from '../../../index';
import {
  alpha,
  bindWriter,
  op,
  revisionOf,
  brokerHarness,
  brokerRegistry,
  command,
  harnessOver,
  tid
} from '../../helpers/brokerFixtures';
import { ISourceHarness, recordOf, registerJob, sourceHarness } from '../../helpers/sourceFixtures';
import { environment, memoryRoot } from '../../helpers/storageFixtures';
import {
  CapabilityScript,
  faultyWriter,
  node,
  persisted,
  pump,
  stableCapabilities,
  states,
  statusOf,
  stop
} from '../../helpers/stopFixtures';

const storageDown = <T>(): TaskResult<T> =>
  failWithDetail<T, ITaskFailure>('storage down', { code: 'storage-unavailable', retry: 'safe' });

/** A repository answer. */
const found = <T>(value: T): TaskResult<T> => succeedWithDetail<T, ITaskFailure>(value);

type Read = (id: TaskId) => Promise<TaskResult<ITaskCommitRecord | undefined>>;

/** A read that answers `answer` for one task id and delegates everything else. */
function readOf(
  real: Read,
  id: string,
  answer: (read: Read) => Promise<TaskResult<ITaskCommitRecord | undefined>>
): Read {
  return async (taskId) => (taskId === id ? answer(real) : real(taskId));
}

/** `record` with its lifecycle replaced. */
function running(record: ITaskCommitRecord): ITaskCommitRecord {
  const r = record as IResolvedTaskCommitRecord;
  return { ...r, task: { ...r.task, envelope: { ...r.task.envelope, lifecycle: { status: 'running' } } } };
}

/** An operation holding `key` in `record`: not a command, an unmarked command, or another stop's. */
function held(
  record: IResolvedTaskCommitRecord,
  key: OperationId,
  holder: string,
  intentId: OperationId
): IStoredTaskOperation {
  if (holder === 'catalog') {
    return { ...record.operations[0], operationId: key };
  }
  const request = {
    taskId: record.task.envelope.id,
    operationId: key,
    expectedRevision: record.task.envelope.revision,
    command: 'pause',
    parameters: { reason: 'x' }
  };
  return {
    type: 'command',
    operationId: key,
    request,
    principalKey: 'alice',
    dispatch: 'settled',
    receipt: { taskId: request.taskId, operationId: key, command: 'pause', result: { state: 'accepted' } },
    ...(holder === 'foreign' ? { stop: { rootId: tid('root'), intentId: 'another' as OperationId } } : {}),
    // The same intent id under another root is another stop: intent ids are scoped to their root.
    ...(holder === 'elsewhere' ? { stop: { rootId: tid('elsewhere'), intentId } } : {})
  };
}

async function nativeTree(): Promise<Awaited<ReturnType<typeof brokerHarness>>> {
  const h = await brokerHarness();
  await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
  await node(h.writer, 'c', { parentId: 'root' });
  return h;
}

async function withJobs(
  ids: ReadonlyArray<string> = ['job'],
  declared: CapabilityScript = new CapabilityScript()
): Promise<ISourceHarness> {
  const h = await sourceHarness({ capabilities: declared.ask, lookup: true });
  await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
  for (const id of ids) {
    h.executor.addJob(id);
    await registerJob(h, id, { parentId: tid('root') });
  }
  return h;
}

/** Pauses the native root by its own command, so a pause stop spends nothing on it. */
async function prePause(h: ISourceHarness): Promise<void> {
  await command(h, h.writer, 'root', 'pause', { reason: { code: 'manual', summary: 'held' } });
}

describe('storage faults a pump meets are reported, not absorbed', () => {
  test('a target that cannot be read ends the pass with the failure', async () => {
    const h = await nativeTree();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const faulty = faultyWriter(h, {
      patch: (r) => ({
        readCommit: readOf(
          (id) => r.readCommit(id),
          'c',
          async () => storageDown()
        )
      })
    });
    expect(await pump(faulty, accepted)).toFailWith(/storage down/);
  });

  test.each([
    ['the root', 'root'],
    ['the target', 'c']
  ])('%s cannot be re-read inside the writer', async (__, id) => {
    const h = await nativeTree();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const faulty = faultyWriter(h, {
      writerPatch: (w) => ({
        readCommit: readOf(
          (i) => w.readCommit(i),
          id,
          async () => storageDown()
        )
      })
    });
    expect(await pump(faulty, accepted)).toFailWith(/storage down/);
    expect(await statusOf(h, 'c')).toBe('pending');
  });

  test('a commit that fails is reported, and nothing is recorded as confirmed', async () => {
    const h = await nativeTree();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const faulty = faultyWriter(h, { writerPatch: () => ({ commit: async () => storageDown() }) });
    expect(await pump(faulty, accepted)).toFailWith(/storage down/);
    expect((await persisted(h, accepted)).state).toBe('pending');
  });

  test('an external intent whose commit fails is reported, and nothing is sent', async () => {
    const h = await withJobs();
    await prePause(h);
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const faulty = faultyWriter(h, { writerPatch: () => ({ commit: async () => storageDown() }) });
    expect(await pump(faulty, accepted)).toFailWith(/storage down/);
    expect(h.executor.dispatches.size).toBe(0);
  });

  test('a supersession that cannot read its root is reported', async () => {
    const h = await withJobs();
    h.executor.change('job', (j) => {
      j.step = 3;
    });
    const accepted = (await stop(h, h.writer, 'root', 'cancel')).orThrow();
    expect(states((await pump(h.writer, accepted)).orThrow()).job).toBe('refused');
    let reads = 0;
    const faulty = faultyWriter(h, {
      writerPatch: (w) => ({
        // The observation re-reads the job; the supersession then reads the root.
        readCommit: readOf(
          (i) => w.readCommit(i),
          'root',
          async (real) => (++reads === 1 ? storageDown() : real(tid('root')))
        )
      })
    });
    expect(await pump(faulty, accepted)).toFailWith(/storage down/);
    expect((await persisted(h, accepted)).targets[1].attempt).toBe(1);
  });

  test('an id factory that fails refuses a stop before anything is written, and a supersession after', async () => {
    const h = await withJobs();
    h.executor.change('job', (j) => {
      j.step = 3;
    });
    const broken: TaskEnvironment = TaskEnvironment.create({
      logger: new Logging.InMemoryLogger('detail'),
      clock: () => Date.parse('2026-09-22T12:00:00.000Z'),
      newId: () => failWithDetail('the id factory is down', undefined)
    }).orThrow();
    const faulty = faultyWriter(h, { environment: broken });
    expect(await stop(h, faulty, 'root', 'cancel')).toFailWith(/operation id: the id factory is down/);
    expect(
      ((await h.repository.readCommit(tid('root'))).orThrow() as IResolvedTaskCommitRecord).stops
    ).toBeUndefined();
    const accepted = (await stop(h, h.writer, 'root', 'cancel')).orThrow();
    expect(states((await pump(h.writer, accepted)).orThrow()).job).toBe('refused');
    expect(await pump(faulty, accepted)).toFailWith(/operation id: the id factory is down/);
    expect((await persisted(h, accepted)).targets[1].attempt).toBe(1);
  });
});

describe('storage faults around the pass', () => {
  test("an external target's intent cannot re-read its root inside the writer", async () => {
    const h = await withJobs();
    await prePause(h);
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const faulty = faultyWriter(h, {
      writerPatch: (w) => ({
        readCommit: readOf(
          (i) => w.readCommit(i),
          'root',
          async () => storageDown()
        )
      })
    });
    expect(await pump(faulty, accepted)).toFailWith(/storage down/);
    expect(h.executor.dispatches.size).toBe(0);
  });

  test('the summary cannot re-read its root', async () => {
    const h = await brokerHarness();
    await node(h.writer, 'root', { stopPolicy: 'cascade-pause' });
    await command(h, h.writer, 'root', 'pause', { reason: { code: 'manual', summary: 'held' } });
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    // Nothing to write for the root itself: the first read inside the writer is the summary's.
    const faulty = faultyWriter(h, {
      writerPatch: (w) => ({
        readCommit: readOf(
          (i) => w.readCommit(i),
          'root',
          async () => storageDown()
        )
      })
    });
    expect(await pump(faulty, accepted)).toFailWith(/storage down/);
    expect((await persisted(h, accepted)).state).toBe('pending');
  });

  test('a failure without detail is passed on as it is, by the pump and at acceptance', async () => {
    const h = await nativeTree();
    const bare = <T>(): TaskResult<T> => failWithDetail<T, ITaskFailure>('bare failure', undefined);
    const faulty = faultyWriter(h, { writerPatch: () => ({ commit: async () => bare() }) });
    expect(await stop(h, faulty, 'root', 'pause')).toFailWith(/^bare failure$/);
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect(await pump(faulty, accepted)).toFailWith(/^bare failure$/);
  });

  test('a pump on a task that does not exist, or under a policy with no epoch, is refused', async () => {
    const h = await nativeTree();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect(await h.writer.reconcileStop({ taskId: tid('nobody'), intentId: accepted.intentId })).toFailWith(
      /nobody/
    );
    const broken = bindWriter(h, {
      authorization: {
        check: async () => succeed(true),
        policyEpoch: () => {
          throw new Error('no epoch');
        }
      }
    });
    expect(await pump(broken, accepted)).toFailWith(/policy epoch unavailable/);
  });
});

describe('a repository that contradicts itself is not trusted', () => {
  test('a target that reads as gone is unavailable, never confirmed', async () => {
    const h = await nativeTree();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const faulty = faultyWriter(h, {
      patch: (r) => ({
        readCommit: readOf(
          (i) => r.readCommit(i),
          'c',
          async () => found(undefined)
        )
      })
    });
    expect((await pump(faulty, accepted)).orThrow().state).toBe('blocked');
    expect((await persisted(h, accepted)).targets[1].state).toBe('unavailable');
  });

  test('a target that is gone inside the writer is not written, and the pass is incomplete', async () => {
    const h = await nativeTree();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const faulty = faultyWriter(h, {
      writerPatch: (w) => ({
        readCommit: readOf(
          (i) => w.readCommit(i),
          'c',
          async () => found(undefined)
        )
      })
    });
    expect((await pump(faulty, accepted)).orThrow().state).toBe('pending');
    expect(await statusOf(h, 'c')).toBe('pending');
  });

  test.each([['is gone'], ['no longer holds the stop']])(
    'a root that %s inside the writer: nothing is written, and the stop is reported corrupt',
    async (name) => {
      const h = await nativeTree();
      const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
      const faulty = faultyWriter(h, {
        writerPatch: (w) => ({
          readCommit: readOf(
            (i) => w.readCommit(i),
            'root',
            async (real) => {
              if (name === 'is gone') {
                return found(undefined);
              }
              const r = (await real(tid('root'))).orThrow() as IResolvedTaskCommitRecord;
              return found({ ...r, stops: undefined });
            }
          )
        })
      });
      expect(await pump(faulty, accepted)).toFailWith(/task root: its stop .* is gone/);
      expect(await statusOf(h, 'c')).toBe('pending');
    }
  );

  test('a native command that lands without stopping its target is refused, never confirmed', async () => {
    const h = await nativeTree();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const faulty = faultyWriter(h, {
      writerPatch: (w) => ({
        readCommit: readOf(
          (i) => w.readCommit(i),
          'c',
          async (real) => {
            const r = (await real(tid('c'))).orThrow()!;
            // After the landing: the record reads as running.
            return found(r.operations.some((o) => o.type === 'command') ? running(r) : r);
          }
        )
      })
    });
    const result = (await pump(faulty, accepted)).orThrow();
    expect(states(result).c).toBe('refused');
    expect(result.state).toBe('blocked');
  });

  test.each([
    ['an operation that is not a command', 'catalog'],
    ['a command without a stop marker', 'unmarked'],
    ["another stop's command", 'foreign'],
    ['a command of the same intent id under another root', 'elsewhere']
  ])('an attempt key held by %s gets a new attempt', async (__, holder) => {
    const h = await withJobs();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const key = (await persisted(h, accepted)).targets[1].operationId;
    const faulty = faultyWriter(h, {
      patch: (r) => ({
        readCommit: readOf(
          (i) => r.readCommit(i),
          'job',
          async (real) => {
            const j = (await real(tid('job'))).orThrow() as IResolvedTaskCommitRecord;
            return found({ ...j, operations: [...j.operations, held(j, key, holder, accepted.intentId)] });
          }
        )
      })
    });
    expect(states((await pump(faulty, accepted)).orThrow()).job).toBe('pending');
    expect((await persisted(h, accepted)).targets[1].attempt).toBe(2);
    expect(h.executor.dispatches.size).toBe(0);
  });

  test("an intent's key held inside the writer by something that is not a command is not overwritten", async () => {
    const h = await withJobs();
    await prePause(h);
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const key = (await persisted(h, accepted)).targets[1].operationId;
    const faulty = faultyWriter(h, {
      writerPatch: (w) => ({
        readCommit: readOf(
          (i) => w.readCommit(i),
          'job',
          async (real) => {
            const j = (await real(tid('job'))).orThrow() as IResolvedTaskCommitRecord;
            return found({ ...j, operations: [...j.operations, { ...j.operations[0], operationId: key }] });
          }
        )
      })
    });
    expect((await pump(faulty, accepted)).orThrow().state).toBe('pending');
    expect(h.executor.dispatches.size).toBe(0);
  });

  test.each([
    ['cannot be read', 'fail'],
    ['is gone', 'gone'],
    ['has lost the command', 'lost']
  ])('a target that %s after its command was sent is reported as the evidence allows', async (__, how) => {
    const h = await withJobs();
    await prePause(h);
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const key = (await persisted(h, accepted)).targets[1].operationId;
    let reads = 0;
    const faulty = faultyWriter(h, {
      patch: (r) => ({
        readCommit: readOf(
          (i) => r.readCommit(i),
          'job',
          async (real) => {
            const read = await real(tid('job'));
            if (++reads === 1) {
              return read;
            }
            const j = read.orThrow() as IResolvedTaskCommitRecord;
            return how === 'fail'
              ? storageDown()
              : how === 'gone'
              ? found(undefined)
              : found({ ...running(j), operations: j.operations.filter((o) => o.operationId !== key) });
          }
        )
      })
    });
    const result = await pump(faulty, accepted);
    if (how === 'fail') {
      expect(result).toFailWith(/storage down/);
    } else {
      expect(result).toSucceed();
      expect((await persisted(h, accepted)).targets[1].state).toBe(
        how === 'gone' ? 'unavailable' : 'pending'
      );
    }
    // Whatever was reported, the executor applied the pause exactly once.
    expect(h.executor.dispatches.get(key)).toBe(1);
  });

  test('a confirmed target that reads as gone is presented as a violation-free degradation', async () => {
    const h = await nativeTree();
    const accepted = (await pump(h.writer, (await stop(h, h.writer, 'root', 'pause')).orThrow())).orThrow();
    expect(accepted.state).toBe('satisfied');
    const faulty = faultyWriter(h, {
      patch: (r) => ({
        readCommit: readOf(
          (i) => r.readCommit(i),
          'c',
          async () => found(undefined)
        )
      })
    });
    const seen = (await faulty.inspectStop({ taskId: tid('root'), intentId: accepted.intentId })).orThrow();
    expect(seen.state).toBe('blocked');
    expect(seen.restrictedWorkRemains).toBe(true);
    expect(seen.targets.map((t) => t.taskId)).toEqual(['root']);
  });

  test('a target that cannot be read for presentation fails the result', async () => {
    const h = await nativeTree();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const faulty = faultyWriter(h, {
      patch: (r) => ({
        readCommit: readOf(
          (i) => r.readCommit(i),
          'c',
          async () => storageDown()
        )
      })
    });
    expect(await faulty.inspectStop({ taskId: tid('root'), intentId: accepted.intentId })).toFailWith(
      /storage down/
    );
  });

  test('a tree whose membership moved outside the broker blocks the stop, and says so', async () => {
    const h = await nativeTree();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const faulty = faultyWriter(h, {
      patch: (r) => ({
        subtree: (rootId: TaskId, limit: number) =>
          r.subtree(rootId, limit).onSuccess((ids) => found([...ids, tid('stray')]))
      })
    });
    expect((await pump(faulty, accepted)).orThrow().state).toBe('blocked');
    expect(h.logger.logged.some((m) => /the tree is no longer the one captured/.test(m))).toBe(true);
  });
});

describe('a source that fails, lags or refuses', () => {
  test('an accepted command whose state cannot be observed stays pending', async () => {
    const h = await withJobs();
    h.executor.acceptOnly = true;
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect(states((await pump(h.writer, accepted)).orThrow()).job).toBe('pending');
    h.executor.settleAccepted();
    // The visit reads the job; the observation cannot.
    let reads = 0;
    const faulty = faultyWriter(h, {
      patch: (r) => ({
        readCommit: readOf(
          (i) => r.readCommit(i),
          'job',
          async (real) => (++reads === 2 ? storageDown() : real(tid('job')))
        )
      })
    });
    expect(states((await pump(faulty, accepted)).orThrow()).job).toBe('pending');
    expect((await persisted(h, accepted)).targets[1].state).toBe('pending');
  });

  test('a target registered but never observed is unavailable: no lifecycle is known', async () => {
    const h = await sourceHarness({ capabilities: new CapabilityScript().ask });
    await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
    h.executor.addJob('job');
    await registerJob(h, 'job', { parentId: tid('root'), unresolved: true });
    const result = (await pump(h.writer, (await stop(h, h.writer, 'root', 'pause')).orThrow())).orThrow();
    expect((await persisted(h, result)).targets[1].state).toBe('unavailable');
    expect(result.state).toBe('blocked');
  });

  test('a refusal a retry cannot change is refused, and not re-attempted', async () => {
    const h = await withJobs();
    // The executor finished the job; the broker has not observed it.
    h.executor.change(
      'job',
      (j) => {
        j.lifecycle = { status: 'failed', reason: { code: 'boom', summary: 'failed' } };
      },
      false
    );
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect(states((await pump(h.writer, accepted)).orThrow()).job).toBe('refused');
    expect(states((await pump(h.writer, accepted)).orThrow()).job).toBe('refused');
    expect((await persisted(h, accepted)).targets[1].attempt).toBe(1);
  });

  test('a designated command that applies without stopping is re-attempted', async () => {
    const declared = new CapabilityScript();
    declared.declaration = {
      ...stableCapabilities(),
      pauseCommand: { command: 'advance', parameters: { steps: 1 } }
    };
    const h = await withJobs(['job'], declared);
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect(states((await pump(h.writer, accepted)).orThrow()).job).toBe('pending');
    const again = (await pump(h.writer, accepted)).orThrow();
    expect(states(again).job).toBe('pending');
    expect((await persisted(h, again)).targets[1].attempt).toBe(2);
  });

  test('an abandoned stop command is indeterminate, and its key is kept', async () => {
    const h = await withJobs();
    h.executor.loseNextResponse = true;
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    (await pump(h.writer, accepted)).orThrow();
    const key = (await persisted(h, accepted)).targets[1].operationId;
    (
      await h.broker.abandonCommand(
        { principal: 'alice', scopes: [alpha], authorization: h.policy },
        { taskId: 'job', operationId: key, reason: 'host gave up' }
      )
    ).orThrow();
    const result = (await pump(h.writer, accepted)).orThrow();
    expect(states(result).job).toBe('indeterminate');
    expect((await persisted(h, accepted)).targets[1].operationId).toBe(key);
  });
});

describe('the effect budget is spent one unit at a time, and never overspent', () => {
  test('a native effect spends the budget before a source declaration can be asked', async () => {
    const h = await withJobs();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const result = (await pump(h.writer, accepted, 1)).orThrow();
    expect(states(result)).toEqual({ root: 'confirmed', job: 'unexamined' });
  });

  test('asking the declaration spends the budget before the command can be sent', async () => {
    const h = await withJobs();
    await prePause(h);
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect(states((await pump(h.writer, accepted, 1)).orThrow()).job).toBe('unexamined');
    expect(h.executor.dispatches.size).toBe(0);
  });

  test('an uncertain command whose declaration took the budget waits for the next pass', async () => {
    const h = await withJobs();
    await prePause(h);
    h.executor.loseNextResponse = true;
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect(states((await pump(h.writer, accepted)).orThrow()).job).toBe('indeterminate');
    const key = (await persisted(h, accepted)).targets[1].operationId;
    expect(states((await pump(h.writer, accepted, 1)).orThrow()).job).toBe('indeterminate');
    expect((await recordOf(h, 'job')).operations.find((o) => o.operationId === key)).toMatchObject({
      dispatch: 'possibly-sent'
    });
    expect(states((await pump(h.writer, accepted)).orThrow()).job).toBe('confirmed');
  });

  test('an accepted command whose declaration took the budget is not observed this pass', async () => {
    const h = await withJobs();
    await prePause(h);
    h.executor.acceptOnly = true;
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    (await pump(h.writer, accepted)).orThrow();
    h.executor.settleAccepted();
    expect(states((await pump(h.writer, accepted, 1)).orThrow()).job).toBe('pending');
    expect(states((await pump(h.writer, accepted)).orThrow()).job).toBe('confirmed');
  });

  test('a conflicting attempt is observed and superseded only as the budget allows', async () => {
    const h = await withJobs();
    h.executor.change('job', (j) => {
      j.step = 3;
    });
    const accepted = (await stop(h, h.writer, 'root', 'cancel')).orThrow();
    expect(states((await pump(h.writer, accepted)).orThrow()).job).toBe('refused');
    // One unit — the declaration: nothing is observed. Two — and the observation: no supersession.
    for (const limit of [1, 2]) {
      expect(states((await pump(h.writer, accepted, limit)).orThrow()).job).toBe('refused');
      expect((await persisted(h, accepted)).targets[1].attempt).toBe(1);
    }
    expect(states((await pump(h.writer, accepted)).orThrow()).job).toBe('pending');
    expect((await persisted(h, accepted)).targets[1].attempt).toBe(2);
  });
});

describe('a target this host no longer registers', () => {
  test('is unavailable to the pump: its source is not attached for the kind, so the stop blocks', async () => {
    const inner = memoryRoot();
    const h = await withJobsAt(inner);
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    expect((await pump(h.writer, accepted)).orThrow().state).toBe('satisfied');
    h.repository.close();
    // Reopened by a host that registers only the native kinds: the job is quarantined.
    const { env } = environment('q');
    const opened = (
      await FileTreeTaskRepository.open({
        root: inner,
        mode: 'session',
        environment: env,
        registry: brokerRegistry()
      })
    ).orThrow();
    const r = harnessOver(opened.state === 'ready' ? opened.repository : (undefined as never), env, inner);
    // Its record still says paused, which is the durable truth; the evidence is not revalidated.
    const seen = (await r.writer.inspectStop({ taskId: tid('root'), intentId: accepted.intentId })).orThrow();
    expect(seen.state).toBe('pending');
    const pumped = (await pump(r.writer, accepted)).orThrow();
    expect(pumped.state).toBe('blocked');
    expect((await persisted(r, accepted)).targets[1].state).toBe('unavailable');
  });
});

async function withJobsAt(root: ReturnType<typeof memoryRoot>): Promise<ISourceHarness> {
  const h = await sourceHarness({ capabilities: new CapabilityScript().ask, root });
  await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
  h.executor.addJob('job');
  await registerJob(h, 'job', { parentId: tid('root') });
  return h;
}

describe('an archive settles a cancel only from its targets as they are now', () => {
  async function satisfiedCancel(): Promise<Awaited<ReturnType<typeof nativeTree>>> {
    const h = await nativeTree();
    const done = (await pump(h.writer, (await stop(h, h.writer, 'root', 'cancel')).orThrow())).orThrow();
    expect(done.state).toBe('satisfied');
    return h;
  }
  const archiveRoot = async (
    h: Awaited<ReturnType<typeof nativeTree>>,
    writer: ReturnType<typeof faultyWriter>
  ): Promise<TaskResult<unknown>> =>
    writer.archive({
      taskId: tid('root'),
      operationId: op(),
      expectedRevision: await revisionOf(h.repository, 'root')
    });

  test('a target that cannot be read refuses the archive with the failure', async () => {
    const h = await satisfiedCancel();
    const faulty = faultyWriter(h, {
      writerPatch: (w) => ({
        readCommit: readOf(
          (i) => w.readCommit(i),
          'c',
          async () => storageDown()
        )
      })
    });
    expect(await archiveRoot(h, faulty)).toFailWith(/storage down/);
  });

  test('a target that is not terminal now refuses the archive, whatever the summary says', async () => {
    const h = await satisfiedCancel();
    const faulty = faultyWriter(h, {
      writerPatch: (w) => ({
        readCommit: readOf(
          (i) => w.readCommit(i),
          'c',
          async (real) => found(running((await real(tid('c'))).orThrow()!))
        )
      })
    });
    expect(await archiveRoot(h, faulty)).toFailWith(/has a target that is not terminal; it cannot settle/);
  });
});
