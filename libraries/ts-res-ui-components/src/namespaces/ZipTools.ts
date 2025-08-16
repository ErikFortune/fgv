/**
 * Tools and components for ZIP-based resource bundle management and importing.
 *
 * This namespace contains ImportView and ZipLoaderView components, plus a comprehensive
 * API for creating, loading, and managing ZIP-based resource bundles. ZIP bundles are
 * a convenient way to distribute complete resource collections with configuration and metadata.
 *
 * The ZIP bundle format includes:
 * - Resource files in a structured directory layout
 * - Manifest file with metadata and configuration
 * - Optional compiled resource collections for runtime efficiency
 *
 * @example
 * ```tsx
 * import { ZipTools } from '@fgv/ts-res-ui-components';
 *
 * // Use the ImportView component
 * <ZipTools.ImportView
 *   onImport={handleFileImport}
 *   onBundleImport={handleBundleImport}
 *   onZipImport={handleZipImport}
 *   onMessage={onMessage}
 * />
 *
 * // Or use utility functions
 * const loader = ZipTools.createBrowserZipLoader();
 * const result = await loader.loadFromFile(zipFile, {
 *   autoProcessResources: true,
 *   autoapplyConfig: true
 * });
 * ```
 *
 * @public
 */

// Export the import-related view components
export { ImportView } from '../components/views/ImportView';
export { ZipLoaderView } from '../components/views/ZipLoaderView';

// Browser ZIP operations
export {
  BrowserZipLoader,
  createBrowserZipLoader,
  loadZipFile,
  loadZipFromUrl
} from '../utils/zipLoader/browserZipLoader';

// Node ZIP operations (for server-side or build tools)
export {
  NodeZipBuilder,
  createNodeZipBuilder,
  type BrowserZipData,
  prepareZipData,
  prepareZipDataFromDirectory
} from '../utils/zipLoader/nodeZipBuilder';

// ZIP utilities and helpers
export {
  generateZipFilename,
  createManifest,
  parseManifest,
  parseConfiguration,
  zipTreeToFiles,
  zipTreeToDirectory,
  normalizePath,
  getDirectoryName,
  sanitizeFilename,
  formatFileSize,
  isZipFile,
  getBaseName
} from '../utils/zipLoader/zipUtils';

// ZIP types and interfaces
export type {
  ZipManifest,
  ZipArchiveOptions,
  ZipArchiveResult,
  ZipLoadOptions,
  ZipLoadResult,
  ZipLoadingStage,
  ZipProgressCallback,
  IZipBuilder,
  IZipLoader,
  ZipFileItem,
  ZipFileTree
} from '../utils/zipLoader/types';
