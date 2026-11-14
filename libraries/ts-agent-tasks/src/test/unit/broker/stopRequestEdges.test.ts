/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

// requestStop, releaseStop and inspectStop at their edges: requests that cannot apply, the same key
// raced against itself, a world that moved between authorization and the write, and storage that
// fails or contradicts itself inside the writer.

import '@fgv/ts-utils-jest';
import { failWithDetail, succeed, succeedWithDetail } from '@fgv/ts-utils';
import {
  IResolvedTaskCommitRecord,
  IStopResult,
  ITaskAccessRequest,
  ITaskCommitRecord,
  ITaskFailure,
  TaskId,
  TaskResult
} from '../../../index';
import {
  IBrokerHarness,
  bindWriter,
  brokerHarness,
  command,
  op,
  revisionOf,
  tid
} from '../../helpers/brokerFixtures';
import { registerJob, sourceHarness } from '../../helpers/sourceFixtures';
import { faultyWriter, node, persisted, release, stop } from '../../helpers/stopFixtures';

const storageDown = <T>(): TaskResult<T> =>
  failWithDetail<T, ITaskFailure>('storage down', { code: 'storage-unavailable', retry: 'safe' });

type Read = (id: TaskId) => Promise<TaskResult<ITaskCommitRecord | undefined>>;

/** A writer whose in-writer read of the root answers `answer`. */
function rootReads(
  h: IBrokerHarness,
  answer: (real: Read) => Promise<TaskResult<ITaskCommitRecord | undefined>>
): ReturnType<typeof faultyWriter> {
  return faultyWriter(h, {
    writerPatch: (w) => ({
      readCommit: async (id: TaskId) => (id === 'root' ? answer((i) => w.readCommit(i)) : w.readCommit(id))
    })
  });
}

/** Runs `effect` once, on the first request matching `when`. */
function onFirst(
  h: IBrokerHarness,
  when: (r: ITaskAccessRequest) => boolean,
  effect: () => Promise<void>
): void {
  let done = false;
  h.policy.afterDecision = async (r) => {
    if (!done && when(r)) {
      done = true;
      await effect();
    }
  };
}

async function tree(): Promise<IBrokerHarness> {
  const h = await brokerHarness();
  await node(h.writer, 'root', { stopPolicy: 'cascade-cancel' });
  await node(h.writer, 'c', { parentId: 'root' });
  return h;
}

/** Retitles the root: a semantic revision change. */
async function retitle(h: IBrokerHarness): Promise<void> {
  (
    await h.writer.updateTracked({
      taskId: tid('root'),
      operationId: op(),
      expectedRevision: await revisionOf(h.repository, 'root'),
      patch: { title: 'moved' }
    })
  ).orThrow();
}

const noEpoch = {
  check: async (): Promise<ReturnType<typeof succeed<boolean>>> => succeed(true),
  policyEpoch: (): string => {
    throw new Error('no epoch');
  }
};

describe('requests that cannot apply', () => {
  test('a task that does not exist, or a policy with no epoch, is refused by every request', async () => {
    const h = await tree();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const missing = { taskId: tid('nobody'), intentId: accepted.intentId };
    expect(
      await h.writer.requestStop({
        taskId: tid('nobody'),
        operationId: op(),
        expectedRevision: 1 as never,
        mode: 'pause'
      })
    ).toFailWith(/nobody/);
    expect(
      await h.writer.releaseStop({ ...missing, operationId: op(), expectedRevision: 1 as never })
    ).toFailWith(/nobody/);
    expect(await h.writer.inspectStop(missing)).toFailWith(/nobody/);
    expect(await h.writer.inspectStop({ taskId: tid('root') } as never)).toFailWith(/inspectStop/);
    const broken = bindWriter(h, { authorization: noEpoch });
    expect(await stop(h, broken, 'root', 'cancel')).toFailWith(/policy epoch unavailable/);
    expect(await release(h, broken, accepted)).toFailWith(/policy epoch unavailable/);
  });

  test('an unresolved registration holds no stop, and cannot be released or inspected as one', async () => {
    const h = await sourceHarness();
    h.executor.addJob('job');
    await registerJob(h, 'job', { unresolved: true });
    const request = { taskId: tid('job'), intentId: op() };
    expect(await h.writer.inspectStop(request)).toFailWith(/task job: holds no stop/);
    expect(
      await h.writer.releaseStop({
        ...request,
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 'job')
      })
    ).toFailWith(/task job: holds no stop/);
  });

  test('a task that never had a stop holds none', async () => {
    const h = await tree();
    expect(await h.writer.inspectStop({ taskId: tid('c'), intentId: op() })).toFailWith(
      /task c: holds no stop/
    );
  });

  test('an archived root is immutable', async () => {
    const h = await tree();
    for (const id of ['c', 'root']) {
      await command(h, h.writer, id, 'cancel', { reason: { code: 'done', summary: 'done' } });
    }
    (
      await h.writer.archive({
        taskId: tid('c'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 'c')
      })
    ).orThrow();
    (
      await h.writer.archive({
        taskId: tid('root'),
        operationId: op(),
        expectedRevision: await revisionOf(h.repository, 'root')
      })
    ).orThrow();
    expect(await stop(h, h.writer, 'root', 'cancel')).toFailWith(/archived tombstone is immutable/);
  });

  test('a key replayed with a different request conflicts, and a replay needs the authority again', async () => {
    const h = await tree();
    const key = op();
    const accepted = (await stop(h, h.writer, 'root', 'pause', key)).orThrow();
    expect(await stop(h, h.writer, 'root', 'cancel', key)).toFailWith(
      /already recorded with a different request/
    );
    h.policy.denyOn('stop', 'root');
    expect(await stop(h, h.writer, 'root', 'pause', key)).toFailWith(/stop/);
    expect(accepted.state).toBe('pending');
  });

  test('a replay whose target cannot be read for presentation fails', async () => {
    const h = await tree();
    const key = op();
    (await stop(h, h.writer, 'root', 'pause', key)).orThrow();
    const faulty = faultyWriter(h, {
      patch: (r) => ({ readCommit: async (id: TaskId) => (id === 'c' ? storageDown() : r.readCommit(id)) })
    });
    expect(await stop(h, faulty, 'root', 'pause', key)).toFailWith(/storage down/);
  });

  test('a replay whose root no longer holds the stop it recorded is reported corrupt', async () => {
    const h = await tree();
    const key = op();
    (await stop(h, h.writer, 'root', 'pause', key)).orThrow();
    const faulty = faultyWriter(h, {
      patch: (r) => ({
        readCommit: async (id: TaskId) => {
          const read = await r.readCommit(id);
          return id === 'root'
            ? succeedWithDetail<ITaskCommitRecord | undefined, ITaskFailure>({
                ...(read.orThrow() as IResolvedTaskCommitRecord),
                stops: []
              })
            : read;
        }
      })
    });
    expect(await stop(h, faulty, 'root', 'pause', key)).toFailWith(
      /is recorded, and the stop it names is not/
    );
  });
});

