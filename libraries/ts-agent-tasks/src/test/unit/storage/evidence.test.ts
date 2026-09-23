/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { FileTree, JsonObject, JsonValue } from '@fgv/ts-json-base';
import { Converters, Logging, Result, fail, succeed } from '@fgv/ts-utils';
import {
  FileTreeTaskRepository,
  ITaskCommitRecord,
  ITaskCommitRequest,
  ITaskEnvelope,
  ITaskKindRegistry,
  ITaskRecoveryReport,
  ITaskRepository,
  ITaskRepositoryWriter,
  OperationId,
  TaskEnvironment,
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
  unresolvedRegistration,
  update,
  vendorKind
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
      /task-t1\.json already exists but this repository never committed it/,
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

describe('copilot round 5: the external origin, and pending recovery', () => {
  test('a first-resolution claim is only ever held by a task registered by register-external', async () => {
    const root = memoryRoot() as Root;
    const repository = await initialized(root);
    (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
    (await repository.withWriter((w) => w.register(unresolvedRegistration('u1')))).orThrow();
    repository.close();
    // Graft u1's first-resolution claim, consumed and relabelled, onto the tracked t1.
    const u1Claim = (readJson(root, 'task-u1.json').capacityClaims as JsonObject[]).find(
      (c) => c.purpose === 'first-resolution'
    )!;
    const t1Record = readJson(root, 'task-t1.json');
    writeJson(root, 'task-t1.json', {
      ...t1Record,
      capacityClaims: [
        ...(t1Record.capacityClaims as JsonObject[]),
        {
          ...u1Claim,
          claimId: 'forged',
          owner: { owner: 'task', taskId: 't1' },
          taskId: 't1',
          disposition: 'consumed'
        }
      ]
    });
    expect(blocked(await open(root)).issues).toEqual([
      expect.objectContaining({
        code: 'integrity',
        message: expect.stringMatching(/task-t1\.json: .*not registered by 'register-external'/)
      })
    ]);
  });

  test('a registration replay compares the first-record type, before and after first resolution', async () => {
    const repository = await initialized(memoryRoot() as Root);
    const unresolved = unresolvedRegistration('u1');
    (await repository.withWriter((w) => w.register(unresolved))).orThrow();
    // The same operation and request, presenting a resolved first record: not this registration.
    const resolvedDraft = registration('u1', {
      operationId: unresolved.operationId,
      request: unresolved.request,
      envelope: { kind: vendorKind }
    });
    const draft = resolvedDraft.record.recordType === 'resolved' ? resolvedDraft.record : undefined;
    const asResolved = {
      ...resolvedDraft,
      record: {
        ...draft!,
        task: { envelope: draft!.task.envelope, details: { job: 'j-u1' } },
        operations: unresolved.record.operations
      }
    };
    expect(await repository.withWriter((w) => w.register(asResolved))).toFailWithDetail(
      /already registered by a different operation or request/i,
      code('conflict')
    );
    // The original retry still replays.
    expect(await repository.withWriter((w) => w.register(unresolved))).toSucceed();
  });

  test.each<[string, Record<string, JsonValue>, RegExp]>([
    ['whose operation is not a creation', { operation: 'update-tracked' }, /is not a creation operation/],
    [
      'unresolved but not created by register-external',
      { recordType: 'unresolved' },
      /an unresolved record is created only by 'register-external'/
    ],
    [
      'whose request is over its bound',
      { request: { pad: 'x'.repeat(defaultTaskCapacityProfile.encoded.maxOperationRequestBytes) } },
      /the pending request is \d+ bytes, over the bound/
    ]
  ])('a pending entry with no record %s blocks open', async (__, change, message) => {
    const root = await parentAndChild();
    const record = readJson(root, 'task-t2.json');
    markPending(root, 't2', {
      operationId: 'op-create-t2',
      request: creationOf(root, 't2').request,
      capacityClaims: pendingClaims(record),
      ...change
    });
    root.deleteChild('task-t2.json').orThrow();
    expect(blocked(await open(root)).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'integrity', message: expect.stringMatching(message) })
      ])
    );
  });

  test('a resumed registration never overwrites a record file that appeared while it was pending', async () => {
    const inner = memoryRoot() as Root;
    const root = new FaultyRoot(inner);
    const repository = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
    root.faults.push({ name: 'task-t1.json', when: 'before', visibility: 'unchanged' });
    await repository.withWriter((w) => w.register(registration('t1')));
    writeJson(inner, 'task-t1.json', { operator: 'notes' });
    const before = readText(inner, 'task-t1.json');
    expect(await repository.withWriter((w) => w.register(registration('t1')))).toFailWithDetail(
      /task-t1\.json already exists but is not this registration's first record .*left untouched/,
      code('conflict')
    );
    expect(readText(inner, 'task-t1.json')).toBe(before);
  });
});

