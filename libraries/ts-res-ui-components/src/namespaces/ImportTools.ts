/**
 * Tools and utilities for import operations.
 *
 * This namespace contains the ImportView component and re-exports utilities for
 * exporting data in various formats. For file processing operations, use
 * FileTreeHelpers from `@fgv/ts-web-extras` directly.
 *
 * @example
 * ```tsx
 * import { ImportTools } from '@fgv/ts-res-ui-components';
 * import { FileTreeHelpers } from '@fgv/ts-web-extras';
 *
 * // Use the ImportView component for file/directory imports
 * <ImportTools.ImportView
 *   onImport={handleFileImport}
 *   onBundleImport={handleBundleImport}
 *   onZipImport={handleZipImport}
 * />
 *
 * // For file processing, use FileTreeHelpers directly
 * const fileTree = await FileTreeHelpers.fromFileList(fileInput);
 * const dirTree = await FileTreeHelpers.fromDirectoryUpload(dirInput);
 * ImportTools.exportAsJson(data, 'my-resources.json');
 * ```
 *
 * @public
 */

// Export the ImportView component (dual export with ZipTools)
export { ImportView } from '../components/views/ImportView';

// File processing utilities have been removed - use FileTreeHelpers from @fgv/ts-web-extras directly

// Export utilities moved to ts-web-extras
export { exportAsJson, exportUsingFileSystemAPI } from '@fgv/ts-web-extras';

// Export types related to file handling and processing
export type { IImportViewProps } from '../types';
