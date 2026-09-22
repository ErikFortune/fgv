/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import { Result, fail, succeed } from '@fgv/ts-utils';

/**
 * The in-process root-owner guard (design §8.5).
 *
 * @remarks
 * This catches an *accidental* second repository instance over the same root in one process.
 * It is not fencing and claims nothing across processes: exclusivity between processes is a
 * host deployment requirement, and opening one root from competing processes is unsupported.
 *
 * A durable root is identified by its absolute path, which is process-global for the Node
 * store. A session root is identified by the directory item itself: two in-memory trees both
 * rooted at `/` are different roots, and a path key would wrongly treat them as one.
 *
 * Nothing is registered at import; the tables fill only as repositories open, and a closed
 * repository releases its entry.
 * @internal
 */
const durableOwners: Set<string> = new Set<string>();
const sessionOwners: WeakSet<FileTree.IFileTreeDirectoryItem> =
  new WeakSet<FileTree.IFileTreeDirectoryItem>();

/**
 * A held claim on a root. `release` is idempotent.
 * @internal
 */
export interface IRootOwnership {
  release(): void;
}

/**
 * Claims exclusive in-process ownership of a root.
 * @internal
 */
export function acquireRoot(root: FileTree.IFileTreeDirectoryItem, durable: boolean): Result<IRootOwnership> {
  if (durable) {
    const key: string = root.absolutePath;
    if (durableOwners.has(key)) {
      return fail(`${key}: this root is already open in this process`);
    }
    durableOwners.add(key);
    return succeed({
      release: (): void => {
        durableOwners.delete(key);
      }
    });
  }
  if (sessionOwners.has(root)) {
    return fail(`${root.absolutePath}: this root is already open in this process`);
  }
  sessionOwners.add(root);
  return succeed({
    release: (): void => {
      sessionOwners.delete(root);
    }
  });
}
