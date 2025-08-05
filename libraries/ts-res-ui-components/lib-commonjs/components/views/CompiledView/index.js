'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.CompiledView = void 0;
var tslib_1 = require('tslib');
var react_1 = tslib_1.__importStar(require('react'));
var outline_1 = require('@heroicons/react/24/outline');
var ts_res_1 = require('@fgv/ts-res');
var CompiledView = function (_a) {
  var _b;
  var resources = _a.resources,
    filterState = _a.filterState,
    filterResult = _a.filterResult,
    _c = _a.useNormalization,
    useNormalizationProp = _c === void 0 ? false : _c,
    onExport = _a.onExport,
    onMessage = _a.onMessage,
    _d = _a.className,
    className = _d === void 0 ? '' : _d;
  var _e = (0, react_1.useState)(null),
    selectedNodeId = _e[0],
    setSelectedNodeId = _e[1];
  var _f = (0, react_1.useState)(new Set(['root', 'resources'])),
    expandedNodes = _f[0],
    setExpandedNodes = _f[1];
  var _g = (0, react_1.useState)(false),
    showJsonView = _g[0],
    setShowJsonView = _g[1];
  var _h = (0, react_1.useState)(useNormalizationProp),
    useNormalization = _h[0],
    setUseNormalization = _h[1];
  // Update normalization default when bundle state changes
  (0, react_1.useEffect)(
    function () {
      if (
        (resources === null || resources === void 0 ? void 0 : resources.isLoadedFromBundle) &&
        !useNormalization
      ) {
        setUseNormalization(true);
      }
    },
    [resources === null || resources === void 0 ? void 0 : resources.isLoadedFromBundle, useNormalization]
  );
  // Use filtered resources when filtering is active and successful
  var isFilteringActive =
    (filterState === null || filterState === void 0 ? void 0 : filterState.enabled) &&
    (filterResult === null || filterResult === void 0 ? void 0 : filterResult.success) === true;
  var activeProcessedResources = isFilteringActive
    ? filterResult === null || filterResult === void 0
      ? void 0
      : filterResult.processedResources
    : resources;
  // Helper functions to resolve indices to meaningful keys
  var getConditionKey = function (condition, compiledCollection) {
    var _a;
    try {
      if ((_a = condition.metadata) === null || _a === void 0 ? void 0 : _a.key) {
        return condition.metadata.key;
      }
      var qualifier = compiledCollection.qualifiers[condition.qualifierIndex];
      if (!qualifier) return 'unknown-qualifier';
      var key = ''.concat(qualifier.name, '=').concat(condition.value);
      return key;
    } catch (error) {
      return 'condition-'.concat(condition.qualifierIndex);
    }
  };
  var getConditionSetKey = function (conditionSet, conditionSetIndex, compiledCollection) {
    var _a;
    try {
      if ((_a = conditionSet.metadata) === null || _a === void 0 ? void 0 : _a.key) {
        return conditionSet.metadata.key;
      }
      if (conditionSetIndex === 0) {
        return 'unconditional';
      }
      if (!conditionSet.conditions || conditionSet.conditions.length === 0) {
        return 'condition-set-'.concat(conditionSetIndex);
      }
      var conditionKeys = conditionSet.conditions.map(function (conditionIndex) {
        var condition = compiledCollection.conditions[conditionIndex];
        if (!condition) return 'unknown-'.concat(conditionIndex);
        return getConditionKey(condition, compiledCollection);
      });
      return conditionKeys.join(',');
    } catch (error) {
      return 'condition-set-'.concat(conditionSetIndex);
    }
  };
  var getDecisionKey = function (decision, decisionIndex, compiledCollection) {
    var _a;
    try {
      if ((_a = decision.metadata) === null || _a === void 0 ? void 0 : _a.key) {
        return decision.metadata.key;
      }
      if (!decision.conditionSets || decision.conditionSets.length === 0) {
        return 'decision-'.concat(decisionIndex);
      }
      var conditionSetKeys = decision.conditionSets.map(function (conditionSetIndex) {
        var conditionSet = compiledCollection.conditionSets[conditionSetIndex];
        if (!conditionSet) return 'unknown-'.concat(conditionSetIndex);
        return getConditionSetKey(conditionSet, conditionSetIndex, compiledCollection);
      });
      return conditionSetKeys.join(' OR ');
    } catch (error) {
      return 'decision-'.concat(decisionIndex);
    }
  };
  var formatDisplayName = function (key, index) {
    if (key.match(/^(condition|condition-set|decision)-\d+$/)) {
      return ''.concat(index);
    }
    return ''.concat(key, ' (').concat(index, ')');
  };
  var getResourceTypeName = function (resourceTypeIndex, compiledCollection) {
    try {
      var resourceType = compiledCollection.resourceTypes[resourceTypeIndex];
      return (
        (resourceType === null || resourceType === void 0 ? void 0 : resourceType.name) ||
        'resource-type-'.concat(resourceTypeIndex)
      );
    } catch (error) {
      return 'resource-type-'.concat(resourceTypeIndex);
    }
  };
  // Build tree structure from compiled resources
  var treeData = (0, react_1.useMemo)(
    function () {
      var _a, _b, _c, _d;
      if (
        !(activeProcessedResources === null || activeProcessedResources === void 0
          ? void 0
          : activeProcessedResources.compiledCollection)
      ) {
        return null;
      }
      var compiledCollection = activeProcessedResources.compiledCollection;
      // Apply normalization if enabled
      if (
        useNormalization &&
        (resources === null || resources === void 0 ? void 0 : resources.activeConfiguration)
      ) {
        try {
          var systemConfigResult = ts_res_1.Config.SystemConfiguration.create(resources.activeConfiguration);
          if (systemConfigResult.isSuccess()) {
            var resourceManagerResult = ts_res_1.Bundle.BundleNormalizer.normalize(
              activeProcessedResources.system.resourceManager,
              systemConfigResult.value
            );
            if (resourceManagerResult.isSuccess()) {
              var normalizedCompiledResult = resourceManagerResult.value.getCompiledResourceCollection({
                includeMetadata: true
              });
              if (normalizedCompiledResult.isSuccess()) {
                compiledCollection = normalizedCompiledResult.value;
              }
            }
          }
        } catch (error) {
          console.warn('Failed to normalize compiled collection:', error);
        }
      }
      var tree = {
        id: 'root',
        name: 'Compiled Resources',
        type: 'folder',
        children: []
      };
      try {
        // Resources section
        var resourcesCount =
          ((_a = compiledCollection.resources) === null || _a === void 0 ? void 0 : _a.length) || 0;
        var resourcesSection = {
          id: 'resources',
          name: 'Resources ('.concat(resourcesCount, ')'),
          type: 'section',
          children: []
        };
        if (compiledCollection.resources && compiledCollection.resources.length > 0) {
          resourcesSection.children = compiledCollection.resources.map(function (resource, index) {
            return {
              id: 'resource-'.concat(index),
              name: resource.id || 'Resource '.concat(index),
              type: 'resource',
              data: { type: 'compiled-resource', resource: resource, compiledCollection: compiledCollection }
            };
          });
        }
        tree.children.push(resourcesSection);
        // Decisions section
        var decisionsCount =
          ((_b = compiledCollection.decisions) === null || _b === void 0 ? void 0 : _b.length) || 0;
        tree.children.push({
          id: 'decisions',
          name: 'Decisions ('.concat(decisionsCount, ')'),
          type: 'section',
          data: {
            type: 'decisions',
            collection: compiledCollection.decisions,
            compiledCollection: compiledCollection
          }
        });
        // Condition Sets section
        var conditionSetsCount =
          ((_c = compiledCollection.conditionSets) === null || _c === void 0 ? void 0 : _c.length) || 0;
        tree.children.push({
          id: 'condition-sets',
          name: 'Condition Sets ('.concat(conditionSetsCount, ')'),
          type: 'section',
          data: {
            type: 'condition-sets',
            collection: compiledCollection.conditionSets,
            compiledCollection: compiledCollection
          }
        });
        // Conditions section
        var conditionsCount =
          ((_d = compiledCollection.conditions) === null || _d === void 0 ? void 0 : _d.length) || 0;
        tree.children.push({
          id: 'conditions',
          name: 'Conditions ('.concat(conditionsCount, ')'),
          type: 'section',
          data: {
            type: 'conditions',
            collection: compiledCollection.conditions,
            compiledCollection: compiledCollection
          }
        });
      } catch (error) {
        onMessage === null || onMessage === void 0
          ? void 0
          : onMessage(
              'error',
              'Error building tree: '.concat(error instanceof Error ? error.message : String(error))
            );
      }
      return tree;
    },
    [
      activeProcessedResources === null || activeProcessedResources === void 0
        ? void 0
        : activeProcessedResources.compiledCollection,
      activeProcessedResources === null || activeProcessedResources === void 0
        ? void 0
        : activeProcessedResources.system.resourceManager,
      onMessage,
      isFilteringActive,
      useNormalization,
      resources === null || resources === void 0 ? void 0 : resources.isLoadedFromBundle,
      resources === null || resources === void 0 ? void 0 : resources.activeConfiguration
    ]
  );
  var handleExportCompiledData = (0, react_1.useCallback)(
    function () {
      return tslib_1.__awaiter(void 0, void 0, void 0, function () {
        var compiledCollection,
          systemConfigResult,
          resourceManagerResult,
          normalizedCompiledResult,
          compiledData;
        return tslib_1.__generator(this, function (_a) {
          if (
            !(activeProcessedResources === null || activeProcessedResources === void 0
              ? void 0
              : activeProcessedResources.compiledCollection)
          ) {
            onMessage === null || onMessage === void 0
              ? void 0
              : onMessage('error', 'No compiled data available to export');
            return [2 /*return*/];
          }
          compiledCollection = activeProcessedResources.compiledCollection;
          if (
            useNormalization &&
            (resources === null || resources === void 0 ? void 0 : resources.activeConfiguration)
          ) {
            try {
              systemConfigResult = ts_res_1.Config.SystemConfiguration.create(resources.activeConfiguration);
              if (systemConfigResult.isSuccess()) {
                resourceManagerResult = ts_res_1.Bundle.BundleNormalizer.normalize(
                  activeProcessedResources.system.resourceManager,
                  systemConfigResult.value
                );
                if (resourceManagerResult.isSuccess()) {
                  normalizedCompiledResult = resourceManagerResult.value.getCompiledResourceCollection({
                    includeMetadata: true
                  });
                  if (normalizedCompiledResult.isSuccess()) {
                    compiledCollection = normalizedCompiledResult.value;
                  }
                }
              }
            } catch (error) {
              console.warn('Failed to normalize for export:', error);
            }
          }
          compiledData = tslib_1.__assign(tslib_1.__assign({}, compiledCollection), {
            metadata: tslib_1.__assign(
              tslib_1.__assign(
                {
                  exportedAt: new Date().toISOString(),
                  type: isFilteringActive
                    ? 'ts-res-filtered-compiled-collection'
                    : 'ts-res-compiled-collection',
                  normalized: useNormalization
                },
                (resources === null || resources === void 0 ? void 0 : resources.isLoadedFromBundle) && {
                  loadedFromBundle: true
                }
              ),
              isFilteringActive && {
                filterContext:
                  filterState === null || filterState === void 0 ? void 0 : filterState.appliedValues
              }
            )
          });
          onExport === null || onExport === void 0 ? void 0 : onExport(compiledData, 'json');
          return [2 /*return*/];
        });
      });
    },
    [
      activeProcessedResources,
      onMessage,
      isFilteringActive,
      filterState === null || filterState === void 0 ? void 0 : filterState.appliedValues,
      useNormalization,
      resources,
      onExport
    ]
  );
  var handleExportBundle = (0, react_1.useCallback)(
    function () {
      return tslib_1.__awaiter(void 0, void 0, void 0, function () {
        var systemConfigResult, systemConfig, bundleParams, bundleResult, bundle, exportBundle;
        var _a;
        return tslib_1.__generator(this, function (_b) {
          if (
            !((_a =
              activeProcessedResources === null || activeProcessedResources === void 0
                ? void 0
                : activeProcessedResources.system) === null || _a === void 0
              ? void 0
              : _a.resourceManager) ||
            !(resources === null || resources === void 0 ? void 0 : resources.activeConfiguration)
          ) {
            onMessage === null || onMessage === void 0
              ? void 0
              : onMessage('error', 'No resource manager or configuration available to create bundle');
            return [2 /*return*/];
          }
          systemConfigResult = ts_res_1.Config.SystemConfiguration.create(resources.activeConfiguration);
          if (systemConfigResult.isFailure()) {
            onMessage === null || onMessage === void 0
              ? void 0
              : onMessage(
                  'error',
                  'Failed to create system configuration: '.concat(systemConfigResult.message)
                );
            return [2 /*return*/];
          }
          systemConfig = systemConfigResult.value;
          bundleParams = {
            version: '1.0.0',
            description: isFilteringActive
              ? 'Bundle exported from ts-res-ui-components (filtered)'
              : 'Bundle exported from ts-res-ui-components',
            normalize: true
          };
          bundleResult = ts_res_1.Bundle.BundleBuilder.create(
            activeProcessedResources.system.resourceManager,
            systemConfig,
            bundleParams
          );
          if (bundleResult.isFailure()) {
            onMessage === null || onMessage === void 0
              ? void 0
              : onMessage('error', 'Failed to create bundle: '.concat(bundleResult.message));
            return [2 /*return*/];
          }
          bundle = bundleResult.value;
          exportBundle = tslib_1.__assign(tslib_1.__assign({}, bundle), {
            exportMetadata: tslib_1.__assign(
              {
                exportedAt: new Date().toISOString(),
                exportedFrom: 'ts-res-ui-components',
                type: isFilteringActive ? 'ts-res-bundle-filtered' : 'ts-res-bundle'
              },
              isFilteringActive && {
                filterContext:
                  filterState === null || filterState === void 0 ? void 0 : filterState.appliedValues
              }
            )
          });
          onExport === null || onExport === void 0 ? void 0 : onExport(exportBundle, 'bundle');
          return [2 /*return*/];
        });
      });
    },
    [
      (_b =
        activeProcessedResources === null || activeProcessedResources === void 0
          ? void 0
          : activeProcessedResources.system) === null || _b === void 0
        ? void 0
        : _b.resourceManager,
      resources === null || resources === void 0 ? void 0 : resources.activeConfiguration,
      onMessage,
      isFilteringActive,
      filterState === null || filterState === void 0 ? void 0 : filterState.appliedValues,
      onExport
    ]
  );
  var handleNodeClick = function (node) {
    setSelectedNodeId(node.id);
    onMessage === null || onMessage === void 0 ? void 0 : onMessage('info', 'Selected: '.concat(node.name));
    if (node.type === 'folder' || (node.type === 'section' && node.children)) {
      setExpandedNodes(function (prev) {
        var newExpanded = new Set(prev);
        if (newExpanded.has(node.id)) {
          newExpanded.delete(node.id);
        } else {
          newExpanded.add(node.id);
        }
        return newExpanded;
      });
    }
  };
  var renderTreeNode = function (node, level) {
    if (level === void 0) {
      level = 0;
    }
    var isExpanded = expandedNodes.has(node.id);
    var isSelected = selectedNodeId === node.id;
    var hasChildren = node.children && node.children.length > 0;
    return react_1.default.createElement(
      'div',
      { key: node.id },
      react_1.default.createElement(
        'div',
        {
          className: 'flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100 '.concat(
            isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
          ),
          style: { paddingLeft: ''.concat(8 + level * 16, 'px') },
          onClick: function () {
            return handleNodeClick(node);
          }
        },
        hasChildren &&
          react_1.default.createElement(
            'div',
            { className: 'w-4 h-4 mr-1 flex items-center justify-center' },
            isExpanded
              ? react_1.default.createElement(outline_1.ChevronDownIcon, {
                  className: 'w-3 h-3 text-gray-500'
                })
              : react_1.default.createElement(outline_1.ChevronRightIcon, {
                  className: 'w-3 h-3 text-gray-500'
                })
          ),
        !hasChildren && react_1.default.createElement('div', { className: 'w-5 mr-1' }),
        react_1.default.createElement(
          'div',
          { className: 'w-4 h-4 mr-2 flex items-center justify-center' },
          node.type === 'folder'
            ? isExpanded
              ? react_1.default.createElement(outline_1.FolderOpenIcon, {
                  className: 'w-4 h-4 text-blue-500'
                })
              : react_1.default.createElement(outline_1.FolderIcon, { className: 'w-4 h-4 text-blue-500' })
            : node.type === 'resource'
            ? react_1.default.createElement(outline_1.DocumentTextIcon, {
                className: 'w-4 h-4 text-green-500'
              })
            : react_1.default.createElement(outline_1.CubeIcon, { className: 'w-4 h-4 text-purple-500' })
        ),
        react_1.default.createElement(
          'span',
          { className: 'text-sm '.concat(isSelected ? 'font-medium text-blue-900' : 'text-gray-700') },
          node.name
        )
      ),
      hasChildren &&
        isExpanded &&
        react_1.default.createElement(
          'div',
          null,
          node.children.map(function (child) {
            return renderTreeNode(child, level + 1);
          })
        )
    );
  };
  if (!resources) {
    return react_1.default.createElement(
      'div',
      { className: 'p-6 '.concat(className) },
      react_1.default.createElement(
        'div',
        { className: 'flex items-center space-x-3 mb-6' },
        react_1.default.createElement(outline_1.CubeIcon, { className: 'h-8 w-8 text-blue-600' }),
        react_1.default.createElement(
          'h2',
          { className: 'text-2xl font-bold text-gray-900' },
          'Compiled Resources'
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
            'No Compiled Resources'
          ),
          react_1.default.createElement(
            'p',
            { className: 'text-gray-600 mb-6' },
            'Import resources to explore the compiled resource collection.'
          )
        )
      )
    );
  }
  var selectedNode = selectedNodeId ? findNodeById(treeData, selectedNodeId) : null;
  return react_1.default.createElement(
    'div',
    { className: 'p-6 '.concat(className) },
    react_1.default.createElement(
      'div',
      { className: 'flex items-center justify-between mb-6' },
      react_1.default.createElement(
        'div',
        { className: 'flex items-center space-x-3' },
        react_1.default.createElement(outline_1.CubeIcon, { className: 'h-8 w-8 text-blue-600' }),
        react_1.default.createElement(
          'h2',
          { className: 'text-2xl font-bold text-gray-900' },
          'Compiled Resources'
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
      activeProcessedResources &&
        react_1.default.createElement(
          'div',
          { className: 'flex items-center space-x-2' },
          react_1.default.createElement(
            'button',
            {
              onClick: handleExportCompiledData,
              className:
                'inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            },
            react_1.default.createElement(outline_1.DocumentArrowDownIcon, { className: 'h-4 w-4 mr-1' }),
            'Export JSON'
          ),
          react_1.default.createElement(
            'button',
            {
              onClick: handleExportBundle,
              className:
                'inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            },
            react_1.default.createElement(outline_1.ArchiveBoxIcon, { className: 'h-4 w-4 mr-1' }),
            'Export Bundle'
          )
        )
    ),
    activeProcessedResources &&
      react_1.default.createElement(
        'div',
        { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6' },
        react_1.default.createElement(
          'div',
          { className: 'flex items-center justify-between' },
          react_1.default.createElement(
            'div',
            { className: 'flex items-center space-x-6' },
            react_1.default.createElement(
              'div',
              { className: 'flex items-center space-x-2' },
              (resources === null || resources === void 0 ? void 0 : resources.isLoadedFromBundle)
                ? react_1.default.createElement(outline_1.ArchiveBoxIcon, {
                    className: 'h-4 w-4 text-blue-600'
                  })
                : react_1.default.createElement(outline_1.CubeIcon, { className: 'h-4 w-4 text-gray-600' }),
              react_1.default.createElement(
                'label',
                { className: 'text-sm font-medium text-gray-700' },
                'Normalize Output:'
              ),
              react_1.default.createElement(
                'button',
                {
                  onClick: function () {
                    return setUseNormalization(!useNormalization);
                  },
                  className:
                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 '.concat(
                      useNormalization ? 'bg-blue-600' : 'bg-gray-300'
                    )
                },
                react_1.default.createElement('span', {
                  className:
                    'inline-block h-3 w-3 transform rounded-full bg-white transition-transform '.concat(
                      useNormalization ? 'translate-x-5' : 'translate-x-1'
                    )
                })
              ),
              react_1.default.createElement(
                'span',
                { className: 'text-xs text-gray-500' },
                useNormalization ? 'ON' : 'OFF'
              )
            ),
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
              ' JSON',
              showJsonView
                ? react_1.default.createElement(outline_1.ChevronUpIcon, { className: 'h-4 w-4 ml-2' })
                : react_1.default.createElement(outline_1.ChevronDownIcon, { className: 'h-4 w-4 ml-2' })
            )
          )
        ),
        showJsonView &&
          react_1.default.createElement(
            'div',
            { className: 'mt-4' },
            react_1.default.createElement(
              'div',
              { className: 'bg-gray-50 rounded-lg border border-gray-200 p-4' },
              react_1.default.createElement(
                'pre',
                {
                  className:
                    'text-xs text-gray-800 bg-white p-3 rounded border overflow-x-auto max-h-64 overflow-y-auto'
                },
                JSON.stringify(activeProcessedResources.compiledCollection, null, 2)
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
            'h3',
            { className: 'text-lg font-semibold text-gray-900 mb-4' },
            'Compiled Collection'
          ),
          react_1.default.createElement(
            'div',
            { className: 'flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50' },
            treeData && renderTreeNode(treeData)
          )
        ),
        react_1.default.createElement(
          'div',
          { className: 'lg:w-1/2 flex flex-col' },
          selectedNode
            ? react_1.default.createElement(NodeDetail, {
                node: selectedNode,
                getConditionKey: getConditionKey,
                getConditionSetKey: getConditionSetKey,
                getDecisionKey: getDecisionKey,
                formatDisplayName: formatDisplayName,
                getResourceTypeName: getResourceTypeName
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
                  react_1.default.createElement(outline_1.CubeIcon, {
                    className: 'h-12 w-12 text-gray-400 mx-auto mb-4'
                  }),
                  react_1.default.createElement(
                    'p',
                    { className: 'text-gray-500' },
                    'Select an item to view details'
                  )
                )
              )
        )
      )
    )
  );
};
exports.CompiledView = CompiledView;
// Helper function to find node by ID
var findNodeById = function (tree, id) {
  if (tree.id === id) return tree;
  if (tree.children) {
    for (var _i = 0, _a = tree.children; _i < _a.length; _i++) {
      var child = _a[_i];
      var found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
};
var NodeDetail = function (_a) {
  var node = _a.node,
    getConditionKey = _a.getConditionKey,
    getConditionSetKey = _a.getConditionSetKey,
    getDecisionKey = _a.getDecisionKey,
    formatDisplayName = _a.formatDisplayName,
    getResourceTypeName = _a.getResourceTypeName;
  var renderDetails = function () {
    if (!node.data) {
      return react_1.default.createElement(
        'div',
        { className: 'p-4' },
        react_1.default.createElement(
          'h4',
          { className: 'font-medium text-gray-700 mb-2' },
          'Folder: ',
          node.name
        ),
        react_1.default.createElement(
          'p',
          { className: 'text-sm text-gray-600' },
          node.children ? 'Contains '.concat(node.children.length, ' items') : 'Empty folder'
        )
      );
    }
    var _a = node.data,
      type = _a.type,
      collection = _a.collection,
      resource = _a.resource,
      compiledCollection = _a.compiledCollection;
    // Simplified rendering logic - showing just basic info
    return react_1.default.createElement(
      'div',
      { className: 'p-4' },
      react_1.default.createElement('h4', { className: 'font-medium text-gray-700 mb-2' }, node.name),
      react_1.default.createElement(
        'pre',
        { className: 'text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-96 overflow-y-auto' },
        JSON.stringify(node.data, null, 2)
      )
    );
  };
  return react_1.default.createElement(
    'div',
    { className: 'flex flex-col h-full' },
    react_1.default.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-4' }, 'Details'),
    react_1.default.createElement(
      'div',
      { className: 'flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50' },
      renderDetails()
    )
  );
};
exports.default = exports.CompiledView;
//# sourceMappingURL=index.js.map
