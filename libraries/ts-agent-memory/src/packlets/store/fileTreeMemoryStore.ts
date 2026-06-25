/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Hash, Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  AdmissionDecision,
  EntityId,
  IIdentityCodec,
  IMemoryEnvelope,
  IMemoryRecord,
  IWritePolicy,
  Kind,
  KnowledgeLwwPolicy,
  MemoryId,
  MemoryScopeKey,
  Tag
} from '../types';
import { IBodyConverterRegistry as IRegistry, parseMemoryFile, serializeMemoryFile } from '../converters';
import { IIndexedMemoryRecord, IMemoryIndex, MemoryIndex } from '../index';
import { defaultMemoryScopeEncoding } from './scopeEncoding';

/** The on-disk extension for a memory record file. */
const MEMORY_FILE_EXTENSION: string = '.md';

/**
 * Filter for {@link IMemoryStore.list}. All present fields are ANDed together.
 * @public
 */
export interface IMemoryStoreListFilter {
  /** Restrict to records in this scope. */
  readonly scope?: MemoryScopeKey;
  /** Restrict to records of this kind. */
  readonly kind?: Kind;
  /** Restrict to records carrying this tag (exact match). */
  readonly tag?: Tag;
  /**
   * For temporal kinds: return only records valid at this epoch ms. No-op in
   * B1 (no temporal kinds wired).
   */
  readonly asOf?: number;
}

/**
 * The writable, FileTree-backed, content-hash-deduped memory store.
 * @public
 */
export interface IMemoryStore {
  /**
   * Keyed read by entity id. Resolves `entityId` to a storage address via the
   * registered {@link IIdentityCodec} for `kind`. Returns `undefined` when no
   * record exists.
   */
  get(kind: Kind, entityId: EntityId): Promise<Result<IMemoryRecord<unknown> | undefined>>;

  /**
   * Direct read by `(scope, MemoryId)`. Returns `undefined` when not found.
   */
  getById(scope: MemoryScopeKey, id: MemoryId): Promise<Result<IMemoryRecord<unknown> | undefined>>;

  /**
   * List records, filtered in-memory over the derived index.
   */
  list(filter?: IMemoryStoreListFilter): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>>;

  /**
   * Write a record. Validates the body, computes a content hash, deduplicates
   * (scope-wide, before policy), applies the kind's {@link IWritePolicy}, stamps
   * transaction-time metadata (`created` / `updated` / `seq` / `contentHash`),
   * writes the file, and patches the index. Returns the written record — or the
   * existing record unchanged on a dedup no-op.
   */
  put(record: IMemoryRecord<unknown>): Promise<Result<IMemoryRecord<unknown>>>;

  /**
   * Delete a record by `(kind, entityId)`. Non-temporal kinds physically delete
   * the file. Returns the {@link MemoryId} of the deleted record.
   */
  delete(kind: Kind, entityId: EntityId): Promise<Result<MemoryId>>;
}

/**
 * Parameters for {@link FileTreeMemoryStore.create}.
 * @public
 */
export interface IFileTreeMemoryStoreCreateParams {
  /** Root directory under which scope-encoded sub-trees live. Must be mutable. */
  readonly root: FileTree.IMutableFileTreeDirectoryItem;
  /** Per-kind body converter registry. Gates every body on write and read. */
  readonly registry: IRegistry;
  /** Per-kind write policies. Kinds without an entry use a default LWW policy. */
  readonly writePolicies?: ReadonlyMap<Kind, IWritePolicy>;
  /** Per-kind identity codecs. */
  readonly codecs?: ReadonlyMap<Kind, IIdentityCodec>;
  /** Default codec for kinds without an explicit entry. */
  readonly defaultCodec?: IIdentityCodec;
  /** Scope encoding. Defaults to {@link defaultMemoryScopeEncoding}. */
  readonly scopeEncoding?: (scope: MemoryScopeKey) => Result<string>;
  /**
   * Transaction-time clock. Defaults to `Date.now`. Injectable so tests can
   * make `created` / `updated` deterministic.
   */
  readonly clock?: () => number;
}