describe.each([
  ['requestStop', 'stop' as const],
  ['releaseStop', 'release-stop' as const]
])('%s inside the writer', (__, action) => {
  async function ready(h: IBrokerHarness): Promise<IStopResult | undefined> {
    return action === 'release-stop' ? (await stop(h, h.writer, 'root', 'pause')).orThrow() : undefined;
  }
  function request(
    h: IBrokerHarness,
    writer: ReturnType<typeof faultyWriter>,
    accepted: IStopResult | undefined,
    key?: ReturnType<typeof op>
  ): Promise<TaskResult<IStopResult>> {
    return accepted === undefined ? stop(h, writer, 'root', 'pause', key) : release(h, writer, accepted, key);
  }

  test('a root that cannot be re-read is reported', async () => {
    const h = await tree();
    const accepted = await ready(h);
    expect(
      await request(
        h,
        rootReads(h, async () => storageDown()),
        accepted
      )
    ).toFailWith(/storage down/);
  });

  test('a root that is gone is refused as changed', async () => {
    const h = await tree();
    const accepted = await ready(h);
    expect(
      await request(
        h,
        rootReads(h, async () => succeedWithDetail<ITaskCommitRecord | undefined, ITaskFailure>(undefined)),
        accepted
      )
    ).toFailWith(/task root changed after the operation was authorized/);
  });

  test('a commit that fails is reported, and nothing is written', async () => {
    const h = await tree();
    const accepted = await ready(h);
    const faulty = faultyWriter(h, { writerPatch: () => ({ commit: async () => storageDown() }) });
    expect(await request(h, faulty, accepted)).toFailWith(/storage down/);
  });

  test('the same key twice at once: one commits, the other replays it', async () => {
    const h = await tree();
    const accepted = await ready(h);
    const key = op();
    const [a, b] = await Promise.all([
      request(h, h.writer, accepted, key),
      request(h, h.writer, accepted, key)
    ]);
    expect(a.orThrow().state).toBe(b.orThrow().state);
    const root = (await h.repository.readCommit(tid('root'))).orThrow() as IResolvedTaskCommitRecord;
    expect(root.operations.filter((o) => o.operationId === key)).toHaveLength(1);
  });

  test('a root whose revision moved after authorization is refused as changed', async () => {
    const h = await tree();
    const accepted = await ready(h);
    onFirst(
      h,
      (r) => r.action === action && r.role === 'subject',
      () => retitle(h)
    );
    expect(await request(h, h.writer, accepted)).toFailWith(
      /task root changed after the operation was authorized/
    );
  });

  test('a policy that moved after authorization is refused as changed', async () => {
    const h = await tree();
    const accepted = await ready(h);
    onFirst(
      h,
      (r) => r.action === action && r.role === 'subject',
      async () => {
        h.policy.epoch = 'epoch-2';
      }
    );
    expect(await request(h, h.writer, accepted)).toFailWith(
      /the authorization policy changed after the operation was authorized/
    );
  });
});

describe('releaseStop raced', () => {
  test('two releases under different keys: one releases, the other finds it released', async () => {
    const h = await tree();
    const accepted = (await stop(h, h.writer, 'root', 'pause')).orThrow();
    const [a, b] = await Promise.all([release(h, h.writer, accepted), release(h, h.writer, accepted)]);
    const outcomes = [a, b].map((r) => (r.isSuccess() ? r.value.state : r.message));
    expect(outcomes).toEqual(
      expect.arrayContaining(['released', expect.stringMatching(/is already released/)])
    );
    expect((await persisted(h, accepted)).state).toBe('released');
  });
});
