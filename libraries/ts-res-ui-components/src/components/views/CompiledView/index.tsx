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
import { ResourcePicker } from '../../pickers/ResourcePicker';
import { ResourceSelection, ResourceAnnotations } from '../../pickers/ResourcePicker/types';

interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'resource' | 'section';
  children?: TreeNode[];
  data?: any;
}

/**
 * CompiledView component for browsing compiled resource collections and metadata.
 *
 * Provides an interface for exploring the compiled resource collection structure,
 * including resources, configuration metadata, qualifiers, and resource types.
 * Supports both filtered and unfiltered views with export functionality.
 *
 * **Key Features:**
 * - **Compiled structure browsing**: Navigate through compiled resource collections
 * - **Metadata exploration**: View system configuration, qualifiers, and resource types
 * - **Filter integration**: Works with filtered resource collections
 * - **Tree-based navigation**: Hierarchical view of resources and metadata
 * - **Export functionality**: Export compiled collections in various formats
 * - **Bundle support**: View and export as ts-res bundles for distribution
 *
 * @example
 * ```tsx
 * import { CompiledView } from '@fgv/ts-res-ui-components';
 *
 * function MyCompiledBrowser() {
 *   const handleExport = (format) => {
 *     console.log(`Exporting compiled resources as ${format}...`);
 *   };
 *
 *   return (
 *     <CompiledView
 *       resources={processedResources}
 *       filterState={filterState}
 *       filterResult={filterResult}
 *       useNormalization={true}
 *       onExport={handleExport}
 *       onMessage={(type, message) => console.log(`${type}: ${message}`)}
 *     />
 *   );
 * }
 * ```
 *
 * @public
 */
