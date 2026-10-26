/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import { Convert, MemoryScopeKey } from '../types';

/** The record filename extension; the store's files are markdown + YAML frontmatter. */
const MEMORY_FILE_EXTENSION: string = '.md';

/**
 * Maps a {@link MemoryScopeKey} to the relative directory path it is stored under.
 * Injected into the store, so this layer takes it rather than re-deriving it.
 * @internal
 */
export type ScopeEncoder = (scope: MemoryScopeKey) => Result<string>;

/**
 * Maps a relative directory path back to the {@link MemoryScopeKey} stored under it.
 * @internal
 */
export type ScopeDecoder = (encoded: string) => Result<MemoryScopeKey>;

/**
 * The store's scope encoding and, when the encoding is not the identity, its inverse.
 * `decode` is `undefined` exactly when the host supplied neither, in which case a
 * directory path IS its scope.
 * @internal
 */
export interface IScopeCoding {
  readonly encode: ScopeEncoder;
  readonly decode?: ScopeDecoder;
}

/**
 * Call a host-supplied coder, turning a throw into a failure so a misbehaving
 * coder fails the operation (or is quarantined at open) rather than escaping it.
 */
function callCoder<T>(name: string, call: () => Result<T>): Result<T> {
  return captureResult(call)
    .withErrorFormat((msg) => `${name} threw: ${msg}`)
    .onSuccess((result) => result);
}

/**
 * Require an encoded path to be canonical: non-empty, with no empty, `.` or `..`
 * segments. Directory resolution drops empty segments, so a non-canonical path
 * would be written somewhere the open-time walk recovers under a different path,
 * or, for `''`, at the root, where the walk ignores record files entirely.
 */
function requireCanonical(encoded: string): Result<string> {
  if (encoded.split('/').some((s) => s === '' || s === '.' || s === '..')) {
    return fail(
      `encoded path '${encoded}' is not canonical: it needs non-empty segments, none of them '.' or '..'`
    );
  }
  return succeed(encoded);
}

/**
 * Recover the scope a walked directory holds records for. With a decoding, the
 * decoded scope must pass the scope converter and re-encode to exactly `dirPath`;
 * a pair that is not a bijection on this directory fails here rather than filing
 * its records under a scope no read could reach.
 */
export function decodeScopeDir(scopes: IScopeCoding, dirPath: string): Result<MemoryScopeKey> {
  if (scopes.decode === undefined) {
    // The identity case: the walk has always indexed the raw path, unvalidated.
    return succeed(dirPath as MemoryScopeKey);
  }
  const decode: ScopeDecoder = scopes.decode;
  return callCoder('scopeDecoding', () => decode(dirPath))
    .onSuccess((decoded) => Convert.scopeKey.convert(decoded))
    .onSuccess((scope) =>
      callCoder('scopeEncoding', () => scopes.encode(scope)).onSuccess((reencoded) =>
        reencoded === dirPath
          ? succeed(scope)
          : fail<MemoryScopeKey>(`decodes to scope '${scope}', which encodes to '${reencoded}'`)
      )
    )
    .withErrorFormat((msg) => `scope directory '${dirPath}': ${msg}`);
}

/**
 * Encode `scope` to its directory path. With a decoding, the path must decode back
 * to `scope`, so every address-first read and every write sees the same scope the
 * open-time walk would recover from the directory.
 */
export function encodeScope(scopes: IScopeCoding, scope: MemoryScopeKey): Result<string> {
  if (scopes.decode === undefined) {
    return scopes.encode(scope);
  }
  return callCoder('scopeEncoding', () => scopes.encode(scope))
    .onSuccess(requireCanonical)
    .onSuccess((encoded) =>
      decodeScopeDir(scopes, encoded).onSuccess((decoded) =>
        decoded === scope
          ? succeed(encoded)
          : fail<string>(`encodes to '${encoded}', which decodes to scope '${decoded}'`)
      )
    )
    .withErrorFormat((msg) => `scope '${scope}': ${msg}`);
}

