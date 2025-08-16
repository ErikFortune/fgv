import React, { useState, useCallback, useRef } from 'react';
import {
  DocumentArrowDownIcon,
  FolderOpenIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { ZipLoaderViewProps } from '../../../types';
import {
  createBrowserZipLoader,
  ZipLoadOptions,
  ZipLoadResult,
  ZipLoadingStage,
  formatFileSize,
  isZipFile
} from '../../../utils/zipLoader';

interface LoadingState {
  isLoading: boolean;
  stage: ZipLoadingStage | null;
  progress: number;
  message: string;
}

interface LoadedState {
  result: ZipLoadResult | null;
  error: string | null;
  fileName: string | null;
  fileSize: number | null;
}

/**
 * ZipLoaderView component for loading ZIP-based resource bundles from URLs or files.
 *
 * Provides a specialized interface for loading ZIP archives containing ts-res resource
 * collections, with progress tracking, auto-configuration loading, and bundle processing.
 * Designed for loading distributed resource bundles.
 *
 * **Key Features:**
 * - **URL-based loading**: Load ZIP bundles from remote URLs
 * - **File-based loading**: Load ZIP bundles from local files
 * - **Progress tracking**: Real-time progress updates during ZIP processing
 * - **Auto-configuration**: Automatically extract and apply configurations from bundles
 * - **Bundle validation**: Validate ZIP structure and manifest files
 * - **Error recovery**: Graceful error handling with detailed error messages
 * - **Manifest support**: Process ZIP manifests for metadata and configuration
 *
 * @example
 * ```tsx
 * import { ZipLoaderView } from '@fgv/ts-res-ui-components';
 *
 * function MyZipLoader() {
 *   const handleImport = (files, directory) => {
 *     console.log('Imported from ZIP:', files, directory);
 *   };
 *
 *   const handleConfigLoad = (config) => {
 *     console.log('Loaded configuration from ZIP:', config);
 *   };
 *
 *   return (
 *     <ZipLoaderView
 *       zipFileUrl="https://example.com/resources.zip"
 *       onImport={handleImport}
 *       onConfigurationLoad={handleConfigLoad}
 *       onLoadComplete={(result) => console.log('Load complete:', result)}
 *       onMessage={(type, message) => console.log(`${type}: ${message}`)}
 *     />
 *   );
 * }
 * ```
 *
 * @public
 */
export const ZipLoaderView: React.FC<ZipLoaderViewProps> = ({
  zipFileUrl,
  zipPath,
  onImport,
  onConfigurationLoad,
  onLoadComplete,
  onMessage,
  className = ''
}) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    stage: null,
    progress: 0,
    message: ''
  });

  const [loadedState, setLoadedState] = useState<LoadedState>({
    result: null,
    error: null,
    fileName: null,
    fileSize: null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Load ZIP file with progress tracking
  const loadZipFileInternal = useCallback(
    async (file: File) => {
      setLoadingState({
        isLoading: true,
        stage: 'reading-file',
        progress: 0,
        message: 'Starting to load ZIP file...'
      });

      setLoadedState({
        result: null,
        error: null,
        fileName: file.name,
        fileSize: file.size
      });

      const options: ZipLoadOptions = {
        autoApplyConfig: false,
        autoProcessResources: false
      };

      const progressCallback = (stage: ZipLoadingStage, progress: number, message?: string) => {
        setLoadingState({
          isLoading: stage !== 'complete',
          stage,
          progress,
          message: message || getStageMessage(stage)
        });
      };

      const loader = createBrowserZipLoader();
      const result = await loader.loadFromFile(file, options, progressCallback);

      if (result.isSuccess()) {
        const zipResult = result.value;

        setLoadedState((prev) => ({
          ...prev,
          result: zipResult,
          error: null
        }));

        setLoadingState({
          isLoading: false,
          stage: 'complete',
          progress: 100,
          message: 'ZIP file loaded successfully'
        });

        onMessage?.('success', `Loaded ZIP file: ${file.name}`);

        // Load configuration if found
        if (zipResult.config) {
          onConfigurationLoad?.(zipResult.config);
          onMessage?.('info', `Configuration loaded from ZIP`);
        }

        // Import the raw data for processing by the orchestrator
        if (zipResult.directory) {
          onImport?.(zipResult.directory);
        } else if (zipResult.files.length > 0) {
          onImport?.(zipResult.files);
        }

        onLoadComplete?.();
      } else {
        const errorMessage = result.message;
        setLoadedState((prev) => ({
          ...prev,
          error: errorMessage,
          result: null
        }));

        setLoadingState({
          isLoading: false,
          stage: null,
          progress: 0,
          message: ''
        });

        onMessage?.('error', `Failed to load ZIP: ${errorMessage}`);
      }
    },
    [onMessage, onLoadComplete]
  );

  // Load ZIP from URL
  const loadFromUrl = useCallback(
    async (url: string) => {
      setLoadingState({
        isLoading: true,
        stage: 'reading-file',
        progress: 0,
        message: 'Fetching ZIP from URL...'
      });

      setLoadedState({
        result: null,
        error: null,
        fileName: url.split('/').pop() || 'remote.zip',
        fileSize: null
      });

      const options: ZipLoadOptions = {
        autoApplyConfig: false,
        autoProcessResources: false
      };

      const progressCallback = (stage: ZipLoadingStage, progress: number, message?: string) => {
        setLoadingState({
          isLoading: stage !== 'complete',
          stage,
          progress,
          message: message || getStageMessage(stage)
        });
      };

      const loader = createBrowserZipLoader();
      const result = await loader.loadFromUrl(url, options, progressCallback);

      if (result.isSuccess()) {
        const zipResult = result.value;

        setLoadedState((prev) => ({
          ...prev,
          result: zipResult,
          error: null
        }));

        setLoadingState({
          isLoading: false,
          stage: 'complete',
          progress: 100,
          message: 'ZIP file loaded successfully'
        });

        onMessage?.('success', `Loaded ZIP from URL: ${url}`);

        // Load configuration if found
        if (zipResult.config) {
          onConfigurationLoad?.(zipResult.config);
          onMessage?.('info', `Configuration loaded from ZIP`);
        }

        // Import the raw data for processing by the orchestrator
        if (zipResult.directory) {
          onImport?.(zipResult.directory);
        } else if (zipResult.files.length > 0) {
          onImport?.(zipResult.files);
        }

        onLoadComplete?.();
      } else {
        const errorMessage = result.message;
        setLoadedState((prev) => ({
          ...prev,
          error: errorMessage,
          result: null
        }));

        setLoadingState({
          isLoading: false,
          stage: null,
          progress: 0,
          message: ''
        });

        onMessage?.('error', `Failed to load ZIP from URL: ${errorMessage}`);
      }
    },
    [onMessage, onLoadComplete]
  );

  // Handle file selection - now defined after loadZipFileInternal
  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];
      if (!isZipFile(file.name)) {
        setLoadedState((prev) => ({
          ...prev,
          error: `Selected file "${file.name}" is not a ZIP file`,
          result: null
        }));
        onMessage?.('error', `File "${file.name}" is not a ZIP file`);
        return;
      }

      await loadZipFileInternal(file);
    },
    [loadZipFileInternal, onMessage]
  );

  // Handle drag and drop - now defined after handleFileSelect
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer.files;
      await handleFileSelect(files);
    },
    [handleFileSelect]
  );

  // Auto-load from URL parameter
  React.useEffect(() => {
    if (zipFileUrl && !loadingState.isLoading && !loadedState.result && !loadedState.error) {
      loadFromUrl(zipFileUrl);
    }
  }, [zipFileUrl, loadFromUrl, loadingState.isLoading, loadedState.result, loadedState.error]);

  const getStageMessage = (stage: ZipLoadingStage): string => {
    switch (stage) {
      case 'reading-file':
        return 'Reading ZIP file...';
      case 'parsing-zip':
        return 'Parsing ZIP archive...';
      case 'loading-manifest':
        return 'Loading manifest...';
      case 'loading-config':
        return 'Loading configuration...';
      case 'extracting-files':
        return 'Extracting files...';
      case 'processing-resources':
        return 'Processing resources...';
      case 'complete':
        return 'Complete!';
      default:
        return 'Processing...';
    }
  };

  const getStageIcon = (stage: ZipLoadingStage | null) => {
    switch (stage) {
      case 'complete':
        return CheckCircleIcon;
      case null:
        return DocumentArrowDownIcon;
      default:
        return ArrowPathIcon;
    }
  };

  return (
    <div className={`p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <DocumentArrowDownIcon className="h-8 w-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">ZIP Loader</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* URL Loading Section */}
        {zipFileUrl && !loadedState.result && !loadedState.error && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Loading from URL</h3>
            <p className="text-sm text-blue-700 break-all">{zipFileUrl}</p>
          </div>
        )}

        {/* File Upload Area */}
        {!loadingState.isLoading && !loadedState.result && (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <FolderOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select or Drop ZIP File</h3>
            <p className="text-gray-600 mb-4">Choose a ZIP file containing resources to load and process</p>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
              Browse Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>
        )}

        {/* Loading Progress */}
        {loadingState.isLoading && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {React.createElement(getStageIcon(loadingState.stage), {
                  className: `w-5 h-5 ${
                    loadingState.stage === 'complete' ? 'text-green-500' : 'text-blue-500 animate-spin'
                  }`
                })}
                <span className="text-sm font-medium text-gray-900">{loadingState.message}</span>
              </div>
              <span className="text-sm text-gray-500">{loadingState.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${loadingState.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Loaded Content Summary */}
        {loadedState.result && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="font-medium">ZIP file loaded successfully</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">File Information</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>Name:</strong> {loadedState.fileName}
                  </div>
                  {loadedState.fileSize && (
                    <div>
                      <strong>Size:</strong> {formatFileSize(loadedState.fileSize)}
                    </div>
                  )}
                  <div>
                    <strong>Files:</strong> {loadedState.result.files.length}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Content</h4>
                <div className="space-y-1 text-sm">
                  {loadedState.result.manifest && (
                    <div className="flex items-center space-x-1">
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      <span>Manifest found</span>
                    </div>
                  )}
                  {loadedState.result.config && (
                    <div className="flex items-center space-x-1">
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      <span>Configuration found</span>
                    </div>
                  )}
                  {loadedState.result.processedResources && (
                    <div className="flex items-center space-x-1">
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      <span>Resources processed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {loadedState.result.manifest && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Archive Information</h4>
                <div className="text-sm text-blue-800">
                  <div>
                    <strong>Created:</strong>{' '}
                    {new Date(loadedState.result.manifest.timestamp).toLocaleString()}
                  </div>
                  {loadedState.result.manifest.input && (
                    <div>
                      <strong>Source:</strong> {loadedState.result.manifest.input.type} -{' '}
                      {loadedState.result.manifest.input.originalPath}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {loadedState.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-red-600 mb-2">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span className="font-medium">Error Loading ZIP</span>
            </div>
            <p className="text-sm text-red-700">{loadedState.error}</p>
            <button
              onClick={() => setLoadedState((prev) => ({ ...prev, error: null }))}
              className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Help Information */}
        {!loadingState.isLoading && !loadedState.result && !loadedState.error && (
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">ZIP Loader</p>
                <p>
                  Load ZIP archives containing resource files and configurations. The loader supports
                  automatic configuration application and resource processing.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZipLoaderView;
