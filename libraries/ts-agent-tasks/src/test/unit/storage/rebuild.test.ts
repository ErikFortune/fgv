/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { FileTree } from '@fgv/ts-json-base';
import { fail } from '@fgv/ts-utils';
import {
  FileTreeTaskRepository,
  ITaskCommitRecord,
  ITaskRepository,
  ITaskRepositoryHealth,
  OperationId,
  SubscriptionId,
  TaskId,
  TaskResult,
  TaskRevision
} from '../../../index';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { inspectRepository } from '../../../packlets/storage/internals';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { TaskIndex } from '../../../packlets/storage/taskIndex';
import { FaultyRoot } from '../../helpers/faultyRoot';
import {
  addTask,
  change,
  finishAndArchive,
  ids,
  scope,
  shapedRegistration,
  succeeded
} from '../../helpers/queryFixtures';
import { catalogOp, memoryRoot, nextDraft, params } from '../../helpers/storageFixtures';

const A = scope('alpha');

async function faultyRepository(): Promise<{ root: FaultyRoot; repository: ITaskRepository }> {
  const root = new FaultyRoot(memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem);
  const repository = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
  return { root, repository };
}

async function openTasks(repository: ITaskRepository): Promise<string[]> {
  return ids((await repository.query({ selection: { scopes: [A], lifecycleClass: 'all' } })).orThrow().items);
}

/** Writes a file behind the repository's back, through the real store. */
function outOfBand(root: FaultyRoot, name: string, text: string): void {
  root.inner.writeChildAtomically(name, text, { guarantee: 'session' }).orThrow();
}

