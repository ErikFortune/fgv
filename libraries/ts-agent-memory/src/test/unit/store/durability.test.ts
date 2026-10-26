/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Converters, DetailedResult, Logging, Result, fail, failWithDetail, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  BodyConverterRegistry,
  EntityId,
  FileTreeMemoryStore,
  IFileTreeMemoryStoreCreateParams,
  IIdentityCodec,
  IMemoryRecord,
  IMemoryStoreDurabilityOptions,
  Kind,
  KnowledgeIdentityCodec,
  MemoryDurabilityRequirement,
  envelopeConverter
} from '../../../index';

const knowledgeKind: Kind = 'knowledge' as Kind;
const intro: EntityId = 'intro' as EntityId;

function inMemoryRoot(): FileTree.IMutableFileTreeDirectoryItem {
  const root = FileTree.inMemory([], { mutable: true }).orThrow().getDirectory('/').orThrow();
  if (!FileTree.isAtomicDirectoryItem(root)) {
    throw new Error('expected an atomic in-memory root');
  }
  return root;
}

function record(id: string, body: string): IMemoryRecord<unknown> {
  return {
    envelope: envelopeConverter
      .convert({
        id,
        entityId: id,
        kind: 'knowledge',
        tags: [],
        links: [],
        created: 0,
        updated: 0,
        seq: 0,
        contentHash: '',
        provenance: { source: 'agent' }
      })
      .orThrow(),
    body
  };
}

function open(
  root: FileTree.IMutableFileTreeDirectoryItem,
  extra: Partial<IFileTreeMemoryStoreCreateParams> = {}
): Result<FileTreeMemoryStore> {
  const registry = BodyConverterRegistry.create().orThrow();
  registry.register(knowledgeKind, Converters.string);
  return FileTreeMemoryStore.create({
    root,
    registry,
    codecs: new Map<Kind, IIdentityCodec>([[knowledgeKind, new KnowledgeIdentityCodec()]]),
    clock: () => 1000,
    ...extra
  });
}

async function bodyOf(store: FileTreeMemoryStore): Promise<unknown> {
  return (await store.get(knowledgeKind, intro)).orThrow()?.body;
}

function persisted(root: FileTree.IFileTreeDirectoryItem): string | undefined {
  const scope = root
    .getChildren()
    .orThrow()
    .find((c): c is FileTree.IFileTreeDirectoryItem => c.type === 'directory' && c.name === 'knowledge');
  const file = scope
    ?.getChildren()
    .orThrow()
    .find((c): c is FileTree.IFileTreeFileItem => c.type === 'file' && c.name === 'intro.md');
  return file?.getRawContents().orThrow();
}

/** A logger whose every report throws. */
class ThrowingLogger extends Logging.NoOpLogger {
  public info(): never {
    throw new Error('logger down');
  }
  public warn(): never {
    throw new Error('logger down');
  }
}

/**
 * What a {@link ScriptedDir} does in place of its inner directory's atomic methods. Absent
 * entries delegate.
 */
interface IScript {
  childrenAtomic: boolean;
  capabilities?: () => Result<FileTree.IAtomicWriteCapabilities>;
  write?: (
    inner: FileTree.IAtomicFileTreeDirectoryItem,
    name: string,
    contents: string,
    options: FileTree.IAtomicWriteOptions
  ) => DetailedResult<FileTree.IAtomicWriteReceipt, FileTree.IAtomicWriteFailure>;
  cleanup?: () => Result<ReadonlyArray<string>>;
  failListing?: boolean;
}

/** A directory that is mutable but not atomic, delegating to a real in-memory directory. */
class PlainDir implements FileTree.IMutableFileTreeDirectoryItem {
  public readonly type: 'directory' = 'directory';
  protected readonly _inner: FileTree.IAtomicFileTreeDirectoryItem;
  protected readonly _script: IScript;

  public constructor(inner: FileTree.IMutableFileTreeDirectoryItem, script: IScript) {
    if (!FileTree.isAtomicDirectoryItem(inner)) {
      throw new Error('expected an atomic inner directory');
    }
    this._inner = inner;
    this._script = script;
  }

  public get absolutePath(): string {
    return this._inner.absolutePath;
  }

  public get name(): string {
    return this._inner.name;
  }

