/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import fs from 'fs';
import path from 'path';
import { FileTree } from '@fgv/ts-json-base';
import { Result, fail, failWithDetail, succeedWithDetail } from '@fgv/ts-utils';
import {
  FileTreeTaskRepository,
  IOpenOrInitializeTaskRepositoryParams,
  ITaskFailure,
  ITaskRepository,
  TaskId,
  TaskResult,
  openOrInitializeTaskRepository,
  probeTaskRepositoryRoot,
  runTaskRepositoryConformance
} from '../../../index';
import { FaultyRoot } from '../../helpers/faultyRoot';
import { brokerRegistry } from '../../helpers/brokerFixtures';
import {
  environment,
  memoryRoot,
  nodeRoot,
  nodeRootAt,
  params,
  registration
} from '../../helpers/storageFixtures';

const code = (c: string): unknown => expect.objectContaining({ code: c });

function hostParams(
  root: FileTree.FileTreeItem,
  overrides?: Partial<IOpenOrInitializeTaskRepositoryParams>
): IOpenOrInitializeTaskRepositoryParams {
  return {
    root,
    fallback: 'refuse',
    environment: environment().env,
    registry: brokerRegistry(),
    ...overrides
  };
}

/** A directory with the plain directory methods and no atomic capability at all. */
function plainRoot(): FileTree.IFileTreeDirectoryItem {
  const inner = memoryRoot();
  return {
    type: 'directory',
    absolutePath: inner.absolutePath,
    name: inner.name,
    getChildren: () => inner.getChildren()
  };
}

/** A root over a real directory that reports only the capabilities given. */
function reporting(
  dir: string,
  capabilities: FileTree.IAtomicWriteCapabilities
): FileTree.IFileTreeDirectoryItem {
  const faulty = new FaultyRoot(nodeRootAt(dir) as FileTree.IAtomicFileTreeDirectoryItem);
  faulty.capabilities = capabilities;
  return faulty as unknown as FileTree.IFileTreeDirectoryItem;
}

function manifestOf(dir: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(dir, 'repository.json'), 'utf8')) as Record<string, unknown>;
}

const dirs: string[] = [];
function freshDir(): string {
  const { dir } = nodeRoot();
  dirs.push(dir);
  return dir;
}