describe('rebuildIndexes', () => {
  test('rebuilds in staged passes: every task once, then only the records that owe updates', async () => {
    const { repository } = await faultyRepository();
    await addTask(repository, 'a', { scopes: [A] });
    await addTask(repository, 'b', { scopes: [A], audience: ['s1'] });
    await addTask(repository, 'c', { scopes: [A], parentId: 'a', audience: ['s1', 's2'] });
    await finishAndArchive(repository, 'a');
    const generation: number = repository.health().generation;
    const before: string[] = await openTasks(repository);
    const owedBefore = (await repository.listOwed({ subscription: 's1' as SubscriptionId })).orThrow()
      .updates;

    const health: ITaskRepositoryHealth = (await repository.rebuildIndexes()).orThrow();
    expect(health.state).toBe('ready');
    expect(health.generation).toBeGreaterThan(generation);
    const inspection = inspectRepository(repository)!;
    expect(inspection.evidence).toEqual({
      taskPassReads: 3,
      consumerPassReads: 0,
      sourcePassReads: 0,
      selectedPassReads: 2,
      graphMarks: 3,
      owedDescriptors: 3
    });
    // One parsed record in flight, ever.
    expect(inspection.gate.highWater).toBe(1);
    expect(await openTasks(repository)).toEqual(before);
    expect((await repository.listOwed({ subscription: 's1' as SubscriptionId })).orThrow().updates).toEqual(
      owedBefore
    );
    expect(inspection.index!.categoryOf('a' as TaskId)).toBe('archived');
    // Writes work against the rebuilt generation.
    await change(repository, 'b', { lifecycle: succeeded });
    expect(
      ids(
        (await repository.query({ selection: { scopes: [A], lifecycleClass: 'terminal' } })).orThrow().items
      )
    ).toEqual(['b']);
  });

  test('releases the old generation first: during the scan there is no index and nothing answers', async () => {
    const { root, repository } = await faultyRepository();
    await addTask(repository, 'a', { scopes: [A] });
    const cursorSource = await addTask(repository, 'b', { scopes: [A] });
    expect(cursorSource).toBeDefined();
    const cursor = (
      await repository.query({ selection: { scopes: [A], lifecycleClass: 'all' }, limit: 1 })
    ).orThrow().nextCursor!;
    expect(inspectRepository(repository)!.cursorHandles).toBe(1);

    const seen: Array<{
      state: string;
      index: TaskIndex | undefined;
      handles: number;
      calls: Array<Promise<TaskResult<unknown>>>;
    }> = [];
    root.onRead = (name) => {
      if (name === 'task-a.json' && seen.length === 0) {
        const inspection = inspectRepository(repository)!;
        seen.push({
          state: repository.health().state,
          index: inspection.index,
          handles: inspection.cursorHandles,
          // Each call is evaluated synchronously, here, mid-scan; awaited afterwards.
          calls: [
            repository.query({ selection: { scopes: [A], lifecycleClass: 'all' } }),
            repository.rebuildIndexes(),
            repository.withWriter(async () => fail('unreached') as never)
          ]
        });
      }
    };
    // The hook sees list-time wrapping: rebuild re-lists the root.
    expect(await repository.rebuildIndexes()).toSucceed();
    root.onRead = undefined;
    expect(seen).toHaveLength(1);
    expect(seen[0].state).toBe('rebuilding');
    expect(seen[0].index).toBeUndefined();
    expect(seen[0].handles).toBe(0);
    const [query, nested, writer] = await Promise.all(seen[0].calls);
    expect(query).toFailWithDetail(
      /being rebuilt/i,
      expect.objectContaining({ code: 'storage-unavailable', retry: 'safe' })
    );
    expect(nested).toFailWithDetail(/another rebuild/i, expect.objectContaining({ code: 'conflict' }));
    expect(writer).toFailWithDetail(
      /being rebuilt/i,
      expect.objectContaining({ code: 'storage-unavailable' })
    );
    // The old generation's cursor went with it.
    expect(
      await repository.query({ selection: { scopes: [A], lifecycleClass: 'all' }, limit: 1, cursor })
    ).toFailWithDetail(/unknown/i, expect.objectContaining({ code: 'cursor-stale' }));
  });

  test('is refused under an active writer, and after close', async () => {
    const { repository } = await faultyRepository();
    let inside: TaskResult<ITaskRepositoryHealth> | undefined;
    (
      await repository.withWriter(async () => {
        inside = await repository.rebuildIndexes();
        return fail('done') as never;
      })
    ).isFailure();
    expect(inside).toFailWithDetail(/writer/i, expect.objectContaining({ code: 'conflict', retry: 'safe' }));
    repository.close().orThrow();
    expect(await repository.rebuildIndexes()).toFailWithDetail(
      /closed/i,
      expect.objectContaining({ code: 'storage-unavailable' })
    );
  });

  test('never falls back to a healthy empty index: records that no longer validate leave it unavailable', async () => {
    const { root, repository } = await faultyRepository();
    await addTask(repository, 'a', { scopes: [A] });
    outOfBand(root, 'task-a.json', '{"not":"a record"}');
    expect(await repository.rebuildIndexes()).toFailWithDetail(
      /do not validate/i,
      expect.objectContaining({ code: 'storage-corrupt' })
    );
    const health = repository.health();
    expect(health.state).toBe('unavailable');
    expect(health.issues.join()).toMatch(/task-a\.json/);
    expect(await repository.query({ selection: { scopes: [A], lifecycleClass: 'all' } })).toFailWithDetail(
      /fenced/i,
      expect.objectContaining({ code: 'storage-unavailable' })
    );
    expect(repository.report.issues.some((i) => i.severity === 'blocking')).toBe(true);
    expect(inspectRepository(repository)!.index).toBeUndefined();
  });

  test('a root that cannot be listed leaves it unavailable', async () => {
    const { root, repository } = await faultyRepository();
    root.failChildren = true;
    expect(await repository.rebuildIndexes()).toFailWithDetail(
      /cannot list/i,
      expect.objectContaining({ code: 'storage-unavailable' })
    );
    expect(repository.health().state).toBe('unavailable');
    root.failChildren = false;
    expect(await repository.rebuildIndexes()).toSucceed();
  });

  test('a record that changes between the task pass and the owed-update pass blocks', async () => {
    const { root, repository } = await faultyRepository();
    const created = await addTask(repository, 'b', { scopes: [A], audience: ['s1'] });
    let reads = 0;
    root.onRead = (name) => {
      if (name === 'task-b.json' && ++reads === 2) {
        // A valid record, just not the one the task pass projected.
        outOfBand(
          root,
          'task-b.json',
          JSON.stringify({ ...created, recordRevision: 1, extra: undefined }) + ' '
        );
      }
    };
    expect(await repository.rebuildIndexes()).toFailWithDetail(
      /changed between the task pass and the owed-update pass/i,
      expect.objectContaining({ code: 'storage-corrupt' })
    );
    root.onRead = undefined;
  });

  test('a record that disappears before the owed-update pass blocks', async () => {
    const { root, repository } = await faultyRepository();
    await addTask(repository, 'b', { scopes: [A], audience: ['s1'] });
    let reads = 0;
    root.onRead = (name) => {
      if (name === 'task-b.json' && ++reads === 2) {
        root.inner.deleteChild('task-b.json').orThrow();
      }
    };
    expect(await repository.rebuildIndexes()).toFailWithDetail(
      /task-b\.json/i,
      expect.objectContaining({ code: 'storage-corrupt' })
    );
    root.onRead = undefined;
  });
});

