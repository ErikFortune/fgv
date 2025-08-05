'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.isZipFile =
  exports.formatFileSize =
  exports.zipTreeToDirectory =
  exports.zipTreeToFiles =
  exports.parseConfiguration =
  exports.parseManifest =
  exports.generateZipFilename =
  exports.createNodeZipBuilder =
  exports.prepareZipDataFromDirectory =
  exports.prepareZipData =
  exports.createBrowserZipLoader =
  exports.loadZipFromUrl =
  exports.loadZipFile =
    void 0;
var tslib_1 = require('tslib');
// Export types
tslib_1.__exportStar(require('./types'), exports);
// Export utilities
tslib_1.__exportStar(require('./zipUtils'), exports);
// Export browser ZIP loader
tslib_1.__exportStar(require('./browserZipLoader'), exports);
// Export Node.js ZIP builder (placeholder)
tslib_1.__exportStar(require('./nodeZipBuilder'), exports);
// Re-export commonly used functions
var browserZipLoader_1 = require('./browserZipLoader');
Object.defineProperty(exports, 'loadZipFile', {
  enumerable: true,
  get: function () {
    return browserZipLoader_1.loadZipFile;
  }
});
Object.defineProperty(exports, 'loadZipFromUrl', {
  enumerable: true,
  get: function () {
    return browserZipLoader_1.loadZipFromUrl;
  }
});
Object.defineProperty(exports, 'createBrowserZipLoader', {
  enumerable: true,
  get: function () {
    return browserZipLoader_1.createBrowserZipLoader;
  }
});
var nodeZipBuilder_1 = require('./nodeZipBuilder');
Object.defineProperty(exports, 'prepareZipData', {
  enumerable: true,
  get: function () {
    return nodeZipBuilder_1.prepareZipData;
  }
});
Object.defineProperty(exports, 'prepareZipDataFromDirectory', {
  enumerable: true,
  get: function () {
    return nodeZipBuilder_1.prepareZipDataFromDirectory;
  }
});
Object.defineProperty(exports, 'createNodeZipBuilder', {
  enumerable: true,
  get: function () {
    return nodeZipBuilder_1.createNodeZipBuilder;
  }
});
var zipUtils_1 = require('./zipUtils');
Object.defineProperty(exports, 'generateZipFilename', {
  enumerable: true,
  get: function () {
    return zipUtils_1.generateZipFilename;
  }
});
Object.defineProperty(exports, 'parseManifest', {
  enumerable: true,
  get: function () {
    return zipUtils_1.parseManifest;
  }
});
Object.defineProperty(exports, 'parseConfiguration', {
  enumerable: true,
  get: function () {
    return zipUtils_1.parseConfiguration;
  }
});
Object.defineProperty(exports, 'zipTreeToFiles', {
  enumerable: true,
  get: function () {
    return zipUtils_1.zipTreeToFiles;
  }
});
Object.defineProperty(exports, 'zipTreeToDirectory', {
  enumerable: true,
  get: function () {
    return zipUtils_1.zipTreeToDirectory;
  }
});
Object.defineProperty(exports, 'formatFileSize', {
  enumerable: true,
  get: function () {
    return zipUtils_1.formatFileSize;
  }
});
Object.defineProperty(exports, 'isZipFile', {
  enumerable: true,
  get: function () {
    return zipUtils_1.isZipFile;
  }
});
//# sourceMappingURL=index.js.map
