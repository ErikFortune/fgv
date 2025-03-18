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

import { captureResult, fail, Result } from '../../base';
import { DirectoryItem } from '../directoryItem';
import { FileItem } from '../fileItem';
import { FileTreeItem, IFileTreeAccessors } from '../fileTreeAccessors';
import { InMemoryDirectory, InMemoryFile, TreeBuilder } from './treeBuilder';

/**
 * Represents a single file in an in-memory {@link FileTree.FileTree | file tree}.
 * @public
 */
export interface IInMemoryFile {
  /**
   * The absolute path of the file in the tree.
   */
  readonly path: string;

  /**
   * The contents of the file
   */
  readonly contents: unknown;
}

/**
 * Implementation of {@link FileTree.IFileTreeAccessors | IFileTreeAccessors} that uses an in-memory
 * tree to access files and directories.
 * @public
 */
export class InMemoryTreeAccessors implements IFileTreeAccessors {
  private readonly _tree: TreeBuilder;

  /**
   * Protected constructor for derived classes.
   * @param files - An array of {@link IInMemoryFile | in-memory files} to include in the tree.
   * @param prefix - Optional prefix for the tree.
   * @public
   */
  protected constructor(files: IInMemoryFile[], prefix?: string) {
    this._tree = TreeBuilder.create(prefix).orThrow();
    for (const file of files) {
      this._tree.addFile(file.path, file.contents).orThrow();
    }
  }

  /**
   * Creates a new {@link InMemoryTreeAccessors | InMemoryTreeAccessors} instance with the supplied
   * in-memory files.
   * @param files - An array of {@link IInMemoryFile | in-memory files} to include in the tree.
   * @param prefix - Optional prefix for the tree.
   */
  public static create(files: IInMemoryFile[], prefix?: string): Result<InMemoryTreeAccessors> {
    return captureResult(() => new InMemoryTreeAccessors(files, prefix));
  }

  /**
   * {@inheritDoc FileTree.IFileTreeAccessors.resolveAbsolutePath}
   */
  public resolveAbsolutePath(...paths: string[]): string {
    const parts = paths[0].startsWith('/') ? paths : [this._tree.prefix, ...paths];
    const joined = parts.flatMap((p) => p.split('/').filter((s) => s.length > 0)).join('/');
    return `/${joined}`;
  }

  /**
   * {@inheritdoc FileTree.IFileTreeAccessors.getExtension}
   */
  public getExtension(path: string): string {
    const parts = path.split('.');
    if (parts.length === 1) {
      return '';
    }
    return `.${parts.pop()}`;
  }

  /**
   * {@inheritdoc FileTree.IFileTreeAccessors.getBaseName}
   */
  public getBaseName(path: string, suffix?: string): string {
    /* c8 ignore next 1 - ?? is defense in depth should never happen */
    const base = path.split('/').pop() ?? '';
    if (suffix && base.endsWith(suffix)) {
      return base.slice(0, base.length - suffix.length);
    }
    return base;
  }

  /**
   * {@inheritdoc FileTree.IFileTreeAccessors.joinPaths}
   */
  public joinPaths(...paths: string[]): string {
    return paths.join('/');
  }

  /**
   * {@inheritDoc FileTree.IFileTreeAccessors.getItem}
   */
  public getItem(itemPath: string): Result<FileTreeItem> {
    const existing = this._tree.byAbsolutePath.get(itemPath);
    if (existing) {
      if (existing instanceof InMemoryFile) {
        return FileItem.create(existing.absolutePath, this);
      } else if (existing instanceof InMemoryDirectory) {
        return DirectoryItem.create(existing.absolutePath, this);
      }
    }
    return fail(`${itemPath}: not found`);
  }

  /**
   * {@inheritDoc FileTree.IFileTreeAccessors.getFileContents}
   */
  public getFileContents(path: string): Result<string> {
    const item = this._tree.byAbsolutePath.get(path);
    if (item === undefined) {
      return fail(`${path}: not found`);
    }
    if (!(item instanceof InMemoryFile)) {
      return fail(`${path}: not a file`);
    }
    return captureResult(() => JSON.stringify(item.contents));
  }

  /**
   * {@inheritDoc FileTree.IFileTreeAccessors.getChildren}
   */
  public getChildren(path: string): Result<ReadonlyArray<FileTreeItem>> {
    const item = this._tree.byAbsolutePath.get(path);
    if (item === undefined) {
      return fail(`${path}: not found`);
    }
    if (!(item instanceof InMemoryDirectory)) {
      return fail(`${path}: not a directory`);
    }
    return captureResult(() => {
      const children: FileTreeItem[] = [];
      for (const child of item.children.values()) {
        if (child instanceof InMemoryFile) {
          children.push(FileItem.create(child.absolutePath, this).orThrow());
        } else if (child instanceof InMemoryDirectory) {
          children.push(DirectoryItem.create(child.absolutePath, this).orThrow());
        }
      }
      return children;
    });
  }
}
