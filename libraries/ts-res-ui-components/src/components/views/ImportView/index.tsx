import React, { useState, useCallback, useRef } from 'react';
import type { IObservabilityContext } from '../../../utils/observability';
import {
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArchiveBoxIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline';
import { IImportViewProps } from '../../../types';
import { FileTree } from '@fgv/ts-json-base';
import { Bundle, ZipArchive } from '@fgv/ts-res';
import { isZipFile } from '../../../utils/zipLoader';
import { useSmartObservability } from '../../../hooks/useSmartObservability';
import {
  supportsFileSystemAccess,
  safeShowDirectoryPicker,
  safeShowOpenFilePicker,
  FileSystemDirectoryHandle,
  isFileHandle,
  isDirectoryHandle
} from '@fgv/ts-web-extras';
import {
  readFilesFromInput,
  readDirectoryFromInput,
  createFileTreeFromFiles
} from '../../../utils/fileProcessing';

/**
 * ImportView component for importing resource files, directories, and bundles.
 *
 * Provides a drag-and-drop interface for importing various resource formats including
 * individual JSON files, directory structures, ZIP archives, and pre-compiled bundles.
 * Automatically detects file types and processes them appropriately.
 *
 * **Key Features:**
 * - **Drag-and-drop import**: Simple drag-and-drop interface for file import
 * - **Multiple format support**: JSON files, directories, ZIP archives, and bundles
 * - **Auto-detection**: Automatically detects and processes different file types
 * - **Bundle processing**: Handles pre-compiled ts-res bundles
 * - **ZIP archive support**: Extracts and processes ZIP-based resource collections
 * - **Progress tracking**: Visual feedback during import operations
 * - **Error handling**: Clear error messages for unsupported or corrupted files
 *
 * @example
 * ```tsx
 * import { ImportView } from '@fgv/ts-res-ui-components';
 *
 * function MyImportTool() {
 *   const handleFileImport = (fileTree) => {
 *     console.log('Importing files:', fileTree);
 *   };
 *
 *   const handleBundleImport = (bundle) => {
 *     console.log('Importing bundle:', bundle);
 *   };
 *
 *   const handleZipImport = (zipData, config) => {
 *     console.log('Importing ZIP:', zipData, config);
 *   };
 *
 *   return (
 *     <ImportView
 *       onImport={handleFileImport}
 *       onBundleImport={handleBundleImport}
 *       onZipImport={handleZipImport}
 *       acceptedFileTypes={['.json', '.zip']}
 *     />
 *   );
 * }
 * ```
 *
 * @public
 */
export const ImportView: React.FC<IImportViewProps> = ({
  onImport,
  onBundleImport,
  onZipImport,
  acceptedFileTypes = ['.json', '.zip'],
  className = '',
  importError
}) => {
  // Get observability context
  const o11y = useSmartObservability();

  const [isLoading, setIsLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    hasImported: boolean;
    fileCount: number;
    isDirectory: boolean;
    isBundle: boolean;
    isZip: boolean;
  }>({
    hasImported: false,
    fileCount: 0,
    isDirectory: false,
    isBundle: false,
    isZip: false
  });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirInputRef = useRef<HTMLInputElement>(null);

  // Helper function to process ZIP files using zip-archive packlet
  const processZipFile = useCallback(
    async (file: File) => {
      o11y.diag.info(`[ImportView] Processing ZIP file: ${file.name}`);
      o11y.user.info(`Processing ZIP file: ${file.name}`);

      const loader = new ZipArchive.ZipArchiveLoader();
      const loadResult = await loader.loadFromFile(file, {
        strictManifestValidation: false // Be lenient with manifests
      });

      if (loadResult.isFailure()) {
        throw new Error(`Failed to load ZIP: ${loadResult.message}`);
      }

      const zipData = loadResult.value;
      o11y.diag.info(`[ImportView] ZIP loaded successfully:`, zipData);

      // Convert ZIP result to FileTree
      let fileTree: FileTree.FileTree;
      if (zipData.directory) {
        // Convert IImportedDirectory to FileTree using createFileTreeFromFiles
        const allFiles = extractAllFilesFromDirectory(zipData.directory);
        const fileTreeResult = createFileTreeFromFiles(allFiles);
        if (fileTreeResult.isFailure()) {
          throw new Error(`Failed to convert ZIP directory to FileTree: ${fileTreeResult.message}`);
        }
        fileTree = fileTreeResult.value;
      } else if (zipData.files.length > 0) {
        // Convert IImportedFile[] to FileTree using createFileTreeFromFiles
        const fileTreeResult = createFileTreeFromFiles(zipData.files);
        if (fileTreeResult.isFailure()) {
          throw new Error(`Failed to convert ZIP files to FileTree: ${fileTreeResult.message}`);
        }
        fileTree = fileTreeResult.value;
      } else {
        throw new Error('No files found in ZIP archive');
      }

      // Pass the FileTree and any configuration found
      if (onZipImport) {
        onZipImport(fileTree, zipData.config);
      } else {
        throw new Error('No ZIP import handler configured');
      }

      return { ...zipData, fileTree };
    },
    [onZipImport, o11y]
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setIsLoading(true);
      setError(null);

      try {
        // Handle single file selection - check file type first
        if (files.length === 1) {
          const file = files[0];

          // Check if it's a ZIP file first
          if (isZipFile(file.name)) {
            o11y.diag.info(`[ImportView] ✅ ${file.name} detected as ZIP file`);

            const zipData = await processZipFile(file);

            // Count files in the FileTree
            const fileCount = countFilesInTree(zipData.fileTree);

            setImportStatus({
              hasImported: true,
              fileCount,
              isDirectory: false,
              isBundle: false,
              isZip: true
            });

            o11y.user.success(`ZIP file processed: ${file.name} (${fileCount} files)`);
            setIsLoading(false);
            return;
          } else {
            o11y.user.info(`${file.name}: Not a ZIP file.`);
          }
        }

        // Use fileProcessing helper to get FileTree
        const fileTreeResult = await readFilesFromInput(files);
        if (fileTreeResult.isFailure()) {
          throw new Error(fileTreeResult.message);
        }

        const fileTree = fileTreeResult.value;

        // Check for bundles in the FileTree
        const bundleResult = await checkForBundleInTree(fileTree, o11y);

        if (bundleResult.isBundle && bundleResult.bundle) {
          o11y.diag.info(
            `[ImportView] Processing bundle file: ${bundleResult.fileName}`,
            bundleResult.bundle
          );

          setImportStatus({
            hasImported: true,
            fileCount: 1,
            isDirectory: false,
            isBundle: true,
            isZip: false
          });
          o11y.user.info(`Bundle file detected: ${bundleResult.fileName}`);
          if (onBundleImport) {
            o11y.diag.info(`[ImportView] Calling onBundleImport with bundle data`);
            onBundleImport(bundleResult.bundle);
          } else {
            o11y.diag.warn(`[ImportView] No bundle import handler configured`);
          }
        } else {
          const fileCount = countFilesInTree(fileTree);
          setImportStatus({
            hasImported: true,
            fileCount,
            isDirectory: false,
            isBundle: false,
            isZip: false
          });
          o11y.user.success(`Imported ${fileCount} file(s)`);
          onImport?.(fileTree);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        o11y.user.error(`Import failed: ${errorMsg}`);
      } finally {
        setIsLoading(false);
        // Reset input
        if (event.target) {
          event.target.value = '';
        }
      }
    },
    [onImport, onBundleImport, o11y]
  );

  // Handle directory selection
  const handleDirectorySelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setIsLoading(true);
      setError(null);

      try {
        // Use fileProcessing helper to get FileTree
        const fileTreeResult = await readDirectoryFromInput(files);
        if (fileTreeResult.isFailure()) {
          throw new Error(fileTreeResult.message);
        }

        const fileTree = fileTreeResult.value;
        const fileCount = countFilesInTree(fileTree);

        setImportStatus({
          hasImported: true,
          fileCount,
          isDirectory: true,
          isBundle: false,
          isZip: false
        });

        o11y.user.success(`Imported directory with ${fileCount} file(s)`);
        onImport?.(fileTree);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        o11y.user.error(`Directory import failed: ${errorMsg}`);
      } finally {
        setIsLoading(false);
        // Reset input
        if (event.target) {
          event.target.value = '';
        }
      }
    },
    [onImport, o11y]
  );

  // Modern File System Access API handlers
  const handleModernDirectoryPick = useCallback(async () => {
    if (!supportsFileSystemAccess(window)) {
      o11y.user.error('Directory picker not supported in this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const dirHandle = await safeShowDirectoryPicker(window);

      if (!dirHandle) {
        setIsLoading(false);
        return;
      }

      // Create FileTree from directory handle using readDirectoryFromInput
      // For now, we'll need to convert the directory handle to files
      // This is a limitation of the current FileTree integration
      const files: File[] = [];

      async function collectFiles(dirHandle: FileSystemDirectoryHandle, path: string = ''): Promise<void> {
        for await (const [name, handle] of dirHandle.entries()) {
          if (isFileHandle(handle)) {
            const file = await handle.getFile();
            // Add path information
            Object.defineProperty(file, 'webkitRelativePath', {
              value: path ? `${path}/${name}` : name,
              writable: false
            });
            files.push(file);
          } else if (isDirectoryHandle(handle)) {
            await collectFiles(handle, path ? `${path}/${name}` : name);
          }
        }
      }

      await collectFiles(dirHandle);

      // Convert File array to FileList-like object
      const fileList = createFileListFromArray(files);
      const fileTreeResult = await readDirectoryFromInput(fileList);
      if (fileTreeResult.isFailure()) {
        throw new Error(fileTreeResult.message);
      }

      const fileTree = fileTreeResult.value;
      const fileCount = countFilesInTree(fileTree);

      setImportStatus({
        hasImported: true,
        fileCount,
        isDirectory: true,
        isBundle: false,
        isZip: false
      });

      o11y.user.success(`Imported directory "${dirHandle.name}" with ${fileCount} file(s)`);
      onImport?.(fileTree);
    } catch (err: unknown) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        o11y.user.error(`Directory import failed: ${errorMsg}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [onImport, o11y]);

  const handleModernFilePick = useCallback(async () => {
    if (!supportsFileSystemAccess(window)) {
      o11y.user.error('File picker not supported in this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fileHandles = await safeShowOpenFilePicker(window, {
        multiple: true,
        types: [
          {
            description: 'Resource files',
            accept: {
              'application/json': ['.json'],
              'application/zip': ['.zip']
            }
          }
        ]
      });

      if (!fileHandles) {
        setIsLoading(false);
        return;
      }

      // Check if we have a single ZIP file first
      if (fileHandles.length === 1) {
        const file = await fileHandles[0].getFile();

        if (isZipFile(file.name)) {
          o11y.diag.info(`[ImportView] Modern API - ✅ ${file.name} detected as ZIP file`);

          const zipData = await processZipFile(file);

          const fileCount = countFilesInTree(zipData.fileTree);

          setImportStatus({
            hasImported: true,
            fileCount,
            isDirectory: false,
            isBundle: false,
            isZip: true
          });

          o11y.user.success(`ZIP file processed: ${file.name} (${fileCount} files)`);
          setIsLoading(false);
          return;
        }
      }

      // Filter out ZIP files from multi-file selection
      const nonZipHandles = [];
      for (const fileHandle of fileHandles) {
        const file = await fileHandle.getFile();
        if (isZipFile(file.name)) {
          o11y.user.warn(`Skipping ZIP file ${file.name} - select it individually to import`);
          continue;
        }
        nonZipHandles.push(fileHandle);
      }

      if (nonZipHandles.length === 0) {
        setIsLoading(false);
        return;
      }

      // Convert file handles to FileList for processing
      const files: File[] = [];
      for (const fileHandle of nonZipHandles) {
        const file = await fileHandle.getFile();
        files.push(file);
      }

      // Convert File array to FileList-like object
      const fileList = createFileListFromArray(files);
      const fileTreeResult = await readFilesFromInput(fileList);
      if (fileTreeResult.isFailure()) {
        throw new Error(fileTreeResult.message);
      }

      const fileTree = fileTreeResult.value;

      // Check for bundles in the FileTree
      const bundleResult = await checkForBundleInTree(fileTree, o11y);

      if (bundleResult.isBundle && bundleResult.bundle) {
        setImportStatus({
          hasImported: true,
          fileCount: 1,
          isDirectory: false,
          isBundle: true,
          isZip: false
        });
        o11y.user.info(`Bundle file detected: ${bundleResult.fileName}`);
        if (onBundleImport) {
          onBundleImport(bundleResult.bundle);
        }
      } else {
        const fileCount = countFilesInTree(fileTree);
        setImportStatus({
          hasImported: true,
          fileCount,
          isDirectory: false,
          isBundle: false,
          isZip: false
        });
        o11y.user.success(`Imported ${fileCount} file(s)`);
        onImport?.(fileTree);
      }
    } catch (err: unknown) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        o11y.user.error(`File import failed: ${errorMsg}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [onImport, onBundleImport, o11y]);

  const handleReset = useCallback(() => {
    setImportStatus({
      hasImported: false,
      fileCount: 0,
      isDirectory: false,
      isBundle: false,
      isZip: false
    });
    setError(null);
    o11y.user.info('Import cleared');
  }, [o11y]);

  return (
    <div className={`p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <DocumentArrowUpIcon className="h-8 w-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Import Resources</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Import Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Files</h3>

          <div className="space-y-4">
            {/* API Support Status */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {supportsFileSystemAccess(window) ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Modern File System API available</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Using fallback file input</span>
                </>
              )}
            </div>

            {/* Import Buttons */}
            <div className="flex flex-col space-y-3">
              {supportsFileSystemAccess(window) ? (
                <>
                  <button
                    onClick={handleModernDirectoryPick}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FolderOpenIcon className="w-5 h-5" />
                    <span>{isLoading ? 'Importing...' : 'Import Resource Directory'}</span>
                  </button>

                  <button
                    onClick={handleModernFilePick}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <DocumentArrowUpIcon className="w-5 h-5" />
                    <span>{isLoading ? 'Importing...' : 'Import Resource Files'}</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Fallback inputs */}
                  <input
                    ref={dirInputRef}
                    type="file"
                    {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
                    multiple
                    onChange={handleDirectorySelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => dirInputRef.current?.click()}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FolderOpenIcon className="w-5 h-5" />
                    <span>{isLoading ? 'Importing...' : 'Import Resource Directory'}</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedFileTypes.join(',')}
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <DocumentArrowUpIcon className="w-5 h-5" />
                    <span>{isLoading ? 'Importing...' : 'Import Resource Files'}</span>
                  </button>
                </>
              )}
            </div>

            {/* Usage Instructions */}
            <div className="text-sm text-gray-600 space-y-2">
              <p className="font-medium">Import Options:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>Directory:</strong> Select a folder with ts-res resources
                </li>
                <li>
                  <strong>Files:</strong> Select individual JSON resource files
                </li>
                <li>
                  <strong>Bundles:</strong> Automatically detected and loaded
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right column: Status */}
        <div className="space-y-6">
          {/* Import Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Status</h3>

            <div className="space-y-3">
              {/* Import Status */}
              <div className="flex items-center space-x-3">
                {importStatus.hasImported ? (
                  <>
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-900">
                      {importStatus.isBundle
                        ? 'Bundle imported'
                        : importStatus.isZip
                        ? 'ZIP archive imported'
                        : importStatus.isDirectory
                        ? 'Directory imported'
                        : `${importStatus.fileCount} file(s) imported`}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                    <span className="text-sm text-gray-500">No files imported yet</span>
                  </>
                )}
              </div>

              {/* Bundle Detection */}
              {importStatus.isBundle && (
                <div className="flex items-center space-x-3">
                  <ArchiveBoxIcon className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-blue-900">Bundle file detected</span>
                </div>
              )}

              {/* ZIP Detection */}
              {importStatus.isZip && (
                <div className="flex items-center space-x-3">
                  <ArchiveBoxIcon className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-purple-900">ZIP archive processed</span>
                </div>
              )}
            </div>

            {/* Reset Button */}
            {importStatus.hasImported && (
              <button
                onClick={handleReset}
                className="mt-4 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Import
              </button>
            )}
          </div>

          {/* Error Display */}
          {(error || importError) && (
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
              <div className="flex items-start space-x-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Error</p>
                  <p>{importError || error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {importStatus.hasImported && !error && !importError && (
            <div className="bg-white rounded-lg shadow-sm border border-green-200 p-6">
              <div className="flex items-start space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">Import Successful!</p>
                  <p>
                    {importStatus.isBundle
                      ? 'Bundle resources are ready to browse.'
                      : importStatus.isZip
                      ? 'ZIP archive contents have been imported and are ready for processing.'
                      : 'Resources are ready for processing.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions

/**
 * Creates a FileList-like object from a File array
 * FileList is a readonly object, so we create a compatible object
 */
function createFileListFromArray(files: File[]): FileList {
  const fileList = Object.create(FileList.prototype);
  Object.defineProperty(fileList, 'length', {
    value: files.length,
    writable: false
  });

  files.forEach((file, index) => {
    Object.defineProperty(fileList, index, {
      value: file,
      writable: false
    });
  });

  // Add item method
  Object.defineProperty(fileList, 'item', {
    value: (index: number) => (index >= 0 && index < files.length ? files[index] : null),
    writable: false
  });

  // Add iterator support
  Object.defineProperty(fileList, Symbol.iterator, {
    value: function* () {
      for (const file of files) {
        yield file;
      }
    },
    writable: false
  });

  return fileList;
}

interface IDirectoryStructure {
  name: string;
  path?: string;
  files?: Array<{ name: string; path?: string; content: string; type?: string }>;
  subdirectories?: Array<IDirectoryStructure>;
}

function extractAllFilesFromDirectory(
  directory: IDirectoryStructure
): Array<{ name: string; path: string; content: string; type?: string }> {
  const allFiles: Array<{ name: string; path: string; content: string; type?: string }> = [];

  // Add files from current directory
  if (directory.files) {
    for (const file of directory.files) {
      allFiles.push({
        name: file.name,
        path: file.path || file.name,
        content: file.content,
        type: file.type
      });
    }
  }

  // Recursively add files from subdirectories
  if (directory.subdirectories) {
    for (const subdir of directory.subdirectories) {
      const subdirFiles = extractAllFilesFromDirectory(subdir);
      allFiles.push(...subdirFiles);
    }
  }

  return allFiles;
}

function countFilesInTree(fileTree: FileTree.FileTree): number {
  let count = 0;

  function walkTree(path: string): void {
    const itemResult = fileTree.getItem(path);
    if (itemResult.isFailure()) return;

    const item = itemResult.value;

    if (item.type === 'file') {
      count++;
    } else if (item.type === 'directory') {
      const childrenResult = item.getChildren();
      if (childrenResult.isSuccess()) {
        for (const child of childrenResult.value) {
          walkTree(child.absolutePath);
        }
      }
    }
  }

  // Start from root
  walkTree('/');
  return count;
}

async function checkForBundleInTree(
  fileTree: FileTree.FileTree,
  o11y: IObservabilityContext
): Promise<{ isBundle: boolean; bundle?: Bundle.IBundle; fileName?: string }> {
  function walkTree(path: string): { isBundle: boolean; bundle?: Bundle.IBundle; fileName?: string } {
    const itemResult = fileTree.getItem(path);
    if (itemResult.isFailure()) return { isBundle: false };

    const item = itemResult.value;

    if (item.type === 'file') {
      const contentResult = item.getRawContents();
      if (contentResult.isSuccess()) {
        const fileName = item.name;
        const content = contentResult.value;

        try {
          const parsedData = JSON.parse(content);

          o11y.diag.info(`[ImportView] Checking if ${fileName} is a bundle...`);

          if (Bundle.BundleUtils.isBundleFile(parsedData)) {
            o11y.diag.info(`[ImportView] ✅ ${fileName} detected as bundle file`);
            return { isBundle: true, bundle: parsedData, fileName };
          } else if (Bundle.BundleUtils.isBundleFileName(fileName)) {
            o11y.diag.warn(
              `[ImportView] ⚠️ File ${fileName} appears to be a bundle by name but content doesn't match bundle structure`
            );
            o11y.user.warn(`${fileName}: Malformed bundle file.`);
          } else {
            o11y.diag.info(`[ImportView] ❌ ${fileName} is not a bundle file`);
          }
        } catch (parseError) {
          o11y.diag.info(`[ImportView] ❌ ${fileName} failed JSON parsing:`, parseError);
        }
      }
    } else if (item.type === 'directory') {
      const childrenResult = item.getChildren();
      if (childrenResult.isSuccess()) {
        for (const child of childrenResult.value) {
          const result = walkTree(child.absolutePath);
          if (result.isBundle) {
            return result;
          }
        }
      }
    }

    return { isBundle: false };
  }

  // Start from root and return first bundle found
  return walkTree('/');
}

export default ImportView;
