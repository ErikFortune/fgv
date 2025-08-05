'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.BrowserZipLoader = void 0;
exports.createBrowserZipLoader = createBrowserZipLoader;
exports.loadZipFile = loadZipFile;
exports.loadZipFromUrl = loadZipFromUrl;
var tslib_1 = require('tslib');
var ts_utils_1 = require('@fgv/ts-utils');
var zipUtils_1 = require('./zipUtils');
var tsResIntegration_1 = require('../tsResIntegration');
// Dynamic import for JSZip to support both Node.js and browser environments
var JSZip = null;
/**
 * Get JSZip instance (assumes JSZip is available)
 */
function getJSZip() {
  if (JSZip) return JSZip;
  // Check if JSZip is globally available
  if (typeof window !== 'undefined' && window.JSZip) {
    JSZip = window.JSZip;
    return JSZip;
  }
  // Try to get JSZip from require/import (will work in bundled environments)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    JSZip = require('jszip');
    return JSZip;
  } catch (error) {
    throw new Error('JSZip is not available. Please install jszip as a dependency: npm install jszip');
  }
}
/**
 * Browser-based ZIP loader implementation
 */
var BrowserZipLoader = /** @class */ (function () {
  function BrowserZipLoader() {}
  /**
   * Load ZIP from File object
   */
  BrowserZipLoader.prototype.loadFromFile = function (file_1) {
    return tslib_1.__awaiter(this, arguments, void 0, function (file, options, onProgress) {
      var buffer, error_1;
      if (options === void 0) {
        options = {};
      }
      return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            onProgress === null || onProgress === void 0
              ? void 0
              : onProgress('reading-file', 0, 'Reading file: '.concat(file.name));
            if (!(0, zipUtils_1.isZipFile)(file.name)) {
              return [2 /*return*/, (0, ts_utils_1.fail)('File '.concat(file.name, ' is not a ZIP file'))];
            }
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, , 4]);
            return [4 /*yield*/, file.arrayBuffer()];
          case 2:
            buffer = _a.sent();
            onProgress === null || onProgress === void 0
              ? void 0
              : onProgress('reading-file', 100, 'File read complete');
            return [2 /*return*/, this.loadFromBuffer(buffer, options, onProgress)];
          case 3:
            error_1 = _a.sent();
            return [
              2 /*return*/,
              (0, ts_utils_1.fail)(
                'Failed to read file: '.concat(error_1 instanceof Error ? error_1.message : String(error_1))
              )
            ];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Load ZIP from ArrayBuffer
   */
  BrowserZipLoader.prototype.loadFromBuffer = function (buffer_1) {
    return tslib_1.__awaiter(this, arguments, void 0, function (buffer, options, onProgress) {
      var JSZipClass,
        zip,
        loadedZip,
        fileTree,
        manifest,
        config,
        files,
        directory,
        processedResources,
        configToUse,
        processResult,
        processResult,
        error_2;
      if (options === void 0) {
        options = {};
      }
      return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 10, , 11]);
            onProgress === null || onProgress === void 0
              ? void 0
              : onProgress('parsing-zip', 0, 'Parsing ZIP archive');
            JSZipClass = getJSZip();
            zip = new JSZipClass();
            return [4 /*yield*/, zip.loadAsync(buffer)];
          case 1:
            loadedZip = _a.sent();
            onProgress === null || onProgress === void 0
              ? void 0
              : onProgress('parsing-zip', 100, 'ZIP archive parsed');
            return [4 /*yield*/, this.buildFileTree(loadedZip, onProgress)];
          case 2:
            fileTree = _a.sent();
            // Load manifest
            onProgress === null || onProgress === void 0
              ? void 0
              : onProgress('loading-manifest', 0, 'Loading manifest');
            return [4 /*yield*/, this.loadManifest(loadedZip)];
          case 3:
            manifest = _a.sent();
            onProgress === null || onProgress === void 0
              ? void 0
              : onProgress('loading-manifest', 100, 'Manifest loaded');
            // Load configuration
            onProgress === null || onProgress === void 0
              ? void 0
              : onProgress('loading-config', 0, 'Loading configuration');
            return [4 /*yield*/, this.loadConfiguration(loadedZip, options)];
          case 4:
            config = _a.sent();
            onProgress === null || onProgress === void 0
              ? void 0
              : onProgress('loading-config', 100, 'Configuration loaded');
            // Extract files and directory structure
            onProgress === null || onProgress === void 0
              ? void 0
              : onProgress('extracting-files', 0, 'Extracting files');
            files = (0, zipUtils_1.zipTreeToFiles)(fileTree);
            directory = (0, zipUtils_1.zipTreeToDirectory)(fileTree);
            onProgress === null || onProgress === void 0
              ? void 0
              : onProgress('extracting-files', 100, 'Extracted '.concat(files.length, ' files'));
            processedResources = null;
            if (!options.autoProcessResources) return [3 /*break*/, 9];
            onProgress === null || onProgress === void 0
              ? void 0
              : onProgress('processing-resources', 0, 'Processing resources');
            configToUse = options.overrideConfig || config;
            if (!directory) return [3 /*break*/, 6];
            return [
              4 /*yield*/,
              (0, tsResIntegration_1.processImportedDirectory)(directory, configToUse || undefined)
            ];
          case 5:
            processResult = _a.sent();
            if (processResult.isSuccess()) {
              processedResources = processResult.value;
            }
            return [3 /*break*/, 8];
          case 6:
            if (!(files.length > 0)) return [3 /*break*/, 8];
            return [
              4 /*yield*/,
              (0, tsResIntegration_1.processImportedFiles)(files, configToUse || undefined)
            ];
          case 7:
            processResult = _a.sent();
            if (processResult.isSuccess()) {
              processedResources = processResult.value;
            }
            _a.label = 8;
          case 8:
            onProgress === null || onProgress === void 0
              ? void 0
              : onProgress('processing-resources', 100, 'Resources processed');
            _a.label = 9;
          case 9:
            onProgress === null || onProgress === void 0
              ? void 0
              : onProgress('complete', 100, 'ZIP loading complete');
            return [
              2 /*return*/,
              (0, ts_utils_1.succeed)({
                manifest: manifest,
                config: options.overrideConfig || config,
                files: files,
                directory: directory,
                processedResources: processedResources
              })
            ];
          case 10:
            error_2 = _a.sent();
            return [
              2 /*return*/,
              (0, ts_utils_1.fail)(
                'Failed to load ZIP: '.concat(error_2 instanceof Error ? error_2.message : String(error_2))
              )
            ];
          case 11:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Load ZIP from URL
   */
  BrowserZipLoader.prototype.loadFromUrl = function (url_1) {
    return tslib_1.__awaiter(this, arguments, void 0, function (url, options, onProgress) {
      var response, buffer, error_3;
      if (options === void 0) {
        options = {};
      }
      return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            onProgress === null || onProgress === void 0
              ? void 0
              : onProgress('reading-file', 0, 'Fetching from URL: '.concat(url));
            _a.label = 1;
          case 1:
            _a.trys.push([1, 4, , 5]);
            return [4 /*yield*/, fetch(url)];
          case 2:
            response = _a.sent();
            if (!response.ok) {
              return [
                2 /*return*/,
                (0, ts_utils_1.fail)(
                  'Failed to fetch ZIP from URL: '.concat(response.status, ' ').concat(response.statusText)
                )
              ];
            }
            return [4 /*yield*/, response.arrayBuffer()];
          case 3:
            buffer = _a.sent();
            onProgress === null || onProgress === void 0
              ? void 0
              : onProgress('reading-file', 100, 'URL fetch complete');
            return [2 /*return*/, this.loadFromBuffer(buffer, options, onProgress)];
          case 4:
            error_3 = _a.sent();
            return [
              2 /*return*/,
              (0, ts_utils_1.fail)(
                'Failed to fetch ZIP from URL: '.concat(
                  error_3 instanceof Error ? error_3.message : String(error_3)
                )
              )
            ];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Build file tree from JSZip instance
   */
  BrowserZipLoader.prototype.buildFileTree = function (zip, onProgress) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
      var files, directories, zipFiles, processed, _i, zipFiles_1, filename, zipEntry, content, progress;
      return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            files = new Map();
            directories = new Set();
            zipFiles = Object.keys(zip.files);
            processed = 0;
            (_i = 0), (zipFiles_1 = zipFiles);
            _a.label = 1;
          case 1:
            if (!(_i < zipFiles_1.length)) return [3 /*break*/, 6];
            filename = zipFiles_1[_i];
            zipEntry = zip.files[filename];
            if (!zipEntry.dir) return [3 /*break*/, 2];
            directories.add(filename);
            files.set(filename, {
              name:
                filename
                  .split('/')
                  .filter(function (p) {
                    return p;
                  })
                  .pop() || filename,
              path: filename,
              size: 0,
              isDirectory: true,
              lastModified: zipEntry.date
            });
            return [3 /*break*/, 4];
          case 2:
            return [4 /*yield*/, zipEntry.async('string')];
          case 3:
            content = _a.sent();
            files.set(filename, {
              name: filename.split('/').pop() || filename,
              path: filename,
              size: content.length,
              isDirectory: false,
              lastModified: zipEntry.date,
              content: content
            });
            _a.label = 4;
          case 4:
            processed++;
            progress = Math.round((processed / zipFiles.length) * 100);
            onProgress === null || onProgress === void 0
              ? void 0
              : onProgress('extracting-files', progress, 'Processing '.concat(filename));
            _a.label = 5;
          case 5:
            _i++;
            return [3 /*break*/, 1];
          case 6:
            return [
              2 /*return*/,
              {
                files: files,
                directories: directories,
                root: this.findCommonRoot(Array.from(files.keys()))
              }
            ];
        }
      });
    });
  };
  /**
   * Load manifest from ZIP
   */
  BrowserZipLoader.prototype.loadManifest = function (zip) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
      var manifestFile, manifestData, parseResult, error_4;
      return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            manifestFile = zip.files['manifest.json'];
            if (!manifestFile) {
              return [2 /*return*/, null];
            }
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, , 4]);
            return [4 /*yield*/, manifestFile.async('string')];
          case 2:
            manifestData = _a.sent();
            parseResult = (0, zipUtils_1.parseManifest)(manifestData);
            return [2 /*return*/, parseResult.isSuccess() ? parseResult.value : null];
          case 3:
            error_4 = _a.sent();
            console.warn('Failed to load manifest:', error_4);
            return [2 /*return*/, null];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Load configuration from ZIP
   */
  BrowserZipLoader.prototype.loadConfiguration = function (zip, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
      var configFile, configData, parseResult, error_5;
      return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (options.overrideConfig) {
              return [2 /*return*/, options.overrideConfig];
            }
            configFile = zip.files['config.json'];
            if (!configFile) {
              return [2 /*return*/, null];
            }
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, , 4]);
            return [4 /*yield*/, configFile.async('string')];
          case 2:
            configData = _a.sent();
            parseResult = (0, zipUtils_1.parseConfiguration)(configData);
            return [2 /*return*/, parseResult.isSuccess() ? parseResult.value : null];
          case 3:
            error_5 = _a.sent();
            console.warn('Failed to load configuration:', error_5);
            return [2 /*return*/, null];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Find common root directory from file paths
   */
  BrowserZipLoader.prototype.findCommonRoot = function (paths) {
    if (paths.length === 0) return '';
    if (paths.length === 1) return paths[0].split('/')[0] || '';
    var parts = paths[0].split('/');
    var commonLength = 0;
    var _loop_1 = function (i) {
      var part = parts[i];
      if (
        paths.every(function (path) {
          return path.split('/')[i] === part;
        })
      ) {
        commonLength = i + 1;
      } else {
        return 'break';
      }
    };
    for (var i = 0; i < parts.length; i++) {
      var state_1 = _loop_1(i);
      if (state_1 === 'break') break;
    }
    return parts.slice(0, commonLength).join('/');
  };
  return BrowserZipLoader;
})();
exports.BrowserZipLoader = BrowserZipLoader;
/**
 * Create a new browser ZIP loader instance
 */
function createBrowserZipLoader() {
  return new BrowserZipLoader();
}
/**
 * Convenience function to load ZIP from File with default options
 */
function loadZipFile(file, options, onProgress) {
  return tslib_1.__awaiter(this, void 0, void 0, function () {
    var loader;
    return tslib_1.__generator(this, function (_a) {
      loader = createBrowserZipLoader();
      return [2 /*return*/, loader.loadFromFile(file, options, onProgress)];
    });
  });
}
/**
 * Convenience function to load ZIP from URL with default options
 */
function loadZipFromUrl(url, options, onProgress) {
  return tslib_1.__awaiter(this, void 0, void 0, function () {
    var loader;
    return tslib_1.__generator(this, function (_a) {
      loader = createBrowserZipLoader();
      return [2 /*return*/, loader.loadFromUrl(url, options, onProgress)];
    });
  });
}
//# sourceMappingURL=browserZipLoader.js.map
