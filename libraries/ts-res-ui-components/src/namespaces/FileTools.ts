/**
 * Tools and utilities for file processing and import/export operations.
 *
 * This namespace contains functions for reading files from inputs, processing
 * directories, and exporting data in various formats including JSON and ZIP.
 *
 * @example
 * ```tsx
 * import { FileTools } from '@fgv/ts-res-ui-components';
 *
 * // Read files from file input
 * const files = await FileTools.readFilesFromInput(fileInput);
 *
 * // Convert files to directory structure
 * const directory = FileTools.filesToDirectory(files);
 *
 * // Export as JSON
 * FileTools.exportAsJson(data, 'my-resources.json');
 * ```
 *
 * @public
 */

export {
  readFilesFromInput,
  filesToDirectory,
  exportAsJson,
  exportUsingFileSystemAPI
} from '../utils/fileProcessing';
