/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import { Result, fail, succeed } from '@fgv/ts-utils';
import { MemoryScopeKey } from '../types';

/** The record filename extension; the store's files are markdown + YAML frontmatter. */
const MEMORY_FILE_EXTENSION: string = '.md';

/**
 * Maps a {@link MemoryScopeKey} to the relative directory path it is stored under.
 * Injected into the store, so this layer takes it rather than re-deriving it.
 * @internal
 */
export type ScopeEncoder = (scope: MemoryScopeKey) => Result<string>;

/**
 * The FileTree access layer beneath `FileTreeMemoryStore`: resolving and creating
 * scope directories, and writing and deleting record files.
 *
 * @remarks
 * Package-internal. Separated from the store because it is the one part of it that
 * knows *where bytes live* rather than *what a record means* — it depends on nothing
 * but the root directory and the scope encoder, and on no record semantics at all
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
  scopeEncoding: ScopeEncoder,
  scope: MemoryScopeKey
): Result<FileTree.IFileTreeDirectoryItem | undefined> {
  return scopeEncoding(scope).onSuccess((encoded) => {
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

/** Ensure the scope directory exists, creating segments as needed. */
export function ensureScopeDir(
  root: FileTree.IMutableFileTreeDirectoryItem,
  scopeEncoding: ScopeEncoder,
  scope: MemoryScopeKey
): Result<FileTree.IMutableFileTreeDirectoryItem> {
  return scopeEncoding(scope).onSuccess((encoded) => {
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
      succeed(root)
    );
  });
}

/** Write (create or overwrite) `<scope>/<idStem>.md` with `raw`. */
export function writeRecordFile(
  root: FileTree.IMutableFileTreeDirectoryItem,
  scopeEncoding: ScopeEncoder,
  scope: MemoryScopeKey,
  idStem: string,
  raw: string
): Result<true> {
  return ensureScopeDir(root, scopeEncoding, scope).onSuccess((scopeDir) =>
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
export function deleteRecordFile(
  root: FileTree.IMutableFileTreeDirectoryItem,
  scopeEncoding: ScopeEncoder,
  scope: MemoryScopeKey,
  idStem: string
): Result<true> {
  return resolveScopeDir(root, scopeEncoding, scope).onSuccess((scopeDir) => {
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
