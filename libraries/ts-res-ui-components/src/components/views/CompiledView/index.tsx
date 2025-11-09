import React, { useState, useMemo, useCallback, useEffect, ReactElement } from 'react';
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
import { ICompiledViewProps, JsonValue } from '../../../types';
import { ResourceJson, Config, Bundle, Resources } from '@fgv/ts-res';
import { Hash } from '@fgv/ts-utils';
import { ResourcePicker } from '../../pickers/ResourcePicker';
import {
  IResourceSelection,
  IResourceAnnotations,
  IResourcePickerOptions
} from '../../pickers/ResourcePicker/types';
import { ResourcePickerOptionsControl } from '../../common/ResourcePickerOptionsControl';
import { useSmartObservability } from '../../../hooks/useSmartObservability';

// Helper function to find node by ID - using function declaration for hoisting
function findNodeById(tree: ITreeNode, id: string): ITreeNode | null {
  if (tree.id === id) return tree;
  if (tree.children) {
    for (const child of tree.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
}

// Helper functions for compiled object display - using function declarations
function getCompiledItemDisplayName(
  data: TreeNodeData,
  index: number,
  activeCompiledCollection: ResourceJson.Compiled.ICompiledResourceCollection | null | undefined
): string {
  switch (data.type) {
    case 'qualifiers':
      return `${index}: ${data.items[index].name}`;
    case 'qualifier-types':
      return `${index}: ${data.items[index].name}`;
    case 'resource-types':
      return `${index}: ${data.items[index].name}`;
    case 'conditions':
      const qualifier = activeCompiledCollection?.qualifiers?.[data.items[index].qualifierIndex];
      return `${index}: ${qualifier?.name || `Q${data.items[index].qualifierIndex}`} ${String(
        data.items[index].operator || 'matches'
      )} "${data.items[index].value}"`;
    case 'condition-sets':
      return `${index}: ${
        data.items[index].conditions.length === 0 || !data.items[index].conditions
          ? 'Unconditional'
          : `${data.items[index].conditions?.length || 0} conditions`
      }`;
    case 'decisions':
      return `${index}: Decision with ${data.items[index].conditionSets.length} condition sets`;
    case 'candidate-values':
      try {
        const normalizer = new Hash.Crc32Normalizer();
        const hashResult = normalizer.computeHash(data.items[index]);
        const jsonStr = JSON.stringify(data.items[index]);
        if (hashResult.isSuccess()) {
          return `${index}: ${typeof data.items[index]}, ${jsonStr.length} chars (CRC32: ${String(
            hashResult.value
          )})`;
        } else {
          return `${index}: ${typeof data.items[index]}, ${jsonStr.length} chars`;
        }
      } catch (error) {
        return `${index}: ${typeof data.items[index]}, size unknown`;
      }
    default:
      return `${index}: Item ${index}`;
  }
}

function getCompiledItemDisplayKey(data: TreeNodeData, index: number): string {
  switch (data.type) {
    case 'qualifiers':
      return `type: ${String(data.items[index].type || 'N/A')}, defaultPriority: ${
        data.items[index].defaultPriority
      }`;
    case 'qualifier-types':
      return `systemType: ${data.items[index].name}`;
    case 'resource-types':
      return `key: ${data.items[index].name}`;
    case 'conditions':
      return `priority: ${data.items[index].priority}`;
    case 'condition-sets':
      if (!data.items[index].conditions || data.items[index].conditions.length === 0) return 'default';
      return `${data.items[index].conditions.length} condition${
        data.items[index].conditions.length !== 1 ? 's' : ''
      }`;
    case 'decisions':
      return `${data.items[index].conditionSets.length} condition set${
        data.items[index].conditionSets.length !== 1 ? 's' : ''
      }`;
    case 'candidate-values':
      return ''; // All info now in main header
    default:
      return '';
  }
}

function renderCompiledItemDetail(
  data: TreeNodeData,
  index: number,
  activeCompiledCollection: ResourceJson.Compiled.ICompiledResourceCollection | null | undefined
): ReactElement {
  switch (data.type) {
    case 'qualifiers':
      const qualifierType = activeCompiledCollection?.qualifierTypes?.[data.items[index].type];
      return (
        <div className="space-y-2">
          <div>
            <span className="font-medium">Name:</span> {data.items[index].name}
          </div>
          <div>
            <span className="font-medium">Type Index:</span> {data.items[index].type}
            {qualifierType && <span className="ml-2 text-gray-600">({qualifierType.name || 'unnamed'})</span>}
          </div>
          <div>
            <span className="font-medium">Default Priority:</span> {data.items[index].defaultPriority}
          </div>
        </div>
      );
    case 'qualifier-types':
      return (
        <div className="space-y-2">
          <div>
            <span className="font-medium">Name:</span> {data.items[index].name}
          </div>
          <div>
            <span className="font-medium">System Type:</span> {data.items[index].name}
          </div>
        </div>
      );
    case 'resource-types':
      return (
        <div className="space-y-2">
          <div>
            <span className="font-medium">Name:</span> {data.items[index].name}
          </div>
        </div>
      );
    case 'conditions':
      const qualifier = activeCompiledCollection?.qualifiers?.[data.items[index].qualifierIndex];
      return (
        <div className="space-y-2">
          <div>
            <span className="font-medium">Qualifier Index:</span> {data.items[index].qualifierIndex}
            {qualifier && <span className="ml-2 text-gray-600">({qualifier.name || 'unnamed'})</span>}
          </div>
          <div>
            <span className="font-medium">Operator:</span> {data.items[index].operator}
          </div>
          <div>
            <span className="font-medium">Value:</span> {data.items[index].value}
          </div>
          <div>
            <span className="font-medium">Priority:</span> {data.items[index].priority}
          </div>
          {data.items[index].scoreAsDefault !== undefined && (
            <div>
              <span className="font-medium">Score As Default:</span> {data.items[index].scoreAsDefault}
            </div>
          )}
        </div>
      );
    case 'condition-sets':
      return (
        <div className="space-y-2">
          <div>
            <span className="font-medium">Conditions:</span> {data.items[index].conditions.length}
          </div>
          {
            (data.items[index].conditions &&
              Array.isArray(data.items[index].conditions) &&
              data.items[index].conditions.length > 0 && (
                <div className="space-y-1">
                  <div className="font-medium text-sm">Condition Indices:</div>
                  {data.items[index].conditions.map((conditionIndex: number, idx: number) => {
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
              )) as React.ReactNode
          }
        </div>
      );
    case 'decisions':
      return (
        <div className="space-y-2">
          <div>
            <span className="font-medium">Condition Sets:</span> {data.items[index].conditionSets.length}
          </div>
          {
            (data.items[index].conditionSets &&
              Array.isArray(data.items[index].conditionSets) &&
              data.items[index].conditionSets.length > 0 && (
                <div className="space-y-1">
                  <div className="font-medium text-sm">Condition Set Indices:</div>
                  <div className="flex flex-wrap gap-1">
                    {data.items[index].conditionSets.map((conditionSetIndex: number, idx: number) => (
                      <span key={idx} className="text-xs bg-green-50 text-green-800 px-2 py-1 rounded">
                        [{conditionSetIndex}]
                      </span>
                    ))}
                  </div>
                </div>
              )) as React.ReactNode
          }
        </div>
      );
    case 'candidate-values':
      return (
        <div className="bg-gray-50 rounded p-3">
          <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">
            {JSON.stringify(data.items[index], null, 2)}
          </pre>
        </div>
      );
    default:
      return (
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
  }
}

interface ITreeNodeCompiledResourceData {
  type: 'compiled-resource';
  resource: ResourceJson.Compiled.ICompiledResource;
}

interface ITreeNodeQualifiersData {
  type: 'qualifiers';
  items: ReadonlyArray<ResourceJson.Compiled.ICompiledQualifier>;
}

interface ITreeNodeQualifierTypesData {
  type: 'qualifier-types';
  items: ReadonlyArray<ResourceJson.Compiled.ICompiledQualifierType>;
}

interface ITreeNodeResourceTypesData {
  type: 'resource-types';
  items: ReadonlyArray<ResourceJson.Compiled.ICompiledResourceType>;
}

interface ITreeNodeConditionsData {
  type: 'conditions';
  items: ReadonlyArray<ResourceJson.Compiled.ICompiledCondition>;
}

interface ITreeNodeConditionSetsData {
  type: 'condition-sets';
  items: ReadonlyArray<ResourceJson.Compiled.ICompiledConditionSet>;
}

interface ITreeNodeDecisionsData {
  type: 'decisions';
  items: ReadonlyArray<ResourceJson.Compiled.ICompiledAbstractDecision>;
}

interface ITreeNodeCandidateValuesData {
  type: 'candidate-values';
  items: ReadonlyArray<JsonValue>;
}

export type TreeNodeData =
  | ITreeNodeCompiledResourceData
  | ITreeNodeQualifiersData
  | ITreeNodeQualifierTypesData
  | ITreeNodeResourceTypesData
  | ITreeNodeConditionsData
  | ITreeNodeConditionSetsData
  | ITreeNodeDecisionsData
  | ITreeNodeCandidateValuesData;

interface ITreeNode {
  id: string;
  name: string;
  type: 'folder' | 'resource' | 'section';
  children?: ITreeNode[];
  data?: TreeNodeData;
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
 *     />
 *   );
 * }
 * ```
 *
 * @public
 */
export const CompiledView: React.FC<ICompiledViewProps> = ({
  resources,
  filterState,
  filterResult,
  useNormalization: useNormalizationProp = false,
  onExport,
  pickerOptions,
  pickerOptionsPanelPresentation = 'hidden',
  className = ''
}) => {
  const o11y = useSmartObservability();
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [selectedMetadataSection, setSelectedMetadataSection] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['metadata']));
  const [showJsonView, setShowJsonView] = useState(false);
  const [useNormalization, setUseNormalization] = useState(useNormalizationProp);

  // State for picker options control
  const [currentPickerOptions, setCurrentPickerOptions] = useState<IResourcePickerOptions>(
    (pickerOptions ?? {}) as IResourcePickerOptions
  );
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
      ...pickerOptions,
      // Override with current picker options from control
      ...currentPickerOptions
    }),
    [pickerOptions, currentPickerOptions]
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

    const tree: ITreeNode = {
      id: 'metadata',
      name: 'Compiled Collection Metadata',
      type: 'folder',
      children: []
    };

    try {
      // Collectors section - showing from compiled collection
      tree.children!.push({
        id: 'qualifiers',
        name: `Qualifiers (${activeCompiledCollection.qualifiers?.length ?? 0})`,
        type: 'section',
        data: { type: 'qualifiers', items: activeCompiledCollection.qualifiers }
      });

      tree.children!.push({
        id: 'qualifier-types',
        name: `Qualifier Types (${activeCompiledCollection.qualifierTypes?.length ?? 0})`,
        type: 'section',
        data: { type: 'qualifier-types', items: activeCompiledCollection.qualifierTypes }
      });

      tree.children!.push({
        id: 'resource-types',
        name: `Resource Types (${activeCompiledCollection.resourceTypes?.length ?? 0})`,
        type: 'section',
        data: { type: 'resource-types', items: activeCompiledCollection.resourceTypes }
      });

      tree.children!.push({
        id: 'conditions',
        name: `Conditions (${activeCompiledCollection.conditions?.length ?? 0})`,
        type: 'section',
        data: { type: 'conditions', items: activeCompiledCollection.conditions }
      });

      tree.children!.push({
        id: 'condition-sets',
        name: `Condition Sets (${activeCompiledCollection.conditionSets?.length ?? 0})`,
        type: 'section',
        data: { type: 'condition-sets', items: activeCompiledCollection.conditionSets }
      });

      tree.children!.push({
        id: 'decisions',
        name: `Decisions (${activeCompiledCollection.decisions?.length ?? 0})`,
        type: 'section',
        data: { type: 'decisions', items: activeCompiledCollection.decisions }
      });

      tree.children!.push({
        id: 'candidate-values',
        name: `Candidate Values (${activeCompiledCollection.candidateValues?.length ?? 0})`,
        type: 'section',
        data: { type: 'candidate-values', items: activeCompiledCollection.candidateValues }
      });
    } catch (error) {
      o11y.user.info(
        'error',
        `Error building metadata tree: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return tree;
  }, [activeCompiledCollection, o11y]);

  // Create resource annotations for compiled collection metadata
  const resourceAnnotations = useMemo(() => {
    const annotations: IResourceAnnotations = {};

    if (activeCompiledCollection?.resources) {
      activeCompiledCollection.resources.forEach((resource) => {
        const resourceId = String(resource.id);

        // Get compiled resource metadata
        const decision = activeCompiledCollection.decisions?.[resource.decision];
        const candidateCount = decision?.conditionSets?.length ?? 0;
        const resourceType = activeCompiledCollection.resourceTypes?.[resource.type];

        annotations[resourceId] = {
          suffix: `${candidateCount} candidate${candidateCount !== 1 ? 's' : ''}`,
          badge: resourceType
            ? {
                text: resourceType.name ?? 'unknown',
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
      o11y.user.error('No compiled data available to export');
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
              o11y.diag.warn(
                'Failed to get normalized compiled collection:',
                normalizedCompiledResult.message
              );
            }
          } else {
            o11y.diag.warn('Failed to normalize bundle:', resourceManagerResult.message);
          }
        }
        // For IResourceManager from bundles, the compiled collection is already normalized
      } else {
        o11y.diag.warn(
          'Failed to create system configuration for normalization:',
          systemConfigResult.message
        );
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
    o11y,
    isFilteringActive,
    filterState?.appliedValues,
    useNormalization,
    resources,
    onExport
  ]);

  const handleExportBundle = useCallback(async () => {
    if (!activeProcessedResources?.system?.resourceManager || !resources?.activeConfiguration) {
      o11y.user.error('No resource manager or configuration available to create bundle');
      return;
    }

    const systemConfigResult = Config.SystemConfiguration.create(resources.activeConfiguration);
    if (systemConfigResult.isFailure()) {
      o11y.user.error(`Failed to create system configuration: ${systemConfigResult.message}`);
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
      o11y.user.error('Bundle export is not supported for resources loaded from bundles');
      return;
    }

    const bundleResult = Bundle.BundleBuilder.create(
      activeProcessedResources.system.resourceManager as Resources.ResourceManagerBuilder,
      systemConfig,
      bundleParams
    );

    if (bundleResult.isFailure()) {
      o11y.user.error(`Failed to create bundle: ${bundleResult.message}`);
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
    o11y,
    isFilteringActive,
    filterState?.appliedValues,
    onExport
  ]);

  // Handle resource selection from ResourcePicker
  const handleResourceSelect = useCallback(
    (selection: IResourceSelection) => {
      setSelectedResourceId(selection.resourceId);
      setSelectedMetadataSection(null); // Clear metadata selection when resource is selected
      setActiveTab('resources');
      if (selection.resourceId) {
        o11y.user.info(`Selected compiled resource: ${selection.resourceId}`);
      }
    },
    [o11y]
  );

  // Handle metadata node selection
  const handleMetadataNodeClick = (node: ITreeNode): void => {
    setSelectedMetadataSection(node.id);
    setSelectedResourceId(null); // Clear resource selection when metadata is selected
    setActiveTab('metadata');
    o11y.user.info(`Selected metadata: ${node.name}`);

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

  const renderTreeNode = (node: ITreeNode, level = 0): React.ReactNode => {
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

      {/* ResourcePicker Options Control */}
      <ResourcePickerOptionsControl
        options={currentPickerOptions}
        onOptionsChange={setCurrentPickerOptions}
        presentation={pickerOptionsPanelPresentation}
        title="Compiled View Picker Options"
        className="mb-6"
      />

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

// NodeDetail component with access to compiled collection
interface INodeDetailProps {
  node: ITreeNode;
  activeCompiledCollection: ResourceJson.Compiled.ICompiledResourceCollection | null | undefined;
}

function NodeDetail({ node, activeCompiledCollection }: INodeDetailProps): React.ReactElement {
  const [showRawJson, setShowRawJson] = useState(false);

  // Function that renders raw JSON data - using function declaration for hoisting
  function renderRawData(): ReactElement {
    return (
      <div className="bg-white rounded-lg border p-4">
        <h4 className="font-medium text-gray-700 mb-2">{node.name}</h4>
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-96 overflow-y-auto">
          {JSON.stringify(node.data, null, 2)}
        </pre>
      </div>
    );
  }

  // Function that renders compiled resource data with indices - using function declaration for hoisting
  function renderCompiledResource(resource: ResourceJson.Compiled.ICompiledResource): ReactElement {
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
                  Decision Index: {resource.decision} with {resource.candidates?.length ?? 0} candidates
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Candidates Section - Full candidate data from compiled collection */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Candidates ({resource.candidates?.length ?? 0})
          </h3>

          <div className="space-y-4">
            {
              resource.candidates?.map(
                (candidate: ResourceJson.Compiled.ICompiledCandidate, candidateIdx: number) => {
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
                          {
                            (candidate.isPartial && (
                              <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                Partial
                              </span>
                            )) as React.ReactNode
                          }
                        </h4>
                        {conditionSetIndex !== undefined && (
                          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                            ConditionSet: {conditionSetIndex}
                          </span>
                        )}
                      </div>

                      {/* Candidate Value Index and JSON Data */}
                      <div className="space-y-3 mb-3">
                        {/* Show Value Index */}
                        {candidate.valueIndex !== undefined && (
                          <div className="bg-blue-50 rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h6 className="text-sm font-semibold text-blue-700">
                                Candidate Value Reference:
                              </h6>
                              <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Index: {candidate.valueIndex}
                              </span>
                            </div>
                            <div className="text-xs text-blue-600">
                              This candidate references candidateValues[{candidate.valueIndex}] from the
                              compiled collection
                            </div>
                          </div>
                        )}

                        {/* Show Actual JSON Content */}
                        {!!candidate && (
                          <div className="bg-gray-50 rounded p-3">
                            <h6 className="text-sm font-semibold text-gray-700 mb-2">
                              {candidate.valueIndex !== undefined
                                ? 'Resolved Resource Content:'
                                : 'Resource Content:'}
                            </h6>
                            <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">
                              {JSON.stringify(candidate, null, 2)}
                            </pre>
                            {candidate.valueIndex !== undefined &&
                              activeCompiledCollection?.candidateValues && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <div className="text-xs text-gray-600 mb-1">
                                    From candidateValues array:
                                  </div>
                                  <pre className="text-xs font-mono text-gray-700 bg-white p-2 rounded border overflow-x-auto max-h-32 overflow-y-auto">
                                    {JSON.stringify(
                                      activeCompiledCollection.candidateValues[candidate.valueIndex],
                                      null,
                                      2
                                    )}
                                  </pre>
                                </div>
                              )}
                          </div>
                        )}
                      </div>

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
                }
              ) as React.ReactNode
            }
          </div>
        </div>
      </div>
    );
  }

  // Function that renders compiled collection data - using function declaration for hoisting
  function renderCompiledCollectionData(data: TreeNodeData): ReactElement {
    if (data.type === 'compiled-resource' || !data.items) {
      return (
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      );
    }

    let title: string;
    switch (data.type) {
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
      case 'candidate-values':
        title = 'Candidate Values';
        break;
    }

    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {title} <span className="text-sm font-normal text-gray-600">({data.items.length})</span>
        </h3>

        {data.items.length === 0 ? (
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">No {title.toLowerCase()} available</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.items.map((item: unknown, index: number) => (
              <div key={index} className="bg-white rounded-lg border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {getCompiledItemDisplayName(data, index, activeCompiledCollection)}
                    </h4>
                    <p className="text-sm text-gray-600 font-mono mt-1">
                      {getCompiledItemDisplayKey(data, index)}
                    </p>
                  </div>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono">
                    Index: {index}
                  </span>
                </div>
                <div className="border-t pt-3">
                  {renderCompiledItemDetail(data, index, activeCompiledCollection)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const renderDetails = (): React.ReactElement => {
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

    if (!node.data || typeof node.data !== 'object') {
      return renderRawData();
    }

    const data = node.data;

    switch (data.type) {
      case 'compiled-resource':
        return renderCompiledResource(data.resource);

      case 'qualifiers':
      case 'qualifier-types':
      case 'resource-types':
      case 'conditions':
      case 'condition-sets':
      case 'decisions':
      case 'candidate-values':
        return renderCompiledCollectionData(data);

      default:
        return renderRawData();
    }
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
}

// CompiledResourceDetail component specifically for compiled resources
interface ICompiledResourceDetailProps {
  resourceId: string;
  compiledResource?: ResourceJson.Compiled.ICompiledResource | null;
  activeCompiledCollection: ResourceJson.Compiled.ICompiledResourceCollection | null | undefined;
}

function CompiledResourceDetail({
  resourceId,
  compiledResource,
  activeCompiledCollection
}: ICompiledResourceDetailProps): React.ReactElement {
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
                      {compiledResource.candidates?.length ?? 0} candidates
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Candidates Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Candidates ({compiledResource.candidates?.length ?? 0})
              </h3>

              <div className="space-y-4">
                {compiledResource.candidates &&
                  compiledResource.candidates.map(
                    (candidate: ResourceJson.Compiled.ICompiledCandidate, candidateIdx: number) => {
                      // Get the condition set index for this candidate from the decision
                      const decisionIndex = compiledResource.decision;
                      const decision = activeCompiledCollection?.decisions?.[decisionIndex];
                      const conditionSetIndex = decision?.conditionSets?.[candidateIdx];
                      const conditionSet =
                        conditionSetIndex !== undefined
                          ? activeCompiledCollection?.conditionSets?.[conditionSetIndex]
                          : null;

                      return (
                        <div key={candidateIdx} className="bg-white rounded-lg border p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900">Candidate {candidateIdx}</h4>
                            {conditionSetIndex !== undefined && (
                              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                ConditionSet: {conditionSetIndex}
                              </span>
                            )}
                          </div>

                          {/* Candidate metadata banner */}
                          {(candidate.isPartial || candidate.mergeMethod) && (
                            <div className="mb-3 flex items-center gap-2 text-xs">
                              {candidate.isPartial && (
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                  Partial
                                </span>
                              )}
                              {candidate.mergeMethod && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  Merge: {candidate.mergeMethod}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Resource Value */}
                          <div className="mb-3">
                            <div className="text-xs text-gray-600 mb-1">
                              Value
                              {candidate.valueIndex !== undefined
                                ? ` (candidateValues[${candidate.valueIndex}])`
                                : ''}
                              :
                            </div>
                            <pre className="text-xs font-mono text-gray-700 bg-white p-2 rounded border overflow-x-auto max-h-32 overflow-y-auto">
                              {typeof candidate.valueIndex === 'number' &&
                              activeCompiledCollection?.candidateValues
                                ? JSON.stringify(
                                    activeCompiledCollection.candidateValues[candidate.valueIndex],
                                    null,
                                    2
                                  )
                                : JSON.stringify(candidate, null, 2)}
                            </pre>
                          </div>

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
                    }
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CompiledView;
