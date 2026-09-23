/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { FileTree, JsonObject, JsonValue } from '@fgv/ts-json-base';
import { Converters, Result, fail, succeed } from '@fgv/ts-utils';
import {
  FileTreeTaskRepository,
  ITaskCommitRecord,
  ITaskKindRegistry,
  ITaskRecoveryReport,
  ITaskRepository,
  OperationId,
  TaskId,
  TaskKind,
  TaskRepositoryOpenResult,
  TaskRevision,
  defaultTaskCapacityProfile
} from '../../../index';
import {
  catalogOp,
  envelope,
  memoryRoot,
  nextDraft,
  params,
  registration,
  registry,
  unresolvedRegistration
} from '../../helpers/storageFixtures';

/**
 * Evidence integrity: every place a stored record, inventory entry or operation is trusted as
 * "the same one" compares the whole of what makes it that one — never a subset of it.
 */

type Root = FileTree.IAtomicFileTreeDirectoryItem & FileTree.IMutableFileTreeDirectoryItem;
const t1: TaskId = 't1' as TaskId;
const rev = (n: number): TaskRevision => n as TaskRevision;

function code(value: string): unknown {
  return expect.objectContaining({ code: value });
}

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

async function initialized(root: Root, reg?: ITaskKindRegistry): Promise<ITaskRepository> {
  return (
    await FileTreeTaskRepository.initialize(params(root, 'session', reg ? { registry: reg } : undefined))
  ).orThrow();
}

async function open(root: Root, reg: ITaskKindRegistry = registry()): Promise<TaskRepositoryOpenResult> {
  return (await FileTreeTaskRepository.open(params(root, 'session', { registry: reg }))).orThrow();
}

function blocked(opened: TaskRepositoryOpenResult): ITaskRecoveryReport {
  if (opened.state !== 'recovery-required') {
    throw new Error('expected a recovery handle');
  }
  opened.recovery.close();
  return opened.recovery.report;
}

function ready(opened: TaskRepositoryOpenResult): ITaskRepository {
  if (opened.state !== 'ready') {
    throw new Error(`expected ready: ${JSON.stringify(opened.recovery.report.issues)}`);
  }
  return opened.repository;
}

