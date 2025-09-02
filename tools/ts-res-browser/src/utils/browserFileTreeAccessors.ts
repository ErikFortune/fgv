import { Result, succeed, fail, FileTree } from '@fgv/ts-utils';
import { ImportedDirectory, ImportedFile } from './fileImport';

/**
 * Custom FileTreeAccessors implementation for browser environment
 * that preserves directory structure for ts-res qualifier extraction
 */
export class BrowserFileTreeAccessors implements FileTree.IFileTreeAccessors {
  private readonly rootDirectory: ImportedDirectory;
  private readonly pathSeparator = '/';

  constructor(rootDirectory: ImportedDirectory) {
    this.rootDirectory = rootDirectory;
  }

  public static create(rootDirectory: ImportedDirectory): Result<BrowserFileTreeAccessors> {
    try {
      return succeed(new BrowserFileTreeAccessors(rootDirectory));
    } catch (error) {
      return fail(
        `Failed to create BrowserFileTreeAccessors: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Path manipulation methods (browser-compatible, no Node.js dependencies)
  public resolveAbsolutePath(...paths: string[]): string {
    // Start with root path or first absolute path
    let result = '';

    for (const path of paths) {
      if (!path) continue;

      if (path.startsWith('/')) {
        // Absolute path - replace current result
        result = path;
      } else {
        // Relative path - append to current result
        result = this.joinPaths(result, path);
      }
    }

    // Ensure it starts with / (absolute)
    if (!result.startsWith('/')) {
      result = '/' + result;
    }

    return this.normalizePath(result);
  }

  public getExtension(path: string): string {
    const baseName = this.getBaseName(path);
    const lastDot = baseName.lastIndexOf('.');
    return lastDot === -1 ? '' : baseName.substring(lastDot);
  }

  public getBaseName(path: string, suffix?: string): string {
    if (!path) return '';

    // Remove trailing slashes
    const normalizedPath = path.replace(/\/+$/, '');

    // Get the last segment
    const lastSlash = normalizedPath.lastIndexOf('/');
    let baseName = lastSlash === -1 ? normalizedPath : normalizedPath.substring(lastSlash + 1);

    // Remove suffix if provided
    if (suffix && baseName.endsWith(suffix)) {
      baseName = baseName.substring(0, baseName.length - suffix.length);
    }

    return baseName;
  }

  public joinPaths(...paths: string[]): string {
    if (paths.length === 0) return '';

    const parts: string[] = [];

    for (const path of paths) {
      if (!path) continue;

      // Split by separator and filter empty parts
      const pathParts = path.split(this.pathSeparator).filter((part) => part.length > 0);
      parts.push(...pathParts);
    }

    return '/' + parts.join(this.pathSeparator);
  }

  // File system access methods
  public getItem(path: string): Result<FileTree.FileTreeItem> {
    try {
      const absolutePath = this.ensureAbsolute(path);
      const result = this.findItemAtPath(absolutePath);

      if (!result) {
        return fail(`Item not found at path: ${absolutePath}`);
      }

      if (result.type === 'file') {
        return FileTree.FileItem.create(absolutePath, this);
      } else {
        return FileTree.DirectoryItem.create(absolutePath, this);
      }
    } catch (error) {
      return fail(`Failed to get item: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public getFileContents(path: string): Result<string> {
    try {
      const absolutePath = this.ensureAbsolute(path);
      const result = this.findItemAtPath(absolutePath);

      if (!result) {
        return fail(`File not found at path: ${absolutePath}`);
      }

      if (result.type !== 'file') {
        return fail(`Path is not a file: ${absolutePath}`);
      }

      const file = result.item as ImportedFile;
      return succeed(file.content);
    } catch (error) {
      return fail(`Failed to get file contents: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public getChildren(path: string): Result<ReadonlyArray<FileTree.FileTreeItem>> {
    try {
      const absolutePath = this.ensureAbsolute(path);
      const result = this.findItemAtPath(absolutePath);

      if (!result) {
        return fail(`Directory not found at path: ${absolutePath}`);
      }

      if (result.type !== 'directory') {
        return fail(`Path is not a directory: ${absolutePath}`);
      }

      const directory = result.item as ImportedDirectory;
      const children: FileTree.FileTreeItem[] = [];

      // Add files
      for (const file of directory.files) {
        const childPath = this.joinPaths(absolutePath, file.name);
        const fileItemResult = FileTree.FileItem.create(childPath, this);

        if (fileItemResult.isSuccess()) {
          children.push(fileItemResult.value);
        }
      }

      // Add subdirectories
      for (const subDirectory of directory.directories) {
        const childPath = this.joinPaths(absolutePath, subDirectory.name);
        const dirItemResult = FileTree.DirectoryItem.create(childPath, this);

        if (dirItemResult.isSuccess()) {
          children.push(dirItemResult.value);
        }
      }

      return succeed(children);
    } catch (error) {
      return fail(`Failed to get children: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Helper methods
  private ensureAbsolute(path: string): string {
    return path.startsWith('/') ? path : '/' + path;
  }

  private normalizePath(path: string): string {
    if (!path) return '/';

    // Split into parts, filter empty ones, and handle . and ..
    const parts = path.split('/').filter((part) => part.length > 0 && part !== '.');
    const normalized: string[] = [];

    for (const part of parts) {
      if (part === '..') {
        if (normalized.length > 0) {
          normalized.pop();
        }
      } else {
        normalized.push(part);
      }
    }

    return '/' + normalized.join('/');
  }

  private findItemAtPath(
    absolutePath: string
  ): { item: ImportedDirectory | ImportedFile; type: 'file' | 'directory' } | null {
    const normalizedPath = this.normalizePath(absolutePath);

    // Handle root path
    if (normalizedPath === '/' || normalizedPath === '') {
      return { item: this.rootDirectory, type: 'directory' };
    }

    // Split path into segments (excluding root slash)
    const segments = normalizedPath
      .substring(1)
      .split('/')
      .filter((seg) => seg.length > 0);

    let currentDir = this.rootDirectory;

    // Navigate through directory segments
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      const subDir = currentDir.directories.find((dir) => dir.name === segment);

      if (!subDir) {
        return null;
      }

      currentDir = subDir;
    }

    // Get the final item (file or directory)
    const finalSegment = segments[segments.length - 1];

    // Check if it's a file
    const file = currentDir.files.find((f) => f.name === finalSegment);
    if (file) {
      return { item: file, type: 'file' };
    }

    // Check if it's a directory
    const directory = currentDir.directories.find((d) => d.name === finalSegment);
    if (directory) {
      return { item: directory, type: 'directory' };
    }

    return null;
  }
}
