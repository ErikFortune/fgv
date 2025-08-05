'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.SourceView = void 0;
var tslib_1 = require('tslib');
var react_1 = tslib_1.__importStar(require('react'));
var outline_1 = require('@heroicons/react/24/outline');
var SourceView = function (_a) {
  var resources = _a.resources,
    onExport = _a.onExport,
    onMessage = _a.onMessage,
    _b = _a.className,
    className = _b === void 0 ? '' : _b;
  var _c = (0, react_1.useState)(null),
    selectedResourceId = _c[0],
    setSelectedResourceId = _c[1];
  var _d = (0, react_1.useState)(''),
    searchTerm = _d[0],
    setSearchTerm = _d[1];
  var _e = (0, react_1.useState)(false),
    showJsonView = _e[0],
    setShowJsonView = _e[1];
  // Sort and filter resource IDs
  var filteredResourceIds = (0, react_1.useMemo)(
    function () {
      if (!(resources === null || resources === void 0 ? void 0 : resources.summary.resourceIds)) {
        return [];
      }
      var resourceIds = resources.summary.resourceIds;
      // Filter by search term
      var filtered = searchTerm
        ? resourceIds.filter(function (id) {
            return id.toLowerCase().includes(searchTerm.toLowerCase());
          })
        : resourceIds;
      // Sort alphabetically
      return filtered.sort();
    },
    [resources === null || resources === void 0 ? void 0 : resources.summary.resourceIds, searchTerm]
  );
  var handleResourceSelect = function (resourceId) {
    setSelectedResourceId(resourceId);
    onMessage === null || onMessage === void 0
      ? void 0
      : onMessage('info', 'Selected resource: '.concat(resourceId));
  };
  var handleSearch = function (term) {
    setSearchTerm(term);
    setSelectedResourceId(null); // Clear selection when searching
  };
  // Get full resource collection data using the new method
  var getResourceCollectionData = (0, react_1.useCallback)(
    function () {
      if (!(resources === null || resources === void 0 ? void 0 : resources.system.resourceManager)) {
        return null;
      }
      try {
        var collectionResult = resources.system.resourceManager.getResourceCollectionDecl();
        if (collectionResult.isSuccess()) {
          return tslib_1.__assign(tslib_1.__assign({}, collectionResult.value), {
            metadata: {
              exportedAt: new Date().toISOString(),
              totalResources: resources.summary.totalResources,
              type: 'ts-res-resource-collection'
            }
          });
        } else {
          onMessage === null || onMessage === void 0
            ? void 0
            : onMessage('error', 'Failed to get resource collection: '.concat(collectionResult.message));
          return null;
        }
      } catch (error) {
        onMessage === null || onMessage === void 0
          ? void 0
          : onMessage(
              'error',
              'Error getting resource collection: '.concat(
                error instanceof Error ? error.message : String(error)
              )
            );
        return null;
      }
    },
    [resources, onMessage]
  );
  // Export source data to JSON file
  var handleExportSourceData = (0, react_1.useCallback)(
    function () {
      try {
        var collectionData = getResourceCollectionData();
        if (!collectionData) {
          onMessage === null || onMessage === void 0
            ? void 0
            : onMessage('error', 'No source collection data available to export');
          return;
        }
        onExport === null || onExport === void 0 ? void 0 : onExport(collectionData, 'json');
        onMessage === null || onMessage === void 0
          ? void 0
          : onMessage('success', 'Resource collection exported successfully');
      } catch (error) {
        onMessage === null || onMessage === void 0
          ? void 0
          : onMessage(
              'error',
              'Failed to export resource collection: '.concat(
                error instanceof Error ? error.message : String(error)
              )
            );
      }
    },
    [getResourceCollectionData, onExport, onMessage]
  );
  if (!resources) {
    return react_1.default.createElement(
      'div',
      { className: 'p-6 '.concat(className) },
      react_1.default.createElement(
        'div',
        { className: 'flex items-center space-x-3 mb-6' },
        react_1.default.createElement(outline_1.DocumentTextIcon, { className: 'h-8 w-8 text-blue-600' }),
        react_1.default.createElement(
          'h2',
          { className: 'text-2xl font-bold text-gray-900' },
          'Source Browser'
        )
      ),
      react_1.default.createElement(
        'div',
        { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center' },
        react_1.default.createElement(
          'div',
          { className: 'max-w-2xl mx-auto' },
          react_1.default.createElement(
            'h3',
            { className: 'text-xl font-semibold text-gray-900 mb-4' },
            'No Resources Loaded'
          ),
          react_1.default.createElement(
            'p',
            { className: 'text-gray-600 mb-6' },
            'Import resources to explore them here.'
          ),
          react_1.default.createElement(
            'div',
            { className: 'bg-blue-50 rounded-lg p-4' },
            react_1.default.createElement(
              'p',
              { className: 'text-sm text-blue-800' },
              react_1.default.createElement('strong', null, 'Tip:'),
              ' Use the Import View to load ts-res resource files or directories, then return here to browse and explore the loaded resources.'
            )
          )
        )
      )
    );
  }
  return react_1.default.createElement(
    'div',
    { className: 'p-6 '.concat(className) },
    react_1.default.createElement(
      'div',
      { className: 'flex items-center justify-between mb-6' },
      react_1.default.createElement(
        'div',
        { className: 'flex items-center space-x-3' },
        react_1.default.createElement(outline_1.DocumentTextIcon, { className: 'h-8 w-8 text-blue-600' }),
        react_1.default.createElement(
          'h2',
          { className: 'text-2xl font-bold text-gray-900' },
          'Source Browser'
        )
      ),
      resources &&
        react_1.default.createElement(
          'div',
          { className: 'flex items-center space-x-2' },
          react_1.default.createElement(
            'button',
            {
              onClick: handleExportSourceData,
              className:
                'inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            },
            react_1.default.createElement(outline_1.DocumentArrowDownIcon, { className: 'h-4 w-4 mr-1' }),
            'Export JSON'
          )
        )
    ),
    resources &&
      react_1.default.createElement(
        'div',
        { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6' },
        react_1.default.createElement(
          'button',
          {
            onClick: function () {
              return setShowJsonView(!showJsonView);
            },
            className:
              'inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          },
          react_1.default.createElement(outline_1.CodeBracketIcon, { className: 'h-4 w-4 mr-2' }),
          showJsonView ? 'Hide' : 'Show',
          ' JSON Resource Collection',
          showJsonView
            ? react_1.default.createElement(outline_1.ChevronUpIcon, { className: 'h-4 w-4 ml-2' })
            : react_1.default.createElement(outline_1.ChevronDownIcon, { className: 'h-4 w-4 ml-2' })
        ),
        showJsonView &&
          react_1.default.createElement(
            'div',
            { className: 'mt-4' },
            react_1.default.createElement(
              'div',
              { className: 'bg-gray-50 rounded-lg border border-gray-200 p-4' },
              react_1.default.createElement(
                'div',
                { className: 'flex items-center justify-between mb-2' },
                react_1.default.createElement(
                  'h3',
                  { className: 'text-sm font-medium text-gray-900' },
                  'Resource Collection (JSON)'
                ),
                react_1.default.createElement(
                  'button',
                  {
                    onClick: handleExportSourceData,
                    className:
                      'inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  },
                  react_1.default.createElement(outline_1.DocumentArrowDownIcon, {
                    className: 'h-3 w-3 mr-1'
                  }),
                  'Export'
                )
              ),
              react_1.default.createElement(
                'pre',
                {
                  className:
                    'text-xs text-gray-800 bg-white p-3 rounded border overflow-x-auto max-h-64 overflow-y-auto'
                },
                JSON.stringify(getResourceCollectionData(), null, 2)
              )
            )
          )
      ),
    react_1.default.createElement(
      'div',
      { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6' },
      react_1.default.createElement(
        'div',
        { className: 'flex flex-col lg:flex-row gap-6 h-[600px]' },
        react_1.default.createElement(
          'div',
          { className: 'lg:w-1/2 flex flex-col' },
          react_1.default.createElement(
            'div',
            { className: 'flex items-center space-x-3 mb-4' },
            react_1.default.createElement(
              'h3',
              { className: 'text-lg font-semibold text-gray-900' },
              'Resources (',
              filteredResourceIds.length,
              ')'
            )
          ),
          react_1.default.createElement(
            'div',
            { className: 'relative mb-4' },
            react_1.default.createElement(outline_1.MagnifyingGlassIcon, {
              className: 'absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400'
            }),
            react_1.default.createElement('input', {
              type: 'text',
              placeholder: 'Search resources...',
              value: searchTerm,
              onChange: function (e) {
                return handleSearch(e.target.value);
              },
              className:
                'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            })
          ),
          react_1.default.createElement(
            'div',
            { className: 'flex-1 overflow-y-auto border border-gray-200 rounded-lg' },
            filteredResourceIds.length === 0
              ? react_1.default.createElement(
                  'div',
                  { className: 'p-4 text-center text-gray-500' },
                  searchTerm ? 'No resources match your search' : 'No resources available'
                )
              : react_1.default.createElement(
                  'div',
                  { className: 'divide-y divide-gray-200' },
                  filteredResourceIds.map(function (resourceId) {
                    return react_1.default.createElement(
                      'button',
                      {
                        key: resourceId,
                        onClick: function () {
                          return handleResourceSelect(resourceId);
                        },
                        className: 'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors '.concat(
                          selectedResourceId === resourceId ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                        )
                      },
                      react_1.default.createElement(
                        'div',
                        { className: 'font-medium text-gray-900 truncate' },
                        searchTerm
                          ? react_1.default.createElement('span', {
                              dangerouslySetInnerHTML: {
                                __html: resourceId.replace(
                                  new RegExp('('.concat(searchTerm, ')'), 'gi'),
                                  '<mark class="bg-yellow-200">$1</mark>'
                                )
                              }
                            })
                          : resourceId
                      )
                    );
                  })
                )
          )
        ),
        react_1.default.createElement(
          'div',
          { className: 'lg:w-1/2 flex flex-col' },
          selectedResourceId
            ? react_1.default.createElement(ResourceDetail, {
                resourceId: selectedResourceId,
                processedResources: resources,
                onMessage: onMessage
              })
            : react_1.default.createElement(
                'div',
                {
                  className:
                    'flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50'
                },
                react_1.default.createElement(
                  'div',
                  { className: 'text-center' },
                  react_1.default.createElement(outline_1.DocumentTextIcon, {
                    className: 'h-12 w-12 text-gray-400 mx-auto mb-4'
                  }),
                  react_1.default.createElement(
                    'p',
                    { className: 'text-gray-500' },
                    'Select a resource to view details'
                  )
                )
              )
        )
      )
    )
  );
};
exports.SourceView = SourceView;
var ResourceDetail = function (_a) {
  var resourceId = _a.resourceId,
    processedResources = _a.processedResources,
    onMessage = _a.onMessage;
  var _b = (0, react_1.useState)(null),
    resourceDetail = _b[0],
    setResourceDetail = _b[1];
  var _c = (0, react_1.useState)(false),
    isLoading = _c[0],
    setIsLoading = _c[1];
  var _d = (0, react_1.useState)(null),
    error = _d[0],
    setError = _d[1];
  react_1.default.useEffect(
    function () {
      var loadResourceDetail = function () {
        setIsLoading(true);
        setError(null);
        try {
          var resourceManager = processedResources.system.resourceManager;
          var resourceResult = resourceManager.getBuiltResource(resourceId);
          if (resourceResult.isSuccess()) {
            var resource = resourceResult.value;
            var detail = {
              id: resource.id,
              resourceType: resource.resourceType.key,
              candidateCount: resource.candidates.length,
              candidates: resource.candidates.map(function (candidate) {
                return {
                  json: candidate.json,
                  conditions: candidate.conditions.conditions.map(function (condition) {
                    return {
                      qualifier: condition.qualifier.name,
                      operator: condition.operator,
                      value: condition.value,
                      priority: condition.priority,
                      scoreAsDefault: condition.scoreAsDefault
                    };
                  }),
                  isPartial: candidate.isPartial,
                  mergeMethod: candidate.mergeMethod
                };
              })
            };
            setResourceDetail(detail);
            onMessage === null || onMessage === void 0
              ? void 0
              : onMessage('info', 'Loaded details for resource: '.concat(resourceId));
          } else {
            setError('Failed to load resource details: '.concat(resourceResult.message));
            onMessage === null || onMessage === void 0
              ? void 0
              : onMessage('error', 'Failed to load resource details: '.concat(resourceResult.message));
          }
        } catch (err) {
          var errorMsg = 'Error loading resource details: '.concat(
            err instanceof Error ? err.message : String(err)
          );
          setError(errorMsg);
          onMessage === null || onMessage === void 0 ? void 0 : onMessage('error', errorMsg);
        } finally {
          setIsLoading(false);
        }
      };
      loadResourceDetail();
    },
    [resourceId, processedResources, onMessage]
  );
  if (isLoading) {
    return react_1.default.createElement(
      'div',
      { className: 'flex flex-col h-full' },
      react_1.default.createElement(
        'h3',
        { className: 'text-lg font-semibold text-gray-900 mb-4' },
        'Resource Details'
      ),
      react_1.default.createElement(
        'div',
        { className: 'flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50' },
        react_1.default.createElement(
          'div',
          { className: 'text-center' },
          react_1.default.createElement('div', {
            className:
              'animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4'
          }),
          react_1.default.createElement('p', { className: 'text-gray-500' }, 'Loading resource details...')
        )
      )
    );
  }
  if (error) {
    return react_1.default.createElement(
      'div',
      { className: 'flex flex-col h-full' },
      react_1.default.createElement(
        'h3',
        { className: 'text-lg font-semibold text-gray-900 mb-4' },
        'Resource Details'
      ),
      react_1.default.createElement(
        'div',
        { className: 'flex-1 border border-gray-200 rounded-lg p-4 bg-red-50' },
        react_1.default.createElement(
          'div',
          { className: 'text-center' },
          react_1.default.createElement(
            'p',
            { className: 'text-red-600 font-medium mb-2' },
            'Error Loading Resource'
          ),
          react_1.default.createElement('p', { className: 'text-red-500 text-sm' }, error)
        )
      )
    );
  }
  if (!resourceDetail) {
    return react_1.default.createElement(
      'div',
      { className: 'flex flex-col h-full' },
      react_1.default.createElement(
        'h3',
        { className: 'text-lg font-semibold text-gray-900 mb-4' },
        'Resource Details'
      ),
      react_1.default.createElement(
        'div',
        { className: 'flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50' },
        react_1.default.createElement('p', { className: 'text-gray-500' }, 'No resource details available')
      )
    );
  }
  return react_1.default.createElement(
    'div',
    { className: 'flex flex-col h-full' },
    react_1.default.createElement(
      'h3',
      { className: 'text-lg font-semibold text-gray-900 mb-4' },
      'Resource Details'
    ),
    react_1.default.createElement(
      'div',
      { className: 'flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50' },
      react_1.default.createElement(
        'div',
        { className: 'space-y-6' },
        react_1.default.createElement(
          'div',
          null,
          react_1.default.createElement(
            'h4',
            { className: 'font-medium text-gray-700 mb-3' },
            'Resource Overview'
          ),
          react_1.default.createElement(
            'div',
            { className: 'bg-white p-4 rounded-lg border space-y-3' },
            react_1.default.createElement(
              'div',
              null,
              react_1.default.createElement(
                'span',
                { className: 'text-sm font-medium text-gray-600' },
                'Fully Qualified ID:'
              ),
              react_1.default.createElement(
                'code',
                { className: 'text-sm bg-gray-100 px-2 py-1 rounded ml-2 break-all' },
                resourceDetail.id
              )
            ),
            react_1.default.createElement(
              'div',
              null,
              react_1.default.createElement(
                'span',
                { className: 'text-sm font-medium text-gray-600' },
                'Resource Type:'
              ),
              react_1.default.createElement(
                'span',
                { className: 'ml-2 text-sm' },
                resourceDetail.resourceType
              )
            ),
            react_1.default.createElement(
              'div',
              null,
              react_1.default.createElement(
                'span',
                { className: 'text-sm font-medium text-gray-600' },
                'Candidate Count:'
              ),
              react_1.default.createElement(
                'span',
                { className: 'ml-2 text-sm font-medium text-blue-600' },
                resourceDetail.candidateCount
              )
            )
          )
        ),
        react_1.default.createElement(
          'div',
          null,
          react_1.default.createElement(
            'h4',
            { className: 'font-medium text-gray-700 mb-3' },
            'Candidates (',
            resourceDetail.candidates.length,
            ')'
          ),
          react_1.default.createElement(
            'div',
            { className: 'space-y-4' },
            resourceDetail.candidates.map(function (candidate, index) {
              return react_1.default.createElement(
                'div',
                { key: index, className: 'bg-white p-4 rounded-lg border' },
                react_1.default.createElement(
                  'div',
                  { className: 'flex items-center justify-between mb-3' },
                  react_1.default.createElement(
                    'h5',
                    { className: 'font-medium text-gray-800' },
                    'Candidate ',
                    index + 1
                  ),
                  react_1.default.createElement(
                    'div',
                    { className: 'flex items-center space-x-2 text-xs' },
                    candidate.isPartial &&
                      react_1.default.createElement(
                        'span',
                        { className: 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded' },
                        'Partial'
                      ),
                    react_1.default.createElement(
                      'span',
                      { className: 'bg-gray-100 text-gray-700 px-2 py-1 rounded' },
                      candidate.mergeMethod
                    )
                  )
                ),
                candidate.conditions.length > 0 &&
                  react_1.default.createElement(
                    'div',
                    { className: 'mb-3' },
                    react_1.default.createElement(
                      'h6',
                      { className: 'text-sm font-medium text-gray-600 mb-2' },
                      'Conditions:'
                    ),
                    react_1.default.createElement(
                      'div',
                      { className: 'space-y-1' },
                      candidate.conditions.map(function (condition, condIndex) {
                        return react_1.default.createElement(
                          'div',
                          {
                            key: condIndex,
                            className: 'flex items-center text-xs bg-blue-50 px-2 py-1 rounded'
                          },
                          react_1.default.createElement(
                            'span',
                            { className: 'font-medium text-blue-800' },
                            condition.qualifier
                          ),
                          react_1.default.createElement(
                            'span',
                            { className: 'mx-1 text-blue-600' },
                            condition.operator
                          ),
                          react_1.default.createElement(
                            'span',
                            { className: 'text-blue-700' },
                            condition.value
                          ),
                          react_1.default.createElement(
                            'div',
                            { className: 'ml-auto flex items-center space-x-2' },
                            react_1.default.createElement(
                              'span',
                              { className: 'text-blue-500' },
                              'priority: ',
                              condition.priority
                            ),
                            condition.scoreAsDefault !== undefined &&
                              react_1.default.createElement(
                                'span',
                                { className: 'text-amber-600 font-medium' },
                                'default: ',
                                condition.scoreAsDefault
                              )
                          )
                        );
                      })
                    )
                  ),
                candidate.conditions.length === 0 &&
                  react_1.default.createElement(
                    'div',
                    { className: 'mb-3' },
                    react_1.default.createElement(
                      'span',
                      { className: 'text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded' },
                      'No conditions (default candidate)'
                    )
                  ),
                react_1.default.createElement(
                  'div',
                  null,
                  react_1.default.createElement(
                    'h6',
                    { className: 'text-sm font-medium text-gray-600 mb-2' },
                    'Content:'
                  ),
                  react_1.default.createElement(
                    'pre',
                    { className: 'text-xs bg-gray-50 p-3 rounded border overflow-x-auto max-h-40' },
                    JSON.stringify(candidate.json, null, 2)
                  )
                )
              );
            })
          )
        )
      )
    )
  );
};
exports.default = exports.SourceView;
//# sourceMappingURL=index.js.map
