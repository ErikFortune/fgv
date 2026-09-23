/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { FileTree } from '@fgv/ts-json-base';
import { fail, succeed } from '@fgv/ts-utils';
import {
  FileTreeTaskRepository,
  ITaskCapacityDimensionStatus,
  ITaskCommitRecord,
  ITaskCommitRequest,
  ITaskEnvelope,
  ITaskRepository,
  ITaskRepositoryWriter,
  OperationId,
  TaskId,
  TaskResult,
  TaskRevision
} from '../../../index';
import { FaultyRoot } from '../../helpers/faultyRoot';
import {
  catalogOp,
  memoryRoot,
  nextDraft,
  params,
  registration,
  unresolvedRegistration,
  update
} from '../../helpers/storageFixtures';

function code(value: string): unknown {
  return expect.objectContaining({ code: value });
}

const rev = (n: number): TaskRevision => n as TaskRevision;
const opId = (s: string): OperationId => s as OperationId;
const t1: TaskId = 't1' as TaskId;

function row(repository: ITaskRepository, dimension: string): ITaskCapacityDimensionStatus {
  return repository
    .capacityStatus()
    .orThrow()
    .dimensions.find((d) => d.dimension === dimension)!;
}

async function write<T>(
  repository: ITaskRepository,
  action: (w: ITaskRepositoryWriter) => Promise<TaskResult<T>>
): Promise<TaskResult<T>> {
  return repository.withWriter(action);
}

/** An operation commit moving t1 to a new envelope state, owing one lifecycle update. */
function operation(
  current: ITaskCommitRecord,
  id: string,
  envelope: Partial<ITaskEnvelope>,
  request: unknown = { change: id }
): ITaskCommitRequest {
  const revision =
    current.recordType === 'resolved' ? current.task.envelope.revision : current.reference.revision;
  return {
    purpose: 'operation',
    operationId: opId(id),
    taskId: t1,
    expectedRevision: revision,
    expectedRecordRevision: current.recordRevision,
    record: nextDraft(current, {
      envelope: { revision: rev(revision + 1), ...envelope },
      operation: catalogOp(id, 'update-tracked', request as never),
      updates: ['lifecycle']
    })
  };
}

