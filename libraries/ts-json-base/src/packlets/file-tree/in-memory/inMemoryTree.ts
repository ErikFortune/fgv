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

import { captureResult, fail, Result, succeed } from '@fgv/ts-utils';
import { DirectoryItem } from '../directoryItem';
import { FileItem } from '../fileItem';
import { FileTreeItem, IFileTreeAccessors, IFileTreeInitParams } from '../fileTreeAccessors';
import { InMemoryDirectory, InMemoryFile, TreeBuilder } from './treeBuilder';

/**
 * Represents a single file in an in-memory {@link FileTree | file tree}.
 * @public
 */
export interface IInMemoryFile<TCT extends string = string> {
  /**
   * The absolute path of the file in the tree.
   */
  readonly path: string;

  /**
   * The contents of the file
   */
  readonly contents: unknown;

  /**
   * The content type of the file.
   */
  readonly contentType?: TCT;
}

/**
 * Implementation of {@link FileTree.IFileTreeAccessors} that uses an in-memory
 * tree to access files and directories.
 * @public
 */
export class InMemoryTreeAccessors<TCT extends string = string> implements IFileTreeAccessors<TCT> {
  private readonly _tree: TreeBuilder<TCT>;
  private readonly _inferContentType: (filePath: string) => Result<TCT | undefined>;

  /**
   * Protected constructor for derived classes.
   * @param files - An array of {@link FileTree.IInMemoryFile | in-memory files} to include in the tree.
   * @param params - Optional params for the tree.
   * @public
   */
  protected constructor(files: IInMemoryFile<TCT>[], params?: IFileTreeInitParams<TCT>) {
    this._tree = TreeBuilder.create<TCT>(params?.prefix).orThrow();
    this._inferContentType = params?.inferContentType ?? FileItem.defaultInferContentType;
    for (const file of files) {
      const contentType = file.contentType ?? this._inferContentType(file.path).orDefault();
      this._tree.addFile(file.path, file.contents, contentType).orThrow();
    }
  }

  /**
   * Creates a new {@link FileTree.InMemoryTreeAccessors | InMemoryTreeAccessors} instance with the supplied
   * in-memory files.
   * @param files - An array of {@link FileTree.IInMemoryFile | in-memory files} to include in the tree.
   * @param prefix - Optional prefix for the tree.
   */
  public static create<TCT extends string = string>(
    files: IInMemoryFile<TCT>[],
    prefix?: string
  ): Result<InMemoryTreeAccessors<TCT>>;

  /**
   * Creates a new {@link FileTree.InMemoryTreeAccessors | InMemoryTreeAccessors} instance with the supplied
   * in-memory files.
   * @param files - An array of {@link FileTree.IInMemoryFile | in-memory files} to include in the tree.
   * @param params - Optional params for the tree.
   */
  public static create<TCT extends string = string>(
    files: IInMemoryFile<TCT>[],
    params?: IFileTreeInitParams<TCT>
  ): Result<InMemoryTreeAccessors<TCT>>;

  /**
   * Creates a new {@link FileTree.InMemoryTreeAccessors | InMemoryTreeAccessors} instance with the supplied
   * in-memory files.
   * @param files - An array of {@link FileTree.IInMemoryFile | in-memory files} to include in the tree.
   * @param params - Optional params for the tree.
   */
  public static create<TCT extends string = string>(
    files: IInMemoryFile<TCT>[],
    params?: IFileTreeInitParams<TCT> | string
  ): Result<InMemoryTreeAccessors<TCT>> {
    /* c8 ignore next 2 - tested but code coverage has intermittent issues */
    params = typeof params === 'string' ? { prefix: params } : params;
    return captureResult(() => new InMemoryTreeAccessors(files, params));
  }

  /**
   * {@inheritdoc FileTree.IFileTreeAccessors.resolveAbsolutePath}
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
   * {@inheritdoc FileTree.IFileTreeAccessors.getItem}
   */
  public getItem(itemPath: string): Result<FileTreeItem<TCT>> {
    const existing = this._tree.byAbsolutePath.get(itemPath);
    if (existing) {
      if (existing instanceof InMemoryFile) {
        return FileItem.create<TCT>(existing.absolutePath, this);
      } else if (existing instanceof InMemoryDirectory) {
        return DirectoryItem.create<TCT>(existing.absolutePath, this);
      }
    }
    return fail(`${itemPath}: not found`);
  }

  /**
   * {@inheritdoc FileTree.IFileTreeAccessors.getFileContents}
   */
  public getFileContents(path: string): Result<string> {
    const item = this._tree.byAbsolutePath.get(path);
    if (item === undefined) {
      return fail(`${path}: not found`);
    }
    /* c8 ignore next 3 - local coverage is 100% but build coverage has intermittent issues */
    if (!(item instanceof InMemoryFile)) {
      return fail(`${path}: not a file`);
    }
    // if the body is a string we don't want to add quotes
    if (typeof item.contents === 'string') {
      return succeed(item.contents);
    }
    /* c8 ignore next 2 - local coverage is 100% but build coverage has intermittent issues */
    return captureResult(() => JSON.stringify(item.contents));
  }

  /**
   * {@inheritdoc FileTree.IFileTreeAccessors.getFileContentType}
   */
  public getFileContentType(path: string, provided?: string): Result<TCT | undefined> {
    // If provided contentType is given, use it directly (highest priority)
    if (provided !== undefined) {
      return succeed(provided as TCT);
    }

    const item = this._tree.byAbsolutePath.get(path);
    if (item === undefined) {
      // If file doesn't exist, still try to infer content type from path
      return this._inferContentType(path);
    }
    if (!(item instanceof InMemoryFile)) {
      // For directories, return undefined
      return succeed(undefined);
    }
    // Return stored contentType if it exists, otherwise infer
    if (item.contentType !== undefined) {
      return succeed(item.contentType);
    }
    return this._inferContentType(path);
  }

  /**
   * {@inheritdoc FileTree.IFileTreeAccessors.getChildren}
   */
  public getChildren(path: string): Result<ReadonlyArray<FileTreeItem<TCT>>> {
    const item = this._tree.byAbsolutePath.get(path);
    if (item === undefined) {
      return fail(`${path}: not found`);
    }
    /* c8 ignore next 3 - local coverage is 100% but build coverage has intermittent issues */
    if (!(item instanceof InMemoryDirectory)) {
      return fail(`${path}: not a directory`);
    }
    return captureResult(() => {
      const children: FileTreeItem<TCT>[] = [];
      for (const child of item.children.values()) {
        if (child instanceof InMemoryFile) {
          children.push(FileItem.create<TCT>(child.absolutePath, this).orThrow());
        } else if (child instanceof InMemoryDirectory) {
          children.push(DirectoryItem.create<TCT>(child.absolutePath, this).orThrow());
        }
      }
      return children;
    });
  }
}
