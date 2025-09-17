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

import { Result, captureResult, fail, succeed } from '@fgv/ts-utils';

/**
 * Represents a file in an in-memory file tree.
 * @public
 */
export class InMemoryFile {
  /**
   * The absolute path of the file.
   */
  public readonly absolutePath: string;
  /**
   * The contents of the file.
   */
  public readonly contents: unknown;

  /**
   * Creates a new {@link InMemoryFile | InMemoryFile} instance.
   * @param absolutePath - The absolute path of the file.
   * @param contents - The contents of the file.
   */
  public constructor(absolutePath: string, contents: unknown) {
    this.absolutePath = absolutePath;
    this.contents = contents;
  }
}

/**
 * Represents a directory in an in-memory file tree.
 * @public
 */
export class InMemoryDirectory {
  /**
   * The absolute path of the directory.
   */
  public readonly absolutePath: string;
  protected _children: Map<string, InMemoryDirectory | InMemoryFile>;

  /**
   * The children of the directory.
   */
  public get children(): ReadonlyMap<string, InMemoryDirectory | InMemoryFile> {
    return this._children;
  }

  /**
   * Creates an empty new {@link InMemoryDirectory | InMemoryDirectory} instance.
   * @param absolutePath - The absolute path of the directory.
   */
  public constructor(absolutePath: string) {
    this.absolutePath = absolutePath;
    this._children = new Map<string, InMemoryDirectory | InMemoryFile>();
  }

  /**
   * Gets or adds a child directory with the specified name.
   * @param name - The name of the child directory.
   * @returns {@link Success | Success} with the child directory if successful, or
   * {@link Failure | Failure} with an error message otherwise.
   */
  public getOrAddDirectory(name: string): Result<InMemoryDirectory> {
    const existing = this._children.get(name);
    if (existing) {
      if (existing instanceof InMemoryDirectory) {
        return succeed(existing);
      }
      return fail(`${name}: not a directory`);
    }
    const child = new InMemoryDirectory(this.getChildPath(name));
    this._children.set(name, child);
    return succeed(child);
  }

  /**
   * Adds a file to the directory.
   * @param name - The name of the file.
   * @param contents - The contents of the file.
   * @returns {@link Success | Success} with the new file if successful, or
   * {@link Failure | Failure} with an error message otherwise.
   */
  public addFile(name: string, contents: unknown): Result<InMemoryFile> {
    if (this._children.has(name)) {
      return fail(`${name}: already exists`);
    }
    const child = new InMemoryFile(this.getChildPath(name), contents);
    this._children.set(name, child);
    return succeed(child);
  }

  /**
   * Gets the absolute path for a child of this directory with the supplied
   * name.
   * @param name - The name of the child.
   * @returns {@link Success | Success} with the absolute path if successful, or
   * {@link Failure | Failure} with an error message otherwise.
   */
  public getChildPath(name: string): string {
    if (this.absolutePath === '/') {
      return `/${name}`;
    }
    return [this.absolutePath, name].join('/');
  }
}

/**
 * Helper class to build an in-memory file tree.
 * @public
 */
export class TreeBuilder {
  /**
   * The prefix for all paths in the tree.
   */
  public readonly prefix: string;

  /**
   * The root directory of the tree.
   */
  public readonly root: InMemoryDirectory;

  /**
   * A map of all directories and files in the tree by absolute path.
   */
  public readonly byAbsolutePath: Map<string, InMemoryDirectory | InMemoryFile>;

  /**
   * Protected constructor for derived classes.
   * @param prefix - The prefix for all paths in the tree.
   * @public
   */
  protected constructor(prefix?: string) {
    this.prefix = prefix ?? '/';
    if (!this.prefix.startsWith('/')) {
      throw new Error(`${prefix}: not an absolute path`);
    }

    // Normalize the prefix to remove trailing slashes (except for root)
    if (this.prefix !== '/' && this.prefix.endsWith('/')) {
      this.prefix = this.prefix.slice(0, -1);
    }

    this.root = new InMemoryDirectory(this.prefix);
    this.byAbsolutePath = new Map<string, InMemoryDirectory | InMemoryFile>();
    this.byAbsolutePath.set(this.prefix, this.root);
  }

  /**
   * Creates a new {@link TreeBuilder | TreeBuilder} instance.
   * @param prefix - The prefix for all paths in the tree.
   * @returns {@link Success | Success} with the new {@link TreeBuilder | TreeBuilder} instance if successful,
   * or {@link Failure | Failure} with an error message otherwise.
   * @public
   */
  public static create(prefix?: string): Result<TreeBuilder> {
    return captureResult(() => new TreeBuilder(prefix));
  }

  /**
   * Adds a file to the tree.
   * @param absolutePath - The absolute path of the file.
   * @param contents - The contents of the file.
   * @returns {@link Success | Success} with the new file if successful, or
   * {@link Failure | Failure} with an error message otherwise.
   * @public
   */
  public addFile(absolutePath: string, contents: unknown): Result<InMemoryFile> {
    const parts = absolutePath.split('/').filter((p) => p.length > 0);
    if (parts.length === 0) {
      return fail(`${absolutePath}: invalid file path`);
    }
    let dir = this.root;
    while (parts.length > 1) {
      const part = parts.shift()!;
      const result = dir.getOrAddDirectory(part);
      if (result.isFailure()) {
        return fail(result.message);
      }
      dir = result.value;
      if (!this.byAbsolutePath.has(dir.absolutePath)) {
        this.byAbsolutePath.set(dir.absolutePath, dir);
      }
    }
    return dir.addFile(parts[0], contents).onSuccess((file: InMemoryFile) => {
      this.byAbsolutePath.set(file.absolutePath, file);
      return succeed(file);
    });
  }
}
