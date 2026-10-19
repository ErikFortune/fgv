/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { FileTree } from '@fgv/ts-json-base';
import {
  FileTreeTaskRepository,
  ITaskCommitRecord,
  ITaskCommitRequest,
  ITaskRepository,
  TaskId,
  TaskRevision
} from '../../../index';
import { FaultyRoot } from '../../helpers/faultyRoot';
import { catalogOp, memoryRoot, nextDraft, params, registration } from '../../helpers/storageFixtures';

const t1: TaskId = 't1' as TaskId;

function start(current: ITaskCommitRecord): ITaskCommitRequest {
  return {
    purpose: 'operation',
    operationId: 'op-start' as never,
    taskId: t1,
    expectedRevision: 1 as TaskRevision,
    expectedRecordRevision: 1,
    record: nextDraft(current, {
      envelope: { revision: 2 as TaskRevision, lifecycle: { status: 'running' } },
      operation: catalogOp('op-start', 'update-tracked', { start: true }),
      updates: ['lifecycle']
    })
  };
}

async function reopen(root: FileTree.IFileTreeDirectoryItem): Promise<ITaskRepository> {
  const opened = (await FileTreeTaskRepository.open(params(root, 'session'))).orThrow();
  if (opened.state !== 'ready') {
    throw new Error(JSON.stringify(opened.recovery.report.issues));
  }
  return opened.repository;
}

describe('a failed commit is classified by what a reader can now see', () => {
  let inner: FileTree.IAtomicFileTreeDirectoryItem;
  let root: FaultyRoot;
  let repository: ITaskRepository;
  let created: ITaskCommitRecord;

  beforeEach(async () => {
    inner = memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem;
    root = new FaultyRoot(inner);
    repository = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
    created = (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
  });

  test("'unchanged' is safe to retry: nothing moved, in memory or on disk", async () => {
    root.faults.push({ name: 'task-t1.json', when: 'before', visibility: 'unchanged' });
    expect(await repository.withWriter((w) => w.commit(start(created)))).toFailWithDetail(
      /before anything became visible/i,
      { code: 'storage-unavailable', retry: 'safe', operationId: 'op-start' }
    );
    expect(repository.health().state).toBe('ready');
    expect(await repository.readCommit(t1)).toSucceedWith(created);
    // The retry is a first application, not a replay.
    expect(await repository.withWriter((w) => w.commit(start(created)))).toSucceedAndSatisfy((record) => {
      expect(record.recordRevision).toBe(2);
    });
  });

  test("'replaced' fences, reports commit-indeterminate, and a reopen finds the operation committed", async () => {
    root.faults.push({ name: 'task-t1.json', when: 'after', visibility: 'replaced' });
    expect(await repository.withWriter((w) => w.commit(start(created)))).toFailWithDetail(
      /may have landed \(replaced\)/i,
      { code: 'commit-indeterminate', retry: 'reconcile-first', operationId: 'op-start' }
    );
    expect(repository.health()).toEqual({
      state: 'unavailable',
      generation: expect.any(Number),
      issues: [expect.stringMatching(/write outcome is replaced after 'directory-flush'/)]
    });
    // Fenced: no read or write trusts in-memory state that may no longer match the disk.
    expect(await repository.readCommit(t1)).toFailWith(/fenced/i);
    expect(await repository.withWriter((w) => w.commit(start(created)))).toFailWith(/fenced/i);
    repository.close();

    // Reopen reads what is actually there, and the retry of the same operation is a replay —
    // it neither applies twice nor pretends nothing happened.
    const reopened = await reopen(inner);
    const committed = (await reopened.readCommit(t1)).orThrow()!;
    expect(committed.operations.map((o) => o.operationId)).toContain('op-start');
    expect(await reopened.withWriter((w) => w.commit(start(created)))).toSucceedWith(committed);
  });

  test("'unknown' fences too — a failed call is never proof that nothing happened", async () => {
    root.faults.push({ name: 'task-t1.json', when: 'before', visibility: 'unknown', stage: 'replace' });
    expect(await repository.withWriter((w) => w.commit(start(created)))).toFailWithDetail(
      /may have landed \(unknown\)/i,
      { code: 'commit-indeterminate', retry: 'reconcile-first', operationId: 'op-start' }
    );
    expect(repository.health().state).toBe('unavailable');
    repository.close();
    // Here the write did not in fact land; after reopen the retry applies it exactly once.
    const reopened = await reopen(inner);
    expect(await reopened.withWriter((w) => w.commit(start(created)))).toSucceedAndSatisfy((record) => {
      expect(record.recordRevision).toBe(2);
    });
  });

  test('a replay whose flush-boundary rewrite fails is itself reported, not silently successful', async () => {
    expect(await repository.withWriter((w) => w.commit(start(created)))).toSucceed();
    root.faults.push({ name: 'task-t1.json', when: 'after', visibility: 'replaced' });
    expect(await repository.withWriter((w) => w.commit(start(created)))).toFailWithDetail(
      /may have landed/i,
      expect.objectContaining({ code: 'commit-indeterminate', operationId: 'op-start' })
    );
  });

  test('a record changed out of band fences on the next read', async () => {
    const tampered = { ...created, recordRevision: 7 };
    inner.writeChildAtomically('task-t1.json', JSON.stringify(tampered), { guarantee: 'session' }).orThrow();
    expect(await repository.readCommit(t1)).toFailWithDetail(
      /holds t1 record 7, expected t1 record 1/i,
      expect.objectContaining({ code: 'storage-corrupt' })
    );
    expect(repository.health().state).toBe('unavailable');
  });

  test('a record deleted out of band fences on the next read', async () => {
    (inner as FileTree.IMutableFileTreeDirectoryItem).deleteChild('task-t1.json').orThrow();
    expect(await repository.read(t1)).toFailWithDetail(
      /missing|not found/i,
      expect.objectContaining({ code: 'storage-corrupt' })
    );
    expect(repository.health().state).toBe('unavailable');
  });

  test('a relist failure after a record lands fences the registration as indeterminate', async () => {
    // Fail the listing only after the record has been written.
    const write = root.writeChildAtomically.bind(root);
    root.writeChildAtomically = (name, contents, options) => {
      const result = write(name, contents, options);
      if (name === 'task-t2.json') {
        root.failChildren = true;
      }
      return result;
    };
    expect(await repository.withWriter((w) => w.register(registration('t2')))).toFailWithDetail(
      /relist failed after a committed write/i,
      { code: 'commit-indeterminate', retry: 'reconcile-first', operationId: 'op-create-t2' }
    );
    expect(repository.health().state).toBe('unavailable');
  });
});
