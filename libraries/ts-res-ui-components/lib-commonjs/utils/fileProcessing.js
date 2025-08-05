'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.readFilesFromInput = readFilesFromInput;
exports.filesToDirectory = filesToDirectory;
exports.exportAsJson = exportAsJson;
exports.exportUsingFileSystemAPI = exportUsingFileSystemAPI;
var tslib_1 = require('tslib');
/**
 * Read files from file input element
 */
function readFilesFromInput(files) {
  return tslib_1.__awaiter(this, void 0, void 0, function () {
    var importedFiles, i, file, content;
    return tslib_1.__generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          importedFiles = [];
          i = 0;
          _a.label = 1;
        case 1:
          if (!(i < files.length)) return [3 /*break*/, 4];
          file = files[i];
          return [4 /*yield*/, readFileContent(file)];
        case 2:
          content = _a.sent();
          importedFiles.push({
            name: file.name,
            path: file.webkitRelativePath || file.name,
            content: content,
            type: file.type
          });
          _a.label = 3;
        case 3:
          i++;
          return [3 /*break*/, 1];
        case 4:
          return [2 /*return*/, importedFiles];
      }
    });
  });
}
/**
 * Read file content as text
 */
function readFileContent(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var _a;
      resolve((_a = e.target) === null || _a === void 0 ? void 0 : _a.result);
    };
    reader.onerror = function (e) {
      reject(new Error('Failed to read file '.concat(file.name, ': ').concat(e)));
    };
    reader.readAsText(file);
  });
}
/**
 * Convert flat file list to directory structure
 */
function filesToDirectory(files) {
  // Group files by directory path
  var filesByPath = new Map();
  var dirPaths = new Set();
  files.forEach(function (file) {
    if (file.path) {
      var parts = file.path.split('/');
      if (parts.length > 1) {
        // File is in a subdirectory
        var dirPath = parts.slice(0, -1).join('/');
        dirPaths.add(dirPath);
        if (!filesByPath.has(dirPath)) {
          filesByPath.set(dirPath, []);
        }
        filesByPath
          .get(dirPath)
          .push(tslib_1.__assign(tslib_1.__assign({}, file), { name: parts[parts.length - 1] }));
      } else {
        // File is in root
        if (!filesByPath.has('')) {
          filesByPath.set('', []);
        }
        filesByPath.get('').push(file);
      }
    } else {
      // No path, add to root
      if (!filesByPath.has('')) {
        filesByPath.set('', []);
      }
      filesByPath.get('').push(file);
    }
  });
  // Build directory tree
  var buildDirectory = function (path, name) {
    var dir = {
      name: name,
      path: path,
      files: filesByPath.get(path) || [],
      subdirectories: []
    };
    // Find subdirectories
    var prefix = path ? ''.concat(path, '/') : '';
    dirPaths.forEach(function (dirPath) {
      if (dirPath.startsWith(prefix)) {
        var remaining = dirPath.slice(prefix.length);
        if (remaining && !remaining.includes('/')) {
          // This is a direct subdirectory
          dir.subdirectories.push(buildDirectory(dirPath, remaining));
        }
      }
    });
    return dir;
  };
  return buildDirectory('', 'root');
}
/**
 * Export data as JSON file
 */
function exportAsJson(data, filename) {
  var json = JSON.stringify(data, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
/**
 * Export data using File System Access API if available
 */
function exportUsingFileSystemAPI(data_1, suggestedName_1) {
  return tslib_1.__awaiter(this, arguments, void 0, function (data, suggestedName, description) {
    var fileHandle, json, writable, error_1;
    if (description === void 0) {
      description = 'JSON files';
    }
    return tslib_1.__generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          if (!('showSaveFilePicker' in window)) {
            return [2 /*return*/, false];
          }
          _a.label = 1;
        case 1:
          _a.trys.push([1, 6, , 7]);
          return [
            4 /*yield*/,
            window.showSaveFilePicker({
              suggestedName: suggestedName,
              types: [
                {
                  description: description,
                  accept: {
                    'application/json': ['.json']
                  }
                }
              ]
            })
          ];
        case 2:
          fileHandle = _a.sent();
          json = JSON.stringify(data, null, 2);
          return [4 /*yield*/, fileHandle.createWritable()];
        case 3:
          writable = _a.sent();
          return [4 /*yield*/, writable.write(json)];
        case 4:
          _a.sent();
          return [4 /*yield*/, writable.close()];
        case 5:
          _a.sent();
          return [2 /*return*/, true];
        case 6:
          error_1 = _a.sent();
          // User cancelled or other error
          if (error_1.name === 'AbortError') {
            return [2 /*return*/, false];
          }
          throw error_1;
        case 7:
          return [2 /*return*/];
      }
    });
  });
}
//# sourceMappingURL=fileProcessing.js.map
