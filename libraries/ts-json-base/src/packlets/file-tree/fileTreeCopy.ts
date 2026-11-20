/*
 * Copyright (c) 2026 Erik Fortune
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

import { captureResult, fail, mapResults, Result, succeed } from '@fgv/ts-utils';
import {
  FileTreeItem,
  IFileTreeDirectoryItem,
  IFileTreeFileItem,
  IMutableFileTreeDirectoryItem,
  isBinaryFileItem,
  isMutableBinaryDirectoryItem
} from './fileTreeAccessors';

/**
 * What a copy does with a file it cannot carry byte-faithfully.
 *
 * @remarks
 * - `fail`: the copy fails, naming the offending path. **The default.**
 * - `skip`: the file is left out and reported on
 *   {@link FileTree.ICopyReport.skipped | ICopyReport.skipped}.
 *
 * The default is `fail` for the same reason
 * {@link FileTree.IStrictTextFileTreeAccessors.getFileTextStrict | getFileTextStrict}
 * refuses rather than substituting: a copy that quietly drops or mangles a file is
 * discovered later, when the source may be gone. Choosing `skip` should be a deliberate
 * act, because a file that cannot be carried is often a file that should not have been in
 * the set, and a failure that names it is the diagnosis.
 * @public
 */
export type CopyUnfaithfulFileBehavior = 'fail' | 'skip';

/**
 * Options for {@link FileTree.copyItemInto | copyItemInto} and
 * {@link FileTree.copyContentsInto | copyContentsInto}.
 * @public
 */
export interface ICopyOptions {
  /**
   * What to do with a file that cannot be carried byte-faithfully. Defaults to `fail`.
   */
  onUnfaithfulFile?: CopyUnfaithfulFileBehavior;
}

/**
 * A file a copy left behind under
 * {@link FileTree.CopyUnfaithfulFileBehavior | `onUnfaithfulFile: 'skip'`}.
 *
 * @remarks
 * There is exactly one condition that produces one of these: the destination store
 * persists text and the file's bytes do not survive a UTF-8 round trip. Every other way a
 * copy can go wrong — an unreadable source, a store that cannot produce bytes at all, a
 * write that fails — is a `Failure`, because none of those describe one file the caller
 * might reasonably choose to do without.
 * @public
 */
export interface ISkippedCopyFile {
  /**
   * Absolute path of the source file.
   */
  readonly sourcePath: string;

  /**
   * Path the file would have occupied in the destination.
   *
   * @remarks
   * Composed for diagnosis by joining the destination directory's path with the file's
   * name, so it is not guaranteed to be in the backing store's native separator form.
   * Nothing reads it back — no file was written.
   */
  readonly destinationPath: string;

  /**
   * A message naming both paths, identical to the one a `fail` would have reported.
   */
  readonly message: string;
}

/**
 * What a copy did.
 *
 * @remarks
 * The two file counts are split by **mechanism**, not by outcome — every file counted in
 * either arrived byte-for-byte identical to its source. The split is there because
 * `filesCopied: 500` reads the same whether the bytes were carried verbatim or put through
 * a text round trip, and a caller auditing a snapshot wants to know which. Anything that
 * did *not* arrive faithfully is either a failure or an entry in
 * {@link FileTree.ICopyReport.skipped | skipped}; it is never folded into a count.
 * @public
 */
export interface ICopyReport {
  /**
   * Files written verbatim as bytes.
   */
  readonly filesCopiedAsBytes: number;

  /**
   * Files written as text, after verifying that re-encoding that text reproduces the
   * source bytes exactly.
   */
  readonly filesCopiedAsText: number;

  /**
   * Directories created in the destination.
   */
  readonly directoriesCreated: number;

  /**
   * Files left behind, empty unless
   * {@link FileTree.ICopyOptions.onUnfaithfulFile | onUnfaithfulFile} is `'skip'`.
   */
  readonly skipped: ReadonlyArray<ISkippedCopyFile>;
}

const EMPTY_REPORT: ICopyReport = {
  filesCopiedAsBytes: 0,
  filesCopiedAsText: 0,
  directoriesCreated: 0,
  // Frozen because every per-file report spreads this object and so shares the array.
  skipped: Object.freeze([])
};

/**
 * Depth at which a copy gives up and fails, naming the path.
 *
 * @remarks
 * A copy into a directory beneath its own source re-reads a subtree it is concurrently
 * growing and would otherwise recurse forever. Detecting that case directly is not
 * possible from the items alone — two different stores can present the same absolute
 * path, so a path-prefix test would refuse legitimate copies — so the recursion is bounded
 * instead. No real tree approaches this depth, and a hang is a far worse failure than an
 * error that names where it stopped.
 * @internal
 */
