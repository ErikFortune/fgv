/**
 * Helper functions and utilities for ZIP-based resource bundle management.
 *
 * This namespace provides a comprehensive API for creating, loading, and managing
 * ZIP-based resource bundles. ZIP bundles are a convenient way to distribute
 * complete resource collections with configuration and metadata.
 *
 * The ZIP bundle format includes:
 * - Resource files in a structured directory layout
 * - Manifest file with metadata and configuration
 * - Optional compiled resource collections for runtime efficiency
 *
 * @example
 * ```tsx
 * import { ZipHelpers } from '@fgv/ts-res-ui-components';
 *
 * // Create a ZIP bundle from files
 * const builder = ZipHelpers.createBrowserZipBuilder();
 * const zipData = await builder.createFromFiles(files, {
 *   filename: 'my-resources.zip',
 *   includeConfig: true
 * });
 *
 * // Load a ZIP bundle
 * const loader = ZipHelpers.createBrowserZipLoader();
 * const result = await loader.loadFromFile(zipFile, {
 *   autoProcessResources: true,
 *   autoapplyConfig: true
 * });
 *
 * // Work with ZIP manifest
 * const manifest = ZipHelpers.createManifest({
 *   version: '1.0.0',
 *   description: 'My Resource Bundle',
 *   input: { type: 'directory', path: '/resources' }
 * });
 * ```
 *
 * @public
 */

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