export const CompiledView: React.FC<CompiledViewProps> = ({
  resources,
  filterState,
  filterResult,
  useNormalization: useNormalizationProp = false,
  onExport,
  onMessage,
  pickerOptions,
  className = ''
}) => {
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [selectedMetadataSection, setSelectedMetadataSection] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['metadata']));
  const [showJsonView, setShowJsonView] = useState(false);
  const [useNormalization, setUseNormalization] = useState(useNormalizationProp);
  const [activeTab, setActiveTab] = useState<'resources' | 'metadata'>('resources');

  // Merge picker options with compiled view-specific defaults
  const effectivePickerOptions = useMemo(
    () => ({
      defaultView: 'tree' as const,
      showViewToggle: true,
      enableSearch: true,
      searchPlaceholder: 'Search compiled resources...',
      searchScope: 'all' as const,
      height: '500px',
      emptyMessage: 'No compiled resources available',
      // Override with user-provided options
      ...pickerOptions
    }),
    [pickerOptions]
  );

  // Update normalization default when bundle state changes
  useEffect(() => {
    if (resources?.isLoadedFromBundle && !useNormalization) {
      setUseNormalization(true);
    }
  }, [resources?.isLoadedFromBundle, useNormalization]);

  // Use filtered resources when filtering is active and successful
  const isFilteringActive = filterState?.enabled && filterResult?.success === true;
  const activeProcessedResources = isFilteringActive ? filterResult?.processedResources : resources;

  // Get the active compiled collection
  const activeCompiledCollection = useMemo(() => {
    return isFilteringActive
      ? filterResult?.processedResources?.compiledCollection
      : resources?.compiledCollection;
  }, [
    isFilteringActive,
    filterResult?.processedResources?.compiledCollection,
    resources?.compiledCollection
  ]);

  // Build metadata tree structure for non-resource sections
  const metadataTree = useMemo(() => {
    if (!activeCompiledCollection) {
      return null;
    }

    const tree: TreeNode = {
      id: 'metadata',
      name: 'Compiled Collection Metadata',
      type: 'folder',
      children: []
    };

    try {
      // Collectors section - showing from compiled collection
      tree.children!.push({
        id: 'qualifiers',
        name: `Qualifiers (${activeCompiledCollection.qualifiers?.length || 0})`,
        type: 'section',
        data: { type: 'qualifiers', items: activeCompiledCollection.qualifiers }
      });

      tree.children!.push({
        id: 'qualifier-types',
        name: `Qualifier Types (${activeCompiledCollection.qualifierTypes?.length || 0})`,
        type: 'section',
        data: { type: 'qualifier-types', items: activeCompiledCollection.qualifierTypes }
      });

      tree.children!.push({
        id: 'resource-types',
        name: `Resource Types (${activeCompiledCollection.resourceTypes?.length || 0})`,
        type: 'section',
        data: { type: 'resource-types', items: activeCompiledCollection.resourceTypes }
      });

      tree.children!.push({
        id: 'conditions',
        name: `Conditions (${activeCompiledCollection.conditions?.length || 0})`,
        type: 'section',
        data: { type: 'conditions', items: activeCompiledCollection.conditions }
      });

      tree.children!.push({
        id: 'condition-sets',
        name: `Condition Sets (${activeCompiledCollection.conditionSets?.length || 0})`,
        type: 'section',
        data: { type: 'condition-sets', items: activeCompiledCollection.conditionSets }
      });

      tree.children!.push({
        id: 'decisions',
        name: `Decisions (${activeCompiledCollection.decisions?.length || 0})`,
        type: 'section',
        data: { type: 'decisions', items: activeCompiledCollection.decisions }
      });
    } catch (error) {
      onMessage?.(
        'error',
        `Error building metadata tree: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return tree;
  }, [activeCompiledCollection, onMessage]);

  // Create resource annotations for compiled collection metadata
  const resourceAnnotations = useMemo(() => {
    const annotations: ResourceAnnotations = {};

    if (activeCompiledCollection?.resources) {
      activeCompiledCollection.resources.forEach((resource) => {
        const resourceId = String(resource.id);

        // Get compiled resource metadata
        const decision = activeCompiledCollection.decisions?.[resource.decision];
        const candidateCount = decision?.conditionSets?.length || 0;
        const resourceType = activeCompiledCollection.resourceTypes?.[resource.type];

        annotations[resourceId] = {
          suffix: `${candidateCount} candidate${candidateCount !== 1 ? 's' : ''}`,
          badge: resourceType
            ? {
                text: resourceType.name || 'unknown',
                variant: 'info'
              }
            : undefined
        };

        // Add indicator for resources with no candidates
        if (candidateCount === 0) {
          annotations[resourceId].indicator = {
            type: 'icon',
            value: '⚠️',
            tooltip: 'No candidates in compiled resource'
          };
        }
      });
    }

    return annotations;
  }, [activeCompiledCollection]);

  const handleExportCompiledData = useCallback(async () => {
    if (!activeProcessedResources?.compiledCollection) {
      onMessage?.('error', 'No compiled data available to export');
      return;
    }

    let compiledCollection = activeProcessedResources.compiledCollection;

    if (useNormalization && resources?.activeConfiguration) {
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
            } else {
              console.warn('Failed to get normalized compiled collection:', normalizedCompiledResult.message);
            }
          } else {
            console.warn('Failed to normalize bundle:', resourceManagerResult.message);
          }
        }
        // For IResourceManager from bundles, the compiled collection is already normalized
      } else {
        console.warn('Failed to create system configuration for normalization:', systemConfigResult.message);
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

  // Handle resource selection from ResourcePicker
  const handleResourceSelect = useCallback(
    (selection: ResourceSelection) => {
      setSelectedResourceId(selection.resourceId);
      setSelectedMetadataSection(null); // Clear metadata selection when resource is selected
      setActiveTab('resources');
      if (selection.resourceId) {
        onMessage?.('info', `Selected compiled resource: ${selection.resourceId}`);
      }
    },
    [onMessage]
  );

  // Handle metadata node selection
  const handleMetadataNodeClick = (node: TreeNode) => {
    setSelectedMetadataSection(node.id);
    setSelectedResourceId(null); // Clear resource selection when metadata is selected
    setActiveTab('metadata');
    onMessage?.('info', `Selected metadata: ${node.name}`);

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
    const isSelected = selectedMetadataSection === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100 ${
            isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${8 + level * 16}px` }}
          onClick={() => handleMetadataNodeClick(node)}
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

  // Get selected metadata node or resource data
  const selectedMetadataNode = selectedMetadataSection
    ? findNodeById(metadataTree!, selectedMetadataSection)
    : null;
  const selectedCompiledResource =
    selectedResourceId && activeCompiledCollection?.resources
      ? activeCompiledCollection.resources.find((r) => String(r.id) === selectedResourceId)
      : null;

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
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => {
                  setActiveTab('resources');
                  setSelectedMetadataSection(null);
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'resources'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>Resources ({activeCompiledCollection?.resources?.length || 0})</span>
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveTab('metadata');
                  setSelectedResourceId(null);
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'metadata'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CubeIcon className="h-4 w-4" />
                  <span>Collection Metadata</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
          {/* Resources or Metadata Navigation */}
          <div className="lg:w-1/2 flex flex-col">
            {activeTab === 'resources' ? (
              <>
                <div className="flex items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Compiled Resources</h3>
                </div>
                <div className="flex-1">
                  <ResourcePicker
                    resources={activeProcessedResources || null}
                    selectedResourceId={selectedResourceId}
                    onResourceSelect={handleResourceSelect}
                    resourceAnnotations={resourceAnnotations}
                    options={effectivePickerOptions}
                    onMessage={onMessage}
                  />
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Metadata</h3>
                <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
                  {metadataTree && renderTreeNode(metadataTree)}
                </div>
              </>
            )}
          </div>

          {/* Details Panel */}
          <div className="lg:w-1/2 flex flex-col">
            {activeTab === 'resources' && selectedResourceId ? (
              <CompiledResourceDetail
                resourceId={selectedResourceId}
                compiledResource={selectedCompiledResource}
                activeCompiledCollection={activeCompiledCollection}
                onMessage={onMessage}
              />
            ) : activeTab === 'metadata' && selectedMetadataNode ? (
              <NodeDetail node={selectedMetadataNode} activeCompiledCollection={activeCompiledCollection} />
            ) : (
              <div className="flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
                <div className="text-center">
                  <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {activeTab === 'resources'
                      ? 'Select a resource to view details'
                      : 'Select a metadata item to view details'}
                  </p>
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

// NodeDetail component with access to compiled collection
interface NodeDetailProps {
  node: TreeNode;
  activeCompiledCollection: ResourceJson.Compiled.ICompiledResourceCollection | null | undefined;
}

const NodeDetail: React.FC<NodeDetailProps> = ({ node, activeCompiledCollection }) => {
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

    const { type, resource, items } = node.data;

    switch (type) {
      case 'compiled-resource':
        return renderCompiledResource(resource);

      case 'qualifiers':
      case 'qualifier-types':
      case 'resource-types':
      case 'conditions':
      case 'condition-sets':
      case 'decisions':
        return renderCompiledCollection(type, items);

      default:
        return renderRawData();
    }
  };

  // Function that renders compiled resource data with indices
  const renderCompiledResource = (resource: any) => {
    if (!resource) {
      return (
        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-medium text-red-700 mb-2">Error Loading Resource</h4>
          <p className="text-sm text-red-600">Resource data not available</p>
        </div>
      );
    }

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
              <span className="text-gray-900">Index: {resource.type}</span>
            </div>

            <div className="flex items-start">
              <span className="font-semibold text-gray-700 w-32">Decision:</span>
              <span className="text-gray-900">
                <span className="font-mono">
                  Decision Index: {resource.decision} with {resource.candidates?.length || 0} candidates
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Candidates Section - Full candidate data from compiled collection */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Candidates ({resource.candidates?.length || 0})
          </h3>

          <div className="space-y-4">
            {resource.candidates &&
              resource.candidates.map((candidate: any, candidateIdx: number) => {
                // Get the condition set index for this candidate from the decision
                const compiledCollection = activeCompiledCollection;
                const decision = compiledCollection?.decisions?.[resource.decision];
                const conditionSetIndex = decision?.conditionSets?.[candidateIdx];
                const conditionSet =
                  conditionSetIndex !== undefined
                    ? compiledCollection?.conditionSets?.[conditionSetIndex]
                    : null;

                return (
                  <div key={candidateIdx} className="bg-white rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">
                        Candidate {candidateIdx}
                        {candidate.isPartial && (
                          <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                            Partial
                          </span>
                        )}
                      </h4>
                      {conditionSetIndex !== undefined && (
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          ConditionSet: {conditionSetIndex}
                        </span>
                      )}
                    </div>

                    {/* Candidate JSON Data - The actual resource content */}
                    {(candidate || typeof candidate === 'object') && (
                      <div className="bg-gray-50 rounded p-3 mb-3">
                        <h6 className="text-sm font-semibold text-gray-700 mb-2">Resource Content:</h6>
                        <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">
                          {JSON.stringify(candidate, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Conditions from the condition set */}
                    {conditionSet && conditionSet.conditions && conditionSet.conditions.length > 0 && (
                      <div className="border-t pt-3">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Conditions:</h5>
                        <div className="space-y-2">
                          {conditionSet.conditions.map((conditionIndex: number, idx: number) => {
                            const condition = compiledCollection?.conditions?.[conditionIndex];
                            if (!condition) return null;
                            const qualifier = compiledCollection?.qualifiers?.[condition.qualifierIndex];

                            return (
                              <div
                                key={idx}
                                className="flex items-center text-sm bg-blue-50 rounded px-3 py-2"
                              >
                                <span className="font-mono text-blue-700 mr-2 text-xs">
                                  [{conditionIndex}]
                                </span>
                                <span className="font-medium text-blue-900 mr-2">
                                  {qualifier?.name || `Q${condition.qualifierIndex}`}
                                </span>
                                <span className="text-blue-700 mr-2">{condition.operator || 'matches'}</span>
                                <span className="font-mono text-blue-800">{condition.value}</span>
                                <span className="ml-auto text-xs text-blue-600">
                                  Priority: {condition.priority || 0}
                                  {condition.scoreAsDefault !== undefined && (
                                    <span className="ml-2">Default: {condition.scoreAsDefault}</span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {(!conditionSet || !conditionSet.conditions || conditionSet.conditions.length === 0) && (
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

  // Function that renders compiled collection data
  const renderCompiledCollection = (collectionType: string, items: any[]) => {
    if (!items) {
      return (
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      );
    }

    let title: string;
    switch (collectionType) {
      case 'qualifiers':
        title = 'Qualifiers';
        break;
      case 'qualifier-types':
        title = 'Qualifier Types';
        break;
      case 'resource-types':
        title = 'Resource Types';
        break;
      case 'conditions':
        title = 'Conditions';
        break;
      case 'condition-sets':
        title = 'Condition Sets';
        break;
      case 'decisions':
        title = 'Decisions';
        break;
      default:
        title = collectionType;
    }

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
                      {getCompiledItemDisplayName(item, collectionType, index)}
                    </h4>
                    <p className="text-sm text-gray-600 font-mono mt-1">
                      {getCompiledItemDisplayKey(item, collectionType, index)}
                    </p>
                  </div>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono">
                    Index: {index}
                  </span>
                </div>

                <div className="border-t pt-3">{renderCompiledItemDetail(item, collectionType, index)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Helper functions for compiled object display
  const getCompiledItemDisplayName = (item: any, collectionType: string, index: number): string => {
    switch (collectionType) {
      case 'qualifiers':
        return `${index}: ${item?.name || 'unnamed'}`;
      case 'qualifier-types':
        return `${index}: ${item?.name || 'unnamed'}`;
      case 'resource-types':
        return `${index}: ${item?.name || item?.key || 'unnamed'}`;
      case 'conditions':
        const qualifier = activeCompiledCollection?.qualifiers?.[item?.qualifierIndex];
        return `${index}: ${qualifier?.name || `Q${item?.qualifierIndex}`} ${item?.operator || 'matches'} "${
          item?.value || ''
        }"`;
      case 'condition-sets':
        return `${index}: ${
          item?.conditions?.length === 0 || !item?.conditions
            ? 'Unconditional'
            : `${item.conditions.length} conditions`
        }`;
      case 'decisions':
        return `${index}: Decision with ${item?.conditionSets?.length || 0} condition sets`;
      default:
        return `${index}: Item ${index}`;
    }
  };

  const getCompiledItemDisplayKey = (item: any, collectionType: string, index: number): string => {
    try {
      switch (collectionType) {
        case 'qualifiers':
          return `type: ${item?.type || 'N/A'}, defaultPriority: ${item?.defaultPriority ?? 'N/A'}`;
        case 'qualifier-types':
          return `systemType: ${item?.systemType ?? 'N/A'}`;
        case 'resource-types':
          return `key: ${item?.key ?? 'N/A'}`;
        case 'conditions':
          return `priority: ${item?.priority ?? 0}`;
        case 'condition-sets':
          if (!item?.conditions || item.conditions.length === 0) return 'default';
          return `${item.conditions.length} condition${item.conditions.length !== 1 ? 's' : ''}`;
        case 'decisions':
          return `${item?.conditionSets?.length ?? 0} condition set${
            (item?.conditionSets?.length ?? 0) !== 1 ? 's' : ''
          }`;
        default:
          return '';
      }
    } catch (error) {
      console.warn('Error in getCompiledItemDisplayKey:', error, { item, collectionType, index });
      return 'Display error';
    }
  };

  const renderCompiledItemDetail = (item: any, collectionType: string, index: number) => {
    switch (collectionType) {
      case 'qualifiers':
        const qualifierType = activeCompiledCollection?.qualifierTypes?.[item?.type];
        return (
          <div className="space-y-2">
            <div>
              <span className="font-medium">Name:</span> {item?.name || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Type Index:</span> {item?.type ?? 'N/A'}
              {qualifierType && (
                <span className="ml-2 text-gray-600">({qualifierType.name || 'unnamed'})</span>
              )}
            </div>
            <div>
              <span className="font-medium">Default Priority:</span> {item?.defaultPriority ?? 'N/A'}
            </div>
            {item?.token && (
              <div>
                <span className="font-medium">Token:</span> {item.token}
              </div>
            )}
            {item?.defaultValue !== undefined && (
              <div>
                <span className="font-medium">Default Value:</span> {item.defaultValue}
              </div>
            )}
          </div>
        );
      case 'qualifier-types':
        return (
          <div className="space-y-2">
            <div>
              <span className="font-medium">Name:</span> {item?.name || 'N/A'}
            </div>
            <div>
              <span className="font-medium">System Type:</span> {item?.systemType || 'N/A'}
            </div>
            {item?.configuration && (
              <div>
                <span className="font-medium">Configuration:</span>
                <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(item.configuration, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );
      case 'resource-types':
        return (
          <div className="space-y-2">
            <div>
              <span className="font-medium">Name:</span> {item?.name || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Key:</span> {item?.key || 'N/A'}
            </div>
          </div>
        );
      case 'conditions':
        const qualifier = activeCompiledCollection?.qualifiers?.[item?.qualifierIndex];
        return (
          <div className="space-y-2">
            <div>
              <span className="font-medium">Qualifier Index:</span> {item?.qualifierIndex ?? 'N/A'}
              {qualifier && <span className="ml-2 text-gray-600">({qualifier.name || 'unnamed'})</span>}
            </div>
            <div>
              <span className="font-medium">Operator:</span> {item?.operator || 'matches'}
            </div>
            <div>
              <span className="font-medium">Value:</span> {item?.value || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Priority:</span> {item?.priority ?? 0}
            </div>
            {item?.scoreAsDefault !== undefined && (
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
              <span className="font-medium">Conditions:</span> {item?.conditions?.length ?? 0}
            </div>
            {item?.conditions && item.conditions.length > 0 && (
              <div className="space-y-1">
                <div className="font-medium text-sm">Condition Indices:</div>
                {item.conditions.map((conditionIndex: number, idx: number) => {
                  const condition = activeCompiledCollection?.conditions?.[conditionIndex];
                  const qualifier = condition
                    ? activeCompiledCollection?.qualifiers?.[condition.qualifierIndex]
                    : null;
                  return (
                    <div key={idx} className="text-xs bg-blue-50 rounded px-2 py-1">
                      [{conditionIndex}] {qualifier?.name || `Q${condition?.qualifierIndex}`}{' '}
                      {condition?.operator || 'matches'} "{condition?.value || ''}" (p:
                      {condition?.priority || 0})
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      case 'decisions':
        return (
          <div className="space-y-2">
            <div>
              <span className="font-medium">Condition Sets:</span> {item?.conditionSets?.length ?? 0}
            </div>
            {item?.conditionSets && item.conditionSets.length > 0 && (
              <div className="space-y-1">
                <div className="font-medium text-sm">Condition Set Indices:</div>
                <div className="flex flex-wrap gap-1">
                  {item.conditionSets.map((conditionSetIndex: number, idx: number) => (
                    <span key={idx} className="text-xs bg-green-50 text-green-800 px-2 py-1 rounded">
                      [{conditionSetIndex}]
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      default:
        return (
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
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

// CompiledResourceDetail component specifically for compiled resources
interface CompiledResourceDetailProps {
  resourceId: string;
  compiledResource: any;
  activeCompiledCollection: ResourceJson.Compiled.ICompiledResourceCollection | null | undefined;
  onMessage?: (type: 'info' | 'warning' | 'error' | 'success', message: string) => void;
}

const CompiledResourceDetail: React.FC<CompiledResourceDetailProps> = ({
  resourceId,
  compiledResource,
  activeCompiledCollection,
  onMessage
}) => {
  const [showRawJson, setShowRawJson] = useState(false);

  if (!compiledResource) {
    return (
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Details</h3>
        <div className="flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-red-50">
          <div className="text-center">
            <p className="text-red-600 font-medium mb-2">Resource Not Found</p>
            <p className="text-red-500 text-sm">Resource {resourceId} not found in compiled collection</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Compiled Resource Details</h3>
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
        >
          {showRawJson ? 'Rich View' : 'Raw JSON'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
        {showRawJson ? (
          <div className="bg-white rounded-lg border p-4">
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
              {JSON.stringify(compiledResource, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resource Details Header */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Compiled Resource Details</h3>

              <div className="bg-white rounded-lg border p-4 space-y-3">
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 w-32">ID:</span>
                  <span className="font-mono text-gray-900">{compiledResource.id}</span>
                </div>

                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 w-32">Resource Type:</span>
                  <span className="text-gray-900">Index: {compiledResource.type}</span>
                </div>

                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 w-32">Decision:</span>
                  <span className="text-gray-900">
                    <span className="font-mono">
                      Decision Index: {compiledResource.decision} with{' '}
                      {compiledResource.candidates?.length || 0} candidates
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Candidates Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Candidates ({compiledResource.candidates?.length || 0})
              </h3>

              <div className="space-y-4">
                {compiledResource.candidates &&
                  compiledResource.candidates.map((candidate: any, candidateIdx: number) => {
                    // Get the condition set index for this candidate from the decision
                    const decision = activeCompiledCollection?.decisions?.[compiledResource.decision];
                    const conditionSetIndex = decision?.conditionSets?.[candidateIdx];
                    const conditionSet =
                      conditionSetIndex !== undefined
                        ? activeCompiledCollection?.conditionSets?.[conditionSetIndex]
                        : null;

                    return (
                      <div key={candidateIdx} className="bg-white rounded-lg border p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">
                            Candidate {candidateIdx}
                            {candidate.isPartial && (
                              <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                Partial
                              </span>
                            )}
                          </h4>
                          {conditionSetIndex !== undefined && (
                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                              ConditionSet: {conditionSetIndex}
                            </span>
                          )}
                        </div>

                        {/* Candidate JSON Data */}
                        {(candidate || typeof candidate === 'object') && (
                          <div className="bg-gray-50 rounded p-3 mb-3">
                            <h6 className="text-sm font-semibold text-gray-700 mb-2">Resource Content:</h6>
                            <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">
                              {JSON.stringify(candidate, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Conditions from the condition set */}
                        {conditionSet && conditionSet.conditions && conditionSet.conditions.length > 0 && (
                          <div className="border-t pt-3">
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">Conditions:</h5>
                            <div className="space-y-2">
                              {conditionSet.conditions.map((conditionIndex: number, idx: number) => {
                                const condition = activeCompiledCollection?.conditions?.[conditionIndex];
                                if (!condition) return null;
                                const qualifier =
                                  activeCompiledCollection?.qualifiers?.[condition.qualifierIndex];

                                return (
                                  <div
                                    key={idx}
                                    className="flex items-center text-sm bg-blue-50 rounded px-3 py-2"
                                  >
                                    <span className="font-mono text-blue-700 mr-2 text-xs">
                                      [{conditionIndex}]
                                    </span>
                                    <span className="font-medium text-blue-900 mr-2">
                                      {qualifier?.name || `Q${condition.qualifierIndex}`}
                                    </span>
                                    <span className="text-blue-700 mr-2">
                                      {condition.operator || 'matches'}
                                    </span>
                                    <span className="font-mono text-blue-800">{condition.value}</span>
                                    <span className="ml-auto text-xs text-blue-600">
                                      Priority: {condition.priority || 0}
                                      {condition.scoreAsDefault !== undefined && (
                                        <span className="ml-2">Default: {condition.scoreAsDefault}</span>
                                      )}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {(!conditionSet ||
                          !conditionSet.conditions ||
                          conditionSet.conditions.length === 0) && (
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
        )}
      </div>
    </div>
  );
};

export default CompiledView;
