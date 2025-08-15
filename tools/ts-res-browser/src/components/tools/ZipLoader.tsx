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
import { FileTree, Converters, fail } from '@fgv/ts-utils';
import { Config } from '@fgv/ts-res';

interface ZipLoaderProps {
  onMessage: (type: Message['type'], message: string) => void;
  resourceManager: UseResourceManagerReturn;
  zipFile?: string;
  zipPath?: string;
  onLoadComplete?: () => void;
  debug?: boolean; // Compatible with ts-res-cli debug flag
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

// Converter for type-safe ZIP manifest parsing
const zipManifestConverter = Converters.object<ZipManifest>({
  timestamp: Converters.string,
  input: Converters.object({
    type: Converters.enumeratedValue(['file', 'directory'] as const),
    originalPath: Converters.string,
    archivePath: Converters.string
  }).optional(),
  config: Converters.object({
    type: Converters.enumeratedValue(['file'] as const),
    originalPath: Converters.string,
    archivePath: Converters.string
  }).optional()
});

const ZipLoader: React.FC<ZipLoaderProps> = ({
  onMessage,
  resourceManager,
  zipFile,
  zipPath,
  onLoadComplete,
  debug = false
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
    setIsLoading(true);
    setLoadingStep('Opening file picker...');

    try {
      // Try to load the ZIP file using File System Access API
      let fileHandle: FileSystemFileHandle | null = null;

      // Check if File System Access API is available
      const fileSystemWindow = window as FileSystemAccessWindow;

      if (fileSystemWindow.showOpenFilePicker) {
        try {
          // If we have a specific ZIP file referenced, give guidance but still allow manual selection
          if (zipFile || zipPath) {
            setLoadingStep(`Looking for ZIP file: ${zipFile || 'Bundle file'}...`);
          }

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

      // Load and parse manifest using Result pattern
      const manifestResult = fileTree.value
        .getFile('/manifest.json')
        .onSuccess((manifestFile) => manifestFile.getContents(zipManifestConverter));

      if (manifestResult.isFailure()) {
        onMessage('error', `Failed to load ZIP manifest: ${manifestResult.message}`);
        return;
      }

      const parsedManifest = manifestResult.value;
      setManifest(parsedManifest);
      onMessage('info', `ZIP created: ${new Date(parsedManifest.timestamp).toLocaleString()}`);

      // Load configuration if present using Result pattern and proper converter
      setLoadingStep('Loading configuration...');

      let loadedConfig: Config.Model.ISystemConfiguration | undefined = undefined;

      if (parsedManifest.config) {
        const configPath = `/${parsedManifest.config.archivePath}`;

        const configResult = fileTree.value
          .getFile(configPath)
          .onSuccess((configFile) => configFile.getContents(Config.Convert.systemConfiguration));

        if (configResult.isFailure()) {
          onMessage('error', `Failed to load configuration from ZIP: ${configResult.message}`);
          return;
        }

        loadedConfig = configResult.value;
        resourceManager.actions.applyConfiguration(loadedConfig);
        onMessage(
          'success',
          `Configuration loaded from ZIP: ${loadedConfig.name || 'Extended Example Configuration'}`
        );
      }

      // THEN: Process resources with the loaded configuration
      setLoadingStep('Processing resources...');

      // Look for input directory/files
      let inputProcessed = false;
      if (parsedManifest?.input) {
        const inputPath = `/${parsedManifest.input.archivePath}`;
        const inputResult = fileTree.value.getItem(inputPath);

        if (inputResult.isSuccess()) {
          const inputItem = inputResult.value;

          if (inputItem.type === 'directory') {
            // Process directory with ZIP configuration using direct FileTree processing
            await resourceManager.actions.processFileTreeDirectly(fileTree.value, inputPath, loadedConfig);
            inputProcessed = true;
          } else if (inputItem.type === 'file') {
            // Process single file with ZIP configuration using direct FileTree processing
            await resourceManager.actions.processFileTreeDirectly(fileTree.value, inputPath, loadedConfig);
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
            await resourceManager.actions.processFileTreeDirectly(fileTree.value, inputPath, loadedConfig);
            inputProcessed = true;
            break;
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
        {zipFile || zipPath ? (
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
                  The CLI has created a ZIP archive containing your resources and configuration. Click below
                  to load it directly into the browser.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-purple-50 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <ArchiveBoxIcon className="h-5 w-5 text-purple-600 mt-0.5" />
              <div className="text-sm text-purple-800">
                <p className="font-medium">Load ZIP Archive</p>
                <p className="mt-2">
                  Select a ZIP archive created by ts-res-cli or from a previous session. The archive should
                  contain your resources and configuration files.
                </p>
              </div>
            </div>
          </div>
        )}

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
              {zipFile || zipPath ? (
                <li>
                  Select the ZIP file: <code className="bg-gray-200 px-1 rounded">{expectedFileName}</code>
                </li>
              ) : (
                <li>Browse for any ZIP archive created by ts-res-cli (usually in Downloads)</li>
              )}
              <li>The browser will automatically process your resources and configuration</li>
              {!(zipFile || zipPath) && (
                <li className="text-blue-600">
                  Tip: You can also use the File Browser tool for individual resource files
                </li>
              )}
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