describe('copilot round 6: open completion and resumed registration', () => {
  async function withPendingT2(): Promise<Root> {
    const root = await parentAndChild();
    const record = readJson(root, 'task-t2.json');
    markPending(root, 't2', {
      operationId: 'op-create-t2',
      request: creationOf(root, 't2').request,
      capacityClaims: pendingClaims(record)
    });
    return root;
  }

  /** A root whose second listing runs `between` first — the moment after open's scan. */
  function afterScan(inner: Root, between: (root: FaultyRoot) => void): FaultyRoot {
    const root = new FaultyRoot(inner);
    const list = root.getChildren.bind(root);
    let calls: number = 0;
    root.getChildren = () => {
      calls++;
      if (calls === 2) {
        between(root);
      }
      return list();
    };
    return root;
  }

  test("open's completion write is refused when the manifest changed after the scan", async () => {
    const inner = await withPendingT2();
    let edited: string = '';
    const root = afterScan(inner, () => {
      writeJson(inner, 'repository.json', { ...readJson(inner, 'repository.json'), manifestRevision: 99 });
      edited = readText(inner, 'repository.json');
    });
    expect(await FileTreeTaskRepository.open(params(root, 'session'))).toFailWithDetail(
      /repository\.json changed after it was scanned; nothing was written/,
      code('storage-corrupt')
    );
    expect(readText(inner, 'repository.json')).toBe(edited);
    // And the root was released.
    expect(await FileTreeTaskRepository.open(params(inner, 'session'))).toSucceed();
  });

  test("open's completion write is refused safely when the manifest cannot be re-read", async () => {
    const inner = await withPendingT2();
    const root = afterScan(inner, (r) => {
      r.failChildren = true;
    });
    expect(await FileTreeTaskRepository.open(params(root, 'session'))).toFailWithDetail(
      /cannot be re-read before completing registrations/,
      expect.objectContaining({ code: 'storage-unavailable', retry: 'safe' })
    );
  });

  test('a retry finishes a registration whose record landed but whose live write failed', async () => {
    const inner = memoryRoot() as Root;
    const root = new FaultyRoot(inner);
    const repository = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
    // Let the pending write through; fail the live write cleanly.
    root.faults.push({ name: 'repository.json', when: 'before', visibility: 'unchanged', skip: 1 });
    expect(await repository.withWriter((w) => w.register(registration('t1')))).toFailWithDetail(
      /before anything became visible/,
      code('storage-unavailable')
    );
    const landed = readText(inner, 'task-t1.json');
    // A listing failure refuses the retry safely.
    root.failChildren = true;
    expect(await repository.withWriter((w) => w.register(registration('t1')))).toFailWithDetail(
      /cannot list/,
      expect.objectContaining({ code: 'storage-unavailable', retry: 'safe' })
    );
    root.failChildren = false;
    // The retry's draft differs outside the registration identity: the landed record wins.
    const retitled = registration('t1', { envelope: { title: 'retitled on retry' } });
    expect(await repository.withWriter((w) => w.register(retitled))).toSucceedAndSatisfy((record) => {
      expect(record.recordRevision).toBe(1);
      expect(record.recordType === 'resolved' && record.task.envelope.title).toBe('task t1');
    });
    // Step 3 only: the landed record was not rewritten, and the entry is live.
    expect(readText(inner, 'task-t1.json')).toBe(landed);
    expect(readJson(inner, 'repository.json').tasks).toEqual([{ id: 't1', state: 'live' }]);
    expect(await repository.read(t1)).toSucceed();
  });

  test('a landed record that is not exactly this registration is refused and left alone', async () => {
    const inner = memoryRoot() as Root;
    const root = new FaultyRoot(inner);
    const repository = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
    root.faults.push({ name: 'repository.json', when: 'before', visibility: 'unchanged', skip: 1 });
    await repository.withWriter((w) => w.register(registration('t1')));
    const record = readJson(inner, 'task-t1.json');
    const [creation] = record.operations as JsonObject[];
    writeJson(inner, 'task-t1.json', {
      ...record,
      operations: [{ ...creation, principalKey: 'someone-else' }]
    });
    const before = readText(inner, 'task-t1.json');
    expect(await repository.withWriter((w) => w.register(registration('t1')))).toFailWithDetail(
      /its identity or claims differ from the pending registration.*left untouched/,
      code('conflict')
    );
    expect(readText(inner, 'task-t1.json')).toBe(before);
  });
});

