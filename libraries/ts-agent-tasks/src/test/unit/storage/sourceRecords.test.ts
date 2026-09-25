/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { FileTree, JsonObject } from '@fgv/ts-json-base';
import {
  FileTreeTaskRepository,
  IResolvedTaskCommitRecord,
  IStoredTaskOperation,
  ITaskCapacityProfile,
  ITaskCommitRequest,
  ITaskRecoveryReport,
  ITaskSourceRecord,
  ITaskRepository,
  TaskRepositoryOpenResult,
  TaskResult,
  defaultTaskCapacityProfile
} from '../../../index';
import { op, rev, tid } from '../../helpers/brokerFixtures';
import {
  ISourceHarness,
  recordOf,
  registerJob,
  sourceHarness,
  sourceRegistry
} from '../../helpers/sourceFixtures';
import { environment } from '../../helpers/storageFixtures';

type Root = FileTree.IAtomicFileTreeDirectoryItem & FileTree.IMutableFileTreeDirectoryItem;

function readText(root: Root, name: string): string {
  const file = root
    .getChildren()
    .orThrow()
    .find((c) => c.name === name) as FileTree.IFileTreeFileItem;
  return file.getRawContents().orThrow();
}

function readJson(root: Root, name: string): JsonObject {
  return JSON.parse(readText(root, name)) as JsonObject;
}

function writeJson(root: Root, name: string, value: unknown): void {
  root.writeChildAtomically(name, JSON.stringify(value), { guarantee: 'session' }).orThrow();
}

async function reopen(h: ISourceHarness): Promise<TaskRepositoryOpenResult> {
  h.repository.close();
  return (
    await FileTreeTaskRepository.open({
      root: h.root,
      mode: 'session',
      environment: environment('r').env,
      registry: sourceRegistry(h.source)
    })
  ).orThrow();
}

function readyOf(opened: TaskRepositoryOpenResult): ITaskRepository {
  if (opened.state !== 'ready') {
    throw new Error(`expected ready: ${JSON.stringify(opened.recovery.report.issues)}`);
  }
  return opened.repository;
}

function blockedOf(opened: TaskRepositoryOpenResult): ITaskRecoveryReport {
  if (opened.state !== 'recovery-required') {
    throw new Error('expected a recovery handle');
  }
  opened.recovery.close();
  return opened.recovery.report;
}

