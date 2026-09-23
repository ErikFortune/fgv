/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { FileTree } from '@fgv/ts-json-base';
import {
  FileTreeTaskRepository,
  ITaskCapacityDimensionStatus,
  ITaskCapacityProfile,
  ITaskCommitRecord,
  ITaskRepository,
  TaskId,
  TaskRevision,
  defaultTaskCapacityProfile
} from '../../../index';
import { FaultyRoot } from '../../helpers/faultyRoot';
import {
  catalogOp,
  memoryRoot,
  nextDraft,
  params,
  registration,
  unresolvedRegistration
} from '../../helpers/storageFixtures';

const rev = (n: number): TaskRevision => n as TaskRevision;

function profileWith(
  limits: Partial<ITaskCapacityProfile['limits']>,
  encoded?: Partial<ITaskCapacityProfile['encoded']>
): ITaskCapacityProfile {
  return {
    ...defaultTaskCapacityProfile,
    limits: { ...defaultTaskCapacityProfile.limits, ...limits },
    encoded: { ...defaultTaskCapacityProfile.encoded, ...encoded }
  };
}

function row(repository: ITaskRepository, dimension: string): ITaskCapacityDimensionStatus {
  return repository
    .capacityStatus()
    .orThrow()
    .dimensions.find((d) => d.dimension === dimension)!;
}

function committed(r: ITaskCapacityDimensionStatus): number {
  return r.used + r.reserved;
}

async function repositoryWith(
  profile: ITaskCapacityProfile,
  root?: FileTree.IFileTreeDirectoryItem
): Promise<ITaskRepository> {
  return (
    await FileTreeTaskRepository.initialize(params(root ?? memoryRoot(), 'session', { profile }))
  ).orThrow();
}

async function register(repository: ITaskRepository, id: string): ReturnType<ITaskRepository['readCommit']> {
  return repository.withWriter((w) => w.register(registration(id)));
}

async function finishAndArchive(repository: ITaskRepository, id: string): Promise<ITaskCommitRecord> {
  const taskId = id as TaskId;
  const current = (await repository.readCommit(taskId)).orThrow()!;
  const done = (
    await repository.withWriter((w) =>
      w.commit({
        purpose: 'operation',
        operationId: `op-done-${id}` as never,
        taskId,
        expectedRevision: rev(1),
        expectedRecordRevision: 1,
        record: nextDraft(current, {
          envelope: {
            revision: rev(2),
            lifecycle: { status: 'succeeded', outcome: { summary: 'ok', artifacts: [] } }
          },
          operation: catalogOp(`op-done-${id}`, 'update-tracked', {}),
          updates: ['result']
        })
      })
    )
  ).orThrow();
  return (
    await repository.withWriter((w) =>
      w.commit({
        purpose: 'operation',
        operationId: `op-archive-${id}` as never,
        taskId,
        expectedRevision: rev(2),
        expectedRecordRevision: 2,
        record: nextDraft(done, {
          envelope: { revision: rev(3) },
          operation: catalogOp(`op-archive-${id}`, 'archive', {}),
          archived: true
        })
      })
    )
  ).orThrow();
}

describe('capacity status', () => {
  test('a fresh repository reports every dimension exactly once, and is ok', async () => {
    const repository = await repositoryWith(defaultTaskCapacityProfile);
    expect(repository.capacityStatus()).toSucceedAndSatisfy((status) => {
      expect(status.state).toBe('ok');
      expect(status.dimensions).toHaveLength(11);
      expect(status.dimensions.find((d) => d.dimension === 'logical-bytes')?.limitingRecordIds).toEqual([
        'repository'
      ]);
    });
  });

  test('pressure is reported at 80% of a dimension, counting reservations', async () => {
    const repository = await repositoryWith(profileWith({ 'retained-tasks': 5 }));
    for (const id of ['a', 'b', 'c']) {
      expect(await register(repository, id)).toSucceed();
    }
    expect(repository.capacityStatus().orThrow().state).toBe('ok');
    expect(await register(repository, 'd')).toSucceed();
    expect(row(repository, 'retained-tasks').pressure).toBe(true);
    expect(repository.capacityStatus().orThrow().state).toBe('pressure');
  });
});

describe('limiting records', () => {
  test('are the largest contributors, ties broken by record id, so the report is deterministic', async () => {
    const repository = await repositoryWith(defaultTaskCapacityProfile);
    for (const id of ['m', 'c', 'x', 'a', 'q', 'k']) {
      expect(await register(repository, id)).toSucceed();
    }
    // Every task contributes one retained identity: a six-way tie, reported first five by id.
    expect(row(repository, 'retained-tasks').limitingRecordIds).toEqual(['a', 'c', 'k', 'm', 'q']);
  });
});

