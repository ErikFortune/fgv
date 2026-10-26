/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  Converter,
  Converters,
  DetailedResult,
  Logging,
  Result,
  fail,
  failWithDetail,
  succeed
} from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  BodyConverterRegistry,
  EntityId,
  FileTreeMemoryStore,
  IFileTreeMemoryStoreCreateParams,
  IBodyConverterRegistry,
  IEmbeddedFragment,
  IIdentityCodec,
  IMemoryRecord,
  IMemoryStore,
  IMemoryStoreDurabilityOptions,
  IWritePolicy,
  InMemoryCosineIndex,
  InMemoryFragmentCosineIndex,
  Kind,
  KnowledgeIdentityCodec,
  MemoryCapCullPolicy,
  MemoryDurabilityRequirement,
  MemoryIndex,
  envelopeConverter,
  memoryDurabilityRequirements
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

function mutableDir(tree: FileTree.FileTree, at: string): FileTree.IMutableFileTreeDirectoryItem {
  const dir = tree.getDirectory(at).orThrow();
  if (!FileTree.isMutableDirectoryItem(dir)) {
    throw new Error(`expected a mutable directory at ${at}`);
  }
  return dir;
}

function registryWith(converter: Converter<string>): IBodyConverterRegistry {
  const registry = BodyConverterRegistry.create().orThrow();
  registry.register(knowledgeKind, converter);
  return registry;
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
  /** Fail the listing of just the directory at this absolute path. */
  failListingOf?: string;
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
    if (this._script.failListing === true || this._script.failListingOf === this.absolutePath) {
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

    test('declares the requirements once, weakest first', () => {
      expect(memoryDurabilityRequirements).toEqual(['session', 'process-crash']);
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
      expect(open(root)).toFailWith(/root '\/' overlaps root '\/', which is already open in this process/i);

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

    test('two items for one directory of one tree are the same root', () => {
      const tree = FileTree.inMemory([], { mutable: true }).orThrow();
      const first = open(mutableDir(tree, '/')).orThrow();
      expect(open(mutableDir(tree, '/'))).toFailWith(/overlaps root '\/', which is already open/i);
      first.dispose();
      expect(open(mutableDir(tree, '/'))).toSucceedAndSatisfy((second) => second.dispose());
    });

    test('a root nested inside another root of the same tree is refused, whichever opens first', () => {
      const tree = FileTree.inMemory([{ path: '/vault/inner/keep.txt', contents: 'x' }], {
        mutable: true
      }).orThrow();
      const outer = open(mutableDir(tree, '/vault')).orThrow();
      expect(open(mutableDir(tree, '/vault/inner'))).toFailWith(/overlaps root '\/vault'/i);
      outer.dispose();
      const inner = open(mutableDir(tree, '/vault/inner')).orThrow();
      expect(open(mutableDir(tree, '/vault'))).toFailWith(/overlaps root '\/vault\/inner'/i);
      expect(open(mutableDir(tree, '/'))).toFail();
      inner.dispose();
    });

    test('a sibling directory of the same tree is a different root', () => {
      const tree = FileTree.inMemory(
        [
          { path: '/a/x.txt', contents: 'x' },
          { path: '/ab/x.txt', contents: 'x' }
        ],
        {
          mutable: true
        }
      ).orThrow();
      const a = open(mutableDir(tree, '/a')).orThrow();
      expect(open(mutableDir(tree, '/ab'))).toSucceedAndSatisfy((ab) => ab.dispose());
      a.dispose();
    });

    test('two different backends without atomic writes, both rooted at /, are different roots', () => {
      const a = open(new PlainDir(inMemoryRoot(), { childrenAtomic: false })).orThrow();
      expect(open(new PlainDir(inMemoryRoot(), { childrenAtomic: false }))).toSucceedAndSatisfy((b) =>
        b.dispose()
      );
      a.dispose();
    });

    test('Windows-style paths nest by backslash, and a name that merely shares a prefix does not', () => {
      const accessors = FileTree.InMemoryTreeAccessors.create([], { mutable: true }).orThrow();
      class Named extends PlainDir {
        private readonly _path: string;
        public constructor(at: string) {
          super(inMemoryRoot(), { childrenAtomic: false });
          this._path = at;
        }
        public getStorageIdentity(): FileTree.IFileTreeStorageIdentity {
          return { accessors, path: this._path };
        }
      }
      const vault = open(new Named('C:\\vault')).orThrow();
      expect(open(new Named('C:\\vault\\inner'))).toFailWith(/overlaps root 'C:\\vault'/);
      expect(open(new Named('C:\\vaultx'))).toSucceedAndSatisfy((other) => other.dispose());
      vault.dispose();
    });

    test('a root item that cannot name its storage is identified by the item itself', () => {
      const item = new PlainDir(inMemoryRoot(), { childrenAtomic: false });
      const first = open(item).orThrow();
      expect(open(item)).toFailWith(/already open in this process/i);
      first.dispose();
    });

    test('an open that throws releases its claim', async () => {
      const tree = FileTree.inMemory([], { mutable: true }).orThrow();
      const seed = open(mutableDir(tree, '/')).orThrow();
      (await seed.put(record('intro', 'body'))).orThrow();
      seed.dispose();
      const throwing = Converters.generic<string>(() => {
        throw new Error('converter exploded');
      });
      expect(open(mutableDir(tree, '/'), { registry: registryWith(throwing) })).toFailWith(
        /converter exploded/
      );
      expect(open(mutableDir(tree, '/'))).toSucceedAndSatisfy((store) => store.dispose());
    });

    test('an injected index that throws during the open releases the claim', () => {
      const tree = FileTree.inMemory([], { mutable: true }).orThrow();
      const exploding = new Proxy(MemoryIndex.create().orThrow(), {
        get: (target, property) =>
          property === 'rebuild'
            ? (): never => {
                throw new Error('index exploded');
              }
            : Reflect.get(target, property)
      });
      expect(open(mutableDir(tree, '/'), { index: exploding })).toFailWith(/index exploded/);
      expect(open(mutableDir(tree, '/'))).toSucceedAndSatisfy((store) => store.dispose());
    });

    test('a host holding the interface can dispose', () => {
      const tree = FileTree.inMemory([], { mutable: true }).orThrow();
      const held: IMemoryStore = open(mutableDir(tree, '/')).orThrow();
      held.dispose?.();
      expect(open(mutableDir(tree, '/'))).toSucceedAndSatisfy((store) => store.dispose());
    });
  });

  describe('a disposed store leaves no derived state behind', () => {
    function gated(): { gate: Promise<void>; open: () => void } {
      let release: () => void = () => undefined;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      return { gate, open: () => release() };
    }

    test('a put whose embedding finishes after dispose adds no vector, and a queued put never embeds', async () => {
      const tree = FileTree.inMemory([], { mutable: true }).orThrow();
      const index = InMemoryCosineIndex.create().orThrow();
      const { gate, open: release } = gated();
      let embeds = 0;
      const embed = async (): Promise<Result<Float32Array>> => {
        embeds += 1;
        await gate;
        return succeed(Float32Array.from([1, 2, 3]));
      };
      const first = open(mutableDir(tree, '/'), { vectorIndex: index, embed }).orThrow();
      const inFlight = first.put(record('intro', 'hello'));
      const queued = first.put(record('other', 'queued'));
      await new Promise((resolve) => setTimeout(resolve, 10));
      first.dispose();
      const next = open(mutableDir(tree, '/'), { vectorIndex: index }).orThrow();
      release();
      expect(await inFlight).toFailWith(/disposed/i);
      expect(await queued).toFailWith(/disposed/i);
      expect(embeds).toBe(1);
      expect(index.size).toBe(0);
      next.dispose();
    });

    test('a put whose fragment embedding finishes after dispose adds no fragments', async () => {
      const tree = FileTree.inMemory([], { mutable: true }).orThrow();
      const fragmentIndex = InMemoryFragmentCosineIndex.create().orThrow();
      const { gate, open: release } = gated();
      const fragmentEmbedder = async (): Promise<Result<ReadonlyArray<IEmbeddedFragment>>> => {
        await gate;
        return succeed([{ locator: { start: 0, end: 5 }, vector: Float32Array.from([1, 0]) }]);
      };
      const first = open(mutableDir(tree, '/'), { fragmentIndex, fragmentEmbedder }).orThrow();
      const inFlight = first.put(record('intro', 'hello'));
      await new Promise((resolve) => setTimeout(resolve, 10));
      first.dispose();
      release();
      expect(await inFlight).toFailWith(/disposed/i);
      expect(fragmentIndex.recordCount).toBe(0);
    });

    test('a reconcile is refused once disposed, and one in flight adds nothing after it', async () => {
      const tree = FileTree.inMemory([], { mutable: true }).orThrow();
      const index = InMemoryCosineIndex.create().orThrow();
      const seed = open(mutableDir(tree, '/')).orThrow();
      (await seed.put(record('intro', 'hello'))).orThrow();
      seed.dispose();

      const { gate, open: release } = gated();
      const embed = async (): Promise<Result<Float32Array>> => {
        await gate;
        return succeed(Float32Array.from([1, 2, 3]));
      };
      const store = open(mutableDir(tree, '/'), { vectorIndex: index, embed }).orThrow();
      const inFlight = store.reconcile(knowledgeKind, 'record-vector');
      await new Promise((resolve) => setTimeout(resolve, 10));
      store.dispose();
      release();
      expect(await inFlight).toSucceedAndSatisfy((report) => {
        expect(report.repaired).toBe(0);
      });
      expect(index.size).toBe(0);
      expect(await store.reconcile(knowledgeKind, 'record-vector')).toFailWith(/disposed/i);
    });

    test("a delete that is disposed partway removes none of the next owner's derived state", async () => {
      const tree = FileTree.inMemory([], { mutable: true }).orThrow();
      const fragmentIndex = InMemoryFragmentCosineIndex.create().orThrow();
      let onRemove: () => void = () => undefined;
      const vectorIndex = new Proxy(InMemoryCosineIndex.create().orThrow(), {
        get: (target, property) => {
          const value: unknown = Reflect.get(target, property);
          if (property === 'remove' && typeof value === 'function') {
            return (...args: unknown[]): unknown => {
              onRemove();
              return Reflect.apply(value, target, args);
            };
          }
          return typeof value === 'function' ? value.bind(target) : value;
        }
      });
      const store = open(mutableDir(tree, '/'), {
        vectorIndex,
        embed: async () => succeed(Float32Array.from([1, 2, 3])),
        fragmentIndex,
        fragmentEmbedder: async () =>
          succeed([{ locator: { start: 0, end: 5 }, vector: Float32Array.from([1, 0]) }])
      }).orThrow();
      (await store.put(record('intro', 'hello'))).orThrow();
      expect(fragmentIndex.recordCount).toBe(1);
      onRemove = () => store.dispose();
      expect(await store.delete(knowledgeKind, intro)).toSucceed();
      // The record vector's removal ran (it disposed the store); the fragment removal after it did not.
      expect(fragmentIndex.recordCount).toBe(1);
    });

    test('a cull skipped because the store was disposed says so', async () => {
      const inner = inMemoryRoot();
      const script: IScript = { childrenAtomic: true };
      const logger = new Logging.InMemoryLogger('info');
      const capCull = MemoryCapCullPolicy.create({ maxRecords: 1, mutableFields: ['body'] }).orThrow();
      const store = open(new ScriptedDir(inner, script), {
        logger,
        writePolicies: new Map<Kind, IWritePolicy>([[knowledgeKind, capCull]])
      }).orThrow();
      (await store.put(record('first', 'one'))).orThrow();
      script.write = (dir, name, contents, options) => {
        const written = dir.writeChildAtomically(name, contents, options);
        store.dispose();
        return written;
      };
      expect(await store.put(record('second', 'two'))).toSucceed();
      expect(logger.logged.join('\n')).toMatch(
        /eviction of 'first' skipped: the store was disposed after the write committed/i
      );
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

    test('refuses the open when the root cannot answer the inquiry', () => {
      const script: IScript = { childrenAtomic: true, capabilities: () => fail('no answer') };
      expect(open(new ScriptedDir(inMemoryRoot(), script))).toFailWith(
        /memory store: cannot ask root '\/' about atomic writes: no answer/i
      );
    });

    test('refuses the open when the inquiry throws', () => {
      const script: IScript = {
        childrenAtomic: true,
        capabilities: () => {
          throw new Error('inquiry exploded');
        }
      };
      expect(open(new ScriptedDir(inMemoryRoot(), script))).toFailWith(
        /memory store: cannot ask root .*inquiry exploded/i
      );
    });

    test('refuses the open, with context, when the root cannot be listed', () => {
      expect(open(new PlainDir(inMemoryRoot(), { childrenAtomic: false, failListing: true }))).toFailWith(
        /^memory store: cannot list root '\/': .*listing refused/i
      );
    });

    test('refuses the open when the root cannot say what storage it names', () => {
      class Unidentifiable extends PlainDir {
        public getStorageIdentity(): FileTree.IFileTreeStorageIdentity {
          throw new Error('identity exploded');
        }
      }
      expect(open(new Unidentifiable(inMemoryRoot(), { childrenAtomic: false }))).toFailWith(
        /memory store: cannot identify root '\/': .*identity exploded/i
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
    /** A root holding one record, so its scope directory is one the sweep visits. */
    async function seededRoot(): Promise<FileTree.IMutableFileTreeDirectoryItem> {
      const inner = inMemoryRoot();
      const seed = open(inner).orThrow();
      (await seed.put(record('intro', 'body'))).orThrow();
      seed.dispose();
      return inner;
    }

    test('a sweep that fails warns and does not fail the open', async () => {
      const logger = new Logging.InMemoryLogger('info');
      const script: IScript = { childrenAtomic: true, cleanup: () => fail('cannot remove') };
      expect(open(new ScriptedDir(await seededRoot(), script), { logger })).toSucceedAndSatisfy((store) => {
        expect(store.durability.removedTemporaries).toEqual([]);
      });
      expect(logger.logged.join('\n')).toMatch(
        /could not sweep every interrupted-write working file: knowledge: cannot remove/i
      );
    });

    test('a sweep that fails partway reports what it did remove', async () => {
      const inner = await seededRoot();
      const scope = inner
        .getChildren()
        .orThrow()
        .find((c): c is FileTree.IFileTreeDirectoryItem => c.type === 'directory');
      if (scope === undefined || !FileTree.isMutableDirectoryItem(scope)) {
        throw new Error('expected a mutable scope directory');
      }
      scope.createChildFile('orphan.tmp', 'x').orThrow();
      const script: IScript = {
        childrenAtomic: true,
        cleanup: () => {
          scope.deleteChild('orphan.tmp').orThrow();
          return fail('second removal failed');
        }
      };
      const logger = new Logging.InMemoryLogger('info');
      expect(open(new ScriptedDir(inner, script), { logger })).toSucceedAndSatisfy((store) => {
        expect(store.durability.removedTemporaries).toEqual(['knowledge/orphan.tmp']);
      });
      expect(logger.logged.join('\n')).toMatch(/second removal failed/);
    });

    test('a sweep that throws is reported, and the open still succeeds', async () => {
      const logger = new Logging.InMemoryLogger('info');
      const script: IScript = {
        childrenAtomic: true,
        cleanup: () => {
          throw new Error('sweep exploded');
        }
      };
      expect(open(new ScriptedDir(await seededRoot(), script), { logger })).toSucceed();
      expect(logger.logged.join('\n')).toMatch(/the sweep threw: .*sweep exploded/i);
    });

    test('a directory the sweep cannot list is reported', async () => {
      const logger = new Logging.InMemoryLogger('info');
      const script: IScript = { childrenAtomic: true, failListingOf: '/knowledge' };
      // The walk cannot list it either, so the open fails — but the sweep said why first.
      expect(open(new ScriptedDir(await seededRoot(), script), { logger })).toFail();
      expect(logger.logged.join('\n')).toMatch(/\/knowledge: cannot list: .*listing refused/i);
    });

    test('a sweep failure survives a throwing logger', async () => {
      const script: IScript = { childrenAtomic: true, cleanup: () => fail('cannot remove') };
      expect(
        open(new ScriptedDir(await seededRoot(), script), { logger: new ThrowingLogger() })
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

  /** A fresh container holding `real/vault`, with `alias` a symbolic link to `real`. */
  function linkedLayout(): { real: string; alias: string } {
    const container: string = fs.mkdtempSync(path.join(base, 'fgv-memory-links-'));
    dirs.push(container);
    const real: string = path.join(container, 'real');
    fs.mkdirSync(path.join(real, 'vault'), { recursive: true });
    const alias: string = path.join(container, 'alias');
    fs.symlinkSync(real, alias);
    return { real, alias };
  }

  test('a directory reached through an intermediate symbolic link is the same root', () => {
    const { real, alias } = linkedLayout();
    const first = open(fsRoot(path.join(real, 'vault'))).orThrow();
    expect(open(fsRoot(path.join(alias, 'vault')))).toFailWith(/overlaps root .*real.vault/i);
    first.dispose();
  });

  test('a root whose last component is a symbolic link opens, and is the same root as its target', async () => {
    const { real, alias } = linkedLayout();
    const viaLink = open(fsRoot(alias)).orThrow();
    expect(viaLink.durability.atomic).toBe(qualified);
    expect(await viaLink.put(record('intro', 'linked'))).toSucceed();
    expect(fs.readFileSync(path.join(real, 'knowledge', 'intro.md'), 'utf8')).toContain('linked');
    expect(open(fsRoot(real))).toFailWith(/already open in this process/i);
    viaLink.dispose();
  });

  test('a scope directory that is a symbolic link is written through', async () => {
    const { real } = linkedLayout();
    const vault: string = path.join(real, 'vault');
    const elsewhere: string = path.join(vault, 'elsewhere');
    fs.mkdirSync(elsewhere);
    fs.symlinkSync(elsewhere, path.join(vault, 'knowledge'));
    const store = open(fsRoot(vault)).orThrow();
    expect(await store.put(record('intro', 'through the link'))).toSucceed();
    expect(fs.readFileSync(path.join(elsewhere, 'intro.md'), 'utf8')).toContain('through the link');
    store.dispose();
  });

  test('a root outside its accessors’ tree is refused, not degraded to plain writes there', () => {
    const container: string = fs.mkdtempSync(path.join(base, 'fgv-memory-outside-'));
    dirs.push(container);
    const prefix: string = path.join(container, 'tree');
    const elsewhere: string = path.join(container, 'elsewhere');
    fs.mkdirSync(prefix);
    fs.mkdirSync(elsewhere);
    const outside = FileTree.DirectoryItem.create(
      elsewhere,
      new FileTree.FsFileTreeAccessors({ prefix, mutable: true })
    ).orThrow();
    expect(open(outside)).toFailWith(/memory store: cannot ask root .* resolves outside the tree root/i);
    expect(open(outside, { durability: { require: 'process-crash' } })).toFailWith(/outside the tree root/i);
    expect(fs.readdirSync(elsewhere)).toEqual([]);
  });

  test('a root that does not exist is refused, with context', () => {
    const missing: string = path.join(fs.mkdtempSync(path.join(base, 'fgv-memory-missing-')), 'absent');
    dirs.push(path.dirname(missing));
    expect(open(fsRoot(missing))).toFailWith(/^memory store: cannot ask root .*not found/i);
  });

  test('a scope directory that links outside the root refuses the write', async () => {
    const { real } = linkedLayout();
    const vault: string = path.join(real, 'vault');
    const outside: string = path.join(path.dirname(real), 'outside');
    fs.mkdirSync(outside);
    fs.symlinkSync(outside, path.join(vault, 'knowledge'));
    const store = open(fsRoot(vault)).orThrow();
    if (store.durability.atomic) {
      expect(await store.put(record('intro', 'escaped'))).toFailWith(
        /resolves through a symbolic link to .*outside the tree root/i
      );
      expect(fs.readdirSync(outside)).toEqual([]);
    }
    store.dispose();
  });

  (process.platform === 'win32' ? test.skip : test)(
    'a sibling whose name contains a backslash is not nested on POSIX',
    () => {
      const { real } = linkedLayout();
      fs.mkdirSync(path.join(real, 'a'));
      fs.mkdirSync(path.join(real, 'a\\b'));
      const a = open(fsRoot(path.join(real, 'a'))).orThrow();
      expect(open(fsRoot(path.join(real, 'a\\b')))).toSucceedAndSatisfy((sibling) => sibling.dispose());
      a.dispose();
    }
  );

  test('a root nested inside an open root is refused', () => {
    const { real } = linkedLayout();
    const outer = open(fsRoot(real)).orThrow();
    expect(open(fsRoot(path.join(real, 'vault')))).toFailWith(/overlaps root/i);
    outer.dispose();
  });

  whenQualified('the sweep removes working files only from directories that hold records', async () => {
    const root = fsRoot();
    const seed = open(root).orThrow();
    (await seed.put(record('intro', 'body'))).orThrow();
    seed.dispose();
    const orphan: string = '.fgv-atomic-0123456789abcdef01234567.tmp';
    fs.writeFileSync(path.join(root.absolutePath, 'knowledge', orphan), 'x');
    fs.writeFileSync(path.join(root.absolutePath, orphan), 'x');
    fs.mkdirSync(path.join(root.absolutePath, 'empty'));
    fs.writeFileSync(path.join(root.absolutePath, 'empty', orphan), 'x');

    const reopened = open(root).orThrow();
    expect(reopened.durability.removedTemporaries).toEqual([`knowledge/${orphan}`]);
    expect(fs.existsSync(path.join(root.absolutePath, orphan))).toBe(true);
    expect(fs.existsSync(path.join(root.absolutePath, 'empty', orphan))).toBe(true);
    reopened.dispose();
  });

  whenQualified('an ambiguous rename of a body with a lone surrogate is settled as committed', async () => {
    const root = fsRoot();
    const store = open(root).orThrow();
    (await store.put(record('intro', 'before'))).orThrow();
    const realRename = fs.renameSync;
    jest.spyOn(fs, 'renameSync').mockImplementation((from: fs.PathLike, to: fs.PathLike) => {
      realRename(from, to);
      throw fsError('EIO');
    });
    expect(await store.put(record('intro', 'lone \uD800 surrogate'))).toSucceed();
    jest.restoreAllMocks();
    expect(await bodyOf(store)).toBe('lone � surrogate');
    store.dispose();
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
