import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

/**
 * Props for the ResourceListView component.
 *
 * @public
 */
interface ResourceListViewProps {
  /** Array of resource IDs to display in the list */
  resourceIds: string[];
  /** Currently selected resource ID for highlighting */
  selectedResourceId: string | null;
  /** Callback fired when a resource is selected */
  onResourceSelect: (resourceId: string) => void;
  /** Optional search term to filter resources (case-insensitive) */
  searchTerm?: string;
  /** Optional CSS classes to apply to the container */
  className?: string;
}

/**
 * A flat list view component for displaying and selecting resources.
 *
 * ResourceListView provides a simple, scrollable list interface for browsing through
 * resource IDs with built-in search filtering, selection highlighting, and hover effects.
 * It's optimized for flat resource hierarchies and provides a clean, accessible interface.
 *
 * @example
 * ```tsx
 * import { ResourceListView } from '@fgv/ts-res-ui-components';
 *
 * function ResourceBrowser() {
 *   const [selectedId, setSelectedId] = useState<string | null>(null);
 *   const [searchTerm, setSearchTerm] = useState('');
 *
 *   const resourceIds = ['user.welcome', 'user.goodbye', 'error.notFound', 'button.save'];
 *
 *   return (
 *     <div>
 *       <input
 *         type="text"
 *         placeholder="Search resources..."
 *         value={searchTerm}
 *         onChange={(e) => setSearchTerm(e.target.value)}
 *       />
 *       <ResourceListView
 *         resourceIds={resourceIds}
 *         selectedResourceId={selectedId}
 *         onResourceSelect={setSelectedId}
 *         searchTerm={searchTerm}
 *         className="h-64 border rounded"
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Using with orchestrator state
 * import { ResourceTools } from '@fgv/ts-res-ui-components';
 *
 * function OrchestratorResourceList() {
 *   const { state, actions } = ResourceTools.useResourceData();
 *   const resourceIds = state.resources?.summary?.resourceIds || [];
 *
 *   return (
 *     <ResourceListView
 *       resourceIds={resourceIds}
 *       selectedResourceId={state.selectedResourceId}
 *       onResourceSelect={(id) => actions.selectResource(id)}
 *       className="flex-1 min-h-0"
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With search integration and custom handling
 * function SearchableResourceList({ resources, onResourceDetails }) {
 *   const [searchTerm, setSearchTerm] = useState('');
 *   const [selectedId, setSelectedId] = useState<string | null>(null);
 *
 *   const handleResourceSelect = (resourceId: string) => {
 *     setSelectedId(resourceId);
 *     onResourceDetails(resourceId);
 *   };
 *
 *   return (
 *     <div className="flex flex-col h-full">
 *       <div className="p-4 border-b">
 *         <input
 *           type="search"
 *           placeholder="Filter resources..."
 *           value={searchTerm}
 *           onChange={(e) => setSearchTerm(e.target.value)}
 *           className="w-full px-3 py-2 border rounded-md"
 *         />
 *       </div>
 *       <ResourceListView
 *         resourceIds={resources.map(r => r.id)}
 *         selectedResourceId={selectedId}
 *         onResourceSelect={handleResourceSelect}
 *         searchTerm={searchTerm}
 *         className="flex-1 min-h-0"
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @public
 */
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
