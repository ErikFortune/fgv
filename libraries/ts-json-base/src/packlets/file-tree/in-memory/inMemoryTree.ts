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
  captureResult,
  DetailedResult,
  fail,
  failWithDetail,
  Result,
  succeed,
  succeedWithDetail
} from '@fgv/ts-utils';
import { DirectoryItem } from '../directoryItem';
import { FileItem } from '../fileItem';
import {
  FileTreeItem,
  IFileTreeInitParams,
  IFilterSpec,
  IMutableFileTreeAccessors,
  SaveDetail
} from '../fileTreeAccessors';
import { InMemoryDirectory, InMemoryFile, TreeBuilder } from './treeBuilder';
import { isPathMutable } from '../filterSpec';

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
 * A mutable in-memory file that allows updating contents.
 * @internal
 */
class MutableInMemoryFile<TCT extends string = string> {
  public readonly absolutePath: string;
  public readonly contentType?: TCT;
  private _contents: unknown;

  public constructor(absolutePath: string, contents: unknown, contentType?: TCT) {
    this.absolutePath = absolutePath;
    this._contents = contents;
    this.contentType = contentType;
  }

  public get contents(): unknown {
    return this._contents;
  }

  public setContents(contents: unknown): void {
    this._contents = contents;
  }
}

/**
 * A mutable in-memory directory that creates mutable files.
 * @internal
 */
class MutableInMemoryDirectory<TCT extends string = string> {
  public readonly absolutePath: string;
  protected _children: Map<string, MutableInMemoryDirectory<TCT> | MutableInMemoryFile<TCT>>;

  /* c8 ignore next 3 - internal getter used by tree traversal */
  public get children(): ReadonlyMap<string, MutableInMemoryDirectory<TCT> | MutableInMemoryFile<TCT>> {
    return this._children;
  }

  public constructor(absolutePath: string) {
    this.absolutePath = absolutePath;
    this._children = new Map();
  }

  public getChildPath(name: string): string {
    if (this.absolutePath === '/') {
      return `/${name}`;
    }
    return [this.absolutePath, name].join('/');
  }

  public addFile(name: string, contents: unknown, contentType?: TCT): Result<MutableInMemoryFile<TCT>> {
    /* c8 ignore next 3 - defensive: duplicate detection during construction */
    if (this._children.has(name)) {
      return fail(`${name}: already exists`);
    }
    const child = new MutableInMemoryFile<TCT>(this.getChildPath(name), contents, contentType);
    this._children.set(name, child);
    return succeed(child);
  }

  public getOrAddDirectory(name: string): Result<MutableInMemoryDirectory<TCT>> {
    const existing = this._children.get(name);
    if (existing) {
      if (existing instanceof MutableInMemoryDirectory) {
        return succeed(existing);
      }
      return fail(`${name}: not a directory`);
    }
    const child = new MutableInMemoryDirectory<TCT>(this.getChildPath(name));
    this._children.set(name, child);
    return succeed(child);
  }

  public updateOrAddFile(
    name: string,
    contents: unknown,
    contentType?: TCT
  ): Result<MutableInMemoryFile<TCT>> {
    const existing = this._children.get(name);
    if (existing) {
      if (existing instanceof MutableInMemoryFile) {
        existing.setContents(contents);
        return succeed(existing);
      }
      return fail(`${name}: not a file`);
    }
    return this.addFile(name, contents, contentType);
  }
}

/**
 * Implementation of {@link FileTree.IMutableFileTreeAccessors} that uses an in-memory
 * tree to access and modify files and directories.
 * @public
 */
export class InMemoryTreeAccessors<TCT extends string = string> implements IMutableFileTreeAccessors<TCT> {
  private readonly _tree: TreeBuilder<TCT>;
  private readonly _inferContentType: (filePath: string) => Result<TCT | undefined>;
  private readonly _mutable: boolean | IFilterSpec;
  private readonly _mutableByPath: Map<string, MutableInMemoryDirectory<TCT> | MutableInMemoryFile<TCT>>;
  private readonly _mutableRoot: MutableInMemoryDirectory<TCT>;

