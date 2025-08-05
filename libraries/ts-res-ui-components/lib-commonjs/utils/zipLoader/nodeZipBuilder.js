'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.NodeZipBuilder = void 0;
exports.createNodeZipBuilder = createNodeZipBuilder;
exports.prepareZipData = prepareZipData;
exports.prepareZipDataFromDirectory = prepareZipDataFromDirectory;
var tslib_1 = require('tslib');
var ts_utils_1 = require('@fgv/ts-utils');
var zipUtils_1 = require('./zipUtils');
/**
 * Node.js-based ZIP builder implementation
 *
 * Note: This is a placeholder implementation for interface compatibility.
 * The actual Node.js ZIP building functionality should be implemented
 * in a separate Node.js-specific package or tool.
 */
var NodeZipBuilder = /** @class */ (function () {
  function NodeZipBuilder() {}
  /**
   * Create ZIP from files
   */
  NodeZipBuilder.prototype.createFromFiles = function (files_1) {
    return tslib_1.__awaiter(this, arguments, void 0, function (files, options) {
      if (options === void 0) {
        options = {};
      }
      return tslib_1.__generator(this, function (_a) {
        return [
          2 /*return*/,
          (0, ts_utils_1.fail)(
            'Node.js ZIP building not implemented in browser library. Use @fgv/ts-res-browser-cli for ZIP creation.'
          )
        ];
      });
    });
  };
  /**
   * Create ZIP from directory
   */
  NodeZipBuilder.prototype.createFromDirectory = function (directory_1) {
    return tslib_1.__awaiter(this, arguments, void 0, function (directory, options) {
      if (options === void 0) {
        options = {};
      }
      return tslib_1.__generator(this, function (_a) {
        return [
          2 /*return*/,
          (0, ts_utils_1.fail)(
            'Node.js ZIP building not implemented in browser library. Use @fgv/ts-res-browser-cli for ZIP creation.'
          )
        ];
      });
    });
  };
  /**
   * Create ZIP from file system path
   */
  NodeZipBuilder.prototype.createFromPath = function (path_1) {
    return tslib_1.__awaiter(this, arguments, void 0, function (path, options) {
      if (options === void 0) {
        options = {};
      }
      return tslib_1.__generator(this, function (_a) {
        return [
          2 /*return*/,
          (0, ts_utils_1.fail)(
            'Node.js ZIP building not implemented in browser library. Use @fgv/ts-res-browser-cli for ZIP creation.'
          )
        ];
      });
    });
  };
  return NodeZipBuilder;
})();
exports.NodeZipBuilder = NodeZipBuilder;
/**
 * Create a new Node.js ZIP builder instance
 *
 * Note: This returns a placeholder implementation.
 * For actual ZIP building, use the ts-res-browser-cli tool.
 */
function createNodeZipBuilder() {
  return new NodeZipBuilder();
}
/**
 * Prepare ZIP data structure for browser download or server processing
 */
function prepareZipData(files, options) {
  if (options === void 0) {
    options = {};
  }
  try {
    var timestamp = new Date().toISOString();
    var filename = options.filename || 'ts-res-bundle';
    // Create manifest
    var manifest = (0, zipUtils_1.createManifest)(
      'file',
      'browser-files',
      'files/',
      options.includeConfig ? 'config.json' : undefined
    );
    // Prepare file data
    var zipFiles = files.map(function (file) {
      return {
        path: (0, zipUtils_1.normalizePath)(file.path || file.name),
        content: file.content
      };
    });
    // Add manifest
    zipFiles.push({
      path: 'manifest.json',
      content: JSON.stringify(manifest, null, 2)
    });
    // Add configuration if provided
    if (options.includeConfig && options.config) {
      zipFiles.push({
        path: 'config.json',
        content: JSON.stringify(options.config, null, 2)
      });
    }
    return (0, ts_utils_1.succeed)({
      files: zipFiles,
      manifest: manifest,
      config: options.config
    });
  } catch (error) {
    return (0, ts_utils_1.fail)(
      'Failed to prepare ZIP data: '.concat(error instanceof Error ? error.message : String(error))
    );
  }
}
/**
 * Prepare ZIP data from directory structure
 */
function prepareZipDataFromDirectory(directory, options) {
  if (options === void 0) {
    options = {};
  }
  try {
    // Flatten directory to files
    var files_1 = [];
    var collectFiles_1 = function (dir, basePath) {
      if (basePath === void 0) {
        basePath = '';
      }
      // Add files from current directory
      dir.files.forEach(function (file) {
        files_1.push(
          tslib_1.__assign(tslib_1.__assign({}, file), {
            path: basePath ? ''.concat(basePath, '/').concat(file.name) : file.name
          })
        );
      });
      // Recursively collect from subdirectories
      if (dir.subdirectories) {
        dir.subdirectories.forEach(function (subdir) {
          var subdirPath = basePath ? ''.concat(basePath, '/').concat(subdir.name) : subdir.name;
          collectFiles_1(subdir, subdirPath);
        });
      }
    };
    collectFiles_1(directory);
    return prepareZipData(
      files_1,
      tslib_1.__assign(tslib_1.__assign({}, options), {
        filename: options.filename || (0, zipUtils_1.sanitizeFilename)(directory.name)
      })
    );
  } catch (error) {
    return (0, ts_utils_1.fail)(
      'Failed to prepare ZIP data from directory: '.concat(
        error instanceof Error ? error.message : String(error)
      )
    );
  }
}
//# sourceMappingURL=nodeZipBuilder.js.map
