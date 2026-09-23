/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { FileTree } from '@fgv/ts-json-base';
import { Logging, fail, succeed } from '@fgv/ts-utils';
import {
  FileTreeTaskRepository,
  ITaskCapacityDimensionStatus,
  ITaskRepository,
  ITaskRepositoryManifest,
  TaskEnvironment,
  TaskId
} from '../../../index';
import { FaultyRoot } from '../../helpers/faultyRoot';
import {
  catalogOp,
  memoryRoot,
  params,
  registration,
  registry,
  unresolvedRegistration
} from '../../helpers/storageFixtures';

function code(value: string): unknown {
  return expect.objectContaining({ code: value });
}

function manifestOf(root: FileTree.IFileTreeDirectoryItem): ITaskRepositoryManifest {
  const file = root
    .getChildren()
    .orThrow()
    .find((c) => c.name === 'repository.json') as FileTree.IFileTreeFileItem;
  return JSON.parse(file.getRawContents().orThrow()) as ITaskRepositoryManifest;
}

function hasFile(root: FileTree.IFileTreeDirectoryItem, name: string): boolean {
  return root
    .getChildren()
    .orThrow()
    .some((c) => c.name === name);
}

function row(repository: ITaskRepository, dimension: string): ITaskCapacityDimensionStatus {
  return repository
    .capacityStatus()
    .orThrow()
    .dimensions.find((d) => d.dimension === dimension)!;
}

async function open(root: FileTree.IFileTreeDirectoryItem): Promise<ITaskRepository> {
  const opened = (await FileTreeTaskRepository.open(params(root, 'session'))).orThrow();
  if (opened.state !== 'ready') {
    throw new Error(JSON.stringify(opened.recovery.report.issues));
  }
  return opened.repository;
}

