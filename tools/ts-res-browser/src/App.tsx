import React from 'react';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
import FileImporter from './components/common/FileImporter';
import { useFileImport } from './hooks/useFileImport';
import { useResourceManager } from './hooks/useResourceManager';

const App: React.FC = () => {
  const { state: fileState, actions: fileActions } = useFileImport();
  const { state: resourceState, actions: resourceActions } = useResourceManager();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <DocumentMagnifyingGlassIcon className="h-16 w-16 text-res-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">TS-RES Browser</h1>
          <p className="text-gray-600">
            Visual tool for loading, browsing, and experimenting with ts-res resources
          </p>
        </header>

        <main className="max-w-4xl mx-auto space-y-6">
          {/* File Import Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Import Resources</h2>
            <FileImporter
              onDirectoryImported={async (directory) => {
                fileActions.handleDirectoryImport(directory);
                await resourceActions.processDirectory(directory);
              }}
              onFilesImported={async (files) => {
                fileActions.handleFilesImport(files);
                await resourceActions.processFiles(files);
              }}
              onError={(error) => {
                fileActions.handleError(error);
                resourceActions.clearError();
              }}
            />
          </div>

          {/* Error Display */}
          {(fileState.error || resourceState.error) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-800 font-medium">Error</span>
                </div>
                <button
                  onClick={() => {
                    fileActions.clearError();
                    resourceActions.clearError();
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
              {fileState.error && <p className="text-red-700 mt-2">File Import: {fileState.error}</p>}
              {resourceState.error && (
                <p className="text-red-700 mt-2">Resource Processing: {resourceState.error}</p>
              )}
            </div>
          )}

          {/* Import Results */}
          {(fileState.hasImportedData || resourceState.hasProcessedData) && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Imported Resources</h2>
                <button
                  onClick={() => {
                    fileActions.reset();
                    resourceActions.reset();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>

              {/* File Import Results */}
              {fileState.importedDirectory && (
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-medium text-gray-800">File Import</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">Directory: {fileState.importedDirectory.name}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Path: {fileState.importedDirectory.path}</p>
                    <p>Files: {fileState.importedDirectory.files.length}</p>
                    <p>Subdirectories: {fileState.importedDirectory.directories.length}</p>
                  </div>
                </div>
              )}

              {fileState.importedFiles.length > 0 && (
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-medium text-gray-800">File Import</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Files: {fileState.importedFiles.length}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <ul className="list-disc list-inside space-y-1">
                      {fileState.importedFiles.map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Resource Processing Results */}
              {resourceState.processedResources && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Resource Processing</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="font-medium">
                      Processed Resources: {resourceState.processedResources.summary.totalResources}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>Resource IDs:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {resourceState.processedResources.summary.resourceIds.map((id, index) => (
                        <li key={index} className="font-mono text-xs">
                          {id}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Processing Status */}
              {resourceState.isProcessing && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-800">Processing resources...</span>
                </div>
              )}
            </div>
          )}

          {/* Welcome Message */}
          {!fileState.hasImportedData &&
            !resourceState.hasProcessedData &&
            !fileState.error &&
            !resourceState.error && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Welcome</h2>
                <p className="text-gray-700">
                  This tool helps you explore and understand ts-res resource structures. Import your resources
                  above to get started.
                </p>
              </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default App;