interface IInternalParams {
  readonly root: FileTree.IMutableFileTreeDirectoryItem;
  readonly registry: IRegistry;
  readonly writePolicies: ReadonlyMap<Kind, IWritePolicy>;
  readonly codecs: ReadonlyMap<Kind, IIdentityCodec>;
  readonly defaultCodec?: IIdentityCodec;
  readonly defaultPolicy: IWritePolicy;
  readonly scopeEncoding: (scope: MemoryScopeKey) => Result<string>;
  readonly clock: () => number;
  readonly index: IMemoryIndex;
}

/**
 * Flat-layout, FileTree-backed {@link IMemoryStore}. The FileTree is the source
 * of truth; the {@link IMemoryIndex} is a derived in-memory view patched on
 * every write. Concurrent writes are serialized through a per-instance async
 * write-lock so the index and the on-disk files never interleave.
 *
 * @remarks
 * B1 supports flat (non-versioned) layout only and string (markdown) bodies.
 * A codec reporting `isVersioned: true`, or a non-string body, fails loudly —
 * the versioned/temporal write path is a fast-follow.
 * @public
 */
export class FileTreeMemoryStore implements IMemoryStore {
  private readonly _root: FileTree.IMutableFileTreeDirectoryItem;
  private readonly _registry: IRegistry;
  private readonly _writePolicies: ReadonlyMap<Kind, IWritePolicy>;
  private readonly _codecs: ReadonlyMap<Kind, IIdentityCodec>;
  private readonly _defaultCodec: IIdentityCodec | undefined;
  private readonly _defaultPolicy: IWritePolicy;
  private readonly _scopeEncoding: (scope: MemoryScopeKey) => Result<string>;
  private readonly _clock: () => number;
  private readonly _index: IMemoryIndex;
  private readonly _hasher: Hash.Crc32Normalizer;

  /** Monotonic write counter; incremented inside the write-lock on each put. */
  private _seq: number;
  /** Tail of the write-lock promise chain that serializes mutating ops. */
  private _writeTail: Promise<unknown>;

  /**
   * The record-level mutable-field vocabulary: maps a declared mutable field
   * name to its canonical location on a record. Used to project an incoming
   * record into a merge-patch on update. B1 ships the knowledge-LWW surface
   * (body + envelope metadata); body-internal mutable fields (Phase-C cap-cull)
   * extend this map.
   */
  private static readonly _mutableFieldAccessors: ReadonlyMap<
    string,
    (record: IMemoryRecord<unknown>) => unknown
  > = new Map<string, (record: IMemoryRecord<unknown>) => unknown>([
    ['body', (r) => r.body],
    ['tags', (r) => r.envelope.tags],
    ['links', (r) => r.envelope.links],
    ['provenance', (r) => r.envelope.provenance],
    ['embeddingRef', (r) => r.envelope.embeddingRef]
  ]);

  private constructor(params: IInternalParams) {
    this._root = params.root;
    this._registry = params.registry;
    this._writePolicies = params.writePolicies;
    this._codecs = params.codecs;
    this._defaultCodec = params.defaultCodec;
    this._defaultPolicy = params.defaultPolicy;
    this._scopeEncoding = params.scopeEncoding;
    this._clock = params.clock;
    this._index = params.index;
    this._hasher = new Hash.Crc32Normalizer();
    this._seq = 0;
    this._writeTail = Promise.resolve();
  }

