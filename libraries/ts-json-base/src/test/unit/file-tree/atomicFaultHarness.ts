/*
 * Copyright (c) 2025 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { DetailedResult, failWithDetail, succeedWithDetail } from '@fgv/ts-utils';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  AtomicFsErrno,
  IAtomicFsOperations,
  IAtomicFsStats,
  defaultAtomicFsOperations
} from '../../../packlets/file-tree/atomicFsOperations';

/**
 * Fault injection for the atomic write protocol.
 *
 * @remarks
 * This delegates to the **real** filesystem rather than simulating one. That is
 * the point: when a rename failure is injected, everything the protocol did
 * before the rename actually happened on disk, so a test can assert what a real
 * reader would see at the destination and whether a real orphan was left
 * behind. A fully fake filesystem would only prove that the protocol calls the
 * functions the test expects it to call.
 */

/**
 * Names of the seam operations a fault can be attached to.
 */
export type AtomicFsOperationName =
  | 'openExclusive'
  | 'openDirectory'
  | 'write'
  | 'fsync'
  | 'fchmod'
  | 'close'
  | 'rename'
  | 'unlink'
  | 'lstat'
  | 'readDirectory'
  | 'filesystemType';

/**
 * A failure to inject in place of one real operation.
 */
export interface IInjectedFault {
  /**
   * Which operation to fail.
   */
  readonly op: AtomicFsOperationName;

  /**
   * The `errno` the failure reports. Omit it to inject a failure that carries
   * no `errno` at all, which is how the conservative default is exercised.
   */
  readonly errno?: AtomicFsErrno;

  /**
   * Which call of that operation to fail, 1-based. Defaults to the first.
   */
  readonly occurrence?: number;

  /**
   * The failure message. Defaults to a recognizable injected-failure message.
   */
  readonly message?: string;
}

/**
 * An {@link IAtomicFsOperations} that passes everything through to the real
 * filesystem except where a test has asked it not to.
 */
export class FaultingFsOperations implements IAtomicFsOperations {
  /**
   * Every guarded operation, in the order the protocol invoked it. Lets a test
   * assert on what the protocol did *not* do — that it never unlinked the
   * destination, that it did not close a descriptor twice.
   */
  public readonly calls: AtomicFsOperationName[] = [];

  private readonly _base: IAtomicFsOperations;
  private readonly _faults: IInjectedFault[] = [];
  private readonly _counts: Map<AtomicFsOperationName, number> = new Map();
  private readonly _tokens: string[] = [];
  private _writeChunkSize: number | undefined;
  private _writeReportsNoProgress: boolean = false;

  public constructor(base: IAtomicFsOperations = defaultAtomicFsOperations) {
    this._base = base;
  }

  /**
   * How many times an operation has been invoked so far.
   */
  public callCount(op: AtomicFsOperationName): number {
    return this._counts.get(op) ?? 0;
  }

  /**
   * Arranges for one call of one operation to fail.
   */
  public failAt(fault: IInjectedFault): this {
    this._faults.push(fault);
    return this;
  }

  /**
   * Caps each `write` at `size` bytes, so the protocol's short-write loop runs
   * for real rather than being skipped because one `writeSync` took everything.
   */
  public chunkWritesTo(size: number): this {
    this._writeChunkSize = size;
    return this;
  }

  /**
   * Makes `write` report zero bytes written without writing any.
   */
  public reportNoWriteProgress(): this {
    this._writeReportsNoProgress = true;
    return this;
  }

  /**
   * Supplies the next temporary-name tokens in order, so a collision with an
   * existing temporary can be forced. Once the queue is empty the real random
   * token generator takes over again.
   */
  public queueTokens(...tokens: string[]): this {
    this._tokens.push(...tokens);
    return this;
  }

  public openExclusive(filePath: string, permissions: number): DetailedResult<number, AtomicFsErrno> {
    return this._guard('openExclusive', () => this._base.openExclusive(filePath, permissions));
  }

  public openDirectory(directoryPath: string): DetailedResult<number, AtomicFsErrno> {
    return this._guard('openDirectory', () => this._base.openDirectory(directoryPath));
  }

  public write(fd: number, bytes: Uint8Array, offset: number): DetailedResult<number, AtomicFsErrno> {
    return this._guard('write', () => {
      if (this._writeReportsNoProgress) {
        return succeedWithDetail(0);
      }
      if (this._writeChunkSize !== undefined) {
        const end = Math.min(bytes.length, offset + this._writeChunkSize);
        return this._base.write(fd, bytes.subarray(0, end), offset);
      }
      return this._base.write(fd, bytes, offset);
    });
  }

  public fsync(fd: number): DetailedResult<number, AtomicFsErrno> {
    return this._guard('fsync', () => this._base.fsync(fd));
  }

  public fchmod(fd: number, permissions: number): DetailedResult<number, AtomicFsErrno> {
    return this._guard('fchmod', () => this._base.fchmod(fd, permissions));
  }

  public close(fd: number): DetailedResult<number, AtomicFsErrno> {
    return this._guard('close', () => this._base.close(fd));
  }

  public rename(from: string, to: string): DetailedResult<string, AtomicFsErrno> {
    return this._guard('rename', () => this._base.rename(from, to));
  }

  public unlink(filePath: string): DetailedResult<string, AtomicFsErrno> {
    return this._guard('unlink', () => this._base.unlink(filePath));
  }

  public lstat(itemPath: string): DetailedResult<IAtomicFsStats, AtomicFsErrno> {
    return this._guard('lstat', () => this._base.lstat(itemPath));
  }

  public readDirectory(directoryPath: string): DetailedResult<ReadonlyArray<string>, AtomicFsErrno> {
    return this._guard('readDirectory', () => this._base.readDirectory(directoryPath));
  }

  public filesystemType(itemPath: string): DetailedResult<number, AtomicFsErrno> {
    return this._guard('filesystemType', () => this._base.filesystemType(itemPath));
  }

  public generateTemporaryToken(): string {
    return this._tokens.shift() ?? this._base.generateTemporaryToken();
  }

  private _guard<T>(
    op: AtomicFsOperationName,
    run: () => DetailedResult<T, AtomicFsErrno>
  ): DetailedResult<T, AtomicFsErrno> {
    const occurrence = this.callCount(op) + 1;
    this._counts.set(op, occurrence);
    this.calls.push(op);

    const fault = this._faults.find((f) => f.op === op && (f.occurrence ?? 1) === occurrence);
    if (fault === undefined) {
      return run();
    }
    const message = fault.message ?? `injected ${op} failure`;
    return fault.errno === undefined
      ? // A failure carrying no errno at all. `undefined` is not assignable to
        // the detail type, so the cast says explicitly that this is the shape
        // being tested rather than an accident.
        failWithDetail<T, AtomicFsErrno>(message, undefined as unknown as AtomicFsErrno)
      : failWithDetail<T, AtomicFsErrno>(message, fault.errno);
  }
}