describe('admission — exact fit and one over', () => {
  test('retained identities: the last slot admits, one more is refused as a lifetime dimension', async () => {
    const repository = await repositoryWith(profileWith({ 'retained-tasks': 2 }));
    expect(await register(repository, 'a')).toSucceed();
    expect(await register(repository, 'b')).toSucceed();
    expect(repository.capacityStatus().orThrow().state).toBe('draining');
    expect(await register(repository, 'c')).toFailWithDetail(
      /'retained-tasks' would reach 3 of its limit of 2/i,
      {
        code: 'backpressure',
        retry: 'after-host-action',
        capacity: {
          reason: 'capacity-exhausted',
          dimension: 'retained-tasks',
          used: 2,
          reserved: 0,
          requested: 1,
          limit: 2,
          reclaimableByCleanup: false
        }
      }
    );
    // Archive does not recycle a retained identity.
    await finishAndArchive(repository, 'a');
    expect(await register(repository, 'c')).toFailWithDetail(/retained-tasks/i, expect.anything());
  });

  test('non-archived slots: refused at the limit, reclaimable by archive', async () => {
    const repository = await repositoryWith(profileWith({ 'non-archived-tasks': 1 }));
    expect(await register(repository, 'a')).toSucceed();
    expect(await register(repository, 'b')).toFailWithDetail(
      /non-archived-tasks/i,
      expect.objectContaining({
        code: 'backpressure',
        capacity: expect.objectContaining({ dimension: 'non-archived-tasks', reclaimableByCleanup: true })
      })
    );
    // At the ceiling, closeout still runs — it spends the task's own reservation.
    await finishAndArchive(repository, 'a');
    expect(await register(repository, 'b')).toSucceed();
  });

  test('encoded bytes: admission charges the widest state of the protocol; exact fit admits, one byte less refuses', async () => {
    // An unresolved registration is the largest single admission — both bundles — and the
    // profile converter requires the limit hold it, so it is the case with an exact fit.
    // Limits keep seven digits throughout, so the manifest encodes to the same length.
    const registerIn = async (
      limit: number
    ): Promise<{ repository: ITaskRepository; result: Awaited<ReturnType<typeof register>> }> => {
      const repository = await repositoryWith(profileWith({ 'logical-bytes': limit }));
      return {
        repository,
        result: await repository.withWriter((w) => w.register(unresolvedRegistration('a')))
      };
    };
    const probe = await registerIn(9999999);
    expect(probe.result).toSucceed();
    const settled: number = committed(row(probe.repository, 'logical-bytes'));

    // The settled footprint is *not* enough: while the record is written, the manifest still
    // holds the pending entry's request and claims. Admission is checked against that peak, so
    // no step of the protocol can overrun the budget it was admitted under.
    const atSettled = await registerIn(settled);
    expect(atSettled.result).toFailWith(/'logical-bytes' would reach (\d+) of its limit/i);
    const peak: number = Number(/would reach (\d+)/.exec(atSettled.result.message ?? '')?.[1]);
    expect(peak).toBeGreaterThan(settled);

    const fits = await registerIn(peak);
    expect(fits.result).toSucceed();
    expect(row(fits.repository, 'logical-bytes').available).toBe(peak - settled);

    const short = await registerIn(peak - 1);
    expect(short.result).toFailWithDetail(
      /logical-bytes/i,
      expect.objectContaining({
        capacity: expect.objectContaining({ dimension: 'logical-bytes', limit: peak - 1 })
      })
    );
    // Refused before anything was written: no pending entry holds a reservation.
    expect(row(short.repository, 'retained-tasks').used).toBe(0);
  });

  test('per-record bytes: a record plus its reserved growth must fit its own ceiling', async () => {
    // An unresolved registration carries the largest reservation a profile must hold (closeout
    // plus first resolution), so it is the one whose exact fit a valid profile can express.
    const registerUnresolved = async (repository: ITaskRepository): ReturnType<typeof register> =>
      repository.withWriter((w) => w.register(unresolvedRegistration('a')));
    const probe = await repositoryWith(profileWith({}, { maxTaskRecordBytes: 8000000 }));
    expect(await registerUnresolved(probe)).toSucceed();
    const recordRow = row(probe, 'record-bytes');
    expect(recordRow.limitingRecordIds).toEqual(['a']);
    const exact: number = committed(recordRow);

    const fits = await repositoryWith(profileWith({}, { maxTaskRecordBytes: exact }));
    expect(await registerUnresolved(fits)).toSucceed();
    const short = await repositoryWith(profileWith({}, { maxTaskRecordBytes: exact - 1 }));
    expect(await registerUnresolved(short)).toFailWithDetail(
      /record a would be \d+ bytes including its reserved growth/i,
      expect.objectContaining({
        capacity: expect.objectContaining({ dimension: 'record-bytes', recordId: 'a', limit: exact - 1 })
      })
    );
  });

  test('operations per task: ordinary work cannot spend the slots closeout needs', async () => {
    const repository = await repositoryWith({
      ...defaultTaskCapacityProfile,
      perOwner: { ...defaultTaskCapacityProfile.perOwner, maxOperationsPerTask: 4 }
    });
    let current = (await register(repository, 'a')).orThrow()!;
    const step = async (
      id: string,
      envelope: object,
      archived?: boolean
    ): Promise<ReturnType<ITaskRepository['readCommit']>> => {
      const revision: TaskRevision =
        current.recordType === 'resolved' ? current.task.envelope.revision : rev(1);
      return repository.withWriter((w) =>
        w.commit({
          purpose: 'operation',
          operationId: id as never,
          taskId: 'a' as TaskId,
          expectedRevision: revision,
          expectedRecordRevision: current.recordRevision,
          record: nextDraft(current, {
            envelope: { revision: rev(revision + 1), ...envelope },
            operation: catalogOp(id, archived === true ? 'archive' : 'update-tracked', {}),
            archived
          })
        })
      );
    };
    // 1 creation + 1 ordinary = 2 = 4 minus the two closeout slots.
    current = (await step('op-1', { title: 'one' })).orThrow()!;
    expect(await step('op-2', { title: 'two' })).toFailWithDetail(
      /would hold 3 operations; its limit is 4, of which 2 are held for closeout/i,
      expect.objectContaining({
        code: 'backpressure',
        capacity: expect.objectContaining({ dimension: 'operations', recordId: 'a', limit: 4 })
      })
    );
    // The terminal step and the archive still fit.
    current = (
      await step('op-done', { lifecycle: { status: 'succeeded', outcome: { summary: 'ok', artifacts: [] } } })
    ).orThrow()!;
    expect(await step('op-after', { title: 'late' })).toFailWithDetail(
      /of which 1 are held/i,
      expect.anything()
    );
    expect(await step('op-archive', {}, true)).toSucceed();
  });
});