describe('one-task atomic replacement', () => {
  let inner: FileTree.IAtomicFileTreeDirectoryItem;
  let root: FaultyRoot;
  let repository: ITaskRepository;
  let created: ITaskCommitRecord;

  beforeEach(async () => {
    inner = memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem;
    root = new FaultyRoot(inner);
    repository = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
    created = (await write(repository, (w) => w.register(registration('t1')))).orThrow();
    root.clearWrites();
  });

  test('state, owed update and dedup evidence commit together in one write', async () => {
    const committed = (
      await write(repository, (w) =>
        w.commit(operation(created, 'op-start', { lifecycle: { status: 'running' } }))
      )
    ).orThrow();
    expect(root.writes).toEqual(['task-t1.json']);
    expect(committed.recordRevision).toBe(2);
    if (committed.recordType === 'resolved') {
      expect(committed.task.envelope.revision).toBe(2);
      expect(committed.task.envelope.lifecycle.status).toBe('running');
      expect(committed.updates.map((u) => u.id)).toEqual(['t1:1:0', 't1:2:0']);
      expect(committed.operations.map((o) => o.operationId)).toEqual(['op-create-t1', 'op-start']);
    }
    // And a reader sees exactly that record.
    expect(await repository.readCommit(t1)).toSucceedWith(committed);
    expect(repository.health().generation).toBeGreaterThan(0);
  });

  test('a repeated operation replays: the committed record, no second application', async () => {
    const request = operation(created, 'op-start', { lifecycle: { status: 'running' } });
    const first = (await write(repository, (w) => w.commit(request))).orThrow();
    root.clearWrites();
    // The replay carries the preconditions it had *before* its own commit — now stale — and is
    // still recognized, because replay is checked first.
    expect(await write(repository, (w) => w.commit(request))).toSucceedWith(first);
    // The only writes are the flush-boundary rewrite of the same record and manifest.
    expect(root.writes).toEqual(['task-t1.json', 'repository.json']);
    expect(await repository.readCommit(t1)).toSucceedWith(first);
  });

  test('the same operation id with a different request is refused', async () => {
    (
      await write(repository, (w) =>
        w.commit(operation(created, 'op-start', { lifecycle: { status: 'running' } }))
      )
    ).orThrow();
    expect(
      await write(repository, (w) =>
        w.commit(operation(created, 'op-start', { lifecycle: { status: 'running' } }, { something: 'else' }))
      )
    ).toFailWithDetail(
      /already recorded with a different request/i,
      expect.objectContaining({ code: 'conflict', operationId: 'op-start' })
    );
  });

  test('a stale semantic or record revision is a conflict to reconcile, not an overwrite', async () => {
    const committed = (
      await write(repository, (w) =>
        w.commit(operation(created, 'op-start', { lifecycle: { status: 'running' } }))
      )
    ).orThrow();
    // A new operation prepared against the old record.
    expect(
      await write(repository, (w) => w.commit(operation(created, 'op-late', { title: 'late' })))
    ).toFailWithDetail(
      /expected revision 1\/record 1, found 2\/2/i,
      expect.objectContaining({ code: 'conflict', retry: 'reconcile-first', operationId: 'op-late' })
    );
    expect(await repository.readCommit(t1)).toSucceedWith(committed);
  });

  test('record and task revisions are separate: maintenance advances only the record revision', async () => {
    const running = (
      await write(repository, (w) =>
        w.commit(operation(created, 'op-start', { lifecycle: { status: 'running' } }))
      )
    ).orThrow();
    // Prune the first (required) lifecycle update — maintenance, not a semantic change.
    const pruned = running.recordType === 'resolved' ? running.updates.filter((u) => u.revision === 2) : [];
    const maintained = (
      await write(repository, (w) =>
        w.commit({
          purpose: 'maintenance',
          taskId: t1,
          expectedRevision: rev(2),
          expectedRecordRevision: 2,
          record: { ...nextDraft(running, {}), updates: pruned }
        })
      )
    ).orThrow();
    expect(maintained.recordRevision).toBe(3);
    expect(maintained.recordType === 'resolved' && maintained.task.envelope.revision).toBe(2);

    // Stale maintenance — prepared against record 2 — cannot erase what record 3 holds.
    expect(
      await write(repository, (w) =>
        w.commit({
          purpose: 'maintenance',
          taskId: t1,
          expectedRevision: rev(2),
          expectedRecordRevision: 2,
          record: { ...nextDraft(running, {}), updates: [] }
        })
      )
    ).toFailWithDetail(/found 2\/3/i, code('conflict'));

    // Maintenance may not change the semantic revision, add an operation, or add an update.
    const base = {
      purpose: 'maintenance' as const,
      taskId: t1,
      expectedRevision: rev(2),
      expectedRecordRevision: 3
    };
    expect(
      await write(repository, (w) =>
        w.commit({ ...base, record: nextDraft(maintained, { envelope: { revision: rev(3) } }) })
      )
    ).toFailWithDetail(/maintenance cannot change the semantic revision/i, code('invalid'));
    expect(
      await write(repository, (w) =>
        w.commit({
          ...base,
          record: nextDraft(maintained, { operation: catalogOp('x', 'update-tracked', {}) })
        })
      )
    ).toFailWithDetail(/may not add operations/i, code('invalid'));
    expect(
      await write(repository, (w) =>
        w.commit({ ...base, record: nextDraft(maintained, { updates: ['progress'] }) })
      )
    ).toFailWithDetail(/maintenance cannot add update/i, code('invalid'));
  });

  test('dedup evidence is never dropped or rewritten', async () => {
    const draft = nextDraft(created, {
      envelope: { revision: rev(2) },
      operation: catalogOp('op-2', 'update-tracked', {})
    });
    const request = {
      purpose: 'operation' as const,
      operationId: opId('op-2'),
      taskId: t1,
      expectedRevision: rev(1),
      expectedRecordRevision: 1
    };
    expect(
      await write(repository, (w) =>
        w.commit({ ...request, record: { ...draft, operations: [catalogOp('op-2', 'update-tracked', {})] } })
      )
    ).toFailWithDetail(/'op-create-t1' is dedup evidence and cannot be dropped/i, code('invalid'));
    const rewritten = [catalogOp('op-create-t1', 'create-tracked', { changed: true }), draft.operations[1]];
    expect(
      await write(repository, (w) => w.commit({ ...request, record: { ...draft, operations: rewritten } }))
    ).toFailWithDetail(/a stored request cannot change/i, code('invalid'));
    expect(
      await write(repository, (w) =>
        w.commit({
          ...request,
          record: { ...draft, operations: [...draft.operations, catalogOp('op-3', 'update-tracked', {})] }
        })
      )
    ).toFailWithDetail(/adds exactly its own operation 'op-2'/i, code('invalid'));
  });

  test('a committed update is immutable, and a required one is pruned only by maintenance', async () => {
    const draft = nextDraft(created, {
      envelope: { revision: rev(2) },
      operation: catalogOp('op-2', 'update-tracked', {})
    });
    const request = {
      purpose: 'operation' as const,
      operationId: opId('op-2'),
      taskId: t1,
      expectedRevision: rev(1),
      expectedRecordRevision: 1
    };
    expect(
      await write(repository, (w) => w.commit({ ...request, record: { ...draft, updates: [] } }))
    ).toFailWithDetail(/required update 't1:1:0' can only be pruned by maintenance/i, code('invalid'));
    const changed = [{ ...draft.updates[0], required: false }];
    expect(
      await write(repository, (w) => w.commit({ ...request, record: { ...draft, updates: changed } }))
    ).toFailWithDetail(/immutable once committed/i, code('invalid'));
    // A new update must be for the revision being committed.
    const stale = {
      ...update(draft.task.envelope, 'progress'),
      revision: rev(1),
      id: 't1:1:1' as never,
      snapshot: { envelope: { ...draft.task.envelope, revision: rev(1) } }
    };
    expect(
      await write(repository, (w) =>
        w.commit({ ...request, record: { ...draft, updates: [...draft.updates, stale] } })
      )
    ).toFailWithDetail(/must be for the committed revision 2/i, code('invalid'));
    // An optional update may be dropped by an ordinary commit.
    const optional = (
      await write(repository, (w) =>
        w.commit({
          ...request,
          record: { ...draft, updates: [...draft.updates, update(draft.task.envelope, 'progress', false)] }
        })
      )
    ).orThrow();
    const draft3 = nextDraft(optional, {
      envelope: { revision: rev(3) },
      operation: catalogOp('op-3', 'update-tracked', {})
    });
    expect(
      await write(repository, (w) =>
        w.commit({
          purpose: 'operation',
          operationId: opId('op-3'),
          taskId: t1,
          expectedRevision: rev(2),
          expectedRecordRevision: 2,
          record: { ...draft3, updates: draft3.updates.filter((u) => u.required) }
        })
      )
    ).toSucceed();
  });

  test('identity, kind, creation time and source binding cannot change; revisions cannot go backwards', async () => {
    const base = {
      purpose: 'operation' as const,
      operationId: opId('op-2'),
      taskId: t1,
      expectedRevision: rev(1),
      expectedRecordRevision: 1
    };
    const cases: Array<[Partial<ITaskEnvelope>, RegExp]> = [
      [
        { kind: 'acme.job' as never, revision: rev(2) },
        /cannot change the task's id, kind or detail version/i
      ],
      [{ createdAt: '2026-01-01T00:00:00.000Z' as never, revision: rev(2) }, /cannot change createdAt/i],
      [
        { binding: { sourceId: 'acme', referenceVersion: 1, reference: {} }, revision: rev(2) },
        /source binding is not a metadata patch/i
      ]
    ];
    for (const [envelope, message] of cases) {
      expect(
        await write(repository, (w) =>
          w.commit({
            ...base,
            record: nextDraft(created, { envelope, operation: catalogOp('op-2', 'update-tracked', {}) })
          })
        )
      ).toFailWithDetail(message, code('invalid'));
    }
    const at2 = (await write(repository, (w) => w.commit(operation(created, 'op-2', {})))).orThrow();
    expect(
      await write(repository, (w) =>
        w.commit({
          ...base,
          operationId: opId('op-3'),
          expectedRevision: rev(2),
          expectedRecordRevision: 2,
          record: {
            ...nextDraft(at2, {
              envelope: { revision: rev(1) },
              operation: catalogOp('op-3', 'update-tracked', {})
            }),
            updates: created.recordType === 'resolved' ? created.updates : []
          }
        })
      )
    ).toFailWithDetail(/cannot move backwards from 2 to 1/i, code('invalid'));
    expect(
      await write(repository, (w) =>
        w.commit({
          ...base,
          record: {
            ...nextDraft(created, {}),
            task: {
              ...nextDraft(created, {}).task,
              envelope: { ...nextDraft(created, {}).task.envelope, id: 't2' as TaskId }
            },
            updates: []
          }
        })
      )
    ).toFailWithDetail(/the record describes t2/i, code('invalid'));
  });

  test('a commit to a task that is not live is refused', async () => {
    expect(
      await write(repository, (w) =>
        w.commit({ ...operation(created, 'op-2', {}), taskId: 'nobody' as TaskId })
      )
    ).toFailWithDetail(/no live task/i, code('not-found-or-denied'));
    expect(
      await write(repository, (w) =>
        w.commit({ ...operation(created, 'op-2', {}), taskId: 'bad/id' as TaskId })
      )
    ).toFailWithDetail(/not a valid task id/i, code('invalid'));
  });

  test('terminal state is absorbing', async () => {
    const done = (
      await write(repository, (w) =>
        w.commit(
          operation(created, 'op-done', {
            lifecycle: { status: 'succeeded', outcome: { summary: 'ok', artifacts: [] } }
          })
        )
      )
    ).orThrow();
    expect(
      await write(repository, (w) =>
        w.commit(operation(done, 'op-reopen', { lifecycle: { status: 'running' } }))
      )
    ).toFailWithDetail(/terminal state is absorbing/i, code('invalid'));
    // Catalog metadata on a terminal task may still change.
    expect(
      await write(repository, (w) => w.commit(operation(done, 'op-retitle', { title: 'renamed' })))
    ).toSucceed();
  });

  test('closeout spends the task’s own reservation; archive consumes it and releases the non-archived slot', async () => {
    const reservedBefore: number = row(repository, 'updates').reserved;
    const usedBefore: number = row(repository, 'updates').used;
    expect(reservedBefore).toBe(7);

    const done = (
      await write(repository, (w) =>
        w.commit(
          operation(created, 'op-done', {
            lifecycle: { status: 'failed', reason: { code: 'boom', summary: 'it broke' } }
          })
        )
      )
    ).orThrow();
    // One more update used, one fewer reserved: the terminal step spent from its own claim, so
    // used + reserved did not move.
    expect(row(repository, 'updates').used).toBe(usedBefore + 1);
    expect(row(repository, 'updates').reserved).toBe(reservedBefore - 1);
    expect(done.capacityClaims[0].disposition).toBe('reserved');
    const nonArchived: number = row(repository, 'non-archived-tasks').used;

    const archived = (
      await write(repository, (w) =>
        w.commit({
          ...operation(done, 'op-archive', {}),
          record: nextDraft(done, {
            envelope: { revision: rev(3) },
            operation: catalogOp('op-archive', 'archive', {}),
            archived: true
          })
        })
      )
    ).orThrow();
    expect(archived.capacityClaims[0].disposition).toBe('consumed');
    expect(row(repository, 'updates').reserved).toBe(0);
    expect(row(repository, 'non-archived-tasks').used).toBe(nonArchived - 1);
    expect(row(repository, 'retained-tasks').used).toBe(1);
  });

  test('an archived tombstone is immutable, readable, and survives reopen', async () => {
    const done = (
      await write(repository, (w) =>
        w.commit(
          operation(created, 'op-done', {
            lifecycle: { status: 'cancelled', reason: { code: 'stop', summary: 'stopped' } }
          })
        )
      )
    ).orThrow();
    const archived = (
      await write(repository, (w) =>
        w.commit({
          ...operation(done, 'op-archive', {}),
          record: nextDraft(done, {
            envelope: { revision: rev(3) },
            operation: catalogOp('op-archive', 'archive', {}),
            archived: true
          })
        })
      )
    ).orThrow();
    expect(
      await write(repository, (w) => w.commit(operation(archived, 'op-after', { title: 'x' })))
    ).toFailWithDetail(/archived tombstone is immutable/i, code('conflict'));
    // Its operation evidence still replays.
    expect(
      await write(repository, (w) =>
        w.commit({
          ...operation(done, 'op-archive', {}),
          record: nextDraft(done, {
            envelope: { revision: rev(3) },
            operation: catalogOp('op-archive', 'archive', {}),
            archived: true
          })
        })
      )
    ).toSucceedWith(archived);
    expect(await repository.read(t1)).toSucceedAndSatisfy((read) => {
      expect(read).toEqual(expect.objectContaining({ state: 'resolved', archived: true }));
    });
    repository.close();
    const reopened = (await FileTreeTaskRepository.open(params(inner, 'session'))).orThrow();
    expect(reopened.state === 'ready' && (await reopened.repository.readCommit(t1)).orThrow()).toEqual(
      archived
    );
  });

  test('only a terminal task can be archived', async () => {
    expect(
      await write(repository, (w) =>
        w.commit({
          ...operation(created, 'op-archive', {}),
          record: nextDraft(created, {
            envelope: { revision: rev(2) },
            operation: catalogOp('op-archive', 'archive', {}),
            archived: true
          })
        })
      )
    ).toFailWithDetail(/only a terminal task can be archived/i, code('invalid'));
  });

  test('observation commits are deduplicated by source revision and add no operation', async () => {
    const observed = (
      await write(repository, (w) =>
        w.commit({
          purpose: 'observation',
          taskId: t1,
          expectedRevision: rev(1),
          expectedRecordRevision: 1,
          record: nextDraft(created, {
            envelope: { revision: rev(2), lifecycle: { status: 'running' } },
            updates: ['lifecycle'],
            sourceRevision: { epoch: 'e1', token: '5' }
          })
        })
      )
    ).orThrow();
    expect(observed.recordType === 'resolved' && observed.sourceRevision).toEqual({
      epoch: 'e1',
      token: '5'
    });
    const again = {
      purpose: 'observation' as const,
      taskId: t1,
      expectedRevision: rev(2),
      expectedRecordRevision: 2
    };
    // The same source revision projecting the same state is a replay: the committed record.
    const replay = {
      purpose: 'observation' as const,
      taskId: t1,
      expectedRevision: rev(1),
      expectedRecordRevision: 1,
      record: nextDraft(created, {
        envelope: { revision: rev(2), lifecycle: { status: 'running' } },
        updates: ['lifecycle'],
        sourceRevision: { epoch: 'e1', token: '5' }
      })
    };
    expect(await write(repository, (w) => w.commit(replay))).toSucceedWith(observed);
    // The same source revision projecting something else is a source contract violation.
    expect(
      await write(repository, (w) =>
        w.commit({
          ...again,
          record: nextDraft(observed, {
            envelope: {
              revision: rev(3),
              lifecycle: { status: 'paused', reason: { code: 'hold', summary: 'held' } }
            }
          })
        })
      )
    ).toFailWithDetail(/already committed with a different projection/i, code('source-gap'));
    expect(
      await write(repository, (w) =>
        w.commit({
          ...again,
          record: { ...nextDraft(observed, { envelope: { revision: rev(3) } }), sourceRevision: undefined }
        })
      )
    ).toFailWithDetail(/carries the source revision/i, code('invalid'));
    expect(
      await write(repository, (w) =>
        w.commit({
          ...again,
          record: nextDraft(observed, {
            envelope: { revision: rev(3) },
            sourceRevision: { epoch: 'e1', token: '6' },
            operation: catalogOp('op-x', 'update-tracked', {})
          })
        })
      )
    ).toFailWithDetail(/may not add operations/i, code('invalid'));
  });

  test('re-parenting checks the new parent and refuses a cycle', async () => {
    expect(await write(repository, (w) => w.register(registration('p')))).toSucceed();
    expect(
      await write(repository, (w) => w.register(registration('c', { envelope: { parentId: t1 } })))
    ).toSucceed();
    expect(
      await write(repository, (w) => w.commit(operation(created, 'op-reparent', { parentId: 'c' as TaskId })))
    ).toFailWithDetail(/parent c would close a cycle/i, code('invalid'));
    expect(
      await write(repository, (w) =>
        w.commit(operation(created, 'op-reparent', { parentId: 'nobody' as TaskId }))
      )
    ).toFailWithDetail(/parent nobody is not a live task/i, code('invalid'));
    expect(
      await write(repository, (w) => w.commit(operation(created, 'op-reparent', { parentId: 'p' as TaskId })))
    ).toSucceed();
  });

  test('encoded bounds from the stored profile are enforced before anything is written', async () => {
    const big = 'x'.repeat(40 * 1024);
    // A description beyond the field bound fails the converter; a huge operation request fails the profile's bound.
    expect(
      await write(repository, (w) => w.commit(operation(created, 'op-big', {}, { blob: big.repeat(4) })))
    ).toFailWithDetail(/request is \d+ bytes, over the bound of 131072/i, code('invalid'));
    expect(root.writes).toEqual([]);
  });
});