/**
 * The FileTree access layer beneath `FileTreeMemoryStore`: resolving and creating
 * scope directories, and writing and deleting record files.
 *
 * @remarks
 * Package-internal. Separated from the store because it is the one part of it that
 * knows *where bytes live* rather than *what a record means* — it depends on nothing
 * but the root directory and the scope coding, and on no record semantics at all
 * (no registry, no codec, no policy, no index). Extracted as free functions taking
 * their two dependencies explicitly, matching `storeIdentity.ts`, so the seam is
 * visible in the signatures rather than implied by `this`.
 * @internal
 */

/**
 * Resolve the directory for a scope, returning `undefined` when it does not
 * exist. Navigation only — does not create. Folds the path segments through
 * `getChildren` so an absent segment short-circuits to `undefined`.
 */
export function resolveScopeDir(
  root: FileTree.IMutableFileTreeDirectoryItem,
  scopes: IScopeCoding,
  scope: MemoryScopeKey
): Result<FileTree.IFileTreeDirectoryItem | undefined> {
  return encodeScope(scopes, scope).onSuccess((encoded) => {
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
      succeed(root)
    );
  });
}

/**
 * Create `name` under `parent`, then require the parent's listing to show it as a directory.
 *
 * @remarks
 * A directory the store writes into must be one its reads can find. A filesystem listing shows only
 * real files and directories, so an entry it hides — a symbolic link, say — is invisible to every
 * read, the open walk and the sweep, while a create over it can still succeed and send the write
 * through the link. A record written there could never be read back. Re-listing after the create
 * is what tells "created" from "something unlisted was already there".
 */
function createListedDirectory(
  parent: FileTree.IMutableFileTreeDirectoryItem,
  name: string
): Result<FileTree.IMutableFileTreeDirectoryItem> {
  return parent
    .createChildDirectory(name)
    .onSuccess((created) =>
      parent
        .getChildren()
        .onSuccess((children) =>
          children.some((c) => c.type === 'directory' && c.name === name)
            ? succeed(created)
            : fail<FileTree.IMutableFileTreeDirectoryItem>(
                `memory store: '${created.absolutePath}' exists but is not a directory the store can list ` +
                  `(a symbolic link or other special entry); a record written there could never be read back`
              )
        )
    );
}

/** Ensure the scope directory exists, creating segments as needed. */
export function ensureScopeDir(
  root: FileTree.IMutableFileTreeDirectoryItem,
  scopes: IScopeCoding,
  scope: MemoryScopeKey
): Result<FileTree.IMutableFileTreeDirectoryItem> {
  return encodeScope(scopes, scope).onSuccess((encoded) => {
    const segments: string[] = encoded.split('/').filter((s) => s.length > 0);
    return segments.reduce<Result<FileTree.IMutableFileTreeDirectoryItem>>(
      (acc, segment) =>
        acc.onSuccess((current) =>
          current.getChildren().onSuccess((children) => {
            const existing: FileTree.FileTreeItem | undefined = children.find(
              (c) => c.type === 'directory' && c.name === segment
            );
            if (existing === undefined) {
              return createListedDirectory(current, segment);
            }
            /* c8 ignore next 3 -- defensive: a child of a mutable in-memory/fs tree is itself mutable; the guard protects against a read-only adapter handed in as root */
            if (!FileTree.isMutableDirectoryItem(existing)) {
              return fail(`${existing.absolutePath}: directory is not mutable`);
            }
            return succeed(existing);
          })
        ),
      succeed(root)
    );
  });
}

/**
 * How the store writes record files, resolved once at open.
 * @internal
 */
export interface IRecordWriter {
  /**
   * The atomic guarantee every record write must honour, or `undefined` when the root offers no
   * atomic write and the store degrades to plain writes. There is no per-write fallback: a write
   * that cannot honour this guarantee fails.
   */
  readonly guarantee?: FileTree.AtomicWriteGuarantee;
  /** Fails once the store may no longer mutate its root (it has been disposed). */
  checkWritable(): Result<true>;
  /** Reports a write that committed despite a failure the caller should know about. */
  warn(message: string): void;
}

/**
 * Write (create or overwrite) `<scope>/<idStem>.md` with `raw`.
 *
 * @remarks
 * Success means the file now holds the new record. Failure means it does not, with one
 * exception the message names: an atomic write whose outcome was `'unknown'` and whose re-read
 * also failed, where the file may hold either record until the store is reopened.
 */
