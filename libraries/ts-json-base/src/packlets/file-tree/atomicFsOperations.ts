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

import crypto from 'crypto';
import fs from 'fs';
import { DetailedResult, failWithDetail, succeedWithDetail } from '@fgv/ts-utils';

/**
 * Internal typed seam over the Node filesystem operations the atomic write
 * protocol depends on.
 *
 * @remarks
 * This module is deliberately **not** re-exported from either FileTree barrel.
 * It exists so the protocol's fault behavior can be exercised by substituting a
 * failing implementation in tests, without publishing a fault-injection knob on
 * the package's API surface — a public testing knob is an API that cannot be
 * retracted.
 *
 * Every operation is `Result`-valued with the underlying `errno` carried as the
 * failure detail, because the protocol's `visibility` classification depends on
 * *which* error a rename reported, not merely that it failed.
 *
 * Operations that have no natural return value answer with the handle or path
 * they acted on, so the protocol can chain them and so `Result<void>` — an
 * anti-pattern in this repo — never appears.
 */

/**
 * The `errno` reported by a failed filesystem operation (for example `'ENOENT'`),
 * or `'UNKNOWN'` when the thrown value carried no string `code`.
 */
export type AtomicFsErrno = string;

/**
 * `'UNKNOWN'` stands in for an error that carried no `errno`. It is deliberately
 * not a real `errno` spelling so it can never collide with one.
 */
export const UNKNOWN_ERRNO: AtomicFsErrno = 'UNKNOWN';

/**
 * The subset of `lstat` this protocol needs.
 *
 * @remarks
 * `lstat`, never `stat`: a symlink at the destination must be *seen* as a
 * symlink and rejected, not silently followed to its target.
 */
export interface IAtomicFsStats {
  readonly isFile: boolean;
  readonly isDirectory: boolean;
  readonly isSymbolicLink: boolean;

  /**
   * The permission bits (`mode & 0o7777`), used to carry an existing
   * destination's permissions onto its replacement.
   */
  readonly permissions: number;
}

/**
 * The filesystem operations the atomic write protocol performs, as a typed
 * seam. See the module remarks for why this is internal.
 */
export interface IAtomicFsOperations {
  /**
   * Creates and opens a file, failing if it already exists (`O_CREAT | O_EXCL`).
   * @returns `DetailedSuccess` with the open file descriptor.
   */
  openExclusive(filePath: string, permissions: number): DetailedResult<number, AtomicFsErrno>;

  /**
   * Opens an existing directory for a later {@link IAtomicFsOperations.fsync | fsync}.
   * @returns `DetailedSuccess` with the open file descriptor.
   */
  openDirectory(directoryPath: string): DetailedResult<number, AtomicFsErrno>;

  /**
   * Writes a slice of `bytes` starting at `offset`.
   * @returns `DetailedSuccess` with the number of bytes actually written, which
   * may be fewer than requested — the caller is responsible for looping.
   */
  write(fd: number, bytes: Uint8Array, offset: number): DetailedResult<number, AtomicFsErrno>;

  /**
   * Flushes a file's or directory's contents and metadata to the storage device.
   * @returns `DetailedSuccess` with the descriptor that was flushed.
   */
  fsync(fd: number): DetailedResult<number, AtomicFsErrno>;

  /**
   * Sets the permission bits of an open file.
   * @returns `DetailedSuccess` with the descriptor that was changed.
   */
  fchmod(fd: number, permissions: number): DetailedResult<number, AtomicFsErrno>;

  /**
   * Closes an open descriptor.
   * @returns `DetailedSuccess` with the descriptor that was closed.
   */
  close(fd: number): DetailedResult<number, AtomicFsErrno>;

  /**
   * Renames `from` over `to`. Both must be in the same directory for this
   * protocol; the call is the visibility linearization point.
   * @returns `DetailedSuccess` with the destination path.
   */
  rename(from: string, to: string): DetailedResult<string, AtomicFsErrno>;

  /**
   * Removes a file.
   * @returns `DetailedSuccess` with the path that was removed.
   */
  unlink(filePath: string): DetailedResult<string, AtomicFsErrno>;

  /**
   * Reports on a path without following a final symbolic link.
   */
  lstat(itemPath: string): DetailedResult<IAtomicFsStats, AtomicFsErrno>;

  /**
   * Lists the names of a directory's entries.
   */
  readDirectory(directoryPath: string): DetailedResult<ReadonlyArray<string>, AtomicFsErrno>;

  /**
   * Reports the filesystem type magic number for the filesystem holding a path.
   *
   * @remarks
   * Deliberately the non-`bigint` form: the magic numbers this protocol
   * recognizes are all well inside the safe-integer range, and a `bigint` here
   * would leak into a `number`-typed comparison.
   */
  filesystemType(itemPath: string): DetailedResult<number, AtomicFsErrno>;

