import React from 'react';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
import FileImporter from './components/common/FileImporter';
import { useFileImport } from './hooks/useFileImport';

const App: React.FC = () => {
  const { state, actions } = useFileImport();

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
              onDirectoryImported={actions.handleDirectoryImport}
              onFilesImported={actions.handleFilesImport}
              onError={actions.handleError}
            />
          </div>

          {/* Error Display */}
          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-800 font-medium">Error</span>
                </div>
                <button onClick={actions.clearError} className="text-red-600 hover:text-red-800">
                  ×
                </button>
              </div>
              <p className="text-red-700 mt-2">{state.error}</p>
            </div>
          )}

          {/* Import Results */}
          {state.hasImportedData && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Imported Resources</h2>
                <button onClick={actions.reset} className="text-gray-500 hover:text-gray-700">
                  Clear
                </button>
              </div>

              {state.importedDirectory && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">Directory: {state.importedDirectory.name}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Path: {state.importedDirectory.path}</p>
                    <p>Files: {state.importedDirectory.files.length}</p>
                    <p>Subdirectories: {state.importedDirectory.directories.length}</p>
                  </div>
                </div>
              )}

              {state.importedFiles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Files: {state.importedFiles.length}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <ul className="list-disc list-inside space-y-1">
                      {state.importedFiles.map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Welcome Message */}
          {!state.hasImportedData && !state.error && (
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