  /**
   * Family-convention factory. Builds the derived index and a default LWW
   * policy, then performs an initial FileTree walk so an existing vault is
   * indexed (and the `seq` counter resumes past the highest persisted `seq`).
   */
  public static create(params: IFileTreeMemoryStoreCreateParams): Result<FileTreeMemoryStore> {
    return KnowledgeLwwPolicy.create().onSuccess((defaultPolicy) =>
      MemoryIndex.create().onSuccess((index) => {
        const store: FileTreeMemoryStore = new FileTreeMemoryStore({
          root: params.root,
          registry: params.registry,
          writePolicies: params.writePolicies ?? new Map<Kind, IWritePolicy>(),
          codecs: params.codecs ?? new Map<Kind, IIdentityCodec>(),
          defaultCodec: params.defaultCodec,
          defaultPolicy,
          scopeEncoding: params.scopeEncoding ?? defaultMemoryScopeEncoding,
          clock: params.clock ?? Date.now,
          index
        });
        return store._initialIndex().onSuccess(() => succeed(store));
      })
    );
  }

  /** {@inheritDoc IMemoryStore.get} */
  public async get(kind: Kind, entityId: EntityId): Promise<Result<IMemoryRecord<unknown> | undefined>> {
    return this._codecFor(kind).onSuccess((codec) =>
      codec.encode(entityId).onSuccess((addr) => {
        if (addr.isVersioned) {
          return fail(`memory get '${entityId}': versioned/temporal layout not yet supported`);
        }
        return this._readRecord(addr.scope, addr.idStem);
      })
    );
  }

  /** {@inheritDoc IMemoryStore.getById} */
  public async getById(
    scope: MemoryScopeKey,
    id: MemoryId
  ): Promise<Result<IMemoryRecord<unknown> | undefined>> {
    return this._readRecord(scope, id);
  }

  /** {@inheritDoc IMemoryStore.list} */
  public async list(filter?: IMemoryStoreListFilter): Promise<Result<ReadonlyArray<IMemoryRecord<unknown>>>> {
    const matches: IMemoryRecord<unknown>[] = this._index
      .entries()
      .filter((entry) => {
        if (filter?.scope !== undefined && entry.scope !== filter.scope) {
          return false;
        }
        if (filter?.kind !== undefined && entry.record.envelope.kind !== filter.kind) {
          return false;
        }
        if (filter?.tag !== undefined && !entry.record.envelope.tags.includes(filter.tag)) {
          return false;
        }
        return true;
      })
      .map((entry) => entry.record);
    return succeed(matches);
  }

  /** {@inheritDoc IMemoryStore.put} */
  public async put(record: IMemoryRecord<unknown>): Promise<Result<IMemoryRecord<unknown>>> {
    return this._enqueue(() => this._putLocked(record));
  }

  /** {@inheritDoc IMemoryStore.delete} */
  public async delete(kind: Kind, entityId: EntityId): Promise<Result<MemoryId>> {
    return this._enqueue(() => this._deleteLocked(kind, entityId));
  }

  /**
   * Serialize a mutating task behind the write-lock. Tasks run in submission
   * order; a failed task does not break the chain for subsequent ones.
   */
  private _enqueue<T>(task: () => Promise<Result<T>>): Promise<Result<T>> {
    const result: Promise<Result<T>> = this._writeTail.then(task);
    this._writeTail = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }

  private async _putLocked(record: IMemoryRecord<unknown>): Promise<Result<IMemoryRecord<unknown>>> {
    const envelope: IMemoryEnvelope = record.envelope;
    if (typeof record.body !== 'string') {
      return fail(
        `memory put '${envelope.id}': only string (markdown) bodies are supported (got ${typeof record.body})`
      );
    }
    const body: string = record.body;
    return this._registry
      .convert(envelope.kind, body)
      .withErrorFormat((msg) => `memory put '${envelope.id}': invalid body: ${msg}`)
      .onSuccess(() => this._codecFor(envelope.kind))
      .onSuccess((codec) =>
        codec.encode(envelope.entityId).onSuccess((addr) => {
          if (addr.isVersioned) {
            return fail(`memory put '${envelope.entityId}': versioned/temporal layout not yet supported`);
          }
          if (envelope.id !== addr.idStem) {
            return fail(
              `memory put: envelope id '${envelope.id}' does not match codec-derived stem '${addr.idStem}'`
            );
          }
          return this._contentHash(envelope.kind, body, envelope.links).onSuccess((hash) =>
            this._writeResolved(record, body, addr.scope, addr.idStem, hash)
          );
        })
      );
  }