  public getChildren(): Result<ReadonlyArray<FileTree.FileTreeItem>> {
    if (this._script.failListing === true) {
      return fail(`${this.absolutePath}: listing refused`);
    }
    return this._inner
      .getChildren()
      .onSuccess((children) =>
        succeed(
          children.map((c) =>
            c.type === 'directory' && FileTree.isMutableDirectoryItem(c) ? this._wrap(c) : c
          )
        )
      );
  }

  public createChildFile(name: string, contents: string): Result<FileTree.IMutableFileTreeFileItem> {
    return this._inner.createChildFile(name, contents);
  }

  public createChildDirectory(name: string): Result<FileTree.IMutableFileTreeDirectoryItem> {
    return this._inner.createChildDirectory(name).onSuccess((dir) => succeed(this._wrap(dir)));
  }

  public deleteChild(name: string, options?: FileTree.IDeleteChildOptions): Result<boolean> {
    return this._inner.deleteChild(name, options);
  }

  public delete(): Result<boolean> {
    return this._inner.delete();
  }

  protected _wrap(dir: FileTree.IMutableFileTreeDirectoryItem): FileTree.IMutableFileTreeDirectoryItem {
    return new PlainDir(dir, this._script);
  }
}

/** An atomic directory whose atomic methods follow a script. */
class ScriptedDir extends PlainDir implements FileTree.IAtomicFileTreeDirectoryItem {
  public getAtomicWriteCapabilities(): Result<FileTree.IAtomicWriteCapabilities> {
    return this._script.capabilities?.() ?? this._inner.getAtomicWriteCapabilities();
  }

  public writeChildAtomically(
    name: string,
    contents: string,
    options: FileTree.IAtomicWriteOptions
  ): DetailedResult<FileTree.IAtomicWriteReceipt, FileTree.IAtomicWriteFailure> {
    return (
      this._script.write?.(this._inner, name, contents, options) ??
      this._inner.writeChildAtomically(name, contents, options)
    );
  }

  public cleanupAtomicTemporaries(): Result<ReadonlyArray<string>> {
    return this._script.cleanup?.() ?? this._inner.cleanupAtomicTemporaries();
  }

  protected _wrap(dir: FileTree.IMutableFileTreeDirectoryItem): FileTree.IMutableFileTreeDirectoryItem {
    return this._script.childrenAtomic ? new ScriptedDir(dir, this._script) : new PlainDir(dir, this._script);
  }
}

/** Do the real write, then report a failure with the given visibility. */
function writeThenFail(
  visibility: FileTree.IAtomicWriteFailure['visibility'],
  after?: () => void
): IScript['write'] {
  return (inner, name, contents, options) => {
    inner.writeChildAtomically(name, contents, options).orThrow();
    after?.();
    return failWithDetail(`${name}: scripted ${visibility} failure`, {
      code: 'io',
      stage: visibility === 'replaced' ? 'directory-flush' : 'replace',
      visibility
    });
  };
}

