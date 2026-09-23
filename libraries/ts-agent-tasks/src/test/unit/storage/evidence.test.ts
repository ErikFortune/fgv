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
  ITaskRepositoryWriter,
  OperationId,
  TaskResult,
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
import { FaultyRoot } from '../../helpers/faultyRoot';

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

/**
 * Rewrites the manifest so `id`'s entry is pending, carrying the given evidence. The creation
 * operation's catalog name, principal and record type default to a tracked registration's.
 */
function markPending(
  root: Root,
  id: string,
  evidence: {
    operationId: string;
    request: JsonValue;
    capacityClaims: JsonValue;
    operation?: string;
    principalKey?: string;
    recordType?: string;
  }
): void {
  const manifest = readJson(root, 'repository.json');
  writeJson(root, 'repository.json', {
    ...manifest,
    tasks: (manifest.tasks as JsonObject[]).map((entry) =>
      entry.id === id
        ? {
            id,
            state: 'pending',
            operation: 'create-tracked',
            principalKey: 'host',
            recordType: 'resolved',
            ...evidence
          }
        : entry
    )
  });
}

/** A record's claims as its pending registration held them. */
function pendingClaims(record: JsonObject): JsonValue {
  return (record.capacityClaims as JsonObject[]).map((c) => ({ ...c, ownership: 'pending' }));
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
      capacityClaims: pendingClaims(record)
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
      capacityClaims: pendingClaims(record)
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
      capacityClaims: pendingClaims(record)
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
      capacityClaims: pendingClaims(record)
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

describe('copilot round 2: evidence that must hold for a whole lifetime', () => {
  test('a resolved record with no operations is invalid, not a writable task', async () => {
    const root = memoryRoot() as Root;
    const repository = await initialized(root);
    (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
    repository.close();
    writeJson(root, 'task-t1.json', { ...readJson(root, 'task-t1.json'), operations: [] });
    expect(blocked(await open(root)).issues).toEqual([
      expect.objectContaining({
        code: 'record-invalid',
        message: expect.stringMatching(/carries at least its creation operation/)
      })
    ]);
  });

  test('the principal is part of an operation: a retry under another principal is a conflict', async () => {
    const repository = await initialized(memoryRoot() as Root);
    const created = (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
    const commit =
      (principalKey: string): ((w: ITaskRepositoryWriter) => Promise<TaskResult<ITaskCommitRecord>>) =>
      (w) =>
        w.commit({
          purpose: 'operation',
          operationId: 'op-2' as OperationId,
          taskId: t1,
          expectedRevision: rev(1),
          expectedRecordRevision: 1,
          record: nextDraft(created, {
            envelope: envelope('t1', 2, { title: 'renamed' }),
            operation: { ...catalogOp('op-2', 'update-tracked', { title: 'renamed' }), principalKey }
          })
        });
    expect(await repository.withWriter(commit('host'))).toSucceed();
    expect(await repository.withWriter(commit('someone-else'))).toFailWithDetail(
      /already recorded with a different request/i,
      code('conflict')
    );
  });

  test('a quarantined record is not rewritten by a registration replay', async () => {
    const root = memoryRoot() as Root;
    const repository = await initialized(root);
    (await repository.withWriter((w) => w.register(unresolvedRegistration('u1')))).orThrow();
    repository.close();
    const before = readText(root, 'task-u1.json');
    const reopened = ready(await open(root, registry({ withoutVendor: true })));
    expect(await reopened.withWriter((w) => w.register(unresolvedRegistration('u1')))).toFailWithDetail(
      /acme\.job@1 is not registered; the record is quarantined/,
      code('unknown-kind-version')
    );
    expect(readText(root, 'task-u1.json')).toBe(before);
  });

  test("a profile whose per-record bound cannot hold a task's own reservation is refused", async () => {
    const profile = {
      ...defaultTaskCapacityProfile,
      encoded: { ...defaultTaskCapacityProfile.encoded, maxTaskRecordBytes: 1000000 }
    };
    expect(
      await FileTreeTaskRepository.initialize(params(memoryRoot(), 'session', { profile }))
    ).toFailWithDetail(
      /terminal closeout needs \d+ of 'record-bytes' but the limit is 1000000/,
      code('invalid')
    );
  });
});

describe('copilot round 2: what each commit purpose may change', () => {
  let repository: ITaskRepository;
  let observed: ITaskCommitRecord;

  beforeEach(async () => {
    repository = await initialized(memoryRoot() as Root);
    const created = (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
    observed = (
      await repository.withWriter((w) =>
        w.commit({
          purpose: 'observation',
          taskId: t1,
          expectedRevision: rev(1),
          expectedRecordRevision: 1,
          record: nextDraft(created, {
            envelope: envelope('t1', 2, { lifecycle: { status: 'running' } }),
            updates: ['lifecycle'],
            sourceRevision: { epoch: 'e1', token: '1' }
          })
        })
      )
    ).orThrow();
  });

  function maintenance(
    change: Parameters<typeof nextDraft>[1]
  ): (w: ITaskRepositoryWriter) => Promise<TaskResult<ITaskCommitRecord>> {
    return (w) =>
      w.commit({
        purpose: 'maintenance',
        taskId: t1,
        expectedRevision: rev(2),
        expectedRecordRevision: 2,
        record: nextDraft(observed, change)
      });
  }

  test('outside an observation the committed source revision does not move, or disappear', async () => {
    const current = observed.recordType === 'resolved' ? observed : undefined;
    const cleared = { ...nextDraft(observed, {}), sourceRevision: undefined };
    expect(
      await repository.withWriter(maintenance({ sourceRevision: { epoch: 'e1', token: '9' } }))
    ).toFailWithDetail(/only an observation may change the committed source revision/i, code('invalid'));
    expect(
      await repository.withWriter((w) =>
        w.commit({
          purpose: 'operation',
          operationId: 'op-2' as OperationId,
          taskId: t1,
          expectedRevision: rev(2),
          expectedRecordRevision: 2,
          record: {
            ...cleared,
            task: { ...current!.task, envelope: envelope('t1', 3, { lifecycle: { status: 'running' } }) },
            operations: [...current!.operations, catalogOp('op-2', 'update-tracked', {})]
          }
        })
      )
    ).toFailWithDetail(/only an observation may change the committed source revision/i, code('invalid'));
  });

  test('maintenance changes no semantic state', async () => {
    for (const change of [
      { envelope: { title: 'renamed' } },
      { details: { note: 'x' } },
      {
        envelope: {
          observation: {
            state: 'stale' as const,
            checkedAt: '2026-09-22T12:10:00.000Z' as never,
            reason: 'poll timed out'
          }
        }
      }
    ]) {
      expect(await repository.withWriter(maintenance(change))).toFailWithDetail(
        /maintenance cannot change semantic state/i,
        code('invalid')
      );
    }
  });

  test('maintenance may refresh observation telemetry', async () => {
    expect(
      await repository.withWriter(
        maintenance({
          envelope: { observation: { state: 'current', observedAt: '2026-09-22T12:30:00.000Z' as never } }
        })
      )
    ).toSucceedAndSatisfy((record) => {
      expect(record.recordRevision).toBe(3);
    });
  });
});

describe('copilot round 2: open validates what claims are, not only which', () => {
  type Claim = JsonObject;
  async function withClaims(
    edit: (claims: Claim[]) => Claim[],
    options?: { unresolved?: boolean }
  ): Promise<ITaskRecoveryReport> {
    const root = memoryRoot() as Root;
    const repository = await initialized(root);
    const id = options?.unresolved === true ? 'u1' : 't1';
    (
      await repository.withWriter((w) =>
        w.register(options?.unresolved === true ? unresolvedRegistration('u1') : registration('t1'))
      )
    ).orThrow();
    repository.close();
    const record = readJson(root, `task-${id}.json`);
    writeJson(root, `task-${id}.json`, { ...record, capacityClaims: edit(record.capacityClaims as Claim[]) });
    return blocked(await open(root));
  }

  function closeout(claims: Claim[]): Claim {
    return claims.find((c) => c.purpose === 'terminal-closeout')!;
  }

  test.each<[string, (claims: Claim[]) => Claim[], RegExp]>([
    [
      'owned by another task',
      (claims) => [{ ...closeout(claims), owner: { owner: 'task', taskId: 't9' }, taskId: 't9' }],
      /not owned by task t1/
    ],
    [
      'held with pending ownership by a live record',
      (claims) => [{ ...closeout(claims), ownership: 'pending' }],
      /ownership 'pending', expected 'live'/
    ],
    [
      'a second closeout claim',
      (claims) => [...claims, { ...closeout(claims), claimId: 'another-claim' }],
      /a second 'terminal-closeout' claim/
    ],
    [
      'charging more than its bundle',
      (claims) => [
        {
          ...closeout(claims),
          charges: (closeout(claims).charges as JsonObject[]).map((c) => ({
            ...c,
            amount: (c.amount as number) + 1
          }))
        }
      ],
      /more than its bundle reserves/
    ],
    [
      'charging a dimension its bundle does not',
      (claims) => [
        {
          ...closeout(claims),
          charges: [...(closeout(claims).charges as JsonObject[]), { dimension: 'sources', amount: 1 }]
        }
      ],
      /of 'sources', more than its bundle reserves/
    ],
    [
      'consumed before the task was archived',
      (claims) => [{ ...closeout(claims), disposition: 'consumed' }],
      /disposition 'consumed', expected 'reserved'/
    ],
    ['holding no closeout claim at all', () => [], /holds no terminal-closeout claim/],
    [
      'of a purpose a task record never holds',
      (claims) => {
        const held = closeout(claims);
        return [
          ...claims,
          {
            claimVersion: held.claimVersion,
            claimId: 'settle-1',
            owner: held.owner,
            ownership: held.ownership,
            disposition: held.disposition,
            charges: held.charges,
            purpose: 'accepted-operation-settlement',
            taskId: 't1',
            operationId: 'op-x'
          }
        ];
      },
      /does not hold a 'accepted-operation-settlement' claim/
    ]
  ])('a claim %s blocks open', async (__, edit, message) => {
    expect((await withClaims(edit)).issues).toEqual([
      expect.objectContaining({ code: 'integrity', message: expect.stringMatching(message) })
    ]);
  });

  test('an unresolved record must still hold its first-resolution reservation', async () => {
    const report = await withClaims((claims) => claims.filter((c) => c.purpose !== 'first-resolution'), {
      unresolved: true
    });
    expect(report.issues).toEqual([
      expect.objectContaining({
        code: 'integrity',
        message: expect.stringMatching(/holds no first-resolution claim/)
      })
    ]);
  });

  test("a pending entry's claims are checked too, and joined to a landed record in full", async () => {
    const root = await parentAndChild();
    const record = readJson(root, 'task-t2.json');
    const claims = record.capacityClaims as Claim[];
    // Landed record, same ids, one charge altered: not that registration's claims.
    markPending(root, 't2', {
      operationId: 'op-create-t2',
      request: creationOf(root, 't2').request,
      capacityClaims: claims.map((c) => ({
        ...c,
        ownership: 'pending',
        charges: (c.charges as JsonObject[]).map((charge, i) =>
          i === 0 ? { ...charge, amount: (charge.amount as number) - 1 } : charge
        )
      }))
    });
    expect(blocked(await open(root)).issues).toEqual([
      expect.objectContaining({ code: 'integrity', message: expect.stringMatching(/its claims differ/) })
    ]);
    // No landed record: the entry's own claims must be a pending registration's.
    markPending(root, 't2', {
      operationId: 'op-create-t2',
      request: creationOf(root, 't2').request,
      capacityClaims: claims
    });
    root.deleteChild('task-t2.json').orThrow();
    expect(blocked(await open(root)).issues).toEqual([
      expect.objectContaining({
        code: 'integrity',
        message: expect.stringMatching(
          /task-t2\.json: pending registration: .*ownership 'live', expected 'pending'/
        )
      })
    ]);
  });
});

describe('copilot round 3: what open and registration still took on trust', () => {
  test('registration never overwrites a record-shaped file the inventory does not name', async () => {
    const inner = memoryRoot() as Root;
    const root = new FaultyRoot(inner);
    const repository = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
    // Appears after open: only a fresh listing can see it.
    writeJson(inner, 'task-t1.json', { operator: 'notes' });
    const before = readText(inner, 'task-t1.json');
    expect(await repository.withWriter((w) => w.register(registration('t1')))).toFailWithDetail(
      /task-t1\.json already exists but the inventory does not name it/,
      code('conflict')
    );
    expect(readText(inner, 'task-t1.json')).toBe(before);
    expect(
      repository
        .capacityStatus()
        .orThrow()
        .dimensions.find((d) => d.dimension === 'retained-tasks')!.used
    ).toBe(0);
    // A listing that fails refuses before anything is written, and safely.
    root.failChildren = true;
    expect(await repository.withWriter((w) => w.register(registration('t2')))).toFailWithDetail(
      /register t2: .*cannot list/,
      expect.objectContaining({ code: 'storage-unavailable', retry: 'safe' })
    );
    expect(repository.health().state).toBe('ready');
  });

  test('a claim must still name every dimension its bundle reserves', async () => {
    const root = memoryRoot() as Root;
    const repository = await initialized(root);
    (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
    repository.close();
    const record = readJson(root, 'task-t1.json');
    const [claim] = record.capacityClaims as JsonObject[];
    const charges = claim.charges as JsonObject[];
    writeJson(root, 'task-t1.json', { ...record, capacityClaims: [{ ...claim, charges: charges.slice(1) }] });
    expect(blocked(await open(root)).issues).toEqual([
      expect.objectContaining({
        code: 'integrity',
        message: expect.stringContaining(`does not charge '${charges[0].dimension as string}'`)
      })
    ]);
  });

  test("a record's first operation must be its creation evidence", async () => {
    const root = memoryRoot() as Root;
    const repository = await initialized(root);
    (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
    (await repository.withWriter((w) => w.register(unresolvedRegistration('u1')))).orThrow();
    repository.close();
    const t1Record = readJson(root, 'task-t1.json');
    const [t1Creation] = t1Record.operations as JsonObject[];
    writeJson(root, 'task-t1.json', {
      ...t1Record,
      operations: [{ ...t1Creation, operation: 'update-tracked' }]
    });
    const u1Record = readJson(root, 'task-u1.json');
    const [u1Creation] = u1Record.operations as JsonObject[];
    writeJson(root, 'task-u1.json', {
      ...u1Record,
      operations: [{ ...u1Creation, operation: 'create-tracked' }]
    });
    expect(blocked(await open(root)).issues).toEqual([
      expect.objectContaining({
        code: 'record-invalid',
        message: expect.stringMatching(/task-t1\.json: operation 'op-create-t1' is not a creation operation/)
      }),
      expect.objectContaining({
        code: 'record-invalid',
        message: expect.stringMatching(
          /task-u1\.json: an unresolved record is created only by 'register-external'/
        )
      })
    ]);
  });
});

describe('copilot round 4: identity held across every boundary', () => {
  test('an observation cannot change catalog metadata or archive the task', async () => {
    const repository = await initialized(memoryRoot() as Root);
    const created = (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
    const observe =
      (
        change: Parameters<typeof nextDraft>[1]
      ): ((w: ITaskRepositoryWriter) => Promise<TaskResult<ITaskCommitRecord>>) =>
      (w) =>
        w.commit({
          purpose: 'observation',
          taskId: t1,
          expectedRevision: rev(1),
          expectedRecordRevision: 1,
          record: nextDraft(created, {
            sourceRevision: { epoch: 'e1', token: '1' },
            updates: ['lifecycle'],
            ...change
          })
        });
    for (const envelopeChange of [
      { title: 'renamed by the source' },
      { parentId: 'other' as TaskId },
      { scopes: [] }
    ]) {
      expect(
        await repository.withWriter(observe({ envelope: envelope('t1', 2, envelopeChange) }))
      ).toFailWithDetail(/an observation cannot change catalog metadata/i, code('invalid'));
    }
    expect(
      await repository.withWriter(
        observe({
          envelope: envelope('t1', 2, {
            lifecycle: { status: 'succeeded', outcome: { summary: 'ok', artifacts: [] } }
          }),
          archived: true
        })
      )
    ).toFailWithDetail(/an observation cannot archive a task/i, code('invalid'));
  });

  test('a resumed registration must match the pending creation in full, not only id and request', async () => {
    const inner = memoryRoot() as Root;
    const root = new FaultyRoot(inner);
    const repository = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
    root.faults.push({ name: 'task-t1.json', when: 'before', visibility: 'unchanged' });
    await repository.withWriter((w) => w.register(registration('t1')));
    const base = registration('t1');
    const draft = base.record.recordType === 'resolved' ? base.record : undefined;
    const [creation] = draft!.operations;
    for (const changed of [
      { ...creation, principalKey: 'someone-else' },
      { ...creation, operation: 'create-list' as const }
    ]) {
      expect(
        await repository.withWriter((w) =>
          w.register({ ...base, record: { ...draft!, operations: [changed] } })
        )
      ).toFailWithDetail(/a different registration of this id is pending/i, code('conflict'));
    }
    // The original retry still resumes.
    expect(await repository.withWriter((w) => w.register(base))).toSucceed();
  });

  test('open completes a pending entry only when the record matches its principal and catalog operation', async () => {
    const root = await parentAndChild();
    const record = readJson(root, 'task-t2.json');
    markPending(root, 't2', {
      operationId: 'op-create-t2',
      request: creationOf(root, 't2').request,
      capacityClaims: pendingClaims(record),
      principalKey: 'someone-else'
    });
    expect(blocked(await open(root)).issues).toEqual([
      expect.objectContaining({
        code: 'integrity',
        message: expect.stringMatching(/catalog operation, principal or record type differs/)
      })
    ]);
  });

  test('a replay reports success only for what was committed', async () => {
    const repository = await initialized(memoryRoot() as Root);
    const created = (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
    const request = {
      purpose: 'operation' as const,
      operationId: 'op-2' as OperationId,
      taskId: t1,
      expectedRevision: rev(1),
      expectedRecordRevision: 1,
      record: nextDraft(created, {
        envelope: envelope('t1', 2, { title: 'renamed' }),
        operation: catalogOp('op-2', 'update-tracked', { title: 'renamed' })
      })
    };
    expect(await repository.withWriter((w) => w.commit(request))).toSucceed();
    const smuggled = {
      ...request,
      record: {
        ...request.record,
        operations: [...request.record.operations, catalogOp('op-3', 'update-tracked', {})]
      }
    };
    expect(await repository.withWriter((w) => w.commit(smuggled))).toFailWithDetail(
      /a replay of 'op-2' offers operations that were never committed/,
      code('conflict')
    );
  });

  test('the manifest is fenced like a record: an out-of-band edit is never overwritten', async () => {
    const inner = memoryRoot() as Root;
    const root = new FaultyRoot(inner);
    const repository = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
    (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
    // Our own manifest writes do not trip the check.
    (await repository.withWriter((w) => w.register(registration('t2')))).orThrow();

    const raised = {
      ...defaultTaskCapacityProfile,
      limits: {
        ...defaultTaskCapacityProfile.limits,
        'retained-tasks': defaultTaskCapacityProfile.limits['retained-tasks'] + 1
      }
    };
    // A manifest that cannot be re-read refuses the rewrite safely, before anything is written.
    root.failChildren = true;
    expect(await repository.withWriter((w) => w.raiseCapacityLimits(raised))).toFailWithDetail(
      /repository\.json: cannot be re-read before rewriting it: .*cannot list/,
      expect.objectContaining({ code: 'storage-unavailable', retry: 'safe' })
    );
    root.failChildren = false;
    expect(repository.health().state).toBe('ready');

    const manifest = readJson(inner, 'repository.json');
    writeJson(inner, 'repository.json', { ...manifest, tasks: (manifest.tasks as JsonObject[]).slice(1) });
    const edited = readText(inner, 'repository.json');
    expect(await repository.withWriter((w) => w.raiseCapacityLimits(raised))).toFailWithDetail(
      /repository\.json differs from the one this repository committed/,
      code('storage-corrupt')
    );
    expect(repository.health().state).toBe('unavailable');
    expect(readText(inner, 'repository.json')).toBe(edited);
  });
});
