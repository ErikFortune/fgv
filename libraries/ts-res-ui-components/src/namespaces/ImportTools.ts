/**
 * Tools and utilities for import operations and file processing.
 *
 * This namespace contains the ImportView component and functions for reading files
 * from inputs, processing directories, and exporting data in various formats including
 * JSON and ZIP. It provides a comprehensive toolkit for handling resource imports
 * and file operations.
 *
 * @example
 * ```tsx
 * import { ImportTools } from '@fgv/ts-res-ui-components';
 *
 * // Use the ImportView component for file/directory imports
 * <ImportTools.ImportView
 *   onImport={handleFileImport}
 *   onBundleImport={handleBundleImport}
 *   onZipImport={handleZipImport}
 * />
 *
 * // Or use utility functions for file processing
 * const files = await ImportTools.readFilesFromInput(fileInput);
 * const directory = ImportTools.filesToDirectory(files);
 * ImportTools.exportAsJson(data, 'my-resources.json');
 * ```
 *
 * @public
 */

// Export the ImportView component (dual export with ZipTools)
export { ImportView } from '../components/views/ImportView';

// Export file processing utilities - tree building from local, export from ts-web-extras
export { readFilesFromInput, filesToDirectory } from '../utils/fileProcessing';

// Export utilities moved to ts-web-extras
export { exportAsJson, exportUsingFileSystemAPI } from '@fgv/ts-web-extras';

// Export types related to file handling and processing
export type { IImportedFile, IImportedDirectory, IImportViewProps } from '../types';