describe('FileTreeMemoryStore durability', () => {
  describe('on an in-memory root', () => {
    test('writes atomically at session and says why', () => {
      expect(open(inMemoryRoot())).toSucceedAndSatisfy((store) => {
        expect(store.durability).toEqual({
          atomic: true,
          guarantee: 'session',
          reason: expect.stringMatching(/in-memory tree/i),
          removedTemporaries: []
        });
      });
    });

    test('opens when session is required', () => {
      expect(open(inMemoryRoot(), { durability: { require: 'session' } })).toSucceedAndSatisfy((store) => {
        expect(store.durability.guarantee).toBe('session');
      });
    });

    test('refuses a required process-crash guarantee, before claiming the root', () => {
      const root = inMemoryRoot();
      expect(open(root, { durability: { require: 'process-crash' } })).toFailWith(
        /cannot write records atomically at the required 'process-crash' guarantee: in-memory tree/i
      );
      expect(open(root)).toSucceed();
    });

    test('refuses an unrecognized requirement', () => {
      const durability: IMemoryStoreDurabilityOptions = {
        require: 'os-crash' as unknown as MemoryDurabilityRequirement
      };
      expect(open(inMemoryRoot(), { durability })).toFailWith(/durability\.require/i);
    });
  });

  describe('the single-writer guard', () => {
    test('refuses a second store on the same root until the first is disposed', async () => {
      const root = inMemoryRoot();
      const first = open(root).orThrow();
      (await first.put(record('intro', 'first'))).orThrow();
      expect(open(root)).toFailWith(/root '\/' is already open in this process/i);

      first.dispose();
      first.dispose();
      const second = open(root).orThrow();
      expect(await bodyOf(second)).toBe('first');
    });

    test('a disposed store still reads but no longer writes or deletes', async () => {
      const root = inMemoryRoot();
      const store = open(root).orThrow();
      (await store.put(record('intro', 'kept'))).orThrow();
      store.dispose();

      expect(await store.put(record('intro', 'late'))).toFailWith(/disposed/i);
      expect(await store.delete(knowledgeKind, intro)).toFailWith(/disposed/i);
      expect(await bodyOf(store)).toBe('kept');
      expect(persisted(root)).toContain('kept');
    });

    test('two in-memory trees rooted at the same path are different roots', () => {
      const a = open(inMemoryRoot()).orThrow();
      expect(open(inMemoryRoot())).toSucceed();
      a.dispose();
    });

    test('a failed open releases its claim', () => {
      const tree = FileTree.inMemory([{ path: '/knowledge/broken.md', contents: 'not a record' }], {
        mutable: true
      }).orThrow();
      const root = tree.getDirectory('/').orThrow();
      if (!FileTree.isMutableDirectoryItem(root)) {
        throw new Error('expected a mutable root');
      }
      expect(open(root)).toFail();
      expect(open(root, { onRecordError: 'skip' })).toSucceedAndSatisfy((store) => {
        expect(store.skippedRecords).toHaveLength(1);
      });
    });

    test('a root without atomic writes is held by path, whichever item reaches it', () => {
      const inner = inMemoryRoot();
      const script: IScript = { childrenAtomic: false };
      const first = open(new PlainDir(inner, script)).orThrow();
      expect(open(new PlainDir(inner, script))).toFailWith(/already open in this process/i);
      first.dispose();
      expect(open(new PlainDir(inner, script))).toSucceedAndSatisfy((second) => second.dispose());
    });
  });

  describe('a root that cannot write atomically', () => {
    test('degrades to plain writes and reports it', async () => {
      const inner = inMemoryRoot();
      const store = open(new PlainDir(inner, { childrenAtomic: false })).orThrow();
      expect(store.durability).toEqual({
        atomic: false,
        reason: 'the root does not implement atomic writes',
        removedTemporaries: []
      });
      expect(await store.put(record('intro', 'plain'))).toSucceed();
      expect(await store.put(record('intro', 'plain again'))).toSucceed();
      expect(persisted(inner)).toContain('plain again');
      store.dispose();
    });

    test('refuses a requirement', () => {
      expect(
        open(new PlainDir(inMemoryRoot(), { childrenAtomic: false }), { durability: { require: 'session' } })
      ).toFailWith(/required 'session' guarantee: the root does not implement atomic writes/i);
    });

    test('reports a capability answer that gives no reason', () => {
      const none: IScript = {
        childrenAtomic: true,
        capabilities: () => succeed({ atomicReplace: false, guarantees: [] })
      };
      expect(open(new ScriptedDir(inMemoryRoot(), none))).toSucceedAndSatisfy((store) => {
        expect(store.durability.atomic).toBe(false);
        expect(store.durability.reason).toBe('the root reports no atomic replacement');
        store.dispose();
      });
      const some: IScript = {
        childrenAtomic: true,
        capabilities: () => succeed({ atomicReplace: true, guarantees: ['session'] })
      };
      expect(open(new ScriptedDir(inMemoryRoot(), some))).toSucceedAndSatisfy((store) => {
        expect(store.durability.guarantee).toBe('session');
        expect(store.durability.reason).toBe('the root offers [session]');
      });
    });

    test('fails the open when the root cannot answer the inquiry', () => {
      const script: IScript = { childrenAtomic: true, capabilities: () => fail('no answer') };
      expect(open(new ScriptedDir(inMemoryRoot(), script))).toFailWith(
        /cannot ask root '\/' about atomic writes: no answer/i
      );
    });
  });

  describe('a write that cannot honour the chosen guarantee', () => {
    test('fails rather than falling back to a plain write', async () => {
      const inner = inMemoryRoot();
      const store = open(new ScriptedDir(inner, { childrenAtomic: false })).orThrow();
      expect(store.durability.guarantee).toBe('session');
      expect(await store.put(record('intro', 'refused'))).toFailWith(
        /writes atomically at 'session' and this directory cannot write atomically/i
      );
      expect(persisted(inner)).toBeUndefined();
      expect(await bodyOf(store)).toBeUndefined();
    });

    test('a refusal that changed nothing fails and leaves the index alone', async () => {
      const inner = inMemoryRoot();
      const script: IScript = { childrenAtomic: true };
      const store = open(new ScriptedDir(inner, script)).orThrow();
      (await store.put(record('intro', 'before'))).orThrow();
      script.write = (__inner, name) =>
        failWithDetail(`${name}: other mount`, {
          code: 'unsupported',
          stage: 'validate',
          visibility: 'unchanged'
        });
      expect(await store.put(record('intro', 'after'))).toFailWith(/other mount/);
      expect(await bodyOf(store)).toBe('before');
      expect(persisted(inner)).toContain('before');
    });
  });

  describe('a write whose outcome is uncertain', () => {
    async function seeded(logger?: Logging.ILogger): Promise<{
      inner: FileTree.IMutableFileTreeDirectoryItem;
      script: IScript;
      store: FileTreeMemoryStore;
    }> {
      const inner = inMemoryRoot();
      const script: IScript = { childrenAtomic: true };
      const store = open(new ScriptedDir(inner, script), { logger }).orThrow();
      (await store.put(record('intro', 'before'))).orThrow();
      return { inner, script, store };
    }

    test("'replaced' is committed: success, a warning, and the index follows the file", async () => {
      const logger = new Logging.InMemoryLogger('info');
      const { inner, script, store } = await seeded(logger);
      script.write = writeThenFail('replaced');
      expect(await store.put(record('intro', 'after'))).toSucceed();
      expect(await bodyOf(store)).toBe('after');
      expect(persisted(inner)).toContain('after');
      expect(logger.logged.join('\n')).toMatch(/new record is in place, but the write reported: .*replaced/i);
    });

    test("'replaced' still succeeds when the logger throws", async () => {
      const { script, store } = await seeded(new ThrowingLogger());
      script.write = writeThenFail('replaced');
      expect(store.durability.atomic).toBe(true);
      expect(await store.put(record('intro', 'after'))).toSucceed();
      expect(await bodyOf(store)).toBe('after');
    });

    test("'unknown' that a re-read shows committed is a success", async () => {
      const logger = new Logging.InMemoryLogger('info');
      const { inner, script, store } = await seeded(logger);
      script.write = writeThenFail('unknown');
      expect(await store.put(record('intro', 'after'))).toSucceed();
      expect(await bodyOf(store)).toBe('after');
      expect(persisted(inner)).toContain('after');
      expect(logger.logged.join('\n')).toMatch(/new record is in place/i);
    });

    test("'unknown' that a re-read shows did not commit is a failure, and the index keeps the previous record", async () => {
      const { inner, script, store } = await seeded();
      script.write = (__inner, name) =>
        failWithDetail(`${name}: ambiguous rename`, { code: 'io', stage: 'replace', visibility: 'unknown' });
      expect(await store.put(record('intro', 'after'))).toFailWith(
        /ambiguous rename; a re-read shows the write did not take effect/i
      );
      expect(await bodyOf(store)).toBe('before');
      expect(persisted(inner)).toContain('before');
    });

    test('an unclassified failure is settled by reading, like unknown', async () => {
      const { script, store } = await seeded();
      script.write = (__inner, name) =>
        failWithDetail<FileTree.IAtomicWriteReceipt, FileTree.IAtomicWriteFailure>(`${name}: unclassified`);
      expect(await store.put(record('intro', 'after'))).toFailWith(
        /unclassified; a re-read shows the write did not take effect/i
      );
      expect(await bodyOf(store)).toBe('before');
    });

    test("'unknown' on a new file that is absent afterwards did not commit", async () => {
      const { script, store } = await seeded();
      script.write = (__inner, name) =>
        failWithDetail(`${name}: ambiguous rename`, { code: 'io', stage: 'replace', visibility: 'unknown' });
      expect(await store.put(record('other', 'new'))).toFailWith(
        /re-read shows the write did not take effect/i
      );
      expect(await store.get(knowledgeKind, 'other' as EntityId)).toSucceedWith(undefined);
    });

    test("'unknown' that cannot be re-read says so, and names what the index holds", async () => {
      const { inner, script, store } = await seeded();
      script.write = writeThenFail('unknown', () => {
        script.failListing = true;
      });
      expect(await store.put(record('intro', 'after'))).toFailWith(
        /could not be settled by re-reading .*listing refused.*index keeps the previous one until reopened/i
      );
      // The message was right to hedge: the file does hold the new record, and a reopen settles it.
      script.failListing = false;
      store.dispose();
      expect(await bodyOf(open(new ScriptedDir(inner, script)).orThrow())).toBe('after');
    });
  });

  describe('the open-time sweep', () => {
    test('a sweep that fails warns and does not fail the open', () => {
      const logger = new Logging.InMemoryLogger('info');
      const script: IScript = { childrenAtomic: true, cleanup: () => fail('cannot remove') };
      expect(open(new ScriptedDir(inMemoryRoot(), script), { logger })).toSucceedAndSatisfy((store) => {
        expect(store.durability.removedTemporaries).toEqual([]);
      });
      expect(logger.logged.join('\n')).toMatch(
        /could not sweep interrupted-write working files: cannot remove/i
      );
    });

    test('a sweep failure survives a throwing logger', () => {
      const script: IScript = { childrenAtomic: true, cleanup: () => fail('cannot remove') };
      expect(
        open(new ScriptedDir(inMemoryRoot(), script), { logger: new ThrowingLogger() })
      ).toSucceedAndSatisfy((store) => {
        expect(store.durability.removedTemporaries).toEqual([]);
      });
    });

    test('the sweep walks directories that cannot hold working files', async () => {
      const inner = inMemoryRoot();
      const script: IScript = { childrenAtomic: true };
      const seed = open(new ScriptedDir(inner, script)).orThrow();
      (await seed.put(record('intro', 'body'))).orThrow();
      seed.dispose();

      const logger = new Logging.InMemoryLogger('info');
      expect(open(new ScriptedDir(inner, { childrenAtomic: false }), { logger })).toSucceedAndSatisfy(
        (store) => {
          expect(store.durability.removedTemporaries).toEqual([]);
        }
      );
      expect(logger.logged).toEqual([]);
    });
  });
});