  /**
   * Run dedup → policy → stamp → write for a resolved address and content hash.
   */
  private _writeResolved(
    record: IMemoryRecord<unknown>,
    body: string,
    scope: MemoryScopeKey,
    idStem: string,
    hash: string
  ): Result<IMemoryRecord<unknown>> {
    // Content-hash dedup runs BEFORE policy: an identical { kind, body, links }
    // triple anywhere in the scope is a no-op that returns the existing record
    // unchanged. (Tags / provenance are metadata and are NOT part of the hash —
    // a tags-only re-put therefore collapses to a no-op; see design-lock §2.5.)
    const duplicate: IMemoryRecord<unknown> | undefined = this._findByContentHash(scope, hash);
    if (duplicate !== undefined) {
      return succeed(duplicate);
    }
    return this._readRecord(scope, idStem).onSuccess((existing) => {
      const existingArr: ReadonlyArray<IMemoryRecord<unknown>> = existing === undefined ? [] : [existing];
      const policy: IWritePolicy = this._policyFor(record.envelope.kind);
      return policy
        .admit(record, existingArr)
        .onSuccess((decision) => this._applyDecision(decision, scope))
        .onSuccess(() => this._buildEnvelope(record, body, existing, policy, hash))
        .onSuccess((envelope) => this._persist(envelope, body, scope, idStem));
    });
  }

  /** Handle an {@link AdmissionDecision}: reject fails; cull-oldest evicts. */
  private _applyDecision(decision: AdmissionDecision, scope: MemoryScopeKey): Result<true> {
    if (decision.decision === 'reject') {
      return fail(`memory put: rejected by policy: ${decision.reason}`);
    }
    if (decision.decision === 'cull-oldest') {
      return mapResults(decision.evict.map((id) => this._evict(scope, id))).onSuccess(() => succeed(true));
    }
    return succeed(true);
  }

  /**
   * Build the envelope to persist. On a first write the incoming envelope is the
   * base; on an update the incoming record's mutable fields are projected into a
   * merge-patch and the policy's `applyUpdate` merges them over the existing
   * envelope (preserving `created`). The store then stamps the transaction-time
   * metadata it owns (`created` / `updated` / `seq` / `contentHash`).
   *
   * @remarks
   * The persisted body is always the (already-validated) incoming `body` string:
   * B1's only policy is last-write-wins, whose merge-patch replaces the body with
   * the incoming value, so the merged body equals `body`. `applyUpdate` is run for
   * its envelope-metadata merge (tags / links / provenance / embeddingRef).
   */
  private _buildEnvelope(
    incoming: IMemoryRecord<unknown>,
    body: string,
    existing: IMemoryRecord<unknown> | undefined,
    policy: IWritePolicy,
    hash: string
  ): Result<IMemoryEnvelope> {
    const now: number = this._clock();
    const seq: number = ++this._seq;
    if (existing === undefined) {
      return succeed({
        ...incoming.envelope,
        created: now,
        updated: now,
        seq,
        contentHash: hash
      });
    }
    const patch: Record<string, unknown> = this._projectMutablePatch(incoming, policy.mutableFields);
    return policy
      .applyUpdate(existing, patch)
      .withErrorFormat((msg) => `memory put '${incoming.envelope.id}': update failed: ${msg}`)
      .onSuccess((updated) =>
        succeed({
          ...updated.envelope,
          created: existing.envelope.created,
          updated: now,
          seq,
          contentHash: hash
        })
      );
  }

