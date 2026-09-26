/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { FileTree } from '@fgv/ts-json-base';
import {
  ConsumerId,
  DeliveryId,
  FileTreeTaskRepository,
  IResolvedTaskCommitRecord,
  ITaskCommitRecord,
  ITaskConsumerRecord,
  ITaskDispositionResult,
  ITaskRepository,
  Instant,
  OperationId,
  SubscriptionId,
  TaskId,
  TaskResult,
  TaskRevision,
  UpdateId,
  baselineUpdateId,
  taskUpdateId
} from '../../../index';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { inspectRepository } from '../../../packlets/storage/internals';
import { InMemoryCheckpointStore } from '../../helpers/deliveryFixtures';
import { addTask, change, scope, subscribeTo, succeeded } from '../../helpers/queryFixtures';
import { at, catalogOp, memoryRoot, nextDraft, params } from '../../helpers/storageFixtures';

const A = scope('alpha');
const s1: SubscriptionId = 's1' as SubscriptionId;
const later: Instant = new Date(Date.parse(at) + 3600000).toISOString() as Instant;
const uid = (task: string, revision: number, category: Parameters<typeof taskUpdateId>[2]): UpdateId =>
  taskUpdateId(task as TaskId, revision as TaskRevision, category);

interface IFixture {
  readonly root: FileTree.IFileTreeDirectoryItem;
  readonly store: InMemoryCheckpointStore;
  readonly repository: ITaskRepository;
}

async function fixture(): Promise<IFixture> {
  const root = memoryRoot();
  const store = new InMemoryCheckpointStore();
  const repository = (
    await FileTreeTaskRepository.initialize(params(root, 'session', { checkpoints: store }))
  ).orThrow();
  await subscribeTo(repository, 's1', [A]);
  await addTask(repository, 't', { scopes: [A] });
  return { root, store, repository };
}

async function reopened(f: IFixture): Promise<ITaskRepository> {
  f.repository.close().orThrow();
  const opened = (
    await FileTreeTaskRepository.open(params(f.root, 'session', { checkpoints: f.store }))
  ).orThrow();
  if (opened.state !== 'ready') {
    throw new Error(`not ready: ${JSON.stringify(opened.recovery.report.issues)}`);
  }
  return opened.repository;
}

function revisionOf(repository: ITaskRepository): number {
  return repository.subscription(s1).orThrow()!.recordRevision;
}

async function dispose(
  repository: ITaskRepository,
  updateIds: ReadonlyArray<string>,
  reason: string = 'consumer retired'
): Promise<TaskResult<ITaskDispositionResult>> {
  return repository.withWriter((w) =>
    w.disposeObligations({
      subscriptionId: s1,
      expectedRecordRevision: revisionOf(repository),
      updateIds: updateIds as UpdateId[],
      reason
    })
  );
}

async function close(
  repository: ITaskRepository,
  obligations: 'retain' | 'dispose',
  reason?: string
): Promise<TaskResult<ITaskConsumerRecord>> {
  return repository.withWriter((w) =>
    w.closeSubscription({
      subscriptionId: s1,
      expectedRecordRevision: revisionOf(repository),
      obligations,
      ...(reason !== undefined ? { reason } : {})
    })
  );
}

async function issue(
  repository: ITaskRepository,
  deliveryId: string,
  ids: ReadonlyArray<UpdateId>
): Promise<void> {
  const byTask = new Map<string, { taskId: string; revision: number; updateIds: string[] }>();
  for (const id of ids) {
    const [task, revision] = id.split(':');
    const key = `${task}:${revision}`;
    const entry = byTask.get(key) ?? { taskId: task, revision: Number(revision), updateIds: [] };
    entry.updateIds.push(id);
    byTask.set(key, entry);
  }
  (
    await repository.withWriter((w) =>
      w.issueReceipt({
        subscriptionId: s1,
        expectedRecordRevision: revisionOf(repository),
        receipt: { version: 1, deliveryId, included: Array.from(byTask.values()) } as never,
        issuedAt: at as Instant,
        expiresAt: later
      })
    )
  ).orThrow();
}

