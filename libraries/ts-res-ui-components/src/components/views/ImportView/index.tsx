import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArchiveBoxIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline';
import { ImportViewProps, ImportedFile, ImportedDirectory, ExtendedProcessedResources } from '../../../types';
import { Bundle, Config } from '@fgv/ts-res';
import { isZipFile } from '../../../utils/zipLoader';

interface FileInputResult {
  files: ImportedFile[];
  directory?: ImportedDirectory;
  bundleFile?: ImportedFile & { bundle?: Bundle.IBundle };
}

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
 *   const handleFileImport = (files, directory) => {
 *     console.log('Importing files:', files, directory);
 *   };
 *
 *   const handleBundleImport = (bundle) => {
 *     console.log('Importing bundle:', bundle);
 *   };
 *
 *   const handleZipImport = (zipData) => {
 *     console.log('Importing ZIP:', zipData);
 *   };
 *
 *   return (
 *     <ImportView
 *       onImport={handleFileImport}
 *       onBundleImport={handleBundleImport}
 *       onZipImport={handleZipImport}
 *       acceptedFileTypes={['.json', '.zip']}
 *       onMessage={(type, message) => console.log(`${type}: ${message}`)}
 *     />
 *   );
 * }
 * ```
 *
 * @public
 */
export const ImportView: React.FC<ImportViewProps> = ({
  onImport,
  onBundleImport,
  onZipImport,
  acceptedFileTypes = ['.json', '.zip'],
  onMessage,
  className = ''
}) => {
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

  // Check for File System Access API support
  const isFileSystemAccessSupported = 'showDirectoryPicker' in window || 'showOpenFilePicker' in window;

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
            console.log(`[ImportView] ✅ ${file.name} detected as ZIP file`);
            onMessage?.('info', `Processing ZIP file: ${file.name}`);

            // Just pass the File object directly to onZipImport
            // The App will handle creating the FileTree
            if (onZipImport) {
              setImportStatus({
                hasImported: true,
                fileCount: 1,
                isDirectory: false,
                isBundle: false,
                isZip: true
              });

              onMessage?.('success', `ZIP file detected: ${file.name}`);
              onZipImport(file, undefined);

              setIsLoading(false);
              return;
            } else {
              throw new Error('No ZIP import handler configured');
            }
          }
        }

        // Handle regular files (non-ZIP)
        const importedFiles: ImportedFile[] = [];
        let bundleFile: (ImportedFile & { bundle?: Bundle.IBundle }) | undefined;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const content = await readFileContent(file);

          const importedFile: ImportedFile = {
            name: file.name,
            path: file.webkitRelativePath || file.name,
            content,
            type: file.type
          };

          // Check if it's a bundle file using proper detection
          let isCurrentFileBundle = false;
          try {
            const parsedData = JSON.parse(content);

            console.log(`[ImportView] Checking if ${file.name} is a bundle...`);

            // Use BundleUtils for proper bundle detection
            if (Bundle.BundleUtils.isBundleFile(parsedData)) {
              console.log(`[ImportView] ✅ ${file.name} detected as bundle file`);
              bundleFile = { ...importedFile, bundle: parsedData };
              isCurrentFileBundle = true;
            } else if (Bundle.BundleUtils.isBundleFileName(file.name)) {
              // File name suggests it's a bundle, but content doesn't match - log a warning
              console.warn(
                `[ImportView] ⚠️ File ${file.name} appears to be a bundle by name but content doesn't match bundle structure`
              );
            } else {
              console.log(`[ImportView] ❌ ${file.name} is not a bundle file`);
            }
          } catch (parseError) {
            console.log(`[ImportView] ❌ ${file.name} failed JSON parsing:`, parseError);
            // Not valid JSON or not a bundle, treat as regular file
          }

          // Only add to regular files if this specific file is not a bundle
          if (!isCurrentFileBundle) {
            importedFiles.push(importedFile);
          }
        }

        // Process results
        if (bundleFile) {
          console.log(`[ImportView] Processing bundle file: ${bundleFile.name}`, bundleFile.bundle);

          setImportStatus({
            hasImported: true,
            fileCount: 1,
            isDirectory: false,
            isBundle: true,
            isZip: false
          });
          onMessage?.('info', `Bundle file detected: ${bundleFile.name}`);
          if (onBundleImport && bundleFile.bundle) {
            console.log(`[ImportView] Calling onBundleImport with bundle data`);
            onBundleImport(bundleFile.bundle);
          } else {
            console.warn(`[ImportView] No bundle import handler or bundle data missing`);
          }
        } else if (importedFiles.length > 0) {
          setImportStatus({
            hasImported: true,
            fileCount: importedFiles.length,
            isDirectory: false,
            isBundle: false,
            isZip: false
          });
          onMessage?.('success', `Imported ${importedFiles.length} file(s)`);
          onImport?.(importedFiles);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        onMessage?.('error', `Import failed: ${errorMsg}`);
      } finally {
        setIsLoading(false);
        // Reset input
        if (event.target) {
          event.target.value = '';
        }
      }
    },
    [onImport, onBundleImport, onMessage]
  );

  // Handle directory selection (for browsers with webkitdirectory support)
  const handleDirectorySelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setIsLoading(true);
      setError(null);

      try {
        const filesByPath = new Map<string, ImportedFile[]>();
        const dirPaths = new Set<string>();

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const content = await readFileContent(file);
          const path = file.webkitRelativePath;

          if (path) {
            const parts = path.split('/');
            const dirPath = parts.slice(0, -1).join('/');
            dirPaths.add(dirPath);

            if (!filesByPath.has(dirPath)) {
              filesByPath.set(dirPath, []);
            }

            filesByPath.get(dirPath)!.push({
              name: parts[parts.length - 1],
              path: path,
              content,
              type: file.type
            });
          }
        }

        // Build directory structure
        const rootDir: ImportedDirectory = {
          name: 'imported',
          files: filesByPath.get('') || [],
          subdirectories: []
        };

        // Create subdirectories
        const sortedPaths = Array.from(dirPaths).sort();
        for (const dirPath of sortedPaths) {
          if (dirPath && dirPath !== '') {
            const parts = dirPath.split('/');
            let currentLevel = rootDir;

            for (let i = 0; i < parts.length; i++) {
              const part = parts[i];
              const currentPath = parts.slice(0, i + 1).join('/');

              if (!currentLevel.subdirectories) {
                currentLevel.subdirectories = [];
              }

              let subdir = currentLevel.subdirectories.find((d) => d.name === part);
              if (!subdir) {
                subdir = {
                  name: part,
                  path: currentPath,
                  files: filesByPath.get(currentPath) || [],
                  subdirectories: []
                };
                currentLevel.subdirectories.push(subdir);
              }

              currentLevel = subdir;
            }
          }
        }

        setImportStatus({
          hasImported: true,
          fileCount: files.length,
          isDirectory: true,
          isBundle: false,
          isZip: false
        });

        onMessage?.('success', `Imported directory with ${files.length} file(s)`);
        onImport?.(rootDir);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        onMessage?.('error', `Directory import failed: ${errorMsg}`);
      } finally {
        setIsLoading(false);
        // Reset input
        if (event.target) {
          event.target.value = '';
        }
      }
    },
    [onImport, onMessage]
  );

  // Modern File System Access API handlers
  const handleModernDirectoryPick = useCallback(async () => {
    if (!('showDirectoryPicker' in window)) {
      onMessage?.('error', 'Directory picker not supported in this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      const rootDir = await processDirectoryHandle(dirHandle);

      const fileCount = countFiles(rootDir);
      setImportStatus({
        hasImported: true,
        fileCount,
        isDirectory: true,
        isBundle: false,
        isZip: false
      });

      onMessage?.('success', `Imported directory "${rootDir.name}" with ${fileCount} file(s)`);
      onImport?.(rootDir);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        onMessage?.('error', `Directory import failed: ${errorMsg}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [onImport, onMessage]);

  const handleModernFilePick = useCallback(async () => {
    if (!('showOpenFilePicker' in window)) {
      onMessage?.('error', 'File picker not supported in this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fileHandles = await (window as any).showOpenFilePicker({
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

      // Check if we have a single ZIP file first
      if (fileHandles.length === 1) {
        const file = await fileHandles[0].getFile();

        if (isZipFile(file.name)) {
          console.log(`[ImportView] Modern API - ✅ ${file.name} detected as ZIP file`);
          onMessage?.('info', `Processing ZIP file: ${file.name}`);

          if (onZipImport) {
            setImportStatus({
              hasImported: true,
              fileCount: 1,
              isDirectory: false,
              isBundle: false,
              isZip: true
            });

            onMessage?.('success', `ZIP file detected: ${file.name}`);
            onZipImport(file, undefined);

            setIsLoading(false);
            return;
          } else {
            throw new Error('No ZIP import handler configured');
          }
        }
      }

      const importedFiles: ImportedFile[] = [];
      let bundleFile: (ImportedFile & { bundle?: Bundle.IBundle }) | undefined;

      for (const fileHandle of fileHandles) {
        const file = await fileHandle.getFile();

        // Skip ZIP files in multi-file selection
        if (isZipFile(file.name)) {
          onMessage?.('warning', `Skipping ZIP file ${file.name} - select it individually to import`);
          continue;
        }

        const content = await file.text();

        const importedFile: ImportedFile = {
          name: file.name,
          content,
          type: file.type
        };

        // Check for bundle using proper detection
        let isCurrentFileBundle = false;
        try {
          const parsedData = JSON.parse(content);

          console.log(`[ImportView] Modern API - Checking if ${file.name} is a bundle...`);

          // Use BundleUtils for proper bundle detection
          if (Bundle.BundleUtils.isBundleFile(parsedData)) {
            console.log(`[ImportView] Modern API - ✅ ${file.name} detected as bundle file`);
            bundleFile = { ...importedFile, bundle: parsedData };
            isCurrentFileBundle = true;
          } else if (Bundle.BundleUtils.isBundleFileName(file.name)) {
            console.warn(
              `[ImportView] Modern API - ⚠️ File ${file.name} appears to be a bundle by name but content doesn't match bundle structure`
            );
          } else {
            console.log(`[ImportView] Modern API - ❌ ${file.name} is not a bundle file`);
          }
        } catch (parseError) {
          console.log(`[ImportView] Modern API - ❌ ${file.name} failed JSON parsing:`, parseError);
        }

        // Only add to regular files if this specific file is not a bundle
        if (!isCurrentFileBundle) {
          importedFiles.push(importedFile);
        }
      }

      // Process results
      if (bundleFile) {
        setImportStatus({
          hasImported: true,
          fileCount: 1,
          isDirectory: false,
          isBundle: true,
          isZip: false
        });
        onMessage?.('info', `Bundle file detected: ${bundleFile.name}`);
        if (onBundleImport && bundleFile.bundle) {
          onBundleImport(bundleFile.bundle);
        }
      } else if (importedFiles.length > 0) {
        setImportStatus({
          hasImported: true,
          fileCount: importedFiles.length,
          isDirectory: false,
          isBundle: false,
          isZip: false
        });
        onMessage?.('success', `Imported ${importedFiles.length} file(s)`);
        onImport?.(importedFiles);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        onMessage?.('error', `File import failed: ${errorMsg}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [onImport, onBundleImport, onMessage, acceptedFileTypes]);

  const handleReset = useCallback(() => {
    setImportStatus({
      hasImported: false,
      fileCount: 0,
      isDirectory: false,
      isBundle: false,
      isZip: false
    });
    setError(null);
    onMessage?.('info', 'Import cleared');
  }, [onMessage]);

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
              {isFileSystemAccessSupported ? (
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
              {isFileSystemAccessSupported ? (
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
                    // @ts-ignore - webkitdirectory is not in types
                    webkitdirectory=""
                    directory=""
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
          {error && (
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
              <div className="flex items-start space-x-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Error</p>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {importStatus.hasImported && !error && (
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
async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsText(file);
  });
}

async function processDirectoryHandle(dirHandle: any, parentPath: string = ''): Promise<ImportedDirectory> {
  const files: ImportedFile[] = [];
  const subdirectories: ImportedDirectory[] = [];

  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      const content = await file.text();
      files.push({
        name: file.name,
        path: parentPath ? `${parentPath}/${file.name}` : file.name,
        content,
        type: file.type
      });
    } else if (entry.kind === 'directory') {
      const subdir = await processDirectoryHandle(
        entry,
        parentPath ? `${parentPath}/${entry.name}` : entry.name
      );
      subdirectories.push(subdir);
    }
  }

  return {
    name: dirHandle.name,
    path: parentPath,
    files,
    subdirectories: subdirectories.length > 0 ? subdirectories : undefined
  };
}

function countFiles(dir: ImportedDirectory): number {
  let count = dir.files?.length || 0;
  if (dir.subdirectories) {
    for (const subdir of dir.subdirectories) {
      count += countFiles(subdir);
    }
  }
  return count;
}

export default ImportView;
