import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface ResourceListViewProps {
  resourceIds: string[];
  selectedResourceId: string | null;
  onResourceSelect: (resourceId: string) => void;
  searchTerm?: string;
  className?: string;
}

export const ResourceListView: React.FC<ResourceListViewProps> = ({
  resourceIds,
  selectedResourceId,
  onResourceSelect,
  searchTerm = '',
  className = ''
}) => {
  // Filter and sort resource IDs
  const filteredResourceIds = React.useMemo(() => {
    const filtered = searchTerm
      ? resourceIds.filter((id) => id.toLowerCase().includes(searchTerm.toLowerCase()))
      : resourceIds;

    return filtered.sort();
  }, [resourceIds, searchTerm]);

  if (filteredResourceIds.length === 0) {
    return (
      <div className={`${className} p-4 text-center text-gray-500`}>
        <p>{searchTerm ? 'No resources match your search' : 'No resources available'}</p>
      </div>
    );
  }

  return (
    <div className={`${className} overflow-y-auto`}>
      {filteredResourceIds.map((resourceId) => (
        <div
          key={resourceId}
          className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0 ${
            selectedResourceId === resourceId ? 'bg-purple-50 border-l-2 border-purple-500' : ''
          } ${
            searchTerm && resourceId.toLowerCase().includes(searchTerm.toLowerCase()) ? 'bg-yellow-50' : ''
          }`}
          onClick={() => onResourceSelect(resourceId)}
        >
          <DocumentTextIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
          <span
            className={`text-sm truncate ${
              selectedResourceId === resourceId ? 'font-medium text-purple-900' : 'text-gray-700'
            }`}
            title={resourceId}
          >
            {resourceId}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ResourceListView;