async function acknowledge(repository: ITaskRepository, deliveryId: string): Promise<void> {
  (
    await repository.withWriter((w) =>
      w.acknowledgeReceipt({
        subscriptionId: s1,
        expectedRecordRevision: revisionOf(repository),
        deliveryId: deliveryId as DeliveryId,
        at: at as Instant
      })
    )
  ).orThrow();
}

async function owedIds(repository: ITaskRepository): Promise<string[]> {
  return (await repository.listOwed({ subscription: s1 })).orThrow().updates.map((u) => u.id);
}

async function recordOf(repository: ITaskRepository, id: string = 't'): Promise<IResolvedTaskCommitRecord> {
  const record: ITaskCommitRecord = (await repository.readCommit(id as TaskId)).orThrow()!;
  return record as IResolvedTaskCommitRecord;
}

function committed(repository: ITaskRepository, dimension: string): number {
  const row = repository
    .capacityStatus()
    .orThrow()
    .dimensions.find((d) => d.dimension === dimension)!;
  return row.used + row.reserved;
}

function consumerEntry(repository: ITaskRepository): { used: number; reserved: number } {
  const entry = inspectRepository(repository)!.ledger.entry('consumer:s1')!;
  return { used: entry.used['acknowledgement-ids'], reserved: entry.reserved['acknowledgement-ids'] };
}

/** An archive commit that carries no new update: the tombstone the broker writes. */
async function archive(
  repository: ITaskRepository,
  keepUpdates: boolean = false
): Promise<TaskResult<unknown>> {
  const current = await recordOf(repository);
  const revision = current.task.envelope.revision + 1;
  const draft = nextDraft(current, {
    envelope: { revision: revision as TaskRevision },
    operation: catalogOp(`op-archive-${revision}`, 'archive', {}),
    archived: true
  });
  return repository.withWriter((w) =>
    w.commit({
      purpose: 'operation',
      operationId: `op-archive-${revision}` as OperationId,
      taskId: 't' as TaskId,
      expectedRevision: current.task.envelope.revision,
      expectedRecordRevision: current.recordRevision,
      record: { ...draft, updates: keepUpdates ? draft.updates : [] }
    })
  );
}

