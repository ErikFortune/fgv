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

import { FileTreeItem, IFileTreeAccessors } from './fileTreeAccessors';
import path from 'path';
import fs from 'fs';
import { captureResult, Result } from '@fgv/ts-utils';
import { DirectoryItem } from './directoryItem';
import { FileItem } from './fileItem';

/**
 * Implementation of {@link IFileTreeAccessors} that uses the
 * file system to access files and directories.
 * @public
 */
export class FsFileTreeAccessors implements IFileTreeAccessors {
  public readonly prefix: string | undefined;

  /**
   * Protected constructor for derived classes.
   * @param prefix - Optional prefix for the tree.
   * @public
   */
  public constructor(prefix?: string) {
    this.prefix = prefix;
  }

  /**
   * {@inheritDoc IFileTreeAccessors.resolveAbsolutePath}
   */
  public resolveAbsolutePath(...paths: string[]): string {
    if (this.prefix && !path.isAbsolute(paths[0])) {
      return path.resolve(this.prefix, ...paths);
    }
    return path.resolve(...paths);
  }

  /**
   * {@inheritDoc IFileTreeAccessors.getExtension}
   */
  public getExtension(itemPath: string): string {
    return path.extname(itemPath);
  }

  /**
   * {@inheritDoc IFileTreeAccessors.getBaseName}
   */
  public getBaseName(itemPath: string, suffix?: string): string {
    return path.basename(itemPath, suffix);
  }

  /**
   * {@inheritDoc IFileTreeAccessors.joinPaths}
   */
  public joinPaths(...paths: string[]): string {
    return path.join(...paths);
  }

  /**
   * {@inheritDoc IFileTreeAccessors.getItem}
   */
  public getItem(itemPath: string): Result<FileTreeItem> {
    return captureResult(() => {
      const stat = fs.statSync(this.resolveAbsolutePath(itemPath));
      if (stat.isDirectory()) {
        return DirectoryItem.create(itemPath, this).orThrow();
      } else if (stat.isFile()) {
        return FileItem.create(itemPath, this).orThrow();
      }
      /* c8 ignore next 1 - defensive coding: filesystem items should be file or directory */
      throw new Error(`${itemPath}: not a file or directory`);
    });
  }

  /**
   * {@inheritDoc IFileTreeAccessors.getFileContents}
   */
  public getFileContents(filePath: string): Result<string> {
    return captureResult(() => fs.readFileSync(this.resolveAbsolutePath(filePath), 'utf8'));
  }

  /**
   * {@inheritDoc IFileTreeAccessors.getChildren}
   */
  public getChildren(dirPath: string): Result<ReadonlyArray<FileTreeItem>> {
    return captureResult(() => {
      const children: FileTreeItem[] = [];
      const files = fs.readdirSync(this.resolveAbsolutePath(dirPath), { withFileTypes: true });
      files.forEach((file) => {
        const fullPath = this.resolveAbsolutePath(dirPath, file.name);
        if (file.isDirectory()) {
          children.push(DirectoryItem.create(fullPath, this).orThrow());
        } else if (file.isFile()) {
          children.push(FileItem.create(fullPath, this).orThrow());
        }
      });
      return children;
    });
  }
}
