import React, { useState, useCallback } from 'react';
import { FolderOpenIcon, DocumentArrowUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import {
  fileImporter,
  isFileSystemAccessSupported,
  ImportedDirectory,
  ImportedFile
} from '../../utils/fileImport';
import { Result } from '@fgv/ts-utils';

interface FileImporterProps {
  onDirectoryImported?: (directory: ImportedDirectory) => void;
  onFilesImported?: (files: ImportedFile[]) => void;
  onError?: (error: string) => void;
  startInDirectory?: string;
}

export const FileImporter: React.FC<FileImporterProps> = ({
  onDirectoryImported,
  onFilesImported,
  onError,
  startInDirectory
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [importMethod, setImportMethod] = useState<'modern' | 'fallback'>(
    isFileSystemAccessSupported() ? 'modern' : 'fallback'
  );

  const handleDirectoryImport = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fileImporter.pickDirectory({
        startIn: startInDirectory
      });

      if (result.isSuccess()) {
        onDirectoryImported?.(result.value);
      } else {
        onError?.(result.error);
      }
    } catch (error) {
      onError?.(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }, [onDirectoryImported, onError, startInDirectory]);

  const handleFileImport = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fileImporter.pickFiles({
        acceptedTypes: ['.json'],
        multiple: true,
        startIn: startInDirectory
      });

      if (result.isSuccess()) {
        onFilesImported?.(result.value);
      } else {
        onError?.(result.error);
      }
    } catch (error) {
      onError?.(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }, [onFilesImported, onError, startInDirectory]);

  return (
    <div className="space-y-4">
      {/* Import Method Info */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        {importMethod === 'modern' ? (
          <>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Using modern File System Access API</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>Using fallback file input (limited browser support)</span>
          </>
        )}
      </div>

      {/* Import Controls */}
      <div className="flex flex-col space-y-3">
        {/* Directory Import */}
        <button
          onClick={handleDirectoryImport}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FolderOpenIcon className="w-5 h-5" />
          <span>{isLoading ? 'Importing...' : 'Import Resource Directory'}</span>
        </button>

        {/* File Import */}
        <button
          onClick={handleFileImport}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <DocumentArrowUpIcon className="w-5 h-5" />
          <span>{isLoading ? 'Importing...' : 'Import Resource Files'}</span>
        </button>
      </div>

      {/* Browser Compatibility Warning */}
      {importMethod === 'fallback' && (
        <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Limited Browser Support</p>
            <p className="mt-1">
              Your browser doesn't support the File System Access API. For the best experience, use Chrome,
              Edge, or another Chromium-based browser.
            </p>
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="text-sm text-gray-600 space-y-2">
        <p className="font-medium">Import Options:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>
            <strong>Import Directory:</strong> Select a folder containing ts-res resources
          </li>
          <li>
            <strong>Import Files:</strong> Select individual JSON resource files
          </li>
        </ul>
        <p className="mt-2">
          The importer will automatically detect and parse ts-res resource formats including Resource
          Collections, Resource Trees, and simple JSON files.
        </p>
      </div>
    </div>
  );
};

export default FileImporter;
