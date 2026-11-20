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
 * One table covers both modes, so a root cannot be open once as a session repository and once
 * as a durable one. A root is held by its directory item always, and by its absolute path while
 * any durable repository holds it: a durable root's path is process-global for the Node store,
 * so a second item for the same path is the same root. Session roots are not refused by path
 * alone — two in-memory trees both rooted at `/` are different roots, and FileTree does not say
 * which roots are disk-backed — so two session repositories over the same real directory through
 * two different items are not detected. Distinguishing them needs a FileTree capability that
 * says what backs a root.
 *
 * Nothing is registered at import; the tables fill only as repositories open, and a closed
 * repository releases its entry.
 * @internal
 */
const itemOwners: WeakSet<FileTree.IFileTreeDirectoryItem> = new WeakSet<FileTree.IFileTreeDirectoryItem>();
const durablePaths: Set<string> = new Set<string>();
const sessionPaths: Map<string, number> = new Map<string, number>();

/**
 * A held claim on a root. Its holder releases it exactly once: a repository's `close` and a
 * recovery handle's `close` are both idempotent themselves.
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
  const path: string = root.absolutePath;
  const sessions: number = sessionPaths.get(path) ?? 0;
  if (itemOwners.has(root) || durablePaths.has(path) || (durable && sessions > 0)) {
    return fail(`${path}: this root is already open in this process`);
  }
  itemOwners.add(root);
  if (durable) {
    durablePaths.add(path);
  } else {
    sessionPaths.set(path, sessions + 1);
  }
  return succeed({
    release: (): void => {
      itemOwners.delete(root);
      if (durable) {
        durablePaths.delete(path);
        return;
      }
      const remaining: number = sessionPaths.get(path)! - 1;
      if (remaining > 0) {
        sessionPaths.set(path, remaining);
      } else {
        sessionPaths.delete(path);
      }
    }
  });
}
