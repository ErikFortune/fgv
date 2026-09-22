/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { FileTree } from '@fgv/ts-json-base';
import {
  FileTreeTaskRepository,
  ITaskCapacityProfile,
  ITaskRepository,
  TaskRepositoryMode,
  defaultTaskCapacityProfile
} from '../../../index';
import { FaultyRoot } from '../../helpers/faultyRoot';
import { environment, memoryRoot, params, registration, registry } from '../../helpers/storageFixtures';

function code(value: string): unknown {
  return expect.objectContaining({ code: value });
}

async function initialized(root: FileTree.IFileTreeDirectoryItem): Promise<ITaskRepository> {
  return (await FileTreeTaskRepository.initialize(params(root, 'session'))).orThrow();
}

async function reopened(root: FileTree.IFileTreeDirectoryItem): Promise<ITaskRepository> {
  const opened = (await FileTreeTaskRepository.open(params(root, 'session'))).orThrow();
  if (opened.state !== 'ready') {
    throw new Error(`expected ready, got ${JSON.stringify(opened.recovery.report.issues)}`);
  }
  return opened.repository;
}

function names(root: FileTree.IFileTreeDirectoryItem): ReadonlyArray<string> {
  return root
    .getChildren()
    .orThrow()
    .map((c) => c.name)
    .sort();
}

describe('mode and root qualification', () => {
  test('a durable repository is refused on a session-only root, never degraded', async () => {
    const root = memoryRoot();
    expect(
      await FileTreeTaskRepository.initialize(params(root, { durable: 'process-crash' }))
    ).toFailWithDetail(/cannot honor a 'process-crash'.*refused rather than degraded/i, code('unsupported'));
    // Nothing was written: the refusal came before any I/O.
    expect(names(root)).toEqual([]);
  });

  test('a stronger guarantee than process-crash cannot even be requested', async () => {
    for (const durable of ['os-crash', 'power-loss']) {
      const mode = { durable } as unknown as TaskRepositoryMode;
      expect(await FileTreeTaskRepository.initialize(params(memoryRoot(), mode))).toFailWithDetail(
        /OS-crash and power-loss durability are not offered/i,
        code('unsupported')
      );
    }
  });

  test('a root that is a file, or that offers no atomic writes, is refused', async () => {
    const accessors = FileTree.InMemoryTreeAccessors.create([{ path: '/a.json', contents: {} }], {
      mutable: true
    }).orThrow();
    const file = accessors.getItem('/a.json').orThrow();
    expect(await FileTreeTaskRepository.initialize(params(file, 'session'))).toFailWithDetail(
      /must be a directory/i,
      code('unsupported')
    );
    const readOnly = FileTree.DirectoryItem.create(
      '/',
      FileTree.InMemoryTreeAccessors.create([]).orThrow()
    ).orThrow();
    expect(await FileTreeTaskRepository.initialize(params(readOnly, 'session'))).toFailWithDetail(
      /cannot honor a 'session'/i,
      code('unsupported')
    );
  });
});

