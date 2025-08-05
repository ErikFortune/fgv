import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  CubeIcon,
  FolderIcon,
  FolderOpenIcon,
  DocumentTextIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  DocumentArrowDownIcon,
  CodeBracketIcon,
  ChevronUpIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { CompiledViewProps, ProcessedResources, FilterState, FilterResult } from '../../../types';
import { ResourceJson, Config, Bundle } from '@fgv/ts-res';

interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'resource' | 'section';
  children?: TreeNode[];
  data?: any;
}

export const CompiledView: React.FC<CompiledViewProps> = ({
  resources,
  filterState,
  filterResult,
  useNormalization: useNormalizationProp = false,
  onExport,
  onMessage,
  className = ''
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root', 'resources']));
  const [showJsonView, setShowJsonView] = useState(false);
  const [useNormalization, setUseNormalization] = useState(useNormalizationProp);

  // Update normalization default when bundle state changes
  useEffect(() => {
    if (resources?.isLoadedFromBundle && !useNormalization) {
      setUseNormalization(true);
    }
  }, [resources?.isLoadedFromBundle, useNormalization]);

  // Use filtered resources when filtering is active and successful
  const isFilteringActive = filterState?.enabled && filterResult?.success === true;
  const activeProcessedResources = isFilteringActive ? filterResult?.processedResources : resources;

  // Helper functions to resolve indices to meaningful keys
  const getConditionKey = (
    condition: ResourceJson.Compiled.ICompiledCondition,
    compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection
  ): string => {
    try {
      if (condition.metadata?.key) {
        return condition.metadata.key;
      }

      const qualifier = compiledCollection.qualifiers[condition.qualifierIndex];
      if (!qualifier) return `unknown-qualifier`;

      const key = `${qualifier.name}=${condition.value}`;
      return key;
    } catch (error) {
      return `condition-${condition.qualifierIndex}`;
    }
  };

  const getConditionSetKey = (
    conditionSet: ResourceJson.Compiled.ICompiledConditionSet,
    conditionSetIndex: number,
    compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection
  ): string => {
    try {
      if (conditionSet.metadata?.key) {
        return conditionSet.metadata.key;
      }

      if (conditionSetIndex === 0) {
        return 'unconditional';
      }

      if (!conditionSet.conditions || conditionSet.conditions.length === 0) {
        return `condition-set-${conditionSetIndex}`;
      }

      const conditionKeys = conditionSet.conditions.map((conditionIndex) => {
        const condition = compiledCollection.conditions[conditionIndex];
        if (!condition) return `unknown-${conditionIndex}`;
        return getConditionKey(condition, compiledCollection);
      });

      return conditionKeys.join(',');
    } catch (error) {
      return `condition-set-${conditionSetIndex}`;
    }
  };

  const getDecisionKey = (
    decision: ResourceJson.Compiled.ICompiledAbstractDecision,
    decisionIndex: number,
    compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection
  ): string => {
    try {
      if (decision.metadata?.key) {
        return decision.metadata.key;
      }

      if (!decision.conditionSets || decision.conditionSets.length === 0) {
        return `decision-${decisionIndex}`;
      }

      const conditionSetKeys = decision.conditionSets.map((conditionSetIndex) => {
        const conditionSet = compiledCollection.conditionSets[conditionSetIndex];
        if (!conditionSet) return `unknown-${conditionSetIndex}`;
        return getConditionSetKey(conditionSet, conditionSetIndex, compiledCollection);
      });

      return conditionSetKeys.join(' OR ');
    } catch (error) {
      return `decision-${decisionIndex}`;
    }
  };

  const formatDisplayName = (key: string, index: number): string => {
    if (key.match(/^(condition|condition-set|decision)-\d+$/)) {
      return `${index}`;
    }
    return `${key} (${index})`;
  };

  const getResourceTypeName = (
    resourceTypeIndex: number,
    compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection
  ): string => {
    try {
      const resourceType = compiledCollection.resourceTypes[resourceTypeIndex];
      return resourceType?.name || `resource-type-${resourceTypeIndex}`;
    } catch (error) {
      return `resource-type-${resourceTypeIndex}`;
    }
  };

  // Build tree structure from compiled resources
  const treeData = useMemo(() => {
    if (!activeProcessedResources?.compiledCollection) {
      return null;
    }

    let compiledCollection = activeProcessedResources.compiledCollection;

    // Apply normalization if enabled
    if (useNormalization && resources?.activeConfiguration) {
      try {
        const systemConfigResult = Config.SystemConfiguration.create(resources.activeConfiguration);
        if (systemConfigResult.isSuccess()) {
          const resourceManagerResult = Bundle.BundleNormalizer.normalize(
            activeProcessedResources.system.resourceManager,
            systemConfigResult.value
          );

          if (resourceManagerResult.isSuccess()) {
            const normalizedCompiledResult = resourceManagerResult.value.getCompiledResourceCollection({
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

    const tree: TreeNode = {
      id: 'root',
      name: 'Compiled Resources',
      type: 'folder',
      children: []
    };

    try {
      // Resources section
      const resourcesCount = compiledCollection.resources?.length || 0;
      const resourcesSection: TreeNode = {
        id: 'resources',
        name: `Resources (${resourcesCount})`,
        type: 'section',
        children: []
      };

      if (compiledCollection.resources && compiledCollection.resources.length > 0) {
        resourcesSection.children = compiledCollection.resources.map((resource, index) => ({
          id: `resource-${index}`,
          name: resource.id || `Resource ${index}`,
          type: 'resource' as const,
          data: { type: 'compiled-resource', resource, compiledCollection }
        }));
      }

      tree.children!.push(resourcesSection);

      // Decisions section
      const decisionsCount = compiledCollection.decisions?.length || 0;
      tree.children!.push({
        id: 'decisions',
        name: `Decisions (${decisionsCount})`,
        type: 'section',
        data: { type: 'decisions', collection: compiledCollection.decisions, compiledCollection }
      });

      // Condition Sets section
      const conditionSetsCount = compiledCollection.conditionSets?.length || 0;
      tree.children!.push({
        id: 'condition-sets',
        name: `Condition Sets (${conditionSetsCount})`,
        type: 'section',
        data: { type: 'condition-sets', collection: compiledCollection.conditionSets, compiledCollection }
      });

      // Conditions section
      const conditionsCount = compiledCollection.conditions?.length || 0;
      tree.children!.push({
        id: 'conditions',
        name: `Conditions (${conditionsCount})`,
        type: 'section',
        data: { type: 'conditions', collection: compiledCollection.conditions, compiledCollection }
      });
    } catch (error) {
      onMessage?.('error', `Error building tree: ${error instanceof Error ? error.message : String(error)}`);
    }

    return tree;
  }, [
    activeProcessedResources?.compiledCollection,
    activeProcessedResources?.system.resourceManager,
    onMessage,
    isFilteringActive,
    useNormalization,
    resources?.isLoadedFromBundle,
    resources?.activeConfiguration
  ]);

  const handleExportCompiledData = useCallback(async () => {
    if (!activeProcessedResources?.compiledCollection) {
      onMessage?.('error', 'No compiled data available to export');
      return;
    }

    let compiledCollection = activeProcessedResources.compiledCollection;

    if (useNormalization && resources?.activeConfiguration) {
      try {
        const systemConfigResult = Config.SystemConfiguration.create(resources.activeConfiguration);
        if (systemConfigResult.isSuccess()) {
          const resourceManagerResult = Bundle.BundleNormalizer.normalize(
            activeProcessedResources.system.resourceManager,
            systemConfigResult.value
          );

          if (resourceManagerResult.isSuccess()) {
            const normalizedCompiledResult = resourceManagerResult.value.getCompiledResourceCollection({
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

    const compiledData = {
      ...compiledCollection,
      metadata: {
        exportedAt: new Date().toISOString(),
        type: isFilteringActive ? 'ts-res-filtered-compiled-collection' : 'ts-res-compiled-collection',
        normalized: useNormalization,
        ...(resources?.isLoadedFromBundle && { loadedFromBundle: true }),
        ...(isFilteringActive && { filterContext: filterState?.appliedValues })
      }
    };

    onExport?.(compiledData, 'json');
  }, [
    activeProcessedResources,
    onMessage,
    isFilteringActive,
    filterState?.appliedValues,
    useNormalization,
    resources,
    onExport
  ]);

  const handleExportBundle = useCallback(async () => {
    if (!activeProcessedResources?.system?.resourceManager || !resources?.activeConfiguration) {
      onMessage?.('error', 'No resource manager or configuration available to create bundle');
      return;
    }

    const systemConfigResult = Config.SystemConfiguration.create(resources.activeConfiguration);
    if (systemConfigResult.isFailure()) {
      onMessage?.('error', `Failed to create system configuration: ${systemConfigResult.message}`);
      return;
    }

    const systemConfig = systemConfigResult.value;

    const bundleParams: Bundle.IBundleCreateParams = {
      version: '1.0.0',
      description: isFilteringActive
        ? 'Bundle exported from ts-res-ui-components (filtered)'
        : 'Bundle exported from ts-res-ui-components',
      normalize: true
    };

    const bundleResult = Bundle.BundleBuilder.create(
      activeProcessedResources.system.resourceManager,
      systemConfig,
      bundleParams
    );

    if (bundleResult.isFailure()) {
      onMessage?.('error', `Failed to create bundle: ${bundleResult.message}`);
      return;
    }

    const bundle = bundleResult.value;

    const exportBundle = {
      ...bundle,
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedFrom: 'ts-res-ui-components',
        type: isFilteringActive ? 'ts-res-bundle-filtered' : 'ts-res-bundle',
        ...(isFilteringActive && { filterContext: filterState?.appliedValues })
      }
    };

    onExport?.(exportBundle, 'bundle');
  }, [
    activeProcessedResources?.system?.resourceManager,
    resources?.activeConfiguration,
    onMessage,
    isFilteringActive,
    filterState?.appliedValues,
    onExport
  ]);

  const handleNodeClick = (node: TreeNode) => {
    setSelectedNodeId(node.id);
    onMessage?.('info', `Selected: ${node.name}`);

    if (node.type === 'folder' || (node.type === 'section' && node.children)) {
      setExpandedNodes((prev) => {
        const newExpanded = new Set(prev);
        if (newExpanded.has(node.id)) {
          newExpanded.delete(node.id);
        } else {
          newExpanded.add(node.id);
        }
        return newExpanded;
      });
    }
  };

  const renderTreeNode = (node: TreeNode, level = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100 ${
            isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${8 + level * 16}px` }}
          onClick={() => handleNodeClick(node)}
        >
          {hasChildren && (
            <div className="w-4 h-4 mr-1 flex items-center justify-center">
              {isExpanded ? (
                <ChevronDownIcon className="w-3 h-3 text-gray-500" />
              ) : (
                <ChevronRightIcon className="w-3 h-3 text-gray-500" />
              )}
            </div>
          )}
          {!hasChildren && <div className="w-5 mr-1" />}

          <div className="w-4 h-4 mr-2 flex items-center justify-center">
            {node.type === 'folder' ? (
              isExpanded ? (
                <FolderOpenIcon className="w-4 h-4 text-blue-500" />
              ) : (
                <FolderIcon className="w-4 h-4 text-blue-500" />
              )
            ) : node.type === 'resource' ? (
              <DocumentTextIcon className="w-4 h-4 text-green-500" />
            ) : (
              <CubeIcon className="w-4 h-4 text-purple-500" />
            )}
          </div>

          <span className={`text-sm ${isSelected ? 'font-medium text-blue-900' : 'text-gray-700'}`}>
            {node.name}
          </span>
        </div>

        {hasChildren && isExpanded && (
          <div>{node.children!.map((child) => renderTreeNode(child, level + 1))}</div>
        )}
      </div>
    );
  };

  if (!resources) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-6">
          <CubeIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Compiled Resources</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No Compiled Resources</h3>
            <p className="text-gray-600 mb-6">
              Import resources to explore the compiled resource collection.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const selectedNode = selectedNodeId ? findNodeById(treeData!, selectedNodeId) : null;

  return (
    <div className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CubeIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Compiled Resources</h2>
          {isFilteringActive && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Filtered
            </span>
          )}
        </div>
        {activeProcessedResources && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCompiledData}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
              Export JSON
            </button>
            <button
              onClick={handleExportBundle}
              className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArchiveBoxIcon className="h-4 w-4 mr-1" />
              Export Bundle
            </button>
          </div>
        )}
      </div>

      {/* Controls Panel */}
      {activeProcessedResources && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Normalization Toggle */}
              <div className="flex items-center space-x-2">
                {resources?.isLoadedFromBundle ? (
                  <ArchiveBoxIcon className="h-4 w-4 text-blue-600" />
                ) : (
                  <CubeIcon className="h-4 w-4 text-gray-600" />
                )}
                <label className="text-sm font-medium text-gray-700">Normalize Output:</label>
                <button
                  onClick={() => setUseNormalization(!useNormalization)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    useNormalization ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      useNormalization ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-xs text-gray-500">{useNormalization ? 'ON' : 'OFF'}</span>
              </div>

              {/* JSON View Toggle */}
              <button
                onClick={() => setShowJsonView(!showJsonView)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <CodeBracketIcon className="h-4 w-4 mr-2" />
                {showJsonView ? 'Hide' : 'Show'} JSON
                {showJsonView ? (
                  <ChevronUpIcon className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 ml-2" />
                )}
              </button>
            </div>
          </div>

          {/* JSON View */}
          {showJsonView && (
            <div className="mt-4">
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <pre className="text-xs text-gray-800 bg-white p-3 rounded border overflow-x-auto max-h-64 overflow-y-auto">
                  {JSON.stringify(activeProcessedResources.compiledCollection, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
          {/* Tree Navigation */}
          <div className="lg:w-1/2 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compiled Collection</h3>
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
              {treeData && renderTreeNode(treeData)}
            </div>
          </div>

          {/* Details Panel */}
          <div className="lg:w-1/2 flex flex-col">
            {selectedNode ? (
              <NodeDetail
                node={selectedNode}
                getConditionKey={getConditionKey}
                getConditionSetKey={getConditionSetKey}
                getDecisionKey={getDecisionKey}
                formatDisplayName={formatDisplayName}
                getResourceTypeName={getResourceTypeName}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
                <div className="text-center">
                  <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select an item to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to find node by ID
const findNodeById = (tree: TreeNode, id: string): TreeNode | null => {
  if (tree.id === id) return tree;
  if (tree.children) {
    for (const child of tree.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
};

// Simplified NodeDetail component
interface NodeDetailProps {
  node: TreeNode;
  getConditionKey: Function;
  getConditionSetKey: Function;
  getDecisionKey: Function;
  formatDisplayName: Function;
  getResourceTypeName: Function;
}

const NodeDetail: React.FC<NodeDetailProps> = ({
  node,
  getConditionKey,
  getConditionSetKey,
  getDecisionKey,
  formatDisplayName,
  getResourceTypeName
}) => {
  const renderDetails = () => {
    if (!node.data) {
      return (
        <div className="p-4">
          <h4 className="font-medium text-gray-700 mb-2">Folder: {node.name}</h4>
          <p className="text-sm text-gray-600">
            {node.children ? `Contains ${node.children.length} items` : 'Empty folder'}
          </p>
        </div>
      );
    }

    const { type, collection, resource, compiledCollection } = node.data;

    // Simplified rendering logic - showing just basic info
    return (
      <div className="p-4">
        <h4 className="font-medium text-gray-700 mb-2">{node.name}</h4>
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-96 overflow-y-auto">
          {JSON.stringify(node.data, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
        {renderDetails()}
      </div>
    </div>
  );
};

export default CompiledView;
