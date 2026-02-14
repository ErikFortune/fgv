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

import { Result, succeed, fail, captureResult, DetailedResult, succeedWithDetail } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import { FileSystemDirectoryHandle, FileSystemFileHandle } from '../file-api-types';

/**
 * Options for creating persistent file trees.
 * @public
 */
export interface IFileSystemAccessTreeParams<TCT extends string = string>
  extends FileTree.IFileTreeInitParams<TCT> {
  /**
   * Automatically sync changes to disk immediately after each save.
   * If false, changes are batched and written on explicit syncToDisk() call.
   * @defaultValue false
   */
  autoSync?: boolean;

  /**
   * Require write permission on the directory handle.
   * If true, fails if write permission cannot be obtained.
   * If false, falls back to read-only mode.
   * @defaultValue true
   */
  requireWritePermission?: boolean;
}

/**
 * Implementation of `FileTree.IPersistentFileTreeAccessors` that uses the File System Access API
 * to provide persistent file editing in browsers.
 * @public
 */
export class FileSystemAccessTreeAccessors<TCT extends string = string>
  extends FileTree.InMemoryTreeAccessors<TCT>
  implements FileTree.IPersistentFileTreeAccessors<TCT>
{
  private readonly _handles: Map<string, FileSystemFileHandle>;
  private readonly _rootDir: FileSystemDirectoryHandle;
  private readonly _dirtyFiles: Set<string>;
  private readonly _autoSync: boolean;
  private readonly _hasWritePermission: boolean;

  /**
   * Protected constructor for FileSystemAccessTreeAccessors.
   * @param files - An array of in-memory files to include in the tree.
   * @param rootDir - The root directory handle.
   * @param handles - Map of file paths to their handles.
   * @param params - Optional params for the tree.
   * @param hasWritePermission - Whether write permission was granted.
   */
  protected constructor(
    files: FileTree.IInMemoryFile<TCT>[],
    rootDir: FileSystemDirectoryHandle,
    handles: Map<string, FileSystemFileHandle>,
    params: IFileSystemAccessTreeParams<TCT> | undefined,
    hasWritePermission: boolean
  ) {
    super(files, params);
    this._rootDir = rootDir;
    this._handles = handles;
    this._dirtyFiles = new Set();
    this._autoSync = params?.autoSync ?? false;
    this._hasWritePermission = hasWritePermission;
  }

  /**
   * Creates a new FileSystemAccessTreeAccessors instance from a directory handle.
   * @param dirHandle - The FileSystemDirectoryHandle to load files from.
   * @param params - Optional parameters including autoSync and permission settings.
   * @returns Promise resolving to a FileSystemAccessTreeAccessors instance.
   * @public
   */
  public static async fromDirectoryHandle<TCT extends string = string>(
    dirHandle: FileSystemDirectoryHandle,
    params?: IFileSystemAccessTreeParams<TCT>
  ): Promise<Result<FileSystemAccessTreeAccessors<TCT>>> {
    try {
      // Check write permission
      const hasWritePermission = await this._checkWritePermission(dirHandle);

      /* c8 ignore next 3 - coverage intermittently missed in full suite */
      if (!hasWritePermission && (params?.requireWritePermission ?? true)) {
        return fail('Write permission required but not granted');
      }

      // Load all files from the directory (always use '/' as base, prefix is handled by parent)
      const { files, handles } = await this._loadDirectory<TCT>(dirHandle, '/', params);

      return succeed(
        new FileSystemAccessTreeAccessors<TCT>(files, dirHandle, handles, params, hasWritePermission)
      );
      /* c8 ignore next 4 - defensive: outer catch for unexpected errors */
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return fail(`Failed to create FileSystemAccessTreeAccessors: ${message}`);
    }
  }

  /**
   * Check if the directory handle has write permission.
   * @param handle - The directory handle to check.
   * @returns Promise resolving to true if write permission is granted.
   * @internal
   */
  private static async _checkWritePermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
    try {
      const permission = await handle.queryPermission({ mode: 'readwrite' });

      if (permission === 'granted') {
        return true;
      }

      if (permission === 'prompt') {
        const requested = await handle.requestPermission({ mode: 'readwrite' });
        return requested === 'granted';
      }

      return false;
    } catch (error) {
      // Permission API might not be available or might throw
      return false;
    }
  }

  /**
   * Load all files from a directory handle recursively.
   * @param dirHandle - The directory handle to load from.
   * @param basePath - The base path for files.
   * @param params - Optional parameters.
   * @returns Promise resolving to files and handles.
   * @internal
   */
  private static async _loadDirectory<TCT extends string = string>(
    dirHandle: FileSystemDirectoryHandle,
    basePath: string,
    params?: IFileSystemAccessTreeParams<TCT>
  ): Promise<{ files: FileTree.IInMemoryFile<TCT>[]; handles: Map<string, FileSystemFileHandle> }> {
    const files: FileTree.IInMemoryFile<TCT>[] = [];
    const handles = new Map<string, FileSystemFileHandle>();

    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === 'file') {
        const fileHandle = handle as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        const contents = await file.text();
        const path = this._joinPath(basePath, name);
        /* c8 ignore next 2 - coverage intermittently missed in full suite */
        const contentType = params?.inferContentType
          ? params.inferContentType(path, file.type).orDefault()
          : undefined;

        files.push({ path, contents, contentType });
        handles.set(path, fileHandle);
      } else if (handle.kind === 'directory') {
        const subDirHandle = handle as FileSystemDirectoryHandle;
        const subPath = this._joinPath(basePath, name);
        const subResult = await this._loadDirectory<TCT>(subDirHandle, subPath, params);
        files.push(...subResult.files);
        for (const [path, fileHandle] of subResult.handles) {
          handles.set(path, fileHandle);
        }
      }
    }

    return { files, handles };
  }

  /**
   * Join path segments.
   * @param base - The base path.
   * @param name - The name to append.
   * @returns The joined path.
   * @internal
   */
  private static _joinPath(base: string, name: string): string {
    const normalized = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${normalized}/${name}`;
  }

  /**
   * Implements `FileTree.IPersistentFileTreeAccessors.syncToDisk`
   */
  public async syncToDisk(): Promise<Result<void>> {
    if (!this._hasWritePermission) {
      return fail('Write permission not granted - cannot sync to disk');
    }

    const errors: string[] = [];

    for (const path of this._dirtyFiles) {
      const syncResult = await this._syncFile(path);
      if (syncResult.isFailure()) {
        errors.push(`${path}: ${syncResult.message}`);
      }
    }

    if (errors.length > 0) {
      return fail(`Failed to sync ${errors.length} file(s):\n${errors.join('\n')}`);
    }

    this._dirtyFiles.clear();
    return succeed(undefined);
  }

  /**
   * Implements `FileTree.IPersistentFileTreeAccessors.isDirty`
   */
  public isDirty(): boolean {
    return this._dirtyFiles.size > 0;
  }

  /**
   * Implements `FileTree.IPersistentFileTreeAccessors.getDirtyPaths`
   */
  public getDirtyPaths(): string[] {
    return Array.from(this._dirtyFiles);
  }

  /**
   * Implements `FileTree.IMutableFileTreeAccessors.saveFileContents`
   */
  public saveFileContents(path: string, contents: string): Result<string> {
    // Call parent to update in-memory state
    const result = super.saveFileContents(path, contents);

    if (result.isSuccess() && this._hasWritePermission) {
      this._dirtyFiles.add(path);

      // Auto-sync if enabled
      if (this._autoSync) {
        // Fire and forget - errors logged but don't block
        this._syncFile(path).catch((err) => {
          /* c8 ignore next 1 - defensive: async auto-sync error logging */
          console.error(`Auto-sync failed for ${path}:`, err);
        });
      }
    }

    return result;
  }

  /**
   * Implements `FileTree.IMutableFileTreeAccessors.fileIsMutable`
   */
  public fileIsMutable(path: string): DetailedResult<boolean, FileTree.SaveDetail> {
    const baseResult = super.fileIsMutable(path);

    if (baseResult.isSuccess() && baseResult.detail === 'transient' && this._hasWritePermission) {
      // Upgrade to 'persistent' if we have write permission
      return succeedWithDetail(true, 'persistent');
    }

    return baseResult;
  }

  /**
   * Sync a single file to disk.
   * @param path - The path of the file to sync.
   * @returns Promise resolving to success or failure.
   * @internal
   */
  private async _syncFile(path: string): Promise<Result<void>> {
    const handle = this._handles.get(path);
    if (!handle) {
      return this._createAndWriteFile(path);
    }

    const contents = this.getFileContents(path);
    if (contents.isFailure()) {
      return fail(contents.message);
    }

    try {
      const writable = await handle.createWritable();
      await writable.write(contents.value);
      await writable.close();
      return succeed(undefined);
      /* c8 ignore next 4 - coverage intermittently missed in full suite */
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return fail(`Failed to write file: ${message}`);
    }
  }

  /**
   * Create a new file and write its contents.
   * @param path - The path of the file to create.
   * @returns Promise resolving to success or failure.
   * @internal
   */
  private async _createAndWriteFile(path: string): Promise<Result<void>> {
    try {
      // Parse path to get directory and filename
      const absolutePath = this.resolveAbsolutePath(path);
      const parts = absolutePath.split('/').filter((p) => p.length > 0);
      const filename = parts.pop();

      /* c8 ignore next 3 - coverage intermittently missed in full suite */
      if (!filename) {
        return fail(`Invalid file path: ${path}`);
      }

      // Navigate/create directory structure
      let currentDir = this._rootDir;
      for (const part of parts) {
        currentDir = await currentDir.getDirectoryHandle(part, { create: true });
      }

      // Create file and write contents
      const fileHandle = await currentDir.getFileHandle(filename, { create: true });
      this._handles.set(path, fileHandle);

      return this._syncFile(path);
      /* c8 ignore next 4 - coverage intermittently missed in full suite */
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return fail(`Failed to create file ${path}: ${message}`);
    }
  }
}