describe('an interrupted update', () => {
  test('an index failure after the record commits fences queries and reports the operation indeterminate', async () => {
    const { repository } = await faultyRepository();
    await addTask(repository, 'a', { scopes: [A] });
    const put = jest.spyOn(TaskIndex.prototype, 'put').mockReturnValueOnce(fail('injected index failure'));
    try {
      const current: ITaskCommitRecord = (await repository.readCommit('a' as TaskId)).orThrow()!;
      const result = await change(repository, 'a', { lifecycle: succeeded }).then(
        () => undefined,
        (e: Error) => e.message
      );
      expect(result).toMatch(/committed, but the index update failed.*injected index failure/i);
      expect(current.recordRevision).toBe(1);
    } finally {
      put.mockRestore();
    }
    const health = repository.health();
    expect(health.state).toBe('unavailable');
    expect(health.issues.join()).toMatch(/rebuild the indexes/i);
    // Fenced: no stale read.
    expect(await repository.query({ selection: { scopes: [A], lifecycleClass: 'all' } })).toFailWithDetail(
      /rebuild the indexes/i,
      expect.objectContaining({ code: 'storage-unavailable', retry: 'reconcile-first' })
    );
    expect(await repository.listOwed({ subscription: 's1' as SubscriptionId })).toFailWithDetail(
      /fenced/i,
      expect.objectContaining({ code: 'storage-unavailable' })
    );
    // Rebuild reads what committed.
    expect(await repository.rebuildIndexes()).toSucceedAndSatisfy((h) => expect(h.state).toBe('ready'));
    expect(
      ids(
        (await repository.query({ selection: { scopes: [A], lifecycleClass: 'terminal' } })).orThrow().items
      )
    ).toEqual(['a']);
  });

  test('the indeterminate result carries the operation id, for registration and commit alike', async () => {
    const { repository } = await faultyRepository();
    const owedSpy = jest.spyOn(TaskIndex.prototype, 'putOwed').mockImplementationOnce(() => {
      throw new Error('injected throw');
    });
    try {
      expect(
        await repository.withWriter((w) => w.register(shapedRegistration('a', { scopes: [A] })))
      ).toFailWithDetail(
        /index update failed.*injected throw/i,
        expect.objectContaining({ code: 'commit-indeterminate', operationId: 'op-create-a' })
      );
    } finally {
      owedSpy.mockRestore();
    }
    (await repository.rebuildIndexes()).orThrow();
    expect(await openTasks(repository)).toEqual(['a']);
  });

  test('a maintenance commit, which has no operation id, is reported unavailable instead', async () => {
    const { repository } = await faultyRepository();
    const created = await addTask(repository, 'a', { scopes: [A] });
    if (created.recordType !== 'resolved') {
      throw new Error('resolved expected');
    }
    const put = jest.spyOn(TaskIndex.prototype, 'put').mockReturnValueOnce(fail('injected'));
    try {
      expect(
        await repository.withWriter((w) =>
          w.commit({
            purpose: 'maintenance',
            taskId: 'a' as TaskId,
            expectedRevision: 1 as TaskRevision,
            expectedRecordRevision: 1,
            record: {
              recordType: 'resolved',
              task: created.task,
              operations: created.operations,
              updates: created.updates,
              archived: false
            }
          })
        )
      ).toFailWithDetail(/index update failed/i, expect.objectContaining({ code: 'storage-unavailable' }));
    } finally {
      put.mockRestore();
    }
  });

  test('a record write whose outcome is unknown fences; rebuild reads what actually landed', async () => {
    const { root, repository } = await faultyRepository();
    await addTask(repository, 'a', { scopes: [A] });
    root.faults.push({ name: 'task-a.json', when: 'after', visibility: 'replaced' });
    const current: ITaskCommitRecord = (await repository.readCommit('a' as TaskId)).orThrow()!;
    if (current.recordType !== 'resolved') {
      throw new Error('resolved expected');
    }
    expect(
      await repository.withWriter((w) =>
        w.commit({
          purpose: 'operation',
          operationId: 'op-finish' as OperationId,
          taskId: 'a' as TaskId,
          expectedRevision: 1 as TaskRevision,
          expectedRecordRevision: 1,
          record: nextDraft(current, {
            envelope: { revision: 2 as TaskRevision, lifecycle: succeeded },
            operation: catalogOp('op-finish', 'update-tracked', {})
          })
        })
      )
    ).toFailWithDetail(/may have landed/i, expect.objectContaining({ code: 'commit-indeterminate' }));
    expect(await repository.query({ selection: { scopes: [A], lifecycleClass: 'all' } })).toFailWithDetail(
      /fenced/i,
      expect.objectContaining({ code: 'storage-unavailable' })
    );
    (await repository.rebuildIndexes()).orThrow();
    expect(
      ids(
        (await repository.query({ selection: { scopes: [A], lifecycleClass: 'terminal' } })).orThrow().items
      )
    ).toEqual(['a']);
  });
});

