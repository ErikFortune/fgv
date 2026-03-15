// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Import resolver utilities for handling common library and sub-library directory shapes.
 * @packageDocumentation
 */

import { FileTree } from '@fgv/ts-json-base';
import { Failure, Result, Success } from '@fgv/ts-utils';

import {
  allSubLibraryIds,
  type IDirectorySearchQueueItem,
  type IImportRootCandidate,
  type IResolvedImportRoot,
  type IResolveImportRootOptions,
  type SubLibraryId
} from './model';

class VirtualDirectoryItem implements FileTree.IFileTreeDirectoryItem {
  public readonly type: 'directory' = 'directory';
  public readonly absolutePath: string;
  public readonly name: string;
  private readonly _getChildren: () => Result<ReadonlyArray<FileTree.FileTreeItem>>;

  public constructor(
    name: string,
    absolutePath: string,
    getChildren: () => Result<ReadonlyArray<FileTree.FileTreeItem>>
  ) {
    this.name = name;
    this.absolutePath = absolutePath;
    this._getChildren = getChildren;
  }

  public getChildren(): Result<ReadonlyArray<FileTree.FileTreeItem>> {
    return this._getChildren();
  }
}

const defaultOptions: Required<IResolveImportRootOptions> = {
  maxDepth: 2,
  visitLimit: 800,
  matchLimit: 10,
  allowLooseFiles: true
};

function isCollectionFileName(name: string): boolean {
  const n = name.toLowerCase();
  return n.endsWith('.json') || n.endsWith('.yaml') || n.endsWith('.yml');
}

function tryResolveAt(
  dir: FileTree.IFileTreeDirectoryItem,
  subLibraryId: SubLibraryId,
  options: Required<IResolveImportRootOptions>
): Result<IImportRootCandidate | undefined> {
  const childrenResult = dir.getChildren();
  /* c8 ignore next 3 - defensive: would only fail if FileTree implementation is broken */
  if (childrenResult.isFailure()) {
    return Failure.with(`Failed to enumerate directory '${dir.name}': ${childrenResult.message}`);
  }

  const children = childrenResult.value;

  // Case 1: canonical library root contains data/<subLibraryId>
  const dataDir = children.find(
    (c): c is FileTree.IFileTreeDirectoryItem => c.type === 'directory' && c.name === 'data'
  );
  if (dataDir) {
    const dataChildrenResult = dataDir.getChildren();
    /* c8 ignore next 3 - defensive: would only fail if FileTree implementation is broken */
    if (dataChildrenResult.isFailure()) {
      return Failure.with(`Failed to enumerate directory '${dataDir.name}': ${dataChildrenResult.message}`);
    }

    const hasExpected = dataChildrenResult.value.some(
      (c) => c.type === 'directory' && c.name === subLibraryId
    );
    if (hasExpected) {
      return Success.with({ root: dir, kind: 'canonical' });
    }
  }

  // Case 2: caller selected 'data' directory directly
  if (dir.name === 'data') {
    const hasExpected = children.some((c) => c.type === 'directory' && c.name === subLibraryId);
    if (hasExpected) {
      const virtualRoot = new VirtualDirectoryItem('', '/', () => Success.with([dir]));
      return Success.with({ root: virtualRoot, kind: 'data-dir' });
    }
  }

  // Case 3: direct sub-library directory exists at this level (e.g., ingredients/)
  const directSubDir = children.find(
    (c): c is FileTree.IFileTreeDirectoryItem => c.type === 'directory' && c.name === subLibraryId
  );
  if (directSubDir) {
    const virtualData = new VirtualDirectoryItem('data', '/data', () => Success.with([directSubDir]));
    const virtualRoot = new VirtualDirectoryItem('', '/', () => Success.with([virtualData]));
    return Success.with({ root: virtualRoot, kind: 'direct-subdir' });
  }

  // Case 4: loose collection files at this level
  if (options.allowLooseFiles) {
    const looseFiles = children.filter(
      (c): c is FileTree.IFileTreeFileItem => c.type === 'file' && isCollectionFileName(c.name)
    );
    if (looseFiles.length > 0) {
      const virtualSubDir = new VirtualDirectoryItem(subLibraryId, `/data/${subLibraryId}`, () =>
        Success.with(looseFiles)
      );
      const virtualData = new VirtualDirectoryItem('data', '/data', () => Success.with([virtualSubDir]));
      const virtualRoot = new VirtualDirectoryItem('', '/', () => Success.with([virtualData]));
      return Success.with({ root: virtualRoot, kind: 'loose-files' });
    }
  }

  return Success.with(undefined);
}

