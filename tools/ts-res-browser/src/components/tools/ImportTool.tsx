import React, { useEffect, useRef } from 'react';
import { DocumentArrowUpIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Message } from '../../types/app';
import { UseFileImportReturn } from '../../hooks/useFileImport';
import { UseResourceManagerReturn } from '../../hooks/useResourceManager';
import FileImporter from '../common/FileImporter';
import { useUrlParams } from '../../hooks/useUrlParams';

interface ImportToolProps {
  onMessage: (type: Message['type'], message: string) => void;
  fileImport: UseFileImportReturn;
  resourceManager: UseResourceManagerReturn;
}

const ImportTool: React.FC<ImportToolProps> = ({ onMessage, fileImport, resourceManager }) => {
  const { state: fileImportState, actions: fileImportActions } = fileImport;
  const { state: resourceState, actions: resourceActions } = resourceManager;
  const { urlParams } = useUrlParams();

  // Track if we've already processed the current import to prevent infinite loops
  const lastProcessedImport = useRef<{
    directory: any;
    files: any[];
    hasProcessedData: boolean;
  }>({
    directory: null,
    files: [],
    hasProcessedData: false
  });

  // Handle file import completion
  useEffect(() => {
    if (fileImportState.hasImportedData) {
      const currentDirectory = fileImportState.importedDirectory;
      const currentFiles = fileImportState.importedFiles;

      // Check if this is a new import that we haven't processed yet
      const isNewImport =
        currentDirectory !== lastProcessedImport.current.directory ||
        currentFiles !== lastProcessedImport.current.files ||
        fileImportState.hasImportedData !== lastProcessedImport.current.hasProcessedData;

      if (isNewImport && !resourceState.isProcessing) {
        // Update our tracking reference
        lastProcessedImport.current = {
          directory: currentDirectory,
          files: currentFiles,
          hasProcessedData: fileImportState.hasImportedData
        };

        if (currentDirectory) {
          onMessage('info', 'Directory imported successfully. Processing resources...');
          resourceActions.processDirectory(currentDirectory);
        } else if (currentFiles.length > 0) {
          onMessage('info', `${currentFiles.length} files imported successfully. Processing resources...`);
          resourceActions.processFiles(currentFiles);
        }
      }
    }
  }, [
    fileImportState.hasImportedData,
    fileImportState.importedDirectory,
    fileImportState.importedFiles,
    resourceState.isProcessing,
    resourceActions,
    onMessage
  ]);

  // Handle resource processing completion
  useEffect(() => {
    if (resourceState.processedResources) {
      const resourceCount = resourceState.processedResources.summary.resourceIds.length;
      onMessage('success', `Resources processed successfully! Found ${resourceCount} resources.`);
    }
  }, [resourceState.processedResources, onMessage]);

  // Handle errors
  useEffect(() => {
    if (fileImportState.error) {
      onMessage('error', `Import error: ${fileImportState.error}`);
    }
  }, [fileImportState.error, onMessage]);

  useEffect(() => {
    if (resourceState.error) {
      onMessage('error', `Processing error: ${resourceState.error}`);
    }
  }, [resourceState.error, onMessage]);

  const handleReset = () => {
    // Reset the tracking reference
    lastProcessedImport.current = {
      directory: null,
      files: [],
      hasProcessedData: false
    };

    fileImportActions.reset();
    resourceActions.reset();
    onMessage('info', 'Import data cleared');
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <DocumentArrowUpIcon className="h-8 w-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Import Resources</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: File Import */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Files</h3>

          <FileImporter
            onDirectoryImported={fileImportActions.handleDirectoryImport}
            onFilesImported={fileImportActions.handleFilesImport}
            onError={fileImportActions.handleError}
            startInDirectory={urlParams.inputStartDir}
          />
        </div>

        {/* Right column: Status & Info */}
        <div className="space-y-6">
          {/* Import Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Status</h3>

            <div className="space-y-3">
              {/* File Import Status */}
              <div className="flex items-center space-x-3">
                {fileImportState.hasImportedData ? (
                  <>
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-900">
                      {fileImportState.importedDirectory
                        ? 'Directory imported'
                        : `${fileImportState.importedFiles.length} files imported`}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                    <span className="text-sm text-gray-500">No files imported yet</span>
                  </>
                )}
              </div>

              {/* Resource Processing Status */}
              <div className="flex items-center space-x-3">
                {resourceState.isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-900">Processing resources...</span>
                  </>
                ) : resourceState.processedResources ? (
                  <>
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-900">
                      {resourceState.processedResources.summary.resourceIds.length} resources processed
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                    <span className="text-sm text-gray-500">No resources processed yet</span>
                  </>
                )}
              </div>
            </div>

            {/* Reset Button */}
            {(fileImportState.hasImportedData || resourceState.hasProcessedData) && (
              <button
                onClick={handleReset}
                className="mt-4 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Import Data
              </button>
            )}
          </div>

          {/* Resource Summary */}
          {resourceState.processedResources && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Summary</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Resources:</span>
                  <span className="font-medium">
                    {resourceState.processedResources.summary.resourceIds.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Count:</span>
                  <span className="font-medium">
                    {resourceState.processedResources.summary.totalResources}
                  </span>
                </div>
                {resourceState.processedResources.summary.warnings.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Warnings:</span>
                    <span className="font-medium text-yellow-600">
                      {resourceState.processedResources.summary.warnings.length}
                    </span>
                  </div>
                )}
                {resourceState.processedResources.summary.errorCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Errors:</span>
                    <span className="font-medium text-red-600">
                      {resourceState.processedResources.summary.errorCount}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium">Resources Ready!</p>
                    <p>Use the Source Browser to explore imported resources.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {(fileImportState.error || resourceState.error) && (
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
              <div className="flex items-start space-x-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Error</p>
                  <p>{fileImportState.error || resourceState.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportTool;