describe('first resolution of an unresolved registration', () => {
  let repository: ITaskRepository;
  let unresolved: ITaskCommitRecord;
  const u1: TaskId = 'u1' as TaskId;

  function resolution(current: ITaskCommitRecord, overrides?: Partial<ITaskEnvelope>): ITaskCommitRequest {
    if (current.recordType !== 'unresolved') {
      throw new Error('expected unresolved');
    }
    const ref = current.reference;
    const envelope: ITaskEnvelope = {
      schemaVersion: 1,
      id: ref.id,
      kind: ref.kind,
      detailVersion: ref.detailVersion,
      revision: rev(2),
      title: ref.title,
      stopPolicy: 'none',
      scopes: ref.scopes,
      lifecycle: { status: 'running' },
      attention: [],
      binding: ref.binding,
      recovery: 'reattach',
      observation: { state: 'current', observedAt: '2026-09-22T12:05:00.000Z' as never },
      createdAt: '2026-09-22T12:00:00.000Z' as never,
      changedAt: '2026-09-22T12:05:00.000Z' as never,
      ...overrides
    };
    return {
      purpose: 'observation',
      taskId: u1,
      expectedRevision: ref.revision,
      expectedRecordRevision: current.recordRevision,
      record: {
        recordType: 'resolved',
        task: { envelope, details: { job: 'j-u1' } },
        sourceRevision: { epoch: 'e1', token: '1' },
        operations: current.operations,
        updates: [update(envelope, 'lifecycle'), update(envelope, 'observation')],
        archived: false
      }
    };
  }

  beforeEach(async () => {
    repository = (await FileTreeTaskRepository.initialize(params(memoryRoot(), 'session'))).orThrow();
    unresolved = (await write(repository, (w) => w.register(unresolvedRegistration('u1')))).orThrow();
  });

  test('atomically establishes state and obligations, preserving identity and the registration evidence', async () => {
    const resolved = (await write(repository, (w) => w.commit(resolution(unresolved)))).orThrow();
    expect(resolved.recordType).toBe('resolved');
    if (resolved.recordType === 'resolved') {
      expect(resolved.task.envelope.id).toBe('u1');
      expect(resolved.updates.map((u) => u.category)).toEqual(['lifecycle', 'observation']);
      expect(resolved.operations.map((o) => o.operationId)).toEqual(['op-register-u1']);
      // The first-resolution reservation is consumed; the closeout one is still held.
      expect(resolved.capacityClaims.map((c) => [c.purpose, c.disposition])).toEqual([
        ['terminal-closeout', 'reserved'],
        ['first-resolution', 'consumed']
      ]);
    }
    expect(await repository.read(u1)).toSucceedAndSatisfy((read) => {
      expect(read?.state).toBe('resolved');
    });
  });

  test('first resolution is an observation: no other purpose can resolve a task', async () => {
    const base = resolution(unresolved);
    expect(await write(repository, (w) => w.commit({ ...base, purpose: 'maintenance' }))).toFailWithDetail(
      /first resolution is an observation; a 'maintenance' commit cannot resolve/i,
      code('invalid')
    );
    expect(
      await write(repository, (w) =>
        w.commit({ ...base, purpose: 'operation', operationId: 'op-resolve' as never })
      )
    ).toFailWithDetail(
      /first resolution is an observation; a 'operation' commit cannot resolve/i,
      code('invalid')
    );
  });

  test('catalog metadata the registration fixed cannot change on resolution', async () => {
    for (const overrides of [
      { title: 'renamed' },
      { scopes: [] },
      { parentId: 'x' as TaskId },
      { binding: { sourceId: 'other', referenceVersion: 1, reference: {} } }
    ]) {
      expect(await write(repository, (w) => w.commit(resolution(unresolved, overrides)))).toFailWithDetail(
        /preserve the registration's identity and catalog metadata/i,
        code('invalid')
      );
    }
    expect(
      await write(repository, (w) => w.commit(resolution(unresolved, { revision: rev(1) })))
    ).toFailWithDetail(/advance the revision past 1/i, code('invalid'));
  });

  test('an unresolved record admits no other replacement', async () => {
    const reference = unresolved.recordType === 'unresolved' ? unresolved.reference : undefined;
    expect(
      await write(repository, (w) =>
        w.commit({
          purpose: 'maintenance',
          taskId: u1,
          expectedRevision: rev(1),
          expectedRecordRevision: 1,
          record: {
            recordType: 'unresolved',
            reference: { ...reference!, title: 'renamed' },
            operations: unresolved.operations
          }
        })
      )
    ).toFailWithDetail(/only be replaced by its first resolution/i, code('invalid'));
  });
});

