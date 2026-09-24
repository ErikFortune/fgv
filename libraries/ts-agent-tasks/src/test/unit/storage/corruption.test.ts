/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { FileTree, JsonObject } from '@fgv/ts-json-base';
import {
  FileTreeTaskRepository,
  ITaskRecoveryIssue,
  ITaskRecoveryReport,
  ITaskRepository,
  TaskId,
  TaskRepositoryOpenResult,
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
  vendorKind
} from '../../helpers/storageFixtures';

type Root = FileTree.IAtomicFileTreeDirectoryItem & FileTree.IMutableFileTreeDirectoryItem;

function readText(root: Root, name: string): string {
  const file = root
    .getChildren()
    .orThrow()
    .find((c) => c.name === name) as FileTree.IFileTreeFileItem | undefined;
  if (file === undefined) {
    throw new Error(`${name}: missing`);
  }
  return file.getRawContents().orThrow();
}

function readJson(root: Root, name: string): JsonObject {
  return JSON.parse(readText(root, name)) as JsonObject;
}

function writeText(root: Root, name: string, text: string): void {
  root.writeChildAtomically(name, text, { guarantee: 'session' }).orThrow();
}

function writeJson(root: Root, name: string, value: unknown): void {
  writeText(root, name, JSON.stringify(value));
}

