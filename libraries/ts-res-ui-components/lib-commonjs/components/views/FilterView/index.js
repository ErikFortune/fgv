'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.FilterView = void 0;
var tslib_1 = require('tslib');
var react_1 = tslib_1.__importStar(require('react'));
var outline_1 = require('@heroicons/react/24/outline');
var FilterView = function (_a) {
  var resources = _a.resources,
    filterState = _a.filterState,
    filterActions = _a.filterActions,
    filterResult = _a.filterResult,
    onFilterResult = _a.onFilterResult,
    onMessage = _a.onMessage,
    _b = _a.className,
    className = _b === void 0 ? '' : _b;
  // Local UI state
  var _c = (0, react_1.useState)(null),
    selectedResourceId = _c[0],
    setSelectedResourceId = _c[1];
  var _d = (0, react_1.useState)(false),
    showFilteredJsonView = _d[0],
    setShowFilteredJsonView = _d[1];
  // Available qualifiers from system configuration or compiled collection
  var availableQualifiers = (0, react_1.useMemo)(
    function () {
      if (resources === null || resources === void 0 ? void 0 : resources.compiledCollection.qualifiers) {
        return resources.compiledCollection.qualifiers.map(function (q) {
          return q.name;
        });
      }
      // Fallback to default qualifiers if no compiled collection
      return ['language', 'territory', 'currentTerritory', 'role', 'env'];
    },
    [resources === null || resources === void 0 ? void 0 : resources.compiledCollection.qualifiers]
  );
  // Get qualifier type information for form controls
  var qualifierTypeInfo = (0, react_1.useMemo)(
    function () {
      var info = {};
      // Simple type mapping for basic form controls
      availableQualifiers.forEach(function (qualifierName) {
        // Default to text input for all qualifiers in the simplified version
        info[qualifierName] = {
          type: { systemType: 'literal' },
          enumeratedValues: []
        };
      });
      return info;
    },
    [availableQualifiers]
  );
  // Check if we have any applied filter values set
  var hasAppliedFilterValues = (0, react_1.useMemo)(
    function () {
      if (!filterState.appliedValues) return false;
      return Object.values(filterState.appliedValues).some(function (value) {
        return value !== undefined && value !== '';
      });
    },
    [filterState.appliedValues]
  );
  // Determine if filtering is active (enabled AND has applied values)
  var isFilteringActive = filterState.enabled && hasAppliedFilterValues;
  // Simplified filter summary
  var getFilterSummary = (0, react_1.useCallback)(function (values) {
    var activeFilters = Object.entries(values)
      .filter(function (_a) {
        var value = _a[1];
        return value !== undefined && value !== '';
      })
      .map(function (_a) {
        var key = _a[0],
          value = _a[1];
        return ''.concat(key, '=').concat(value);
      });
    return activeFilters.length > 0 ? activeFilters.join(', ') : 'No filters';
  }, []);
  // Get filtered resource collection data (simplified)
  var getFilteredResourceCollectionData = (0, react_1.useCallback)(
    function () {
      var _a;
      if (
        !((_a =
          filterResult === null || filterResult === void 0 ? void 0 : filterResult.processedResources) ===
          null || _a === void 0
          ? void 0
          : _a.system.resourceManager)
      ) {
        return null;
      }
      try {
        var collectionResult =
          filterResult.processedResources.system.resourceManager.getResourceCollectionDecl();
        if (collectionResult.isSuccess()) {
          return tslib_1.__assign(tslib_1.__assign({}, collectionResult.value), {
            metadata: {
              exportedAt: new Date().toISOString(),
              totalResources: filterResult.processedResources.resourceCount,
              type: 'ts-res-filtered-resource-collection',
              filterContext: filterState.appliedValues,
              reduceQualifiers: filterState.reduceQualifiers
            }
          });
        } else {
          onMessage === null || onMessage === void 0
            ? void 0
            : onMessage(
                'error',
                'Failed to get filtered resource collection: '.concat(collectionResult.message)
              );
          return null;
        }
      } catch (error) {
        onMessage === null || onMessage === void 0
          ? void 0
          : onMessage(
              'error',
              'Error getting filtered resource collection: '.concat(
                error instanceof Error ? error.message : String(error)
              )
            );
        return null;
      }
    },
    [filterResult, onMessage, filterState.appliedValues, filterState.reduceQualifiers]
  );
  // Export filtered resource collection data
  var handleExportFilteredData = (0, react_1.useCallback)(
    function () {
      try {
        var collectionData = getFilteredResourceCollectionData();
        if (!collectionData) {
          onMessage === null || onMessage === void 0
            ? void 0
            : onMessage('error', 'No filtered collection data available to export');
          return;
        }
        var filterSummary = getFilterSummary(filterState.appliedValues);
        // Use onExport callback instead of direct file download for flexibility
        // onExport?.(collectionData, 'json');
        onMessage === null || onMessage === void 0
          ? void 0
          : onMessage('success', 'Filtered resource collection exported successfully');
      } catch (error) {
        onMessage === null || onMessage === void 0
          ? void 0
          : onMessage(
              'error',
              'Failed to export filtered resource collection: '.concat(
                error instanceof Error ? error.message : String(error)
              )
            );
      }
    },
    [getFilteredResourceCollectionData, onMessage, filterState.appliedValues, getFilterSummary]
  );
  // Get resources to display (filtered or original) - now uses orchestrator's filterResult
  var displayResources = (0, react_1.useMemo)(
    function () {
      if (!resources) return [];
      var resourceList = [];
      if (
        isFilteringActive &&
        (filterResult === null || filterResult === void 0 ? void 0 : filterResult.success) &&
        filterResult.filteredResources
      ) {
        resourceList = filterResult.filteredResources;
      } else {
        // Return original resources
        var originalResources = resources.summary.resourceIds || [];
        resourceList = originalResources.map(function (id) {
          var resourceResult = resources.system.resourceManager.getBuiltResource(id);
          var candidateCount = resourceResult.isSuccess() ? resourceResult.value.candidates.length : 0;
          return {
            id: id,
            originalCandidateCount: candidateCount,
            filteredCandidateCount: candidateCount,
            hasWarning: false
          };
        });
      }
      // Sort resources alphabetically by id
      return resourceList.sort(function (a, b) {
        return a.id.localeCompare(b.id);
      });
    },
    [resources, isFilteringActive, filterResult]
  );
  // Handle filter value changes
  var handleFilterChange = (0, react_1.useCallback)(
    function (qualifierName, value) {
      var _a;
      var newValues = tslib_1.__assign(
        tslib_1.__assign({}, filterState.values),
        ((_a = {}), (_a[qualifierName] = value), _a)
      );
      filterActions.updateFilterValues(newValues);
    },
    [filterState.values, filterActions]
  );
  // Handle resource selection
  var handleResourceSelect = (0, react_1.useCallback)(function (resourceId) {
    setSelectedResourceId(resourceId);
  }, []);
  // Handle filter toggle
  var handleFilterToggle = (0, react_1.useCallback)(
    function (enabled) {
      filterActions.updateFilterEnabled(enabled);
      if (!enabled) {
        onMessage === null || onMessage === void 0
          ? void 0
          : onMessage('info', 'Filtering disabled - showing all resources');
      } else {
        onMessage === null || onMessage === void 0
          ? void 0
          : onMessage('info', 'Filtering enabled - set qualifier values and click Apply to filter resources');
      }
    },
    [filterActions, onMessage]
  );
  // Handle apply filter values
  var handleApplyFilter = (0, react_1.useCallback)(
    function () {
      filterActions.applyFilterValues();
      onMessage === null || onMessage === void 0
        ? void 0
        : onMessage('info', 'Filter applied - processing resources...');
    },
    [filterActions, onMessage]
  );
  // Handle reset filter values
  var handleResetFilter = (0, react_1.useCallback)(
    function () {
      filterActions.resetFilterValues();
      onMessage === null || onMessage === void 0 ? void 0 : onMessage('info', 'Filter values reset');
    },
    [filterActions, onMessage]
  );
  if (!resources) {
    return react_1.default.createElement(
      'div',
      { className: 'p-6 '.concat(className) },
      react_1.default.createElement(
        'div',
        { className: 'flex items-center space-x-3 mb-6' },
        react_1.default.createElement(outline_1.FunnelIcon, { className: 'h-8 w-8 text-purple-600' }),
        react_1.default.createElement('h2', { className: 'text-2xl font-bold text-gray-900' }, 'Filter Tool')
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
            'Import resources first to use the filter tool for context-based resource filtering.'
          ),
          react_1.default.createElement(
            'div',
            { className: 'bg-purple-50 rounded-lg p-4' },
            react_1.default.createElement(
              'p',
              { className: 'text-sm text-purple-800' },
              react_1.default.createElement('strong', null, 'Filter Tool:'),
              ' Allows you to filter resources based on partial context matching, creating focused subsets for analysis and testing.'
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
      react_1.default.createElement(outline_1.FunnelIcon, { className: 'h-8 w-8 text-purple-600' }),
      react_1.default.createElement('h2', { className: 'text-2xl font-bold text-gray-900' }, 'Filter Tool')
    ),
    react_1.default.createElement(
      'div',
      { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6' },
      react_1.default.createElement(
        'div',
        { className: 'mb-6' },
        react_1.default.createElement(
          'div',
          { className: 'flex items-center justify-between mb-4' },
          react_1.default.createElement(
            'h3',
            { className: 'text-lg font-semibold text-gray-900' },
            'Filter Controls'
          ),
          react_1.default.createElement(
            'div',
            { className: 'flex items-center justify-between' },
            react_1.default.createElement(
              'div',
              { className: 'flex items-center space-x-4' },
              react_1.default.createElement(
                'label',
                { className: 'flex items-center' },
                react_1.default.createElement('input', {
                  type: 'checkbox',
                  checked: filterState.enabled,
                  onChange: function (e) {
                    return handleFilterToggle(e.target.checked);
                  },
                  className: 'rounded border-gray-300 text-purple-600 focus:ring-purple-500'
                }),
                react_1.default.createElement(
                  'span',
                  { className: 'ml-2 text-sm text-gray-700' },
                  'Enable Filtering'
                )
              ),
              react_1.default.createElement(
                'label',
                {
                  className: 'flex items-center',
                  title:
                    'Remove perfectly matching qualifier conditions from filtered resources to create cleaner bundles for comparison'
                },
                react_1.default.createElement('input', {
                  type: 'checkbox',
                  checked: filterState.reduceQualifiers,
                  onChange: function (e) {
                    return filterActions.updateReduceQualifiers(e.target.checked);
                  },
                  disabled: !filterState.enabled,
                  className:
                    'rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:text-gray-400'
                }),
                react_1.default.createElement(
                  'span',
                  {
                    className: 'ml-2 text-sm '.concat(
                      !filterState.enabled ? 'text-gray-400' : 'text-gray-700'
                    )
                  },
                  'Reduce Qualifiers'
                )
              ),
              isFilteringActive &&
                react_1.default.createElement(
                  'span',
                  {
                    className:
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800'
                  },
                  'Active',
                  filterState.reduceQualifiers ? ' + Reducing' : ''
                ),
              filterState.hasPendingChanges &&
                filterState.enabled &&
                react_1.default.createElement(
                  'span',
                  {
                    className:
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800'
                  },
                  'Pending Changes'
                )
            ),
            filterState.enabled &&
              react_1.default.createElement(
                'div',
                { className: 'flex items-center space-x-2' },
                react_1.default.createElement(
                  'button',
                  {
                    onClick: handleResetFilter,
                    className:
                      'inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500'
                  },
                  react_1.default.createElement(outline_1.XMarkIcon, { className: 'h-4 w-4 mr-1' }),
                  'Reset'
                ),
                react_1.default.createElement(
                  'button',
                  {
                    onClick: handleApplyFilter,
                    disabled: !filterState.hasPendingChanges,
                    className:
                      'inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 '.concat(
                        filterState.hasPendingChanges
                          ? 'text-white bg-purple-600 hover:bg-purple-700'
                          : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                      )
                  },
                  react_1.default.createElement(outline_1.CheckIcon, { className: 'h-4 w-4 mr-1' }),
                  'Apply'
                )
              )
          )
        )
      ),
      react_1.default.createElement(
        'div',
        { className: 'mb-6' },
        react_1.default.createElement(
          'h3',
          { className: 'text-lg font-semibold text-gray-900 mb-4' },
          'Context Filters'
        ),
        react_1.default.createElement(
          'div',
          { className: 'bg-gray-50 rounded-lg p-4' },
          react_1.default.createElement(
            'div',
            { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3' },
            availableQualifiers.map(function (qualifierName) {
              var _a;
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
                      value: (_a = filterState.values[qualifierName]) !== null && _a !== void 0 ? _a : '',
                      onChange: function (e) {
                        return handleFilterChange(qualifierName, e.target.value);
                      },
                      disabled: !filterState.enabled,
                      className:
                        'flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent text-sm min-w-0 '.concat(
                          !filterState.enabled ? 'bg-gray-100 text-gray-400' : ''
                        ),
                      placeholder: !filterState.enabled
                        ? 'Disabled'
                        : filterState.values[qualifierName] === undefined
                        ? '(undefined)'
                        : 'Filter by '.concat(qualifierName)
                    }),
                    filterState.enabled &&
                      filterState.values[qualifierName] !== undefined &&
                      react_1.default.createElement(
                        'button',
                        {
                          type: 'button',
                          onClick: function () {
                            return handleFilterChange(qualifierName, undefined);
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
          ),
          filterState.enabled &&
            react_1.default.createElement(
              'div',
              { className: 'mt-3 text-sm text-gray-600' },
              react_1.default.createElement(
                'div',
                { className: 'flex items-center justify-between' },
                react_1.default.createElement(
                  'div',
                  { className: 'space-y-1' },
                  react_1.default.createElement(
                    'p',
                    null,
                    react_1.default.createElement('strong', null, 'Pending:'),
                    ' ',
                    getFilterSummary(filterState.values)
                  ),
                  isFilteringActive &&
                    react_1.default.createElement(
                      'p',
                      null,
                      react_1.default.createElement('strong', null, 'Applied:'),
                      ' ',
                      getFilterSummary(filterState.appliedValues)
                    )
                )
              ),
              filterResult &&
                !filterResult.success &&
                filterResult.error &&
                react_1.default.createElement(
                  'p',
                  { className: 'text-red-600 text-xs mt-1' },
                  react_1.default.createElement('strong', null, 'Error:'),
                  ' ',
                  filterResult.error
                )
            )
        )
      ),
      react_1.default.createElement(
        'div',
        { className: 'mb-6' },
        react_1.default.createElement(
          'div',
          { className: 'flex items-center justify-between mb-4' },
          react_1.default.createElement(
            'h3',
            { className: 'text-lg font-semibold text-gray-900' },
            isFilteringActive ? 'Filtered Resources' : 'All Resources'
          ),
          react_1.default.createElement(
            'div',
            { className: 'flex items-center space-x-2 text-sm text-gray-500' },
            react_1.default.createElement('span', null, displayResources.length, ' resources'),
            isFilteringActive &&
              displayResources.some(function (r) {
                return r.hasWarning;
              }) &&
              react_1.default.createElement(
                react_1.default.Fragment,
                null,
                react_1.default.createElement('span', null, '\u2022'),
                react_1.default.createElement(
                  'span',
                  { className: 'text-amber-600 flex items-center' },
                  react_1.default.createElement(outline_1.ExclamationTriangleIcon, {
                    className: 'h-4 w-4 mr-1'
                  }),
                  displayResources.filter(function (r) {
                    return r.hasWarning;
                  }).length,
                  ' warnings'
                )
              )
          )
        ),
        react_1.default.createElement(
          'div',
          { className: 'bg-gray-50 rounded-lg border border-gray-200 max-h-96 overflow-y-auto' },
          displayResources.map(function (resource) {
            return react_1.default.createElement(
              'div',
              {
                key: resource.id,
                className:
                  'flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0 '.concat(
                    selectedResourceId === resource.id ? 'bg-purple-50 border-r-2 border-purple-500' : ''
                  ),
                onClick: function () {
                  return handleResourceSelect(resource.id);
                }
              },
              react_1.default.createElement(
                'div',
                { className: 'flex items-center space-x-2 flex-1 min-w-0' },
                react_1.default.createElement(outline_1.DocumentTextIcon, {
                  className: 'w-4 h-4 text-green-500 flex-shrink-0'
                }),
                react_1.default.createElement(
                  'span',
                  {
                    className: 'text-sm truncate '.concat(
                      selectedResourceId === resource.id ? 'font-medium text-purple-900' : 'text-gray-700'
                    )
                  },
                  resource.id
                )
              ),
              react_1.default.createElement(
                'div',
                { className: 'flex items-center space-x-2 flex-shrink-0' },
                isFilteringActive &&
                  react_1.default.createElement(
                    'div',
                    { className: 'flex items-center space-x-1 text-xs' },
                    react_1.default.createElement(
                      'span',
                      { className: 'text-gray-400' },
                      resource.originalCandidateCount
                    ),
                    react_1.default.createElement('span', { className: 'text-gray-400' }, '\u2192'),
                    react_1.default.createElement(
                      'span',
                      {
                        className: 'font-medium '.concat(
                          resource.filteredCandidateCount === 0
                            ? 'text-red-600'
                            : resource.filteredCandidateCount < resource.originalCandidateCount
                            ? 'text-amber-600'
                            : 'text-green-600'
                        )
                      },
                      resource.filteredCandidateCount
                    )
                  ),
                !isFilteringActive &&
                  react_1.default.createElement(
                    'span',
                    { className: 'text-xs text-gray-500' },
                    resource.originalCandidateCount,
                    ' candidates'
                  ),
                resource.hasWarning &&
                  react_1.default.createElement(outline_1.ExclamationTriangleIcon, {
                    className: 'h-4 w-4 text-amber-500',
                    title: 'No matching candidates'
                  })
              )
            );
          })
        )
      ),
      selectedResourceId &&
        react_1.default.createElement(
          'div',
          { className: 'bg-blue-50 rounded-lg p-4' },
          react_1.default.createElement(
            'h4',
            { className: 'font-medium text-blue-900 mb-2' },
            'Selected Resource'
          ),
          react_1.default.createElement(
            'p',
            { className: 'text-sm text-blue-800' },
            react_1.default.createElement('strong', null, 'ID:'),
            ' ',
            selectedResourceId
          ),
          react_1.default.createElement(
            'p',
            { className: 'text-sm text-blue-700 mt-1' },
            'Click on a resource above to view detailed filtering information.'
          )
        )
    )
  );
};
exports.FilterView = FilterView;
exports.default = exports.FilterView;
//# sourceMappingURL=index.js.map