describe('the writer handle', () => {
  let repository: ITaskRepository;

  beforeEach(async () => {
    repository = (await FileTreeTaskRepository.initialize(params(memoryRoot(), 'session'))).orThrow();
  });

  test('nesting is rejected, and the outer writer keeps working', async () => {
    const outcome = await repository.withWriter(async (w) => {
      const nested = await repository.withWriter(async () => succeed(1) as never);
      expect(nested).toFailWithDetail(
        /already active; nesting is rejected/i,
        expect.objectContaining({ code: 'conflict', retry: 'safe' })
      );
      return w.register(registration('t1'));
    });
    expect(outcome).toSucceed();
  });

  test('a concurrent caller is refused rather than queued', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const first = repository.withWriter(async (w) => {
      await gate;
      return w.register(registration('t1'));
    });
    expect(await repository.withWriter(async (w) => w.register(registration('t2')))).toFailWithDetail(
      /already active/i,
      code('conflict')
    );
    release();
    expect(await first).toSucceed();
    // Once the first has finished, the writer is free again.
    expect(await repository.withWriter(async (w) => w.register(registration('t2')))).toSucceed();
  });

  test('a handle used after its callback returns fails', async () => {
    let escaped: ITaskRepositoryWriter | undefined;
    await repository.withWriter(async (w) => {
      escaped = w;
      return succeed(true) as never;
    });
    expect(await escaped!.register(registration('t1'))).toFailWithDetail(
      /no longer active/i,
      code('invalid')
    );
    expect(await escaped!.readCommit(t1)).toFailWith(/no longer active/i);
    expect(await escaped!.commit({} as never)).toFailWith(/no longer active/i);
    expect(await escaped!.raiseCapacityLimits(repository.profile)).toFailWith(/no longer active/i);
  });

  test('a callback failing after an earlier committed replacement leaves that replacement committed — no rollback', async () => {
    const outcome = await repository.withWriter(async (w) => {
      const registered = await w.register(registration('t1'));
      if (registered.isFailure()) {
        return registered;
      }
      return fail('the host step after the commit failed') as never;
    });
    expect(outcome).toFailWith(/the host step after the commit failed/i);
    expect(await repository.read(t1)).toSucceedAndSatisfy((read) => {
      expect(read?.state).toBe('resolved');
    });
  });

  test('a throwing callback becomes a failure, and its earlier commit also stays', async () => {
    const outcome = await repository.withWriter(async (w) => {
      await w.register(registration('t1'));
      throw new Error('host bug');
    });
    expect(outcome).toFailWithDetail(/the callback threw: host bug/i, code('invalid'));
    expect(await repository.withWriter(async (w) => w.readCommit(t1))).toSucceedAndSatisfy((record) => {
      expect(record?.recordRevision).toBe(1);
    });
  });
});