/**
 * Resolves a directory that can be treated as a library root for a specific sub-library.
 *
 * The returned directory is guaranteed (if successful) to contain a navigable `data/<subLibraryId>`
 * directory, even if the input is shaped as `<subLibraryId>/...`, `data/...`, or a set of loose
 * collection files.
 *
 * This is intended to unify import behavior across zip, filesystem, and in-memory sources.
 *
 * @param root - Root directory to search.
 * @param subLibraryId - Target sub-library.
 * @param options - Search and compatibility options.
 * @public
 */
export function resolveImportRootForSubLibrary(
  root: FileTree.IFileTreeDirectoryItem,
  subLibraryId: SubLibraryId,
  options?: IResolveImportRootOptions
): Result<IResolvedImportRoot> {
  const resolvedOptions: Required<IResolveImportRootOptions> = { ...defaultOptions, ...(options ?? {}) };

  let visited = 0;
  let matches = 0;

  const queue: IDirectorySearchQueueItem[] = [{ dir: root, depth: 0 }];

  let selected: IImportRootCandidate | undefined;

  while (queue.length > 0 && visited < resolvedOptions.visitLimit && matches < resolvedOptions.matchLimit) {
    const current = queue.shift();
    /* c8 ignore next 3 - defensive: while condition ensures queue.length > 0 before shift */
    if (!current) {
      break;
    }

    visited += 1;

    const resolvedResult = tryResolveAt(current.dir, subLibraryId, resolvedOptions);
    /* c8 ignore next 3 - defensive: tryResolveAt only fails if FileTree implementation is broken */
    if (resolvedResult.isFailure()) {
      return Failure.with(resolvedResult.message);
    }

    const resolved = resolvedResult.value;
    if (resolved) {
      matches += 1;
      if (!selected) {
        selected = resolved;
      }
      continue;
    }

    if (current.depth >= resolvedOptions.maxDepth) {
      continue;
    }

    const childrenResult = current.dir.getChildren();
    /* c8 ignore next 3 - defensive: would only fail if FileTree implementation is broken */
    if (childrenResult.isFailure()) {
      return Failure.with(`Failed to enumerate directory '${current.dir.name}': ${childrenResult.message}`);
    }

    for (const child of childrenResult.value) {
      if (child.type === 'directory') {
        queue.push({ dir: child, depth: current.depth + 1 });
      }
    }
  }

  if (!selected) {
    return Failure.with(
      `Unable to resolve import root for '${subLibraryId}' (expected data/${subLibraryId}/, ${subLibraryId}/, or loose collection files)`
    );
  }

  return Success.with({
    root: selected.root,
    kind: selected.kind,
    visited,
    matches
  });
}

/**
 * Try to resolve at a directory for a full library (any sub-library).
 *
 * @param dir - Directory to check.
 * @returns A candidate if found, undefined otherwise.
 */
