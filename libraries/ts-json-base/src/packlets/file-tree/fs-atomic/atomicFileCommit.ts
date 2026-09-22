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

import {
  DetailedResult,
  MessageAggregator,
  Result,
  fail,
  failWithDetail,
  mapResults,
  succeed,
  succeedWithDetail
} from '@fgv/ts-utils';
import { AtomicWriteGuarantee, IAtomicWriteFailure, IAtomicWriteReceipt } from '../fileTreeAccessors';
import { AtomicFsErrno, IAtomicFsOperations, UNKNOWN_ERRNO } from './atomicFsOperations';

/**
 * The Node atomic write protocol from the agent-tasks development design §8.2,
 * expressed over the {@link IAtomicFsOperations} seam.
 *
 * @remarks
 * Internal: not re-exported from either FileTree barrel. `FsFileTreeAccessors`
 * performs the policy checks it owns (mutability, requested guarantee, root
 * confinement) and delegates the ordering protocol here.
 *
 * The ordering is the whole point, so it is stated once, here:
 *
 * 1. Inspect the destination and open the containing directory. Nothing is
 *    touched, so any failure is a validation failure.
 * 2. Create a unique sibling temporary **exclusively** and write the complete
 *    record into it. The destination is never opened for writing and never
 *    truncated.
 * 3. Flush the temporary's contents, then close it.
 * 4. Rename the temporary over the destination. **This is the visibility
 *    linearization point**, for a first creation exactly as much as for a
 *    replacement.
 * 5. Flush the containing directory, so the new directory entry itself reaches
 *    the device. Only then report success.
 * 6. On any failure after the temporary exists, remove it. A temporary is never
 *    promoted, and a completed replacement is never rolled back.
 */

/**
 * The fixed prefix of a name reserved to this protocol.
 *
 * @remarks
 * Reserved so recovery can recognize its own orphans. Nothing outside this
 * protocol may create a name in this shape, and recovery removes nothing else.
 */
const TEMPORARY_PREFIX: string = '.fgv-atomic-';
const TEMPORARY_SUFFIX: string = '.tmp';

/**
 * Recognizes exactly the names this protocol creates: the reserved prefix, 24
 * lowercase hex digits, the reserved suffix. Anchored, so a host file that
 * merely starts with the prefix is not a match.
 */
const TEMPORARY_NAME_PATTERN: RegExp = /^\.fgv-atomic-[0-9a-f]{24}\.tmp$/;

/**
 * Permissions for a temporary, and for a destination this protocol creates.
 *
 * @remarks
 * The design requires a restrictive temporary rather than a world-readable one.
 * A temporary is therefore always created private, and is only widened — via
 * `fchmod`, before the rename — to match an existing destination it is about to
 * replace, so that an atomic replacement does not silently change a file's
 * permissions. Ownership is not preserved; that is not achievable without
 * privilege.
 */
const PRIVATE_FILE_PERMISSIONS: number = 0o600;

/**
 * How many exclusive-create attempts a single write makes before giving up.
 *
 * @remarks
 * A collision means the random token repeated, which is not expected; the retry
 * exists so that a single unlucky draw is not a caller-visible failure.
 */
const TEMPORARY_CREATE_ATTEMPTS: number = 3;

/**
 * `errno` values a rename reports **before** it has changed any directory
 * entry — argument, permission and precondition rejections.
 *
 * @remarks
 * This is an allowlist whose default is `'unknown'`, deliberately. Every entry
 * is a claim that the destination is untouched, and a wrong claim in that
 * direction is the dangerous one: it invites a caller to treat a failed write
 * as a no-op when the file may in fact already have been replaced. `ENOSPC`,
 * `EDQUOT` and `EIO` are therefore **absent** — each can arise part-way through
 * committing the operation — and classify as `'unknown'`.
 */
const RENAME_ERRNOS_THAT_CHANGED_NOTHING: ReadonlySet<AtomicFsErrno> = new Set([
  'EACCES',
  'EBADF',
  'EBUSY',
  'EFAULT',
  'EINVAL',
  'EISDIR',
  'ELOOP',
  'EMLINK',
  'ENAMETOOLONG',
  'ENOENT',
  'ENOTDIR',
  'ENOTEMPTY',
  'EPERM',
  'EROFS',
  'EXDEV'
]);

/**
 * Composes a directory path and a single entry name.
 */
export type PathJoiner = (...paths: string[]) => string;

/**
 * Parameters for {@link commitFileAtomically}.
 */
export interface IAtomicCommitParams {
  /**
   * Absolute path of the file to create or replace.
   */
  readonly destinationPath: string;

  /**
   * Absolute path of the directory containing `destinationPath`. It must
   * already exist — this protocol never creates directories, because a newly
   * created ancestor would need a flush protocol of its own.
   */
  readonly directoryPath: string;

