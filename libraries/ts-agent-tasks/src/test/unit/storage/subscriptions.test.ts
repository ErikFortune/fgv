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
  IResolvedTaskRecordDraft,
  ITaskConsumerRecord,
  ITaskRepository,
  ITaskScope,
  ITaskSubscriptionRegistration,
  ITaskUpdate,
  Instant,
  OperationId,
  SubscriptionId,
  TaskId,
  TaskRepositoryOpenResult,
  TaskResult,
  TaskRevision,
  UpdateId,
  allUpdateCategories,
  taskUpdateId
} from '../../../index';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { inspectRepository } from '../../../packlets/storage/internals';
import { FaultyRoot } from '../../helpers/faultyRoot';
import { addTask, change, scope, shapedRegistration, subscribeTo } from '../../helpers/queryFixtures';
import { at, memoryRoot, params } from '../../helpers/storageFixtures';

const A = scope('alpha');
const B = scope('beta');
const later = (minutes: number): Instant =>
  new Date(Date.parse(at) + minutes * 60000).toISOString() as Instant;
const uid = (task: string, revision: number, category: Parameters<typeof taskUpdateId>[2]): UpdateId =>
  taskUpdateId(task as TaskId, revision as TaskRevision, category);

function registration(
  id: string,
  scopes: ReadonlyArray<ITaskScope> = [A],
  extra?: Partial<ITaskSubscriptionRegistration>
): ITaskSubscriptionRegistration {
  return {
    subscriptionId: id as SubscriptionId,
    operationId: `op-subscribe-${id}` as OperationId,
    principalKey: 'host',
    specification: {
      consumerId: `consumer-${id}` as ConsumerId,
      selection: { scopes, lifecycleClass: 'all' },
      start: 'from-now',
      policy: {
        schemaVersion: 1,
        durability: 'session',
        history: 'observed-state',
        categories: [...allUpdateCategories].sort()
      }
    },
    baseline: [],
    createdAt: at as Instant,
    ...extra
  };
}