describe('obligation disposition at the storage boundary', () => {
  test('an owed id joins the disposed history with its reason; its reservation becomes that history', async () => {
    const { repository } = await fixture();
    const ids = committed(repository, 'acknowledgement-ids');
    expect(consumerEntry(repository)).toEqual({ used: 0, reserved: 1 });
    expect(await dispose(repository, [uid('t', 1, 'lifecycle')], 'access removed')).toSucceedWith({
      subscriptionId: s1,
      newlyDisposed: [uid('t', 1, 'lifecycle')],
      alreadyDischarged: []
    });
    expect(await owedIds(repository)).toEqual([]);
    // Converted, never minted or freed: the repository total is unchanged.
    expect(consumerEntry(repository)).toEqual({ used: 1, reserved: 0 });
    expect(committed(repository, 'acknowledgement-ids')).toBe(ids);
    const record = (await repository.withWriter((w) => w.readSubscription(s1))).orThrow()!;
    expect(record.disposed).toEqual([{ updateId: uid('t', 1, 'lifecycle'), reason: 'access removed' }]);
    expect(record.acknowledged).toEqual([]);
  });

  test('a repeat is reported and writes nothing', async () => {
    const { repository } = await fixture();
    (await dispose(repository, [uid('t', 1, 'lifecycle')])).orThrow();
    const revision = revisionOf(repository);
    expect(await dispose(repository, [uid('t', 1, 'lifecycle')])).toSucceedWith({
      subscriptionId: s1,
      newlyDisposed: [],
      alreadyDischarged: [uid('t', 1, 'lifecycle')]
    });
    expect(revisionOf(repository)).toBe(revision);
  });

  test('an acknowledged id is already discharged: it is reported, never also disposed', async () => {
    const { repository } = await fixture();
    await issue(repository, 'd1', [uid('t', 1, 'lifecycle')]);
    await acknowledge(repository, 'd1');
    expect(await dispose(repository, [uid('t', 1, 'lifecycle')])).toSucceedAndSatisfy((r) =>
      expect(r.alreadyDischarged).toEqual([uid('t', 1, 'lifecycle')])
    );
  });

  test('an id the subscription is not owed is refused, changing nothing', async () => {
    const { repository } = await fixture();
    const revision = revisionOf(repository);
    expect(await dispose(repository, [uid('t', 1, 'lifecycle'), uid('t', 9, 'lifecycle')])).toFailWithDetail(
      /not owed t:9:0/i,
      expect.objectContaining({ code: 'invalid' })
    );
    expect(revisionOf(repository)).toBe(revision);
    expect(await owedIds(repository)).toEqual([uid('t', 1, 'lifecycle')]);
  });

  test('an id an unacknowledged receipt names is refused until that receipt is abandoned', async () => {
    const { repository } = await fixture();
    await issue(repository, 'd1', [uid('t', 1, 'lifecycle')]);
    expect(await dispose(repository, [uid('t', 1, 'lifecycle')])).toFailWithDetail(
      /acknowledge or abandon that receipt first/i,
      expect.objectContaining({ code: 'conflict' })
    );
    (
      await repository.withWriter((w) =>
        w.abandonReceipt({
          subscriptionId: s1,
          expectedRecordRevision: revisionOf(repository),
          deliveryId: 'd1' as DeliveryId
        })
      )
    ).orThrow();
    expect(await dispose(repository, [uid('t', 1, 'lifecycle')])).toSucceed();
  });

  test('a reason over the profile bound is refused; the bound is measured as encoded', async () => {
    const { repository } = await fixture();
    const max = repository.profile.encoded.maxDispositionReasonBytes;
    expect(await dispose(repository, [uid('t', 1, 'lifecycle')], 'x'.repeat(max + 1))).toFailWithDetail(
      /over the bound/i,
      expect.objectContaining({ code: 'invalid' })
    );
    // A quote is two bytes encoded.
    expect(await dispose(repository, [uid('t', 1, 'lifecycle')], '"'.repeat(max / 2 + 1))).toFailWithDetail(
      /over the bound/i,
      expect.objectContaining({ code: 'invalid' })
    );
    expect(await dispose(repository, [uid('t', 1, 'lifecycle')], 'x'.repeat(max))).toSucceed();
  });

  test('a malformed request is invalid', async () => {
    const { repository } = await fixture();
    expect(await dispose(repository, [])).toFailWithDetail(
      /non-empty/i,
      expect.objectContaining({ code: 'invalid' })
    );
    expect(await dispose(repository, [uid('t', 1, 'lifecycle'), uid('t', 1, 'lifecycle')])).toFailWithDetail(
      /unique/i,
      expect.objectContaining({ code: 'invalid' })
    );
  });

  test('a disposed baseline obligation drops its payload in the same write', async () => {
    const f = await fixture();
    const base = baselineUpdateId('t' as TaskId, 1 as TaskRevision);
    const current = (await f.repository.readCommit('t' as TaskId)).orThrow()! as IResolvedTaskCommitRecord;
    (
      await f.repository.withWriter((w) =>
        w.registerSubscription({
          subscriptionId: 's2' as SubscriptionId,
          operationId: 'op-s2' as OperationId,
          principalKey: 'host',
          specification: {
            consumerId: 'consumer-s2' as ConsumerId,
            selection: { scopes: [A], lifecycleClass: 'all' },
            start: 'current',
            policy: {
              schemaVersion: 1,
              durability: 'session',
              history: 'observed-state',
              categories: ['attention', 'lifecycle', 'result'],
              coalesceProgress: false
            }
          },
          baseline: [
            {
              id: base,
              taskId: 't' as TaskId,
              revision: 1 as TaskRevision,
              category: 'lifecycle',
              required: true,
              snapshot: { envelope: current.task.envelope },
              audience: ['s2' as SubscriptionId]
            }
          ],
          createdAt: at as Instant
        })
      )
    ).orThrow();
    const updates = committed(f.repository, 'updates');
    (
      await f.repository.withWriter((w) =>
        w.disposeObligations({
          subscriptionId: 's2' as SubscriptionId,
          expectedRecordRevision: 1,
          updateIds: [base],
          reason: 'not needed'
        })
      )
    ).orThrow();
    const record = (
      await f.repository.withWriter((w) => w.readSubscription('s2' as SubscriptionId))
    ).orThrow()!;
    expect(record.baseline).toEqual([]);
    expect(record.disposed.map((d) => d.updateId)).toEqual([base]);
    expect(committed(f.repository, 'updates')).toBe(updates - 1);
  });

  test('the disposed history is joined at open exactly like acknowledgements', async () => {
    const f = await fixture();
    (await dispose(f.repository, [uid('t', 1, 'lifecycle')])).orThrow();
    const ids = committed(f.repository, 'acknowledgement-ids');
    const repository = await reopened(f);
    expect(await owedIds(repository)).toEqual([]);
    expect(consumerEntry(repository)).toEqual({ used: 1, reserved: 0 });
    expect(committed(repository, 'acknowledgement-ids')).toBe(ids);
    expect(await repository.prunableTasks({ limit: 10 })).toSucceedWith(['t' as TaskId]);
  });
});