describe('a valid repository at its ceiling', () => {
  test('reopens in drain mode, and closeout still completes', async () => {
    const root = memoryRoot();
    const profile = profileWith({ 'retained-tasks': 1 });
    const repository = await repositoryWith(profile, root);
    expect(await register(repository, 'a')).toSucceed();
    repository.close();

    const opened = (await FileTreeTaskRepository.open(params(root, 'session'))).orThrow();
    expect(opened.state).toBe('ready');
    if (opened.state === 'ready') {
      expect(opened.repository.capacityStatus().orThrow().state).toBe('draining');
      expect(await register(opened.repository, 'b')).toFailWithDetail(/retained-tasks/i, expect.anything());
      expect(await finishAndArchive(opened.repository, 'a')).toEqual(
        expect.objectContaining({ archived: true })
      );
    }
  });

  test('an indeterminate claim fences all growth, and says so', async () => {
    const root = memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem;
    const repository = await repositoryWith(defaultTaskCapacityProfile, root);
    const created = (await register(repository, 'a')).orThrow()!;
    repository.close();
    const ambiguous = {
      ...created,
      capacityClaims: created.capacityClaims.map((c) => ({ ...c, disposition: 'indeterminate' }))
    };
    root.writeChildAtomically('task-a.json', JSON.stringify(ambiguous), { guarantee: 'session' }).orThrow();

    const opened = (await FileTreeTaskRepository.open(params(root, 'session'))).orThrow();
    if (opened.state !== 'ready') {
      throw new Error('expected ready');
    }
    expect(opened.repository.capacityStatus().orThrow().state).toBe('admission-blocked');
    expect(await register(opened.repository, 'b')).toFailWithDetail(
      /fenced while a claim's consumption is indeterminate/i,
      expect.objectContaining({ code: 'backpressure' })
    );
  });
});