async function faultyRepository(): Promise<{ root: FaultyRoot; repository: ITaskRepository }> {
  const root = new FaultyRoot(memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem);
  return { root, repository: (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow() };
}

async function register(
  repository: ITaskRepository,
  r: ITaskSubscriptionRegistration
): Promise<TaskResult<ITaskConsumerRecord>> {
  return repository.withWriter((w) => w.registerSubscription(r));
}

async function reopened(root: FileTree.IFileTreeDirectoryItem): Promise<TaskRepositoryOpenResult> {
  return (await FileTreeTaskRepository.open(params(root, 'session'))).orThrow();
}

function readyOf(opened: TaskRepositoryOpenResult): ITaskRepository {
  if (opened.state !== 'ready') {
    throw new Error(`not ready: ${JSON.stringify(opened.recovery.report.issues)}`);
  }
  return opened.repository;
}

/** The issue codes and messages of an open that required recovery; `[]` when it opened ready. */
function codes(opened: TaskRepositoryOpenResult): string[] {
  if (opened.state !== 'recovery-required') {
    opened.repository.close();
    return [];
  }
  opened.recovery.close();
  return opened.recovery.report.issues.map((i) => `${i.code}: ${i.message}`);
}

function held(repository: ITaskRepository, dimension: string): number {
  const row = repository
    .capacityStatus()
    .orThrow()
    .dimensions.find((d) => d.dimension === dimension)!;
  return row.used + row.reserved;
}

async function owedIds(repository: ITaskRepository, id: string): Promise<string[]> {
  return (await repository.listOwed({ subscription: id as SubscriptionId }))
    .orThrow()
    .updates.map((u) => u.id);
}

describe('subscription registration: the ordered inventory protocol', () => {
  test('a record write that fails cleanly leaves a pending, inactive subscription holding its reservation; a retry resumes', async () => {
    const { root, repository } = await faultyRepository();
    root.faults.push({ name: 'consumer-s1.json', when: 'before', visibility: 'unchanged' });
    expect(await register(repository, registration('s1'))).toFailWithDetail(
      /before anything became visible/i,
      expect.objectContaining({ code: 'storage-unavailable', retry: 'safe' })
    );
    expect(repository.health().state).toBe('ready');
    expect(repository.subscription('s1' as SubscriptionId)).toSucceedWith(undefined);
    // The pending entry owns the activation reservation.
    expect(held(repository, 'subscriptions')).toBe(1);
    const pending = inspectRepository(repository)!.book.pending.get('s1' as SubscriptionId)!;
    expect(pending.capacityClaims.map((c) => [c.purpose, c.ownership, c.disposition])).toEqual([
      ['subscription-activation', 'pending', 'reserved']
    ]);
    // Inactive: a commit now owes it nothing.
    await addTask(repository, 't', { scopes: [A] });
    const committed = (await repository.readCommit('t' as TaskId)).orThrow()!;
    expect(
      committed.recordType === 'resolved' && committed.updates.every((u) => u.audience.length === 0)
    ).toBe(true);
    // A different registration of the same id conflicts; the same one resumes, keeping the claim id.
    expect(await register(repository, registration('s1', [B]))).toFailWithDetail(
      /different registration of this subscription is pending/i,
      expect.objectContaining({ code: 'conflict' })
    );
    const record = (await register(repository, registration('s1'))).orThrow();
    expect(record.capacityClaims.find((c) => c.purpose === 'subscription-activation')!.claimId).toBe(
      pending.capacityClaims[0].claimId
    );
    expect(held(repository, 'subscriptions')).toBe(1);
    // Active from now on.
    await addTask(repository, 'u', { scopes: [A] });
    expect(await owedIds(repository, 's1')).toEqual([uid('u', 1, 'lifecycle')]);
  });

  test('a crash before the record landed reopens pending and inactive, with the reservation held', async () => {
    const { root, repository } = await faultyRepository();
    root.faults.push({ name: 'consumer-s1.json', when: 'before', visibility: 'unknown' });
    expect(await register(repository, registration('s1'))).toFailWithDetail(
      /may have landed/i,
      expect.objectContaining({ code: 'commit-indeterminate', operationId: 'op-subscribe-s1' })
    );
    expect(repository.health().state).toBe('unavailable');
    repository.close().orThrow();
    const opened = await reopened(root);
    const r = readyOf(opened);
    expect(r.report.pendingSubscriptions).toEqual([{ subscriptionId: 's1', operationId: 'op-subscribe-s1' }]);
    expect(r.report.issues).toEqual([
      expect.objectContaining({ code: 'pending-registration', severity: 'advisory' })
    ]);
    expect(held(r, 'subscriptions')).toBe(1);
    const reserved = held(r, 'logical-bytes');
    await addTask(r, 't', { scopes: [A] });
    expect((await r.readCommit('t' as TaskId)).orThrow()!.recordType === 'resolved').toBe(true);
    expect(await owedIds(r, 's1')).toEqual([]);
    // The retry completes it, charging nothing twice.
    const before = held(r, 'subscriptions');
    (await register(r, registration('s1'))).orThrow();
    expect(held(r, 'subscriptions')).toBe(before);
    expect(held(r, 'logical-bytes')).toBeGreaterThan(reserved);
    r.close();
  });

  test('a crash after the record landed completes the registration at the next open', async () => {
    const { root, repository } = await faultyRepository();
    // Already live before the crash: at reopen its inventory entry is left exactly as it was.
    await register(repository, registration('s0'));
    root.faults.push({ name: 'consumer-s1.json', when: 'after', visibility: 'unknown' });
    expect(await register(repository, registration('s1'))).toFail();
    repository.close().orThrow();
    const r = readyOf(await reopened(root));
    expect(r.report.completedSubscriptions).toEqual(['s1']);
    expect(r.subscription('s1' as SubscriptionId)).toSucceedAndSatisfy((s) =>
      expect(s?.recordRevision).toBe(1)
    );
    expect(r.subscription('s0' as SubscriptionId)).toSucceedAndSatisfy((s) =>
      expect(s?.recordRevision).toBe(1)
    );
    await addTask(r, 't', { scopes: [A] });
    expect(await owedIds(r, 's1')).toEqual([uid('t', 1, 'lifecycle')]);
    r.close();
  });

  test('a manifest that fails to go live after the record landed: the retry adopts the landed record', async () => {
    const { root, repository } = await faultyRepository();
    root.faults.push({ name: 'repository.json', when: 'before', visibility: 'unchanged', skip: 1 });
    expect(await register(repository, registration('s1'))).toFailWithDetail(
      /before anything became visible/i,
      expect.objectContaining({ code: 'storage-unavailable' })
    );
    root.clearWrites();
    (await register(repository, registration('s1'))).orThrow();
    // No second record write: only the manifest went live.
    expect(root.writes).toEqual(['repository.json']);
    expect(repository.subscription('s1' as SubscriptionId)).toSucceedAndSatisfy((s) =>
      expect(s).toBeDefined()
    );
  });

  test('a record at the name that is not this registration is refused on resume and left alone', async () => {
    const { root, repository } = await faultyRepository();
    root.faults.push({ name: 'repository.json', when: 'before', visibility: 'unchanged', skip: 1 });
    expect(await register(repository, registration('s1'))).toFail();
    const landed = JSON.parse(
      (
        root.inner
          .getChildren()
          .orThrow()
          .find((c) => c.name === 'consumer-s1.json') as FileTree.IFileTreeFileItem
      )
        .getRawContents()
        .orThrow()
    );
    root.inner
      .writeChildAtomically('consumer-s1.json', JSON.stringify({ ...landed, recordRevision: 2 }), {
        guarantee: 'session'
      })
      .orThrow();
    expect(await register(repository, registration('s1'))).toFailWithDetail(
      /not this registration's first record \(it is record revision 2\)/i,
      expect.objectContaining({ code: 'conflict' })
    );
  });

  test('a landed first record whose baseline was altered is never adopted — on resume or at open', async () => {
    const { root, repository } = await faultyRepository();
    await addTask(repository, 't', { scopes: [A] });
    const commit = (await repository.readCommit('t' as TaskId)).orThrow()!;
    const envelope = commit.recordType === 'resolved' ? commit.task.envelope : (undefined as never);
    const request: ITaskSubscriptionRegistration = {
      ...registration('s1'),
      specification: { ...registration('s1').specification, start: 'current' },
      baseline: [
        {
          id: 't:1:initial' as UpdateId,
          taskId: 't' as TaskId,
          revision: 1 as TaskRevision,
          category: 'lifecycle',
          required: true,
          snapshot: { envelope },
          audience: ['s1' as SubscriptionId]
        }
      ]
    };
    // The record lands; the manifest never goes live.
    root.faults.push({ name: 'repository.json', when: 'before', visibility: 'unchanged', skip: 1 });
    expect(await register(repository, request)).toFail();
    const file = (): FileTree.IFileTreeFileItem =>
      root.inner
        .getChildren()
        .orThrow()
        .find((c) => c.name === 'consumer-s1.json') as FileTree.IFileTreeFileItem;
    const landed = JSON.parse(file().getRawContents().orThrow());
    // Same identity, same revision, same claims — only the baseline's payload is forged.
    const forged = {
      ...landed,
      baseline: [
        {
          ...landed.baseline[0],
          snapshot: { envelope: { ...landed.baseline[0].snapshot.envelope, title: 'forged' } }
        }
      ]
    };
    root.inner
      .writeChildAtomically('consumer-s1.json', JSON.stringify(forged), { guarantee: 'session' })
      .orThrow();
    expect(await register(repository, request)).toFailWithDetail(
      /its contents are not the first record this registration committed to write/i,
      expect.objectContaining({ code: 'conflict' })
    );
    expect(repository.subscription('s1' as SubscriptionId)).toSucceedWith(undefined);
    repository.close().orThrow();
    expect(codes(await reopened(root))).toEqual([
      expect.stringMatching(/integrity: .*not its first record: its contents are not the first record/)
    ]);
  });

  test('a resume whose record never landed commits to its own first record before writing it', async () => {
    const { root, repository } = await faultyRepository();
    root.faults.push({ name: 'consumer-s1.json', when: 'before', visibility: 'unchanged' });
    expect(await register(repository, registration('s1'))).toFail();
    const before = inspectRepository(repository)!.book.pending.get('s1' as SubscriptionId)!.recordFingerprint;
    const record = (await register(repository, registration('s1'))).orThrow();
    // The retry minted a new preparation claim, so its first record — and the fingerprint the pending
    // entry committed to before writing it — differ from the first attempt's.
    expect(record.capacityClaims.length).toBe(2);
    expect(before).toMatch(/^\d+:[0-9a-f]+$/);
    repository.close().orThrow();
    expect(
      readyOf(await reopened(root))
        .subscription('s1' as SubscriptionId)
        .orThrow()?.id
    ).toBe('s1');
  });

  test('a live subscription replays its registration and refuses another', async () => {
    const { repository } = await faultyRepository();
    const first = (await register(repository, registration('s1'))).orThrow();
    expect(await register(repository, registration('s1'))).toSucceedWith(first);
    expect(await register(repository, registration('s1', [B]))).toFailWithDetail(
      /already registered by a different operation or specification/i,
      expect.objectContaining({ code: 'conflict' })
    );
  });

  test('a registration request that does not convert is invalid', async () => {
    const { repository } = await faultyRepository();
    expect(await register(repository, { ...registration('s1'), extra: 1 } as never)).toFailWithDetail(
      /registerSubscription/i,
      expect.objectContaining({ code: 'invalid' })
    );
  });

  test('a baseline must be the committed current state of tasks the selection matches', async () => {
    const { repository } = await faultyRepository();
    await addTask(repository, 't', { scopes: [A] });
    await addTask(repository, 'b', { scopes: [B] });
    const current = (await repository.readCommit('t' as TaskId)).orThrow()!;
    const envelope = current.recordType === 'resolved' ? current.task.envelope : (undefined as never);
    const baseline = (overrides: Record<string, unknown> = {}): ITaskSubscriptionRegistration => ({
      ...registration('s1'),
      specification: { ...registration('s1').specification, start: 'current' },
      baseline: [
        {
          id: `t:1:initial` as UpdateId,
          taskId: 't' as TaskId,
          revision: 1 as TaskRevision,
          category: 'lifecycle',
          required: true,
          snapshot: { envelope },
          audience: ['s1' as SubscriptionId],
          ...overrides
        }
      ]
    });
    expect(
      await register(repository, baseline({ snapshot: { envelope: { ...envelope, title: 'forged' } } }))
    ).toFailWithDetail(/not its current committed state/i, expect.objectContaining({ code: 'invalid' }));
    expect(
      await register(
        repository,
        baseline({ taskId: 'x', id: 'x:1:initial', snapshot: { envelope: { ...envelope, id: 'x' } } })
      )
    ).toFailWithDetail(/not a live, non-archived task/i, expect.objectContaining({ code: 'invalid' }));
    expect(await register(repository, baseline({ required: false }))).toFailWithDetail(
      /not a baseline obligation/i,
      expect.objectContaining({ code: 'invalid' })
    );
    const b = (await repository.readCommit('b' as TaskId)).orThrow()!;
    expect(
      await register(repository, {
        ...baseline(),
        baseline: [
          baseline().baseline[0],
          {
            ...baseline().baseline[0],
            id: 'b:1:initial' as UpdateId,
            taskId: 'b' as TaskId,
            snapshot: { envelope: b.recordType === 'resolved' ? b.task.envelope : envelope }
          }
        ]
      })
    ).toFailWithDetail(/not in the subscription's selection/i, expect.objectContaining({ code: 'invalid' }));
    expect(
      await register(repository, {
        ...baseline(),
        baseline: [baseline().baseline[0], baseline().baseline[0]]
      })
    ).toFailWithDetail(/appears twice/i, expect.objectContaining({ code: 'invalid' }));
    expect(
      await register(repository, { ...registration('s1'), baseline: baseline().baseline })
    ).toFailWithDetail(
      /from-now subscription has no baseline/i,
      expect.objectContaining({ code: 'invalid' })
    );
    expect(await register(repository, baseline())).toSucceed();
  });

  test('a baseline given in any order is stored in id order', async () => {
    const { repository } = await faultyRepository();
    await addTask(repository, 't', { scopes: [A] });
    await addTask(repository, 'a', { scopes: [A] });
    const entry = async (id: string): Promise<ITaskUpdate> => {
      const commit = (await repository.readCommit(id as TaskId)).orThrow()!;
      const envelope = commit.recordType === 'resolved' ? commit.task.envelope : (undefined as never);
      return {
        id: `${id}:1:initial` as UpdateId,
        taskId: id as TaskId,
        revision: 1 as TaskRevision,
        category: 'lifecycle',
        required: true,
        snapshot: { envelope },
        audience: ['s1' as SubscriptionId]
      };
    };
    const record = (
      await register(repository, {
        ...registration('s1'),
        specification: { ...registration('s1').specification, start: 'current' },
        baseline: [await entry('t'), await entry('a')]
      })
    ).orThrow();
    expect(record.baseline.map((b) => b.id)).toEqual(['a:1:initial', 't:1:initial']);
  });
});

describe('every commit names exactly the audience the repository computes', () => {
  let repository: ITaskRepository;
  beforeEach(async () => {
    ({ repository } = await faultyRepository());
    await subscribeTo(repository, 's1', [A]);
    await subscribeTo(repository, 'b1', [B]);
  });

  test('a registration that leaves out a subscription owed its update is refused', async () => {
    const request = shapedRegistration('t', { scopes: [A] });
    const record = request.record as IResolvedTaskRecordDraft;
    expect(
      await repository.withWriter((w) =>
        w.register({ ...request, record: { ...record, updates: [{ ...record.updates[0], audience: [] }] } })
      )
    ).toFailWithDetail(
      /names audience \[\], but the subscriptions owed it are \[s1\]/i,
      expect.objectContaining({ code: 'invalid' })
    );
  });

  test('a commit that owes an update to a subscription not owed it is refused', async () => {
    await addTask(repository, 't', { scopes: [A] });
    const current = (await repository.readCommit('t' as TaskId)).orThrow()!;
    const record = current.recordType === 'resolved' ? current : (undefined as never);
    const env = { ...record.task.envelope, revision: 2 as TaskRevision, title: 'renamed' };
    expect(
      await repository.withWriter((w) =>
        w.commit({
          purpose: 'operation',
          operationId: 'op-rename' as OperationId,
          taskId: 't' as TaskId,
          expectedRevision: 1 as TaskRevision,
          expectedRecordRevision: record.recordRevision,
          record: {
            recordType: 'resolved',
            task: { envelope: env, details: record.task.details },
            operations: [
              ...record.operations,
              {
                type: 'catalog',
                operationId: 'op-rename' as OperationId,
                operation: 'update-tracked',
                request: { rename: true },
                principalKey: 'host',
                receipt: null
              }
            ],
            updates: [
              ...record.updates,
              {
                id: uid('t', 2, 'progress'),
                taskId: 't' as TaskId,
                revision: 2 as TaskRevision,
                category: 'progress',
                required: false,
                snapshot: { envelope: env },
                audience: ['s1', 'b1'] as SubscriptionId[]
              }
            ],
            archived: false
          }
        })
      )
    ).toFailWithDetail(
      /but the subscriptions owed it are \[s1\]/i,
      expect.objectContaining({ code: 'invalid' })
    );
  });

  test('a stored update naming a subscription that is not live blocks open', async () => {
    const root = memoryRoot();
    const r = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
    await subscribeTo(r, 's1', [A]);
    await addTask(r, 't', { scopes: [A] });
    r.close().orThrow();
    const manifestFile = root
      .getChildren()
      .orThrow()
      .find((c) => c.name === 'repository.json') as FileTree.IFileTreeFileItem;
    const manifest = JSON.parse(manifestFile.getRawContents().orThrow());
    (root as FileTree.IAtomicFileTreeDirectoryItem)
      .writeChildAtomically('repository.json', JSON.stringify({ ...manifest, consumers: [] }), {
        guarantee: 'session'
      })
      .orThrow();
    const opened = await reopened(root);
    expect(opened.state).toBe('recovery-required');
    if (opened.state === 'recovery-required') {
      expect(opened.recovery.report.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'integrity',
            message: expect.stringMatching(/names s1, which is not a live subscription/)
          })
        ])
      );
      opened.recovery.close();
    }
  });
});

