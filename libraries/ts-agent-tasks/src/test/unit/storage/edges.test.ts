/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import fs from 'fs';
import { FileTree, JsonObject } from '@fgv/ts-json-base';
import {
  FileTreeTaskRepository,
  ITaskCapacityCharge,
  ITaskCapacityProfile,
  ITaskCommitRecord,
  ITaskRepository,
  TaskId,
  TaskRevision,
  defaultTaskCapacityProfile,
  maximumClosureCharges,
  maximumResolutionCharges
} from '../../../index';
import { converters } from '../../helpers/fixtures';
import { FaultyRoot } from '../../helpers/faultyRoot';
import {
  catalogOp,
  envelope,
  memoryRoot,
  nextDraft,
  nodeRoot,
  nodeRootAt,
  params,
  registration,
  unresolvedRegistration,
  update,
  vendorKind
} from '../../helpers/storageFixtures';

/**
 * Boundary behaviours of the storage packlet that the scenario suites do not reach on their own:
 * unusual roots, stores that fail without classifying, out-of-band damage discovered after open,
 * and the edges of the per-value bounds.
 */

type Root = FileTree.IAtomicFileTreeDirectoryItem & FileTree.IMutableFileTreeDirectoryItem;
const t1: TaskId = 't1' as TaskId;
const rev = (n: number): TaskRevision => n as TaskRevision;

function code(value: string): unknown {
  return expect.objectContaining({ code: value });
}

async function initialized(
  root: FileTree.IFileTreeDirectoryItem,
  profile?: ITaskCapacityProfile
): Promise<ITaskRepository> {
  return (await FileTreeTaskRepository.initialize(params(root, 'session', { profile }))).orThrow();
}

function readJson(root: Root, name: string): JsonObject {
  const file = root
    .getChildren()
    .orThrow()
    .find((c) => c.name === name) as FileTree.IFileTreeFileItem;
  return JSON.parse(file.getRawContents().orThrow()) as JsonObject;
}

function writeJson(root: Root, name: string, value: unknown): void {
  root.writeChildAtomically(name, JSON.stringify(value), { guarantee: 'session' }).orThrow();
}