  /**
   * The complete record to commit.
   */
  readonly contents: string;

  /**
   * The guarantee the caller asked for, echoed into the receipt. The caller has
   * already established that the store can honor it.
   */
  readonly guarantee: AtomicWriteGuarantee;

  /**
   * The filesystem seam to run the protocol against.
   */
  readonly ops: IAtomicFsOperations;

  /**
   * Path composition, supplied by the accessors so the protocol does not import
   * `path` itself.
   */
  readonly joinPaths: PathJoiner;
}

/**
 * A temporary that exists on disk.
 */
interface ICreatedTemporary {
  readonly path: string;
  readonly fd: number;
}

/**
 * What the destination path holds before the commit begins.
 */
interface IDestinationState {
  /**
   * `true` if a regular file is already there.
   */
  readonly replaced: boolean;

  /**
   * The permissions the committed file should end up with — the existing file's,
   * or the private default for a creation.
   */
  readonly permissions: number;
}

/**
 * Determines whether a name is one this protocol reserves for its temporaries.
 * @param name - The single directory entry name to test.
 * @returns `true` if the name is reserved to the atomic write protocol.
 */
export function isReservedTemporaryName(name: string): boolean {
  return TEMPORARY_NAME_PATTERN.test(name);
}

/**
 * Inspects the destination path without following a final symbolic link.
 *
 * @remarks
 * `lstat`, so that a symlink is rejected rather than followed: renaming over a
 * symlink replaces the link itself, so following one would let a link inside
 * the tree redirect a committed record to a path the caller never named.
 */
function _inspectDestination(
  ops: IAtomicFsOperations,
  destinationPath: string
): DetailedResult<IDestinationState, IAtomicWriteFailure> {
  const stats = ops.lstat(destinationPath);
  if (stats.isFailure()) {
    if (stats.detail === 'ENOENT') {
      return succeedWithDetail({ replaced: false, permissions: PRIVATE_FILE_PERMISSIONS });
    }
    // The stat itself failed for a reason other than "not there", so nothing is
    // known about the destination and the protocol must not proceed.
    return failWithDetail(`${destinationPath}: cannot inspect destination: ${stats.message}`, {
      code: 'io',
      stage: 'validate',
      visibility: 'unchanged'
    });
  }

  if (stats.value.isFile) {
    return succeedWithDetail({ replaced: true, permissions: stats.value.permissions });
  }

  // The stat succeeded and reported that the destination can never be a regular
  // file this protocol may replace. That is an invalid destination, not a fault.
  const kind = stats.value.isDirectory
    ? 'a directory'
    : stats.value.isSymbolicLink
    ? 'a symbolic link'
    : 'not a regular file';
  return failWithDetail(`${destinationPath}: destination is ${kind}`, {
    code: 'not-writable',
    stage: 'validate',
    visibility: 'unchanged'
  });
}

/**
 * Creates a uniquely named sibling temporary, exclusively.
 */
function _createTemporary(
  ops: IAtomicFsOperations,
  directoryPath: string,
  joinPaths: PathJoiner
): DetailedResult<ICreatedTemporary, AtomicFsErrno> {
  let attempts = 0;
  for (;;) {
    const temporaryPath = joinPaths(
      directoryPath,
      `${TEMPORARY_PREFIX}${ops.generateTemporaryToken()}${TEMPORARY_SUFFIX}`
    );
    const opened = ops.openExclusive(temporaryPath, PRIVATE_FILE_PERMISSIONS);
    if (opened.isSuccess()) {
      return succeedWithDetail({ path: temporaryPath, fd: opened.value });
    }
    attempts++;
    if (opened.detail !== 'EEXIST' || attempts >= TEMPORARY_CREATE_ATTEMPTS) {
      return failWithDetail(`cannot create temporary file: ${opened.message}`, opened.detail);
    }
  }
}

/**
 * Writes the whole buffer, looping over short writes.
 */
function _writeFully(
  ops: IAtomicFsOperations,
  fd: number,
  bytes: Uint8Array
): DetailedResult<number, AtomicFsErrno> {
  let offset = 0;
  while (offset < bytes.length) {
    const written = ops.write(fd, bytes, offset);
    if (written.isFailure()) {
      return written;
    }
    if (written.value <= 0) {
      // A write reporting no progress would otherwise spin forever. Treat it as
      // the I/O failure it is rather than hanging the caller.
      return failWithDetail(
        `wrote ${offset} of ${bytes.length} bytes and then made no progress`,
        UNKNOWN_ERRNO
      );
    }
    offset += written.value;
  }
  return succeedWithDetail(offset);
}

