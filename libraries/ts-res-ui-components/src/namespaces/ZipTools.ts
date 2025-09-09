/**
 * Tools and components for ZIP-based resource bundle management and importing.
 *
 * This namespace contains ImportView component and utilities for working with
 * ZIP-based resource bundles. Uses the ts-res zip-archive packlet for all ZIP operations,
 * and provides processing helpers for integrating ZIP data with ts-res-ui-components.
 *
 * @example
 * ```tsx
 * import { ZipTools } from '@fgv/ts-res-ui-components';
 * import { ZipArchive } from '@fgv/ts-res';
 *
 * // Use the ImportView component (handles ZIP files automatically)
 * <ZipTools.ImportView
 *   onImport={handleFileImport}
 *   onBundleImport={handleBundleImport}
 *   onZipImport={handleZipImport}
 *   onMessage={onMessage}
 * />
 *
 * // Or use zip-archive packlet directly with processing helpers
 * const loader = new ZipArchive.ZipArchiveLoader();
 * const zipResult = await loader.loadFromFile(zipFile);
 *
 * if (zipResult.isSuccess()) {
 *   const processResult = await ZipTools.processZipLoadResult(zipResult.value);
 *   if (processResult.isSuccess()) {
 *     console.log('Processed resources:', processResult.value);
 *   }
 * }
 *
 * // Utility functions
 * const isZip = ZipTools.isZipFile('resources.zip');
 * ```
 *
 * @public
 */

// Export the import-related view components
export { ImportView } from '../components/views/ImportView';

// Essential ZIP utilities (other functionality provided by ts-res zip-archive packlet)
export { isZipFile } from '../utils/zipLoader/zipUtils';

// ZIP processing helpers for integrating with ts-res-ui-components
export { processZipResources, processZipLoadResult } from '../utils/zipLoader/zipProcessingHelpers';

// Export view component props
export type { IImportViewProps } from '../types';