/** A closed repository with t1 and its child t2. */
async function parentAndChild(): Promise<Root> {
  const root = memoryRoot() as Root;
  const repository = await initialized(root);
  (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
  (
    await repository.withWriter((w) => w.register(registration('t2', { envelope: { parentId: t1 } })))
  ).orThrow();
  repository.close();
  return root;
}

/** Rewrites the manifest so `id`'s entry is pending, carrying the given evidence. */
function markPending(
  root: Root,
  id: string,
  evidence: { operationId: string; request: JsonValue; capacityClaims: JsonValue }
): void {
  const manifest = readJson(root, 'repository.json');
  writeJson(root, 'repository.json', {
    ...manifest,
    tasks: (manifest.tasks as JsonObject[]).map((entry) =>
      entry.id === id ? { id, state: 'pending', ...evidence } : entry
    )
  });
}

function creationOf(root: Root, id: string): JsonObject {
  return (readJson(root, `task-${id}.json`).operations as JsonObject[])[0];
}

describe('the registry must actually freeze', () => {
  function unfreezable(): ITaskKindRegistry {
    const inner = registry();
    return {
      register: (descriptor) => inner.register(descriptor),
      convert: (snapshot) => inner.convert(snapshot),
      has: (kind, version) => inner.has(kind, version),
      isFrozen: false,
      freeze: (): Result<number> => fail('this registry is shared and stays open')
    };
  }

  test('initialize and open refuse a registry that will not freeze, and release the root', async () => {
    const root = memoryRoot() as Root;
    expect(
      await FileTreeTaskRepository.initialize(params(root, 'session', { registry: unfreezable() }))
    ).toFailWithDetail(/kind registry could not be frozen: this registry is shared/i, code('invalid'));
    (await initialized(root)).close();
    expect(
      await FileTreeTaskRepository.open(params(root, 'session', { registry: unfreezable() }))
    ).toFailWithDetail(/could not be frozen/i, code('invalid'));
    expect(ready(await open(root)).close()).toSucceedWith(true);
  });
});

describe('an empty root is empty of directories too', () => {
  test('initialize refuses a root that holds only a directory', async () => {
    const accessors = FileTree.InMemoryTreeAccessors.create([{ path: '/keep/notes.txt', contents: 'x' }], {
      mutable: true
    }).orThrow();
    const root = FileTree.DirectoryItem.create('/', accessors).orThrow();
    expect(await FileTreeTaskRepository.initialize(params(root, 'session'))).toFailWithDetail(
      /not empty \(keep\)/i,
      code('invalid')
    );
  });
});

describe('a pending entry completes only against its own registration', () => {
  test('same operation id and claims, but a different request, is not that registration', async () => {
    const root = await parentAndChild();
    const record = readJson(root, 'task-t2.json');
    markPending(root, 't2', {
      operationId: 'op-create-t2',
      request: { someone: 'else' },
      capacityClaims: record.capacityClaims
    });
    const before = readText(root, 'repository.json');
    expect(blocked(await open(root)).issues).toEqual([
      expect.objectContaining({
        code: 'integrity',
        message: expect.stringMatching(
          /present for pending registration 'op-create-t2'.*request differs from the registration request/
        )
      })
    ]);
    expect(readText(root, 'repository.json')).toBe(before);
  });

  test('same operation and request, but different claims, is not that registration either', async () => {
    const root = await parentAndChild();
    const creation = creationOf(root, 't2');
    markPending(root, 't2', { operationId: 'op-create-t2', request: creation.request, capacityClaims: [] });
    expect(blocked(await open(root)).issues).toEqual([
      expect.objectContaining({ code: 'integrity', message: expect.stringMatching(/its claims differ/) })
    ]);
  });

  test('the matching registration completes', async () => {
    const root = await parentAndChild();
    const record = readJson(root, 'task-t2.json');
    markPending(root, 't2', {
      operationId: 'op-create-t2',
      request: creationOf(root, 't2').request,
      capacityClaims: record.capacityClaims
    });
    const repository = ready(await open(root));
    expect(repository.report.completedRegistrations).toEqual(['t2']);
  });
});

describe('a pending registration is not a live parent', () => {
  test('a child whose parent never got past pending is a dangling edge', async () => {
    const root = await parentAndChild();
    const record = readJson(root, 'task-t1.json');
    markPending(root, 't1', {
      operationId: 'op-create-t1',
      request: creationOf(root, 't1').request,
      capacityClaims: record.capacityClaims
    });
    root.deleteChild('task-t1.json').orThrow();
    expect(blocked(await open(root)).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'integrity',
          message: expect.stringMatching(/task t2: parent t1 is not a live task/)
        })
      ])
    );
  });

  test('a parent whose pending registration completes on open is a live parent', async () => {
    const root = await parentAndChild();
    const record = readJson(root, 'task-t1.json');
    markPending(root, 't1', {
      operationId: 'op-create-t1',
      request: creationOf(root, 't1').request,
      capacityClaims: record.capacityClaims
    });
    const repository = ready(await open(root));
    expect(repository.report.completedRegistrations).toEqual(['t1']);
    expect(await repository.read('t2' as TaskId)).toSucceed();
  });
});

