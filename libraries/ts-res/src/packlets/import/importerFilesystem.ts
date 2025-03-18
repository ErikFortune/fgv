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

import { captureResult, Result } from '@fgv/ts-utils';
import path from 'path';
import fs from 'fs';

/**
 * Supported types of file system items.
 * @public
 */
export type FsItemType = 'file' | 'directory';

/**
 * Interface describing a single file system entry.
 * @public
 */
export interface IImporterFsEntry {
  readonly absolutePath: string;
  readonly type: FsItemType;
}

/**
 * Abstract file system importer interface.
 * @public
 */
export interface IImporterFilesystem {
  resolveAbsolutePath(...paths: string[]): string;
  getExtension(absolutePath: string): string;
  getBaseName(absolutePath: string, suffix?: string): string;

  getEntry(absolutePath: string): Result<IImporterFsEntry>;
  getChildren(absolutePath: string): Result<IImporterFsEntry[]>;
}

/**
 * Default implementation of the {@link Import.IImporterFilesystem | IImporterFilesystem} interface
 * @public
 */
export class ImporterFilesystem implements IImporterFilesystem {
  /**
   * Resolves the given paths into an absolute path.
   * @param paths - the paths to resolve.
   * @returns the resolved absolute path.
   */
  public resolveAbsolutePath(...paths: string[]): string {
    return path.resolve(...paths);
  }

  /**
   * Gets the extension of the given absolute path.
   * @param absolutePath - the absolute path to check.
   * @returns the extension of the path.
   */
  public getExtension(absolutePath: string): string {
    return path.extname(absolutePath);
  }

  /**
   * Gets the base name of the given absolute path.
   * @param absolutePath - the absolute path to check.
   * @param suffix - an optional suffix to remove.
   * @returns the base name of the path.
   */
  public getBaseName(absolutePath: string, suffix?: string): string {
    return path.basename(absolutePath, suffix);
  }

  /**
   * Gets the file system entry for the given absolute path.
   * @param absolutePath - the absolute path to check.
   * @returns `Success` with the entry if successful, `Failure` with an error message if not.
   * @remarks Fails for any entry that is not a file or directory.
   */
  public getEntry(absolutePath: string): Result<IImporterFsEntry> {
    return captureResult(() => {
      const stats = fs.statSync(absolutePath);
      if (stats.isFile()) {
        return { absolutePath, type: 'file' };
      } else if (stats.isDirectory()) {
        return { absolutePath, type: 'directory' };
      }
      throw new Error(`${absolutePath}: is not a file or directory`);
    });
  }

  /**
   * Gets the children of the given directory.
   * @param absolutePath - the absolute path of the directory.
   * @returns `Success` with the children if successful, `Failure` with an error message if not.
   * @remarks This method does not recurse into subdirectories and ignores '.' and '..' as well
   * as any non-file or directory entries.
   * @public
   */
  public getChildren(absolutePath: string): Result<IImporterFsEntry[]> {
    return captureResult(() => {
      const children: IImporterFsEntry[] = [];
      for (const child of fs.readdirSync(absolutePath)) {
        if (child === '.' || child === '..') {
          continue;
        }
        const childPath = path.resolve(absolutePath, child);
        const stats = fs.statSync(childPath);
        if (stats.isFile()) {
          children.push({ absolutePath: childPath, type: 'file' });
        } else if (stats.isDirectory()) {
          children.push({ absolutePath: childPath, type: 'directory' });
        }
      }
      return children;
    });
  }
}