export function writeRecordFile(
  root: FileTree.IMutableFileTreeDirectoryItem,
  scopes: IScopeCoding,
  writer: IRecordWriter,
  scope: MemoryScopeKey,
  idStem: string,
  raw: string
): Result<true> {
  return writer
    .checkWritable()
    .onSuccess(() => ensureScopeDir(root, scopes, scope))
    .onSuccess((scopeDir) =>
      writeStoreFile(scopeDir, writer, `${idStem}${MEMORY_FILE_EXTENSION}`, raw, 'record')
    );
}

/**
 * What a store file holds, for the messages an unsettled write reports: a record (which the
 * resident index mirrors) or the seq high-water mark (which nothing mirrors).
 * @internal
 */
export type StoreFileSubject = 'record' | 'seq';

/** How each subject's messages name it, and what keeps the previous one meanwhile. */
const subjectWording: Readonly<Record<StoreFileSubject, { readonly noun: string; readonly held: string }>> = {
  record: { noun: 'record', held: ", and the store's index keeps the previous one until reopened" },
  seq: { noun: 'seq high-water mark', held: '; the next open reads whichever it holds' }
};

/**
 * Write (create or overwrite) `fileName` in `dir` with `raw`, atomically when the writer does — the
 * same contract as {@link writeRecordFile}, for a file the caller has already placed.
 * @internal
 */
export function writeStoreFile(
  dir: FileTree.IMutableFileTreeDirectoryItem,
  writer: IRecordWriter,
  fileName: string,
  raw: string,
  subject: StoreFileSubject
): Result<true> {
  return writer
    .checkWritable()
    .onSuccess(() =>
      writer.guarantee === undefined
        ? writePlain(dir, fileName, raw)
        : writeAtomic(dir, fileName, raw, writer.guarantee, writer, subject)
    );
}

/** The degraded path: an ordinary create, or an in-place overwrite. */
function writePlain(
  scopeDir: FileTree.IMutableFileTreeDirectoryItem,
  fileName: string,
  raw: string
): Result<true> {
  return scopeDir.getChildren().onSuccess((children) => {
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
  });
}

/**
 * The atomic path. A refusal is never retried as a plain write, and a failure that may already
 * have changed the file is settled before it is reported, so the caller's index patch follows
 * what the file actually holds.
 */
function writeAtomic(
  scopeDir: FileTree.IMutableFileTreeDirectoryItem,
  fileName: string,
  raw: string,
  guarantee: FileTree.AtomicWriteGuarantee,
  writer: IRecordWriter,
  subject: StoreFileSubject
): Result<true> {
  const target: string = `${scopeDir.absolutePath}/${fileName}`;
  const { noun, held } = subjectWording[subject];
  if (!FileTree.isAtomicDirectoryItem(scopeDir)) {
    return fail(
      `${target}: the store writes atomically at '${guarantee}' and this directory cannot write atomically`
    );
  }
  const written = scopeDir.writeChildAtomically(fileName, raw, { guarantee });
  if (written.isSuccess()) {
    return succeed(true);
  }
  const committed = (): Result<true> => {
    writer.warn(`${target}: the new ${noun} is in place, but the write reported: ${written.message}`);
    return succeed(true);
  };
  // An unclassified failure is treated as the ambiguous case: settled by reading, never assumed.
  const visibility: FileTree.IAtomicWriteFailure['visibility'] = written.detail?.visibility ?? 'unknown';
  if (visibility === 'replaced') {
    return committed();
  }
  if (visibility === 'unchanged') {
    return fail(written.message);
  }
  return readChildText(scopeDir, fileName)
    .withErrorFormat(
      (m) =>
        `${written.message}; the outcome could not be settled by re-reading (${m}): the file may hold ` +
        `the new ${noun} or the previous one${held}`
    )
    .onSuccess((contents: string | undefined) =>
      contents !== undefined && asStored(contents) === asStored(raw)
        ? committed()
        : fail<true>(`${written.message}; a re-read shows the write did not take effect`)
    );
}

/**
 * Re-read a child file's text: `undefined` when it is absent, which after a write that would have
 * created it means the write did not take effect.
 */