describe('source checkpoint records', () => {
  test('creation charges one retained source, writes the record, then the live inventory entry', async () => {
    const h = await sourceHarness();
    expect(
      await h.repository.withWriter((w) =>
        w.commitSource({
          sourceId: 'exec',
          history: 'observed-state',
          expectedRecordRevision: 0,
          cursor: 'c1',
          pages: 1
        })
      )
    ).toSucceedWith({
      formatVersion: 1,
      id: 'exec',
      recordRevision: 1,
      history: 'observed-state',
      cursor: 'c1',
      pages: 1
    });
    const root = h.root as Root;
    expect(readJson(root, 'repository.json').sources).toEqual([{ id: 'exec', state: 'live' }]);
    expect(readJson(root, 'source-exec.json')).toEqual(
      expect.objectContaining({ id: 'exec', recordRevision: 1, cursor: 'c1' })
    );
    expect(
      h.repository
        .capacityStatus()
        .orThrow()
        .dimensions.find((d) => d.dimension === 'sources')?.used
    ).toBe(1);
  });

  test('replacement needs the current record revision, and a source keeps its history contract', async () => {
    const h = await sourceHarness();
    const commit = (
      expected: number,
      history: 'observed-state' | 'source-replay' = 'observed-state'
    ): Promise<TaskResult<ITaskSourceRecord>> =>
      h.repository.withWriter((w) =>
        w.commitSource({ sourceId: 'exec', history, expectedRecordRevision: expected, pages: 1 })
      );
    expect(await commit(0)).toSucceed();
    expect(await commit(0)).toFailWithDetail(/expected record 0, found 1/, {
      code: 'conflict',
      retry: 'reconcile-first'
    });
    expect(await commit(1, 'source-replay')).toFailWith(/history contract is fixed/);
    expect(await commit(1)).toSucceedAndSatisfy((record) => expect(record.recordRevision).toBe(2));
    expect(await h.repository.readSource('exec')).toSucceedAndSatisfy((record) =>
      expect(record?.recordRevision).toBe(2)
    );
    expect(await h.repository.readSource('nope')).toSucceedWith(undefined);
    expect(await h.repository.readSource('bad id!')).toFailWith(/source id/i);
  });

  test('a cursor over the stored profile’s bound, or a malformed source id, is refused', async () => {
    const profile: ITaskCapacityProfile = {
      ...defaultTaskCapacityProfile,
      encoded: { ...defaultTaskCapacityProfile.encoded, maxSourceCursorBytes: 8 }
    };
    const h = await sourceHarness({ profile });
    expect(
      await h.repository.withWriter((w) =>
        w.commitSource({
          sourceId: 'exec',
          history: 'observed-state',
          expectedRecordRevision: 0,
          cursor: 'x'.repeat(9),
          pages: 1
        })
      )
    ).toFailWith(/over the bound of 8/);
    expect(
      await h.repository.withWriter((w) =>
        w.commitSource({
          sourceId: 'bad id!',
          history: 'observed-state',
          expectedRecordRevision: 0,
          pages: 1
        })
      )
    ).toFailWith(/commitSource/);
    expect(
      await h.repository.withWriter((w) =>
        w.commitSource({
          sourceId: 'exec',
          history: 'sometimes' as never,
          expectedRecordRevision: 0,
          pages: 1
        })
      )
    ).toFailWith(/commitSource/);
  });

  test('a record left by a crash between the record and the manifest is adopted only if it is exactly this creation', async () => {
    const h = await sourceHarness();
    const root = h.root as Root;
    // Exactly the canonical text the repository writes: keys in canonical order.
    const creation = {
      cursor: 'c1',
      formatVersion: 1,
      history: 'observed-state',
      id: 'exec',
      pages: 1,
      recordRevision: 1
    };
    writeJson(root, 'source-exec.json', creation);
    // A different creation is refused, and the file is left untouched.
    expect(
      await h.repository.withWriter((w) =>
        w.commitSource({
          sourceId: 'exec',
          history: 'observed-state',
          expectedRecordRevision: 0,
          cursor: 'c2',
          pages: 1
        })
      )
    ).toFailWithDetail(/never committed it/, { code: 'conflict', retry: 'after-host-action' });
    expect(readJson(root, 'source-exec.json')).toEqual(creation);
    // The same creation adopts it.
    expect(
      await h.repository.withWriter((w) =>
        w.commitSource({
          sourceId: 'exec',
          history: 'observed-state',
          expectedRecordRevision: 0,
          cursor: 'c1',
          pages: 1
        })
      )
    ).toSucceed();
    expect(readJson(root, 'repository.json').sources).toEqual([{ id: 'exec', state: 'live' }]);
  });

  test('a committed record changed out of band fences the repository rather than being overwritten', async () => {
    const h = await sourceHarness();
    const root = h.root as Root;
    (
      await h.repository.withWriter((w) =>
        w.commitSource({
          sourceId: 'exec',
          history: 'observed-state',
          expectedRecordRevision: 0,
          cursor: 'c1',
          pages: 1
        })
      )
    ).orThrow();
    writeJson(root, 'source-exec.json', {
      formatVersion: 1,
      id: 'exec',
      recordRevision: 1,
      history: 'observed-state',
      cursor: 'EDITED',
      pages: 1
    });
    expect(
      await h.repository.withWriter((w) =>
        w.commitSource({
          sourceId: 'exec',
          history: 'observed-state',
          expectedRecordRevision: 1,
          cursor: 'c2',
          pages: 2
        })
      )
    ).toFailWithDetail(/differs from the one this repository committed/, {
      code: 'storage-corrupt',
      retry: 'after-host-action'
    });
    expect(readJson(root, 'source-exec.json').cursor).toBe('EDITED');
    expect(h.repository.health().state).toBe('unavailable');
  });

  test('open validates a source record in full, cursor bound included', async () => {
    const h = await sourceHarness();
    (
      await h.repository.withWriter((w) =>
        w.commitSource({
          sourceId: 'exec',
          history: 'observed-state',
          expectedRecordRevision: 0,
          cursor: 'c1',
          pages: 1
        })
      )
    ).orThrow();
    writeJson(h.root as Root, 'source-exec.json', {
      formatVersion: 1,
      id: 'exec',
      recordRevision: 1,
      history: 'observed-state',
      cursor: 'x'.repeat(4097),
      pages: 1
    });
    expect(blockedOf(await reopen(h)).issues).toEqual([expect.objectContaining({ code: 'record-invalid' })]);
  });

  test('open refuses a source record whose cursor is over the stored bound though under the converter ceiling', async () => {
    const profile: ITaskCapacityProfile = {
      ...defaultTaskCapacityProfile,
      encoded: { ...defaultTaskCapacityProfile.encoded, maxSourceCursorBytes: 8 }
    };
    const h = await sourceHarness({ profile });
    (
      await h.repository.withWriter((w) =>
        w.commitSource({
          sourceId: 'exec',
          history: 'observed-state',
          expectedRecordRevision: 0,
          cursor: 'c1',
          pages: 1
        })
      )
    ).orThrow();
    writeJson(h.root as Root, 'source-exec.json', {
      formatVersion: 1,
      id: 'exec',
      recordRevision: 1,
      history: 'observed-state',
      cursor: 'x'.repeat(9),
      pages: 1
    });
    h.repository.close();
    const opened = (
      await FileTreeTaskRepository.open({
        root: h.root,
        mode: 'session',
        environment: environment('r').env,
        registry: sourceRegistry(h.source)
      })
    ).orThrow();
    expect(blockedOf(opened).issues).toEqual([
      expect.objectContaining({
        code: 'record-invalid',
        message: expect.stringMatching(/over the bound of 8/)
      })
    ]);
  });
});