/**
 * Real filesystem roots. Whether a root is qualified depends on the machine (Linux ext2/3/4 or
 * tmpfs), so these run where it is and are skipped elsewhere, as `@fgv/ts-json-base`'s own
 * qualification suite does.
 */
describe('FileTreeMemoryStore durability on the filesystem', () => {
  const base: string = os.tmpdir();
  const probe: string = fs.mkdtempSync(path.join(base, 'fgv-memory-probe-'));
  const qualified: boolean = new FileTree.FsFileTreeAccessors({ prefix: probe, mutable: true })
    .getAtomicWriteCapabilities(probe)
    .orDefault({ atomicReplace: false, guarantees: [] }).atomicReplace;
  fs.rmSync(probe, { recursive: true, force: true });
  const whenQualified: jest.It = qualified ? test : test.skip;

  const dirs: string[] = [];
  function fsRoot(dir?: string): FileTree.IMutableFileTreeDirectoryItem {
    const at: string = dir ?? fs.mkdtempSync(path.join(base, 'fgv-memory-'));
    dirs.push(at);
    const root = FileTree.DirectoryItem.create(
      at,
      new FileTree.FsFileTreeAccessors({ prefix: at, mutable: true })
    ).orThrow();
    return root;
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    for (const dir of dirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  function fsError(code: string): Error {
    return Object.assign(new Error(`${code}: simulated`), { code });
  }

  whenQualified('writes atomically at process-crash and says why', () => {
    expect(open(fsRoot())).toSucceedAndSatisfy((store) => {
      expect(store.durability.atomic).toBe(true);
      expect(store.durability.guarantee).toBe('process-crash');
      expect(store.durability.reason).toMatch(/ on linux$/);
      store.dispose();
    });
  });

  whenQualified('opens when process-crash is required', () => {
    expect(open(fsRoot(), { durability: { require: 'process-crash' } })).toSucceedAndSatisfy((store) => {
      store.dispose();
    });
  });

  whenQualified('two items over one directory are the same root', () => {
    const root = fsRoot();
    const first = open(root).orThrow();
    expect(open(fsRoot(root.absolutePath))).toFailWith(/already open in this process/i);
    first.dispose();
  });

  whenQualified('a write interrupted before its replacement leaves the previous record whole', async () => {
    const root = fsRoot();
    const store = open(root).orThrow();
    (await store.put(record('intro', 'before'))).orThrow();
    const before = persisted(root);

    // A crash mid-write: the bytes stop partway through, and nothing cleans up afterwards. Both
    // write calls are interrupted, so the record is torn whichever one the store uses.
    const realWriteSync = fs.writeSync;
    const realWriteFileSync = fs.writeFileSync;
    jest.spyOn(fs, 'writeSync').mockImplementation((fd: number, bytes: unknown) => {
      realWriteSync(fd, (bytes as Uint8Array).subarray(0, 8));
      throw fsError('EIO');
    });
    jest.spyOn(fs, 'writeFileSync').mockImplementation((file: unknown, contents: unknown) => {
      realWriteFileSync(file as string, String(contents).slice(0, 8));
      throw fsError('EIO');
    });
    jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {
      throw fsError('EIO');
    });
    expect(await store.put(record('intro', 'after'))).toFail();
    jest.restoreAllMocks();

    expect(persisted(root)).toBe(before);
    expect(await bodyOf(store)).toBe('before');
    store.dispose();

    const logger = new Logging.InMemoryLogger('info');
    const reopened = open(root, { logger }).orThrow();
    expect(await bodyOf(reopened)).toBe('before');
    expect(reopened.durability.removedTemporaries).toEqual([
      expect.stringMatching(/^knowledge\/\.fgv-atomic-.*\.tmp$/)
    ]);
    expect(fs.readdirSync(path.join(root.absolutePath, 'knowledge'))).toEqual(['intro.md']);
    expect(logger.logged.join('\n')).toMatch(/removed 1 interrupted-write working file/i);
    reopened.dispose();
  });

  whenQualified("a directory flush that fails after the replacement is committed ('replaced')", async () => {
    const root = fsRoot();
    const logger = new Logging.InMemoryLogger('info');
    const store = open(root, { logger }).orThrow();
    (await store.put(record('intro', 'before'))).orThrow();
    const realFsync = fs.fsyncSync;
    let calls = 0;
    jest.spyOn(fs, 'fsyncSync').mockImplementation((fd: number) => {
      calls += 1;
      if (calls === 2) {
        throw fsError('EIO');
      }
      realFsync(fd);
    });
    expect(await store.put(record('intro', 'after'))).toSucceed();
    jest.restoreAllMocks();
    expect(await bodyOf(store)).toBe('after');
    expect(persisted(root)).toContain('after');
    expect(logger.logged.join('\n')).toMatch(/new record is in place, but .*could not be flushed/i);
    store.dispose();
  });

  whenQualified("an ambiguous rename is settled by re-reading ('unknown')", async () => {
    const root = fsRoot();
    const store = open(root).orThrow();
    (await store.put(record('intro', 'before'))).orThrow();
    const realRename = fs.renameSync;

    jest.spyOn(fs, 'renameSync').mockImplementation((from: fs.PathLike, to: fs.PathLike) => {
      realRename(from, to);
      throw fsError('EIO');
    });
    expect(await store.put(record('intro', 'renamed'))).toSucceed();
    jest.restoreAllMocks();
    expect(await bodyOf(store)).toBe('renamed');

    jest.spyOn(fs, 'renameSync').mockImplementation(() => {
      throw fsError('EIO');
    });
    expect(await store.put(record('intro', 'lost'))).toFailWith(
      /re-read shows the write did not take effect/i
    );
    jest.restoreAllMocks();
    expect(await bodyOf(store)).toBe('renamed');
    expect(persisted(root)).toContain('renamed');
    store.dispose();
  });
});