describe('copilot round 7: host callbacks and the writer lifetime', () => {
  function throwingIds(after: number): TaskEnvironment {
    let minted: number = 0;
    return TaskEnvironment.create({
      logger: new Logging.InMemoryLogger('detail'),
      clock: () => 0,
      newId: () => {
        if (++minted > after) {
          throw new Error('id service unavailable');
        }
        return succeed(`env-${Date.now()}-${minted}`);
      }
    }).orThrow();
  }

  test('an identity callback that throws during initialize is a failure, and the root is released', async () => {
    const root = memoryRoot() as Root;
    expect(
      await FileTreeTaskRepository.initialize(params(root, 'session', { environment: throwingIds(0) }))
    ).toFailWithDetail(/id service unavailable/, code('invalid'));
    expect(await FileTreeTaskRepository.initialize(params(root, 'session'))).toSucceed();
  });

  test('an identity callback that throws during registration refuses safely, with nothing written', async () => {
    const root = memoryRoot() as Root;
    const repository = (
      await FileTreeTaskRepository.initialize(params(root, 'session', { environment: throwingIds(1) }))
    ).orThrow();
    const before = readText(root, 'repository.json');
    expect(await repository.withWriter((w) => w.register(registration('t1')))).toFailWithDetail(
      /id service unavailable/,
      expect.objectContaining({ code: 'storage-unavailable', retry: 'safe' })
    );
    expect(readText(root, 'repository.json')).toBe(before);
    expect(repository.health().state).toBe('ready');
  });

  test('close is refused while a writer callback is active, and succeeds after it returns', async () => {
    const root = memoryRoot() as Root;
    const repository = await initialized(root);
    expect(
      await repository.withWriter(async (w) => {
        expect(repository.close()).toFailWithDetail(/a writer callback is active/, code('conflict'));
        return w.register(registration('t1'));
      })
    ).toSucceed();
    expect(repository.close()).toSucceedWith(true);
    expect(await FileTreeTaskRepository.open(params(root, 'session'))).toSucceed();
  });
});

