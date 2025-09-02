'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.isZipFile = isZipFile;
/**
 * Validate ZIP file extension
 * @public
 */
function isZipFile(filename) {
  return filename.toLowerCase().endsWith('.zip');
}
//# sourceMappingURL=zipUtils.js.map