const MAX_COPY_DEPTH: number = 128;

/**
 * Copies an item into a destination directory as a child of the same name, recursing for
 * directories.
 *
 * @remarks
 * **Every file that lands is byte-identical to its source, or the copy says so.** Where
 * the destination store is byte-native the bytes are carried verbatim; where it persists
 * text they are carried as text only after verifying that the text re-encodes to exactly
 * the source bytes. A file that survives neither route is failed or skipped per
 * {@link FileTree.ICopyOptions.onUnfaithfulFile | onUnfaithfulFile} — it is never written
 * in a form that differs from the source.
 *
 * That verification is not ceremony: a UTF-8 BOM is stripped on decode and not restored on
 * encode, so a BOM-prefixed file copied through text loses three bytes while decoding
 * without error. Reasoning about which files are "just text" is exactly what produces that
 * class of bug, which is why the check is unconditional rather than advisory.
 *
 * The copy reads bytes and only bytes. Falling back to a text read when a source cannot
 * produce them would yield a file whose faithfulness nothing had established, so a source
 * store with no byte capability is a `Failure` rather than a quiet text copy.
 *
 * **"Its source" means what the source item's `getRawBytes` reports**, which is only as
 * faithful as that store's own custody of the original bytes — the same line
 * {@link FileTree.IStrictTextFileTreeAccessors | the strict-text capability} draws. A store
 * whose transport already decoded the bytes (an `HttpTreeAccessors` under its default
 * encoding, a `localStorage` tree, an in-memory tree seeded with a `string`) hands back a
 * re-encode, and a copy reproduces that faithfully and reports success. This copy cannot
 * improve on the custody its source has; what it will not do is *downgrade* a source that
 * has custody into a text write.
 *
 * Existing destination files of the same name are overwritten, matching
 * {@link FileTree.IMutableFileTreeDirectoryItem.createChildFile | createChildFile}.
 *
 * **A copy is not atomic and does not roll back.** Every file is attempted, so a failure
 * names *every* path that could not be carried rather than only the first — which is the
 * useful form when the answer is "these files should not have been in the set" — and the
 * destination is left holding whatever did succeed. There is no mode in which a failed
 * copy leaves the destination untouched.
 *
 * Copying a directory into a location beneath its own source is not supported: the walk
 * would re-read a subtree it is concurrently growing. That cannot be detected from the
 * items alone, so it surfaces as a failure once the recursion passes a fixed depth bound
 * far beyond any real tree.
 *
 * @param source - The file or directory to copy.
 * @param destination - The directory to copy it into. Narrow with
 * {@link FileTree.isMutableDirectoryItem | isMutableDirectoryItem}.
 * @param options - Optional {@link FileTree.ICopyOptions | options}.
 * @returns `Success` with an {@link FileTree.ICopyReport | ICopyReport}, or `Failure` with
 * a message naming the path that could not be copied.
 * @public
 */
export function copyItemInto<TCT extends string = string>(
  source: FileTreeItem<TCT>,
  destination: IMutableFileTreeDirectoryItem<TCT>,
  options?: ICopyOptions
): Result<ICopyReport> {
  return _copyItem(source, destination, options?.onUnfaithfulFile ?? 'fail', 0);
}

/**
 * Copies every child of a source directory into a destination directory, recursing for
 * subdirectories. The source directory itself is not reproduced — its contents are.
 *
 * @remarks
 * Carries the same faithfulness guarantee as
 * {@link FileTree.copyItemInto | copyItemInto}; see its remarks.
 *
 * @param source - The directory whose contents to copy.
 * @param destination - The directory to copy them into. Narrow with
 * {@link FileTree.isMutableDirectoryItem | isMutableDirectoryItem}.
 * @param options - Optional {@link FileTree.ICopyOptions | options}.
 * @returns `Success` with an {@link FileTree.ICopyReport | ICopyReport}, or `Failure` with
 * a message naming the path that could not be copied.
 * @public
 */
export function copyContentsInto<TCT extends string = string>(
  source: IFileTreeDirectoryItem<TCT>,
  destination: IMutableFileTreeDirectoryItem<TCT>,
  options?: ICopyOptions
): Result<ICopyReport> {
  return _copyChildren(source, destination, options?.onUnfaithfulFile ?? 'fail', 0);
}

/**
 * @internal
 */