/** Commits a non-required progress update owed to `s1`, optionally dropping earlier progress. */
async function progressCommit(
  repository: ITaskRepository,
  revision: number,
  drop: boolean
): Promise<TaskResult<unknown>> {
  const current = (await repository.readCommit('t' as TaskId)).orThrow()!;
  const record = current.recordType === 'resolved' ? current : (undefined as never);
  const env = { ...record.task.envelope, revision: revision as TaskRevision, title: `rev ${revision}` };
  const operationId = `op-progress-${revision}` as OperationId;
  return repository.withWriter((w) =>
    w.commit({
      purpose: 'operation',
      operationId,
      taskId: 't' as TaskId,
      expectedRevision: (revision - 1) as TaskRevision,
      expectedRecordRevision: record.recordRevision,
      record: {
        recordType: 'resolved',
        task: { envelope: env, details: record.task.details },
        operations: [
          ...record.operations,
          {
            type: 'catalog',
            operationId,
            operation: 'update-tracked',
            request: { revision },
            principalKey: 'host',
            receipt: null
          }
        ],
        updates: [
          ...record.updates.filter((u) => !(drop && u.category === 'progress')),
          {
            id: uid('t', revision, 'progress'),
            taskId: 't' as TaskId,
            revision: revision as TaskRevision,
            category: 'progress',
            required: false,
            snapshot: { envelope: env },
            audience: ['s1'] as SubscriptionId[]
          }
        ],
        archived: false
      }
    })
  );
}