/**
 * Releases whatever the protocol still holds and returns the classified failure
 * that caused the abort.
 *
 * @remarks
 * Cleanup problems are appended to the message and **never** change the
 * classification. The reason the commit failed is what the caller has to act
 * on; an orphaned temporary is a diagnostic, and reporting it as the failure
 * would hide the real one.
 */
function _abort(
  ops: IAtomicFsOperations,
  directoryFd: number,
  temporary: ICreatedTemporary | undefined,
  openTemporaryFd: number | undefined,
  message: string,
  detail: IAtomicWriteFailure
): DetailedResult<IAtomicWriteReceipt, IAtomicWriteFailure> {
  const problems: MessageAggregator = new MessageAggregator();
  if (openTemporaryFd !== undefined) {
    ops
      .close(openTemporaryFd)
      .asResult.withErrorFormat((m) => `close temporary: ${m}`)
      .aggregateError(problems);
  }
  if (temporary !== undefined) {
    ops
      .unlink(temporary.path)
      .asResult.withErrorFormat((m) => `remove ${temporary.path}: ${m}`)
      .aggregateError(problems);
  }
  ops
    .close(directoryFd)
    .asResult.withErrorFormat((m) => `close containing directory: ${m}`)
    .aggregateError(problems);

  const suffix: string = problems.hasMessages ? `; cleanup incomplete: ${problems.toString('; ')}` : '';
  return failWithDetail(`${message}${suffix}`, detail);
}

/**
 * Classifies what a reader can now see at the destination after a rename
 * reported failure.
 *
 * @remarks
 * A failure carrying no `errno` at all is `'unknown'` for the same reason an
 * unrecognized one is: `'unchanged'` is only ever returned on positive evidence
 * that the rename was rejected before it changed a directory entry.
 */
function _visibilityAfterFailedRename(errno: AtomicFsErrno | undefined): IAtomicWriteFailure['visibility'] {
  return errno !== undefined && RENAME_ERRNOS_THAT_CHANGED_NOTHING.has(errno) ? 'unchanged' : 'unknown';
}

/**
 * Commits `contents` to `destinationPath` such that a reader sees either the
 * whole previous file or the whole new one and never a mixture, and — once this
 * reports success — such that the result survives abrupt termination of this
 * process.
 *
 * @param params - The {@link IAtomicCommitParams | commit parameters}.
 * @returns `DetailedSuccess` with the receipt once the declared boundary is
 * established, or `DetailedFailure` with the classified failure.
 */