describe('bounded working space', () => {
  test('record reads beyond four in flight are refused, not queued', async () => {
    const { root, repository } = await faultyRepository();
    // A hook present when the root is listed wraps its files; the function can change later.
    root.onRead = () => undefined;
    await addTask(repository, 'a', { scopes: [A] });
    const calls: Array<Promise<TaskResult<unknown>>> = [];
    root.onRead = () => {
      if (calls.length < 5) {
        // Host code inside a record read that reads again: each call runs synchronously.
        calls.push(repository.readCommit('a' as TaskId));
      }
    };
    expect(await repository.readCommit('a' as TaskId)).toSucceed();
    root.onRead = undefined;
    const results: Array<TaskResult<unknown>> = await Promise.all(calls);
    // The outermost read plus three nested ones fit; the fifth is refused as retryable.
    expect(results.filter((r) => r.isFailure())).toHaveLength(1);
    expect(results.find((r) => r.isFailure())).toFailWithDetail(
      /already in flight \(limit 4\)/i,
      expect.objectContaining({ code: 'conflict', retry: 'safe' })
    );
    expect(inspectRepository(repository)!.gate.highWater).toBe(4);
    expect(inspectRepository(repository)!.gate.inFlight).toBe(0);
  });

  test('the parsed-record cache is disabled unless configured', async () => {
    const { repository } = await faultyRepository();
    await addTask(repository, 'a', { scopes: [A] });
    const before = inspectRepository(repository)!.reads.task;
    await repository.readCommit('a' as TaskId);
    await repository.readCommit('a' as TaskId);
    expect(inspectRepository(repository)!.reads.task - before).toBe(2);
    expect(inspectRepository(repository)!.cache).toEqual({ entries: 0, charge: 0 });
  });

  test('a configured cache is bounded by entries and encoded charge, and invalidated by revision', async () => {
    const repository = (
      await FileTreeTaskRepository.initialize(
        params(memoryRoot(), 'session', { recordCache: { maxEntries: 2, maxEncodedBytes: 1024 * 1024 } })
      )
    ).orThrow();
    for (const id of ['a', 'b', 'c']) {
      await addTask(repository, id, { scopes: [A] });
    }
    const reads = (): number => inspectRepository(repository)!.reads.task;
    const start = reads();
    await repository.readCommit('a' as TaskId);
    await repository.readCommit('a' as TaskId);
    expect(reads() - start).toBe(1);
    await repository.readCommit('b' as TaskId);
    await repository.readCommit('c' as TaskId); // evicts a
    expect(inspectRepository(repository)!.cache.entries).toBe(2);
    await repository.readCommit('a' as TaskId);
    expect(reads() - start).toBe(4);
    // A commit invalidates: the next read goes to the record.
    await change(repository, 'a', { lifecycle: succeeded });
    const afterCommit = reads();
    expect(await repository.readCommit('a' as TaskId)).toSucceedAndSatisfy((r) =>
      expect(r!.recordRevision).toBe(2)
    );
    expect(reads() - afterCommit).toBe(1);
    const charge = inspectRepository(repository)!.cache.charge;
    expect(charge).toBeGreaterThan(0);
    expect(charge).toBeLessThanOrEqual(1024 * 1024);
    repository.close().orThrow();
    expect(inspectRepository(repository)!.cache).toEqual({ entries: 0, charge: 0 });
  });

  test('writes re-read the record: a cached copy never hides an out-of-band change from a writer', async () => {
    const root = new FaultyRoot(memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem);
    const repository = (
      await FileTreeTaskRepository.initialize(
        params(root, 'session', { recordCache: { maxEntries: 4, maxEncodedBytes: 1024 * 1024 } })
      )
    ).orThrow();
    await addTask(repository, 'a', { scopes: [A] });
    const current = (await repository.readCommit('a' as TaskId)).orThrow()!;
    expect(inspectRepository(repository)!.cache.entries).toBe(1);
    // Changed behind the repository's back: same record, different text.
    const text = (
      root.inner
        .getChildren()
        .orThrow()
        .find((c) => c.name === 'task-a.json') as FileTree.IFileTreeFileItem
    )
      .getRawContents()
      .orThrow();
    outOfBand(root, 'task-a.json', `${text} `);
    // A read may still be answered from the cache; a writer's precondition is not.
    expect(await repository.readCommit('a' as TaskId)).toSucceed();
    if (current.recordType !== 'resolved') {
      throw new Error('resolved expected');
    }
    expect(
      await repository.withWriter((w) =>
        w.commit({
          purpose: 'operation',
          operationId: 'op-x' as OperationId,
          taskId: 'a' as TaskId,
          expectedRevision: 1 as TaskRevision,
          expectedRecordRevision: 1,
          record: nextDraft(current, {
            envelope: { revision: 2 as TaskRevision, lifecycle: succeeded },
            operation: catalogOp('op-x', 'update-tracked', {})
          })
        })
      )
    ).toFailWithDetail(
      /differs from the one this repository committed/i,
      expect.objectContaining({ code: 'storage-corrupt' })
    );
    // The out-of-band text was not overwritten.
    const after = (
      root.inner
        .getChildren()
        .orThrow()
        .find((c) => c.name === 'task-a.json') as FileTree.IFileTreeFileItem
    )
      .getRawContents()
      .orThrow();
    expect(after).toBe(`${text} `);
  });

  test('a record larger than the cache charge is never held', async () => {
    const repository = (
      await FileTreeTaskRepository.initialize(
        params(memoryRoot(), 'session', { recordCache: { maxEntries: 32, maxEncodedBytes: 16 } })
      )
    ).orThrow();
    await addTask(repository, 'a', { scopes: [A] });
    await repository.readCommit('a' as TaskId);
    expect(inspectRepository(repository)!.cache.entries).toBe(0);
  });

  test('the charge ceiling evicts older entries to admit a new one', async () => {
    const repository = (
      await FileTreeTaskRepository.initialize(
        params(memoryRoot(), 'session', { recordCache: { maxEntries: 32, maxEncodedBytes: 5000 } })
      )
    ).orThrow();
    for (const id of ['a', 'b', 'c', 'd']) {
      await addTask(repository, id, { scopes: [A] });
      await repository.readCommit(id as TaskId);
      expect(inspectRepository(repository)!.cache.charge).toBeLessThanOrEqual(5000);
    }
    expect(inspectRepository(repository)!.cache.entries).toBeLessThan(4);
  });

  test.each([
    { maxEntries: 0, maxEncodedBytes: 1 },
    { maxEntries: 33, maxEncodedBytes: 1 },
    { maxEntries: 1, maxEncodedBytes: 8 * 1024 * 1024 + 1 },
    { maxEntries: 1.5, maxEncodedBytes: 1 }
  ])('cache limits beyond 32 entries / 8 MiB are refused: %j', async (recordCache) => {
    expect(
      await FileTreeTaskRepository.initialize(params(memoryRoot(), 'session', { recordCache }))
    ).toFailWithDetail(/recordCache/i, expect.objectContaining({ code: 'invalid' }));
  });
});

