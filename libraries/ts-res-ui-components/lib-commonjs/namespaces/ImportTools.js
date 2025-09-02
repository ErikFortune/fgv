'use strict';
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
 *   onMessage={onMessage}
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
Object.defineProperty(exports, '__esModule', { value: true });
exports.exportUsingFileSystemAPI =
  exports.exportAsJson =
  exports.filesToDirectory =
  exports.readFilesFromInput =
  exports.ImportView =
    void 0;
// Export the ImportView component (dual export with ZipTools)
var ImportView_1 = require('../components/views/ImportView');
Object.defineProperty(exports, 'ImportView', {
  enumerable: true,
  get: function () {
    return ImportView_1.ImportView;
  }
});
// Export file processing utilities
var fileProcessing_1 = require('../utils/fileProcessing');
Object.defineProperty(exports, 'readFilesFromInput', {
  enumerable: true,
  get: function () {
    return fileProcessing_1.readFilesFromInput;
  }
});
Object.defineProperty(exports, 'filesToDirectory', {
  enumerable: true,
  get: function () {
    return fileProcessing_1.filesToDirectory;
  }
});
Object.defineProperty(exports, 'exportAsJson', {
  enumerable: true,
  get: function () {
    return fileProcessing_1.exportAsJson;
  }
});
Object.defineProperty(exports, 'exportUsingFileSystemAPI', {
  enumerable: true,
  get: function () {
    return fileProcessing_1.exportUsingFileSystemAPI;
  }
});
//# sourceMappingURL=ImportTools.js.map
