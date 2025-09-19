import { Result, fail } from '@fgv/ts-utils';
import { FileTreeHelpers } from '@fgv/ts-web-extras';
import { FileTree } from '@fgv/ts-json-base';

/**
 * Read files from file input element and return FileTree
 * Leverages FileTree's automatic contentType initialization from MIME types
 */
/** @internal */
export async function readFilesFromInput(files: FileList): Promise<Result<FileTree.FileTree>> {
  // Use FileTreeHelpers which automatically preserves MIME types as contentType
  const fileTreeResult = await FileTreeHelpers.fromFileList(files);
  if (fileTreeResult.isFailure()) {
    // Fallback for test environment where File.text() might not be available
    return createFileTreeFallback(files);
  }

  return fileTreeResult;
}

/**
 * Create FileTree from files array
 * For converting existing file data to FileTree format
 */
/** @internal */
export function createFileTreeFromFiles(
  files: Array<{ name: string; path?: string; content: string; type?: string }>
): Result<FileTree.FileTree> {
  // Convert to IInMemoryFile format
  const inMemoryFiles: FileTree.IInMemoryFile[] = files.map((file) => ({
    path: `/${file.path || file.name}`,
    contents: file.content,
    contentType: file.type
  }));

  return FileTree.inMemory(inMemoryFiles);
}

/**
 * Read directory upload (with webkitRelativePath) and return FileTree
 */
/** @internal */
export async function readDirectoryFromInput(files: FileList): Promise<Result<FileTree.FileTree>> {
  // Use FileTreeHelpers which handles webkitRelativePath automatically
  const fileTreeResult = await FileTreeHelpers.fromDirectoryUpload(files);
  if (fileTreeResult.isFailure()) {
    // Fallback for test environment
    return createFileTreeFallback(files);
  }

  return fileTreeResult;
}

/**
 * Fallback FileTree creation for test environments
 * @internal
 */
async function createFileTreeFallback(files: FileList): Promise<Result<FileTree.FileTree>> {
  try {
    const inMemoryFiles: FileTree.IInMemoryFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = file.webkitRelativePath || file.name;

      // Try to read content with fallback
      let content: string;
      try {
        content = typeof file.text === 'function' ? await file.text() : await readFileContentLegacy(file);
      } catch (error) {
        return fail(`Failed to read file ${file.name}: ${error}`);
      }

      inMemoryFiles.push({
        path: `/${path}`,
        contents: content,
        contentType: file.type || undefined
      });
    }

    return FileTree.inMemory(inMemoryFiles);
  } catch (error) {
    return fail(`Failed to create FileTree: ${error}`);
  }
}

/**
 * Legacy file reading function for test environments
 * @internal
 */
function readFileContentLegacy(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error(`FileReader result is not a string: ${typeof result}`));
      }
    };
    reader.onerror = (e) => {
      reject(new Error(`FileReader error: ${e}`));
    };
    reader.readAsText(file);
  });
}

// Export functions moved to @fgv/ts-web-extras
