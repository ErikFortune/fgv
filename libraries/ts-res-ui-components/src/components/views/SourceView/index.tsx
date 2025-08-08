import React, { useState, useMemo, useCallback } from 'react';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  CodeBracketIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ListBulletIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import { SourceViewProps, ResourceDetailData } from '../../../types';
import { ResourceTreeView } from '../../common/ResourceTreeView';
import { ResourceListView } from '../../common/ResourceListView';

export const SourceView: React.FC<SourceViewProps> = ({ resources, onExport, onMessage, className = '' }) => {
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showJsonView, setShowJsonView] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('list');

  // Sort and filter resource IDs
  const filteredResourceIds = useMemo(() => {
    if (!resources?.summary.resourceIds) {
      return [];
    }

    const resourceIds = resources.summary.resourceIds;

    // Filter by search term
    const filtered = searchTerm
      ? resourceIds.filter((id: string) => id.toLowerCase().includes(searchTerm.toLowerCase()))
      : resourceIds;

    // Sort alphabetically
    return filtered.sort();
  }, [resources?.summary.resourceIds, searchTerm]);

  const handleResourceSelect = (resourceId: string) => {
    setSelectedResourceId(resourceId);
    onMessage?.('info', `Selected resource: ${resourceId}`);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setSelectedResourceId(null); // Clear selection when searching
  };

  // Get full resource collection data using the new method
  const getResourceCollectionData = useCallback(() => {
    if (!resources?.system.resourceManager) {
      return null;
    }

    try {
      // Check if this is a ResourceManagerBuilder (has getResourceCollectionDecl method)
      if ('getResourceCollectionDecl' in resources.system.resourceManager) {
        const collectionResult = (resources.system.resourceManager as any).getResourceCollectionDecl();
        if (collectionResult.isSuccess()) {
          return {
            ...collectionResult.value,
            metadata: {
              exportedAt: new Date().toISOString(),
              totalResources: resources.summary.totalResources,
              type: 'ts-res-resource-collection'
            }
          };
        } else {
          onMessage?.('error', `Failed to get resource collection: ${collectionResult.message}`);
          return null;
        }
      } else if (resources.compiledCollection) {
        // For IResourceManager from bundles, use the compiled collection directly
        return {
          resources: resources.compiledCollection.resources || [],
          metadata: {
            exportedAt: new Date().toISOString(),
            totalResources: resources.summary.totalResources,
            type: 'ts-res-resource-collection'
          }
        };
      } else {
        onMessage?.('error', 'Resource collection data not available');
        return null;
      }
    } catch (error) {
      onMessage?.(
        'error',
        `Error getting resource collection: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }, [resources, onMessage]);

  // Export source data to JSON file
  const handleExportSourceData = useCallback(() => {
    try {
      const collectionData = getResourceCollectionData();
      if (!collectionData) {
        onMessage?.('error', 'No source collection data available to export');
        return;
      }

      onExport?.(collectionData, 'json');
      onMessage?.('success', 'Resource collection exported successfully');
    } catch (error) {
      onMessage?.(
        'error',
        `Failed to export resource collection: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }, [getResourceCollectionData, onExport, onMessage]);

  if (!resources) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-6">
          <DocumentTextIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Source Browser</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No Resources Loaded</h3>
            <p className="text-gray-600 mb-6">Import resources to explore them here.</p>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Use the Import View to load ts-res resource files or directories, then
                return here to browse and explore the loaded resources.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <DocumentTextIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Source Browser</h2>
        </div>
        {resources && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportSourceData}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
              Export JSON
            </button>
          </div>
        )}
      </div>

      {/* JSON View Toggle */}
      {resources && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <button
            onClick={() => setShowJsonView(!showJsonView)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <CodeBracketIcon className="h-4 w-4 mr-2" />
            {showJsonView ? 'Hide' : 'Show'} JSON Resource Collection
            {showJsonView ? (
              <ChevronUpIcon className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 ml-2" />
            )}
          </button>

          {/* JSON View */}
          {showJsonView && (
            <div className="mt-4">
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Resource Collection (JSON)</h3>
                  <button
                    onClick={handleExportSourceData}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <DocumentArrowDownIcon className="h-3 w-3 mr-1" />
                    Export
                  </button>
                </div>
                <pre className="text-xs text-gray-800 bg-white p-3 rounded border overflow-x-auto max-h-64 overflow-y-auto">
                  {JSON.stringify(getResourceCollectionData(), null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
          {/* Left side: Resource List */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Resources ({filteredResourceIds.length})
              </h3>
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center px-2 py-1 text-xs font-medium rounded ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="List View"
                >
                  <ListBulletIcon className="h-4 w-4" />
                  <span className="ml-1">List</span>
                </button>
                <button
                  onClick={() => setViewMode('tree')}
                  className={`flex items-center px-2 py-1 text-xs font-medium rounded ${
                    viewMode === 'tree'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Tree View"
                >
                  <FolderIcon className="h-4 w-4" />
                  <span className="ml-1">Tree</span>
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative mb-4">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Resource List or Tree */}
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
              {viewMode === 'tree' && resources?.system.resourceManager ? (
                <ResourceTreeView
                  resources={resources.system.resourceManager}
                  selectedResourceId={selectedResourceId}
                  onResourceSelect={handleResourceSelect}
                  searchTerm={searchTerm}
                  className=""
                />
              ) : (
                <ResourceListView
                  resourceIds={filteredResourceIds}
                  selectedResourceId={selectedResourceId}
                  onResourceSelect={handleResourceSelect}
                  searchTerm={searchTerm}
                  className=""
                />
              )}
            </div>
          </div>

          {/* Right side: Resource Details */}
          <div className="lg:w-1/2 flex flex-col">
            {selectedResourceId ? (
              <ResourceDetail
                resourceId={selectedResourceId}
                processedResources={resources}
                onMessage={onMessage}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
                <div className="text-center">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a resource to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ResourceDetailProps {
  resourceId: string;
  processedResources: any;
  onMessage?: (type: 'info' | 'warning' | 'error' | 'success', message: string) => void;
}

const ResourceDetail: React.FC<ResourceDetailProps> = ({ resourceId, processedResources, onMessage }) => {
  const [resourceDetail, setResourceDetail] = useState<ResourceDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const loadResourceDetail = () => {
      setIsLoading(true);
      setError(null);

      try {
        const resourceManager = processedResources.system.resourceManager;
        const resourceResult = resourceManager.getBuiltResource(resourceId);

        if (resourceResult.isSuccess()) {
          const resource = resourceResult.value;

          // Handle different resource formats (ResourceManagerBuilder vs IResourceManager)
          let candidateDetails: any[] = [];

          // Check if candidates have conditions property (ResourceManagerBuilder format)
          if (resource.candidates.length > 0 && 'conditions' in resource.candidates[0]) {
            // ResourceManagerBuilder format with full condition details
            candidateDetails = resource.candidates.map((candidate: any) => ({
              json: candidate.json,
              conditions:
                candidate.conditions?.conditions?.map((condition: any) => ({
                  qualifier: condition.qualifier.name,
                  operator: condition.operator,
                  value: condition.value,
                  priority: condition.priority,
                  scoreAsDefault: condition.scoreAsDefault
                })) || [],
              isPartial: candidate.isPartial,
              mergeMethod: candidate.mergeMethod
            }));
          } else {
            // IResourceManager format - extract conditions from compiled collection
            const compiledCollection = processedResources.compiledCollection;
            const compiledResource = compiledCollection?.resources?.find((r: any) => r.id === resourceId);

            candidateDetails = resource.candidates.map((candidate: any, index: number) => {
              // Try to get conditions from the compiled collection
              let conditions: any[] = [];

              if (compiledResource && compiledCollection) {
                const decision = compiledCollection.decisions?.[compiledResource.decision];
                if (decision?.conditionSets && index < decision.conditionSets.length) {
                  const conditionSetIndex = decision.conditionSets[index];
                  const conditionSet = compiledCollection.conditionSets?.[conditionSetIndex];

                  if (conditionSet?.conditions) {
                    conditions = conditionSet.conditions
                      .map((condIndex: number) => {
                        const condition = compiledCollection.conditions?.[condIndex];
                        const qualifier = compiledCollection.qualifiers?.[condition?.qualifierIndex];
                        return condition && qualifier
                          ? {
                              qualifier: qualifier.name,
                              operator: condition.operator || 'eq',
                              value: condition.value,
                              priority: condition.priority || qualifier.defaultPriority || 500,
                              scoreAsDefault: condition.scoreAsDefault
                            }
                          : null;
                      })
                      .filter(Boolean);
                  }
                }
              }

              return {
                json: candidate.json,
                conditions: conditions,
                isPartial: candidate.isPartial,
                mergeMethod: candidate.mergeMethod
              };
            });
          }

          const detail: ResourceDetailData = {
            id: resource.id,
            resourceType: resource.resourceType.key || resource.resourceType.name || 'unknown',
            candidateCount: resource.candidates.length,
            candidates: candidateDetails
          };

          setResourceDetail(detail);
          onMessage?.('info', `Loaded details for resource: ${resourceId}`);
        } else {
          setError(`Failed to load resource details: ${resourceResult.message}`);
          onMessage?.('error', `Failed to load resource details: ${resourceResult.message}`);
        }
      } catch (err) {
        const errorMsg = `Error loading resource details: ${
          err instanceof Error ? err.message : String(err)
        }`;
        setError(errorMsg);
        onMessage?.('error', errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    loadResourceDetail();
  }, [resourceId, processedResources, onMessage]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Details</h3>
        <div className="flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading resource details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Details</h3>
        <div className="flex-1 border border-gray-200 rounded-lg p-4 bg-red-50">
          <div className="text-center">
            <p className="text-red-600 font-medium mb-2">Error Loading Resource</p>
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!resourceDetail) {
    return (
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Details</h3>
        <div className="flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-gray-500">No resource details available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Details</h3>

      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="space-y-6">
          {/* Resource Overview */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Resource Overview</h4>
            <div className="bg-white p-4 rounded-lg border space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Fully Qualified ID:</span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded ml-2 break-all">
                  {resourceDetail.id}
                </code>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Resource Type:</span>
                <span className="ml-2 text-sm">{resourceDetail.resourceType}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Candidate Count:</span>
                <span className="ml-2 text-sm font-medium text-blue-600">
                  {resourceDetail.candidateCount}
                </span>
              </div>
            </div>
          </div>

          {/* Candidates */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">
              Candidates ({resourceDetail.candidates.length})
            </h4>
            <div className="space-y-4">
              {resourceDetail.candidates.map((candidate, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-800">Candidate {index + 1}</h5>
                    <div className="flex items-center space-x-2 text-xs">
                      {candidate.isPartial && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Partial</span>
                      )}
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {candidate.mergeMethod}
                      </span>
                    </div>
                  </div>

                  {/* Conditions */}
                  {candidate.conditions.length > 0 && (
                    <div className="mb-3">
                      <h6 className="text-sm font-medium text-gray-600 mb-2">Conditions:</h6>
                      <div className="space-y-1">
                        {candidate.conditions.map((condition, condIndex) => (
                          <div
                            key={condIndex}
                            className="flex items-center text-xs bg-blue-50 px-2 py-1 rounded"
                          >
                            <span className="font-medium text-blue-800">{condition.qualifier}</span>
                            <span className="mx-1 text-blue-600">{condition.operator}</span>
                            <span className="text-blue-700">{condition.value}</span>
                            <div className="ml-auto flex items-center space-x-2">
                              <span className="text-blue-500">priority: {condition.priority}</span>
                              {condition.scoreAsDefault !== undefined && (
                                <span className="text-amber-600 font-medium">
                                  default: {condition.scoreAsDefault}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {candidate.conditions.length === 0 && (
                    <div className="mb-3">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        No conditions (default candidate)
                      </span>
                    </div>
                  )}

                  {/* JSON Content */}
                  <div>
                    <h6 className="text-sm font-medium text-gray-600 mb-2">Content:</h6>
                    <pre className="text-xs bg-gray-50 p-3 rounded border overflow-x-auto max-h-40">
                      {JSON.stringify(candidate.json, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourceView;