describe('issued receipts at the storage boundary', () => {
  let repository: ITaskRepository;
  beforeEach(async () => {
    ({ repository } = await faultyRepository());
    await subscribeTo(repository, 's1', [A]);
    await addTask(repository, 't', { scopes: [A] });
    await addTask(repository, 'u', { scopes: [B] });
  });

  const receipt = (
    deliveryId: string | undefined,
    included: Array<{ taskId: string; revision: number; updateIds: string[] }>
  ): never => ({ version: 1, ...(deliveryId !== undefined ? { deliveryId } : {}), included } as never);

  async function issue(
    r: unknown,
    expected: number = 1,
    expiresAt: Instant = later(60)
  ): Promise<TaskResult<ITaskConsumerRecord>> {
    return repository.withWriter((w) =>
      w.issueReceipt({
        subscriptionId: 's1' as SubscriptionId,
        expectedRecordRevision: expected,
        receipt: r as never,
        issuedAt: at as Instant,
        expiresAt
      })
    );
  }

  test('only an owed or acknowledged id of the entry it is in can be issued', async () => {
    expect(await issue(receipt(undefined, []))).toFailWithDetail(
      /snapshot receipt/i,
      expect.objectContaining({ code: 'invalid' })
    );
    expect(await issue(receipt('d1', []), 1, at as Instant)).toFailWithDetail(
      /expire no later/i,
      expect.objectContaining({ code: 'invalid' })
    );
    expect(
      await issue(receipt('d1', [{ taskId: 't', revision: 1, updateIds: [uid('t', 2, 'lifecycle')] }]))
    ).toFailWithDetail(/does not belong to t@1/i, expect.objectContaining({ code: 'invalid-receipt' }));
    expect(
      await issue(receipt('d1', [{ taskId: 'u', revision: 1, updateIds: [uid('u', 1, 'lifecycle')] }]))
    ).toFailWithDetail(
      /not owed to this subscription/i,
      expect.objectContaining({ code: 'invalid-receipt' })
    );
    expect(await issue(receipt('d1', []), 7)).toFailWithDetail(
      /expected record 7, found 1/i,
      expect.objectContaining({ code: 'conflict' })
    );
    expect(await issue({ nonsense: true })).toFailWithDetail(
      /issueReceipt/i,
      expect.objectContaining({ code: 'invalid' })
    );
    const issued = (
      await issue(receipt('d1', [{ taskId: 't', revision: 1, updateIds: [uid('t', 1, 'lifecycle')] }]))
    ).orThrow();
    expect(issued.issued.map((m) => m.deliveryId)).toEqual(['d1']);
    expect(await issue(receipt('d1', []), 2)).toFailWithDetail(
      /already issued/i,
      expect.objectContaining({ code: 'conflict' })
    );
  });

  test('a start-current subscription refuses an entry naming an ordinary id that was never owed', async () => {
    const { repository: r } = await faultyRepository();
    await addTask(r, 't', { scopes: [A] });
    const current = (await r.readCommit('t' as TaskId)).orThrow()!;
    const envelope = current.recordType === 'resolved' ? current.task.envelope : (undefined as never);
    (
      await register(r, {
        ...registration('s2', [A]),
        specification: { ...registration('s2', [A]).specification, start: 'current' },
        baseline: [
          {
            id: 't:1:initial' as UpdateId,
            taskId: 't' as TaskId,
            revision: 1 as TaskRevision,
            category: 'lifecycle',
            required: true,
            snapshot: { envelope },
            audience: ['s2' as SubscriptionId]
          }
        ]
      })
    ).orThrow();
    expect(
      await r.withWriter((w) =>
        w.issueReceipt({
          subscriptionId: 's2' as SubscriptionId,
          expectedRecordRevision: 1,
          receipt: {
            version: 1,
            deliveryId: 'd9',
            included: [{ taskId: 'nope', revision: 1, updateIds: [uid('nope', 1, 'lifecycle')] }]
          } as never,
          issuedAt: at as Instant,
          expiresAt: later(60)
        })
      )
    ).toFailWithDetail(
      /not owed to this subscription/i,
      expect.objectContaining({ code: 'invalid-receipt' })
    );
  });

  test('a manifest over the issued-receipt bound is refused', async () => {
    const r = (
      await FileTreeTaskRepository.initialize(
        params(memoryRoot(), 'session', {
          profile: {
            ...repository.profile,
            encoded: { ...repository.profile.encoded, maxIssuedReceiptBytes: 200 }
          }
        })
      )
    ).orThrow();
    await subscribeTo(r, 's1', [A]);
    await addTask(r, 't', { scopes: [A] });
    expect(
      await r.withWriter((w) =>
        w.issueReceipt({
          subscriptionId: 's1' as SubscriptionId,
          expectedRecordRevision: 1,
          receipt: receipt('d1', [{ taskId: 't', revision: 1, updateIds: [uid('t', 1, 'lifecycle')] }]),
          issuedAt: at as Instant,
          expiresAt: later(60)
        })
      )
    ).toFailWithDetail(/over the bound of 200/i, expect.objectContaining({ code: 'invalid' }));
  });

  test('acknowledgement is by issued delivery id, unexpired, of ids still owed', async () => {
    (
      await issue(receipt('d1', [{ taskId: 't', revision: 1, updateIds: [uid('t', 1, 'lifecycle')] }]))
    ).orThrow();
    const ack = (
      when: Instant,
      deliveryId: string = 'd1',
      expected: number = 2
    ): Promise<TaskResult<unknown>> =>
      repository.withWriter((w) =>
        w.acknowledgeReceipt({
          subscriptionId: 's1' as SubscriptionId,
          expectedRecordRevision: expected,
          deliveryId: deliveryId as DeliveryId,
          at: when
        })
      );
    expect(await ack(at as Instant, 'nope')).toFailWithDetail(
      /no issued receipt nope/i,
      expect.objectContaining({ code: 'invalid-receipt' })
    );
    expect(await ack(later(60))).toFailWithDetail(
      /expired/i,
      expect.objectContaining({ code: 'invalid-receipt' })
    );
    expect(await ack(at as Instant, 'd1', 1)).toFailWithDetail(
      /expected record 1/i,
      expect.objectContaining({ code: 'conflict' })
    );
    expect(await repository.withWriter((w) => w.acknowledgeReceipt({} as never))).toFailWithDetail(
      /acknowledgeReceipt/i,
      expect.objectContaining({ code: 'invalid' })
    );
    expect(
      await repository.withWriter((w) =>
        w.acknowledgeReceipt({
          subscriptionId: 'nobody' as SubscriptionId,
          expectedRecordRevision: 1,
          deliveryId: 'd1' as DeliveryId,
          at: at as Instant
        })
      )
    ).toFailWithDetail(/no live subscription/i, expect.objectContaining({ code: 'not-found-or-denied' }));
    expect(await ack(at as Instant)).toSucceedAndSatisfy((c) =>
      expect(c).toEqual(expect.objectContaining({ newlyAcknowledged: [uid('t', 1, 'lifecycle')] }))
    );
    // A replay writes nothing.
    expect(await ack(at as Instant, 'd1', 3)).toSucceedAndSatisfy((c) =>
      expect(c).toEqual(
        expect.objectContaining({ newlyAcknowledged: [], alreadyAcknowledged: [uid('t', 1, 'lifecycle')] })
      )
    );
    expect(repository.subscription('s1' as SubscriptionId)).toSucceedAndSatisfy((s) =>
      expect(s?.recordRevision).toBe(3)
    );
    // The next commit of the task does not revive the acknowledged link, and a rebuild keeps it satisfied.
    await change(repository, 't', { title: 'renamed' });
    expect(await owedIds(repository, 's1')).toEqual([uid('t', 2, 'lifecycle')]);
    (await repository.rebuildIndexes()).orThrow();
    expect(await owedIds(repository, 's1')).toEqual([uid('t', 2, 'lifecycle')]);
    expect(inspectRepository(repository)!.evidence.consumerPassReads).toBe(1);
  });

  // A non-required update may be dropped by any commit (coalescing); the drop releases its owed
  // link without acknowledging it, so a manifest that already named it can no longer be honoured.
  test('an owed update a later commit drops is released, and a receipt that named it is refused', async () => {
    expect(await progressCommit(repository, 2, false)).toSucceed();
    (
      await issue(receipt('d1', [{ taskId: 't', revision: 2, updateIds: [uid('t', 2, 'progress')] }]))
    ).orThrow();
    const owedBefore: number = held(repository, 'acknowledgement-ids');
    expect(await progressCommit(repository, 3, true)).toSucceed();
    expect(await owedIds(repository, 's1')).toEqual([uid('t', 1, 'lifecycle'), uid('t', 3, 'progress')]);
    // One link released, one added: the subscription's owed reservation is unchanged in size.
    expect(held(repository, 'acknowledgement-ids')).toBe(owedBefore);
    expect(
      await repository.withWriter((w) =>
        w.acknowledgeReceipt({
          subscriptionId: 's1' as SubscriptionId,
          expectedRecordRevision: 2,
          deliveryId: 'd1' as DeliveryId,
          at: at as Instant
        })
      )
    ).toFailWithDetail(
      /names t:2:\S+, which subscription s1 is not owed/i,
      expect.objectContaining({ code: 'invalid-receipt' })
    );
  });

  test("a subscription owed nothing cannot issue another subscription's owed update", async () => {
    await subscribeTo(repository, 's2', [B]);
    expect(
      await repository.withWriter((w) =>
        w.issueReceipt({
          subscriptionId: 's2' as SubscriptionId,
          expectedRecordRevision: 1,
          receipt: receipt('d1', [{ taskId: 't', revision: 1, updateIds: [uid('t', 1, 'lifecycle')] }]),
          issuedAt: at as Instant,
          expiresAt: later(60)
        })
      )
    ).toFailWithDetail(/t:1:0/i, expect.objectContaining({ code: 'invalid-receipt' }));
  });

  test('a drop releases its owed link inside admission: drop-and-add fits a subscription at its limit', async () => {
    // s1 covers open `t` (1 unit × 7 categories) and is owed t:1:0 and t:2:progress: a commitment of 9.
    const r = (
      await FileTreeTaskRepository.initialize(
        params(memoryRoot(), 'session', {
          profile: {
            ...repository.profile,
            perOwner: { ...repository.profile.perOwner, maxAcknowledgementIdsPerSubscription: 9 }
          }
        })
      )
    ).orThrow();
    await subscribeTo(r, 's1', [A]);
    await addTask(r, 't', { scopes: [A] });
    expect(await progressCommit(r, 2, false)).toSucceed();
    expect(inspectRepository(r)!.ledger.entry('consumer:s1')!.perOwner!.amount).toBe(9);
    // Adding one more without dropping would exceed it ...
    expect(await progressCommit(r, 3, false)).toFailWithDetail(
      /over its limit of 9/i,
      expect.objectContaining({ code: 'backpressure' })
    );
    // ... while dropping the earlier progress releases a link in the same commit.
    expect(await progressCommit(r, 3, true)).toSucceed();
    expect(inspectRepository(r)!.ledger.entry('consumer:s1')!.perOwner!.amount).toBe(9);
  });

  test('abandonment removes exactly one manifest', async () => {
    (
      await issue(receipt('d1', [{ taskId: 't', revision: 1, updateIds: [uid('t', 1, 'lifecycle')] }]))
    ).orThrow();
    const abandon = (deliveryId: string, expected: number): Promise<TaskResult<ITaskConsumerRecord>> =>
      repository.withWriter((w) =>
        w.abandonReceipt({
          subscriptionId: 's1' as SubscriptionId,
          expectedRecordRevision: expected,
          deliveryId: deliveryId as DeliveryId
        })
      );
    expect(await abandon('nope', 2)).toFailWithDetail(
      /no issued receipt nope/i,
      expect.objectContaining({ code: 'invalid-receipt' })
    );
    expect(await repository.withWriter((w) => w.abandonReceipt({} as never))).toFailWithDetail(
      /abandonReceipt/i,
      expect.objectContaining({ code: 'invalid' })
    );
    expect((await abandon('d1', 2)).orThrow().issued).toEqual([]);
    expect(await owedIds(repository, 's1')).toEqual([uid('t', 1, 'lifecycle')]);
  });

  test('reads through the writer', async () => {
    expect(
      await repository.withWriter((w) => w.readSubscription('s1' as SubscriptionId))
    ).toSucceedAndSatisfy((r) => expect(r?.id).toBe('s1'));
    expect(await repository.withWriter((w) => w.readSubscription('nobody' as SubscriptionId))).toSucceedWith(
      undefined
    );
    expect(
      await repository.withWriter((w) => w.readSubscription('bad id' as SubscriptionId))
    ).toFailWithDetail(/readSubscription/i, expect.objectContaining({ code: 'invalid' }));
    expect(repository.subscription('bad id' as SubscriptionId)).toFailWithDetail(
      /subscription/i,
      expect.objectContaining({ code: 'invalid' })
    );
  });
});