function _copyItem<TCT extends string>(
  source: FileTreeItem<TCT>,
  destination: IMutableFileTreeDirectoryItem<TCT>,
  onUnfaithfulFile: CopyUnfaithfulFileBehavior,
  depth: number
): Result<ICopyReport> {
  if (source.type === 'file') {
    return _copyFile(source, destination, onUnfaithfulFile);
  }
  if (depth >= MAX_COPY_DEPTH) {
    return fail(
      `${source.absolutePath}: copy exceeded ${MAX_COPY_DEPTH} levels of nesting — ` +
        `is the destination inside the source?`
    );
  }
  return destination
    .createChildDirectory(source.name)
    .withErrorFormat((message) => `${source.absolutePath}: ${message}`)
    .onSuccess((created) =>
      _copyChildren(source, created, onUnfaithfulFile, depth + 1).onSuccess((report) =>
        succeed({ ...report, directoriesCreated: report.directoriesCreated + 1 })
      )
    );
}

/**
 * @internal
 */
function _copyChildren<TCT extends string>(
  source: IFileTreeDirectoryItem<TCT>,
  destination: IMutableFileTreeDirectoryItem<TCT>,
  onUnfaithfulFile: CopyUnfaithfulFileBehavior,
  depth: number
): Result<ICopyReport> {
  return source
    .getChildren()
    .withErrorFormat((message) => `${source.absolutePath}: ${message}`)
    .onSuccess((children) =>
      mapResults(children.map((child) => _copyItem(child, destination, onUnfaithfulFile, depth))).onSuccess(
        (reports) => succeed(_mergeReports(reports))
      )
    );
}

/**
 * @internal
 */
function _copyFile<TCT extends string>(
  source: IFileTreeFileItem<TCT>,
  destination: IMutableFileTreeDirectoryItem<TCT>,
  onUnfaithfulFile: CopyUnfaithfulFileBehavior
): Result<ICopyReport> {
  const destinationPath: string = `${destination.absolutePath}/${source.name}`;

  if (!isBinaryFileItem(source)) {
    return fail(`${source.absolutePath}: cannot copy to ${destinationPath}: not a binary file item`);
  }

  return source
    .getRawBytes()
    .withErrorFormat((message) => `${source.absolutePath}: cannot copy to ${destinationPath}: ${message}`)
    .onSuccess((bytes) => {
      // Asked before every write rather than discovered by one failing — and asked of the
      // accessors, via `canCreateChildFileBytes`, because the item-level guard alone is
      // true for any `DirectoryItem` regardless of what backs it.
      if (isMutableBinaryDirectoryItem(destination) && destination.canCreateChildFileBytes()) {
        return destination
          .createChildFileBytes(source.name, bytes)
          .withErrorFormat((message) => `${source.absolutePath}: ${message}`)
          .onSuccess(() => succeed({ ...EMPTY_REPORT, filesCopiedAsBytes: 1 }));
      }

      const text: string | undefined = _asRoundTrippableText(bytes);
      if (text === undefined) {
        const message: string =
          `${source.absolutePath}: cannot copy faithfully to ${destinationPath}: ` +
          `the destination store persists text and these bytes do not survive a UTF-8 round trip`;
        if (onUnfaithfulFile === 'fail') {
          return fail(message);
        }
        return succeed({
          ...EMPTY_REPORT,
          skipped: [{ sourcePath: source.absolutePath, destinationPath, message }]
        });
      }

      return destination
        .createChildFile(source.name, text)
        .withErrorFormat((message) => `${source.absolutePath}: ${message}`)
        .onSuccess(() => succeed({ ...EMPTY_REPORT, filesCopiedAsText: 1 }));
    });
}

/**
 * Returns the text form of `bytes` when writing that text would reproduce them exactly,
 * and `undefined` otherwise.
 *
 * @remarks
 * A strict decode is necessary but **not** sufficient: `TextDecoder` strips a leading BOM
 * by default, so `EF BB BF 41` decodes without error and re-encodes to `41`. The
 * comparison is the actual guarantee; the strict decode only keeps U+FFFD substitution
 * from reaching it first.
 * @internal
 */
function _asRoundTrippableText(bytes: Uint8Array): string | undefined {
  const decoded: string | undefined = captureResult(() =>
    new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  ).orDefault();
  if (decoded === undefined) {
    return undefined;
  }
  return _bytesEqual(new TextEncoder().encode(decoded), bytes) ? decoded : undefined;
}

/**
 * @internal
 */
function _bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  return left.length === right.length && left.every((byte, index) => byte === right[index]);
}

/**
 * @internal
 */
function _mergeReports(reports: ReadonlyArray<ICopyReport>): ICopyReport {
  return {
    filesCopiedAsBytes: reports.reduce((total, report) => total + report.filesCopiedAsBytes, 0),
    filesCopiedAsText: reports.reduce((total, report) => total + report.filesCopiedAsText, 0),
    directoriesCreated: reports.reduce((total, report) => total + report.directoriesCreated, 0),
    skipped: reports.flatMap((report) => report.skipped)
  };
}