describe('registration — the ordered inventory protocol', () => {
  let inner: FileTree.IAtomicFileTreeDirectoryItem;
  let root: FaultyRoot;
  let repository: ITaskRepository;

  beforeEach(async () => {
    inner = memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem;
    root = new FaultyRoot(inner);
    repository = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
    root.clearWrites();
  });

  test('writes pending entry, then record, then live entry — in that order', async () => {
    expect(await repository.withWriter((w) => w.register(registration('t1')))).toSucceedAndSatisfy(
      (record) => {
        expect(record.recordRevision).toBe(1);
        expect(record.capacityClaims.map((c) => [c.purpose, c.ownership, c.disposition])).toEqual([
          ['terminal-closeout', 'live', 'reserved']
        ]);
      }
    );
    expect(root.writes).toEqual(['repository.json', 'task-t1.json', 'repository.json']);
    // The live entry carries no request and no claims: the record owns them now.
    expect(manifestOf(inner).tasks).toEqual([{ id: 't1', state: 'live' }]);
    expect(await repository.read('t1' as TaskId)).toSucceedAndSatisfy((read) => {
      expect(read).toEqual(expect.objectContaining({ state: 'resolved', archived: false }));
    });
  });

  test('a failure before the pending entry is visible accepts nothing and charges nothing', async () => {
    const before = row(repository, 'retained-tasks');
    root.faults.push({ name: 'repository.json', when: 'before', visibility: 'unchanged' });
    expect(await repository.withWriter((w) => w.register(registration('t1')))).toFailWithDetail(
      /write failed before anything became visible/i,
      expect.objectContaining({ code: 'storage-unavailable', retry: 'safe', operationId: 'op-create-t1' })
    );
    expect(row(repository, 'retained-tasks')).toEqual(before);
    expect(manifestOf(inner).tasks).toEqual([]);
    expect(repository.health().state).toBe('ready');
    // And the retry is an ordinary first registration.
    expect(await repository.withWriter((w) => w.register(registration('t1')))).toSucceed();
  });

  test('pending entry committed, record write fails: reservations stay held, retry resumes with the same claim ids', async () => {
    root.faults.push({ name: 'task-t1.json', when: 'before', visibility: 'unchanged' });
    expect(await repository.withWriter((w) => w.register(registration('t1')))).toFailWithDetail(
      /before anything became visible/i,
      code('storage-unavailable')
    );
    const pending = manifestOf(inner).tasks[0];
    expect(pending.state).toBe('pending');
    const claimIds: ReadonlyArray<string> =
      pending.state === 'pending' ? pending.capacityClaims.map((c) => c.claimId) : [];
    expect(claimIds).toHaveLength(1);
    // The reservation is held by the pending entry: one retained identity, the closeout reserved.
    const reservedWhilePending: number = row(repository, 'updates').reserved;
    expect(reservedWhilePending).toBe(7);
    expect(row(repository, 'retained-tasks').used).toBe(1);
    // A pending registration is not an accepted task.
    expect(await repository.read('t1' as TaskId)).toSucceedWith(undefined);

    // Lost-response retry: the same operation and request resumes — no second mint, no second charge.
    expect(await repository.withWriter((w) => w.register(registration('t1')))).toSucceedAndSatisfy(
      (record) => {
        expect(record.capacityClaims.map((c) => c.claimId)).toEqual(claimIds);
      }
    );
    expect(row(repository, 'updates').reserved).toBe(reservedWhilePending);
    expect(row(repository, 'retained-tasks').used).toBe(1);
    expect(manifestOf(inner).tasks).toEqual([{ id: 't1', state: 'live' }]);
  });

  test('a pending registration survives reopen, still holding its reservation, and resumes', async () => {
    root.faults.push({ name: 'task-t1.json', when: 'before', visibility: 'unchanged' });
    await repository.withWriter((w) => w.register(registration('t1')));
    // The still-usable instance counts exactly what is on disk: the manifest that now carries
    // the pending entry, its request and its claims — the figure a reopen computes from scratch.
    const before = repository.capacityStatus().orThrow().dimensions;
    repository.close();

    const reopened = await open(inner);
    expect(reopened.capacityStatus().orThrow().dimensions).toEqual(before);
    expect(reopened.report.pendingRegistrations).toEqual([{ taskId: 't1', operationId: 'op-create-t1' }]);
    expect(reopened.report.issues).toEqual([
      expect.objectContaining({ code: 'pending-registration', severity: 'advisory' })
    ]);
    expect(row(reopened, 'updates').reserved).toBe(7);
    expect(await reopened.withWriter((w) => w.register(registration('t1')))).toSucceed();
    expect(row(reopened, 'updates').reserved).toBe(7);
    expect(row(reopened, 'retained-tasks').used).toBe(1);
  });

  test('a different registration of a pending identity is refused, and the reservation is not released', async () => {
    root.faults.push({ name: 'task-t1.json', when: 'before', visibility: 'unchanged' });
    await repository.withWriter((w) => w.register(registration('t1')));
    for (const other of [
      registration('t1', { operationId: 'op-other' }),
      registration('t1', { request: { taskId: 't1', title: 'something else' } })
    ]) {
      expect(await repository.withWriter((w) => w.register(other))).toFailWithDetail(
        /a different registration of this id is pending/i,
        code('conflict')
      );
    }
    expect(row(repository, 'updates').reserved).toBe(7);
  });

  test('record written, live entry lost: open completes the registration and counts the claim once', async () => {
    // The pending entry's write goes through; the live entry's does not.
    root.faults.push({ name: 'repository.json', when: 'before', visibility: 'unchanged', skip: 1 });
    expect(await repository.withWriter((w) => w.register(registration('t1')))).toFail();
    expect(hasFile(inner, 'task-t1.json')).toBe(true);
    expect(manifestOf(inner).tasks[0].state).toBe('pending');
    repository.close();

    const reopened = await open(inner);
    expect(reopened.report.completedRegistrations).toEqual(['t1']);
    expect(reopened.report.pendingRegistrations).toEqual([]);
    expect(manifestOf(inner).tasks).toEqual([{ id: 't1', state: 'live' }]);
    expect(row(reopened, 'updates').reserved).toBe(7);
    expect(row(reopened, 'retained-tasks').used).toBe(1);
    expect(await reopened.read('t1' as TaskId)).toSucceedAndSatisfy((read) => {
      expect(read?.state).toBe('resolved');
    });
  });

  test('an identity already live replays for the same operation, and is refused for any other', async () => {
    const first = (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
    const reserved: number = row(repository, 'updates').reserved;
    root.clearWrites();

    expect(await repository.withWriter((w) => w.register(registration('t1')))).toSucceedWith(first);
    // The replay re-establishes the flush boundary by rewriting the same bytes — and charges nothing.
    expect(root.writes).toEqual(['task-t1.json', 'repository.json']);
    expect(row(repository, 'updates').reserved).toBe(reserved);
    expect(row(repository, 'retained-tasks').used).toBe(1);

    expect(
      await repository.withWriter((w) => w.register(registration('t1', { operationId: 'op-2' })))
    ).toFailWithDetail(/already registered by a different operation or request/i, code('conflict'));
    expect(
      await repository.withWriter((w) =>
        w.register(registration('t1', { request: { taskId: 't1', changed: true } }))
      )
    ).toFailWithDetail(/already registered by a different/i, code('conflict'));
  });

  test('a failure after the record may have landed fences, carrying the operation id', async () => {
    root.faults.push({ name: 'task-t1.json', when: 'after', visibility: 'replaced' });
    expect(await repository.withWriter((w) => w.register(registration('t1')))).toFailWithDetail(
      /may have landed \(replaced\)/i,
      expect.objectContaining({
        code: 'commit-indeterminate',
        operationId: 'op-create-t1',
        retry: 'reconcile-first'
      })
    );
    expect(repository.health()).toEqual(
      expect.objectContaining({ state: 'unavailable', issues: [expect.stringMatching(/task-t1\.json/)] })
    );
    expect(await repository.read('t1' as TaskId)).toFailWithDetail(/fenced/i, code('storage-unavailable'));
    expect(await repository.withWriter(async (w) => w.readCommit('t1' as TaskId))).toFailWith(/fenced/i);
    repository.close();

    // Reopen reads what is actually on disk: the record landed, so open completes it.
    const reopened = await open(inner);
    expect(reopened.report.completedRegistrations).toEqual(['t1']);
  });

  test('a first record is only its creation: validated before anything is written', async () => {
    const valid = registration('t1');
    const cases: Array<[string, unknown, RegExp]> = [
      ['a record for another task', { ...valid, taskId: 't2' }, /the record describes t1/i],
      [
        'an extra operation',
        {
          ...valid,
          record: {
            ...valid.record,
            operations: [...valid.record.operations, catalogOp('x', 'update-tracked', {})]
          }
        },
        /exactly its creation operation/i
      ],
      [
        'a non-creation operation',
        {
          ...valid,
          record: {
            ...valid.record,
            operations: [catalogOp('op-create-t1', 'update-tracked', valid.request)]
          }
        },
        /not a creation operation/i
      ],
      ['a mismatched stored request', { ...valid, request: { other: 1 } }, /request differs/i],
      [
        'an archived first record',
        { ...valid, record: { ...valid.record, archived: true } },
        /only a terminal task can be archived|cannot be archived/i
      ],
      [
        'a caller-supplied claim',
        { ...valid, record: { ...valid.record, capacityClaims: [] } },
        /capacityClaims/i
      ],
      ['an invalid id', { ...valid, taskId: 'bad/id' }, /not a valid task id/i]
    ];
    for (const [, request, message] of cases) {
      expect(await repository.withWriter((w) => w.register(request as never))).toFailWithDetail(
        message,
        code('invalid')
      );
    }
    expect(root.writes).toEqual([]);
  });

  test('an unresolved external registration is created only by register-external', async () => {
    const valid = unresolvedRegistration('u1');
    const wrong = {
      ...valid,
      record: { ...valid.record, operations: [catalogOp('op-register-u1', 'create-tracked', valid.request)] }
    };
    expect(await repository.withWriter((w) => w.register(wrong as never))).toFailWithDetail(
      /only by 'register-external'/i,
      code('invalid')
    );
  });

  test('an unregistered kind cannot be registered', async () => {
    const root2 = memoryRoot();
    const repo = (
      await FileTreeTaskRepository.initialize(
        params(root2, 'session', { registry: registry({ withoutVendor: true }) })
      )
    ).orThrow();
    expect(await repo.withWriter((w) => w.register(unresolvedRegistration('u1')))).toFailWithDetail(
      /acme\.job@1 is not registered/i,
      code('unknown-kind-version')
    );
    const tracked = registration('t1');
    const vendor = {
      ...tracked,
      record: {
        ...tracked.record,
        task: {
          envelope: { ...(tracked.record as { task: { envelope: object } }).task.envelope, kind: 'acme.job' },
          details: { job: 'x' }
        }
      }
    };
    expect(await repo.withWriter((w) => w.register(vendor as never))).toFailWithDetail(
      /no registered task kind/i,
      code('unknown-kind-version')
    );
  });

  test('details go through the registered converter, and what it returns is what is stored', async () => {
    const tracked = registration('t1');
    const bad = {
      ...tracked,
      record: {
        ...tracked.record,
        task: { ...(tracked.record as { task: object }).task, details: { unexpected: 1 } }
      }
    };
    expect(await repository.withWriter((w) => w.register(bad as never))).toFailWithDetail(
      /unexpected/i,
      code('invalid')
    );
  });

  test('a parent must be a live task', async () => {
    expect(
      await repository.withWriter((w) =>
        w.register(registration('child', { envelope: { parentId: 'nobody' as TaskId } }))
      )
    ).toFailWithDetail(/parent nobody is not a live task/i, code('invalid'));
    expect(await repository.withWriter((w) => w.register(registration('parent')))).toSucceed();
    expect(
      await repository.withWriter((w) =>
        w.register(registration('child', { envelope: { parentId: 'parent' as TaskId } }))
      )
    ).toSucceed();
  });

  test('an unresolved registration reserves first resolution as well as closeout, and invents no lifecycle', async () => {
    expect(await repository.withWriter((w) => w.register(unresolvedRegistration('u1')))).toSucceedAndSatisfy(
      (record) => {
        expect(record.recordType).toBe('unresolved');
        expect(record.capacityClaims.map((c) => c.purpose)).toEqual([
          'terminal-closeout',
          'first-resolution'
        ]);
      }
    );
    expect(await repository.read('u1' as TaskId)).toSucceedAndSatisfy((read) => {
      expect(read?.state).toBe('unresolved');
      expect(read).not.toHaveProperty('task');
    });
    expect(row(repository, 'updates').reserved).toBe(14);
  });

  test('an identity mint failure refuses registration before anything is written', async () => {
    let calls: number = 0;
    const env = TaskEnvironment.create({
      logger: new Logging.InMemoryLogger(),
      clock: () => 0,
      newId: () => (++calls === 1 ? succeed('repo-1') : fail('entropy exhausted'))
    }).orThrow();
    const root2 = new FaultyRoot(memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem);
    const repo = (
      await FileTreeTaskRepository.initialize(params(root2, 'session', { environment: env }))
    ).orThrow();
    root2.clearWrites();
    expect(await repo.withWriter((w) => w.register(registration('t1')))).toFailWithDetail(
      /entropy exhausted/i,
      expect.objectContaining({ code: 'storage-unavailable', retry: 'safe' })
    );
    expect(root2.writes).toEqual([]);
  });
});
