/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import { DetailedResult, Result, fail, succeed } from '@fgv/ts-utils';

/**
 * The one place the storage packlet touches a `FileTree`.
 *
 * @remarks
 * Everything the repository reads or writes goes through here, and everything here goes
 * through the injected directory item — no native path, no `node:fs`, no knowledge of which
 * accessor is behind the root. The in-memory and Node "adapters" are simply the two FileTree
 * accessors that implement the atomic capability.
 *
 * Reads are strict UTF-8 when `strictText` is set (durable mode): a record whose bytes are not
 * valid UTF-8 is corruption, never silently decoded with replacement characters. A session
 * store may hold already-decoded strings, which cannot answer that question, so session mode
 * reads raw text (design §8.1).
 * @internal
 */
export class RecordStore {
  public readonly root: FileTree.IAtomicFileTreeDirectoryItem;
  public readonly guarantee: FileTree.AtomicWriteGuarantee;
  private readonly _strictText: boolean;
  private _files: Map<string, FileTree.IFileTreeFileItem>;

  private constructor(
    root: FileTree.IAtomicFileTreeDirectoryItem,
    guarantee: FileTree.AtomicWriteGuarantee,
    strictText: boolean
  ) {
    this.root = root;
    this.guarantee = guarantee;
    this._strictText = strictText;
    this._files = new Map<string, FileTree.IFileTreeFileItem>();
  }

  /**
   * Binds a store to a root, refusing a root that cannot honor `guarantee`.
   *
   * @remarks
   * The capability inquiry is authoritative, not the guard: the guard only says the methods
   * exist. A durable request against a root that does not list `'process-crash'` fails here,
   * before anything is read or written.
   */
  public static create(
    root: FileTree.FileTreeItem,
    guarantee: FileTree.AtomicWriteGuarantee
  ): Result<RecordStore> {
    if (root.type !== 'directory') {
      return fail(`${root.absolutePath}: a repository root must be a directory`);
    }
    if (!FileTree.isAtomicDirectoryItem(root)) {
      return fail(`${root.absolutePath}: the root does not offer atomic writes`);
    }
    return root.getAtomicWriteCapabilities().onSuccess((capabilities) => {
      if (!capabilities.atomicReplace || !capabilities.guarantees.includes(guarantee)) {
        return fail<RecordStore>(
          `${root.absolutePath}: the root cannot honor a '${guarantee}' atomic write ` +
            `(it offers [${capabilities.guarantees.join(', ')}]); a durable repository is refused ` +
            `rather than degraded to a weaker one`
        );
      }
      return succeed(new RecordStore(root, guarantee, guarantee !== 'session'));
    });
  }

  /**
   * Re-lists the root, returning the name of every child in it — directories included, so
   * that an "empty root" check and an unexpected-content report see everything. Only files
   * are readable.
   */
  public list(): Result<ReadonlyArray<string>> {
    return this.root.getChildren().onSuccess((children) => {
      const files: Map<string, FileTree.IFileTreeFileItem> = new Map<string, FileTree.IFileTreeFileItem>();
      for (const child of children) {
        if (child.type === 'file') {
          files.set(child.name, child);
        }
      }
      this._files = files;
      return succeed(children.map((child) => child.name));
    });
  }

  /** Reads a file's text. Fails if the last listing saw no file of that name. */
  public read(name: string): Result<string> {
    const file: FileTree.IFileTreeFileItem | undefined = this._files.get(name);
    if (file === undefined) {
      return fail(`${name}: not present`);
    }
    if (!this._strictText) {
      return file.getRawContents();
    }
    if (!FileTree.isStrictTextFileItem(file)) {
      return fail(`${name}: the store cannot decode strictly`);
    }
    return file.getTextStrict().withErrorFormat((message) => `${name}: not valid UTF-8: ${message}`);
  }

  /** Whether the last listing saw a file of this name. */
  public has(name: string): boolean {
    return this._files.has(name);
  }

  /**
   * Atomically writes one record at the store's guarantee.
   *
   * @remarks
   * A newly created name is not readable through this store until the caller re-lists,
   * because a directory item offers no child-by-name lookup. Creation is already the
   * O(identities) operation in this design, so the repository re-lists after it.
   */
  public write(
    name: string,
    text: string
  ): DetailedResult<FileTree.IAtomicWriteReceipt, FileTree.IAtomicWriteFailure> {
    return this.root.writeChildAtomically(name, text, { guarantee: this.guarantee });
  }

  /** Removes working files left by interrupted atomic writes. Valid only at exclusive open. */
  public cleanup(): Result<ReadonlyArray<string>> {
    return this.root.cleanupAtomicTemporaries();
  }
}