  /**
   * Produces the random component of a reserved temporary file name.
   *
   * @remarks
   * Part of the seam because it is the protocol's other source of
   * nondeterminism: a test that needs the exclusive-create collision path needs
   * to control it.
   */
  generateTemporaryToken(): string;
}

/**
 * Extracts a filesystem error's `errno` without casting.
 *
 * @remarks
 * Deliberately **not** `error instanceof Error`. The errors these operations
 * catch are constructed inside Node's own realm, and an `instanceof` check is
 * against whichever `Error` constructor the *calling* realm holds. Wherever the
 * two differ — a `vm` context, a worker thread, the sandbox a test runner
 * evaluates modules in — `instanceof` is `false` for a perfectly ordinary
 * `ENOENT`, and every `errno` this protocol classifies on silently becomes
 * `'UNKNOWN'`. A rename failure would then be reported as `'unknown'`
 * visibility when it was provably `'unchanged'`.
 *
 * Reading the properties instead is realm-independent and needs no cast:
 * `'code' in error` narrows to `object & Record<'code', unknown>`, and the
 * `typeof` check narrows that to `string`.
 */
function errnoOf(error: unknown): AtomicFsErrno {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return UNKNOWN_ERRNO;
}

/**
 * Extracts an error's message, realm-independently for the same reason.
 */
function messageOf(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return String(error);
}

/**
 * Runs a throwing filesystem call and converts its outcome into a
 * `DetailedResult` carrying the `errno`.
 *
 * @remarks
 * Part of this internal module's surface rather than a private helper: it is
 * the seam's error-conversion primitive, so a substitute implementation that
 * wraps real calls uses it too, and its handling of a thrown value that is not
 * an `Error` is testable without a contrived filesystem failure.
 */
export function captureFsResult<T>(operation: () => T): DetailedResult<T, AtomicFsErrno> {
  try {
    return succeedWithDetail(operation());
  } catch (error) {
    return failWithDetail(messageOf(error), errnoOf(error));
  }
}

/**
 * The real Node filesystem, as the protocol sees it.
 */
export const defaultAtomicFsOperations: IAtomicFsOperations = {
  openExclusive(filePath: string, permissions: number): DetailedResult<number, AtomicFsErrno> {
    // 'wx' is O_WRONLY | O_CREAT | O_EXCL: the create fails rather than
    // truncating anything that is already there.
    return captureFsResult(() => fs.openSync(filePath, 'wx', permissions));
  },

  openDirectory(directoryPath: string): DetailedResult<number, AtomicFsErrno> {
    return captureFsResult(() => fs.openSync(directoryPath, 'r'));
  },

  write(fd: number, bytes: Uint8Array, offset: number): DetailedResult<number, AtomicFsErrno> {
    return captureFsResult(() => fs.writeSync(fd, bytes, offset, bytes.length - offset));
  },

  fsync(fd: number): DetailedResult<number, AtomicFsErrno> {
    return captureFsResult(() => {
      fs.fsyncSync(fd);
      return fd;
    });
  },

  fchmod(fd: number, permissions: number): DetailedResult<number, AtomicFsErrno> {
    return captureFsResult(() => {
      fs.fchmodSync(fd, permissions);
      return fd;
    });
  },

  close(fd: number): DetailedResult<number, AtomicFsErrno> {
    return captureFsResult(() => {
      fs.closeSync(fd);
      return fd;
    });
  },

  rename(from: string, to: string): DetailedResult<string, AtomicFsErrno> {
    return captureFsResult(() => {
      fs.renameSync(from, to);
      return to;
    });
  },

  unlink(filePath: string): DetailedResult<string, AtomicFsErrno> {
    return captureFsResult(() => {
      fs.unlinkSync(filePath);
      return filePath;
    });
  },

  lstat(itemPath: string): DetailedResult<IAtomicFsStats, AtomicFsErrno> {
    return captureFsResult(() => {
      const stats = fs.lstatSync(itemPath);
      return {
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        isSymbolicLink: stats.isSymbolicLink(),
        // The low twelve bits of `mode` are the permission and set-id bits.
        // `% 0o10000` extracts them exactly as `& 0o7777` would, without the
        // bitwise operator this repo's lint configuration rejects.
        permissions: stats.mode % 0o10000
      };
    });
  },

  readDirectory(directoryPath: string): DetailedResult<ReadonlyArray<string>, AtomicFsErrno> {
    return captureFsResult(() => fs.readdirSync(directoryPath));
  },

  filesystemType(itemPath: string): DetailedResult<number, AtomicFsErrno> {
    return captureFsResult(() => fs.statfsSync(itemPath).type);
  },

  generateTemporaryToken(): string {
    return crypto.randomBytes(12).toString('hex');
  }
};