describe('pruning and archive', () => {
  test('a disposed update is prunable; pruning releases its payload and keeps the task', async () => {
    const { repository } = await fixture();
    expect(await repository.prunableTasks({ limit: 10 })).toSucceedWith([]);
    (await dispose(repository, [uid('t', 1, 'lifecycle')])).orThrow();
    expect(await repository.prunableTasks({ limit: 10 })).toSucceedWith(['t' as TaskId]);
    const resident = committed(repository, 'resident-payload-bytes');
    const pruned = (await repository.withWriter((w) => w.pruneTask('t' as TaskId))).orThrow();
    expect(pruned.recordType === 'resolved' && pruned.updates).toEqual([]);
    expect(committed(repository, 'resident-payload-bytes')).toBeLessThan(resident);
    expect(await repository.prunableTasks({ limit: 10 })).toSucceedWith([]);
    // Nothing left to prune: returned unchanged, not rewritten.
    const again = (await repository.withWriter((w) => w.pruneTask('t' as TaskId))).orThrow();
    expect(again.recordRevision).toBe(pruned.recordRevision);
  });

  test('pruning drops only what every audience member discharged', async () => {
    const { repository } = await fixture();
    await subscribeTo(repository, 's2', [A]);
    await change(repository, 't', { lifecycle: succeeded });
    // t:1:0 is s1's alone; t:2:0 is owed to s1 and s2.
    (await dispose(repository, [uid('t', 1, 'lifecycle'), uid('t', 2, 'lifecycle')])).orThrow();
    const pruned = (await repository.withWriter((w) => w.pruneTask('t' as TaskId))).orThrow();
    expect(pruned.recordType === 'resolved' && pruned.updates.map((u) => u.id)).toEqual([
      uid('t', 2, 'lifecycle')
    ]);
    expect(await repository.prunableTasks({ limit: 10 })).toSucceedWith([]);
  });

  test('pruning a missing, quarantined or unresolved task', async () => {
    const { repository } = await fixture();
    expect(await repository.withWriter((w) => w.pruneTask('nope' as TaskId))).toFailWithDetail(
      /no live task/i,
      expect.objectContaining({ code: 'not-found-or-denied' })
    );
    expect(await repository.withWriter((w) => w.pruneTask('not an id' as TaskId))).toFailWithDetail(
      /pruneTask/i,
      expect.objectContaining({ code: 'invalid' })
    );
  });

  test('archive is refused while anything is owed, and succeeds after the evidence and pruning', async () => {
    const { repository } = await fixture();
    await change(repository, 't', { lifecycle: succeeded });
    // An archive that would keep an owed update, or drop one without evidence, is refused.
    expect(await archive(repository, true)).toFailWithDetail(
      /still owed/i,
      expect.objectContaining({ code: 'retention-blocked' })
    );
    expect(await archive(repository)).toFailWithDetail(
      /still owed to subscription s1/i,
      expect.objectContaining({ code: 'retention-blocked' })
    );
    (await dispose(repository, [uid('t', 1, 'lifecycle'), uid('t', 2, 'lifecycle')])).orThrow();
    const nonArchived = committed(repository, 'non-archived-tasks');
    expect(await archive(repository)).toSucceed();
    expect(committed(repository, 'non-archived-tasks')).toBe(nonArchived - 1);
    expect((await recordOf(repository)).updates).toEqual([]);
  });

  test('archive is refused while a subscription is still owed a baseline for the task', async () => {
    const f = await fixture();
    await change(f.repository, 't', { lifecycle: succeeded });
    (await dispose(f.repository, [uid('t', 1, 'lifecycle'), uid('t', 2, 'lifecycle')])).orThrow();
    const current = await recordOf(f.repository);
    const base = baselineUpdateId('t' as TaskId, current.task.envelope.revision);
    (
      await f.repository.withWriter((w) =>
        w.registerSubscription({
          subscriptionId: 's2' as SubscriptionId,
          operationId: 'op-s2' as OperationId,
          principalKey: 'host',
          specification: {
            consumerId: 'consumer-s2' as ConsumerId,
            selection: { scopes: [A], lifecycleClass: 'all' },
            start: 'current',
            policy: {
              schemaVersion: 1,
              durability: 'session',
              history: 'observed-state',
              categories: ['attention', 'lifecycle', 'result'],
              coalesceProgress: false
            }
          },
          baseline: [
            {
              id: base,
              taskId: 't' as TaskId,
              revision: current.task.envelope.revision,
              category: 'result',
              required: true,
              snapshot: { envelope: current.task.envelope },
              audience: ['s2' as SubscriptionId]
            }
          ],
          createdAt: at as Instant
        })
      )
    ).orThrow();
    expect(await archive(f.repository)).toFailWithDetail(
      /still owed a baseline/i,
      expect.objectContaining({ code: 'retention-blocked' })
    );
    (
      await f.repository.withWriter((w) =>
        w.disposeObligations({
          subscriptionId: 's2' as SubscriptionId,
          expectedRecordRevision: 1,
          updateIds: [base],
          reason: 'retired'
        })
      )
    ).orThrow();
    expect(await archive(f.repository)).toSucceed();
  });

  test('a corrupt checkpoint blocks pruning and fences, rather than being skipped', async () => {
    const f = await fixture();
    (await dispose(f.repository, [uid('t', 1, 'lifecycle')])).orThrow();
    f.store.fault = 'garbage';
    expect(await f.repository.withWriter((w) => w.pruneTask('t' as TaskId))).toFailWithDetail(
      /./,
      expect.objectContaining({ code: 'storage-corrupt' })
    );
    expect(f.repository.health().state).toBe('unavailable');
  });
});

