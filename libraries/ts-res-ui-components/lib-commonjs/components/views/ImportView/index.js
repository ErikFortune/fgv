'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ImportView = void 0;
var tslib_1 = require('tslib');
var react_1 = tslib_1.__importStar(require('react'));
var outline_1 = require('@heroicons/react/24/outline');
var ImportView = function (_a) {
  var onImport = _a.onImport,
    onBundleImport = _a.onBundleImport,
    _b = _a.acceptedFileTypes,
    acceptedFileTypes = _b === void 0 ? ['.json'] : _b,
    onMessage = _a.onMessage,
    _c = _a.className,
    className = _c === void 0 ? '' : _c;
  var _d = (0, react_1.useState)(false),
    isLoading = _d[0],
    setIsLoading = _d[1];
  var _e = (0, react_1.useState)({
      hasImported: false,
      fileCount: 0,
      isDirectory: false,
      isBundle: false
    }),
    importStatus = _e[0],
    setImportStatus = _e[1];
  var _f = (0, react_1.useState)(null),
    error = _f[0],
    setError = _f[1];
  var fileInputRef = (0, react_1.useRef)(null);
  var dirInputRef = (0, react_1.useRef)(null);
  // Check for File System Access API support
  var isFileSystemAccessSupported = 'showDirectoryPicker' in window || 'showOpenFilePicker' in window;
  // Handle file selection
  var handleFileSelect = (0, react_1.useCallback)(
    function (event) {
      return tslib_1.__awaiter(void 0, void 0, void 0, function () {
        var files, importedFiles, bundleFile, i, file, content, importedFile, bundleData, err_1, errorMsg;
        var _a;
        return tslib_1.__generator(this, function (_b) {
          switch (_b.label) {
            case 0:
              files = event.target.files;
              if (!files || files.length === 0) return [2 /*return*/];
              setIsLoading(true);
              setError(null);
              _b.label = 1;
            case 1:
              _b.trys.push([1, 6, 7, 8]);
              importedFiles = [];
              bundleFile = void 0;
              i = 0;
              _b.label = 2;
            case 2:
              if (!(i < files.length)) return [3 /*break*/, 5];
              file = files[i];
              return [4 /*yield*/, readFileContent(file)];
            case 3:
              content = _b.sent();
              importedFile = {
                name: file.name,
                path: file.webkitRelativePath || file.name,
                content: content,
                type: file.type
              };
              // Check if it's a bundle file
              if (file.name.endsWith('.bundle.json') || file.name.includes('bundle')) {
                try {
                  bundleData = JSON.parse(content);
                  if (
                    ((_a = bundleData.metadata) === null || _a === void 0 ? void 0 : _a.type) ===
                      'ts-res-bundle' ||
                    bundleData.normalizedCollection
                  ) {
                    bundleFile = tslib_1.__assign(tslib_1.__assign({}, importedFile), { bundle: bundleData });
                  }
                } catch (_c) {
                  // Not a valid bundle, treat as regular file
                }
              }
              if (!bundleFile) {
                importedFiles.push(importedFile);
              }
              _b.label = 4;
            case 4:
              i++;
              return [3 /*break*/, 2];
            case 5:
              // Process results
              if (bundleFile) {
                setImportStatus({
                  hasImported: true,
                  fileCount: 1,
                  isDirectory: false,
                  isBundle: true
                });
                onMessage === null || onMessage === void 0
                  ? void 0
                  : onMessage('info', 'Bundle file detected: '.concat(bundleFile.name));
                if (onBundleImport && bundleFile.bundle) {
                  onBundleImport(bundleFile.bundle);
                }
              } else if (importedFiles.length > 0) {
                setImportStatus({
                  hasImported: true,
                  fileCount: importedFiles.length,
                  isDirectory: false,
                  isBundle: false
                });
                onMessage === null || onMessage === void 0
                  ? void 0
                  : onMessage('success', 'Imported '.concat(importedFiles.length, ' file(s)'));
                onImport === null || onImport === void 0 ? void 0 : onImport(importedFiles);
              }
              return [3 /*break*/, 8];
            case 6:
              err_1 = _b.sent();
              errorMsg = err_1 instanceof Error ? err_1.message : String(err_1);
              setError(errorMsg);
              onMessage === null || onMessage === void 0
                ? void 0
                : onMessage('error', 'Import failed: '.concat(errorMsg));
              return [3 /*break*/, 8];
            case 7:
              setIsLoading(false);
              // Reset input
              if (event.target) {
                event.target.value = '';
              }
              return [7 /*endfinally*/];
            case 8:
              return [2 /*return*/];
          }
        });
      });
    },
    [onImport, onBundleImport, onMessage]
  );
  // Handle directory selection (for browsers with webkitdirectory support)
  var handleDirectorySelect = (0, react_1.useCallback)(
    function (event) {
      return tslib_1.__awaiter(void 0, void 0, void 0, function () {
        var files,
          filesByPath,
          dirPaths,
          i,
          file,
          content,
          path,
          parts,
          dirPath,
          rootDir,
          sortedPaths,
          _i,
          sortedPaths_1,
          dirPath,
          parts,
          currentLevel,
          _loop_1,
          i,
          err_2,
          errorMsg;
        return tslib_1.__generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              files = event.target.files;
              if (!files || files.length === 0) return [2 /*return*/];
              setIsLoading(true);
              setError(null);
              _a.label = 1;
            case 1:
              _a.trys.push([1, 6, 7, 8]);
              filesByPath = new Map();
              dirPaths = new Set();
              i = 0;
              _a.label = 2;
            case 2:
              if (!(i < files.length)) return [3 /*break*/, 5];
              file = files[i];
              return [4 /*yield*/, readFileContent(file)];
            case 3:
              content = _a.sent();
              path = file.webkitRelativePath;
              if (path) {
                parts = path.split('/');
                dirPath = parts.slice(0, -1).join('/');
                dirPaths.add(dirPath);
                if (!filesByPath.has(dirPath)) {
                  filesByPath.set(dirPath, []);
                }
                filesByPath.get(dirPath).push({
                  name: parts[parts.length - 1],
                  path: path,
                  content: content,
                  type: file.type
                });
              }
              _a.label = 4;
            case 4:
              i++;
              return [3 /*break*/, 2];
            case 5:
              rootDir = {
                name: 'imported',
                files: filesByPath.get('') || [],
                subdirectories: []
              };
              sortedPaths = Array.from(dirPaths).sort();
              for (_i = 0, sortedPaths_1 = sortedPaths; _i < sortedPaths_1.length; _i++) {
                dirPath = sortedPaths_1[_i];
                if (dirPath && dirPath !== '') {
                  parts = dirPath.split('/');
                  currentLevel = rootDir;
                  _loop_1 = function (i) {
                    var part = parts[i];
                    var currentPath = parts.slice(0, i + 1).join('/');
                    if (!currentLevel.subdirectories) {
                      currentLevel.subdirectories = [];
                    }
                    var subdir = currentLevel.subdirectories.find(function (d) {
                      return d.name === part;
                    });
                    if (!subdir) {
                      subdir = {
                        name: part,
                        path: currentPath,
                        files: filesByPath.get(currentPath) || [],
                        subdirectories: []
                      };
                      currentLevel.subdirectories.push(subdir);
                    }
                    currentLevel = subdir;
                  };
                  for (i = 0; i < parts.length; i++) {
                    _loop_1(i);
                  }
                }
              }
              setImportStatus({
                hasImported: true,
                fileCount: files.length,
                isDirectory: true,
                isBundle: false
              });
              onMessage === null || onMessage === void 0
                ? void 0
                : onMessage('success', 'Imported directory with '.concat(files.length, ' file(s)'));
              onImport === null || onImport === void 0 ? void 0 : onImport(rootDir);
              return [3 /*break*/, 8];
            case 6:
              err_2 = _a.sent();
              errorMsg = err_2 instanceof Error ? err_2.message : String(err_2);
              setError(errorMsg);
              onMessage === null || onMessage === void 0
                ? void 0
                : onMessage('error', 'Directory import failed: '.concat(errorMsg));
              return [3 /*break*/, 8];
            case 7:
              setIsLoading(false);
              // Reset input
              if (event.target) {
                event.target.value = '';
              }
              return [7 /*endfinally*/];
            case 8:
              return [2 /*return*/];
          }
        });
      });
    },
    [onImport, onMessage]
  );
  // Modern File System Access API handlers
  var handleModernDirectoryPick = (0, react_1.useCallback)(
    function () {
      return tslib_1.__awaiter(void 0, void 0, void 0, function () {
        var dirHandle, rootDir, fileCount, err_3, errorMsg;
        return tslib_1.__generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              if (!('showDirectoryPicker' in window)) {
                onMessage === null || onMessage === void 0
                  ? void 0
                  : onMessage('error', 'Directory picker not supported in this browser');
                return [2 /*return*/];
              }
              setIsLoading(true);
              setError(null);
              _a.label = 1;
            case 1:
              _a.trys.push([1, 4, 5, 6]);
              return [4 /*yield*/, window.showDirectoryPicker()];
            case 2:
              dirHandle = _a.sent();
              return [4 /*yield*/, processDirectoryHandle(dirHandle)];
            case 3:
              rootDir = _a.sent();
              fileCount = countFiles(rootDir);
              setImportStatus({
                hasImported: true,
                fileCount: fileCount,
                isDirectory: true,
                isBundle: false
              });
              onMessage === null || onMessage === void 0
                ? void 0
                : onMessage(
                    'success',
                    'Imported directory "'.concat(rootDir.name, '" with ').concat(fileCount, ' file(s)')
                  );
              onImport === null || onImport === void 0 ? void 0 : onImport(rootDir);
              return [3 /*break*/, 6];
            case 4:
              err_3 = _a.sent();
              if (err_3.name !== 'AbortError') {
                errorMsg = err_3 instanceof Error ? err_3.message : String(err_3);
                setError(errorMsg);
                onMessage === null || onMessage === void 0
                  ? void 0
                  : onMessage('error', 'Directory import failed: '.concat(errorMsg));
              }
              return [3 /*break*/, 6];
            case 5:
              setIsLoading(false);
              return [7 /*endfinally*/];
            case 6:
              return [2 /*return*/];
          }
        });
      });
    },
    [onImport, onMessage]
  );
  var handleModernFilePick = (0, react_1.useCallback)(
    function () {
      return tslib_1.__awaiter(void 0, void 0, void 0, function () {
        var fileHandles,
          importedFiles,
          bundleFile,
          _i,
          fileHandles_1,
          fileHandle,
          file,
          content,
          importedFile,
          bundleData,
          err_4,
          errorMsg;
        var _a;
        return tslib_1.__generator(this, function (_b) {
          switch (_b.label) {
            case 0:
              if (!('showOpenFilePicker' in window)) {
                onMessage === null || onMessage === void 0
                  ? void 0
                  : onMessage('error', 'File picker not supported in this browser');
                return [2 /*return*/];
              }
              setIsLoading(true);
              setError(null);
              _b.label = 1;
            case 1:
              _b.trys.push([1, 8, 9, 10]);
              return [
                4 /*yield*/,
                window.showOpenFilePicker({
                  multiple: true,
                  types: [
                    {
                      description: 'JSON files',
                      accept: { 'application/json': acceptedFileTypes }
                    }
                  ]
                })
              ];
            case 2:
              fileHandles = _b.sent();
              importedFiles = [];
              bundleFile = void 0;
              (_i = 0), (fileHandles_1 = fileHandles);
              _b.label = 3;
            case 3:
              if (!(_i < fileHandles_1.length)) return [3 /*break*/, 7];
              fileHandle = fileHandles_1[_i];
              return [4 /*yield*/, fileHandle.getFile()];
            case 4:
              file = _b.sent();
              return [4 /*yield*/, file.text()];
            case 5:
              content = _b.sent();
              importedFile = {
                name: file.name,
                content: content,
                type: file.type
              };
              // Check for bundle
              if (file.name.endsWith('.bundle.json') || file.name.includes('bundle')) {
                try {
                  bundleData = JSON.parse(content);
                  if (
                    ((_a = bundleData.metadata) === null || _a === void 0 ? void 0 : _a.type) ===
                      'ts-res-bundle' ||
                    bundleData.normalizedCollection
                  ) {
                    bundleFile = tslib_1.__assign(tslib_1.__assign({}, importedFile), { bundle: bundleData });
                  }
                } catch (_c) {
                  // Not a valid bundle
                }
              }
              if (!bundleFile) {
                importedFiles.push(importedFile);
              }
              _b.label = 6;
            case 6:
              _i++;
              return [3 /*break*/, 3];
            case 7:
              // Process results
              if (bundleFile) {
                setImportStatus({
                  hasImported: true,
                  fileCount: 1,
                  isDirectory: false,
                  isBundle: true
                });
                onMessage === null || onMessage === void 0
                  ? void 0
                  : onMessage('info', 'Bundle file detected: '.concat(bundleFile.name));
                if (onBundleImport && bundleFile.bundle) {
                  onBundleImport(bundleFile.bundle);
                }
              } else if (importedFiles.length > 0) {
                setImportStatus({
                  hasImported: true,
                  fileCount: importedFiles.length,
                  isDirectory: false,
                  isBundle: false
                });
                onMessage === null || onMessage === void 0
                  ? void 0
                  : onMessage('success', 'Imported '.concat(importedFiles.length, ' file(s)'));
                onImport === null || onImport === void 0 ? void 0 : onImport(importedFiles);
              }
              return [3 /*break*/, 10];
            case 8:
              err_4 = _b.sent();
              if (err_4.name !== 'AbortError') {
                errorMsg = err_4 instanceof Error ? err_4.message : String(err_4);
                setError(errorMsg);
                onMessage === null || onMessage === void 0
                  ? void 0
                  : onMessage('error', 'File import failed: '.concat(errorMsg));
              }
              return [3 /*break*/, 10];
            case 9:
              setIsLoading(false);
              return [7 /*endfinally*/];
            case 10:
              return [2 /*return*/];
          }
        });
      });
    },
    [onImport, onBundleImport, onMessage, acceptedFileTypes]
  );
  var handleReset = (0, react_1.useCallback)(
    function () {
      setImportStatus({
        hasImported: false,
        fileCount: 0,
        isDirectory: false,
        isBundle: false
      });
      setError(null);
      onMessage === null || onMessage === void 0 ? void 0 : onMessage('info', 'Import cleared');
    },
    [onMessage]
  );
  return react_1.default.createElement(
    'div',
    { className: 'p-6 '.concat(className) },
    react_1.default.createElement(
      'div',
      { className: 'flex items-center space-x-3 mb-6' },
      react_1.default.createElement(outline_1.DocumentArrowUpIcon, { className: 'h-8 w-8 text-blue-600' }),
      react_1.default.createElement(
        'h2',
        { className: 'text-2xl font-bold text-gray-900' },
        'Import Resources'
      )
    ),
    react_1.default.createElement(
      'div',
      { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
      react_1.default.createElement(
        'div',
        { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6' },
        react_1.default.createElement(
          'h3',
          { className: 'text-lg font-semibold text-gray-900 mb-4' },
          'Import Files'
        ),
        react_1.default.createElement(
          'div',
          { className: 'space-y-4' },
          react_1.default.createElement(
            'div',
            { className: 'flex items-center space-x-2 text-sm text-gray-600' },
            isFileSystemAccessSupported
              ? react_1.default.createElement(
                  react_1.default.Fragment,
                  null,
                  react_1.default.createElement('div', { className: 'w-2 h-2 bg-green-500 rounded-full' }),
                  react_1.default.createElement('span', null, 'Modern File System API available')
                )
              : react_1.default.createElement(
                  react_1.default.Fragment,
                  null,
                  react_1.default.createElement('div', { className: 'w-2 h-2 bg-yellow-500 rounded-full' }),
                  react_1.default.createElement('span', null, 'Using fallback file input')
                )
          ),
          react_1.default.createElement(
            'div',
            { className: 'flex flex-col space-y-3' },
            isFileSystemAccessSupported
              ? react_1.default.createElement(
                  react_1.default.Fragment,
                  null,
                  react_1.default.createElement(
                    'button',
                    {
                      onClick: handleModernDirectoryPick,
                      disabled: isLoading,
                      className:
                        'flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                    },
                    react_1.default.createElement(outline_1.FolderOpenIcon, { className: 'w-5 h-5' }),
                    react_1.default.createElement(
                      'span',
                      null,
                      isLoading ? 'Importing...' : 'Import Resource Directory'
                    )
                  ),
                  react_1.default.createElement(
                    'button',
                    {
                      onClick: handleModernFilePick,
                      disabled: isLoading,
                      className:
                        'flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                    },
                    react_1.default.createElement(outline_1.DocumentArrowUpIcon, { className: 'w-5 h-5' }),
                    react_1.default.createElement(
                      'span',
                      null,
                      isLoading ? 'Importing...' : 'Import Resource Files'
                    )
                  )
                )
              : react_1.default.createElement(
                  react_1.default.Fragment,
                  null,
                  react_1.default.createElement('input', {
                    ref: dirInputRef,
                    type: 'file',
                    // @ts-ignore - webkitdirectory is not in types
                    webkitdirectory: '',
                    directory: '',
                    multiple: true,
                    onChange: handleDirectorySelect,
                    className: 'hidden'
                  }),
                  react_1.default.createElement(
                    'button',
                    {
                      onClick: function () {
                        var _a;
                        return (_a = dirInputRef.current) === null || _a === void 0 ? void 0 : _a.click();
                      },
                      disabled: isLoading,
                      className:
                        'flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                    },
                    react_1.default.createElement(outline_1.FolderOpenIcon, { className: 'w-5 h-5' }),
                    react_1.default.createElement(
                      'span',
                      null,
                      isLoading ? 'Importing...' : 'Import Resource Directory'
                    )
                  ),
                  react_1.default.createElement('input', {
                    ref: fileInputRef,
                    type: 'file',
                    accept: acceptedFileTypes.join(','),
                    multiple: true,
                    onChange: handleFileSelect,
                    className: 'hidden'
                  }),
                  react_1.default.createElement(
                    'button',
                    {
                      onClick: function () {
                        var _a;
                        return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click();
                      },
                      disabled: isLoading,
                      className:
                        'flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                    },
                    react_1.default.createElement(outline_1.DocumentArrowUpIcon, { className: 'w-5 h-5' }),
                    react_1.default.createElement(
                      'span',
                      null,
                      isLoading ? 'Importing...' : 'Import Resource Files'
                    )
                  )
                )
          ),
          react_1.default.createElement(
            'div',
            { className: 'text-sm text-gray-600 space-y-2' },
            react_1.default.createElement('p', { className: 'font-medium' }, 'Import Options:'),
            react_1.default.createElement(
              'ul',
              { className: 'list-disc list-inside space-y-1 ml-2' },
              react_1.default.createElement(
                'li',
                null,
                react_1.default.createElement('strong', null, 'Directory:'),
                ' Select a folder with ts-res resources'
              ),
              react_1.default.createElement(
                'li',
                null,
                react_1.default.createElement('strong', null, 'Files:'),
                ' Select individual JSON resource files'
              ),
              react_1.default.createElement(
                'li',
                null,
                react_1.default.createElement('strong', null, 'Bundles:'),
                ' Automatically detected and loaded'
              )
            )
          )
        )
      ),
      react_1.default.createElement(
        'div',
        { className: 'space-y-6' },
        react_1.default.createElement(
          'div',
          { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6' },
          react_1.default.createElement(
            'h3',
            { className: 'text-lg font-semibold text-gray-900 mb-4' },
            'Import Status'
          ),
          react_1.default.createElement(
            'div',
            { className: 'space-y-3' },
            react_1.default.createElement(
              'div',
              { className: 'flex items-center space-x-3' },
              importStatus.hasImported
                ? react_1.default.createElement(
                    react_1.default.Fragment,
                    null,
                    react_1.default.createElement(outline_1.CheckCircleIcon, {
                      className: 'w-5 h-5 text-green-500'
                    }),
                    react_1.default.createElement(
                      'span',
                      { className: 'text-sm text-gray-900' },
                      importStatus.isBundle
                        ? 'Bundle imported'
                        : importStatus.isDirectory
                        ? 'Directory imported'
                        : ''.concat(importStatus.fileCount, ' file(s) imported')
                    )
                  )
                : react_1.default.createElement(
                    react_1.default.Fragment,
                    null,
                    react_1.default.createElement('div', {
                      className: 'w-5 h-5 rounded-full border-2 border-gray-300'
                    }),
                    react_1.default.createElement(
                      'span',
                      { className: 'text-sm text-gray-500' },
                      'No files imported yet'
                    )
                  )
            ),
            importStatus.isBundle &&
              react_1.default.createElement(
                'div',
                { className: 'flex items-center space-x-3' },
                react_1.default.createElement(outline_1.ArchiveBoxIcon, {
                  className: 'w-5 h-5 text-blue-500'
                }),
                react_1.default.createElement(
                  'span',
                  { className: 'text-sm text-blue-900' },
                  'Bundle file detected'
                )
              )
          ),
          importStatus.hasImported &&
            react_1.default.createElement(
              'button',
              {
                onClick: handleReset,
                className:
                  'mt-4 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors'
              },
              'Clear Import'
            )
        ),
        error &&
          react_1.default.createElement(
            'div',
            { className: 'bg-white rounded-lg shadow-sm border border-red-200 p-6' },
            react_1.default.createElement(
              'div',
              { className: 'flex items-start space-x-2' },
              react_1.default.createElement(outline_1.ExclamationTriangleIcon, {
                className: 'w-5 h-5 text-red-600 mt-0.5'
              }),
              react_1.default.createElement(
                'div',
                { className: 'text-sm text-red-800' },
                react_1.default.createElement('p', { className: 'font-medium' }, 'Error'),
                react_1.default.createElement('p', null, error)
              )
            )
          ),
        importStatus.hasImported &&
          !error &&
          react_1.default.createElement(
            'div',
            { className: 'bg-white rounded-lg shadow-sm border border-green-200 p-6' },
            react_1.default.createElement(
              'div',
              { className: 'flex items-start space-x-2' },
              react_1.default.createElement(outline_1.CheckCircleIcon, {
                className: 'w-5 h-5 text-green-600 mt-0.5'
              }),
              react_1.default.createElement(
                'div',
                { className: 'text-sm text-green-800' },
                react_1.default.createElement('p', { className: 'font-medium' }, 'Import Successful!'),
                react_1.default.createElement(
                  'p',
                  null,
                  importStatus.isBundle
                    ? 'Bundle resources are ready to browse.'
                    : 'Resources are ready for processing.'
                )
              )
            )
          )
      )
    )
  );
};
exports.ImportView = ImportView;
// Helper functions
function readFileContent(file) {
  return tslib_1.__awaiter(this, void 0, void 0, function () {
    return tslib_1.__generator(this, function (_a) {
      return [
        2 /*return*/,
        new Promise(function (resolve, reject) {
          var reader = new FileReader();
          reader.onload = function (e) {
            var _a;
            return resolve((_a = e.target) === null || _a === void 0 ? void 0 : _a.result);
          };
          reader.onerror = function (e) {
            return reject(new Error('Failed to read file: '.concat(file.name)));
          };
          reader.readAsText(file);
        })
      ];
    });
  });
}
function processDirectoryHandle(dirHandle_1) {
  return tslib_1.__awaiter(this, arguments, void 0, function (dirHandle, parentPath) {
    var files, subdirectories, _a, _b, _c, entry, file, content, subdir, e_1_1;
    var _d, e_1, _e, _f;
    if (parentPath === void 0) {
      parentPath = '';
    }
    return tslib_1.__generator(this, function (_g) {
      switch (_g.label) {
        case 0:
          files = [];
          subdirectories = [];
          _g.label = 1;
        case 1:
          _g.trys.push([1, 10, 11, 16]);
          (_a = true), (_b = tslib_1.__asyncValues(dirHandle.values()));
          _g.label = 2;
        case 2:
          return [4 /*yield*/, _b.next()];
        case 3:
          if (!((_c = _g.sent()), (_d = _c.done), !_d)) return [3 /*break*/, 9];
          _f = _c.value;
          _a = false;
          entry = _f;
          if (!(entry.kind === 'file')) return [3 /*break*/, 6];
          return [4 /*yield*/, entry.getFile()];
        case 4:
          file = _g.sent();
          return [4 /*yield*/, file.text()];
        case 5:
          content = _g.sent();
          files.push({
            name: file.name,
            path: parentPath ? ''.concat(parentPath, '/').concat(file.name) : file.name,
            content: content,
            type: file.type
          });
          return [3 /*break*/, 8];
        case 6:
          if (!(entry.kind === 'directory')) return [3 /*break*/, 8];
          return [
            4 /*yield*/,
            processDirectoryHandle(
              entry,
              parentPath ? ''.concat(parentPath, '/').concat(entry.name) : entry.name
            )
          ];
        case 7:
          subdir = _g.sent();
          subdirectories.push(subdir);
          _g.label = 8;
        case 8:
          _a = true;
          return [3 /*break*/, 2];
        case 9:
          return [3 /*break*/, 16];
        case 10:
          e_1_1 = _g.sent();
          e_1 = { error: e_1_1 };
          return [3 /*break*/, 16];
        case 11:
          _g.trys.push([11, , 14, 15]);
          if (!(!_a && !_d && (_e = _b.return))) return [3 /*break*/, 13];
          return [4 /*yield*/, _e.call(_b)];
        case 12:
          _g.sent();
          _g.label = 13;
        case 13:
          return [3 /*break*/, 15];
        case 14:
          if (e_1) throw e_1.error;
          return [7 /*endfinally*/];
        case 15:
          return [7 /*endfinally*/];
        case 16:
          return [
            2 /*return*/,
            {
              name: dirHandle.name,
              path: parentPath,
              files: files,
              subdirectories: subdirectories.length > 0 ? subdirectories : undefined
            }
          ];
      }
    });
  });
}
function countFiles(dir) {
  var _a;
  var count = ((_a = dir.files) === null || _a === void 0 ? void 0 : _a.length) || 0;
  if (dir.subdirectories) {
    for (var _i = 0, _b = dir.subdirectories; _i < _b.length; _i++) {
      var subdir = _b[_i];
      count += countFiles(subdir);
    }
  }
  return count;
}
exports.default = exports.ImportView;
//# sourceMappingURL=index.js.map
