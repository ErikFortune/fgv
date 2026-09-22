/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import { DetailedResult, Result, failWithDetail, succeed } from '@fgv/ts-utils';

/**
 * A fault to inject into the next matching atomic write.
 *
 * `before` fails without touching the destination — what a pre-rename failure looks like. `after`
 * performs the real write first and then reports failure — what a failed directory flush looks
 * like: the new record is already what a reader sees.
 */
export interface IInjectedFault {
  readonly name: string | RegExp;
  readonly when: 'before' | 'after';
  readonly visibility: FileTree.IAtomicWriteFailure['visibility'];
  readonly stage?: FileTree.IAtomicWriteFailure['stage'];
  /** Let this many matching writes through before the fault fires. */
  skip?: number;
}

/**
 * A directory item that delegates to a real one and fails chosen atomic writes.
 *
 * @remarks
 * Every operation that is not faulted goes to the real store, so what a test asserts afterwards
 * is what a real reader of that store sees. This harness exists only to exercise the
 * repository's classification of each visibility; the process-crash claims rest on the real
 * Node subprocess suite, never on this.
 */
export class FaultyRoot implements FileTree.IAtomicFileTreeDirectoryItem {
  public readonly type: 'directory' = 'directory';
  public readonly faults: IInjectedFault[] = [];
  public readonly writes: string[] = [];
  public failChildren: boolean = false;
  public capabilities: FileTree.IAtomicWriteCapabilities | undefined;

  public readonly inner: FileTree.IAtomicFileTreeDirectoryItem;

  public constructor(inner: FileTree.IAtomicFileTreeDirectoryItem) {
    this.inner = inner;
  }

  /** Forgets the writes recorded so far. */
  public clearWrites(): void {
    this.writes.splice(0, this.writes.length);
  }

  public get absolutePath(): string {
    return this.inner.absolutePath;
  }

  public get name(): string {
    return this.inner.name;
  }

  public getChildren(): Result<ReadonlyArray<FileTree.FileTreeItem>> {
    if (this.failChildren) {
      return failWithDetail('injected: cannot list', undefined);
    }
    return this.inner.getChildren();
  }

  public createChildFile(name: string, contents: string): Result<FileTree.IMutableFileTreeFileItem> {
    return this.inner.createChildFile(name, contents);
  }

  public createChildDirectory(name: string): Result<FileTree.IMutableFileTreeDirectoryItem> {
    return this.inner.createChildDirectory(name);
  }

  public deleteChild(name: string, options?: FileTree.IDeleteChildOptions): Result<boolean> {
    return this.inner.deleteChild(name, options);
  }

  public delete(): Result<boolean> {
    return this.inner.delete();
  }

  public getAtomicWriteCapabilities(): Result<FileTree.IAtomicWriteCapabilities> {
    return this.capabilities !== undefined
      ? succeed(this.capabilities)
      : this.inner.getAtomicWriteCapabilities();
  }

  public writeChildAtomically(
    name: string,
    contents: string,
    options: FileTree.IAtomicWriteOptions
  ): DetailedResult<FileTree.IAtomicWriteReceipt, FileTree.IAtomicWriteFailure> {
    this.writes.push(name);
    const index: number = this.faults.findIndex((f) =>
      typeof f.name === 'string' ? f.name === name : f.name.test(name)
    );
    if (index >= 0 && (this.faults[index].skip ?? 0) > 0) {
      this.faults[index].skip = (this.faults[index].skip ?? 0) - 1;
      return this.inner.writeChildAtomically(name, contents, options);
    }
    if (index < 0) {
      return this.inner.writeChildAtomically(name, contents, options);
    }
    const [fault] = this.faults.splice(index, 1);
    if (fault.when === 'after') {
      this.inner.writeChildAtomically(name, contents, options).orThrow();
    }
    return failWithDetail(`injected ${fault.when}-write failure on ${name}`, {
      code: 'io',
      stage: fault.stage ?? (fault.when === 'after' ? 'directory-flush' : 'file-flush'),
      visibility: fault.visibility
    });
  }

  public cleanupAtomicTemporaries(): Result<ReadonlyArray<string>> {
    return this.inner.cleanupAtomicTemporaries();
  }
}