describe('the per-value bounds hold for stored records, and for normalized drafts', () => {
  test('open refuses a record under its total ceiling with one value over its bound', async () => {
    const root = memoryRoot() as Root;
    const repository = await initialized(root);
    (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
    repository.close();
    const record = readJson(root, 'task-t1.json');
    const [creation] = record.operations as JsonObject[];
    const oversized = 'x'.repeat(defaultTaskCapacityProfile.encoded.maxOperationRequestBytes);
    writeJson(root, 'task-t1.json', { ...record, operations: [{ ...creation, request: { oversized } }] });
    expect(blocked(await open(root)).issues).toEqual([
      expect.objectContaining({
        code: 'record-invalid',
        message: expect.stringMatching(/task-t1\.json: operation 'op-create-t1' request is \d+ bytes, over/)
      })
    ]);
  });

  test('a kind whose encoder grows the details past their bound is refused, not stored', async () => {
    const padded: TaskKind = 'acme.padded' as TaskKind;
    const reg = registry();
    reg
      .register({
        kind: padded,
        detailVersion: 1,
        details: Converters.strictObject<{ job: string }>({ job: Converters.string }),
        encode: (value): Result<JsonValue> =>
          succeed({ job: value.job, pad: 'x'.repeat(defaultTaskCapacityProfile.encoded.maxDetailBytes) })
      })
      .orThrow();
    const root = memoryRoot() as Root;
    const repository = await initialized(root, reg);
    const base = registration('p1', { envelope: { kind: padded } });
    const draft = base.record.recordType === 'resolved' ? base.record : undefined;
    expect(
      await repository.withWriter((w) =>
        w.register({
          ...base,
          record: { ...draft!, task: { envelope: draft!.task.envelope, details: { job: 'j' } } }
        })
      )
    ).toFailWithDetail(/as normalized by its kind: the details is \d+ bytes, over/i, code('invalid'));
    expect(await repository.readCommit('p1' as TaskId)).toSucceedWith(undefined);
  });
});

describe('quarantine covers unresolved records', () => {
  test('reading an unresolved record of an unregistered kind fails as unknown-kind-version', async () => {
    const root = memoryRoot() as Root;
    const repository = await initialized(root);
    (await repository.withWriter((w) => w.register(unresolvedRegistration('u1')))).orThrow();
    repository.close();
    const reopened = ready(await open(root, registry({ withoutVendor: true })));
    expect(await reopened.read('u1' as TaskId)).toFailWithDetail(
      /acme\.job@1 is not registered; the record is quarantined/,
      code('unknown-kind-version')
    );
    expect(await reopened.readCommit('u1' as TaskId)).toSucceedAndSatisfy((record) => {
      expect(record?.recordType).toBe('unresolved');
    });
  });
});

describe('replay identity is the whole operation', () => {
  let repository: ITaskRepository;
  let created: ITaskCommitRecord;
  const request: JsonValue = { title: 'renamed' };

  beforeEach(async () => {
    repository = await initialized(memoryRoot() as Root);
    created = (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
    (
      await repository.withWriter((w) =>
        w.commit({
          purpose: 'operation',
          operationId: 'op-2' as OperationId,
          taskId: t1,
          expectedRevision: rev(1),
          expectedRecordRevision: 1,
          record: nextDraft(created, {
            envelope: envelope('t1', 2, { title: 'renamed' }),
            operation: catalogOp('op-2', 'update-tracked', request)
          })
        })
      )
    ).orThrow();
  });

  test('a registration cannot replay against a later operation that shares its id and request', async () => {
    expect(
      await repository.withWriter((w) => w.register(registration('t1', { operationId: 'op-2', request })))
    ).toFailWithDetail(/already registered by a different operation or request/i, code('conflict'));
  });

  test('only the first operation is creation evidence, whatever a later one is named', async () => {
    // Storage does not police the catalog vocabulary of later operations — that is the broker's.
    // So a later operation can carry a creation name; it still is not what created the task.
    const current = (await repository.readCommit(t1)).orThrow()!;
    (
      await repository.withWriter((w) =>
        w.commit({
          purpose: 'operation',
          operationId: 'op-3' as OperationId,
          taskId: t1,
          expectedRevision: rev(2),
          expectedRecordRevision: 2,
          record: nextDraft(current, {
            envelope: envelope('t1', 3, { title: 'renamed' }),
            operation: catalogOp('op-3', 'create-tracked', request)
          })
        })
      )
    ).orThrow();
    expect(
      await repository.withWriter((w) => w.register(registration('t1', { operationId: 'op-3', request })))
    ).toFailWithDetail(/already registered by a different operation or request/i, code('conflict'));
  });

  test('a commit retry that renames the catalog operation is a conflict, not a replay', async () => {
    expect(
      await repository.withWriter((w) =>
        w.commit({
          purpose: 'operation',
          operationId: 'op-2' as OperationId,
          taskId: t1,
          expectedRevision: rev(1),
          expectedRecordRevision: 1,
          record: nextDraft(created, {
            envelope: envelope('t1', 2, { title: 'renamed' }),
            operation: catalogOp('op-2', 'archive', request)
          })
        })
      )
    ).toFailWithDetail(/already recorded with a different request/i, code('conflict'));
  });
});

describe('read-back compares the whole record', () => {
  test('an out-of-band edit that keeps the record revision still fences', async () => {
    const root = memoryRoot() as Root;
    const repository = await initialized(root);
    (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
    const record = readJson(root, 'task-t1.json');
    const task = record.task as JsonObject;
    writeJson(root, 'task-t1.json', {
      ...record,
      task: { ...task, envelope: { ...(task.envelope as JsonObject), title: 'edited out of band' } }
    });
    expect(await repository.readCommit(t1)).toFailWithDetail(
      /record 1 differs from the one this repository committed/,
      code('storage-corrupt')
    );
    expect(repository.health().state).toBe('unavailable');
  });
});
