import React, { useState, useEffect } from 'react';
import {
  ArchiveBoxIcon,
  FolderOpenIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Message } from '../../types/app';
import { UseResourceManagerReturn } from '../../hooks/useResourceManager';

// File System Access API types (not available in all TypeScript versions)
interface FileSystemAccessWindow extends Window {
  showOpenFilePicker?: (options?: {
    types?: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
    startIn?: string;
    multiple?: boolean;
  }) => Promise<FileSystemFileHandle[]>;
}
import { BrowserZipFileTreeAccessors } from '../../utils/zip/browserZipFileTreeAccessors';
import { FileTree } from '@fgv/ts-utils';

interface ZipLoaderProps {
  onMessage: (type: Message['type'], message: string) => void;
  resourceManager: UseResourceManagerReturn;
  zipFile?: string;
  zipPath?: string;
  onLoadComplete?: () => void;
}

interface ZipManifest {
  timestamp: string;
  input?: {
    type: 'file' | 'directory';
    originalPath: string;
    archivePath: string;
  };
  config?: {
    type: 'file';
    originalPath: string;
    archivePath: string;
  };
}

const ZipLoader: React.FC<ZipLoaderProps> = ({
  onMessage,
  resourceManager,
  zipFile,
  zipPath,
  onLoadComplete
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [zipFound, setZipFound] = useState<boolean | null>(null);
  const [manifest, setManifest] = useState<ZipManifest | null>(null);
  const [autoloadAttempted, setAutoloadAttempted] = useState(false);

  // Auto-load ZIP if we have a specific file reference
  useEffect(() => {
    if ((zipFile || zipPath) && !autoloadAttempted) {
      setAutoloadAttempted(true);
      handleLoadZip();
    }
  }, [zipFile, zipPath, autoloadAttempted]);

  const handleLoadZip = async () => {
    if (!zipFile && !zipPath) {
      onMessage('error', 'No ZIP file specified');
      return;
    }

    setIsLoading(true);
    setLoadingStep('Opening file picker...');

    try {
      // Try to load the ZIP file using File System Access API
      let fileHandle: FileSystemFileHandle | null = null;

      // Check if File System Access API is available
      const fileSystemWindow = window as FileSystemAccessWindow;

      if (fileSystemWindow.showOpenFilePicker) {
        try {
          const [handle] = await fileSystemWindow.showOpenFilePicker({
            types: [
              {
                description: 'ZIP Archives',
                accept: { 'application/zip': ['.zip'] }
              }
            ],
            startIn: 'downloads',
            multiple: false
          });
          fileHandle = handle;
          setZipFound(true);
        } catch (error) {
          if ((error as DOMException).name !== 'AbortError') {
            onMessage('warning', 'Could not open file picker. Please select the ZIP file manually.');
          }
          setZipFound(false);
          return;
        }
      } else {
        onMessage('error', 'File System Access API not supported. Please use a modern browser.');
        setZipFound(false);
        return;
      }

      if (!fileHandle) {
        setZipFound(false);
        return;
      }

      setLoadingStep('Reading ZIP archive...');
      const file = await fileHandle.getFile();

      // Create ZIP FileTree
      const zipAccessorsResult = await BrowserZipFileTreeAccessors.fromFile(file);
      if (zipAccessorsResult.isFailure()) {
        onMessage('error', `Failed to read ZIP: ${zipAccessorsResult.message}`);
        return;
      }

      const zipAccessors = zipAccessorsResult.value;
      const fileTree = FileTree.FileTree.create(zipAccessors);
      if (fileTree.isFailure()) {
        onMessage('error', `Failed to create file tree: ${fileTree.message}`);
        return;
      }

      setLoadingStep('Reading manifest...');

      // Try to read manifest
      const manifestResult = fileTree.value.getFile('/manifest.json');
      if (manifestResult.isSuccess()) {
        const manifestContents = manifestResult.value.getContents();
        if (manifestContents.isSuccess()) {
          const parsedManifest = manifestContents.value as ZipManifest;
          setManifest(parsedManifest);
          onMessage('info', `ZIP created: ${new Date(parsedManifest.timestamp).toLocaleString()}`);
        }
      }

      // Process resources from the ZIP
      setLoadingStep('Processing resources...');

      // Look for input directory/files
      let inputProcessed = false;
      if (manifest?.input) {
        const inputPath = `/${manifest.input.archivePath}`;
        const inputResult = fileTree.value.getItem(inputPath);

        if (inputResult.isSuccess()) {
          const inputItem = inputResult.value;

          if (inputItem.type === 'directory') {
            // Process directory
            await resourceManager.actions.processFileTree(fileTree.value, inputPath);
            inputProcessed = true;
          } else if (inputItem.type === 'file') {
            // Process single file
            await resourceManager.actions.processFileTree(fileTree.value, inputPath);
            inputProcessed = true;
          }
        }
      }

      // Fallback: look for common input patterns
      if (!inputProcessed) {
        const commonInputPaths = ['/input', '/resources', '/data'];
        for (const inputPath of commonInputPaths) {
          const inputResult = fileTree.value.getItem(inputPath);
          if (inputResult.isSuccess() && inputResult.value.type === 'directory') {
            await resourceManager.actions.processFileTree(fileTree.value, inputPath);
            inputProcessed = true;
            break;
          }
        }
      }

      // Load configuration if present
      if (manifest?.config) {
        const configPath = `/${manifest.config.archivePath}`;
        const configResult = fileTree.value.getFile(configPath);

        if (configResult.isSuccess()) {
          const configContents = configResult.value.getContents();
          if (configContents.isSuccess()) {
            resourceManager.actions.applyConfiguration(configContents.value as any);
            onMessage('success', 'Configuration loaded from ZIP');
          }
        }
      }

      if (inputProcessed) {
        onMessage('success', 'Resources loaded successfully from ZIP!');
        onLoadComplete?.();
      } else {
        onMessage('warning', 'ZIP loaded but no resources found. Check ZIP contents.');
      }
    } catch (error) {
      onMessage('error', `Failed to load ZIP: ${error instanceof Error ? error.message : String(error)}`);
      setZipFound(false);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const expectedFileName = zipFile || 'ts-res-bundle-*.zip';

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <ArchiveBoxIcon className="h-8 w-8 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-900">Load ZIP Archive</h2>
      </div>

      <div className="max-w-2xl">
        {/* ZIP File Info */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <ArchiveBoxIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">ZIP Archive Ready</p>
              {zipPath && (
                <p className="mt-1">
                  <span className="font-medium">Location:</span> {zipPath}
                </p>
              )}
              {zipFile && (
                <p className="mt-1">
                  <span className="font-medium">File:</span> {zipFile}
                </p>
              )}
              <p className="mt-2">
                The CLI has created a ZIP archive containing your resources and configuration. Click below to
                load it directly into the browser.
              </p>
            </div>
          </div>
        </div>

        {/* Load Button */}
        <div className="space-y-4">
          <button
            onClick={handleLoadZip}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{loadingStep || 'Loading...'}</span>
              </>
            ) : (
              <>
                <FolderOpenIcon className="w-5 h-5" />
                <span>Load ZIP Archive</span>
                <ArrowRightIcon className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Instructions:</h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Click "Load ZIP Archive" above</li>
              <li>
                Select the ZIP file: <code className="bg-gray-200 px-1 rounded">{expectedFileName}</code>
              </li>
              <li>The browser will automatically process your resources and configuration</li>
            </ol>
          </div>

          {/* Manifest Info */}
          {manifest && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">ZIP Archive Contents</p>
                  <div className="mt-2 space-y-1">
                    {manifest.input && <p>📁 Resources: {manifest.input.originalPath}</p>}
                    {manifest.config && <p>⚙️ Configuration: {manifest.config.originalPath}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {zipFound === false && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">ZIP File Not Found</p>
                  <p className="mt-1">
                    Could not locate or open the ZIP file. Please make sure it exists in your Downloads folder
                    and try again.
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

export default ZipLoader;
