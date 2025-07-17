import { Result, succeed, fail } from '@fgv/ts-utils';

export interface ImportedFile {
  name: string;
  path: string;
  content: string;
  handle?: FileSystemFileHandle;
}

export interface ImportedDirectory {
  name: string;
  path: string;
  files: ImportedFile[];
  directories: ImportedDirectory[];
}

export interface FileImportOptions {
  acceptedTypes?: string[];
  multiple?: boolean;
  includeDirectories?: boolean;
}

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in window && 'showOpenFilePicker' in window;
}

/**
 * Modern File System Access API implementation
 */
export class ModernFileImporter {
  /**
   * Pick a directory using File System Access API
   */
  async pickDirectory(): Promise<Result<ImportedDirectory>> {
    try {
      if (!isFileSystemAccessSupported()) {
        return fail('File System Access API not supported');
      }

      const directoryHandle = await window.showDirectoryPicker({
        mode: 'read',
        startIn: 'documents'
      });

      const importedDirectory = await this.processDirectoryHandle(directoryHandle);
      return succeed(importedDirectory);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return fail('Directory selection was cancelled');
      }
      return fail(`Failed to pick directory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Pick files using File System Access API
   */
  async pickFiles(options: FileImportOptions = {}): Promise<Result<ImportedFile[]>> {
    try {
      if (!isFileSystemAccessSupported()) {
        return fail('File System Access API not supported');
      }

      const fileHandles = await window.showOpenFilePicker({
        multiple: options.multiple ?? true,
        types: options.acceptedTypes
          ? [
              {
                description: 'Resource files',
                accept: {
                  'application/json': options.acceptedTypes
                }
              }
            ]
          : undefined,
        excludeAcceptAllOption: false
      });

      const importedFiles: ImportedFile[] = [];
      for (const fileHandle of fileHandles) {
        const result = await this.processFileHandle(fileHandle);
        if (result.isSuccess()) {
          importedFiles.push(result.value);
        }
      }

      return succeed(importedFiles);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return fail('File selection was cancelled');
      }
      return fail(`Failed to pick files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async processDirectoryHandle(
    directoryHandle: FileSystemDirectoryHandle,
    basePath = ''
  ): Promise<ImportedDirectory> {
    const files: ImportedFile[] = [];
    const directories: ImportedDirectory[] = [];
    const currentPath = basePath ? `${basePath}/${directoryHandle.name}` : directoryHandle.name;

    for await (const [name, handle] of directoryHandle.entries()) {
      if (handle.kind === 'file') {
        const result = await this.processFileHandle(handle as FileSystemFileHandle, currentPath);
        if (result.isSuccess()) {
          files.push(result.value);
        }
      } else if (handle.kind === 'directory') {
        const subDirectory = await this.processDirectoryHandle(
          handle as FileSystemDirectoryHandle,
          currentPath
        );
        directories.push(subDirectory);
      }
    }

    return {
      name: directoryHandle.name,
      path: currentPath,
      files,
      directories
    };
  }

  private async processFileHandle(
    fileHandle: FileSystemFileHandle,
    basePath = ''
  ): Promise<Result<ImportedFile>> {
    try {
      const file = await fileHandle.getFile();
      const content = await file.text();
      const filePath = basePath ? `${basePath}/${file.name}` : file.name;

      return succeed({
        name: file.name,
        path: filePath,
        content,
        handle: fileHandle
      });
    } catch (error) {
      return fail(
        `Failed to read file ${fileHandle.name}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

/**
 * Fallback implementation using traditional file input
 */
export class FallbackFileImporter {
  /**
   * Pick a directory using webkitdirectory attribute
   */
  async pickDirectory(): Promise<Result<ImportedDirectory>> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.webkitdirectory = true;

      input.addEventListener('change', async (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (!files || files.length === 0) {
          resolve(fail('No directory selected'));
          return;
        }

        try {
          const importedDirectory = await this.processFileList(files);
          resolve(succeed(importedDirectory));
        } catch (error) {
          resolve(
            fail(`Failed to process directory: ${error instanceof Error ? error.message : String(error)}`)
          );
        }
      });

      input.addEventListener('cancel', () => {
        resolve(fail('Directory selection was cancelled'));
      });

      input.click();
    });
  }

  /**
   * Pick files using traditional file input
   */
  async pickFiles(options: FileImportOptions = {}): Promise<Result<ImportedFile[]>> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = options.multiple ?? true;

      if (options.acceptedTypes) {
        input.accept = options.acceptedTypes.join(',');
      }

      input.addEventListener('change', async (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (!files || files.length === 0) {
          resolve(fail('No files selected'));
          return;
        }

        try {
          const importedFiles: ImportedFile[] = [];
          for (const file of Array.from(files)) {
            const content = await file.text();
            importedFiles.push({
              name: file.name,
              path: file.name,
              content
            });
          }
          resolve(succeed(importedFiles));
        } catch (error) {
          resolve(fail(`Failed to read files: ${error instanceof Error ? error.message : String(error)}`));
        }
      });

      input.addEventListener('cancel', () => {
        resolve(fail('File selection was cancelled'));
      });

      input.click();
    });
  }

  private async processFileList(files: FileList): Promise<ImportedDirectory> {
    const fileMap = new Map<string, ImportedFile[]>();
    const dirMap = new Map<string, ImportedDirectory>();

    // Process all files
    for (const file of Array.from(files)) {
      const content = await file.text();
      const pathParts = file.webkitRelativePath.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const dirPath = pathParts.slice(0, -1).join('/');

      const importedFile: ImportedFile = {
        name: fileName,
        path: file.webkitRelativePath,
        content
      };

      if (!fileMap.has(dirPath)) {
        fileMap.set(dirPath, []);
      }
      fileMap.get(dirPath)!.push(importedFile);
    }

    // Build directory structure
    const rootDirName = files[0].webkitRelativePath.split('/')[0];
    return this.buildDirectoryTree(rootDirName, '', fileMap, dirMap);
  }

  private buildDirectoryTree(
    name: string,
    path: string,
    fileMap: Map<string, ImportedFile[]>,
    dirMap: Map<string, ImportedDirectory>
  ): ImportedDirectory {
    const currentPath = path ? `${path}/${name}` : name;
    const files = fileMap.get(currentPath) || [];
    const directories: ImportedDirectory[] = [];

    // Find subdirectories
    for (const [filePath] of fileMap) {
      if (filePath.startsWith(currentPath + '/')) {
        const relativePath = filePath.substring(currentPath.length + 1);
        const nextDirName = relativePath.split('/')[0];

        if (relativePath.includes('/') && !directories.some((d) => d.name === nextDirName)) {
          const subDir = this.buildDirectoryTree(nextDirName, currentPath, fileMap, dirMap);
          directories.push(subDir);
        }
      }
    }

    return {
      name,
      path: currentPath,
      files,
      directories
    };
  }
}

/**
 * Universal file importer that automatically selects the best available method
 */
export class FileImporter {
  private modernImporter = new ModernFileImporter();
  private fallbackImporter = new FallbackFileImporter();

  /**
   * Pick a directory using the best available method
   */
  async pickDirectory(): Promise<Result<ImportedDirectory>> {
    if (isFileSystemAccessSupported()) {
      return this.modernImporter.pickDirectory();
    } else {
      return this.fallbackImporter.pickDirectory();
    }
  }

  /**
   * Pick files using the best available method
   */
  async pickFiles(options: FileImportOptions = {}): Promise<Result<ImportedFile[]>> {
    if (isFileSystemAccessSupported()) {
      return this.modernImporter.pickFiles(options);
    } else {
      return this.fallbackImporter.pickFiles(options);
    }
  }

  /**
   * Get the current import method being used
   */
  getCurrentMethod(): 'modern' | 'fallback' {
    return isFileSystemAccessSupported() ? 'modern' : 'fallback';
  }
}

// Export singleton instance
export const fileImporter = new FileImporter();
