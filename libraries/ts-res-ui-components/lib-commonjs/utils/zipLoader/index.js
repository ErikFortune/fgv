'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.processZipLoadResult = exports.processZipResources = exports.isZipFile = void 0;
// Export only the utilities actually being used
var zipUtils_1 = require('./zipUtils');
Object.defineProperty(exports, 'isZipFile', {
  enumerable: true,
  get: function () {
    return zipUtils_1.isZipFile;
  }
});
// ZIP processing helpers for integrating with ts-res-ui-components
var zipProcessingHelpers_1 = require('./zipProcessingHelpers');
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
//# sourceMappingURL=index.js.map
