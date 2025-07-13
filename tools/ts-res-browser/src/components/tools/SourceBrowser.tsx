import React, { useState, useMemo } from 'react';
import { DocumentTextIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { UseResourceManagerReturn } from '../../hooks/useResourceManager';
import { Message } from '../../types/app';

interface SourceBrowserProps {
  onMessage?: (type: Message['type'], message: string) => void;
  resourceManager: UseResourceManagerReturn;
}

const SourceBrowser: React.FC<SourceBrowserProps> = ({ onMessage, resourceManager }) => {
  const { state: resourceState } = resourceManager;
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Sort and filter resource IDs
  const filteredResourceIds = useMemo(() => {
    if (!resourceState.processedResources?.summary.resourceIds) {
      return [];
    }

    const resourceIds = resourceState.processedResources.summary.resourceIds;

    // Filter by search term
    const filtered = searchTerm
      ? resourceIds.filter((id: string) => id.toLowerCase().includes(searchTerm.toLowerCase()))
      : resourceIds;

    // Sort alphabetically
    return filtered.sort();
  }, [resourceState.processedResources?.summary.resourceIds, searchTerm]);

  const handleResourceSelect = (resourceId: string) => {
    setSelectedResourceId(resourceId);
    onMessage?.('info', `Selected resource: ${resourceId}`);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setSelectedResourceId(null); // Clear selection when searching
  };

  if (!resourceState.processedResources) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <DocumentTextIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Source Browser</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No Resources Loaded</h3>
            <p className="text-gray-600 mb-6">Import resources using the Import Tool to explore them here.</p>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Use the Import Tool to load ts-res resource files or directories, then
                return here to browse and explore the loaded resources.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <DocumentTextIcon className="h-8 w-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Source Browser</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
          {/* Left side: Resource List */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="flex items-center space-x-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Resources ({filteredResourceIds.length})
              </h3>
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

            {/* Resource List */}
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredResourceIds.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No resources match your search' : 'No resources available'}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredResourceIds.map((resourceId: string) => (
                    <button
                      key={resourceId}
                      onClick={() => handleResourceSelect(resourceId)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        selectedResourceId === resourceId ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900 truncate">
                        {searchTerm ? (
                          <span
                            dangerouslySetInnerHTML={{
                              __html: resourceId.replace(
                                new RegExp(`(${searchTerm})`, 'gi'),
                                '<mark class="bg-yellow-200">$1</mark>'
                              )
                            }}
                          />
                        ) : (
                          resourceId
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right side: Resource Details */}
          <div className="lg:w-1/2 flex flex-col">
            {selectedResourceId ? (
              <ResourceDetail
                resourceId={selectedResourceId}
                processedResources={resourceState.processedResources}
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
  onMessage?: (type: Message['type'], message: string) => void;
}

const ResourceDetail: React.FC<ResourceDetailProps> = ({ resourceId, processedResources, onMessage }) => {
  const [resolvedResource, setResolvedResource] = useState<any>(null);
  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = async () => {
    setIsResolving(true);
    try {
      const resolver = processedResources.resolver;
      if (resolver) {
        const result = await resolver.resolve(resourceId);
        if (result.isSuccess()) {
          setResolvedResource(result.value);
          onMessage?.('success', `Resource resolved: ${resourceId}`);
        } else {
          onMessage?.('error', `Failed to resolve resource: ${result.error}`);
        }
      }
    } catch (error) {
      onMessage?.(
        'error',
        `Error resolving resource: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Resource Details</h3>
        <button
          onClick={handleResolve}
          disabled={isResolving}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResolving ? 'Resolving...' : 'Resolve'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Resource ID</h4>
            <code className="text-sm bg-white p-2 rounded border block break-all">{resourceId}</code>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">System Information</h4>
            <div className="bg-white p-3 rounded border space-y-2 text-sm">
              <div>
                <strong>Resource Count:</strong> {processedResources.summary.totalResources}
              </div>
              <div>
                <strong>Resource IDs:</strong> {processedResources.summary.resourceIds.length}
              </div>
              {processedResources.summary.warnings.length > 0 && (
                <div>
                  <strong>Warnings:</strong>{' '}
                  <span className="text-yellow-600">{processedResources.summary.warnings.length}</span>
                </div>
              )}
              {processedResources.summary.errorCount > 0 && (
                <div>
                  <strong>Errors:</strong>{' '}
                  <span className="text-red-600">{processedResources.summary.errorCount}</span>
                </div>
              )}
            </div>
          </div>

          {resolvedResource && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Resolved Value</h4>
              <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
                {JSON.stringify(resolvedResource, null, 2)}
              </pre>
            </div>
          )}

          {!resolvedResource && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Click "Resolve"</strong> to load the actual resource value with the current context.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SourceBrowser;