export function commitFileAtomically(
  params: IAtomicCommitParams
): DetailedResult<IAtomicWriteReceipt, IAtomicWriteFailure> {
  const { destinationPath, directoryPath, contents, guarantee, ops, joinPaths } = params;

  // Step 1 — inspect the destination and open the containing directory. This
  // runs before anything is created, so every failure here is `unchanged`.
  const destination = _inspectDestination(ops, destinationPath);
  if (destination.isFailure()) {
    return failWithDetail(destination.message, destination.detail);
  }
  const { replaced, permissions } = destination.value;

  const directory = ops.openDirectory(directoryPath);
  if (directory.isFailure()) {
    return failWithDetail(
      `${directoryPath}: cannot open containing directory for flush: ${directory.message}`,
      { code: 'io', stage: 'validate', visibility: 'unchanged' }
    );
  }
  const directoryFd: number = directory.value;

  // Step 2 — create the sibling temporary exclusively and write the whole
  // record into it. The destination is not opened and not truncated.
  const created = _createTemporary(ops, directoryPath, joinPaths);
  if (created.isFailure()) {
    return _abort(ops, directoryFd, undefined, undefined, `${destinationPath}: ${created.message}`, {
      code: 'io',
      stage: 'temporary-write',
      visibility: 'unchanged'
    });
  }
  const temporary: ICreatedTemporary = created.value;

  const written = _writeFully(ops, temporary.fd, new TextEncoder().encode(contents));
  if (written.isFailure()) {
    return _abort(ops, directoryFd, temporary, temporary.fd, `${destinationPath}: ${written.message}`, {
      code: 'io',
      stage: 'temporary-write',
      visibility: 'unchanged'
    });
  }

  if (replaced && permissions !== PRIVATE_FILE_PERMISSIONS) {
    // Carry the existing file's permissions onto its replacement, so that an
    // atomic write is not also a silent permission change.
    const chmod = ops.fchmod(temporary.fd, permissions);
    if (chmod.isFailure()) {
      return _abort(
        ops,
        directoryFd,
        temporary,
        temporary.fd,
        `${destinationPath}: cannot set temporary file permissions: ${chmod.message}`,
        { code: 'io', stage: 'temporary-write', visibility: 'unchanged' }
      );
    }
  }

  // Step 3 — flush, then close. A failure at either leaves the previous
  // destination authoritative.
  const flushed = ops.fsync(temporary.fd);
  if (flushed.isFailure()) {
    return _abort(
      ops,
      directoryFd,
      temporary,
      temporary.fd,
      `${destinationPath}: cannot flush temporary file: ${flushed.message}`,
      { code: 'io', stage: 'file-flush', visibility: 'unchanged' }
    );
  }

  const closed = ops.close(temporary.fd);
  if (closed.isFailure()) {
    // The descriptor is reported unclosed, so it is not closed again here — a
    // second close of a descriptor the runtime may have already released is how
    // an unrelated file acquires a stray close.
    return _abort(
      ops,
      directoryFd,
      temporary,
      undefined,
      `${destinationPath}: cannot close temporary file: ${closed.message}`,
      { code: 'io', stage: 'file-flush', visibility: 'unchanged' }
    );
  }

  // Step 4 — the rename. Before this call a reader sees the old file; after it a
  // reader sees the new one. There is no instant at which it sees neither or a
  // mixture, and there is no unlink-first and no copy fallback anywhere above.
  const renamed = ops.rename(temporary.path, destinationPath);
  if (renamed.isFailure()) {
    return _abort(ops, directoryFd, temporary, undefined, `${destinationPath}: ${renamed.message}`, {
      code: 'io',
      stage: 'replace',
      visibility: _visibilityAfterFailedRename(renamed.detail)
    });
  }

  // Step 5 — flush the directory entry itself. Past this point the replacement
  // has happened and is visible, so a failure is reported as `replaced` and is
  // never "rolled back" by writing the old contents over the new ones. The
  // temporary no longer exists: the rename consumed it.
  const directoryFlushed = ops.fsync(directoryFd);
  if (directoryFlushed.isFailure()) {
    return _abort(
      ops,
      directoryFd,
      undefined,
      undefined,
      `${destinationPath}: replacement is visible but the containing directory could not be flushed: ${directoryFlushed.message}`,
      { code: 'io', stage: 'directory-flush', visibility: 'replaced' }
    );
  }

  const directoryClosed = ops.close(directoryFd);
  if (directoryClosed.isFailure()) {
    // The flush reported success, so the boundary was very likely met. It is
    // still reported as unmet: a caller that retries re-establishes the same
    // boundary by rewriting the same record, which is harmless, whereas a caller
    // told the boundary was met while the filesystem is in an unexpected state
    // has no way to find out otherwise.
    return failWithDetail(
      `${destinationPath}: replacement is visible but the containing directory could not be closed: ${directoryClosed.message}`,
      { code: 'io', stage: 'directory-flush', visibility: 'replaced' }
    );
  }

  return succeedWithDetail({ guarantee, replaced });
}

/**
 * Removes the temporaries this protocol reserves from a directory.
 *
 * @remarks
 * Valid at exclusive reopen, which is the fault model's single-writer
 * precondition: any reserved temporary present is necessarily an orphan of an
 * interrupted write, because a live write holds its temporary for the duration
 * of one synchronous call.
 *
 * Only regular files whose names match the reserved pattern exactly are
 * removed, so this never touches a host file. A reserved *name* that is not a
 * regular file is reported rather than removed — nothing but this protocol may
 * create one, so its presence means something outside the fault model happened.
 *
 * @param ops - The filesystem seam.
 * @param directoryPath - Absolute path of the directory to sweep.
 * @param joinPaths - Path composition for the directory's entries.
 * @returns `Success` with the names removed, or `Failure` naming what could not
 * be removed.
 */
export function cleanupAtomicTemporaries(
  ops: IAtomicFsOperations,
  directoryPath: string,
  joinPaths: PathJoiner
): Result<ReadonlyArray<string>> {
  return ops
    .readDirectory(directoryPath)
    .asResult.withErrorFormat((m) => `${directoryPath}: cannot list directory: ${m}`)
    .onSuccess((names) =>
      mapResults(
        names
          .filter(isReservedTemporaryName)
          .map((name) => _removeTemporary(ops, joinPaths(directoryPath, name), name))
      )
    );
}

function _removeTemporary(ops: IAtomicFsOperations, temporaryPath: string, name: string): Result<string> {
  return ops
    .lstat(temporaryPath)
    .asResult.withErrorFormat((m) => `${temporaryPath}: cannot inspect: ${m}`)
    .onSuccess((stats) =>
      stats.isFile
        ? ops
            .unlink(temporaryPath)
            .asResult.withErrorFormat((m) => `${temporaryPath}: cannot remove: ${m}`)
            .onSuccess(() => succeed(name))
        : fail(`${temporaryPath}: reserved name is not a regular file`)
    );
}