  /** Serialize and write a fully-stamped record, then patch the index. */
  private _persist(
    envelope: IMemoryEnvelope,
    body: string,
    scope: MemoryScopeKey,
    idStem: string
  ): Result<IMemoryRecord<unknown>> {
    const record: IMemoryRecord<unknown> = { envelope, body };
    return serializeMemoryFile(envelope, body)
      .onSuccess((raw) => this._writeFile(scope, idStem, raw))
      .onSuccess(() => this._index.patch('put', { scope, record }))
      .onSuccess(() => succeed(record));
  }

  private async _deleteLocked(kind: Kind, entityId: EntityId): Promise<Result<MemoryId>> {
    return this._codecFor(kind).onSuccess((codec) =>
      codec.encode(entityId).onSuccess((addr) => {
        if (addr.isVersioned) {
          return fail(`memory delete '${entityId}': versioned/temporal layout not yet supported`);
        }
        return this._readRecord(addr.scope, addr.idStem).onSuccess((existing) => {
          if (existing === undefined) {
            return fail(`memory delete '${entityId}': no record found`);
          }
          return this._deleteFile(addr.scope, addr.idStem)
            .onSuccess(() => this._index.patch('delete', { scope: addr.scope, record: existing }))
            .onSuccess(() => succeed(existing.envelope.id));
        });
      })
    );
  }

  /** Evict (physically delete) a single record by id, patching the index. */
  private _evict(scope: MemoryScopeKey, id: MemoryId): Result<MemoryId> {
    return this._readRecord(scope, id).onSuccess((existing) => {
      if (existing === undefined) {
        return fail(`memory put: cannot evict '${id}' in scope '${scope}': not found`);
      }
      return this._deleteFile(scope, id)
        .onSuccess(() => this._index.patch('delete', { scope, record: existing }))
        .onSuccess(() => succeed(id));
    });
  }

  /** Project the incoming record's mutable fields into a merge-patch. */
  private _projectMutablePatch(
    record: IMemoryRecord<unknown>,
    mutableFields: ReadonlyArray<string>
  ): Record<string, unknown> {
    const patch: Record<string, unknown> = {};
    for (const field of mutableFields) {
      const accessor: ((record: IMemoryRecord<unknown>) => unknown) | undefined =
        FileTreeMemoryStore._mutableFieldAccessors.get(field);
      if (accessor !== undefined) {
        const value: unknown = accessor(record);
        if (value !== undefined) {
          patch[field] = value;
        }
      }
    }
    return patch;
  }

  /** Find a record in `scope` whose `contentHash` equals `hash`, if any. */
  private _findByContentHash(scope: MemoryScopeKey, hash: string): IMemoryRecord<unknown> | undefined {
    const match: IIndexedMemoryRecord | undefined = this._index
      .entries()
      .find((entry) => entry.scope === scope && entry.record.envelope.contentHash === hash);
    return match?.record;
  }

  private _contentHash(kind: Kind, body: string, links: IMemoryEnvelope['links']): Result<string> {
    return this._hasher.computeHash({ kind, body, links });
  }

  private _codecFor(kind: Kind): Result<IIdentityCodec> {
    const codec: IIdentityCodec | undefined = this._codecs.get(kind) ?? this._defaultCodec;
    if (codec === undefined) {
      return fail(`no identity codec registered for kind '${kind}'`);
    }
    return succeed(codec);
  }

  private _policyFor(kind: Kind): IWritePolicy {
    return this._writePolicies.get(kind) ?? this._defaultPolicy;
  }

  /**
   * Read and validate the record at `<scope>/<idStem>.md`, returning `undefined`
   * when the scope directory or file is absent. Verifies the on-disk id ↔
   * filename round-trip on every load.
   */
  private _readRecord(scope: MemoryScopeKey, idStem: string): Result<IMemoryRecord<unknown> | undefined> {
    return this._resolveScopeDir(scope).onSuccess((scopeDir) => {
      if (scopeDir === undefined) {
        return succeed(undefined);
      }
      return scopeDir.getChildren().onSuccess((children) => {
        const targetName: string = `${idStem}${MEMORY_FILE_EXTENSION}`;
        const file: FileTree.IFileTreeFileItem | undefined = children.find(
          (c): c is FileTree.IFileTreeFileItem => c.type === 'file' && c.name === targetName
        );
        if (file === undefined) {
          return succeed(undefined);
        }
        return file
          .getRawContents()
          .onSuccess((raw) => parseMemoryFile(raw, this._registry))
          .onSuccess((parsedRecord) => this._verifyLoaded(scope, file, parsedRecord));
      });
    });
  }