describe('initialize', () => {
  test('an empty root initializes, writing only the manifest', async () => {
    const root = memoryRoot();
    const repository = await initialized(root);
    expect(names(root)).toEqual(['repository.json']);
    expect(repository.repositoryId).toBe('id-1');
    expect(repository.profile).toEqual(defaultTaskCapacityProfile);
    expect(repository.health()).toEqual({ state: 'ready', generation: 0, issues: [] });
  });

  test('a non-empty root is refused, and left exactly as it was', async () => {
    const accessors = FileTree.InMemoryTreeAccessors.create([{ path: '/notes.txt', contents: 'hello' }], {
      mutable: true
    }).orThrow();
    const root = FileTree.DirectoryItem.create('/', accessors).orThrow();
    expect(await FileTreeTaskRepository.initialize(params(root, 'session'))).toFailWithDetail(
      /not empty \(notes\.txt\)/i,
      code('invalid')
    );
    expect(names(root)).toEqual(['notes.txt']);
  });

  test('an already-initialized root is refused rather than re-initialized', async () => {
    const root = memoryRoot();
    (await initialized(root)).close();
    expect(await FileTreeTaskRepository.initialize(params(root, 'session'))).toFailWithDetail(
      /already holds a repository/i,
      code('conflict')
    );
  });

  test('an invalid profile or identity refuses initialization and releases the root', async () => {
    const root = memoryRoot();
    const tooSmall: ITaskCapacityProfile = {
      ...defaultTaskCapacityProfile,
      limits: { ...defaultTaskCapacityProfile.limits, updates: 1 }
    };
    expect(
      await FileTreeTaskRepository.initialize(params(root, 'session', { profile: tooSmall }))
    ).toFailWithDetail(/must be able to finish the work it can accept/i, code('invalid'));
    // The root was released, so a correct initialization can still take it.
    expect(await FileTreeTaskRepository.initialize(params(root, 'session'))).toSucceed();
  });

  test('a manifest write that fails leaves nothing and releases the root', async () => {
    const root = new FaultyRoot(memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem);
    root.faults.push({ name: 'repository.json', when: 'before', visibility: 'unchanged' });
    expect(await FileTreeTaskRepository.initialize(params(root, 'session'))).toFailWithDetail(
      /injected before-write failure/i,
      expect.objectContaining({ code: 'storage-unavailable', retry: 'safe' })
    );
    expect(await FileTreeTaskRepository.initialize(params(root, 'session'))).toSucceed();
  });
});

describe('open', () => {
  test('an empty root is not a repository, and open never initializes it', async () => {
    const root = memoryRoot();
    expect(await FileTreeTaskRepository.open(params(root, 'session'))).toFailWithDetail(
      /holds no repository; initialize one explicitly/i,
      code('storage-unavailable')
    );
    expect(names(root)).toEqual([]);
  });

  test('a missing manifest in a non-empty root yields a recovery handle, never a new repository', async () => {
    const root = memoryRoot();
    const repository = await initialized(root);
    expect(await repository.withWriter((w) => w.register(registration('t1')))).toSucceed();
    repository.close();
    (root as FileTree.IMutableFileTreeDirectoryItem).deleteChild('repository.json').orThrow();

    expect(await FileTreeTaskRepository.open(params(root, 'session'))).toSucceedAndSatisfy((opened) => {
      expect(opened.state).toBe('recovery-required');
      if (opened.state === 'recovery-required') {
        expect(opened.recovery.report.issues).toEqual([
          expect.objectContaining({ code: 'manifest-missing', severity: 'blocking' })
        ]);
        // The record is still there and still readable for inspection; nothing was rewritten.
        expect(opened.recovery.readRaw('task-t1.json')).toSucceedAndSatisfy((text) => {
          expect(JSON.parse(text).task.envelope.id).toBe('t1');
        });
        expect(opened.recovery.readRaw('nothing.json')).toFailWith(/not present/i);
        expect(opened.recovery.close()).toSucceedWith(true);
        expect(opened.recovery.close()).toSucceedWith(false);
        expect(opened.recovery.readRaw('task-t1.json')).toFailWith(/closed/i);
      }
    });
    expect(names(root)).toEqual(['task-t1.json']);
  });

  test('a reopened repository sees exactly what was committed', async () => {
    const root = memoryRoot();
    const first = await initialized(root);
    expect(await first.withWriter((w) => w.register(registration('t1')))).toSucceed();
    first.close();

    const second = await reopened(root);
    expect(second.repositoryId).toBe(first.repositoryId);
    expect(await second.read('t1' as never)).toSucceedAndSatisfy((read) => {
      expect(read?.state).toBe('resolved');
    });
    expect(second.report.issues).toEqual([]);
  });

  test('the same root cannot be open twice in one process, and close releases it', async () => {
    const root = memoryRoot();
    const repository = await initialized(root);
    expect(await FileTreeTaskRepository.open(params(root, 'session'))).toFailWithDetail(
      /already open in this process/i,
      code('conflict')
    );
    expect(repository.close()).toSucceedWith(true);
    expect(repository.close()).toSucceedWith(false);
    expect(await FileTreeTaskRepository.open(params(root, 'session'))).toSucceed();
  });

  test('two different in-memory roots at the same path are different roots', async () => {
    await initialized(memoryRoot());
    expect(await FileTreeTaskRepository.initialize(params(memoryRoot(), 'session'))).toSucceed();
  });

  test('open freezes the kind registry, so no kind can appear under committed data', async () => {
    const root = memoryRoot();
    (await initialized(root)).close();
    const reg = registry();
    expect(reg.isFrozen).toBe(false);
    expect(await FileTreeTaskRepository.open(params(root, 'session', { registry: reg }))).toSucceed();
    expect(reg.isFrozen).toBe(true);
  });

  test('a closed repository refuses every operation', async () => {
    const repository = await initialized(memoryRoot());
    repository.close();
    expect(await repository.read('t1' as never)).toFailWithDetail(/closed/i, code('storage-unavailable'));
    expect(await repository.withWriter(async (w) => w.readCommit('t1' as never))).toFailWithDetail(
      /closed/i,
      code('storage-unavailable')
    );
    expect(repository.capacityStatus()).toFailWith(/closed/i);
    expect(repository.health().state).toBe('closed');
  });

  test('open performs no clock read, no identity mint and no logging', async () => {
    const root = memoryRoot();
    const repository = await initialized(root);
    expect(await repository.withWriter((w) => w.register(registration('t1')))).toSucceed();
    repository.close();

    let clockReads: number = 0;
    let mints: number = 0;
    const { env, logger } = environment();
    const spied = Object.assign(Object.create(Object.getPrototypeOf(env)), env, {
      clock: () => {
        clockReads++;
        return env.clock();
      },
      newId: () => {
        mints++;
        return env.newId();
      }
    });
    expect(await FileTreeTaskRepository.open(params(root, 'session', { environment: spied }))).toSucceed();
    expect(clockReads).toBe(0);
    expect(mints).toBe(0);
    expect(logger.logged).toEqual([]);
  });

  test('a listing failure refuses open and releases the root', async () => {
    const inner = memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem;
    (await initialized(inner)).close();
    const root = new FaultyRoot(inner);
    root.failChildren = true;
    expect(await FileTreeTaskRepository.open(params(root, 'session'))).toFailWithDetail(
      /cannot list/i,
      code('storage-unavailable')
    );
    root.failChildren = false;
    expect(await FileTreeTaskRepository.open(params(root, 'session'))).toSucceed();
  });
});

