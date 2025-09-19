import { IImportedFile, IImportedDirectory } from '../types';
import { FileTreeHelpers } from '@fgv/ts-web-extras';
import { FileTree } from '@fgv/ts-json-base';

/**
 * Read files from file input element using FileTree
 */
/** @internal */
export async function readFilesFromInput(files: FileList): Promise<IImportedFile[]> {
  // Capture MIME types before FileTree processing loses them
  const mimeTypeMap = new Map<string, string>();
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const path = file.webkitRelativePath || file.name;
    mimeTypeMap.set(path, file.type);
  }

  // Use FileTree to process files (with fallback for test environment)
  const fileTreeResult = await FileTreeHelpers.fromFileList(files);
  if (fileTreeResult.isFailure()) {
    // Fallback for test environment where File.text() might not be available
    const importedFiles: IImportedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = file.webkitRelativePath || file.name;

      // Try to read content with fallback
      let content: string;
      try {
        content = typeof file.text === 'function' ? await file.text() : await readFileContentLegacy(file);
      } catch (error) {
        throw new Error(`Failed to read file ${file.name}: ${error}`);
      }

      importedFiles.push({
        name: file.name,
        path,
        content,
        type: file.type
      });
    }
    return importedFiles;
  }

  const fileTree = fileTreeResult.value;

  // Convert FileTree to IImportedFile array
  const importedFiles: IImportedFile[] = [];

  // Recursively collect all files from the tree
  const collectFiles = (directory: FileTree.IFileTreeDirectoryItem): void => {
    const children = directory.getChildren().orThrow();

    for (const item of children) {
      if (item.type === 'file') {
        const content = item.getRawContents().orThrow();
        const relativePath = item.absolutePath.startsWith('/')
          ? item.absolutePath.substring(1)
          : item.absolutePath;

        importedFiles.push({
          name: item.name,
          path: relativePath,
          content,
          type: mimeTypeMap.get(relativePath) || undefined
        });
      } else {
        // Recursively collect from subdirectories
        collectFiles(item);
      }
    }
  };

  // Start from root directory
  const rootDir = fileTree.getDirectory('/').orThrow();
  collectFiles(rootDir);

  return importedFiles;
}

/**
 * Convert flat file list to directory structure using FileTree navigation
 */
/** @internal */
export function filesToDirectory(files: IImportedFile[]): IImportedDirectory {
  // Create in-memory FileTree from files
  const inMemoryFiles: FileTree.IInMemoryFile[] = files.map((file) => ({
    path: `/${file.path || file.name}`,
    contents: file.content
  }));

  const fileTree = FileTree.inMemory(inMemoryFiles).orThrow();
  const rootDir = fileTree.getDirectory('/').orThrow();
  const rootItems = rootDir.getChildren().orThrow();

  // Convert FileTree directory structure to IImportedDirectory
  const convertDirectoryItem = (dirItem: FileTree.IFileTreeDirectoryItem): IImportedDirectory => {
    const dirContents = dirItem.getChildren().orThrow();

    const subFiles: IImportedFile[] = [];
    const subdirectories: IImportedDirectory[] = [];

    for (const item of dirContents) {
      if (item.type === 'file') {
        const content = item.getRawContents().orThrow();
        const relativePath = item.absolutePath.startsWith('/')
          ? item.absolutePath.substring(1)
          : item.absolutePath;

        // Find original file to get MIME type
        const originalFile = files.find((f) => (f.path || f.name) === relativePath);

        subFiles.push({
          name: item.name,
          path: originalFile?.path,
          content,
          type: originalFile?.type
        });
      } else {
        subdirectories.push(convertDirectoryItem(item));
      }
    }

    const relativePath = dirItem.absolutePath.startsWith('/')
      ? dirItem.absolutePath.substring(1)
      : dirItem.absolutePath;

    return {
      name: dirItem.name,
      path: relativePath,
      files: subFiles,
      subdirectories
    };
  };

  // Handle root directory specially
  const rootFiles: IImportedFile[] = [];
  const rootSubdirectories: IImportedDirectory[] = [];

  for (const item of rootItems) {
    if (item.type === 'file') {
      const content = item.getRawContents().orThrow();
      const relativePath = item.absolutePath.startsWith('/')
        ? item.absolutePath.substring(1)
        : item.absolutePath;

      const originalFile = files.find((f) => (f.path || f.name) === relativePath);

      rootFiles.push({
        name: item.name,
        path: originalFile?.path,
        content,
        type: originalFile?.type
      });
    } else {
      rootSubdirectories.push(convertDirectoryItem(item));
    }
  }

  return {
    name: 'root',
    path: '',
    files: rootFiles,
    subdirectories: rootSubdirectories
  };
}

/**
 * Legacy file reading function for test environments
 * @internal
 */
function readFileContentLegacy(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = (e) => {
      reject(new Error(`FileReader error: ${e}`));
    };
    reader.readAsText(file);
  });
}

// Export functions moved to @fgv/ts-web-extras