/** A root holding a closed repository with tasks t1 and t2 (t2 a child of t1). */
async function populated(): Promise<Root> {
  const root = memoryRoot() as Root;
  const repository = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
  (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
  (
    await repository.withWriter((w) =>
      w.register(registration('t2', { envelope: { parentId: 't1' as TaskId } }))
    )
  ).orThrow();
  repository.close();
  return root;
}

async function open(
  root: Root,
  reg: ReturnType<typeof registry> = registry()
): Promise<TaskRepositoryOpenResult> {
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

function issue(code: string, severity: 'blocking' | 'advisory', message: RegExp): ITaskRecoveryIssue {
  return expect.objectContaining({ code, severity, message: expect.stringMatching(message) });
}

describe('open refuses a writable repository over detectable corruption, and rewrites nothing', () => {
  let root: Root;
  let snapshot: Map<string, string>;

  beforeEach(async () => {
    root = await populated();
  });

  function freeze(): void {
    snapshot = new Map(
      root
        .getChildren()
        .orThrow()
        .map((c) => [c.name, readText(root, c.name)])
    );
  }

  function unchanged(): void {
    for (const [name, text] of snapshot) {
      expect(readText(root, name)).toBe(text);
    }
  }

  test('malformed JSON in a task record', async () => {
    writeText(root, 'task-t1.json', '{"formatVersion":1,');
    freeze();
    expect(blocked(await open(root)).issues).toEqual([
      issue('unreadable', 'blocking', /task-t1\.json: not JSON/)
    ]);
    unchanged();
  });

  test('a record whose id disagrees with its filename', async () => {
    writeText(root, 'task-t1.json', readText(root, 'task-t2.json'));
    freeze();
    expect(blocked(await open(root)).issues).toEqual(
      expect.arrayContaining([issue('record-id-mismatch', 'blocking', /task-t1\.json: holds task t2/)])
    );
    unchanged();
  });

  test('a live record the inventory names but the root no longer holds', async () => {
    root.deleteChild('task-t2.json').orThrow();
    freeze();
    expect(blocked(await open(root)).issues).toEqual([
      issue('record-missing', 'blocking', /task-t2\.json: named live by the inventory but missing/)
    ]);
    unchanged();
  });

  test('a record that fails the strict converters', async () => {
    const record = readJson(root, 'task-t1.json');
    writeJson(root, 'task-t1.json', { ...record, surprise: true });
    freeze();
    expect(blocked(await open(root)).issues).toEqual([issue('record-invalid', 'blocking', /surprise/)]);
    unchanged();
  });

  test('an envelope written by a newer envelope schema', async () => {
    const record = readJson(root, 'task-t1.json');
    const task = record.task as JsonObject;
    writeJson(root, 'task-t1.json', {
      ...record,
      task: { ...task, envelope: { ...(task.envelope as JsonObject), schemaVersion: 2 } }
    });
    freeze();
    expect(blocked(await open(root)).issues).toEqual([issue('record-invalid', 'blocking', /task-t1\.json/)]);
    unchanged();
  });

  test('a record over its size ceiling is refused before it is parsed', async () => {
    writeText(root, 'task-t1.json', `${' '.repeat(defaultTaskCapacityProfile.encoded.maxTaskRecordBytes)}{}`);
    freeze();
    expect(blocked(await open(root)).issues).toEqual(
      expect.arrayContaining([issue('record-invalid', 'blocking', /exceeds its ceiling of 8388608/)])
    );
    unchanged();
  });

  test('a manifest that is not valid, or not JSON', async () => {
    writeJson(root, 'repository.json', { formatVersion: 1, nonsense: true });
    freeze();
    expect(blocked(await open(root)).issues).toEqual([
      issue('manifest-invalid', 'blocking', /repository\.json/)
    ]);
    unchanged();
    writeText(root, 'repository.json', 'not json');
    expect(blocked(await open(root)).issues).toEqual([issue('unreadable', 'blocking', /not JSON/)]);
  });

  test('a dangling parent edge', async () => {
    const manifest = readJson(root, 'repository.json');
    writeJson(root, 'repository.json', { ...manifest, tasks: [{ id: 't2', state: 'live' }] });
    freeze();
    expect(blocked(await open(root)).issues).toEqual(
      expect.arrayContaining([
        issue('integrity', 'blocking', /task t2: parent t1 is not a live task/),
        issue('unexpected-record', 'advisory', /task-t1\.json: a task record the inventory does not name/)
      ])
    );
    unchanged();
  });

  test('a cyclic parent chain', async () => {
    const record = readJson(root, 'task-t1.json');
    const task = record.task as JsonObject;
    writeJson(root, 'task-t1.json', {
      ...record,
      task: { ...task, envelope: { ...(task.envelope as JsonObject), parentId: 't2' } }
    });
    freeze();
    expect(blocked(await open(root)).issues).toEqual(
      expect.arrayContaining([issue('integrity', 'blocking', /parent chain is cyclic/)])
    );
    unchanged();
  });

  test('a claim id held by two records — the join key recovery depends on', async () => {
    const one = readJson(root, 'task-t1.json');
    const two = readJson(root, 'task-t2.json');
    // t2's own claims, relabelled with t1's ids: each is otherwise a valid t2 reservation.
    const oneClaims = one.capacityClaims as JsonObject[];
    writeJson(root, 'task-t2.json', {
      ...two,
      capacityClaims: (two.capacityClaims as JsonObject[]).map((c, i) => ({
        ...c,
        claimId: oneClaims[i].claimId
      }))
    });
    freeze();
    expect(blocked(await open(root)).issues).toEqual([
      issue('integrity', 'blocking', /claim id-\d+ is held by both t1 and t2/)
    ]);
    unchanged();
  });

  test('records that exceed their own stored policy', async () => {
    const manifest = readJson(root, 'repository.json');
    const profile = manifest.profile as JsonObject;
    writeJson(root, 'repository.json', {
      ...manifest,
      profile: { ...profile, limits: { ...(profile.limits as JsonObject), 'retained-tasks': 1 } }
    });
    freeze();
    expect(blocked(await open(root)).issues).toEqual([
      issue('integrity', 'blocking', /exceed the stored capacity profile in: retained-tasks/)
    ]);
    unchanged();
  });

  test('a pending entry whose present record is not that registration', async () => {
    const manifest = readJson(root, 'repository.json');
    writeJson(root, 'repository.json', {
      ...manifest,
      tasks: [
        { id: 't1', state: 'live' },
        {
          id: 't2',
          state: 'pending',
          operationId: 'op-someone-else',
          operation: 'create-tracked',
          principalKey: 'host',
          recordType: 'resolved',
          request: {},
          capacityClaims: []
        }
      ]
    });
    freeze();
    expect(blocked(await open(root)).issues).toEqual([
      issue('integrity', 'blocking', /present for pending registration 'op-someone-else'/)
    ]);
    unchanged();
  });

  test('a pending entry whose present record carries its operation but different claims is not completed', async () => {
    // The join key between a pending entry and its record is the claim id set, not only the
    // operation id: completing a registration whose record holds other claims would count one
    // reservation as another's.
    const manifest = readJson(root, 'repository.json');
    const record = readJson(root, 'task-t2.json');
    const operationId = (record.operations as JsonObject[])[0].operationId as string;
    writeJson(root, 'repository.json', {
      ...manifest,
      tasks: [
        { id: 't1', state: 'live' },
        {
          id: 't2',
          state: 'pending',
          operationId,
          operation: 'create-tracked',
          principalKey: 'host',
          recordType: 'resolved',
          request: (record.operations as JsonObject[])[0].request,
          capacityClaims: []
        }
      ]
    });
    freeze();
    expect(blocked(await open(root)).issues).toEqual([
      issue('integrity', 'blocking', /present for pending registration 'op-create-t2'.*its claims differ/)
    ]);
    expect(operationId).toBe('op-create-t2');
    unchanged();
  });

  test('an inventory entry whose id is not a valid identifier', async () => {
    const manifest = readJson(root, 'repository.json');
    writeJson(root, 'repository.json', {
      ...manifest,
      tasks: [...(manifest.tasks as JsonObject[]), { id: `${'x'.repeat(200)}`, state: 'live' }]
    });
    expect(blocked(await open(root)).issues).toEqual(
      expect.arrayContaining([
        issue('manifest-invalid', 'blocking', /identifier: 200 characters exceeds the maximum of 128/)
      ])
    );
  });
});

describe('unknown data is retained without lossy rewrite', () => {
  test('a record written by a newer storage format survives a round trip through this release', async () => {
    const root = await populated();
    const newer = {
      ...readJson(root, 'task-t1.json'),
      formatVersion: 2,
      futureField: { anything: [1, 2, 3] }
    };
    writeJson(root, 'task-t1.json', newer);
    const before = readText(root, 'task-t1.json');

    const report = blocked(await open(root));
    expect(report.issues).toEqual([
      issue(
        'unknown-format-version',
        'blocking',
        /storage format 2 is not readable by this release; retained untouched/
      )
    ]);
    expect(readText(root, 'task-t1.json')).toBe(before);
  });

  test('a manifest written by a newer storage format is reported as such, and kept', async () => {
    const root = await populated();
    writeJson(root, 'repository.json', { ...readJson(root, 'repository.json'), formatVersion: 3 });
    const before = readText(root, 'repository.json');
    expect(blocked(await open(root)).issues).toEqual([
      issue('unknown-format-version', 'blocking', /storage format 3/)
    ]);
    expect(readText(root, 'repository.json')).toBe(before);
  });

  test('an unregistered kind is quarantined: reported, readable raw, never rewritten, never committed to', async () => {
    const root = memoryRoot() as Root;
    const repository = (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
    const vendor = registration('v1', { envelope: { kind: vendorKind } });
    const draft = vendor.record.recordType === 'resolved' ? vendor.record : undefined;
    (
      await repository.withWriter((w) =>
        w.register({
          ...vendor,
          record: { ...draft!, task: { envelope: draft!.task.envelope, details: { job: 'j-1' } } }
        })
      )
    ).orThrow();
    (await repository.withWriter((w) => w.register(unresolvedRegistration('u1')))).orThrow();
    (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
    repository.close();
    const before = readText(root, 'task-v1.json');

    // Reopen without the vendor kind registered.
    const reopened = ready(await open(root, registry({ withoutVendor: true })));
    expect(reopened.report.issues).toEqual([
      issue('unknown-kind', 'advisory', /task-u1\.json: acme\.job@1 is not registered; quarantined/),
      issue(
        'unknown-kind',
        'advisory',
        /task-v1\.json: acme\.job@1 is not registered; quarantined and never rewritten/
      )
    ]);
    expect(await reopened.read('v1' as TaskId)).toFailWithDetail(
      /no registered task kind/i,
      expect.objectContaining({ code: 'unknown-kind-version' })
    );
    expect(await reopened.readCommit('v1' as TaskId)).toSucceedAndSatisfy((record) => {
      expect(record?.recordType).toBe('resolved');
    });
    const v1 = (await reopened.readCommit('v1' as TaskId)).orThrow()!;
    expect(
      await reopened.withWriter((w) =>
        w.commit({
          purpose: 'maintenance',
          taskId: 'v1' as TaskId,
          expectedRevision: 1 as never,
          expectedRecordRevision: v1.recordRevision,
          record: {
            recordType: 'resolved',
            task: v1.recordType === 'resolved' ? v1.task : (undefined as never),
            operations: v1.operations,
            updates: [],
            archived: false
          }
        })
      )
    ).toFailWithDetail(
      /is not registered; the record is quarantined/i,
      expect.objectContaining({ code: 'unknown-kind-version' })
    );
    // Unrelated work proceeds.
    const t1 = (await reopened.readCommit('t1' as TaskId)).orThrow()!;
    expect(
      await reopened.withWriter((w) =>
        w.commit({
          purpose: 'operation',
          operationId: 'op-2' as never,
          taskId: 't1' as TaskId,
          expectedRevision: 1 as never,
          expectedRecordRevision: 1,
          record: nextDraft(t1, {
            envelope: envelope('t1', 2, { title: 'renamed' }),
            operation: catalogOp('op-2', 'update-tracked', {})
          })
        })
      )
    ).toSucceed();
    expect(readText(root, 'task-v1.json')).toBe(before);
  });

  test('files the inventory does not name are reported and left alone', async () => {
    const root = await populated();
    writeText(root, 'notes.txt', 'operator notes');
    writeJson(root, 'task-stray.json', { hello: 'world' });
    const repository = ready(await open(root));
    expect(repository.report.issues).toEqual([
      issue('unexpected-record', 'advisory', /notes\.txt: not a repository file/),
      issue('unexpected-record', 'advisory', /task-stray\.json: a task record the inventory does not name/)
    ]);
    expect(readText(root, 'notes.txt')).toBe('operator notes');
  });
});

describe('consumer and source records: what this release owns of them', () => {
  async function withEntries(entries: { consumers?: unknown[]; sources?: unknown[] }): Promise<Root> {
    const root = await populated();
    const manifest = readJson(root, 'repository.json');
    writeJson(root, 'repository.json', {
      ...manifest,
      consumers: entries.consumers ?? [],
      sources: entries.sources ?? []
    });
    return root;
  }

  test('a present consumer record with a matching header is accepted opaque, a source record in full, and both are charged', async () => {
    const root = await withEntries({
      consumers: [{ id: 's1', state: 'live' }],
      sources: [{ id: 'acme', state: 'live' }]
    });
    writeJson(root, 'consumer-s1.json', { formatVersion: 1, id: 's1', laterSliceContent: { a: 1 } });
    writeJson(root, 'source-acme.json', {
      formatVersion: 1,
      id: 'acme',
      recordRevision: 3,
      history: 'source-replay',
      cursor: 'c-9',
      pages: 2
    });
    const repository = ready(await open(root));
    expect(repository.capacityStatus()).toSucceedAndSatisfy((status) => {
      expect(status.dimensions.find((d) => d.dimension === 'subscriptions')?.used).toBe(1);
      expect(status.dimensions.find((d) => d.dimension === 'sources')?.used).toBe(1);
    });
  });

  test('a missing named consumer record is as serious as a missing task', async () => {
    const root = await withEntries({ consumers: [{ id: 's1', state: 'live' }] });
    expect(blocked(await open(root)).issues).toEqual([
      issue('record-missing', 'blocking', /consumer-s1\.json: named live by the inventory but missing/)
    ]);
  });

  test('a consumer or source record whose header disagrees, or is from another format, blocks', async () => {
    const root = await withEntries({
      consumers: [
        { id: 's1', state: 'live' },
        { id: 's2', state: 'live' }
      ],
      sources: [{ id: 'acme', state: 'live' }]
    });
    writeJson(root, 'consumer-s1.json', { formatVersion: 1, id: 's9' });
    writeJson(root, 'consumer-s2.json', { formatVersion: 2, id: 's2' });
    writeJson(root, 'source-acme.json', { id: 'acme' });
    expect(blocked(await open(root)).issues).toEqual([
      issue('record-id-mismatch', 'blocking', /consumer-s1\.json: holds consumer s9/),
      issue('unknown-format-version', 'blocking', /consumer-s2\.json: storage format 2/),
      issue('record-invalid', 'blocking', /source-acme\.json/)
    ]);
  });

  test('a pending consumer registration is not readable by this release', async () => {
    const root = await withEntries({
      consumers: [
        {
          id: 's1',
          state: 'pending',
          operationId: 'op-sub',
          operation: 'create-tracked',
          principalKey: 'host',
          recordType: 'resolved',
          request: {},
          capacityClaims: []
        }
      ]
    });
    expect(blocked(await open(root)).issues).toEqual([
      issue(
        'record-invalid',
        'blocking',
        /consumer-s1\.json: pending consumer registrations are not readable/
      )
    ]);
  });

  test('an unreadable consumer record blocks', async () => {
    const root = await withEntries({ sources: [{ id: 'acme', state: 'live' }] });
    writeText(root, 'source-acme.json', '{');
    expect(blocked(await open(root)).issues).toEqual([
      issue('unreadable', 'blocking', /source-acme\.json: not JSON/)
    ]);
  });
});