function tryResolveLibraryAt(dir: FileTree.IFileTreeDirectoryItem): Result<IImportRootCandidate | undefined> {
  const childrenResult = dir.getChildren();
  /* c8 ignore next 3 - defensive: would only fail if FileTree implementation is broken */
  if (childrenResult.isFailure()) {
    return Failure.with(`Failed to enumerate directory '${dir.name}': ${childrenResult.message}`);
  }

  const children = childrenResult.value;

  // Case 1: canonical library root contains data/ with any sub-library
  const dataDir = children.find(
    (c): c is FileTree.IFileTreeDirectoryItem => c.type === 'directory' && c.name === 'data'
  );
  if (dataDir) {
    const dataChildrenResult = dataDir.getChildren();
    /* c8 ignore next 3 - defensive: would only fail if FileTree implementation is broken */
    if (dataChildrenResult.isFailure()) {
      return Failure.with(`Failed to enumerate directory '${dataDir.name}': ${dataChildrenResult.message}`);
    }

    const hasAnySubLib = dataChildrenResult.value.some(
      (c) => c.type === 'directory' && (allSubLibraryIds as readonly string[]).includes(c.name)
    );
    if (hasAnySubLib) {
      return Success.with({ root: dir, kind: 'canonical' });
    }
  }

  // Case 2: caller selected 'data' directory directly
  if (dir.name === 'data') {
    const hasAnySubLib = children.some(
      (c) => c.type === 'directory' && (allSubLibraryIds as readonly string[]).includes(c.name)
    );
    if (hasAnySubLib) {
      const virtualRoot = new VirtualDirectoryItem('', '/', () => Success.with([dir]));
      return Success.with({ root: virtualRoot, kind: 'data-dir' });
    }
  }

  // Case 3: direct sub-library directories exist at this level
  const directSubDirs = children.filter(
    (c): c is FileTree.IFileTreeDirectoryItem =>
      c.type === 'directory' && (allSubLibraryIds as readonly string[]).includes(c.name)
  );
  if (directSubDirs.length > 0) {
    const virtualData = new VirtualDirectoryItem('data', '/data', () => Success.with(directSubDirs));
    const virtualRoot = new VirtualDirectoryItem('', '/', () => Success.with([virtualData]));
    return Success.with({ root: virtualRoot, kind: 'direct-subdir' });
  }

  return Success.with(undefined);
}

/**
 * Resolves a directory that can be treated as a library root for any sub-libraries.
 *
 * The returned directory is guaranteed (if successful) to contain a navigable `data/` directory
 * with at least one standard sub-library directory (ingredients, fillings, etc.).
 *
 * This is intended to unify import behavior across zip, filesystem, and in-memory sources
 * when importing a full library rather than a specific sub-library.
 *
 * @param root - Root directory to search.
 * @param options - Search options (allowLooseFiles is ignored for full library resolution).
 * @public
 */
export function resolveImportRootForLibrary(
  root: FileTree.IFileTreeDirectoryItem,
  options?: Omit<IResolveImportRootOptions, 'allowLooseFiles'>
): Result<IResolvedImportRoot> {
  const resolvedOptions: Required<IResolveImportRootOptions> = {
    ...defaultOptions,
    ...(options ?? {}),
    allowLooseFiles: false // Not applicable for full library resolution
  };

  let visited = 0;
  let matches = 0;

  const queue: IDirectorySearchQueueItem[] = [{ dir: root, depth: 0 }];

  let selected: IImportRootCandidate | undefined;

  while (queue.length > 0 && visited < resolvedOptions.visitLimit && matches < resolvedOptions.matchLimit) {
    const current = queue.shift();
    /* c8 ignore next 3 - defensive: while condition ensures queue.length > 0 before shift */
    if (!current) {
      break;
    }

    visited += 1;

    const resolvedResult = tryResolveLibraryAt(current.dir);
    /* c8 ignore next 3 - defensive: tryResolveLibraryAt only fails if FileTree implementation is broken */
    if (resolvedResult.isFailure()) {
      return Failure.with(resolvedResult.message);
    }

    const resolved = resolvedResult.value;
    if (resolved) {
      matches += 1;
      if (!selected) {
        selected = resolved;
      }
      continue;
    }

    if (current.depth >= resolvedOptions.maxDepth) {
      continue;
    }

    const childrenResult = current.dir.getChildren();
    /* c8 ignore next 3 - defensive: would only fail if FileTree implementation is broken */
    if (childrenResult.isFailure()) {
      return Failure.with(`Failed to enumerate directory '${current.dir.name}': ${childrenResult.message}`);
    }

    for (const child of childrenResult.value) {
      if (child.type === 'directory') {
        queue.push({ dir: child, depth: current.depth + 1 });
      }
    }
  }

  if (!selected) {
    return Failure.with(
      `Unable to resolve library root (expected data/ with sub-library directories like ingredients/, fillings/, etc.)`
    );
  }

  return Success.with({
    root: selected.root,
    kind: selected.kind,
    visited,
    matches
  });
}
