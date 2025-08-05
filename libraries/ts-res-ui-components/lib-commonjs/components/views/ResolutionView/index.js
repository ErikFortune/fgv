'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ResolutionView = void 0;
var tslib_1 = require('tslib');
var react_1 = tslib_1.__importStar(require('react'));
var outline_1 = require('@heroicons/react/24/outline');
var ResolutionView = function (_a) {
  var _b;
  var resources = _a.resources,
    filterState = _a.filterState,
    filterResult = _a.filterResult,
    resolutionState = _a.resolutionState,
    resolutionActions = _a.resolutionActions,
    _c = _a.availableQualifiers,
    availableQualifiers = _c === void 0 ? [] : _c,
    onMessage = _a.onMessage,
    _d = _a.className,
    className = _d === void 0 ? '' : _d;
  // Use filtered resources when filtering is active and successful
  var isFilteringActive =
    (filterState === null || filterState === void 0 ? void 0 : filterState.enabled) &&
    (filterResult === null || filterResult === void 0 ? void 0 : filterResult.success) === true;
  var activeProcessedResources = isFilteringActive
    ? filterResult === null || filterResult === void 0
      ? void 0
      : filterResult.processedResources
    : resources;
  // Available resources for selection
  var availableResources = (0, react_1.useMemo)(
    function () {
      var _a;
      if (
        !((_a =
          activeProcessedResources === null || activeProcessedResources === void 0
            ? void 0
            : activeProcessedResources.summary) === null || _a === void 0
          ? void 0
          : _a.resourceIds)
      ) {
        return [];
      }
      return activeProcessedResources.summary.resourceIds.sort();
    },
    [
      (_b =
        activeProcessedResources === null || activeProcessedResources === void 0
          ? void 0
          : activeProcessedResources.summary) === null || _b === void 0
        ? void 0
        : _b.resourceIds
    ]
  );
  // Get qualifier type information for form controls
  var qualifierTypeInfo = (0, react_1.useMemo)(
    function () {
      var info = {};
      // For the simplified version, we'll treat all qualifiers as text inputs
      // In a more advanced version, this would examine the system configuration
      availableQualifiers.forEach(function (qualifierName) {
        info[qualifierName] = { hasEnumeratedValues: false };
      });
      return info;
    },
    [availableQualifiers]
  );
  // Handle context value changes
  var handleContextChange = (0, react_1.useCallback)(
    function (qualifierName, value) {
      resolutionActions === null || resolutionActions === void 0
        ? void 0
        : resolutionActions.updateContextValue(qualifierName, value);
    },
    [resolutionActions]
  );
  // Handle resource selection
  var handleResourceSelect = (0, react_1.useCallback)(
    function (resourceId) {
      resolutionActions === null || resolutionActions === void 0
        ? void 0
        : resolutionActions.selectResource(resourceId);
    },
    [resolutionActions]
  );
  // Handle view mode change
  var handleViewModeChange = (0, react_1.useCallback)(
    function (mode) {
      resolutionActions === null || resolutionActions === void 0
        ? void 0
        : resolutionActions.setViewMode(mode);
    },
    [resolutionActions]
  );
  if (!resources) {
    return react_1.default.createElement(
      'div',
      { className: 'p-6 '.concat(className) },
      react_1.default.createElement(
        'div',
        { className: 'flex items-center space-x-3 mb-6' },
        react_1.default.createElement(outline_1.MagnifyingGlassIcon, { className: 'h-8 w-8 text-blue-600' }),
        react_1.default.createElement(
          'h2',
          { className: 'text-2xl font-bold text-gray-900' },
          'Resolution Viewer'
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
            'Import resources first to test resource resolution with different contexts.'
          ),
          react_1.default.createElement(
            'div',
            { className: 'bg-blue-50 rounded-lg p-4' },
            react_1.default.createElement(
              'p',
              { className: 'text-sm text-blue-800' },
              react_1.default.createElement('strong', null, 'Resolution Viewer:'),
              ' Test how resources resolve with different qualifier contexts. Set context values and see which candidates match.'
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
      { className: 'flex items-center space-x-3 mb-6' },
      react_1.default.createElement(outline_1.MagnifyingGlassIcon, { className: 'h-8 w-8 text-blue-600' }),
      react_1.default.createElement(
        'h2',
        { className: 'text-2xl font-bold text-gray-900' },
        'Resolution Viewer'
      ),
      isFilteringActive &&
        react_1.default.createElement(
          'span',
          {
            className:
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800'
          },
          'Filtered'
        )
    ),
    react_1.default.createElement(
      'div',
      { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6' },
      react_1.default.createElement(
        'div',
        { className: 'mb-6' },
        react_1.default.createElement(
          'h3',
          { className: 'text-lg font-semibold text-gray-900 mb-4' },
          'Context Configuration'
        ),
        react_1.default.createElement(
          'div',
          { className: 'bg-gray-50 rounded-lg p-4' },
          react_1.default.createElement(
            'div',
            { className: 'mb-4' },
            react_1.default.createElement(
              'div',
              { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3' },
              availableQualifiers.map(function (qualifierName) {
                var typeInfo = qualifierTypeInfo[qualifierName];
                var currentValue =
                  resolutionState === null || resolutionState === void 0
                    ? void 0
                    : resolutionState.pendingContextValues[qualifierName];
                return react_1.default.createElement(
                  'div',
                  { key: qualifierName, className: 'bg-white rounded border border-gray-200 p-2' },
                  react_1.default.createElement(
                    'div',
                    { className: 'flex items-center gap-2' },
                    react_1.default.createElement(
                      'label',
                      { className: 'text-sm font-medium text-gray-700 min-w-0 flex-shrink-0' },
                      qualifierName,
                      ':'
                    ),
                    react_1.default.createElement(
                      'div',
                      { className: 'flex-1 flex items-center gap-1' },
                      react_1.default.createElement('input', {
                        type: 'text',
                        value: currentValue !== null && currentValue !== void 0 ? currentValue : '',
                        onChange: function (e) {
                          return handleContextChange(qualifierName, e.target.value || undefined);
                        },
                        className:
                          'flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm min-w-0',
                        placeholder:
                          currentValue === undefined
                            ? '(undefined)'
                            : 'Enter '.concat(qualifierName, ' value')
                      }),
                      currentValue !== undefined &&
                        react_1.default.createElement(
                          'button',
                          {
                            type: 'button',
                            onClick: function () {
                              return handleContextChange(qualifierName, undefined);
                            },
                            className:
                              'px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors',
                            title: 'Set to undefined'
                          },
                          '\u2715'
                        )
                    )
                  )
                );
              })
            )
          ),
          react_1.default.createElement(
            'div',
            { className: 'flex items-center justify-between' },
            react_1.default.createElement(
              'div',
              { className: 'text-sm text-gray-600' },
              'Current:',
              ' ',
              Object.entries(
                (resolutionState === null || resolutionState === void 0
                  ? void 0
                  : resolutionState.contextValues) || {}
              )
                .map(function (_a) {
                  var key = _a[0],
                    value = _a[1];
                  return ''.concat(key, '=').concat(value === undefined ? '(undefined)' : value);
                })
                .join(', ')
            ),
            react_1.default.createElement(
              'div',
              { className: 'flex items-center space-x-2' },
              react_1.default.createElement(
                'button',
                {
                  onClick:
                    resolutionActions === null || resolutionActions === void 0
                      ? void 0
                      : resolutionActions.resetCache,
                  className:
                    'px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500',
                  title: 'Clear resolution cache'
                },
                'Clear Cache'
              ),
              react_1.default.createElement(
                'button',
                {
                  onClick:
                    resolutionActions === null || resolutionActions === void 0
                      ? void 0
                      : resolutionActions.applyContext,
                  disabled: !(resolutionState === null || resolutionState === void 0
                    ? void 0
                    : resolutionState.hasPendingChanges),
                  className: 'px-4 py-2 rounded-md text-sm font-medium '.concat(
                    (
                      resolutionState === null || resolutionState === void 0
                        ? void 0
                        : resolutionState.hasPendingChanges
                    )
                      ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  )
                },
                (
                  resolutionState === null || resolutionState === void 0
                    ? void 0
                    : resolutionState.hasPendingChanges
                )
                  ? 'Apply Changes'
                  : (
                      resolutionState === null || resolutionState === void 0
                        ? void 0
                        : resolutionState.currentResolver
                    )
                  ? 'Context Applied'
                  : 'Apply Context'
              )
            )
          )
        )
      ),
      react_1.default.createElement(
        'div',
        { className: 'flex flex-col lg:flex-row gap-6 h-[600px]' },
        react_1.default.createElement(
          'div',
          { className: 'lg:w-1/2 flex flex-col' },
          react_1.default.createElement(
            'div',
            { className: 'flex items-center justify-between mb-4' },
            react_1.default.createElement(
              'h3',
              { className: 'text-lg font-semibold text-gray-900' },
              'Resources'
            ),
            react_1.default.createElement(
              'div',
              { className: 'text-sm text-gray-500' },
              availableResources.length,
              ' available'
            )
          ),
          react_1.default.createElement(
            'div',
            { className: 'flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50' },
            availableResources.map(function (resourceId) {
              return react_1.default.createElement(
                'div',
                {
                  key: resourceId,
                  className: 'flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 '.concat(
                    (resolutionState === null || resolutionState === void 0
                      ? void 0
                      : resolutionState.selectedResourceId) === resourceId
                      ? 'bg-blue-50 border-r-2 border-blue-500'
                      : ''
                  ),
                  onClick: function () {
                    return handleResourceSelect(resourceId);
                  }
                },
                react_1.default.createElement(outline_1.DocumentTextIcon, {
                  className: 'w-4 h-4 mr-2 text-green-500'
                }),
                react_1.default.createElement(
                  'span',
                  {
                    className: 'text-sm '.concat(
                      (resolutionState === null || resolutionState === void 0
                        ? void 0
                        : resolutionState.selectedResourceId) === resourceId
                        ? 'font-medium text-blue-900'
                        : 'text-gray-700'
                    )
                  },
                  resourceId
                )
              );
            })
          )
        ),
        react_1.default.createElement(
          'div',
          { className: 'lg:w-1/2 flex flex-col' },
          react_1.default.createElement(
            'div',
            { className: 'flex items-center justify-between mb-4' },
            react_1.default.createElement(
              'h3',
              { className: 'text-lg font-semibold text-gray-900' },
              'Results'
            ),
            (resolutionState === null || resolutionState === void 0
              ? void 0
              : resolutionState.selectedResourceId) &&
              react_1.default.createElement(
                'div',
                { className: 'flex space-x-2' },
                react_1.default.createElement(
                  'button',
                  {
                    onClick: function () {
                      return handleViewModeChange('composed');
                    },
                    className: 'px-3 py-1 text-xs rounded '.concat(
                      (resolutionState === null || resolutionState === void 0
                        ? void 0
                        : resolutionState.viewMode) === 'composed'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    )
                  },
                  'Composed'
                ),
                react_1.default.createElement(
                  'button',
                  {
                    onClick: function () {
                      return handleViewModeChange('best');
                    },
                    className: 'px-3 py-1 text-xs rounded '.concat(
                      (resolutionState === null || resolutionState === void 0
                        ? void 0
                        : resolutionState.viewMode) === 'best'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    )
                  },
                  'Best'
                ),
                react_1.default.createElement(
                  'button',
                  {
                    onClick: function () {
                      return handleViewModeChange('all');
                    },
                    className: 'px-3 py-1 text-xs rounded '.concat(
                      (resolutionState === null || resolutionState === void 0
                        ? void 0
                        : resolutionState.viewMode) === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    )
                  },
                  'All'
                ),
                react_1.default.createElement(
                  'button',
                  {
                    onClick: function () {
                      return handleViewModeChange('raw');
                    },
                    className: 'px-3 py-1 text-xs rounded '.concat(
                      (resolutionState === null || resolutionState === void 0
                        ? void 0
                        : resolutionState.viewMode) === 'raw'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    )
                  },
                  'Raw'
                )
              )
          ),
          react_1.default.createElement(
            'div',
            { className: 'flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50' },
            !(resolutionState === null || resolutionState === void 0
              ? void 0
              : resolutionState.selectedResourceId)
              ? react_1.default.createElement(
                  'div',
                  { className: 'flex items-center justify-center h-full' },
                  react_1.default.createElement(
                    'div',
                    { className: 'text-center' },
                    react_1.default.createElement(outline_1.CubeIcon, {
                      className: 'h-12 w-12 text-gray-400 mx-auto mb-4'
                    }),
                    react_1.default.createElement(
                      'p',
                      { className: 'text-gray-500' },
                      'Select a resource to view resolution results'
                    )
                  )
                )
              : !(resolutionState === null || resolutionState === void 0
                  ? void 0
                  : resolutionState.currentResolver)
              ? react_1.default.createElement(
                  'div',
                  { className: 'text-center text-gray-500' },
                  react_1.default.createElement('p', null, 'Apply a context to resolve resources')
                )
              : !(resolutionState === null || resolutionState === void 0
                  ? void 0
                  : resolutionState.resolutionResult)
              ? react_1.default.createElement(
                  'div',
                  { className: 'text-center text-gray-500' },
                  react_1.default.createElement('p', null, 'Resolving...')
                )
              : react_1.default.createElement(ResolutionResults, {
                  result: resolutionState.resolutionResult,
                  viewMode: resolutionState.viewMode,
                  contextValues: resolutionState.contextValues
                })
          )
        )
      )
    )
  );
};
exports.ResolutionView = ResolutionView;
var ResolutionResults = function (_a) {
  var _b, _c, _d, _e, _f;
  var result = _a.result,
    viewMode = _a.viewMode,
    contextValues = _a.contextValues;
  if (!result.success) {
    return react_1.default.createElement(
      'div',
      { className: 'bg-red-50 border border-red-200 rounded-lg p-4' },
      react_1.default.createElement(
        'h4',
        { className: 'font-medium text-red-800 mb-2' },
        'Resolution Failed'
      ),
      react_1.default.createElement('p', { className: 'text-sm text-red-600' }, result.error)
    );
  }
  if (viewMode === 'raw') {
    return react_1.default.createElement(
      'div',
      { className: 'space-y-4' },
      react_1.default.createElement(
        'div',
        null,
        react_1.default.createElement(
          'h4',
          { className: 'font-medium text-gray-800 mb-2' },
          'Raw Resolution Data'
        ),
        react_1.default.createElement(
          'pre',
          { className: 'text-xs bg-white p-3 rounded border overflow-x-auto' },
          JSON.stringify(
            {
              context: contextValues,
              resource: result.resource
                ? {
                    id: result.resource.id,
                    candidateCount: result.resource.candidates.length
                  }
                : null,
              bestCandidate: (_b = result.bestCandidate) === null || _b === void 0 ? void 0 : _b.json,
              allCandidates:
                (_c = result.allCandidates) === null || _c === void 0
                  ? void 0
                  : _c.map(function (c) {
                      return c.json;
                    }),
              composedValue: result.composedValue,
              error: result.error
            },
            null,
            2
          )
        )
      )
    );
  }
  if (viewMode === 'composed') {
    return react_1.default.createElement(
      'div',
      { className: 'space-y-4' },
      result.composedValue
        ? react_1.default.createElement(
            'div',
            { className: 'bg-white p-3 rounded border' },
            react_1.default.createElement(
              'h4',
              { className: 'font-medium text-gray-800 mb-2' },
              'Composed Resource Value'
            ),
            react_1.default.createElement(
              'pre',
              { className: 'text-xs bg-gray-50 p-2 rounded overflow-x-auto' },
              JSON.stringify(result.composedValue, null, 2)
            )
          )
        : react_1.default.createElement(
            'div',
            { className: 'bg-yellow-50 border border-yellow-200 rounded p-3' },
            react_1.default.createElement(
              'p',
              { className: 'text-sm text-yellow-800' },
              'No composed value available for the current context.'
            ),
            result.error &&
              react_1.default.createElement('p', { className: 'text-xs text-yellow-600 mt-1' }, result.error)
          ),
      result.resource &&
        react_1.default.createElement(
          'div',
          null,
          react_1.default.createElement(
            'h4',
            { className: 'font-medium text-gray-800 mb-2' },
            'Resource Info'
          ),
          react_1.default.createElement(
            'div',
            { className: 'bg-white p-3 rounded border text-sm' },
            react_1.default.createElement(
              'div',
              null,
              react_1.default.createElement('strong', null, 'ID:'),
              ' ',
              result.resource.id
            ),
            react_1.default.createElement(
              'div',
              null,
              react_1.default.createElement('strong', null, 'Type:'),
              ' ',
              result.resource.resourceType.key
            ),
            react_1.default.createElement(
              'div',
              null,
              react_1.default.createElement('strong', null, 'Total Candidates:'),
              ' ',
              result.resource.candidates.length
            )
          )
        )
    );
  }
  if (viewMode === 'best') {
    return react_1.default.createElement(
      'div',
      { className: 'space-y-4' },
      react_1.default.createElement(
        'div',
        null,
        react_1.default.createElement('h4', { className: 'font-medium text-gray-800 mb-2' }, 'Best Match'),
        result.bestCandidate
          ? react_1.default.createElement(
              'div',
              { className: 'bg-white p-3 rounded border border-green-200' },
              react_1.default.createElement(
                'div',
                { className: 'text-sm font-medium text-gray-700 mb-2' },
                'Selected candidate for current context'
              ),
              react_1.default.createElement(
                'pre',
                { className: 'text-xs bg-gray-50 p-2 rounded overflow-x-auto' },
                JSON.stringify(result.bestCandidate.json, null, 2)
              )
            )
          : react_1.default.createElement(
              'div',
              { className: 'bg-yellow-50 border border-yellow-200 rounded p-3' },
              react_1.default.createElement(
                'p',
                { className: 'text-sm text-yellow-800' },
                'No best candidate found for the current context.'
              ),
              result.error &&
                react_1.default.createElement(
                  'p',
                  { className: 'text-xs text-yellow-600 mt-1' },
                  result.error
                )
            )
      )
    );
  }
  // 'all' view mode
  var regularMatchingCandidates =
    ((_d = result.candidateDetails) === null || _d === void 0
      ? void 0
      : _d.filter(function (c) {
          return c.matched && !c.isDefaultMatch;
        })) || [];
  var defaultMatchingCandidates =
    ((_e = result.candidateDetails) === null || _e === void 0
      ? void 0
      : _e.filter(function (c) {
          return c.matched && c.isDefaultMatch;
        })) || [];
  var nonMatchingCandidates =
    ((_f = result.candidateDetails) === null || _f === void 0
      ? void 0
      : _f.filter(function (c) {
          return !c.matched;
        })) || [];
  var getMatchTypeColor = function (type) {
    switch (type) {
      case 'match':
        return 'bg-green-100 text-green-800';
      case 'matchAsDefault':
        return 'bg-amber-100 text-amber-800';
      case 'noMatch':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  var getMatchTypeIcon = function (type) {
    switch (type) {
      case 'match':
        return '✓';
      case 'matchAsDefault':
        return '≈';
      case 'noMatch':
        return '✗';
      default:
        return '?';
    }
  };
  return react_1.default.createElement(
    'div',
    { className: 'space-y-4' },
    regularMatchingCandidates.length > 0 &&
      react_1.default.createElement(
        'div',
        null,
        react_1.default.createElement(
          'h4',
          { className: 'font-medium text-gray-800 mb-2' },
          'Regular Matches'
        ),
        react_1.default.createElement(
          'div',
          { className: 'space-y-2' },
          regularMatchingCandidates.map(function (candidateInfo, index) {
            return react_1.default.createElement(
              'div',
              {
                key: 'regular-'.concat(candidateInfo.candidateIndex),
                className: 'bg-white p-3 rounded border border-green-200'
              },
              react_1.default.createElement(
                'div',
                { className: 'flex items-center justify-between mb-2' },
                react_1.default.createElement(
                  'div',
                  { className: 'text-sm font-medium text-gray-700 flex items-center space-x-2' },
                  react_1.default.createElement(
                    'span',
                    null,
                    'Candidate ',
                    candidateInfo.candidateIndex + 1,
                    ' ',
                    index === 0 ? '(Best Match)' : ''
                  ),
                  react_1.default.createElement(
                    'span',
                    {
                      className: 'px-2 py-1 rounded text-xs '.concat(
                        getMatchTypeColor(candidateInfo.matchType)
                      )
                    },
                    getMatchTypeIcon(candidateInfo.matchType),
                    ' ',
                    candidateInfo.matchType
                  )
                )
              ),
              react_1.default.createElement(
                'pre',
                { className: 'text-xs bg-gray-50 p-2 rounded overflow-x-auto' },
                JSON.stringify(candidateInfo.candidate.json, null, 2)
              )
            );
          })
        )
      ),
    defaultMatchingCandidates.length > 0 &&
      react_1.default.createElement(
        'div',
        null,
        react_1.default.createElement(
          'h4',
          { className: 'font-medium text-gray-800 mb-2' },
          'Default Matches'
        ),
        react_1.default.createElement(
          'div',
          { className: 'space-y-2' },
          defaultMatchingCandidates.map(function (candidateInfo) {
            return react_1.default.createElement(
              'div',
              {
                key: 'default-'.concat(candidateInfo.candidateIndex),
                className: 'bg-white p-3 rounded border border-amber-200'
              },
              react_1.default.createElement(
                'div',
                { className: 'flex items-center justify-between mb-2' },
                react_1.default.createElement(
                  'div',
                  { className: 'text-sm font-medium text-gray-700 flex items-center space-x-2' },
                  react_1.default.createElement('span', null, 'Candidate ', candidateInfo.candidateIndex + 1),
                  react_1.default.createElement(
                    'span',
                    {
                      className: 'px-2 py-1 rounded text-xs '.concat(
                        getMatchTypeColor(candidateInfo.matchType)
                      )
                    },
                    getMatchTypeIcon(candidateInfo.matchType),
                    ' ',
                    candidateInfo.matchType
                  )
                )
              ),
              react_1.default.createElement(
                'pre',
                { className: 'text-xs bg-gray-50 p-2 rounded overflow-x-auto' },
                JSON.stringify(candidateInfo.candidate.json, null, 2)
              )
            );
          })
        )
      ),
    regularMatchingCandidates.length === 0 &&
      defaultMatchingCandidates.length === 0 &&
      react_1.default.createElement(
        'div',
        null,
        react_1.default.createElement(
          'h4',
          { className: 'font-medium text-gray-800 mb-2' },
          'Matching Candidates'
        ),
        react_1.default.createElement(
          'p',
          { className: 'text-sm text-gray-600' },
          'No candidates matched the current context.'
        )
      ),
    nonMatchingCandidates.length > 0 &&
      react_1.default.createElement(
        'div',
        null,
        react_1.default.createElement(
          'h4',
          { className: 'font-medium text-gray-500 mb-2' },
          'Non-matching Candidates'
        ),
        react_1.default.createElement(
          'div',
          { className: 'space-y-2' },
          nonMatchingCandidates.slice(0, 3).map(function (candidateInfo) {
            return react_1.default.createElement(
              'div',
              {
                key: 'non-matching-'.concat(candidateInfo.candidateIndex),
                className: 'bg-gray-50 p-3 rounded border border-gray-200 opacity-75'
              },
              react_1.default.createElement(
                'div',
                { className: 'text-sm font-medium text-gray-500 mb-2' },
                'Candidate ',
                candidateInfo.candidateIndex + 1
              ),
              react_1.default.createElement(
                'pre',
                { className: 'text-xs bg-gray-100 p-2 rounded overflow-x-auto text-gray-600' },
                JSON.stringify(candidateInfo.candidate.json, null, 2)
              )
            );
          }),
          nonMatchingCandidates.length > 3 &&
            react_1.default.createElement(
              'div',
              { className: 'text-center text-sm text-gray-500' },
              '... and ',
              nonMatchingCandidates.length - 3,
              ' more non-matching candidates'
            )
        )
      )
  );
};
exports.default = exports.ResolutionView;
//# sourceMappingURL=index.js.map