describe('open-time source identity', () => {
  test('two records bound to one source reference block open', async () => {
    const { seedRepository } = await import('../../helpers/cohorts');
    const { binding } = await import('../../helpers/queryFixtures');
    // Clones of one bound template share its binding: exactly what registration refuses.
    await expect(
      seedRepository([], [{ prefix: 'dup', count: 2, shape: { scopes: [A], binding: binding('shared') } }])
    ).rejects.toThrow(/dup00001.*already bound to task dup00000/i);
  });
});

describe('copilot round 1 regressions', () => {
  test('close is refused while a rebuild holds the root; the rebuild then completes ready', async () => {
    const { root, repository } = await faultyRepository();
    await addTask(repository, 'a', { scopes: [A] });
    let closed: ReturnType<ITaskRepository['close']> | undefined;
    root.onRead = (name) => {
      if (name === 'task-a.json' && closed === undefined) {
        closed = repository.close();
      }
    };
    expect(await repository.rebuildIndexes()).toSucceedAndSatisfy((h) => expect(h.state).toBe('ready'));
    root.onRead = undefined;
    expect(closed).toFailWithDetail(
      /rebuild is in progress/i,
      expect.objectContaining({ code: 'conflict', retry: 'safe' })
    );
    expect(await openTasks(repository)).toEqual(['a']);
    expect(repository.close()).toSucceedWith(true);
  });

  test('consumer and source records are parsed inside the materialization gate', async () => {
    const { root, repository } = await faultyRepository();
    await addTask(repository, 'a', { scopes: [A] });
    const manifestFile = root.inner
      .getChildren()
      .orThrow()
      .find((c) => c.name === 'repository.json') as FileTree.IFileTreeFileItem;
    const manifest = JSON.parse(manifestFile.getRawContents().orThrow());
    outOfBand(
      root,
      'repository.json',
      JSON.stringify({
        ...manifest,
        consumers: [{ id: 's1', state: 'live' }],
        sources: [{ id: 'acme', state: 'live' }]
      })
    );
    outOfBand(root, 'consumer-s1.json', JSON.stringify({ formatVersion: 1, id: 's1' }));
    outOfBand(root, 'source-acme.json', JSON.stringify({ formatVersion: 1, id: 'acme' }));
    const inFlight: Record<string, number> = {};
    root.onRead = (name) => {
      inFlight[name] = inspectRepository(repository)!.gate.inFlight;
    };
    (await repository.rebuildIndexes()).orThrow();
    root.onRead = undefined;
    expect(inFlight['consumer-s1.json']).toBe(1);
    expect(inFlight['source-acme.json']).toBe(1);
    expect(inspectRepository(repository)!.evidence).toEqual(
      expect.objectContaining({ consumerPassReads: 1, sourcePassReads: 1 })
    );
  });
});