  /** Enforce `envelope.id === filename stem` and the codec round-trip on load. */
  private _verifyLoaded(
    scope: MemoryScopeKey,
    file: FileTree.IFileTreeFileItem,
    record: IMemoryRecord<unknown>
  ): Result<IMemoryRecord<unknown>> {
    if (record.envelope.id !== file.baseName) {
      return fail(
        `memory file '${file.absolutePath}': envelope id '${record.envelope.id}' does not match filename stem '${file.baseName}'`
      );
    }
    return this._codecFor(record.envelope.kind)
      .onSuccess((codec) => codec.verifyRoundTrip(scope, file.baseName))
      .withErrorFormat((msg) => `memory file '${file.absolutePath}': ${msg}`)
      .onSuccess(() => succeed(record));
  }

  /**
   * Resolve the directory for a scope, returning `undefined` when it does not
   * exist. Navigation only — does not create. Folds the path segments through
   * `getChildren` so an absent segment short-circuits to `undefined`.
   */
  private _resolveScopeDir(scope: MemoryScopeKey): Result<FileTree.IFileTreeDirectoryItem | undefined> {
    return this._scopeEncoding(scope).onSuccess((encoded) => {
      const segments: string[] = encoded.split('/').filter((s) => s.length > 0);
      return segments.reduce<Result<FileTree.IFileTreeDirectoryItem | undefined>>(
        (acc, segment) =>
          acc.onSuccess((current) => {
            if (current === undefined) {
              return succeed(undefined);
            }
            return current
              .getChildren()
              .onSuccess((children) =>
                succeed(
                  children.find(
                    (c): c is FileTree.IFileTreeDirectoryItem => c.type === 'directory' && c.name === segment
                  )
                )
              );
          }),
        succeed(this._root)
      );
    });
  }

  /** Ensure the scope directory exists, creating segments as needed. */
  private _ensureScopeDir(scope: MemoryScopeKey): Result<FileTree.IMutableFileTreeDirectoryItem> {
    return this._scopeEncoding(scope).onSuccess((encoded) => {
      const segments: string[] = encoded.split('/').filter((s) => s.length > 0);
      return segments.reduce<Result<FileTree.IMutableFileTreeDirectoryItem>>(
        (acc, segment) =>
          acc.onSuccess((current) =>
            current.getChildren().onSuccess((children) => {
              const existing: FileTree.FileTreeItem | undefined = children.find(
                (c) => c.type === 'directory' && c.name === segment
              );
              if (existing === undefined) {
                return current.createChildDirectory(segment);
              }
              /* c8 ignore next 3 -- defensive: a child of a mutable in-memory/fs tree is itself mutable; the guard protects against a read-only adapter handed in as root */
              if (!FileTree.isMutableDirectoryItem(existing)) {
                return fail(`${existing.absolutePath}: directory is not mutable`);
              }
              return succeed(existing);
            })
          ),
        succeed(this._root)
      );
    });
  }

  /** Write (create or overwrite) `<scope>/<idStem>.md` with `raw`. */
  private _writeFile(scope: MemoryScopeKey, idStem: string, raw: string): Result<true> {
    return this._ensureScopeDir(scope).onSuccess((scopeDir) =>
      scopeDir.getChildren().onSuccess((children) => {
        const fileName: string = `${idStem}${MEMORY_FILE_EXTENSION}`;
        const existing: FileTree.FileTreeItem | undefined = children.find(
          (c) => c.type === 'file' && c.name === fileName
        );
        if (existing === undefined) {
          return scopeDir.createChildFile(fileName, raw).onSuccess(() => succeed(true));
        }
        /* c8 ignore next 3 -- defensive: a file in a mutable tree is mutable; guards a read-only adapter */
        if (!FileTree.isMutableFileItem(existing)) {
          return fail(`${existing.absolutePath}: file is not mutable`);
        }
        return existing.setRawContents(raw).onSuccess(() => succeed(true));
      })
    );
  }

