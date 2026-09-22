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
  FileTreeItem,
  IAtomicFileTreeAccessors,
  IAtomicWriteCapabilities,
  IAtomicWriteFailure,
  IAtomicWriteOptions,
  IAtomicWriteReceipt,
  IFileTreeInitParams,
  IFilterSpec,
  IMutableBinaryFileTreeAccessors,
  SaveDetail
} from './fileTreeAccessors';
import path from 'path';
import fs from 'fs';
import {
  captureResult,
  DetailedResult,
  fail,
  failWithDetail,
  Result,
  succeed,
  succeedWithDetail
} from '@fgv/ts-utils';
import { DirectoryItem } from './directoryItem';
import { FileItem } from './fileItem';
import { isPathMutable } from './filterSpec';
import {
  cleanupAtomicTemporaries,
  commitFileAtomically,
  defaultAtomicFsOperations,
  qualifyAtomicWrites
} from './fs-atomic';

/**
 * A root's atomic-write qualification, together with the failure code to report
 * if it refuses.
 *
 * @remarks
 * The code travels with the qualification rather than being inferred later from
 * whichever check happened to run first: a refusal this accessor makes on policy
 * grounds is `'not-writable'` (matching the in-memory store for the same
 * conditions), while one the platform or filesystem forces is `'unsupported'`.
 */
interface IAccessorQualification {
  readonly capabilities: IAtomicWriteCapabilities;
  readonly reason: string;
  readonly refusalCode: IAtomicWriteFailure['code'];
}

/**
 * Implementation of {@link FileTree.IMutableBinaryFileTreeAccessors} that uses the
 * file system to access and modify files and directories.
 *
 * @remarks
 * The file system is byte-native, so this implementation supports the optional binary
 * capability for both reads and writes.
 *
 * It also implements the optional atomic-write capability
 * ({@link FileTree.IAtomicFileTreeAccessors}). Ordinary
 * {@link FileTree.FsFileTreeAccessors.saveFileContents | saveFileContents} and
 * {@link FileTree.FsFileTreeAccessors.saveFileBytes | saveFileBytes} are
 * unchanged and still write in place; the atomic capability is a separate,
 * opt-in path. Which guarantee — if any — a given root can honor depends on the
 * platform and filesystem and is reported by
 * {@link FileTree.FsFileTreeAccessors.getAtomicWriteCapabilities |
 * getAtomicWriteCapabilities}; an unqualified root refuses a durable write
 * rather than quietly performing a weaker one.
 * @public
 */