  /**
   * Protected constructor for derived classes.
   * @param files - An array of {@link FileTree.IInMemoryFile | in-memory files} to include in the tree.
   * @param params - Optional params for the tree.
   * @public
   */
  protected constructor(files: IInMemoryFile<TCT>[], params?: IFileTreeInitParams<TCT>) {
    this._tree = TreeBuilder.create<TCT>(params?.prefix).orThrow();
    this._inferContentType = params?.inferContentType ?? FileItem.defaultInferContentType;
    this._mutable = params?.mutable ?? false;
    this._mutableByPath = new Map();
    const prefix = params?.prefix ?? '/';
    this._mutableRoot = new MutableInMemoryDirectory<TCT>(
      prefix.endsWith('/') ? prefix.slice(0, -1) || '/' : prefix
    );
    this._mutableByPath.set(this._mutableRoot.absolutePath, this._mutableRoot);

    for (const file of files) {
      const contentType = file.contentType ?? this._inferContentType(file.path).orDefault();
      this._tree.addFile(file.path, file.contents, contentType).orThrow();
      this._addMutableFile(file.path, file.contents, contentType);
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
   * {@inheritDoc FileTree.IFileTreeAccessors.resolveAbsolutePath}
   */
  public resolveAbsolutePath(...paths: string[]): string {
    const parts = paths[0].startsWith('/') ? paths : [this._tree.prefix, ...paths];
    const joined = parts.flatMap((p) => p.split('/').filter((s) => s.length > 0)).join('/');
    return `/${joined}`;
  }

  /**
   * {@inheritDoc FileTree.IFileTreeAccessors.getExtension}
   */
  public getExtension(path: string): string {
    const parts = path.split('.');
    if (parts.length === 1) {
      return '';
    }
    return `.${parts.pop()}`;
  }

  /**
   * {@inheritDoc FileTree.IFileTreeAccessors.getBaseName}
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
   * {@inheritDoc FileTree.IFileTreeAccessors.joinPaths}
   */
  public joinPaths(...paths: string[]): string {
    return paths.join('/');
  }

  /**
   * {@inheritDoc FileTree.IFileTreeAccessors.getItem}
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
   * {@inheritDoc FileTree.IFileTreeAccessors.getFileContents}
   */
  public getFileContents(path: string): Result<string> {
    const absolutePath = this.resolveAbsolutePath(path);
    const item = this._mutableByPath.get(absolutePath);
    if (item === undefined) {
      return fail(`${absolutePath}: not found`);
    }
    if (!(item instanceof MutableInMemoryFile)) {
      return fail(`${absolutePath}: not a file`);
    }
    if (typeof item.contents === 'string') {
      return succeed(item.contents);
    }
    return captureResult(() => JSON.stringify(item.contents));
  }

  /**
   * {@inheritDoc FileTree.IFileTreeAccessors.getFileContentType}
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
   * {@inheritDoc FileTree.IFileTreeAccessors.getChildren}
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

  private _addMutableFile(
    path: string,
    contents: unknown,
    contentType?: TCT
  ): Result<MutableInMemoryFile<TCT>> {
    const absolutePath = this.resolveAbsolutePath(path);
    const parts = absolutePath.split('/').filter((p) => p.length > 0);
    /* c8 ignore next 3 - defensive: invalid path detection */
    if (parts.length === 0) {
      return fail(`${absolutePath}: invalid file path`);
    }

    let dir: MutableInMemoryDirectory<TCT> = this._mutableRoot;
    while (parts.length > 1) {
      const part = parts.shift()!;
      const result = dir.getOrAddDirectory(part);
      /* c8 ignore next 3 - defensive: directory conflict during construction */
      if (result.isFailure()) {
        return fail(result.message);
      }
      dir = result.value as MutableInMemoryDirectory<TCT>;
      if (!this._mutableByPath.has(dir.absolutePath)) {
        this._mutableByPath.set(dir.absolutePath, dir);
      }
    }

    return dir.addFile(parts[0], contents, contentType).onSuccess((file) => {
      this._mutableByPath.set(file.absolutePath, file as MutableInMemoryFile<TCT>);
      return succeed(file as MutableInMemoryFile<TCT>);
    });
  }

  /**
   * {@inheritDoc FileTree.IMutableFileTreeAccessors.fileIsMutable}
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

    return succeedWithDetail(true, 'transient');
  }

  /**
   * {@inheritDoc FileTree.IMutableFileTreeAccessors.saveFileContents}
   */
  public saveFileContents(path: string, contents: string): Result<string> {
    const isMutable = this.fileIsMutable(path);
    if (isMutable.isFailure()) {
      return fail(isMutable.message);
    }

    const absolutePath = this.resolveAbsolutePath(path);
    const parts = absolutePath.split('/').filter((p) => p.length > 0);
    if (parts.length === 0) {
      return fail(`${absolutePath}: invalid file path`);
    }

    // Navigate to parent directory, creating directories as needed
    let dir: MutableInMemoryDirectory<TCT> = this._mutableRoot;
    while (parts.length > 1) {
      const part = parts.shift()!;
      const result = dir.getOrAddDirectory(part);
      if (result.isFailure()) {
        return fail(result.message);
      }
      dir = result.value as MutableInMemoryDirectory<TCT>;
      if (!this._mutableByPath.has(dir.absolutePath)) {
        this._mutableByPath.set(dir.absolutePath, dir);
      }
    }

    // Update or add the file
    return dir.updateOrAddFile(parts[0], contents).onSuccess((file) => {
      this._mutableByPath.set(file.absolutePath, file as MutableInMemoryFile<TCT>);
      return succeed(contents);
    });
  }
}