  /**
   * Physically delete `<scope>/<idStem>.md`. The scope-missing and file-missing
   * guards are unreachable through the callers (`delete` / `_evict` both read the
   * record first, so the directory and file exist) but are kept so a future
   * direct caller degrades loudly rather than silently.
   */
  private _deleteFile(scope: MemoryScopeKey, idStem: string): Result<true> {
    return this._resolveScopeDir(scope).onSuccess((scopeDir) => {
      /* c8 ignore next 3 -- unreachable: callers read the record (hence the scope dir) first */
      if (scopeDir === undefined) {
        return fail(`memory delete: scope '${scope}' not found`);
      }
      const fileName: string = `${idStem}${MEMORY_FILE_EXTENSION}`;
      return scopeDir.getChildren().onSuccess((children) => {
        const file: FileTree.FileTreeItem | undefined = children.find(
          (c) => c.type === 'file' && c.name === fileName
        );
        /* c8 ignore next 3 -- unreachable: callers read the record (hence the file) first */
        if (file === undefined) {
          return fail(`memory delete: file '${fileName}' not found in scope '${scope}'`);
        }
        /* c8 ignore next 3 -- defensive: a file in a mutable tree is mutable; guards a read-only adapter */
        if (!FileTree.isMutableFileItem(file)) {
          return fail(`${file.absolutePath}: file is not mutable`);
        }
        return file.delete().onSuccess(() => succeed(true));
      });
    });
  }

  /**
   * Walk the FileTree once and rebuild the index. Also resumes the `seq`
   * counter past the highest persisted `seq` so new writes stay monotonic.
   */
  private _initialIndex(): Result<true> {
    return this._collectEntries(this._root, []).onSuccess((entries) =>
      this._index.rebuild(entries).onSuccess(() => {
        for (const entry of entries) {
          if (entry.record.envelope.seq > this._seq) {
            this._seq = entry.record.envelope.seq;
          }
        }
        return succeed(true);
      })
    );
  }

  /** Recursively collect every `.md` record under `dir` (scope = path segments). */
  private _collectEntries(
    dir: FileTree.IFileTreeDirectoryItem,
    scopeSegments: ReadonlyArray<string>
  ): Result<ReadonlyArray<IIndexedMemoryRecord>> {
    return dir.getChildren().onSuccess((children) => {
      const results: Result<ReadonlyArray<IIndexedMemoryRecord>>[] = children.map((child) => {
        if (child.type === 'directory') {
          return this._collectEntries(child, [...scopeSegments, child.name]);
        }
        if (!child.name.endsWith(MEMORY_FILE_EXTENSION) || scopeSegments.length === 0) {
          // Skip non-record files and any record-shaped file sitting at the root
          // (records always live under at least one scope segment).
          return succeed<ReadonlyArray<IIndexedMemoryRecord>>([]);
        }
        const scope: MemoryScopeKey = scopeSegments.join('/') as MemoryScopeKey;
        return child
          .getRawContents()
          .onSuccess((raw) => parseMemoryFile(raw, this._registry))
          .onSuccess((parsedRecord) => this._verifyLoaded(scope, child, parsedRecord))
          .onSuccess((verified) =>
            succeed<ReadonlyArray<IIndexedMemoryRecord>>([{ scope, record: verified }])
          );
      });
      return mapResults(results).onSuccess((perChild) =>
        succeed<ReadonlyArray<IIndexedMemoryRecord>>(perChild.flat())
      );
    });
  }
}