function readChildText(
  scopeDir: FileTree.IFileTreeDirectoryItem,
  fileName: string
): Result<string | undefined> {
  return scopeDir.getChildren().onSuccess((children) => {
    const file: FileTree.IFileTreeFileItem | undefined = children.find(
      (c): c is FileTree.IFileTreeFileItem => c.type === 'file' && c.name === fileName
    );
    return file === undefined ? succeed(undefined) : file.getRawContents();
  });
}

/**
 * Physically delete `<scope>/<idStem>.md`. The scope-missing and file-missing
 * guards are unreachable through the callers (`delete` / `_evict` both read the
 * record first, so the directory and file exist) but are kept so a future
 * direct caller degrades loudly rather than silently.
 */
export function deleteRecordFile(
  root: FileTree.IMutableFileTreeDirectoryItem,
  scopes: IScopeCoding,
  writer: IRecordWriter,
  scope: MemoryScopeKey,
  idStem: string
): Result<true> {
  return writer
    .checkWritable()
    .onSuccess(() => resolveScopeDir(root, scopes, scope))
    .onSuccess((scopeDir) => {
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
 * What `text` reads back as once stored as UTF-8 — a lone surrogate becomes U+FFFD — so a re-read
 * compares with what the write could have produced rather than with what it was handed.
 */
function asStored(text: string): string {
  return new TextDecoder().decode(new TextEncoder().encode(text));
}

/**
 * What an open-time sweep removed, and what it could not. Never a failure: a working file left
 * behind is not a record file, so it cannot be read as one, and an open does not fail over it.
 * @internal
 */
export interface ISweepReport {
  /** Removed working files, as paths relative to the root. */
  readonly removed: ReadonlyArray<string>;
  /** What could not be listed or swept, one message per directory. */
  readonly failures: ReadonlyArray<string>;
}

/**
 * Remove the working files interrupted atomic writes left in the store's scope directories — the
 * directories beneath `root` that hold a record file, which are the ones the open walk reads records
 * from. Valid only while the caller holds the root's single-writer guard, because the working file of
 * a live write is indistinguishable from an orphan.
 *
 * @remarks
 * A directory with no record file is not swept: the root and intermediate directories never hold
 * records, and a scope directory whose only content is an interrupted first write is swept by a
 * later open, once it holds a record. The working file is harmless meanwhile. That includes one an
 * interrupted write of the root's seq high-water file leaves at the root, which is never swept:
 * nothing reads it, and sweeping the root would sweep a directory the store does not otherwise own.
 * @internal
 */
export function sweepAtomicTemporaries(root: FileTree.IFileTreeDirectoryItem): ISweepReport {
  const removed: string[] = [];
  const failures: string[] = [];
  const visit = (dir: FileTree.IFileTreeDirectoryItem, relativePath: string): void => {
    const listed: Result<ReadonlyArray<FileTree.FileTreeItem>> = dir.getChildren();
    if (listed.isFailure()) {
      failures.push(`${dir.absolutePath}: cannot list: ${listed.message}`);
      return;
    }
    const under = (name: string): string => (relativePath === '' ? name : `${relativePath}/${name}`);
    const holdsRecords: boolean =
      relativePath !== '' &&
      listed.value.some((c) => c.type === 'file' && c.name.endsWith(MEMORY_FILE_EXTENSION));
    if (holdsRecords && FileTree.isAtomicDirectoryItem(dir)) {
      const cleaned: Result<ReadonlyArray<string>> = dir.cleanupAtomicTemporaries();
      if (cleaned.isSuccess()) {
        removed.push(...cleaned.value.map(under));
      } else {
        // A failed sweep may still have removed some: what was listed before and is gone now.
        const before: ReadonlyArray<string> = listed.value.map((c) => c.name);
        const after: Set<string> = new Set(
          dir
            .getChildren()
            .orDefault(listed.value)
            .map((c) => c.name)
        );
        removed.push(...before.filter((n) => !after.has(n)).map(under));
        failures.push(`${relativePath}: ${cleaned.message}`);
      }
    }
    for (const child of listed.value) {
      if (child.type === 'directory') {
        visit(child, under(child.name));
      }
    }
  };
  visit(root, '');
  return { removed, failures };
}
