/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import { Result, fail, succeed } from '@fgv/ts-utils';

/**
 * The in-process single-writer guard for `FileTreeMemoryStore` roots.
 *
 * @remarks
 * This catches an accidental second store over the same root in one process. It is not fencing
 * and claims nothing across processes: one writer per root across processes is a host
 * deployment requirement.
 *
 * A root is held by its directory item always. It is also held by its absolute path unless it is
 * session-only — its strongest atomic guarantee is exactly `'session'`, which today means an
 * in-memory tree. A disk-backed root's path names the same bytes whichever item reaches it, while
 * two in-memory trees both rooted at `/` are different roots, and an in-memory tree is never the
 * same root as a path-held one. A root that offers no atomic write says nothing about what backs
 * it, so it is held by path: refusing a duplicate is the answer that cannot lose a write.
 *
 * Nothing is registered at import; the tables fill only as stores open, and a disposed store
 * releases its entries.
 * @internal
 */
const itemOwners: WeakSet<FileTree.IFileTreeDirectoryItem> = new WeakSet<FileTree.IFileTreeDirectoryItem>();
const pathOwners: Set<string> = new Set<string>();

/**
 * A held claim on a root. `release` is idempotent.
 * @internal
 */
export interface IRootOwnership {
  readonly released: boolean;
  release(): void;
}

/**
 * Claims exclusive in-process ownership of a store root.
 * @param root - The store's root directory.
 * @param pathKeyed - Whether the root is also held by its absolute path.
 * @internal
 */
export function acquireStoreRoot(
  root: FileTree.IFileTreeDirectoryItem,
  pathKeyed: boolean
): Result<IRootOwnership> {
  const path: string = root.absolutePath;
  if (itemOwners.has(root) || (pathKeyed && pathOwners.has(path))) {
    return fail(
      `memory store: root '${path}' is already open in this process; dispose the other store first`
    );
  }
  itemOwners.add(root);
  if (pathKeyed) {
    pathOwners.add(path);
  }
  let released: boolean = false;
  return succeed({
    get released(): boolean {
      return released;
    },
    release: (): void => {
      if (released) {
        return;
      }
      released = true;
      itemOwners.delete(root);
      if (pathKeyed) {
        pathOwners.delete(path);
      }
    }
  });
}
