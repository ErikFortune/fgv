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
  IFileTreeInitParams,
  IFilterSpec,
  IMutableFileTreeAccessors,
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

/**
 * Implementation of {@link FileTree.IMutableFileTreeAccessors} that uses the
 * file system to access and modify files and directories.
 * @public
 */
export class FsFileTreeAccessors<TCT extends string = string> implements IMutableFileTreeAccessors<TCT> {
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
      /* c8 ignore next 3 - unreachable when running as root (CI), tested in mutableFsTree.test.ts */
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
