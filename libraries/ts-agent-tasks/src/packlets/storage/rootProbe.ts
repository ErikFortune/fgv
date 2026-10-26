/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import { Result, fail, succeed } from '@fgv/ts-utils';
import { TaskRepositoryMode } from './model';

/**
 * What a root offers a task repository, as {@link probeTaskRepositoryRoot} finds it.
 * @public
 */
export interface ITaskRepositoryRootProbe {
  /**
   * The atomic write guarantees a repository can rely on at this root: the ones the root lists,
   * provided it can replace a file atomically at all. Empty for a root without the atomic
   * capability, and for one that lists guarantees but cannot replace atomically.
   */
  readonly guarantees: ReadonlyArray<FileTree.AtomicWriteGuarantee>;
  /**
   * The strongest repository mode the root supports — `{ durable: 'process-crash' }`, else
   * `'session'` — or `undefined` when it supports none.
   */
  readonly mode: TaskRepositoryMode | undefined;
  /** Why the root supports no mode, when it supports none. */
  readonly reason?: string;
}

/**
 * Asks a root which repository modes it can hold — the same question
 * `FileTreeTaskRepository.open` and `initialize` ask before they touch anything.
 *
 * @remarks
 * The capability inquiry is authoritative, not the guard: `FileTree.isAtomicDirectoryItem` only says
 * the methods exist. A root qualifies for a guarantee only when it reports `atomicReplace` **and**
 * lists that guarantee; a root that lists guarantees without `atomicReplace` qualifies for nothing.
 * There is one definition of this, and the repository's own binding uses it, so a host deciding a
 * mode in advance cannot reach a different answer than the repository will.
 *
 * Fails for a root that is not a directory, and when the root cannot answer the inquiry. A root
 * without the capability succeeds with no mode and a `reason`.
 * @public
 */
export function probeTaskRepositoryRoot(root: FileTree.FileTreeItem): Result<ITaskRepositoryRootProbe> {
  if (root.type !== 'directory') {
    return fail(`${root.absolutePath}: a repository root must be a directory`);
  }
  if (!FileTree.isAtomicDirectoryItem(root)) {
    return succeed({
      guarantees: [],
      mode: undefined,
      reason: `${root.absolutePath}: the root does not offer atomic writes`
    });
  }
  return root.getAtomicWriteCapabilities().onSuccess((capabilities) => {
    const guarantees: ReadonlyArray<FileTree.AtomicWriteGuarantee> = capabilities.atomicReplace
      ? [...capabilities.guarantees]
      : [];
    if (guarantees.includes('process-crash')) {
      return succeed<ITaskRepositoryRootProbe>({ guarantees, mode: { durable: 'process-crash' } });
    }
    if (guarantees.includes('session')) {
      return succeed<ITaskRepositoryRootProbe>({ guarantees, mode: 'session' });
    }
    return succeed<ITaskRepositoryRootProbe>({
      guarantees,
      mode: undefined,
      reason: `${root.absolutePath}: the root cannot honor a 'session' or 'process-crash' atomic write (it offers [${guarantees.join(
        ', '
      )}])`
    });
  });
}
