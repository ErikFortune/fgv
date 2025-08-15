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
import { UseResourceManagerReturn } from '../../hooks/useResourceManager';
import { Message, FilterState } from '../../types/app';
import { ResourceJson, NoMatch, Config, Bundle } from '@fgv/ts-res';

interface CompiledBrowserProps {
  onMessage?: (type: Message['type'], message: string) => void;
  resourceManager: UseResourceManagerReturn;
  filterState: FilterState;
  filterResult?: {
    success: boolean;
    processedResources?: {
      system: any;
      compiledCollection: any;
      summary: { resourceIds?: string[] };
    };
  } | null;
}

interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'resource' | 'section';
  children?: TreeNode[];
  data?: any;
}

const CompiledBrowser: React.FC<CompiledBrowserProps> = ({
  onMessage,
  resourceManager,
  filterState,
  filterResult
}) => {
  const { state: resourceState } = resourceManager;

  // Debug logging
  console.log('CompiledBrowser - resourceState.isLoadedFromBundle:', resourceState.isLoadedFromBundle);
  console.log('CompiledBrowser - resourceState.bundleMetadata:', resourceState.bundleMetadata);

  // Use filtered resources when filtering is active and successful
  const isFilteringActive = filterState.enabled && filterResult?.success === true;
  const activeProcessedResources = isFilteringActive
    ? filterResult?.processedResources
    : resourceState.processedResources;
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root', 'resources']));
  const [showJsonView, setShowJsonView] = useState(false);
  const [useNormalization, setUseNormalization] = useState(
    () =>
      // Default to ON when loaded from bundle, OFF otherwise
      resourceState.isLoadedFromBundle
  );

  // Update normalization default when bundle state changes
  useEffect(() => {
    if (resourceState.isLoadedFromBundle && !useNormalization) {
      setUseNormalization(true);
    }
  }, [resourceState.isLoadedFromBundle, useNormalization]);

  // Helper functions to resolve indices to meaningful keys
  const getConditionKey = (
    condition: ResourceJson.Compiled.ICompiledCondition,
    compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection
  ): string => {
    try {
      // Use metadata if available
      if (condition.metadata?.key) {
        return condition.metadata.key;
      }

      // Fall back to manual construction
      const qualifier = compiledCollection.qualifiers[condition.qualifierIndex];
      if (!qualifier) return `unknown-qualifier`;

      // Create a meaningful key like "language=en-US" or "territory=US"
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
      // Use metadata if available
      if (conditionSet.metadata?.key) {
        return conditionSet.metadata.key;
      }

      if (conditionSetIndex === 0) {
        return 'unconditional';
      }

      // Fall back to manual construction
      if (!conditionSet.conditions || conditionSet.conditions.length === 0) {
        return `condition-set-${conditionSetIndex}`;
      }

      // Build a composite key from all conditions in the set
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
      // Use metadata if available
      if (decision.metadata?.key) {
        return decision.metadata.key;
      }

      // Fall back to manual construction
      if (!decision.conditionSets || decision.conditionSets.length === 0) {
        return `decision-${decisionIndex}`;
      }

      // Build a composite key from all condition sets in the decision
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

  // Helper function to format display name as "key (index)" or just "index"
  const formatDisplayName = (key: string, index: number): string => {
    // If key looks like it's just "condition-X", "condition-set-X", or "decision-X", just show the index
    if (key.match(/^(condition|condition-set|decision)-\d+$/)) {
      return `${index}`;
    }
    return `${key} (${index})`;
  };

  // Helper function to get condition set key for a candidate
  const getCandidateConditionSetKey = (
    candidateIndex: number,
    resource: ResourceJson.Compiled.ICompiledResource,
    compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection
  ): string | null => {
    try {
      // Get the decision for this resource
      const decision = compiledCollection.decisions[resource.decision];
      if (!decision || !decision.conditionSets) {
        return null;
      }

      // Map candidate index to condition set index
      // Assuming candidates correspond to condition sets in order
      if (candidateIndex >= decision.conditionSets.length) {
        return null;
      }

      const conditionSetIndex = decision.conditionSets[candidateIndex];
      const conditionSet = compiledCollection.conditionSets[conditionSetIndex];
      if (!conditionSet) {
        return null;
      }

      return getConditionSetKey(conditionSet, conditionSetIndex, compiledCollection);
    } catch (error) {
      return null;
    }
  };

  // Helper function to get resource type name
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
    if (useNormalization && resourceState.activeConfiguration) {
      try {
        // Create a ResourceManagerBuilder from the current data
        const resourceManagerResult = Bundle.BundleNormalizer.normalize(
          activeProcessedResources.system.resourceManager,
          resourceState.activeConfiguration
        );

        if (resourceManagerResult.isSuccess()) {
          const normalizedCompiledResult = resourceManagerResult.value.getCompiledResourceCollection({
            includeMetadata: true
          });
          if (normalizedCompiledResult.isSuccess()) {
            compiledCollection = normalizedCompiledResult.value;
          }
        }
      } catch (error) {
        console.warn('Failed to normalize compiled collection:', error);
        // Fall back to original collection
      }
    }

    const tree: TreeNode = {
      id: 'root',
      name: 'Compiled Resources',
      type: 'folder',
      children: []
    };

    try {
      // 1. Resources section
      const resourcesCount = compiledCollection.resources?.length || 0;
      const resourcesSection: TreeNode = {
        id: 'resources',
        name: `Resources (${resourcesCount})`,
        type: 'section',
        children: []
      };

      // Build simple resource list from compiled resources
      if (compiledCollection.resources && compiledCollection.resources.length > 0) {
        resourcesSection.children = compiledCollection.resources.map((resource, index) => ({
          id: `resource-${index}`,
          name: resource.id || `Resource ${index}`,
          type: 'resource' as const,
          data: { type: 'compiled-resource', resource }
        }));
      }

      tree.children!.push(resourcesSection);

      // 2. Decisions section
      const decisionsCount = compiledCollection.decisions?.length || 0;
      const decisionsSection: TreeNode = {
        id: 'decisions',
        name: `Decisions (${decisionsCount})`,
        type: 'section',
        data: { type: 'decisions', collection: compiledCollection.decisions }
      };
      tree.children!.push(decisionsSection);

      // 3. Condition Sets section
      const conditionSetsCount = compiledCollection.conditionSets?.length || 0;
      const conditionSetsSection: TreeNode = {
        id: 'condition-sets',
        name: `Condition Sets (${conditionSetsCount})`,
        type: 'section',
        data: { type: 'condition-sets', collection: compiledCollection.conditionSets }
      };
      tree.children!.push(conditionSetsSection);

      // 4. Conditions section
      const conditionsCount = compiledCollection.conditions?.length || 0;
      const conditionsSection: TreeNode = {
        id: 'conditions',
        name: `Conditions (${conditionsCount})`,
        type: 'section',
        data: { type: 'conditions', collection: compiledCollection.conditions }
      };
      tree.children!.push(conditionsSection);
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
    resourceState.isLoadedFromBundle,
    resourceState.activeConfiguration
  ]);

  // Export compiled collection to JSON file
  const handleExportCompiledData = useCallback(async () => {
    try {
      if (!activeProcessedResources?.compiledCollection) {
        onMessage?.('error', 'No compiled data available to export');
        return;
      }

      // Get the current compiled collection (potentially normalized)
      let compiledCollection = activeProcessedResources.compiledCollection;

      // Apply normalization if enabled
      if (useNormalization && resourceState.activeConfiguration) {
        try {
          const resourceManagerResult = Bundle.BundleNormalizer.normalize(
            activeProcessedResources.system.resourceManager,
            resourceState.activeConfiguration
          );

          if (resourceManagerResult.isSuccess()) {
            const normalizedCompiledResult = resourceManagerResult.value.getCompiledResourceCollection({
              includeMetadata: true
            });
            if (normalizedCompiledResult.isSuccess()) {
              compiledCollection = normalizedCompiledResult.value;
            }
          }
        } catch (error) {
          console.warn('Failed to normalize for export:', error);
          // Fall back to original collection
        }
      }

      const compiledData = {
        ...compiledCollection,
        metadata: {
          exportedAt: new Date().toISOString(),
          type: isFilteringActive ? 'ts-res-filtered-compiled-collection' : 'ts-res-compiled-collection',
          normalized: useNormalization,
          ...(resourceState.isLoadedFromBundle && { loadedFromBundle: true }),
          ...(isFilteringActive && { filterContext: filterState.appliedValues })
        }
      };

      const compiledJson = JSON.stringify(compiledData, null, 2);

      // Try to use File System Access API for modern browsers
      if ('showSaveFilePicker' in window) {
        try {
          const suggestedName = isFilteringActive
            ? 'filtered-compiled-collection.json'
            : 'compiled-collection.json';
          const fileHandle = await window.showSaveFilePicker({
            suggestedName,
            types: [
              {
                description: 'JSON files',
                accept: {
                  'application/json': ['.json']
                }
              }
            ]
          });

          const writable = await fileHandle.createWritable();
          await writable.write(compiledJson);
          await writable.close();

          onMessage?.(
            'success',
            `${isFilteringActive ? 'Filtered c' : 'C'}ompiled collection saved successfully`
          );
        } catch (saveError) {
          // User cancelled the dialog or other error
          if ((saveError as Error).name !== 'AbortError') {
            throw saveError;
          }
        }
      } else {
        // Fallback for browsers without File System Access API
        const blob = new Blob([compiledJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = isFilteringActive ? 'filtered-compiled-collection.json' : 'compiled-collection.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        onMessage?.(
          'success',
          `${isFilteringActive ? 'Filtered c' : 'C'}ompiled collection downloaded successfully`
        );
      }
    } catch (error) {
      onMessage?.(
        'error',
        `Failed to export compiled data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }, [
    activeProcessedResources?.compiledCollection,
    activeProcessedResources?.system.resourceManager,
    onMessage,
    isFilteringActive,
    filterState.appliedValues,
    useNormalization,
    resourceState.isLoadedFromBundle,
    resourceState.activeConfiguration
  ]);

  // Export bundle with metadata, config, and compiled collection
  const handleExportBundle = useCallback(async () => {
    try {
      if (!activeProcessedResources?.system?.resourceManager || !resourceState.activeConfiguration) {
        onMessage?.('error', 'No resource manager or configuration available to create bundle');
        return;
      }

      // Create SystemConfiguration from the active configuration
      const systemConfigResult = Config.SystemConfiguration.create(resourceState.activeConfiguration);
      if (systemConfigResult.isFailure()) {
        onMessage?.('error', `Failed to create system configuration: ${systemConfigResult.message}`);
        return;
      }

      const systemConfig = systemConfigResult.value;

      // Create bundle parameters
      const bundleParams: Bundle.IBundleCreateParams = {
        version: '1.0.0',
        description: isFilteringActive
          ? 'Bundle exported from ts-res-browser (filtered)'
          : 'Bundle exported from ts-res-browser',
        normalize: true // Use order-resilient normalization for consistent output
      };

      // Create the bundle
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

      // Add export metadata
      const exportBundle = {
        ...bundle,
        exportMetadata: {
          exportedAt: new Date().toISOString(),
          exportedFrom: 'ts-res-browser',
          type: isFilteringActive ? 'ts-res-bundle-filtered' : 'ts-res-bundle',
          ...(isFilteringActive && { filterContext: filterState.appliedValues })
        }
      };

      const bundleJson = JSON.stringify(exportBundle, null, 2);

      // Try to use File System Access API for modern browsers
      if ('showSaveFilePicker' in window) {
        try {
          const suggestedName = isFilteringActive ? 'filtered-resource-bundle.json' : 'resource-bundle.json';
          const fileHandle = await window.showSaveFilePicker({
            suggestedName,
            types: [
              {
                description: 'JSON files',
                accept: {
                  'application/json': ['.json']
                }
              }
            ]
          });

          const writable = await fileHandle.createWritable();
          await writable.write(bundleJson);
          await writable.close();

          onMessage?.(
            'success',
            `${isFilteringActive ? 'Filtered r' : 'R'}esource bundle saved successfully`
          );
        } catch (saveError) {
          // User cancelled the dialog or other error
          if ((saveError as Error).name !== 'AbortError') {
            throw saveError;
          }
        }
      } else {
        // Fallback for browsers without File System Access API
        const blob = new Blob([bundleJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = isFilteringActive ? 'filtered-resource-bundle.json' : 'resource-bundle.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        onMessage?.(
          'success',
          `${isFilteringActive ? 'Filtered r' : 'R'}esource bundle downloaded successfully`
        );
      }
    } catch (error) {
      onMessage?.(
        'error',
        `Failed to export bundle: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }, [
    activeProcessedResources?.system?.resourceManager,
    resourceState.activeConfiguration,
    onMessage,
    isFilteringActive,
    filterState.appliedValues
  ]);

  const handleNodeClick = (node: TreeNode) => {
    setSelectedNodeId(node.id);
    onMessage?.('info', `Selected: ${node.name}`);

    // Toggle expansion for folders
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

  if (!resourceState.processedResources) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <CubeIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Compiled Browser</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No Compiled Resources</h3>
            <p className="text-gray-600 mb-6">
              Import resources to explore the compiled resource collection.
            </p>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Use the Import Tool to load resources, then return here to browse the
                compiled collection structure including resources, decisions, condition sets, and conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!treeData) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <CubeIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Compiled Browser</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Error Loading Compiled Resources</h3>
            <p className="text-gray-600">Unable to load the compiled resource collection.</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedNode = selectedNodeId ? findNodeById(treeData, selectedNodeId) : null;

  return (
    <div className="p-6">
      {/* DEPRECATION WARNING */}
      <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <CubeIcon className="h-6 w-6 text-red-600 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-red-800 mb-1">⚠️ DEPRECATED COMPONENT</h3>
            <p className="text-red-700 text-sm">
              This local CompiledBrowser component is <strong>obsolete and not used</strong>. The application
              uses the shared
              <code className="bg-red-100 px-1 rounded mx-1">CompiledView</code> component from
              <code className="bg-red-100 px-1 rounded ml-1">@fgv/ts-res-ui-components</code> instead.
            </p>
            <p className="text-red-600 text-xs mt-1">
              <strong>Do not edit this file!</strong> Edit the shared component in the ui-components library
              instead.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CubeIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Compiled Browser</h2>
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
              {/* Normalization Toggle - Always available */}
              <div className="flex items-center space-x-2">
                {resourceState.isLoadedFromBundle ? (
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
                {resourceState.isLoadedFromBundle && (
                  <span className="text-xs text-blue-600 font-medium">Bundle</span>
                )}
              </div>

              {/* JSON View Toggle */}
              <button
                onClick={() => setShowJsonView(!showJsonView)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <CodeBracketIcon className="h-4 w-4 mr-2" />
                {showJsonView ? 'Hide' : 'Show'} JSON Compiled Collection
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
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Compiled Collection (JSON)</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleExportCompiledData}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <DocumentArrowDownIcon className="h-3 w-3 mr-1" />
                      Export JSON
                    </button>
                    <button
                      onClick={handleExportBundle}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <ArchiveBoxIcon className="h-3 w-3 mr-1" />
                      Export Bundle
                    </button>
                  </div>
                </div>
                <pre className="text-xs text-gray-800 bg-white p-3 rounded border overflow-x-auto max-h-64 overflow-y-auto">
                  {JSON.stringify(
                    {
                      ...activeProcessedResources.compiledCollection,
                      metadata: {
                        exportedAt: new Date().toISOString(),
                        type: isFilteringActive
                          ? 'ts-res-filtered-compiled-collection'
                          : 'ts-res-compiled-collection',
                        ...(isFilteringActive && { filterContext: filterState.appliedValues })
                      }
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
          {/* Left side: Tree Navigation */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="flex items-center space-x-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Compiled Collection</h3>
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
              {renderTreeNode(treeData)}
            </div>
          </div>

          {/* Right side: Details Panel */}
          <div className="lg:w-1/2 flex flex-col">
            {selectedNode ? (
              <NodeDetail
                node={selectedNode}
                onMessage={onMessage}
                resourceState={resourceState}
                activeProcessedResources={activeProcessedResources}
                isFilteringActive={isFilteringActive}
                getConditionKey={getConditionKey}
                getConditionSetKey={getConditionSetKey}
                getDecisionKey={getDecisionKey}
                formatDisplayName={formatDisplayName}
                getCandidateConditionSetKey={getCandidateConditionSetKey}
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

// Node detail component
interface NodeDetailProps {
  node: TreeNode;
  onMessage?: (type: Message['type'], message: string) => void;
  resourceState: any; // UseResourceManagerReturn['state']
  activeProcessedResources: any;
  isFilteringActive: boolean;
  getConditionKey: (
    condition: ResourceJson.Compiled.ICompiledCondition,
    compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection
  ) => string;
  getConditionSetKey: (
    conditionSet: ResourceJson.Compiled.ICompiledConditionSet,
    conditionSetIndex: number,
    compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection
  ) => string;
  getDecisionKey: (
    decision: ResourceJson.Compiled.ICompiledAbstractDecision,
    decisionIndex: number,
    compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection
  ) => string;
  formatDisplayName: (key: string, index: number) => string;
  getCandidateConditionSetKey: (
    candidateIndex: number,
    resource: ResourceJson.Compiled.ICompiledResource,
    compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection
  ) => string | null;
  getResourceTypeName: (
    resourceTypeIndex: number,
    compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection
  ) => string;
}

const NodeDetail: React.FC<NodeDetailProps> = ({
  node,
  onMessage,
  resourceState,
  activeProcessedResources,
  isFilteringActive,
  getConditionKey,
  getConditionSetKey,
  getDecisionKey,
  formatDisplayName,
  getCandidateConditionSetKey,
  getResourceTypeName
}) => {
  const renderNodeDetails = () => {
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

    const { type, collection, resource } = node.data;

    switch (type) {
      case 'compiled-resource':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Compiled Resource Details</h4>
              <div className="bg-white p-3 rounded border space-y-2 text-sm">
                <div>
                  <strong>ID:</strong> {resource?.id || 'Unknown'}
                </div>
                <div>
                  <strong>Resource Type:</strong>{' '}
                  {(() => {
                    const resourceTypeIndex = resource?.type;
                    if (resourceTypeIndex === undefined) return 'Unknown';
                    const resourceTypeName = getResourceTypeName(
                      resourceTypeIndex,
                      activeProcessedResources!.compiledCollection
                    );
                    return formatDisplayName(resourceTypeName, resourceTypeIndex);
                  })()}
                </div>
                <div>
                  <strong>Decision:</strong>{' '}
                  {(() => {
                    const decisionIndex = resource?.decision;
                    if (decisionIndex === undefined) return 'Unknown';
                    const decision = activeProcessedResources!.compiledCollection.decisions[decisionIndex];
                    if (!decision) return `${decisionIndex}`;
                    const decisionKey = getDecisionKey(
                      decision,
                      decisionIndex,
                      activeProcessedResources!.compiledCollection
                    );
                    return formatDisplayName(decisionKey, decisionIndex);
                  })()}
                </div>
              </div>
            </div>

            {resource?.candidates && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Candidates</h4>
                <div className="space-y-2">
                  {resource.candidates.map((candidateItem: any, index: number) => {
                    const conditionSetKey = getCandidateConditionSetKey(
                      index,
                      resource,
                      activeProcessedResources!.compiledCollection
                    );

                    return (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="text-sm">
                          <strong>
                            Candidate {index + 1}
                            {conditionSetKey && ` (${conditionSetKey})`}
                          </strong>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {typeof candidateItem === 'object' && candidateItem ? (
                            <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-x-auto">
                              {JSON.stringify(candidateItem, null, 2)}
                            </pre>
                          ) : (
                            <div>Candidate Index: {candidateItem}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );

      case 'resource':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Resource Details</h4>
              <div className="bg-white p-3 rounded border space-y-2 text-sm">
                <div>
                  <strong>ID:</strong> {resource?.id || 'Unknown'}
                </div>
                <div>
                  <strong>Type:</strong> {resource?.resourceType?.key || 'Unknown'}
                </div>
                <div>
                  <strong>Candidates:</strong> {resource?.candidates?.length || 0}
                </div>
              </div>
            </div>

            {resource?.candidates && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Candidates</h4>
                <div className="space-y-2">
                  {resource.candidates.map((candidate: any, index: number) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="text-sm">
                        <strong>Candidate {index + 1}</strong>
                        {candidate.isPartial && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1 rounded">
                            Partial
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {candidate.mergeMethod && (
                          <div>
                            <strong>Merge Method:</strong> {candidate.mergeMethod}
                          </div>
                        )}
                      </div>
                      {candidate.json && (
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-x-auto max-h-32">
                          {JSON.stringify(candidate.json, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'decisions':
        return (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Decisions Collection</h4>
            <div className="bg-white p-3 rounded border text-sm">
              <div>
                <strong>Count:</strong> {collection?.length || 0}
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Decisions contain the logic for selecting resource candidates based on condition sets.
              </div>
            </div>
            {collection && collection.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-700 mb-2">Decision Details</h5>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {collection.map(
                    (decision: ResourceJson.Compiled.ICompiledAbstractDecision, index: number) => {
                      const decisionKey = getDecisionKey(
                        decision,
                        index,
                        activeProcessedResources!.compiledCollection
                      );
                      return (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="text-sm">
                            <strong>Decision {formatDisplayName(decisionKey, index)}</strong>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Condition Sets: {decision.conditionSets?.length || 0}
                          </div>
                          {decision.conditionSets && decision.conditionSets.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium text-gray-700 mb-1">
                                Referenced Condition Sets:
                              </div>
                              <div className="space-y-1">
                                {decision.conditionSets.map((conditionSetIndex, idx) => {
                                  const conditionSet =
                                    activeProcessedResources!.compiledCollection.conditionSets[
                                      conditionSetIndex
                                    ];
                                  if (!conditionSet)
                                    return <div key={idx}>Unknown condition set {conditionSetIndex}</div>;
                                  const conditionSetKey = getConditionSetKey(
                                    conditionSet,
                                    conditionSetIndex,
                                    activeProcessedResources!.compiledCollection
                                  );
                                  return (
                                    <div key={idx} className="text-xs bg-gray-50 p-1 rounded">
                                      [{formatDisplayName(conditionSetKey, conditionSetIndex)}]
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'condition-sets':
        return (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Condition Sets Collection</h4>
            <div className="bg-white p-3 rounded border text-sm">
              <div>
                <strong>Count:</strong> {collection?.length || 0}
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Condition sets group related conditions together for decision making.
              </div>
            </div>
            {collection && collection.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-700 mb-2">Condition Set Details</h5>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {collection.map(
                    (conditionSet: ResourceJson.Compiled.ICompiledConditionSet, index: number) => {
                      const conditionSetKey = getConditionSetKey(
                        conditionSet,
                        index,
                        activeProcessedResources!.compiledCollection
                      );
                      return (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="text-sm">
                            <strong>Condition Set {formatDisplayName(conditionSetKey, index)}</strong>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Conditions: {conditionSet.conditions?.length || 0}
                          </div>
                          {conditionSet.conditions && conditionSet.conditions.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium text-gray-700 mb-1">
                                Referenced Conditions:
                              </div>
                              <div className="space-y-1">
                                {conditionSet.conditions.map((conditionIndex, idx) => {
                                  const condition =
                                    activeProcessedResources!.compiledCollection.conditions[conditionIndex];
                                  if (!condition)
                                    return <div key={idx}>Unknown condition {conditionIndex}</div>;
                                  const conditionKey = getConditionKey(
                                    condition,
                                    activeProcessedResources!.compiledCollection
                                  );
                                  return (
                                    <div key={idx} className="text-xs bg-gray-50 p-1 rounded">
                                      [{formatDisplayName(conditionKey, conditionIndex)}]
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'conditions':
        return (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Conditions Collection</h4>
            <div className="bg-white p-3 rounded border text-sm">
              <div>
                <strong>Count:</strong> {collection?.length || 0}
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Individual conditions that test qualifier values for resource selection.
              </div>
            </div>
            {collection && collection.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-700 mb-2">Condition Details</h5>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {collection.map((condition: ResourceJson.Compiled.ICompiledCondition, index: number) => {
                    const conditionKey = getConditionKey(
                      condition,
                      activeProcessedResources!.compiledCollection
                    );
                    return (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="text-sm">
                          <strong>Condition {formatDisplayName(conditionKey, index)}</strong>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          <div>Qualifier Index: {condition.qualifierIndex}</div>
                          <div>Value: {condition.value}</div>
                          <div>Priority: {condition.priority}</div>
                          {condition.operator && <div>Operator: {condition.operator}</div>}
                          {condition.scoreAsDefault !== undefined && (
                            <div>
                              <span className="text-xs font-medium text-amber-700">
                                Score as Default: {condition.scoreAsDefault}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="p-4">
            <h4 className="font-medium text-gray-700 mb-2">{node.name}</h4>
            <p className="text-sm text-gray-600">Unknown node type</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Details</h3>
      </div>

      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
        {renderNodeDetails()}
      </div>
    </div>
  );
};

export default CompiledBrowser;