describe('the stored capacity profile governs', () => {
  const custom: ITaskCapacityProfile = {
    ...defaultTaskCapacityProfile,
    limits: { ...defaultTaskCapacityProfile.limits, 'retained-tasks': 50, 'non-archived-tasks': 20 }
  };

  test('reopening with no profile uses the stored one, not the current defaults', async () => {
    const root = memoryRoot();
    (await FileTreeTaskRepository.initialize(params(root, 'session', { profile: custom }))).orThrow().close();
    const repository = await reopened(root);
    expect(repository.profile.limits['retained-tasks']).toBe(50);
    expect(repository.profile).not.toEqual(defaultTaskCapacityProfile);
  });

  test('a lower, higher or otherwise different requested profile is refused and nothing is rewritten', async () => {
    const root = memoryRoot();
    (await FileTreeTaskRepository.initialize(params(root, 'session', { profile: custom }))).orThrow().close();
    const before = (root.getChildren().orThrow()[0] as FileTree.IFileTreeFileItem).getRawContents().orThrow();

    const lower: ITaskCapacityProfile = { ...custom, limits: { ...custom.limits, 'retained-tasks': 40 } };
    const higher: ITaskCapacityProfile = { ...custom, limits: { ...custom.limits, 'retained-tasks': 60 } };
    for (const profile of [lower, higher, defaultTaskCapacityProfile]) {
      expect(await FileTreeTaskRepository.open(params(root, 'session', { profile }))).toFailWithDetail(
        /differs from the stored one/i,
        code('unsupported')
      );
    }
    const after = (root.getChildren().orThrow()[0] as FileTree.IFileTreeFileItem).getRawContents().orThrow();
    expect(after).toBe(before);
    // And the root was released each time.
    expect(await FileTreeTaskRepository.open(params(root, 'session', { profile: custom }))).toSucceed();
  });
});
