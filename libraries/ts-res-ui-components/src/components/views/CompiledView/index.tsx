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
import { ResourceJson, Config, Bundle, Resources } from '@fgv/ts-res';

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

  // Get the active CompiledResourceCollection manager
  const activeCompiledManager = useMemo(() => {
    return isFilteringActive
      ? filterResult?.processedResources?.compiledResourceCollectionManager
      : resources?.compiledResourceCollectionManager;
  }, [
    isFilteringActive,
    filterResult?.processedResources?.compiledResourceCollectionManager,
    resources?.compiledResourceCollectionManager
  ]);

  // Build tree structure using the CompiledResourceCollection manager
  const treeData = useMemo(() => {
    if (!activeCompiledManager) {
      return null;
    }

    const tree: TreeNode = {
      id: 'root',
      name: 'Compiled Resources',
      type: 'folder',
      children: []
    };

    try {
      // Resources section using the runtime manager
      const resourcesCount = activeCompiledManager.numResources;
      const resourcesSection: TreeNode = {
        id: 'resources',
        name: `Resources (${resourcesCount})`,
        type: 'section',
        children: []
      };

      // Get all resource IDs from the manager
      const resourceIds = Array.from(activeCompiledManager.builtResources.keys());
      if (resourceIds.length > 0) {
        resourcesSection.children = resourceIds.map((resourceId) => ({
          id: `resource-${resourceId}`,
          name: resourceId,
          type: 'resource' as const,
          data: { type: 'runtime-resource', resourceId, manager: activeCompiledManager }
        }));
      }

      tree.children!.push(resourcesSection);

      // Collectors section - showing the runtime objects
      tree.children!.push({
        id: 'qualifiers',
        name: `Qualifiers (${activeCompiledManager.qualifiers.size})`,
        type: 'section',
        data: { type: 'qualifiers', manager: activeCompiledManager }
      });

      tree.children!.push({
        id: 'qualifier-types',
        name: `Qualifier Types (${activeCompiledManager.qualifierTypes.size})`,
        type: 'section',
        data: { type: 'qualifier-types', manager: activeCompiledManager }
      });

      tree.children!.push({
        id: 'resource-types',
        name: `Resource Types (${activeCompiledManager.resourceTypes.size})`,
        type: 'section',
        data: { type: 'resource-types', manager: activeCompiledManager }
      });

      tree.children!.push({
        id: 'conditions',
        name: `Conditions (${activeCompiledManager.conditions.size})`,
        type: 'section',
        data: { type: 'conditions', manager: activeCompiledManager }
      });

      tree.children!.push({
        id: 'condition-sets',
        name: `Condition Sets (${activeCompiledManager.conditionSets.size})`,
        type: 'section',
        data: { type: 'condition-sets', manager: activeCompiledManager }
      });

      tree.children!.push({
        id: 'decisions',
        name: `Decisions (${activeCompiledManager.decisions.size})`,
        type: 'section',
        data: { type: 'decisions', manager: activeCompiledManager }
      });
    } catch (error) {
      onMessage?.('error', `Error building tree: ${error instanceof Error ? error.message : String(error)}`);
    }

    return tree;
  }, [activeCompiledManager, onMessage]);

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
          // Check if we have a ResourceManagerBuilder (which supports normalization)
          if ('getCompiledResourceCollection' in activeProcessedResources.system.resourceManager) {
            const resourceManagerResult = Bundle.BundleNormalizer.normalize(
              activeProcessedResources.system.resourceManager as Resources.ResourceManagerBuilder,
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
          // For IResourceManager from bundles, the compiled collection is already normalized
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

    // Check if we have a ResourceManagerBuilder (which supports bundle creation)
    if (!('getCompiledResourceCollection' in activeProcessedResources.system.resourceManager)) {
      onMessage?.('error', 'Bundle export is not supported for resources loaded from bundles');
      return;
    }

    const bundleResult = Bundle.BundleBuilder.create(
      activeProcessedResources.system.resourceManager as Resources.ResourceManagerBuilder,
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
              <NodeDetail node={selectedNode} />
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

// Runtime-powered NodeDetail component
interface NodeDetailProps {
  node: TreeNode;
}

const NodeDetail: React.FC<NodeDetailProps> = ({ node }) => {
  const [showRawJson, setShowRawJson] = useState(false);

  const renderDetails = () => {
    if (!node.data) {
      return (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <h4 className="font-medium text-gray-700 mb-2">📁 {node.name}</h4>
            <p className="text-sm text-gray-600">
              {node.children ? `Contains ${node.children.length} items` : 'Empty folder'}
            </p>
          </div>
        </div>
      );
    }

    const { type, resourceId, manager } = node.data;

    switch (type) {
      case 'runtime-resource':
        return renderRuntimeResource(resourceId, manager);

      case 'qualifiers':
      case 'qualifier-types':
      case 'resource-types':
      case 'conditions':
      case 'condition-sets':
      case 'decisions':
        return renderRuntimeCollection(type, manager);

      default:
        return renderRawData();
    }
  };

  // New function that uses runtime objects instead of manual JSON manipulation
  const renderRuntimeResource = (resourceId: string, manager: any) => {
    // Get the full runtime resource object with all its rich data
    const resourceResult = manager.getBuiltResource(resourceId);

    if (resourceResult.isFailure()) {
      return (
        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-medium text-red-700 mb-2">Error Loading Resource</h4>
          <p className="text-sm text-red-600">{resourceResult.message}</p>
        </div>
      );
    }

    const resource = resourceResult.value;

    return (
      <div className="space-y-6">
        {/* Resource Details Header */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compiled Resource Details</h3>

          <div className="bg-white rounded-lg border p-4 space-y-3">
            <div className="flex items-start">
              <span className="font-semibold text-gray-700 w-32">ID:</span>
              <span className="font-mono text-gray-900">{resource.id}</span>
            </div>

            <div className="flex items-start">
              <span className="font-semibold text-gray-700 w-32">Resource Type:</span>
              <span className="text-gray-900">
                {resource.resourceType.name || resource.resourceType.key}
                <span className="ml-2 text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                  ({resource.resourceType.index})
                </span>
              </span>
            </div>

            <div className="flex items-start">
              <span className="font-semibold text-gray-700 w-32">Decision:</span>
              <span className="text-gray-900">
                <span className="font-mono">
                  Decision {resource.decision.baseDecision?.index ?? resource.decision.index ?? 'unknown'}{' '}
                  with {resource.decision.candidates.length} candidates
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Candidates Section - Now with full candidate data including bodies! */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidates</h3>

          <div className="space-y-4">
            {resource.candidates.map((candidate: any, candidateIdx: number) => {
              // Get the corresponding decision candidate to access condition sets
              const decisionCandidate = resource.decision.candidates[candidateIdx];

              return (
                <div key={candidateIdx} className="bg-white rounded-lg border p-4">
                  <div className="mb-3">
                    <h4 className="font-semibold text-gray-900">
                      Candidate {candidateIdx + 1}
                      {candidate.isPartial && (
                        <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                          Partial
                        </span>
                      )}
                    </h4>
                  </div>

                  {/* Candidate JSON Data - This is the actual resource content! */}
                  <div className="bg-gray-50 rounded p-3 mb-3">
                    <h6 className="text-sm font-semibold text-gray-700 mb-2">Resource Content:</h6>
                    <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
                      {JSON.stringify(candidate.json, null, 2)}
                    </pre>
                  </div>

                  {/* Conditions from the condition set */}
                  {decisionCandidate?.conditionSet &&
                    decisionCandidate.conditionSet.conditions.length > 0 && (
                      <div className="border-t pt-3">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">
                          Condition Set {decisionCandidate.conditionSet.index}:
                        </h5>
                        <div className="space-y-2">
                          {decisionCandidate.conditionSet.conditions.map((condition: any, idx: number) => (
                            <div key={idx} className="flex items-center text-sm bg-blue-50 rounded px-3 py-2">
                              <span className="font-mono text-blue-700 mr-2 text-xs">
                                {condition.index.toString().padStart(2, '0')}:
                              </span>
                              <span className="font-medium text-blue-900 mr-2">
                                {condition.qualifier.name}
                              </span>
                              <span className="text-blue-700 mr-2">{condition.operator}</span>
                              <span className="font-mono text-blue-800">{condition.value}</span>
                              <span className="ml-auto text-xs text-blue-600">
                                Priority: {condition.priority}
                                {condition.scoreAsDefault !== undefined && (
                                  <span className="ml-2">Default: {condition.scoreAsDefault}</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {(!decisionCandidate?.conditionSet ||
                    decisionCandidate.conditionSet.conditions.length === 0) && (
                    <div className="border-t pt-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        No conditions (default candidate)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // New function that uses runtime collections instead of raw JSON
  const renderRuntimeCollection = (collectionType: string, manager: any) => {
    let collector: any;
    let title: string;

    switch (collectionType) {
      case 'qualifiers':
        collector = manager.qualifiers;
        title = 'Qualifiers';
        break;
      case 'qualifier-types':
        collector = manager.qualifierTypes;
        title = 'Qualifier Types';
        break;
      case 'resource-types':
        collector = manager.resourceTypes;
        title = 'Resource Types';
        break;
      case 'conditions':
        collector = manager.conditions;
        title = 'Conditions';
        break;
      case 'condition-sets':
        collector = manager.conditionSets;
        title = 'Condition Sets';
        break;
      case 'decisions':
        collector = manager.decisions;
        title = 'Decisions';
        break;
      default:
        return (
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">Unknown collection type: {collectionType}</p>
          </div>
        );
    }

    const items = Array.from(collector.values());

    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {title} <span className="text-sm font-normal text-gray-600">({items.length})</span>
        </h3>

        {items.length === 0 ? (
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">No {title.toLowerCase()} available</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {items.map((item: any, index: number) => (
              <div key={index} className="bg-white rounded-lg border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {getItemDisplayName(item, collectionType, index)}
                    </h4>
                    <p className="text-sm text-gray-600 font-mono mt-1">
                      {getItemDisplayKey(item, collectionType)}
                    </p>
                  </div>
                  {item.index !== undefined && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono">
                      Index: {item.index}
                    </span>
                  )}
                </div>

                <div className="border-t pt-3">{renderRuntimeItemDetail(item, collectionType)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Helper functions for runtime object display
  const getItemDisplayName = (item: any, collectionType: string, index: number): string => {
    switch (collectionType) {
      case 'qualifiers':
        return `${item.index}: ${item.name} (${item.type.name})`;
      case 'qualifier-types':
        return `${item.index}: ${item.name} (${item.systemType})`;
      case 'resource-types':
        return `${item.index}: ${item.name || item.key}`;
      case 'conditions':
        return `${item.index.toString().padStart(2, '0')}: ${item.qualifier.name} ${item.operator} ${
          item.value
        }`;
      case 'condition-sets':
        return `${item.index}: ${
          item.conditions.length === 0 ? 'Unconditional' : `${item.conditions.length} conditions`
        }`;
      case 'decisions':
        return `${item.baseDecision?.index ?? item.index}: Decision with ${
          item.candidates.length
        } candidates`;
      default:
        return `${index}: Item ${index}`;
    }
  };

  const getItemDisplayKey = (item: any, collectionType: string): string => {
    switch (collectionType) {
      case 'qualifiers':
        return `defaultPriority: ${item.defaultPriority}`;
      case 'qualifier-types':
        return `allowContextList: ${item.allowContextList}`;
      case 'resource-types':
        return `key: ${item.key}`;
      case 'conditions':
        return `priority: ${item.priority}`;
      case 'condition-sets':
        return item.conditions?.map((c: any) => `${c.qualifier.name}=${c.value}`).join(', ') || 'default';
      case 'decisions':
        return `${item.conditionSets?.length ?? 0} condition sets`;
      default:
        return '';
    }
  };

  const renderRuntimeItemDetail = (item: any, collectionType: string) => {
    switch (collectionType) {
      case 'qualifiers':
        return (
          <div className="space-y-2">
            <div>
              <span className="font-medium">Type:</span> {item.type.name}
            </div>
            <div>
              <span className="font-medium">Default Priority:</span> {item.defaultPriority}
            </div>
          </div>
        );
      case 'qualifier-types':
        return (
          <div className="space-y-2">
            <div>
              <span className="font-medium">System Type:</span> {item.systemType}
            </div>
            <div>
              <span className="font-medium">Allow Context List:</span> {item.allowContextList ? 'Yes' : 'No'}
            </div>
            {item.enumeratedValues && (
              <div>
                <span className="font-medium">Enumerated Values:</span> {item.enumeratedValues.join(', ')}
              </div>
            )}
          </div>
        );
      case 'resource-types':
        return (
          <div className="space-y-2">
            <div>
              <span className="font-medium">Key:</span> {item.key}
            </div>
            <div>
              <span className="font-medium">Name:</span> {item.name}
            </div>
          </div>
        );
      case 'conditions':
        return (
          <div className="space-y-2">
            <div>
              <span className="font-medium">Qualifier:</span> {item.qualifier.name}
            </div>
            <div>
              <span className="font-medium">Operator:</span> {item.operator}
            </div>
            <div>
              <span className="font-medium">Value:</span> {item.value}
            </div>
            <div>
              <span className="font-medium">Priority:</span> {item.priority}
            </div>
            {item.scoreAsDefault !== undefined && (
              <div>
                <span className="font-medium">Score As Default:</span> {item.scoreAsDefault}
              </div>
            )}
          </div>
        );
      case 'condition-sets':
        return (
          <div className="space-y-2">
            <div>
              <span className="font-medium">Conditions:</span> {item.conditions?.length ?? 0}
            </div>
            {(item.conditions?.length ?? 0) > 0 && (
              <div className="space-y-1">
                {item.conditions?.map((condition: any, idx: number) => (
                  <div key={idx} className="text-xs bg-blue-50 rounded px-2 py-1">
                    {condition.qualifier.name} {condition.operator} {condition.value} (p:{condition.priority})
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'decisions':
        return (
          <div className="space-y-2">
            <div>
              <span className="font-medium">Condition Sets:</span> {item.conditionSets?.length ?? 0}
            </div>
            <div>
              <span className="font-medium">Candidates:</span> {item.candidates?.length ?? 0}
            </div>
          </div>
        );
      default:
        return (
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
            {JSON.stringify(item, null, 2)}
          </pre>
        );
    }
  };

  const renderRawData = () => {
    return (
      <div className="bg-white rounded-lg border p-4">
        <h4 className="font-medium text-gray-700 mb-2">{node.name}</h4>
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-96 overflow-y-auto">
          {JSON.stringify(node.data, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Details</h3>
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
        >
          {showRawJson ? 'Rich View' : 'Raw JSON'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {showRawJson ? (
          <div className="bg-white rounded-lg border p-4">
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
              {JSON.stringify(node.data, null, 2)}
            </pre>
          </div>
        ) : (
          renderDetails()
        )}
      </div>
    </div>
  );
};

export default CompiledView;