describe('copilot round 8: write-path invariants re-checked where records are trusted', () => {
  test('a replacement cannot move the creation operation out of first place', async () => {
    const repository = await initialized(memoryRoot() as Root);
    const created = (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
    const draft = nextDraft(created, {
      envelope: envelope('t1', 2, { title: 'renamed' }),
      operation: catalogOp('op-2', 'update-tracked', {})
    });
    expect(
      await repository.withWriter((w) =>
        w.commit({
          purpose: 'operation',
          operationId: 'op-2' as OperationId,
          taskId: t1,
          expectedRevision: rev(1),
          expectedRecordRevision: 1,
          record: { ...draft, operations: [...draft.operations].reverse() }
        })
      )
    ).toFailWithDetail(
      /the creation operation 'op-create-t1' must remain the first operation/,
      code('invalid')
    );
  });

  test.each<[string, number, Record<string, JsonValue>]>([
    ['an open task holds two closeout slots', 2, {}],
    [
      'a terminal task holds one',
      1,
      { lifecycle: { status: 'succeeded', outcome: { summary: 'ok', artifacts: [] } } }
    ]
  ])('open refuses a record over its per-task operation limit: %s', async (__, held, lifecycle) => {
    const root = memoryRoot() as Root;
    const repository = await initialized(root);
    (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
    repository.close();
    const record = readJson(root, 'task-t1.json');
    const task = record.task as JsonObject;
    const [creation] = record.operations as JsonObject[];
    const limit: number = defaultTaskCapacityProfile.perOwner.maxOperationsPerTask - held;
    const extra = Array.from({ length: limit }, (___, i) => ({
      ...creation,
      operationId: `op-extra-${i}`,
      operation: 'update-tracked',
      request: {}
    }));
    writeJson(root, 'task-t1.json', {
      ...record,
      task: { ...task, envelope: { ...(task.envelope as JsonObject), ...lifecycle } },
      operations: [creation, ...extra]
    });
    expect(blocked(await open(root)).issues).toEqual([
      expect.objectContaining({
        code: 'record-invalid',
        message: expect.stringContaining(`${limit + 1} operations, over the per-task limit of ${limit}`)
      })
    ]);
  });

  test('open completes a pending entry only over its first record, not a later revision', async () => {
    const root = await parentAndChild();
    const record = readJson(root, 'task-t2.json');
    markPending(root, 't2', {
      operationId: 'op-create-t2',
      request: creationOf(root, 't2').request,
      capacityClaims: pendingClaims(record)
    });
    writeJson(root, 'task-t2.json', { ...record, recordRevision: 2 });
    expect(blocked(await open(root)).issues).toEqual([
      expect.objectContaining({
        code: 'integrity',
        message: expect.stringMatching(/it is record revision 2, not the first record/)
      })
    ]);
  });
});

describe('coderabbit review', () => {
  test('a commit purpose is validated, not trusted, and so is its operation id', async () => {
    const repository = await initialized(memoryRoot() as Root);
    const created = (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
    const base = {
      taskId: t1,
      expectedRevision: rev(1),
      expectedRecordRevision: 1,
      record: nextDraft(created, { envelope: envelope('t1', 2, { lifecycle: { status: 'running' } }) })
    };
    expect(
      await repository.withWriter((w) => w.commit({ ...base, purpose: 'bogus' } as never))
    ).toFailWithDetail(/commit: .*bogus/i, code('invalid'));
    expect(
      await repository.withWriter((w) =>
        w.commit({ ...base, purpose: 'operation', operationId: 'x'.repeat(500) as OperationId })
      )
    ).toFailWithDetail(/commit: .*operation/i, code('invalid'));
    // Nothing moved.
    expect((await repository.readCommit(t1)).orThrow()!.recordRevision).toBe(1);
  });

  test('raising a per-record bound re-limits the records already held, at once', async () => {
    const probeRoot = memoryRoot() as Root;
    const probe = await initialized(probeRoot);
    (await probe.withWriter((w) => w.register(unresolvedRegistration('u1')))).orThrow();
    const row = (repository: ITaskRepository): { used: number; reserved: number; limit: number } =>
      repository
        .capacityStatus()
        .orThrow()
        .dimensions.find((d) => d.dimension === 'record-bytes')!;
    const exact: number = row(probe).used + row(probe).reserved;
    const tight = {
      ...defaultTaskCapacityProfile,
      encoded: { ...defaultTaskCapacityProfile.encoded, maxTaskRecordBytes: exact }
    };
    const repository = (
      await FileTreeTaskRepository.initialize(params(memoryRoot(), 'session', { profile: tight }))
    ).orThrow();
    (await repository.withWriter((w) => w.register(unresolvedRegistration('u1')))).orThrow();
    expect(row(repository).limit).toBe(exact);
    const raised = { ...tight, encoded: { ...tight.encoded, maxTaskRecordBytes: exact + 1000 } };
    expect(await repository.withWriter((w) => w.raiseCapacityLimits(raised))).toSucceed();
    expect(row(repository).limit).toBe(exact + 1000);
  });
});

describe('mutation-matrix gaps', () => {
  /** The first resolution of an unresolved record, preserving its catalog metadata. */
  function resolution(current: ITaskCommitRecord): ITaskCommitRequest {
    if (current.recordType !== 'unresolved') {
      throw new Error('expected unresolved');
    }
    const ref = current.reference;
    const env: ITaskEnvelope = {
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
      changedAt: '2026-09-22T12:05:00.000Z' as never
    };
    return {
      purpose: 'observation',
      taskId: ref.id,
      expectedRevision: ref.revision,
      expectedRecordRevision: current.recordRevision,
      record: {
        recordType: 'resolved',
        task: { envelope: env, details: { job: `j-${ref.id}` } },
        sourceRevision: { epoch: 'e1', token: '1' },
        operations: current.operations,
        updates: [update(env, 'lifecycle'), update(env, 'observation')],
        archived: false
      }
    };
  }

  test('a registration retried after first resolution still replays as the unresolved registration it was', async () => {
    const repository = await initialized(memoryRoot() as Root);
    const unresolved = unresolvedRegistration('u1');
    const created = (await repository.withWriter((w) => w.register(unresolved))).orThrow();
    (await repository.withWriter((w) => w.commit(resolution(created)))).orThrow();
    // The record is resolved now; its consumed first-resolution claim is what says it was
    // registered unresolved, so the original retry is still that registration.
    expect(await repository.withWriter((w) => w.register(unresolved))).toSucceedAndSatisfy((record) => {
      expect(record.recordType).toBe('resolved');
      expect(record.recordRevision).toBe(2);
    });
  });

  test('a registration retried under another principal is a conflict, not a replay', async () => {
    const repository = await initialized(memoryRoot() as Root);
    const original = registration('t1');
    (await repository.withWriter((w) => w.register(original))).orThrow();
    const draft = original.record.recordType === 'resolved' ? original.record : undefined;
    const [creation] = draft!.operations;
    const elsewhere = {
      ...original,
      record: { ...draft!, operations: [{ ...creation, principalKey: 'someone-else' }] }
    };
    expect(await repository.withWriter((w) => w.register(elsewhere))).toFailWithDetail(
      /already registered by a different operation or request/i,
      code('conflict')
    );
    expect(await repository.withWriter((w) => w.register(original))).toSucceed();
  });

  /** t1's pending entry committed and its record landed, but the live write failed cleanly. */
  async function landedButPending(): Promise<{ inner: Root; repository: ITaskRepository }> {
    const inner = memoryRoot() as Root;
    const root = new FaultyRoot(inner);
    const repository = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
    root.faults.push({ name: 'repository.json', when: 'before', visibility: 'unchanged', skip: 1 });
    expect(await repository.withWriter((w) => w.register(registration('t1')))).toFail();
    return { inner, repository };
  }

  test.each<[string, (record: JsonObject) => JsonObject]>([
    ['is a later record revision', (record) => ({ ...record, recordRevision: 2 })],
    [
      'carries other claims',
      (record) => ({
        ...record,
        capacityClaims: (record.capacityClaims as JsonObject[]).map((c) => ({
          ...c,
          claimId: `${String(c.claimId)}-other`
        }))
      })
    ]
  ])('a resume does not finish over a landed record that %s', async (__, change) => {
    const { inner, repository } = await landedButPending();
    writeJson(inner, 'task-t1.json', change(readJson(inner, 'task-t1.json')));
    const before = readText(inner, 'task-t1.json');
    expect(await repository.withWriter((w) => w.register(registration('t1')))).toFailWithDetail(
      /is not this registration's first record.*left untouched/,
      code('conflict')
    );
    expect(readText(inner, 'task-t1.json')).toBe(before);
  });

  test("a pending entry not created by 'register-external' may not hold a first-resolution claim", async () => {
    const root = memoryRoot() as Root;
    const repository = await initialized(root);
    (await repository.withWriter((w) => w.register(unresolvedRegistration('u1')))).orThrow();
    repository.close();
    const record = readJson(root, 'task-u1.json');
    // A resolved-first registration carrying a first-resolution claim in the disposition a
    // resolved holder implies: only the origin check can refuse it.
    markPending(root, 'u1', {
      operationId: 'op-register-u1',
      request: creationOf(root, 'u1').request,
      capacityClaims: (record.capacityClaims as JsonObject[]).map((c) => ({
        ...c,
        ownership: 'pending',
        disposition: c.purpose === 'first-resolution' ? 'consumed' : c.disposition
      }))
    });
    root.deleteChild('task-u1.json').orThrow();
    expect(blocked(await open(root)).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'integrity',
          message: expect.stringContaining("not registered by 'register-external'")
        })
      ])
    );
  });
});