describe('execution claims survive a restart and are validated at open', () => {
  async function uncertain(): Promise<ISourceHarness> {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    h.executor.loseNextResponse = true;
    expect(
      await h.writer.execute({
        taskId: tid('j1'),
        operationId: op(),
        expectedRevision: rev(1),
        command: 'cancel',
        parameters: { reason: 'x' }
      })
    ).toSucceed();
    return h;
  }

  function editTask(h: ISourceHarness, edit: (record: JsonObject) => JsonObject): void {
    const root = h.root as Root;
    writeJson(root, 'task-j1.json', edit(readJson(root, 'task-j1.json')));
  }

  function claimsOf(record: JsonObject): JsonObject[] {
    return record.capacityClaims as JsonObject[];
  }

  test('an uncertain command and its reservation are rediscovered after reopen', async () => {
    const h = await uncertain();
    const repository = readyOf(await reopen(h));
    expect(await repository.unsettledCommands({ limit: 10 })).toSucceedWith([tid('j1')]);
    const record = (await repository.readCommit(tid('j1'))).orThrow() as IResolvedTaskCommitRecord;
    expect(
      record.capacityClaims.find((c) => c.purpose === 'accepted-operation-settlement')?.disposition
    ).toBe('reserved');
    // A rebuild reconstructs the same index.
    expect(await repository.rebuildIndexes()).toSucceed();
    expect(await repository.unsettledCommands({ limit: 10 })).toSucceedWith([tid('j1')]);
  });

  test.each<[string, (record: JsonObject) => JsonObject, RegExp]>([
    [
      'an unsettled command without its settlement claim',
      (r) => ({
        ...r,
        capacityClaims: claimsOf(r).filter((c) => c.purpose !== 'accepted-operation-settlement')
      }),
      /holds no settlement claim/
    ],
    [
      'a settlement claim consumed while its command is unsettled',
      (r) => ({
        ...r,
        capacityClaims: claimsOf(r).map((c) =>
          c.purpose === 'accepted-operation-settlement' ? { ...c, disposition: 'consumed' } : c
        )
      }),
      /disposition 'consumed', expected 'reserved'/
    ],
    [
      'a settlement claim naming a command the record does not hold',
      (r) => ({
        ...r,
        capacityClaims: claimsOf(r).map((c) =>
          c.purpose === 'accepted-operation-settlement'
            ? { ...c, operationId: 'ghost', owner: { ...(c.owner as JsonObject), operationId: 'ghost' } }
            : c
        )
      }),
      /which the record does not hold/
    ],
    [
      'a second settlement claim for one command',
      (r) => {
        const claim = claimsOf(r).find((c) => c.purpose === 'accepted-operation-settlement')!;
        return { ...r, capacityClaims: [...claimsOf(r), { ...claim, claimId: 'dup-1' }] };
      },
      /a second settlement claim/
    ],
    [
      'a settlement claim owned by another task',
      (r) => ({
        ...r,
        capacityClaims: claimsOf(r).map((c) =>
          c.purpose === 'accepted-operation-settlement'
            ? { ...c, owner: { ...(c.owner as JsonObject), taskId: 'other' } }
            : c
        )
      }),
      /not owned by an operation of task j1/
    ],
    [
      'a settlement claim still pending',
      (r) => ({
        ...r,
        capacityClaims: claimsOf(r).map((c) =>
          c.purpose === 'accepted-operation-settlement' ? { ...c, ownership: 'pending' } : c
        )
      }),
      /ownership 'pending', expected 'live'/
    ],
    [
      'a settlement claim missing a dimension of its bundle',
      (r) => ({
        ...r,
        capacityClaims: claimsOf(r).map((c) =>
          c.purpose === 'accepted-operation-settlement'
            ? {
                ...c,
                charges: (c.charges as JsonObject[]).filter((x) => x.dimension !== 'resident-payload-bytes')
              }
            : c
        )
      }),
      /does not charge 'resident-payload-bytes'/
    ],
    [
      'a settlement claim over its bundle',
      (r) => ({
        ...r,
        capacityClaims: claimsOf(r).map((c) =>
          c.purpose === 'accepted-operation-settlement'
            ? { ...c, charges: [...(c.charges as JsonObject[]), { dimension: 'sources', amount: 1 }] }
            : c
        )
      }),
      /more than its bundle reserves/
    ]
  ])('open refuses %s', async (__, edit, message) => {
    const h = await uncertain();
    editTask(h, edit);
    expect(blockedOf(await reopen(h)).issues).toEqual([
      expect.objectContaining({ code: 'integrity', message: expect.stringMatching(message) })
    ]);
  });

  test('open refuses a replay-envelope claim naming a source that does not execute the task, or a second one', async () => {
    for (const edit of [
      (c: JsonObject): JsonObject[] => [{ ...c, sourceId: 'elsewhere' }],
      (c: JsonObject): JsonObject[] => [{ ...c, owner: { owner: 'task', taskId: 'other' } }],
      (c: JsonObject): JsonObject[] => [{ ...c, ownership: 'pending' }],
      (c: JsonObject): JsonObject[] => [c, { ...c, claimId: 'dup-2' }],
      // An envelope the profile cannot carry: bytes no declared update could hold.
      (c: JsonObject): JsonObject[] => [
        { ...c, envelope: { remainingRequiredUpdates: 0, remainingRequiredBytes: 5 } }
      ],
      // A dimension the envelope reserves, missing.
      (c: JsonObject): JsonObject[] => [
        { ...c, charges: (c.charges as JsonObject[]).filter((x) => x.dimension !== 'updates') }
      ],
      // The resident charge and the remaining byte envelope out of lockstep.
      (c: JsonObject): JsonObject[] => [
        {
          ...c,
          charges: (c.charges as JsonObject[]).map((x) =>
            x.dimension === 'resident-payload-bytes' ? { ...x, amount: (x.amount as number) + 1 } : x
          )
        }
      ]
    ]) {
      const h = await sourceHarness({ history: 'source-replay' });
      h.executor.addJob('j1');
      await registerJob(h, 'j1');
      const root = h.root as Root;
      const record = readJson(root, 'task-j1.json');
      const claims = claimsOf(record);
      const replay = claims.find((c) => c.purpose === 'admitted-source-replay')!;
      writeJson(root, 'task-j1.json', {
        ...record,
        capacityClaims: [...claims.filter((c) => c !== replay), ...edit(replay)]
      });
      expect(blockedOf(await reopen(h)).issues).toEqual([expect.objectContaining({ code: 'integrity' })]);
    }
  });

  test('open refuses a command that awaits a feed revision without being settled accepted', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    expect(await h.broker.reconcile({ sourceId: 'exec' })).toSucceed();
    h.executor.loseNextResponse = true;
    expect(
      await h.writer.execute({
        taskId: tid('j1'),
        operationId: op(),
        expectedRevision: rev(2),
        command: 'pause',
        parameters: { reason: 'x' }
      })
    ).toSucceed();
    const root = h.root as Root;
    const record = readJson(root, 'task-j1.json');
    writeJson(root, 'task-j1.json', {
      ...record,
      operations: (record.operations as JsonObject[]).map((o) =>
        o.type === 'command' ? { ...o, awaiting: { epoch: 'e1', token: '9' } } : o
      )
    });
    expect(JSON.stringify(blockedOf(await reopen(h)).issues)).toMatch(
      /only a settled accepted command may await a feed revision/
    );
  });

  test('a pending source-replay registration keeps its envelope claim valid across reopen', async () => {
    const h = await sourceHarness({ history: 'source-replay' });
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    const repository = readyOf(await reopen(h));
    const record = (await repository.readCommit(tid('j1'))).orThrow()!;
    expect(record.capacityClaims.map((c) => c.purpose).sort()).toEqual([
      'admitted-source-replay',
      'first-resolution',
      'terminal-closeout'
    ]);
  });
});

