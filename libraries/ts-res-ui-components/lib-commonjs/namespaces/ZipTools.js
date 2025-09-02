'use strict';
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
Object.defineProperty(exports, '__esModule', { value: true });
exports.processZipLoadResult = exports.processZipResources = exports.isZipFile = exports.ImportView = void 0;
// Export the import-related view components
var ImportView_1 = require('../components/views/ImportView');
Object.defineProperty(exports, 'ImportView', {
  enumerable: true,
  get: function () {
    return ImportView_1.ImportView;
  }
});
// Essential ZIP utilities (other functionality provided by ts-res zip-archive packlet)
var zipUtils_1 = require('../utils/zipLoader/zipUtils');
Object.defineProperty(exports, 'isZipFile', {
  enumerable: true,
  get: function () {
    return zipUtils_1.isZipFile;
  }
});
// ZIP processing helpers for integrating with ts-res-ui-components
var zipProcessingHelpers_1 = require('../utils/zipLoader/zipProcessingHelpers');
Object.defineProperty(exports, 'processZipResources', {
  enumerable: true,
  get: function () {
    return zipProcessingHelpers_1.processZipResources;
  }
});
Object.defineProperty(exports, 'processZipLoadResult', {
  enumerable: true,
  get: function () {
    return zipProcessingHelpers_1.processZipLoadResult;
  }
});
//# sourceMappingURL=ZipTools.js.map
