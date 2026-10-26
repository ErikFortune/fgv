/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';

/**
 * The in-process single-writer guard for `FileTreeMemoryStore` roots.
 *
 * @remarks
 * This catches an accidental second store over the same storage in one process. It is not
 * fencing and claims nothing across processes: one writer per root across processes is a host
 * deployment requirement.
 *
 * **What it detects.** A root is identified by its storage identity
 * (`IFileTreeDirectoryItem.getStorageIdentity`): the accessors object that serves it and its
 * absolute path, plus — for a filesystem root — its real path with every symbolic link resolved.
 * Two claims conflict when they share accessors and their paths overlap, or when both carry a real
 * path and those overlap. So the guard detects **the same accessor instance, or the same real
 * filesystem directory**: two `getDirectory('/')` calls on one tree, two `FsTree` instances over
 * one directory, a symlink alias, `/tmp` versus `/private/tmp`. Two separate accessor objects over
 * one non-filesystem backing store (two `localStorage` accessors on one key) carry no real path and
 * are **not detectable**. A root item that cannot say what it names is identified by the item
 * itself.
 *
 * The real path is captured when the claim is taken: retargeting a symbolic link after the open is
 * not tracked. On a case-insensitive filesystem the real path is the operating system's canonical
 * spelling (`fs.realpathSync.native`); where the platform does not canonicalize case, two case
 * variants of one directory (APFS, NTFS) are not detected.
 *
 * **Overlap, not just equality.** A root and a root nested inside it conflict: the outer store's
 * open walk reads every directory beneath it, so it would index and write the inner store's
 * records — two writers over the same files.
 *
 * Nothing is registered at import; the table fills only as stores open, and a disposed store
 * releases its claim.
 * @internal
 */

interface IClaim {
  readonly owner: object;
  readonly path: string;
  readonly realPath?: string;
}

const claims: Set<IClaim> = new Set<IClaim>();

/**
 * The separator a path uses: `\\` for a path that contains only that (a Windows filesystem
 * path), `/` otherwise. A `\\` inside a POSIX name is a character, not a separator.
 */
function separatorOf(path: string): string {
  return path.includes('\\') && !path.includes('/') ? '\\' : '/';
}

/** `true` when `inner` is `outer` or lies beneath it. */
function within(outer: string, inner: string): boolean {
  if (inner === outer) {
    return true;
  }
  const sep: string = separatorOf(outer);
  return inner.startsWith(outer.endsWith(sep) ? outer : `${outer}${sep}`);
}

function overlaps(a: string, b: string): boolean {
  return within(a, b) || within(b, a);
}

function conflicts(a: IClaim, b: IClaim): boolean {
  if (a.owner === b.owner && overlaps(a.path, b.path)) {
    return true;
  }
  return a.realPath !== undefined && b.realPath !== undefined && overlaps(a.realPath, b.realPath);
}

/**
 * A held claim on a root. `release` is idempotent.
 * @internal
 */
export interface IRootOwnership {
  readonly released: boolean;
  release(): void;
}

function claimRoot(
  root: FileTree.IFileTreeDirectoryItem,
  identity: FileTree.IFileTreeStorageIdentity | undefined
): Result<IRootOwnership> {
  const claim: IClaim = {
    owner: identity?.accessors ?? root,
    path: identity?.path ?? root.absolutePath,
    ...(identity?.realPath !== undefined ? { realPath: identity.realPath } : {})
  };
  const held: IClaim | undefined = [...claims].find((other) => conflicts(claim, other));
  if (held !== undefined) {
    const named: string = held.realPath ?? held.path;
    return fail(
      `memory store: root '${root.absolutePath}' overlaps root '${named}', which is already open in this process; dispose that store first`
    );
  }
  claims.add(claim);
  let released: boolean = false;
  return succeed({
    get released(): boolean {
      return released;
    },
    release: (): void => {
      released = true;
      claims.delete(claim);
    }
  });
}

/**
 * Claims exclusive in-process ownership of a store root.
 * @param root - The store's root directory.
 * @internal
 */
export function acquireStoreRoot(root: FileTree.IFileTreeDirectoryItem): Result<IRootOwnership> {
  return captureResult(() => root.getStorageIdentity?.())
    .withErrorFormat((m) => `memory store: cannot identify root '${root.absolutePath}': ${m}`)
    .onSuccess((identity) => claimRoot(root, identity));
}