describe('raising limits', () => {
  test('raises atomically, is stored, and governs after reopen', async () => {
    const root = memoryRoot();
    const repository = await repositoryWith(profileWith({ 'retained-tasks': 1 }), root);
    expect(await register(repository, 'a')).toSucceed();
    const raised = profileWith({ 'retained-tasks': 3 });
    expect(await repository.withWriter((w) => w.raiseCapacityLimits(raised))).toSucceedWith(raised);
    expect(repository.profile).toEqual(raised);
    expect(await register(repository, 'b')).toSucceed();
    repository.close();
    const opened = (await FileTreeTaskRepository.open(params(root, 'session'))).orThrow();
    expect(opened.state === 'ready' && opened.repository.profile).toEqual(raised);
  });

  test('lowering anything in place is refused and changes nothing', async () => {
    const repository = await repositoryWith(defaultTaskCapacityProfile);
    for (const lowered of [
      profileWith({ 'retained-tasks': 9999 }),
      {
        ...defaultTaskCapacityProfile,
        perOwner: { ...defaultTaskCapacityProfile.perOwner, maxOperationsPerTask: 64 }
      },
      profileWith({}, { maxDetailBytes: 1024 })
    ]) {
      expect(await repository.withWriter((w) => w.raiseCapacityLimits(lowered))).toFailWithDetail(
        /lowering limits in place is unsupported/i,
        expect.objectContaining({ code: 'unsupported' })
      );
    }
    expect(
      await repository.withWriter((w) => w.raiseCapacityLimits({ bogus: true } as never))
    ).toFailWithDetail(/raiseCapacityLimits/i, expect.objectContaining({ code: 'invalid' }));
    expect(repository.profile).toEqual(defaultTaskCapacityProfile);
  });

  test('a limit increase whose write fails leaves the old policy in force, in memory and on disk', async () => {
    const inner = memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem;
    const root = new FaultyRoot(inner);
    const before = profileWith({ 'retained-tasks': 1 });
    const repository = await repositoryWith(before, root);
    root.faults.push({ name: 'repository.json', when: 'before', visibility: 'unchanged' });
    expect(
      await repository.withWriter((w) => w.raiseCapacityLimits(profileWith({ 'retained-tasks': 5 })))
    ).toFailWithDetail(
      /before anything became visible/i,
      expect.objectContaining({ code: 'storage-unavailable', retry: 'safe' })
    );
    expect(repository.profile).toEqual(before);
    expect(row(repository, 'retained-tasks').limit).toBe(1);
    repository.close();
    const opened = (await FileTreeTaskRepository.open(params(inner, 'session'))).orThrow();
    expect(opened.state === 'ready' && opened.repository.profile).toEqual(before);
  });

  test('a limit increase whose outcome is unknown fences the repository', async () => {
    const root = new FaultyRoot(memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem);
    const repository = await repositoryWith(defaultTaskCapacityProfile, root);
    root.faults.push({ name: 'repository.json', when: 'before', visibility: 'unknown', stage: 'replace' });
    expect(
      await repository.withWriter((w) => w.raiseCapacityLimits(profileWith({ 'retained-tasks': 20000 })))
    ).toFailWithDetail(
      /may have landed \(unknown\)/i,
      expect.objectContaining({ code: 'storage-unavailable', retry: 'reconcile-first' })
    );
    expect(repository.health().state).toBe('unavailable');
    expect(repository.capacityStatus()).toFailWith(/fenced/i);
  });

  test('a limit increase whose own manifest would not fit the policy it commits is refused before writing', async () => {
    // The manifest grows by the digits of the raised limit; with the inventory ceiling set just
    // above its current size, that growth must be caught at commit time, not at the next open.
    const probe = await repositoryWith(
      profileWith({ 'retained-tasks': 9999 }, { maxInventoryRecordBytes: 999 })
    );
    const size: number = row(probe, 'record-bytes').used;
    expect(String(size + 2)).toHaveLength(3);
    const tight = profileWith({ 'retained-tasks': 9999 }, { maxInventoryRecordBytes: size + 2 });
    const repository = await repositoryWith(tight);
    const raised = profileWith({ 'retained-tasks': 99999999 }, { maxInventoryRecordBytes: size + 2 });
    expect(await repository.withWriter((w) => w.raiseCapacityLimits(raised))).toFailWithDetail(
      /record repository would be \d+ bytes/i,
      expect.objectContaining({
        code: 'backpressure',
        capacity: expect.objectContaining({ dimension: 'record-bytes', recordId: 'repository' })
      })
    );
    expect(repository.profile).toEqual(tight);
  });

  test('initialize refuses a profile whose own manifest would not fit it', async () => {
    expect(
      await FileTreeTaskRepository.initialize(
        params(memoryRoot(), 'session', { profile: profileWith({}, { maxInventoryRecordBytes: 100 }) })
      )
    ).toFailWithDetail(
      /record repository would be \d+ bytes/i,
      expect.objectContaining({ code: 'backpressure' })
    );
  });
});