afterAll(() => {
  for (const dir of dirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('probeTaskRepositoryRoot', () => {
  test('names the strongest mode a root qualifies for', () => {
    expect(probeTaskRepositoryRoot(memoryRoot())).toSucceedAndSatisfy((probe) => {
      expect(probe.mode).toBe('session');
      expect(probe.guarantees).toEqual(['session']);
      expect('reason' in probe).toBe(false);
    });
    expect(probeTaskRepositoryRoot(nodeRootAt(freshDir()))).toSucceedAndSatisfy((probe) => {
      expect(probe.mode).toEqual({ durable: 'process-crash' });
      expect(probe.guarantees).toContain('process-crash');
    });
  });

  test('a root that lists guarantees but cannot replace atomically qualifies for nothing', () => {
    const root = reporting(freshDir(), { atomicReplace: false, guarantees: ['session', 'process-crash'] });
    expect(probeTaskRepositoryRoot(root)).toSucceedAndSatisfy((probe) => {
      expect(probe.mode).toBeUndefined();
      expect(probe.guarantees).toEqual([]);
      expect(probe.mode === undefined && probe.reason).toMatch(/cannot honor a 'session' or 'process-crash'/);
    });
  });

  test('the repository itself refuses that root for the same reason: one definition', async () => {
    const root = reporting(freshDir(), { atomicReplace: false, guarantees: ['session', 'process-crash'] });
    expect(await FileTreeTaskRepository.initialize(params(root, 'session'))).toFailWithDetail(
      /cannot honor a 'session' atomic write/,
      code('unsupported')
    );
  });

  test('a root offering only guarantees a repository has no mode for qualifies for nothing', () => {
    const root = reporting(freshDir(), { atomicReplace: true, guarantees: ['os-crash'] });
    expect(probeTaskRepositoryRoot(root)).toSucceedAndSatisfy((probe) => expect(probe.mode).toBeUndefined());
  });

  test('a root without the capability succeeds with a reason; a file, or a failing inquiry, fails', () => {
    expect(probeTaskRepositoryRoot(plainRoot())).toSucceedAndSatisfy((probe) => {
      expect(probe.mode === undefined && probe.reason).toMatch(/does not offer atomic writes/);
    });
    const dir = freshDir();
    fs.writeFileSync(path.join(dir, 'f.txt'), 'x');
    const file = nodeRootAt(dir)
      .getChildren()
      .orThrow()
      .find((c) => c.name === 'f.txt')!;
    expect(probeTaskRepositoryRoot(file)).toFailWith(/must be a directory/);
    const failing = new FaultyRoot(memoryRoot() as FileTree.IAtomicFileTreeDirectoryItem);
    failing.getAtomicWriteCapabilities = (): Result<FileTree.IAtomicWriteCapabilities> =>
      fail('inquiry offline');
    expect(probeTaskRepositoryRoot(failing as unknown as FileTree.FileTreeItem)).toFailWith(
      /inquiry offline/
    );
  });
});

describe('the manifest records the mode a repository was initialized in', () => {
  test('a durable repository records process-crash, and keeps it through later manifest writes', async () => {
    const dir = freshDir();
    const repository = (
      await FileTreeTaskRepository.initialize(params(nodeRootAt(dir), { durable: 'process-crash' }))
    ).orThrow();
    expect(manifestOf(dir).initializedMode).toBe('process-crash');
    expect(await repository.withWriter((w) => w.register(registration('t1')))).toSucceed();
    expect(manifestOf(dir).manifestRevision).toBeGreaterThan(1);
    expect(manifestOf(dir).initializedMode).toBe('process-crash');
    repository.close();
  });

  test('opening it as a session is refused without the opt-in, and writes nothing', async () => {
    const dir = freshDir();
    (await FileTreeTaskRepository.initialize(params(nodeRootAt(dir), { durable: 'process-crash' })))
      .orThrow()
      .close();
    const before = fs.readFileSync(path.join(dir, 'repository.json'), 'utf8');
    expect(await FileTreeTaskRepository.open(params(nodeRootAt(dir), 'session'))).toFailWithDetail(
      /initialized 'process-crash' and is being opened as 'session'/,
      code('unsupported')
    );
    expect(fs.readFileSync(path.join(dir, 'repository.json'), 'utf8')).toBe(before);
    // The refusal released the root: the explicit opt-in then opens it.
    const opened = (
      await FileTreeTaskRepository.open(params(nodeRootAt(dir), 'session', { allowSessionOverDurable: true }))
    ).orThrow();
    expect(opened.state).toBe('ready');
    if (opened.state === 'ready') {
      expect(opened.repository.mode).toBe('session');
      opened.repository.close();
    }
  });

  test('a session repository records session, and opens durably later', async () => {
    const dir = freshDir();
    (await FileTreeTaskRepository.initialize(params(nodeRootAt(dir), 'session'))).orThrow().close();
    expect(manifestOf(dir).initializedMode).toBe('session');
    const opened = (
      await FileTreeTaskRepository.open(params(nodeRootAt(dir), { durable: 'process-crash' }))
    ).orThrow();
    expect(opened.state).toBe('ready');
    if (opened.state === 'ready') {
      opened.repository.close();
    }
  });

  test('a manifest written before the field existed opens in either mode', async () => {
    const dir = freshDir();
    (await FileTreeTaskRepository.initialize(params(nodeRootAt(dir), { durable: 'process-crash' })))
      .orThrow()
      .close();
    const manifest = manifestOf(dir);
    delete manifest.initializedMode;
    fs.writeFileSync(path.join(dir, 'repository.json'), JSON.stringify(manifest));
    const opened = (await FileTreeTaskRepository.open(params(nodeRootAt(dir), 'session'))).orThrow();
    expect(opened.state).toBe('ready');
    if (opened.state === 'ready') {
      opened.repository.close();
    }
  });

  test('a durable open backfills the mode into an older manifest, which then refuses a session open', async () => {
    const dir = freshDir();
    (await FileTreeTaskRepository.initialize(params(nodeRootAt(dir), { durable: 'process-crash' })))
      .orThrow()
      .close();
    const manifest = manifestOf(dir);
    delete manifest.initializedMode;
    fs.writeFileSync(path.join(dir, 'repository.json'), JSON.stringify(manifest));
    const opened = (
      await FileTreeTaskRepository.open(params(nodeRootAt(dir), { durable: 'process-crash' }))
    ).orThrow();
    expect(manifestOf(dir).initializedMode).toBe('process-crash');
    if (opened.state === 'ready') {
      // The rewritten manifest is the one the instance holds: a later write still commits.
      expect(await opened.repository.withWriter((w) => w.register(registration('t1')))).toSucceed();
      opened.repository.close();
    }
    expect(await FileTreeTaskRepository.open(params(nodeRootAt(dir), 'session'))).toFailWithDetail(
      /initialized 'process-crash'/,
      code('unsupported')
    );
  });

  test('an initialization mode it does not know makes the manifest invalid', async () => {
    const dir = freshDir();
    (await FileTreeTaskRepository.initialize(params(nodeRootAt(dir), 'session'))).orThrow().close();
    fs.writeFileSync(
      path.join(dir, 'repository.json'),
      JSON.stringify({ ...manifestOf(dir), initializedMode: 'power-loss' })
    );
    const opened = (await FileTreeTaskRepository.open(params(nodeRootAt(dir), 'session'))).orThrow();
    expect(opened.state).toBe('recovery-required');
    if (opened.state === 'recovery-required') {
      expect(opened.recovery.report.issues.map((i) => i.code)).toContain('manifest-invalid');
      opened.recovery.close();
    }
  });
});

describe('openOrInitializeTaskRepository', () => {
  test('an empty durable root is initialized process-crash, and reopened afterwards', async () => {
    const dir = freshDir();
    const first = (await openOrInitializeTaskRepository(hostParams(nodeRootAt(dir)))).orThrow();
    expect(first).toEqual(
      expect.objectContaining({ state: 'ready', durability: 'process-crash', placement: 'root' })
    );
    expect(first.report).toEqual(
      expect.objectContaining({ placement: 'root', durability: 'process-crash', initialized: true })
    );
    expect(first.report.fallbackReason).toBeUndefined();
    if (first.state === 'ready') {
      expect(first.repository.mode).toEqual({ durable: 'process-crash' });
      expect(await first.repository.withWriter((w) => w.register(registration('t1')))).toSucceed();
      first.repository.close();
    }
    const second = (await openOrInitializeTaskRepository(hostParams(nodeRootAt(dir)))).orThrow();
    expect(second.state).toBe('ready');
    expect(second.report.initialized).toBe(false);
    if (second.state === 'ready') {
      expect(await second.repository.read('t1' as TaskId)).toSucceedAndSatisfy((r) =>
        expect(r).toBeDefined()
      );
      second.repository.close();
    }
  });

  test('a root that qualifies only for session runs as a session on the root, labelled so', async () => {
    const result = (await openOrInitializeTaskRepository(hostParams(memoryRoot()))).orThrow();
    expect(result).toEqual(
      expect.objectContaining({ state: 'ready', durability: 'session', placement: 'root' })
    );
    expect(result.report.mode).toBe('session');
    expect(result.report.guarantees).toEqual(['session']);
    if (result.state === 'ready') {
      result.repository.close();
    }
  });

  test('a root holding only an interrupted write’s working file is empty, and is initialized', async () => {
    const dir = freshDir();
    fs.writeFileSync(path.join(dir, '.fgv-atomic-0123456789abcdef01234567.tmp'), 'partial');
    const result = (await openOrInitializeTaskRepository(hostParams(nodeRootAt(dir)))).orThrow();
    expect(result.state).toBe('ready');
    expect(result.report.initialized).toBe(true);
    expect(result.report.recovery.removedTemporaries).toHaveLength(1);
    if (result.state === 'ready') {
      result.repository.close();
    }
  });

  test('a root holding anything else but no repository is recovery-required, and is left exactly as it was', async () => {
    const dir = freshDir();
    fs.writeFileSync(path.join(dir, 'notes.txt'), 'mine');
    const result = (await openOrInitializeTaskRepository(hostParams(nodeRootAt(dir)))).orThrow();
    expect(result.state).toBe('recovery-required');
    expect(result.report.initialized).toBe(false);
    expect(result.report.recovery.issues.map((i) => i.code)).toEqual(['manifest-missing']);
    expect(fs.readdirSync(dir)).toEqual(['notes.txt']);
    if (result.state === 'recovery-required') {
      result.recovery.close();
    }
  });

  test('a damaged repository is surfaced as recovery-required, never repaired', async () => {
    const dir = freshDir();
    const created = (await openOrInitializeTaskRepository(hostParams(nodeRootAt(dir)))).orThrow();
    if (created.state === 'ready') {
      expect(await created.repository.withWriter((w) => w.register(registration('t1')))).toSucceed();
      created.repository.close();
    }
    fs.writeFileSync(path.join(dir, 'task-t1.json'), '{ not json');
    const result = (await openOrInitializeTaskRepository(hostParams(nodeRootAt(dir)))).orThrow();
    expect(result).toEqual(expect.objectContaining({ state: 'recovery-required', placement: 'root' }));
    expect(result.report.recovery.issues.some((i) => i.severity === 'blocking')).toBe(true);
    expect(fs.readFileSync(path.join(dir, 'task-t1.json'), 'utf8')).toBe('{ not json');
    if (result.state === 'recovery-required') {
      result.recovery.close();
    }
  });

  test('a durable repository whose root lost its durable capability is refused, unless opted in', async () => {
    const dir = freshDir();
    const created = (await openOrInitializeTaskRepository(hostParams(nodeRootAt(dir)))).orThrow();
    if (created.state === 'ready') {
      created.repository.close();
    }
    const weakened = (): FileTree.IFileTreeDirectoryItem =>
      reporting(dir, { atomicReplace: true, guarantees: ['session'] });
    expect(await openOrInitializeTaskRepository(hostParams(weakened()))).toFailWithDetail(
      /initialized 'process-crash' and is being opened as 'session'/,
      code('unsupported')
    );
    const accepted = (
      await openOrInitializeTaskRepository(hostParams(weakened(), { allowSessionOverDurable: true }))
    ).orThrow();
    expect(accepted).toEqual(
      expect.objectContaining({ state: 'ready', durability: 'session', placement: 'root' })
    );
    if (accepted.state === 'ready') {
      accepted.repository.close();
    }
  });

  test("a root that qualifies for nothing is refused under 'refuse'", async () => {
    expect(await openOrInitializeTaskRepository(hostParams(plainRoot()))).toFailWithDetail(
      /does not offer atomic writes/,
      code('unsupported')
    );
  });

  test("under 'in-memory' it runs on a fresh in-memory tree, labelled in-memory with the reason", async () => {
    const result = (
      await openOrInitializeTaskRepository(hostParams(plainRoot(), { fallback: 'in-memory' }))
    ).orThrow();
    expect(result).toEqual(
      expect.objectContaining({ state: 'ready', durability: 'session', placement: 'in-memory' })
    );
    expect(result.report).toEqual(
      expect.objectContaining({
        placement: 'in-memory',
        durability: 'session',
        initialized: true,
        guarantees: []
      })
    );
    expect(result.report.fallbackReason).toMatch(/does not offer atomic writes/);
    if (result.state === 'ready') {
      expect(result.repository.mode).toBe('session');
      result.repository.close();
    }
  });

  test('a root that is not a directory is invalid', async () => {
    const dir = freshDir();
    fs.writeFileSync(path.join(dir, 'f.txt'), 'x');
    const file = nodeRootAt(dir)
      .getChildren()
      .orThrow()
      .find((c) => c.name === 'f.txt')!;
    expect(await openOrInitializeTaskRepository(hostParams(file))).toFailWithDetail(
      /must be a directory/,
      code('invalid')
    );
  });

  test("the repository's own failures keep their classification: a root already open is a conflict", async () => {
    const root = memoryRoot();
    const first = (await openOrInitializeTaskRepository(hostParams(root))).orThrow();
    expect(await openOrInitializeTaskRepository(hostParams(root))).toFailWithDetail(
      /already open/i,
      code('conflict')
    );
    if (first.state === 'ready') {
      first.repository.close();
    }
  });

  test('what it opens or initializes passes the repository conformance suite', async () => {
    const factory =
      (root: () => FileTree.IFileTreeDirectoryItem): (() => Promise<TaskResult<ITaskRepository>>) =>
      async (): Promise<TaskResult<ITaskRepository>> =>
        (await openOrInitializeTaskRepository(hostParams(root()))).onSuccess((opened) =>
          opened.state === 'ready'
            ? succeedWithDetail<ITaskRepository, ITaskFailure>(opened.repository)
            : failWithDetail<ITaskRepository, ITaskFailure>('recovery required', {
                code: 'storage-corrupt',
                retry: 'after-host-action'
              })
        );
    expect(await runTaskRepositoryConformance(factory(() => memoryRoot()))).toSucceed();
    expect(await runTaskRepositoryConformance(factory(() => nodeRootAt(freshDir())))).toSucceed();
  });
});