describe('roots that are not what they claim', () => {
  test('a directory that offers no atomic-write methods at all is refused', async () => {
    const inner = memoryRoot();
    const plain: FileTree.IFileTreeDirectoryItem = {
      type: 'directory',
      absolutePath: inner.absolutePath,
      name: inner.name,
      getChildren: () => inner.getChildren()
    };
    expect(await FileTreeTaskRepository.initialize(params(plain, 'session'))).toFailWithDetail(
      /does not offer atomic writes/i,
      code('unsupported')
    );
  });

  test('durable mode will not read a record through a store that cannot decode strictly', async () => {
    const { dir, root } = nodeRoot();
    try {
      (await FileTreeTaskRepository.initialize(params(root, { durable: 'process-crash' }))).orThrow().close();
      const faulty = new FaultyRoot(nodeRootAt(dir) as FileTree.IAtomicFileTreeDirectoryItem);
      faulty.hideStrictText = true;
      const opened = (
        await FileTreeTaskRepository.open(params(faulty, { durable: 'process-crash' }))
      ).orThrow();
      expect(opened.state === 'recovery-required' && opened.recovery.report.issues).toEqual([
        expect.objectContaining({
          code: 'unreadable',
          message: expect.stringMatching(/cannot decode strictly/)
        })
      ]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('stores that fail without classifying', () => {
  test('a write failure with no classification is treated as unknown visibility, and fences', async () => {
    const root = new FaultyRoot(memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem);
    const repository = await initialized(root);
    root.faults.push({
      name: 'repository.json',
      when: 'before',
      visibility: 'unchanged',
      unclassified: true
    });
    expect(await repository.withWriter((w) => w.register(registration('t1')))).toFailWithDetail(
      /may have landed \(unknown\)/i,
      expect.objectContaining({ code: 'commit-indeterminate', operationId: 'op-create-t1' })
    );
    expect(repository.health().issues).toEqual([expect.stringMatching(/unknown after 'unclassified'/)]);
  });

  test('initialize reports a listing failure after its manifest write, and releases the root', async () => {
    const root = new FaultyRoot(memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem);
    const write = root.writeChildAtomically.bind(root);
    root.writeChildAtomically = (name, contents, options) => {
      const written = write(name, contents, options);
      root.failChildren = true;
      return written;
    };
    expect(await FileTreeTaskRepository.initialize(params(root, 'session'))).toFailWithDetail(
      /initialize: injected: cannot list/i,
      expect.objectContaining({ code: 'storage-unavailable', retry: 'reconcile-first' })
    );
    // Released: the manifest is there, so open takes it (through the unfaulted inner root).
    expect(await FileTreeTaskRepository.open(params(root.inner, 'session'))).toSucceed();
  });

  test('initialize treats an unclassified manifest write failure as reconcile-first, never safe', async () => {
    const root = new FaultyRoot(memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem);
    root.faults.push({
      name: 'repository.json',
      when: 'before',
      visibility: 'unchanged',
      unclassified: true
    });
    expect(await FileTreeTaskRepository.initialize(params(root, 'session'))).toFailWithDetail(
      /injected unclassified failure/i,
      expect.objectContaining({ code: 'storage-unavailable', retry: 'reconcile-first' })
    );
  });

  test('initialize reports a manifest write whose outcome is unknown as reconcile-first', async () => {
    const root = new FaultyRoot(memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem);
    root.faults.push({ name: 'repository.json', when: 'after', visibility: 'replaced' });
    expect(await FileTreeTaskRepository.initialize(params(root, 'session'))).toFailWithDetail(
      /injected after-write failure/i,
      expect.objectContaining({ code: 'storage-unavailable', retry: 'reconcile-first' })
    );
  });

  test.each([
    ['unchanged', 'safe'],
    ['replaced', 'reconcile-first']
  ] as const)(
    'open reports a failed registration completion (%s) and writes nothing further',
    async (visibility, retry) => {
      const inner = memoryRoot() as Root;
      const setup = new FaultyRoot(inner);
      const repository = await initialized(setup);
      setup.faults.push({ name: 'repository.json', when: 'before', visibility: 'unchanged', skip: 1 });
      expect(await repository.withWriter((w) => w.register(registration('t1')))).toFail();
      repository.close();

      const root = new FaultyRoot(inner);
      root.faults.push({
        name: 'repository.json',
        when: visibility === 'replaced' ? 'after' : 'before',
        visibility
      });
      expect(await FileTreeTaskRepository.open(params(root, 'session'))).toFailWithDetail(
        /completing pending registrations failed/i,
        expect.objectContaining({ code: 'storage-unavailable', retry })
      );
    }
  );
});

describe('open completes only the registrations that need it', () => {
  test('other live entries are left exactly as they were', async () => {
    const inner = memoryRoot() as Root;
    const setup = new FaultyRoot(inner);
    const repository = await initialized(setup);
    (await repository.withWriter((w) => w.register(registration('t0')))).orThrow();
    setup.faults.push({ name: 'repository.json', when: 'before', visibility: 'unchanged', skip: 1 });
    expect(await repository.withWriter((w) => w.register(registration('t1')))).toFail();
    repository.close();
    const opened = (await FileTreeTaskRepository.open(params(inner, 'session'))).orThrow();
    expect(opened.state === 'ready' && opened.repository.report.completedRegistrations).toEqual(['t1']);
    expect(readJson(inner, 'repository.json').tasks).toEqual([
      { id: 't0', state: 'live' },
      { id: 't1', state: 'live' }
    ]);
  });

  test('a host may supply its own converter set', async () => {
    const root = memoryRoot();
    (await initialized(root)).close();
    expect(await FileTreeTaskRepository.open(params(root, 'session', { converters }))).toSucceed();
  });
});

describe('damage discovered after open', () => {
  test('a record grown past its ceiling out of band fences on the next read', async () => {
    const root = memoryRoot() as Root;
    const repository = await initialized(root);
    (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
    root
      .writeChildAtomically(
        'task-t1.json',
        ' '.repeat(defaultTaskCapacityProfile.encoded.maxTaskRecordBytes + 1),
        {
          guarantee: 'session'
        }
      )
      .orThrow();
    expect(await repository.readCommit(t1)).toFailWithDetail(/exceeds 8388608/i, code('storage-corrupt'));
    expect(repository.health().state).toBe('unavailable');
  });

  test('a record whose bytes fit but whose reserved growth no longer fits the stored policy blocks open', async () => {
    // The smallest per-record bound a valid profile allows still holds a registration's whole
    // reservation (closeout plus first resolution), so it is the record itself that has to
    // have grown: here, by operations added out of band, each within its own bound.
    const root = memoryRoot() as Root;
    const repository = await initialized(root);
    (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
    repository.close();
    const recordBytes = (charges: ReadonlyArray<ITaskCapacityCharge>): number =>
      charges.find((c) => c.dimension === 'record-bytes')!.amount;
    const bundle: number =
      recordBytes(maximumClosureCharges(defaultTaskCapacityProfile).orThrow()) +
      recordBytes(maximumResolutionCharges(defaultTaskCapacityProfile).orThrow());

    const record = readJson(root, 'task-t1.json');
    const [creation] = record.operations as JsonObject[];
    const extra = Array.from({ length: 5 }, (__, i) => ({
      ...creation,
      operationId: `op-extra-${i}`,
      operation: 'update-tracked',
      request: { pad: 'x'.repeat(120000) }
    }));
    writeJson(root, 'task-t1.json', { ...record, operations: [creation, ...extra] });
    const manifest = readJson(root, 'repository.json');
    const profile = manifest.profile as JsonObject;
    writeJson(root, 'repository.json', {
      ...manifest,
      profile: { ...profile, encoded: { ...(profile.encoded as JsonObject), maxTaskRecordBytes: bundle } }
    });
    const opened = (await FileTreeTaskRepository.open(params(root, 'session'))).orThrow();
    expect(opened.state === 'recovery-required' && opened.recovery.report.issues).toEqual([
      expect.objectContaining({ code: 'integrity', message: expect.stringMatching(/record-bytes \(t1\)/) })
    ]);
  });

  test('a registered kind whose stored details fail its converter blocks open', async () => {
    const root = memoryRoot() as Root;
    const repository = await initialized(root);
    const vendor = registration('v1', { envelope: { kind: vendorKind } });
    const draft = vendor.record.recordType === 'resolved' ? vendor.record : undefined;
    (
      await repository.withWriter((w) =>
        w.register({
          ...vendor,
          record: { ...draft!, task: { envelope: draft!.task.envelope, details: { job: 'j' } } }
        })
      )
    ).orThrow();
    repository.close();
    const record = readJson(root, 'task-v1.json');
    writeJson(root, 'task-v1.json', {
      ...record,
      task: { ...(record.task as JsonObject), details: { job: 7 } }
    });
    const opened = (await FileTreeTaskRepository.open(params(root, 'session'))).orThrow();
    expect(opened.state === 'recovery-required' && opened.recovery.report.issues).toEqual([
      expect.objectContaining({ code: 'record-invalid', message: expect.stringMatching(/task-v1\.json/) })
    ]);
  });

  test('a file that only looks record-shaped is reported for what it is', async () => {
    const root = memoryRoot() as Root;
    (await initialized(root)).close();
    writeJson(root, 'task-.json', {});
    writeJson(root, 'other.json', {});
    const opened = (await FileTreeTaskRepository.open(params(root, 'session'))).orThrow();
    expect(opened.state === 'ready' && opened.repository.report.issues.map((i) => i.message).sort()).toEqual([
      expect.stringMatching(/other\.json: not a repository file/),
      expect.stringMatching(/task-\.json: not a repository file/)
    ]);
  });
});

describe('reads and replays at the edges', () => {
  let repository: ITaskRepository;
  let created: ITaskCommitRecord;

  beforeEach(async () => {
    repository = await initialized(memoryRoot());
    created = (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
  });

  test('reading a task that does not exist is undefined, through the repository and the writer', async () => {
    expect(await repository.readCommit('nobody' as TaskId)).toSucceedWith(undefined);
    expect(await repository.read('nobody' as TaskId)).toSucceedWith(undefined);
    expect(await repository.withWriter((w) => w.readCommit('nobody' as TaskId))).toSucceedWith(undefined);
  });

  test('a replay of a recorded operation that omits it from the record is a conflict, not a replay', async () => {
    const start = {
      purpose: 'operation' as const,
      operationId: 'op-start' as never,
      taskId: t1,
      expectedRevision: rev(1),
      expectedRecordRevision: 1,
      record: nextDraft(created, {
        envelope: { revision: rev(2) },
        operation: catalogOp('op-start', 'update-tracked', {})
      })
    };
    (await repository.withWriter((w) => w.commit(start))).orThrow();
    expect(
      await repository.withWriter((w) =>
        w.commit({ ...start, record: nextDraft(created, { envelope: { revision: rev(2) } }) })
      )
    ).toFailWithDetail(/already recorded with a different request/i, code('conflict'));
  });

  test('an archived tombstone refuses maintenance too, with no operation to name', async () => {
    const done = (
      await repository.withWriter((w) =>
        w.commit({
          purpose: 'operation',
          operationId: 'op-done' as never,
          taskId: t1,
          expectedRevision: rev(1),
          expectedRecordRevision: 1,
          record: nextDraft(created, {
            envelope: {
              revision: rev(2),
              lifecycle: { status: 'cancelled', reason: { code: 'x', summary: 'y' } }
            },
            operation: catalogOp('op-done', 'archive', {}),
            archived: true
          })
        })
      )
    ).orThrow();
    expect(
      await repository.withWriter((w) =>
        w.commit({
          purpose: 'maintenance',
          taskId: t1,
          expectedRevision: rev(2),
          expectedRecordRevision: 2,
          record: nextDraft(done, {})
        })
      )
    ).toFailWithDetail(/archived tombstone is immutable/i, { code: 'conflict', retry: 'after-host-action' });
  });
});

describe('command evidence', () => {
  test("a stored command's receipt may evolve by maintenance while its request stays fixed", async () => {
    const repository = await initialized(memoryRoot());
    const created = (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
    const request = {
      taskId: t1,
      operationId: 'op-cmd' as never,
      expectedRevision: rev(1),
      command: 'start',
      parameters: {}
    };
    const command = (state: 'accepted' | 'applied', commandName: string = 'start'): never =>
      ({
        type: 'command',
        operationId: 'op-cmd',
        request: { ...request, command: commandName },
        principalKey: 'actor:1',
        dispatch: state === 'accepted' ? 'possibly-sent' : 'settled',
        receipt: {
          taskId: 't1',
          operationId: 'op-cmd',
          command: 'start',
          result: state === 'accepted' ? { state: 'accepted' } : { state: 'applied', appliedRevision: 2 }
        }
      } as never);
    const accepted = (
      await repository.withWriter((w) =>
        w.commit({
          purpose: 'operation',
          operationId: 'op-cmd' as never,
          taskId: t1,
          expectedRevision: rev(1),
          expectedRecordRevision: 1,
          record: nextDraft(created, { operation: command('accepted') })
        })
      )
    ).orThrow();
    const settledOps = accepted.operations.map((op) =>
      op.operationId === 'op-cmd' ? command('applied') : op
    );
    expect(
      await repository.withWriter((w) =>
        w.commit({
          purpose: 'maintenance',
          taskId: t1,
          expectedRevision: rev(1),
          expectedRecordRevision: 2,
          record: { ...nextDraft(accepted, {}), operations: settledOps }
        })
      )
    ).toSucceedAndSatisfy((record) => {
      expect(record.operations.find((op) => op.operationId === 'op-cmd')).toEqual(
        expect.objectContaining({ dispatch: 'settled' })
      );
    });
    // The request itself may not change.
    const rewritten = accepted.operations.map((op) =>
      op.operationId === 'op-cmd' ? command('applied', 'pause') : op
    );
    expect(
      await repository.withWriter((w) =>
        w.commit({
          purpose: 'maintenance',
          taskId: t1,
          expectedRevision: rev(1),
          expectedRecordRevision: 3,
          record: { ...nextDraft(accepted, {}), operations: rewritten }
        })
      )
    ).toFailWithDetail(/a stored request cannot change/i, code('invalid'));
  });
});

describe('value bounds at registration', () => {
  test('a first record that is already archived is refused, even when terminal', async () => {
    const repository = await initialized(memoryRoot());
    const base = registration('t1', {
      envelope: { lifecycle: { status: 'succeeded', outcome: { summary: 'ok', artifacts: [] } } }
    });
    const record = base.record.recordType === 'resolved' ? { ...base.record, archived: true } : base.record;
    expect(await repository.withWriter((w) => w.register({ ...base, record }))).toFailWithDetail(
      /a first record cannot be archived/i,
      code('invalid')
    );
  });

  test("an update's audience is bounded by the stored profile, not only the field bound", async () => {
    const profile: ITaskCapacityProfile = {
      ...defaultTaskCapacityProfile,
      perOwner: { ...defaultTaskCapacityProfile.perOwner, maxAudiencePerUpdate: 2 }
    };
    const repository = await initialized(memoryRoot(), profile);
    const base = registration('t1');
    const env = envelope('t1', 1);
    const wide = { ...update(env, 'lifecycle'), audience: ['s1', 's2', 's3'] as never };
    const record = base.record.recordType === 'resolved' ? { ...base.record, updates: [wide] } : base.record;
    expect(await repository.withWriter((w) => w.register({ ...base, record }))).toFailWithDetail(
      /names 3 audience subscriptions, over 2/i,
      code('invalid')
    );
  });

  test('an unresolved registration may name a live parent, and keeps that edge', async () => {
    const root = memoryRoot();
    const repository = await initialized(root);
    (await repository.withWriter((w) => w.register(registration('p')))).orThrow();
    const base = unresolvedRegistration('u1');
    const record =
      base.record.recordType === 'unresolved'
        ? { ...base.record, reference: { ...base.record.reference, parentId: 'p' as TaskId } }
        : base.record;
    expect(await repository.withWriter((w) => w.register({ ...base, record }))).toSucceed();
    repository.close();
    const opened = (await FileTreeTaskRepository.open(params(root, 'session'))).orThrow();
    expect(opened.state === 'ready' && opened.repository.report.issues).toEqual([]);
  });
});