describe('subscription records at open', () => {
  async function tampered(
    edit: (record: Record<string, unknown>) => Record<string, unknown>
  ): Promise<TaskRepositoryOpenResult> {
    const root = memoryRoot();
    const r = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
    await subscribeTo(r, 's1', [A]);
    r.close().orThrow();
    const file = root
      .getChildren()
      .orThrow()
      .find((c) => c.name === 'consumer-s1.json') as FileTree.IFileTreeFileItem;
    const record = JSON.parse(file.getRawContents().orThrow());
    (root as FileTree.IAtomicFileTreeDirectoryItem)
      .writeChildAtomically('consumer-s1.json', JSON.stringify(edit(record)), { guarantee: 'session' })
      .orThrow();
    return reopened(root);
  }

  test('a preparation claim that does not match the manifests blocks', async () => {
    expect(
      codes(
        await tampered((record) => ({
          ...record,
          capacityClaims: (record.capacityClaims as Array<Record<string, unknown>>).map((c) =>
            c.purpose === 'receipt-preparation'
              ? {
                  ...c,
                  charges: [
                    { dimension: 'record-bytes', amount: 1 },
                    { dimension: 'logical-bytes', amount: 1 }
                  ]
                }
              : c
          )
        }))
      )
    ).toEqual([expect.stringMatching(/integrity: .*receipt-preparation claim reserves exactly/)]);
  });

  test('an activation claim that is not consumed blocks', async () => {
    expect(
      codes(
        await tampered((record) => ({
          ...record,
          capacityClaims: (record.capacityClaims as Array<Record<string, unknown>>).map((c) =>
            c.purpose === 'subscription-activation' ? { ...c, disposition: 'reserved' } : c
          )
        }))
      )
    ).toEqual([expect.stringMatching(/integrity: .*disposition 'reserved', expected 'consumed'/)]);
  });

  test('a claim owned by someone else, or a missing claim, blocks', async () => {
    expect(
      codes(
        await tampered((record) => ({
          ...record,
          capacityClaims: (record.capacityClaims as Array<Record<string, unknown>>).map((c) =>
            c.purpose === 'receipt-preparation'
              ? { ...c, owner: { owner: 'subscription', subscriptionId: 'other' } }
              : c
          )
        }))
      )
    ).toEqual([expect.stringMatching(/integrity: .*not owned by subscription s1/)]);
    expect(
      codes(
        await tampered((record) => ({
          ...record,
          capacityClaims: (record.capacityClaims as Array<Record<string, unknown>>).filter(
            (c) => c.purpose !== 'receipt-preparation'
          )
        }))
      )
    ).toEqual([
      expect.stringMatching(/integrity: .*exactly one activation and one receipt-preparation claim/)
    ]);
    expect(
      codes(
        await tampered((record) => ({
          ...record,
          capacityClaims: (record.capacityClaims as Array<Record<string, unknown>>).map((c) =>
            c.purpose === 'receipt-preparation' ? { ...c, ownership: 'pending' } : c
          )
        }))
      )
    ).toEqual([expect.stringMatching(/integrity: .*ownership 'pending', expected 'live'/)]);
  });

  test('a record over its byte ceiling blocks before it is trusted', async () => {
    const root = memoryRoot();
    const profile = (await FileTreeTaskRepository.initialize(params(memoryRoot(), 'session'))).orThrow()
      .profile;
    const r = (
      await FileTreeTaskRepository.initialize(
        params(root, 'session', {
          profile: { ...profile, encoded: { ...profile.encoded, maxConsumerRecordBytes: 70000 } }
        })
      )
    ).orThrow();
    await subscribeTo(r, 's1', [A]);
    r.close().orThrow();
    const file = root
      .getChildren()
      .orThrow()
      .find((c) => c.name === 'consumer-s1.json') as FileTree.IFileTreeFileItem;
    const record = JSON.parse(file.getRawContents().orThrow());
    (root as FileTree.IAtomicFileTreeDirectoryItem)
      .writeChildAtomically(
        'consumer-s1.json',
        JSON.stringify({
          ...record,
          acknowledged: Array.from({ length: 5000 }, (__, i) => `x${String(i).padStart(8, '0')}:1:0`)
        }),
        { guarantee: 'session' }
      )
      .orThrow();
    expect(codes(await reopened(root))).toEqual([
      expect.stringMatching(/record-invalid: consumer-s1\.json: \d+ bytes exceeds its ceiling/)
    ]);
  });

  test('a pending entry whose claims are wrong, or whose present record is another, blocks', async () => {
    const root = new FaultyRoot(memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem);
    const r = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
    root.faults.push({ name: 'consumer-s1.json', when: 'before', visibility: 'unchanged' });
    expect(await register(r, registration('s1'))).toFail();
    r.close().orThrow();
    const manifestFile = root.inner
      .getChildren()
      .orThrow()
      .find((c) => c.name === 'repository.json') as FileTree.IFileTreeFileItem;
    const manifest = JSON.parse(manifestFile.getRawContents().orThrow());
    const write = (name: string, value: unknown): void => {
      root.inner.writeChildAtomically(name, JSON.stringify(value), { guarantee: 'session' }).orThrow();
    };
    write('repository.json', {
      ...manifest,
      consumers: manifest.consumers.map((e: Record<string, unknown>) => ({
        ...e,
        capacityClaims: (e.capacityClaims as Array<Record<string, unknown>>).map((c) => ({
          ...c,
          disposition: 'consumed'
        }))
      }))
    });
    expect(codes(await reopened(root))).toEqual([
      expect.stringMatching(/integrity: .*pending registration: .*expected 'reserved'/)
    ]);
    write('repository.json', manifest);
    // Another subscription's first record, at this name.
    const other = (await FileTreeTaskRepository.initialize(params(memoryRoot(), 'session'))).orThrow();
    const stray = (await register(other, registration('s1', [B]))).orThrow();
    write('consumer-s1.json', stray);
    expect(codes(await reopened(root))).toEqual([
      expect.stringMatching(/integrity: .*not its first record: its contents are not the first record/)
    ]);
    write('consumer-s1.json', {
      ...stray,
      ...{ selection: registration('s1').specification.selection },
      capacityClaims: stray.capacityClaims
    });
    expect(codes(await reopened(root))).toEqual([
      expect.stringMatching(/integrity: .*its contents are not the first record/)
    ]);
  });

  test('a stored update owed to more subscriptions than the profile allows blocks', async () => {
    const root = memoryRoot();
    const r = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
    await subscribeTo(r, 's1', [A]);
    await addTask(r, 't', { scopes: [A] });
    const profile = r.profile;
    r.close().orThrow();
    const manifestFile = root
      .getChildren()
      .orThrow()
      .find((c) => c.name === 'repository.json') as FileTree.IFileTreeFileItem;
    const manifest = JSON.parse(manifestFile.getRawContents().orThrow());
    (root as FileTree.IAtomicFileTreeDirectoryItem)
      .writeChildAtomically(
        'repository.json',
        JSON.stringify({
          ...manifest,
          profile: { ...profile, perOwner: { ...profile.perOwner, maxAudiencePerUpdate: 0 } }
        }),
        { guarantee: 'session' }
      )
      .orThrow();
    expect(codes(await reopened(root)).join('\n')).toMatch(
      /audience subscriptions, over 0|maxAudiencePerUpdate/
    );
  });

  test('a stored update owed to more subscriptions than a validly-lowered profile allows blocks (checkAudiences itself)', async () => {
    // Unlike the test above — whose limit of 0 fails the profile's own converter before
    // checkAudiences ever runs — this lowers to a still-valid 1, so the record-level audience
    // check is the one that actually refuses it.
    const root = memoryRoot();
    const r = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
    await subscribeTo(r, 's1', [A]);
    await subscribeTo(r, 's2', [A]);
    await addTask(r, 't', { scopes: [A] });
    const profile = r.profile;
    r.close().orThrow();
    const manifestFile = root
      .getChildren()
      .orThrow()
      .find((c) => c.name === 'repository.json') as FileTree.IFileTreeFileItem;
    const manifest = JSON.parse(manifestFile.getRawContents().orThrow());
    (root as FileTree.IAtomicFileTreeDirectoryItem)
      .writeChildAtomically(
        'repository.json',
        JSON.stringify({
          ...manifest,
          profile: { ...profile, perOwner: { ...profile.perOwner, maxAudiencePerUpdate: 1 } }
        }),
        { guarantee: 'session' }
      )
      .orThrow();
    expect(codes(await reopened(root))).toEqual([
      expect.stringMatching(/record-invalid: .*names 2 audience subscriptions, over 1/)
    ]);
  });

  test('a pending entry whose claim count is wrong (not merely its disposition) blocks', async () => {
    const root = new FaultyRoot(memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem);
    const r = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
    root.faults.push({ name: 'consumer-s1.json', when: 'before', visibility: 'unchanged' });
    expect(await register(r, registration('s1'))).toFail();
    r.close().orThrow();
    const manifestFile = root.inner
      .getChildren()
      .orThrow()
      .find((c) => c.name === 'repository.json') as FileTree.IFileTreeFileItem;
    const manifest = JSON.parse(manifestFile.getRawContents().orThrow());
    const write = (name: string, value: unknown): void => {
      root.inner.writeChildAtomically(name, JSON.stringify(value), { guarantee: 'session' }).orThrow();
    };
    write('repository.json', {
      ...manifest,
      consumers: manifest.consumers.map((e: Record<string, unknown>) => ({
        ...e,
        // A second activation claim under a different id, rather than merely mis-disposing the
        // one claim, breaks the pending shape check itself.
        capacityClaims: (e.capacityClaims as Array<Record<string, unknown>>).concat(
          (e.capacityClaims as Array<Record<string, unknown>>).map((c) => ({
            ...c,
            claimId: `${c.claimId}-2`
          }))
        )
      }))
    });
    expect(codes(await reopened(root))).toEqual([
      expect.stringMatching(/integrity: .*pending subscription holds exactly its activation claim/)
    ]);
  });

  test('a live receipt-preparation claim whose charges are exact but whose disposition is neither reserved nor indeterminate blocks', async () => {
    const root = memoryRoot();
    const r = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
    await subscribeTo(r, 's1', [A]);
    r.close().orThrow();
    const file = root
      .getChildren()
      .orThrow()
      .find((c) => c.name === 'consumer-s1.json') as FileTree.IFileTreeFileItem;
    const record = JSON.parse(file.getRawContents().orThrow());
    (root as FileTree.IAtomicFileTreeDirectoryItem)
      .writeChildAtomically(
        'consumer-s1.json',
        JSON.stringify({
          ...record,
          capacityClaims: (record.capacityClaims as Array<Record<string, unknown>>).map((c) =>
            c.purpose === 'receipt-preparation' ? { ...c, disposition: 'consumed' } : c
          )
        }),
        { guarantee: 'session' }
      )
      .orThrow();
    expect(codes(await reopened(root))).toEqual([
      expect.stringMatching(/integrity: .*a receipt-preparation claim reserves exactly/)
    ]);
  });

  test('a subscription whose acknowledgement history exceeds a lowered per-owner limit blocks at open', async () => {
    const root = memoryRoot();
    const r = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
    await subscribeTo(r, 's1', [A]);
    await addTask(r, 't', { scopes: [A] });
    (
      await r.withWriter((w) =>
        w.issueReceipt({
          subscriptionId: 's1' as SubscriptionId,
          expectedRecordRevision: 1,
          receipt: {
            version: 1,
            deliveryId: 'd1',
            included: [{ taskId: 't', revision: 1, updateIds: [uid('t', 1, 'lifecycle')] }]
          } as never,
          issuedAt: at as Instant,
          expiresAt: later(60)
        })
      )
    ).orThrow();
    (
      await r.withWriter((w) =>
        w.acknowledgeReceipt({
          subscriptionId: 's1' as SubscriptionId,
          expectedRecordRevision: 2,
          deliveryId: 'd1' as DeliveryId,
          at: at as Instant
        })
      )
    ).orThrow();
    const profile = r.profile;
    r.close().orThrow();
    const manifestFile = root
      .getChildren()
      .orThrow()
      .find((c) => c.name === 'repository.json') as FileTree.IFileTreeFileItem;
    const manifest = JSON.parse(manifestFile.getRawContents().orThrow());
    (root as FileTree.IAtomicFileTreeDirectoryItem)
      .writeChildAtomically(
        'repository.json',
        JSON.stringify({
          ...manifest,
          profile: { ...profile, perOwner: { ...profile.perOwner, maxAcknowledgementIdsPerSubscription: 1 } }
        }),
        { guarantee: 'session' }
      )
      .orThrow();
    expect(codes(await reopened(root)).join('\n')).toMatch(/acknowledgement-ids \(s1\)/);
  });
});
