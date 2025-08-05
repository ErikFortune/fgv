'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ZipLoaderView = void 0;
var tslib_1 = require('tslib');
var react_1 = tslib_1.__importStar(require('react'));
var outline_1 = require('@heroicons/react/24/outline');
var zipLoader_1 = require('../../../utils/zipLoader');
var ZipLoaderView = function (_a) {
  var zipFileUrl = _a.zipFileUrl,
    zipPath = _a.zipPath,
    onLoadComplete = _a.onLoadComplete,
    onMessage = _a.onMessage,
    _b = _a.className,
    className = _b === void 0 ? '' : _b;
  var _c = (0, react_1.useState)({
      isLoading: false,
      stage: null,
      progress: 0,
      message: ''
    }),
    loadingState = _c[0],
    setLoadingState = _c[1];
  var _d = (0, react_1.useState)({
      result: null,
      error: null,
      fileName: null,
      fileSize: null
    }),
    loadedState = _d[0],
    setLoadedState = _d[1];
  var fileInputRef = (0, react_1.useRef)(null);
  var handleDragOver = (0, react_1.useCallback)(function (e) {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  // Load ZIP file with progress tracking
  var loadZipFileInternal = (0, react_1.useCallback)(
    function (file) {
      return tslib_1.__awaiter(void 0, void 0, void 0, function () {
        var options, progressCallback, loader, result, zipResult_1, errorMessage_1, error_1, errorMessage_2;
        return tslib_1.__generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              setLoadingState({
                isLoading: true,
                stage: 'reading-file',
                progress: 0,
                message: 'Starting to load ZIP file...'
              });
              setLoadedState({
                result: null,
                error: null,
                fileName: file.name,
                fileSize: file.size
              });
              options = {
                autoApplyConfig: true,
                autoProcessResources: true
              };
              progressCallback = function (stage, progress, message) {
                setLoadingState({
                  isLoading: stage !== 'complete',
                  stage: stage,
                  progress: progress,
                  message: message || getStageMessage(stage)
                });
              };
              _a.label = 1;
            case 1:
              _a.trys.push([1, 3, , 4]);
              loader = (0, zipLoader_1.createBrowserZipLoader)();
              return [4 /*yield*/, loader.loadFromFile(file, options, progressCallback)];
            case 2:
              result = _a.sent();
              if (result.isSuccess()) {
                zipResult_1 = result.value;
                setLoadedState(function (prev) {
                  return tslib_1.__assign(tslib_1.__assign({}, prev), { result: zipResult_1, error: null });
                });
                setLoadingState({
                  isLoading: false,
                  stage: 'complete',
                  progress: 100,
                  message: 'ZIP file loaded successfully'
                });
                onMessage === null || onMessage === void 0
                  ? void 0
                  : onMessage('success', 'Loaded ZIP file: '.concat(file.name));
                if (zipResult_1.processedResources) {
                  onLoadComplete === null || onLoadComplete === void 0
                    ? void 0
                    : onLoadComplete(zipResult_1.processedResources);
                }
              } else {
                errorMessage_1 = result.message;
                setLoadedState(function (prev) {
                  return tslib_1.__assign(tslib_1.__assign({}, prev), {
                    error: errorMessage_1,
                    result: null
                  });
                });
                setLoadingState({
                  isLoading: false,
                  stage: null,
                  progress: 0,
                  message: ''
                });
                onMessage === null || onMessage === void 0
                  ? void 0
                  : onMessage('error', 'Failed to load ZIP: '.concat(errorMessage_1));
              }
              return [3 /*break*/, 4];
            case 3:
              error_1 = _a.sent();
              errorMessage_2 = error_1 instanceof Error ? error_1.message : String(error_1);
              setLoadedState(function (prev) {
                return tslib_1.__assign(tslib_1.__assign({}, prev), { error: errorMessage_2, result: null });
              });
              setLoadingState({
                isLoading: false,
                stage: null,
                progress: 0,
                message: ''
              });
              onMessage === null || onMessage === void 0
                ? void 0
                : onMessage('error', 'Unexpected error: '.concat(errorMessage_2));
              return [3 /*break*/, 4];
            case 4:
              return [2 /*return*/];
          }
        });
      });
    },
    [onMessage, onLoadComplete]
  );
  // Load ZIP from URL
  var loadFromUrl = (0, react_1.useCallback)(
    function (url) {
      return tslib_1.__awaiter(void 0, void 0, void 0, function () {
        var options, progressCallback, loader, result, zipResult_2, errorMessage_3, error_2, errorMessage_4;
        return tslib_1.__generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              setLoadingState({
                isLoading: true,
                stage: 'reading-file',
                progress: 0,
                message: 'Fetching ZIP from URL...'
              });
              setLoadedState({
                result: null,
                error: null,
                fileName: url.split('/').pop() || 'remote.zip',
                fileSize: null
              });
              options = {
                autoApplyConfig: true,
                autoProcessResources: true
              };
              progressCallback = function (stage, progress, message) {
                setLoadingState({
                  isLoading: stage !== 'complete',
                  stage: stage,
                  progress: progress,
                  message: message || getStageMessage(stage)
                });
              };
              _a.label = 1;
            case 1:
              _a.trys.push([1, 3, , 4]);
              loader = (0, zipLoader_1.createBrowserZipLoader)();
              return [4 /*yield*/, loader.loadFromUrl(url, options, progressCallback)];
            case 2:
              result = _a.sent();
              if (result.isSuccess()) {
                zipResult_2 = result.value;
                setLoadedState(function (prev) {
                  return tslib_1.__assign(tslib_1.__assign({}, prev), { result: zipResult_2, error: null });
                });
                setLoadingState({
                  isLoading: false,
                  stage: 'complete',
                  progress: 100,
                  message: 'ZIP file loaded successfully'
                });
                onMessage === null || onMessage === void 0
                  ? void 0
                  : onMessage('success', 'Loaded ZIP from URL: '.concat(url));
                if (zipResult_2.processedResources) {
                  onLoadComplete === null || onLoadComplete === void 0
                    ? void 0
                    : onLoadComplete(zipResult_2.processedResources);
                }
              } else {
                errorMessage_3 = result.message;
                setLoadedState(function (prev) {
                  return tslib_1.__assign(tslib_1.__assign({}, prev), {
                    error: errorMessage_3,
                    result: null
                  });
                });
                setLoadingState({
                  isLoading: false,
                  stage: null,
                  progress: 0,
                  message: ''
                });
                onMessage === null || onMessage === void 0
                  ? void 0
                  : onMessage('error', 'Failed to load ZIP from URL: '.concat(errorMessage_3));
              }
              return [3 /*break*/, 4];
            case 3:
              error_2 = _a.sent();
              errorMessage_4 = error_2 instanceof Error ? error_2.message : String(error_2);
              setLoadedState(function (prev) {
                return tslib_1.__assign(tslib_1.__assign({}, prev), { error: errorMessage_4, result: null });
              });
              setLoadingState({
                isLoading: false,
                stage: null,
                progress: 0,
                message: ''
              });
              onMessage === null || onMessage === void 0
                ? void 0
                : onMessage('error', 'Unexpected error loading from URL: '.concat(errorMessage_4));
              return [3 /*break*/, 4];
            case 4:
              return [2 /*return*/];
          }
        });
      });
    },
    [onMessage, onLoadComplete]
  );
  // Handle file selection - now defined after loadZipFileInternal
  var handleFileSelect = (0, react_1.useCallback)(
    function (files) {
      return tslib_1.__awaiter(void 0, void 0, void 0, function () {
        var file;
        return tslib_1.__generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              if (!files || files.length === 0) return [2 /*return*/];
              file = files[0];
              if (!(0, zipLoader_1.isZipFile)(file.name)) {
                setLoadedState(function (prev) {
                  return tslib_1.__assign(tslib_1.__assign({}, prev), {
                    error: 'Selected file "'.concat(file.name, '" is not a ZIP file'),
                    result: null
                  });
                });
                onMessage === null || onMessage === void 0
                  ? void 0
                  : onMessage('error', 'File "'.concat(file.name, '" is not a ZIP file'));
                return [2 /*return*/];
              }
              return [4 /*yield*/, loadZipFileInternal(file)];
            case 1:
              _a.sent();
              return [2 /*return*/];
          }
        });
      });
    },
    [loadZipFileInternal, onMessage]
  );
  // Handle drag and drop - now defined after handleFileSelect
  var handleDrop = (0, react_1.useCallback)(
    function (e) {
      return tslib_1.__awaiter(void 0, void 0, void 0, function () {
        var files;
        return tslib_1.__generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              e.preventDefault();
              e.stopPropagation();
              files = e.dataTransfer.files;
              return [4 /*yield*/, handleFileSelect(files)];
            case 1:
              _a.sent();
              return [2 /*return*/];
          }
        });
      });
    },
    [handleFileSelect]
  );
  // Auto-load from URL parameter
  react_1.default.useEffect(
    function () {
      if (zipFileUrl && !loadingState.isLoading && !loadedState.result && !loadedState.error) {
        loadFromUrl(zipFileUrl);
      }
    },
    [zipFileUrl, loadFromUrl, loadingState.isLoading, loadedState.result, loadedState.error]
  );
  var getStageMessage = function (stage) {
    switch (stage) {
      case 'reading-file':
        return 'Reading ZIP file...';
      case 'parsing-zip':
        return 'Parsing ZIP archive...';
      case 'loading-manifest':
        return 'Loading manifest...';
      case 'loading-config':
        return 'Loading configuration...';
      case 'extracting-files':
        return 'Extracting files...';
      case 'processing-resources':
        return 'Processing resources...';
      case 'complete':
        return 'Complete!';
      default:
        return 'Processing...';
    }
  };
  var getStageIcon = function (stage) {
    switch (stage) {
      case 'complete':
        return outline_1.CheckCircleIcon;
      case null:
        return outline_1.DocumentArrowDownIcon;
      default:
        return outline_1.ArrowPathIcon;
    }
  };
  return react_1.default.createElement(
    'div',
    { className: 'p-6 '.concat(className) },
    react_1.default.createElement(
      'div',
      { className: 'flex items-center space-x-3 mb-6' },
      react_1.default.createElement(outline_1.DocumentArrowDownIcon, { className: 'h-8 w-8 text-blue-600' }),
      react_1.default.createElement('h2', { className: 'text-2xl font-bold text-gray-900' }, 'ZIP Loader')
    ),
    react_1.default.createElement(
      'div',
      { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6' },
      zipFileUrl &&
        !loadedState.result &&
        !loadedState.error &&
        react_1.default.createElement(
          'div',
          { className: 'mb-6 p-4 bg-blue-50 rounded-lg' },
          react_1.default.createElement(
            'h3',
            { className: 'text-lg font-medium text-blue-900 mb-2' },
            'Loading from URL'
          ),
          react_1.default.createElement('p', { className: 'text-sm text-blue-700 break-all' }, zipFileUrl)
        ),
      !loadingState.isLoading &&
        !loadedState.result &&
        react_1.default.createElement(
          'div',
          {
            className:
              'border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer',
            onDrop: handleDrop,
            onDragOver: handleDragOver,
            onClick: function () {
              var _a;
              return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click();
            }
          },
          react_1.default.createElement(outline_1.FolderOpenIcon, {
            className: 'h-16 w-16 text-gray-400 mx-auto mb-4'
          }),
          react_1.default.createElement(
            'h3',
            { className: 'text-lg font-medium text-gray-900 mb-2' },
            'Select or Drop ZIP File'
          ),
          react_1.default.createElement(
            'p',
            { className: 'text-gray-600 mb-4' },
            'Choose a ZIP file containing resources to load and process'
          ),
          react_1.default.createElement(
            'button',
            {
              type: 'button',
              className:
                'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            },
            react_1.default.createElement(outline_1.DocumentArrowDownIcon, { className: 'w-4 h-4 mr-2' }),
            'Browse Files'
          ),
          react_1.default.createElement('input', {
            ref: fileInputRef,
            type: 'file',
            accept: '.zip',
            onChange: function (e) {
              return handleFileSelect(e.target.files);
            },
            className: 'hidden'
          })
        ),
      loadingState.isLoading &&
        react_1.default.createElement(
          'div',
          { className: 'mb-6' },
          react_1.default.createElement(
            'div',
            { className: 'flex items-center justify-between mb-2' },
            react_1.default.createElement(
              'div',
              { className: 'flex items-center space-x-2' },
              react_1.default.createElement(getStageIcon(loadingState.stage), {
                className: 'w-5 h-5 '.concat(
                  loadingState.stage === 'complete' ? 'text-green-500' : 'text-blue-500 animate-spin'
                )
              }),
              react_1.default.createElement(
                'span',
                { className: 'text-sm font-medium text-gray-900' },
                loadingState.message
              )
            ),
            react_1.default.createElement(
              'span',
              { className: 'text-sm text-gray-500' },
              loadingState.progress,
              '%'
            )
          ),
          react_1.default.createElement(
            'div',
            { className: 'w-full bg-gray-200 rounded-full h-2' },
            react_1.default.createElement('div', {
              className: 'bg-blue-600 h-2 rounded-full transition-all duration-300',
              style: { width: ''.concat(loadingState.progress, '%') }
            })
          )
        ),
      loadedState.result &&
        react_1.default.createElement(
          'div',
          { className: 'space-y-4' },
          react_1.default.createElement(
            'div',
            { className: 'flex items-center space-x-2 text-green-600' },
            react_1.default.createElement(outline_1.CheckCircleIcon, { className: 'w-5 h-5' }),
            react_1.default.createElement(
              'span',
              { className: 'font-medium' },
              'ZIP file loaded successfully'
            )
          ),
          react_1.default.createElement(
            'div',
            { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            react_1.default.createElement(
              'div',
              { className: 'bg-gray-50 rounded-lg p-4' },
              react_1.default.createElement(
                'h4',
                { className: 'font-medium text-gray-900 mb-2' },
                'File Information'
              ),
              react_1.default.createElement(
                'div',
                { className: 'space-y-1 text-sm' },
                react_1.default.createElement(
                  'div',
                  null,
                  react_1.default.createElement('strong', null, 'Name:'),
                  ' ',
                  loadedState.fileName
                ),
                loadedState.fileSize &&
                  react_1.default.createElement(
                    'div',
                    null,
                    react_1.default.createElement('strong', null, 'Size:'),
                    ' ',
                    (0, zipLoader_1.formatFileSize)(loadedState.fileSize)
                  ),
                react_1.default.createElement(
                  'div',
                  null,
                  react_1.default.createElement('strong', null, 'Files:'),
                  ' ',
                  loadedState.result.files.length
                )
              )
            ),
            react_1.default.createElement(
              'div',
              { className: 'bg-gray-50 rounded-lg p-4' },
              react_1.default.createElement('h4', { className: 'font-medium text-gray-900 mb-2' }, 'Content'),
              react_1.default.createElement(
                'div',
                { className: 'space-y-1 text-sm' },
                loadedState.result.manifest &&
                  react_1.default.createElement(
                    'div',
                    { className: 'flex items-center space-x-1' },
                    react_1.default.createElement(outline_1.CheckCircleIcon, {
                      className: 'w-4 h-4 text-green-500'
                    }),
                    react_1.default.createElement('span', null, 'Manifest found')
                  ),
                loadedState.result.config &&
                  react_1.default.createElement(
                    'div',
                    { className: 'flex items-center space-x-1' },
                    react_1.default.createElement(outline_1.CheckCircleIcon, {
                      className: 'w-4 h-4 text-green-500'
                    }),
                    react_1.default.createElement('span', null, 'Configuration found')
                  ),
                loadedState.result.processedResources &&
                  react_1.default.createElement(
                    'div',
                    { className: 'flex items-center space-x-1' },
                    react_1.default.createElement(outline_1.CheckCircleIcon, {
                      className: 'w-4 h-4 text-green-500'
                    }),
                    react_1.default.createElement('span', null, 'Resources processed')
                  )
              )
            )
          ),
          loadedState.result.manifest &&
            react_1.default.createElement(
              'div',
              { className: 'bg-blue-50 rounded-lg p-4' },
              react_1.default.createElement(
                'h4',
                { className: 'font-medium text-blue-900 mb-2' },
                'Archive Information'
              ),
              react_1.default.createElement(
                'div',
                { className: 'text-sm text-blue-800' },
                react_1.default.createElement(
                  'div',
                  null,
                  react_1.default.createElement('strong', null, 'Created:'),
                  ' ',
                  new Date(loadedState.result.manifest.timestamp).toLocaleString()
                ),
                loadedState.result.manifest.input &&
                  react_1.default.createElement(
                    'div',
                    null,
                    react_1.default.createElement('strong', null, 'Source:'),
                    ' ',
                    loadedState.result.manifest.input.type,
                    ' - ',
                    loadedState.result.manifest.input.originalPath
                  )
              )
            )
        ),
      loadedState.error &&
        react_1.default.createElement(
          'div',
          { className: 'bg-red-50 border border-red-200 rounded-lg p-4' },
          react_1.default.createElement(
            'div',
            { className: 'flex items-center space-x-2 text-red-600 mb-2' },
            react_1.default.createElement(outline_1.ExclamationTriangleIcon, { className: 'w-5 h-5' }),
            react_1.default.createElement('span', { className: 'font-medium' }, 'Error Loading ZIP')
          ),
          react_1.default.createElement('p', { className: 'text-sm text-red-700' }, loadedState.error),
          react_1.default.createElement(
            'button',
            {
              onClick: function () {
                return setLoadedState(function (prev) {
                  return tslib_1.__assign(tslib_1.__assign({}, prev), { error: null });
                });
              },
              className:
                'mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
            },
            'Try Again'
          )
        ),
      !loadingState.isLoading &&
        !loadedState.result &&
        !loadedState.error &&
        react_1.default.createElement(
          'div',
          { className: 'mt-6 bg-blue-50 rounded-lg p-4' },
          react_1.default.createElement(
            'div',
            { className: 'flex items-start space-x-2' },
            react_1.default.createElement(outline_1.InformationCircleIcon, {
              className: 'w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0'
            }),
            react_1.default.createElement(
              'div',
              { className: 'text-sm text-blue-800' },
              react_1.default.createElement('p', { className: 'font-medium mb-1' }, 'ZIP Loader'),
              react_1.default.createElement(
                'p',
                null,
                'Load ZIP archives containing resource files and configurations. The loader supports automatic configuration application and resource processing.'
              )
            )
          )
        )
    )
  );
};
exports.ZipLoaderView = ZipLoaderView;
exports.default = exports.ZipLoaderView;
//# sourceMappingURL=index.js.map