export class FsFileTreeAccessors<TCT extends string = string>
  implements IMutableBinaryFileTreeAccessors<TCT>, IAtomicFileTreeAccessors<TCT>
{
  /**
   * Optional path prefix to prepend to all paths.
   */
  public readonly prefix: string | undefined;

  /**
   * Function to infer the content type of a file.
   * @public
   */
  protected readonly _inferContentType: (filePath: string) => Result<TCT | undefined>;

  /**
   * The mutability configuration.
   */
  private readonly _mutable: boolean | IFilterSpec;

  /**
   * Construct a new instance of the {@link FileTree.FsFileTreeAccessors | FsFileTreeAccessors} class.
   * @param params - Optional {@link FileTree.IFileTreeInitParams | initialization parameters}.
   * @public
   */
  public constructor(params?: IFileTreeInitParams<TCT>) {
    this.prefix = params?.prefix;
    this._inferContentType = params?.inferContentType ?? FileItem.defaultInferContentType;
    /* c8 ignore next 1 - defensive default when params is undefined */
    this._mutable = params?.mutable ?? false;
  }

  /**
   * Resolves paths to an absolute path.
   * @param paths - Paths to resolve.
   * @returns The resolved absolute path.
   */
  public resolveAbsolutePath(...paths: string[]): string {
    if (this.prefix && !path.isAbsolute(paths[0])) {
      return path.resolve(this.prefix, ...paths);
    }
    return path.resolve(...paths);
  }

  /**
   * Gets the extension of a path.
   * @param itemPath - Path to get the extension of.
   * @returns The extension of the path.
   */
  public getExtension(itemPath: string): string {
    return path.extname(itemPath);
  }

  /**
   * Gets the base name of a path.
   * @param itemPath - Path to get the base name of.
   * @param suffix - Optional suffix to remove from the base name.
   * @returns The base name of the path.
   */
  public getBaseName(itemPath: string, suffix?: string): string {
    return path.basename(itemPath, suffix);
  }

  /**
   * Joins paths together.
   * @param paths - Paths to join.
   * @returns The joined paths.
   */
  public joinPaths(...paths: string[]): string {
    return path.join(...paths);
  }

  /**
   * Gets an item from the file tree.
   * @param itemPath - Path of the item to get.
   * @returns The item if it exists.
   */
  public getItem(itemPath: string): Result<FileTreeItem<TCT>> {
    return captureResult(() => {
      const stat = fs.statSync(this.resolveAbsolutePath(itemPath));
      if (stat.isDirectory()) {
        return DirectoryItem.create<TCT>(itemPath, this).orThrow();
      } else if (stat.isFile()) {
        return FileItem.create(itemPath, this).orThrow();
      }
      /* c8 ignore next 1 - defensive coding: filesystem items should be file or directory */
      throw new Error(`${itemPath}: not a file or directory`);
    });
  }

  /**
   * Gets the contents of a file in the file tree.
   * @param filePath - Absolute path of the file.
   * @returns The contents of the file.
   */
  public getFileContents(filePath: string): Result<string> {
    return captureResult(() => fs.readFileSync(this.resolveAbsolutePath(filePath), 'utf8'));
  }

  /**
   * {@inheritDoc FileTree.IBinaryFileTreeAccessors.getFileBytes}
   */
  public getFileBytes(filePath: string): Result<Uint8Array> {
    // `readFileSync` without an encoding returns a Buffer which, for small reads, is a
    // view onto Node's shared allocation pool. Copy into a standalone Uint8Array so the
    // returned bytes cannot be perturbed by unrelated reads and so callers get a plain
    // Uint8Array rather than a Node-only Buffer.
    return captureResult(() => new Uint8Array(fs.readFileSync(this.resolveAbsolutePath(filePath))));
  }

  /**
   * Reads a file's contents, decoding UTF-8 strictly.
   *
   * @remarks
   * Always decidable here: the bytes are read from disk, so this store has
   * custody of exactly what was written.
   * @param filePath - Absolute path of the file.
   * @returns `Success` with the decoded text; `Failure` if the bytes are not
   * valid UTF-8.
   */
  public getFileTextStrict(filePath: string): Result<string> {
    return this.getFileBytes(filePath).onSuccess((bytes) =>
      captureResult(() => new TextDecoder('utf-8', { fatal: true }).decode(bytes))
    );
  }

  /**
   * Gets the content type of a file in the file tree.
   * @param filePath - Absolute path of the file.
   * @param provided - Optional supplied content type.
   * @returns The content type of the file.
   */
  public getFileContentType(filePath: string, provided?: string): Result<TCT | undefined> {
    if (provided !== undefined) {
      return succeed(provided as TCT);
    }
    /* c8 ignore next 2 - coverage has intermittent issues in the build - local tests show coverage of this line */
    return this._inferContentType(filePath);
  }

  /**
   * Gets the children of a directory in the file tree.
   * @param dirPath - Path of the directory.
   * @returns The children of the directory.
   */
  public getChildren(dirPath: string): Result<ReadonlyArray<FileTreeItem<TCT>>> {
    return captureResult(() => {
      const children: FileTreeItem<TCT>[] = [];
      const files = fs.readdirSync(this.resolveAbsolutePath(dirPath), { withFileTypes: true });
      files.forEach((file) => {
        const fullPath = this.resolveAbsolutePath(dirPath, file.name);
        if (file.isDirectory()) {
          children.push(DirectoryItem.create<TCT>(fullPath, this).orThrow());
        } else if (file.isFile()) {
          children.push(FileItem.create<TCT>(fullPath, this).orThrow());
        }
      });
      return children;
    });
  }

  /**
   * Checks if a file at the given path can be saved.
   * @param path - The path to check.
   * @returns `DetailedSuccess` with {@link FileTree.SaveCapability} if the file can be saved,
   * or `DetailedFailure` with {@link FileTree.SaveFailureReason} if it cannot.
   */
  public fileIsMutable(path: string): DetailedResult<boolean, SaveDetail> {
    const absolutePath = this.resolveAbsolutePath(path);

    // Check if mutability is disabled
    if (this._mutable === false) {
      return failWithDetail(`${absolutePath}: mutability is disabled`, 'not-mutable');
    }

    // Check if path is excluded by filter
    if (!isPathMutable(absolutePath, this._mutable)) {
      return failWithDetail(`${absolutePath}: path is excluded by filter`, 'path-excluded');
    }

    // Check file system permissions
    try {
      // Check if file exists
      if (fs.existsSync(absolutePath)) {
        fs.accessSync(absolutePath, fs.constants.W_OK);
      } else {
        // Check if parent directory is writable
        const parentDir = absolutePath.substring(0, absolutePath.lastIndexOf('/'));
        if (parentDir && fs.existsSync(parentDir)) {
          fs.accessSync(parentDir, fs.constants.W_OK);
        }
      }
      return succeedWithDetail(true, 'persistent');
    } catch {
      return failWithDetail(`${absolutePath}: permission denied`, 'permission-denied');
    }
  }

  /**
   * Saves the contents to a file at the given path.
   * @param path - The path of the file to save.
   * @param contents - The string contents to save.
   * @returns `Success` if the file was saved, or `Failure` with an error message.
   */
  public saveFileContents(path: string, contents: string): Result<string> {
    return this.fileIsMutable(path).asResult.onSuccess(() => {
      const absolutePath = this.resolveAbsolutePath(path);
      return captureResult(() => {
        fs.writeFileSync(absolutePath, contents, 'utf8');
        return contents;
      });
    });
  }

  /**
   * {@inheritDoc FileTree.IMutableBinaryFileTreeAccessors.saveFileBytes}
   */
  public saveFileBytes(path: string, bytes: Uint8Array): Result<Uint8Array> {
    return this.fileIsMutable(path).asResult.onSuccess(() => {
      const absolutePath = this.resolveAbsolutePath(path);
      return captureResult(() => {
        fs.writeFileSync(absolutePath, bytes);
        return bytes;
      });
    });
  }

  /**
   * {@inheritDoc FileTree.IAtomicFileTreeAccessors.getAtomicWriteCapabilities}
   */
  public getAtomicWriteCapabilities(directory: string): Result<IAtomicWriteCapabilities> {
    // Confined like the two mutating methods. An inquiry that answered for a
    // directory outside the root would contradict the write that then refused
    // it, and two different answers to one question is worse than either.
    return this._confineToRoot(this.resolveAbsolutePath(directory))
      .onSuccess(() => this._qualifyDirectory(directory))
      .onSuccess((qualification) => succeed(qualification.capabilities));
  }

  /**
   * {@inheritDoc FileTree.IAtomicFileTreeAccessors.writeFileAtomically}
   */
  public writeFileAtomically(
    filePath: string,
    contents: string,
    options: IAtomicWriteOptions
  ): DetailedResult<IAtomicWriteReceipt, IAtomicWriteFailure> {
    const absolutePath = this.resolveAbsolutePath(filePath);
    const directoryPath = path.dirname(absolutePath);

    const confined = this._confineToRoot(absolutePath);
    if (confined.isFailure()) {
      return failWithDetail(confined.message, {
        code: 'not-writable',
        stage: 'validate',
        visibility: 'unchanged'
      });
    }

    // The qualification is per containing directory, not per accessor: one root
    // can span a qualified filesystem and an unqualified mount beneath it.
    const qualification = this._qualifyDirectory(directoryPath);
    if (qualification.isFailure()) {
      return failWithDetail(qualification.message, {
        code: 'not-writable',
        stage: 'validate',
        visibility: 'unchanged'
      });
    }
    const { capabilities, reason, refusalCode } = qualification.value;

    if (!capabilities.atomicReplace) {
      return failWithDetail(`${absolutePath}: atomic writes are not available here: ${reason}`, {
        code: refusalCode,
        stage: 'validate',
        visibility: 'unchanged'
      });
    }

    if (!capabilities.guarantees.includes(options.guarantee)) {
      // No silent downgrade: a caller that asked for more durability than this
      // root can be shown to provide gets a refusal, not a weaker write.
      return failWithDetail(
        `${absolutePath}: requested guarantee '${
          options.guarantee
        }' exceeds what this root can honor (${capabilities.guarantees.join(', ')}) — ${reason}`,
        { code: 'unsupported', stage: 'validate', visibility: 'unchanged' }
      );
    }

    // The destination's own writability, which the directory-level checks above
    // cannot see: a filter may exclude this one file inside a writable, qualified
    // directory.
    const mutable = this.fileIsMutable(filePath);
    if (mutable.isFailure()) {
      return failWithDetail(mutable.message, {
        code: 'not-writable',
        stage: 'validate',
        visibility: 'unchanged'
      });
    }

    return commitFileAtomically({
      destinationPath: absolutePath,
      directoryPath,
      contents,
      guarantee: options.guarantee,
      ops: defaultAtomicFsOperations,
      joinPaths: (...paths: string[]) => this.joinPaths(...paths)
    });
  }

  /**
   * {@inheritDoc FileTree.IAtomicFileTreeAccessors.cleanupAtomicTemporaries}
   */
  public cleanupAtomicTemporaries(directory: string): Result<ReadonlyArray<string>> {
    const absolutePath = this.resolveAbsolutePath(directory);
    return this._confineToRoot(absolutePath)
      .onSuccess(() => this.fileIsMutable(directory).asResult)
      .onSuccess(() =>
        cleanupAtomicTemporaries(defaultAtomicFsOperations, absolutePath, (...paths: string[]) =>
          this.joinPaths(...paths)
        )
      );
  }

  /**
   * Qualifies a directory for atomic writes, applying this accessor's mutability
   * policy on top of the platform/filesystem qualification.
   *
   * @remarks
   * Existence is checked first, so asking about a path that is not a directory
   * fails rather than answering "not capable" — the same distinction the
   * in-memory accessors draw.
   */
  private _qualifyDirectory(directory: string): Result<IAccessorQualification> {
    const absolutePath = this.resolveAbsolutePath(directory);
    return qualifyAtomicWrites(defaultAtomicFsOperations, absolutePath, process.platform).onSuccess(
      (qualification): Result<IAccessorQualification> => {
        // A refusal this accessor makes on POLICY grounds is `not-writable` —
        // the same code the in-memory store reports for the same conditions.
        // A refusal the platform or filesystem forces is `unsupported`. One
        // contract answering the same question two ways is what breaks a
        // caller's `switch`, so the distinction is carried rather than
        // inferred later from whichever check happened to run first.
        if (this._mutable === false) {
          return succeed({
            capabilities: { atomicReplace: false, guarantees: [] },
            reason: `${absolutePath}: mutability is disabled`,
            refusalCode: 'not-writable'
          });
        }
        if (!isPathMutable(absolutePath, this._mutable)) {
          return succeed({
            capabilities: { atomicReplace: false, guarantees: [] },
            reason: `${absolutePath}: path is excluded by filter`,
            refusalCode: 'not-writable'
          });
        }
        return succeed({ ...qualification, refusalCode: 'unsupported' });
      }
    );
  }

  /**
   * Rejects a path that resolves outside this tree's root.
   *
   * @remarks
   * `resolveAbsolutePath` ignores the prefix for an input that is already
   * absolute, so confinement has to be checked rather than assumed. A tree with no prefix has no root to be
   * confined to, and the check is vacuous.
   */
  private _confineToRoot(absolutePath: string): Result<string> {
    if (this.prefix === undefined) {
      return succeed(absolutePath);
    }
    const root = path.resolve(this.prefix);
    if (absolutePath === root || absolutePath.startsWith(`${root}${path.sep}`)) {
      return succeed(absolutePath);
    }
    return fail(`${absolutePath}: resolves outside the tree root '${root}'`);
  }

  /**
   * Deletes a file at the given path.
   * @param path - The path of the file to delete.
   * @returns `Success` with `true` if the file was deleted, or `Failure` with an error message.
   */
  public deleteFile(path: string): Result<boolean> {
    return this.fileIsMutable(path).asResult.onSuccess(() => {
      const absolutePath = this.resolveAbsolutePath(path);
      return captureResult(() => {
        const stat = fs.statSync(absolutePath);
        if (!stat.isFile()) {
          throw new Error(`${absolutePath}: not a file`);
        }
        fs.unlinkSync(absolutePath);
        return true;
      });
    });
  }

  /**
   * Creates a directory at the given path, including any missing parent directories.
   * @param dirPath - The path of the directory to create.
   * @returns `Success` with the absolute path if created, or `Failure` with an error message.
   */
  public createDirectory(dirPath: string): Result<string> {
    const absolutePath = this.resolveAbsolutePath(dirPath);

    // Check if mutability is disabled
    if (this._mutable === false) {
      return fail(`${absolutePath}: mutability is disabled`);
    }

    return captureResult(() => {
      fs.mkdirSync(absolutePath, { recursive: true });
      return absolutePath;
    });
  }

  /**
   * Deletes a directory at the given path.
   * The directory must be empty or the operation will fail.
   * @param dirPath - The path of the directory to delete.
   * @returns `Success` with `true` if the directory was deleted, or `Failure` with an error message.
   */
  public deleteDirectory(dirPath: string): Result<boolean> {
    return this.fileIsMutable(dirPath).asResult.onSuccess(() => {
      const absolutePath = this.resolveAbsolutePath(dirPath);
      return captureResult(() => {
        const stat = fs.statSync(absolutePath);
        if (!stat.isDirectory()) {
          throw new Error(`${absolutePath}: not a directory`);
        }
        // fs.rmdirSync fails if directory is non-empty (desired behavior)
        fs.rmdirSync(absolutePath);
        return true;
      });
    });
  }
}