describe('subscription closure at the storage boundary', () => {
  test('retain: the subscription leaves every audience; what it is owed stays owed and drainable', async () => {
    const { repository } = await fixture();
    const before = inspectRepository(repository)!.ledger.entry('consumer:s1')!.reserved['record-bytes'];
    const closed = (await close(repository, 'retain')).orThrow();
    expect(closed.state).toBe('closed');
    expect(repository.subscription(s1)).toSucceedAndSatisfy((d) => expect(d!.state).toBe('closed'));
    // Its future-unit reservation is released.
    expect(inspectRepository(repository)!.ledger.entry('consumer:s1')!.reserved['record-bytes']).toBeLessThan(
      before
    );
    // No new update is owed to it.
    await change(repository, 't', { title: 'changed' });
    expect(await owedIds(repository)).toEqual([uid('t', 1, 'lifecycle')]);
    // What it retained drains: issue and acknowledge still work.
    await issue(repository, 'd1', [uid('t', 1, 'lifecycle')]);
    await acknowledge(repository, 'd1');
    expect(await owedIds(repository)).toEqual([]);
    // Owed nothing and holding no open receipt, it releases its preparation reservation.
    const record = (await repository.withWriter((w) => w.readSubscription(s1))).orThrow()!;
    const preparation = record.capacityClaims.find((c) => c.purpose === 'receipt-preparation')!;
    expect(preparation.charges.every((c) => c.amount === 0)).toBe(true);
  });

  test('retain on a closed subscription changes nothing; its id is never reused', async () => {
    const { repository } = await fixture();
    (await close(repository, 'retain')).orThrow();
    const revision = revisionOf(repository);
    expect(await close(repository, 'retain')).toSucceed();
    expect(revisionOf(repository)).toBe(revision);
    expect(await subscribeTo(repository, 's1', [A]).catch((e: Error) => e.message)).toMatch(/never reused/i);
  });

  test('dispose: every owed id is disposed, open receipts go, acknowledged ones stay for replay', async () => {
    const { repository } = await fixture();
    await change(repository, 't', { title: 'second' });
    await issue(repository, 'd1', [uid('t', 1, 'lifecycle')]);
    await acknowledge(repository, 'd1');
    await issue(repository, 'd2', [uid('t', 2, 'lifecycle')]);
    const ids = committed(repository, 'acknowledgement-ids');
    const closed = (await close(repository, 'dispose', 'consumer retired')).orThrow();
    expect(closed.state).toBe('closed');
    expect(closed.issued.map((m) => m.deliveryId)).toEqual(['d1']);
    expect(closed.acknowledged).toEqual([uid('t', 1, 'lifecycle')]);
    expect(closed.disposed).toEqual([{ updateId: uid('t', 2, 'lifecycle'), reason: 'consumer retired' }]);
    expect(await owedIds(repository)).toEqual([]);
    expect(committed(repository, 'acknowledgement-ids')).toBe(ids);
    // Dispose on a closed subscription that owes nothing is a no-op.
    const revision = revisionOf(repository);
    expect(await close(repository, 'dispose', 'again')).toSucceed();
    expect(revisionOf(repository)).toBe(revision);
  });

  test('dispose on a retained closed subscription ends what it kept', async () => {
    const { repository } = await fixture();
    (await close(repository, 'retain')).orThrow();
    expect(await owedIds(repository)).toEqual([uid('t', 1, 'lifecycle')]);
    const closed = (await close(repository, 'dispose', 'finally')).orThrow();
    expect(closed.disposed.map((d) => d.updateId)).toEqual([uid('t', 1, 'lifecycle')]);
    expect(await owedIds(repository)).toEqual([]);
  });

  test('dispose requires its reason', async () => {
    const { repository } = await fixture();
    expect(await close(repository, 'dispose')).toFailWithDetail(
      /requires the disposition reason/i,
      expect.objectContaining({ code: 'invalid' })
    );
    expect(await close(repository, 'retain', 'x'.repeat(1000))).toFailWithDetail(
      /over the bound/i,
      expect.objectContaining({ code: 'invalid' })
    );
  });

  test('a closed subscription stays closed, owed and out of audiences across reopen', async () => {
    const f = await fixture();
    (await close(f.repository, 'retain')).orThrow();
    const repository = await reopened(f);
    expect(repository.subscription(s1)).toSucceedAndSatisfy((d) => expect(d!.state).toBe('closed'));
    expect(await owedIds(repository)).toEqual([uid('t', 1, 'lifecycle')]);
    expect(repository.audience(undefined, (await recordOf(repository)).task.envelope, 'lifecycle')).toEqual(
      []
    );
    // Draining after the restart releases the preparation, and that too survives a restart.
    await issue(repository, 'd1', [uid('t', 1, 'lifecycle')]);
    await acknowledge(repository, 'd1');
    const again = await reopened({ ...f, repository });
    expect(await owedIds(again)).toEqual([]);
  });
});