describe('storage rules for command evolution', () => {
  async function withCommand(): Promise<{
    h: ISourceHarness;
    record: IResolvedTaskCommitRecord;
    key: string;
  }> {
    const h = await sourceHarness();
    h.executor.addJob('j1');
    await registerJob(h, 'j1');
    h.executor.loseNextResponse = true;
    const key = op();
    expect(
      await h.writer.execute({
        taskId: tid('j1'),
        operationId: key,
        expectedRevision: rev(1),
        command: 'cancel',
        parameters: { reason: 'x' }
      })
    ).toSucceed();
    return { h, record: (await recordOf(h, 'j1')) as IResolvedTaskCommitRecord, key };
  }

  function maintenance(
    record: IResolvedTaskCommitRecord,
    operations: IResolvedTaskCommitRecord['operations']
  ): Extract<ITaskCommitRequest, { purpose: 'maintenance' }> {
    return {
      purpose: 'maintenance' as const,
      taskId: record.task.envelope.id,
      expectedRevision: record.task.envelope.revision,
      expectedRecordRevision: record.recordRevision,
      record: {
        recordType: 'resolved' as const,
        task: record.task,
        ...(record.sourceRevision !== undefined ? { sourceRevision: record.sourceRevision } : {}),
        operations,
        updates: record.updates,
        archived: false
      }
    };
  }

  test('a dispatch marker never moves backwards', async () => {
    const { h, record, key } = await withCommand();
    const back = record.operations.map((o) =>
      o.operationId === key && o.type === 'command' ? { ...o, dispatch: 'not-sent' as const } : o
    );
    expect(await h.repository.withWriter((w) => w.commit(maintenance(record, back)))).toFailWith(
      /cannot move back/
    );
  });

  test('a settled receipt is final, apart from an awaited feed confirmation', async () => {
    const { h, record, key } = await withCommand();
    const settle = record.operations.map((o) =>
      o.operationId === key && o.type === 'command'
        ? {
            ...o,
            dispatch: 'settled' as const,
            receipt: { ...o.receipt, result: { state: 'rejected' as const, reason: 'conflict' as const } }
          }
        : o
    );
    expect(await h.repository.withWriter((w) => w.commit(maintenance(record, settle)))).toSucceed();
    const settled = (await recordOf(h, 'j1')) as IResolvedTaskCommitRecord;
    const changed = settled.operations.map((o) =>
      o.operationId === key && o.type === 'command'
        ? { ...o, receipt: { ...o.receipt, result: { state: 'applied' as const, appliedRevision: rev(1) } } }
        : o
    );
    expect(await h.repository.withWriter((w) => w.commit(maintenance(settled, changed)))).toFailWith(
      /a settled receipt is final/
    );
  });

  test.each([
    ['an unsettled command', (op: IStoredTaskOperation): IStoredTaskOperation => op],
    [
      'a command awaiting its feed revision',
      (op: IStoredTaskOperation): IStoredTaskOperation =>
        op.type === 'command'
          ? {
              ...op,
              dispatch: 'settled',
              receipt: { ...op.receipt, result: { state: 'accepted' } },
              awaiting: { epoch: 'e1', token: '9' }
            }
          : op
    ]
  ])('a task holding %s cannot be archived by storage either', async (__, shape) => {
    const { h, record: original } = await withCommand();
    const record = { ...original, operations: original.operations.map(shape) };
    h.executor.change('j1', (j) => (j.step = 1));
    const draft = {
      ...maintenance(record, record.operations),
      purpose: 'operation' as const,
      operationId: op()
    };
    const archiving = {
      ...draft,
      record: {
        ...draft.record,
        task: {
          ...record.task,
          envelope: {
            ...record.task.envelope,
            lifecycle: { status: 'cancelled' as const, reason: { code: 'x', summary: 'x' } }
          }
        },
        archived: true,
        operations: [
          ...record.operations,
          {
            type: 'catalog' as const,
            operationId: draft.operationId,
            operation: 'archive' as const,
            request: {},
            principalKey: 'host',
            receipt: {}
          }
        ]
      }
    };
    expect(await h.repository.withWriter((w) => w.commit(archiving))).toFailWith(
      /awaiting its feed revision, cannot be archived/
    );
  });

  test('an observation’s required-update count must be a non-negative integer', async () => {
    const { h, record } = await withCommand();
    expect(
      await h.repository.withWriter((w) =>
        w.commit({ ...maintenance(record, record.operations), purpose: 'observation', requiredUpdates: -1 })
      )
    ).toFailWith(/requiredUpdates/);
  });
});
