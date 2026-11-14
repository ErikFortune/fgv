[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res-ui-components](../README.md) / ResourceListView

# Variable: ResourceListView

> `const` **ResourceListView**: `React.FC`\<`IResourceListViewProps`\>

A flat list view component for displaying and selecting resources.

ResourceListView provides a simple, scrollable list interface for browsing through
resource IDs with built-in search filtering, selection highlighting, and hover effects.
It's optimized for flat resource hierarchies and provides a clean, accessible interface.

## Examples

```tsx
import { ResourceListView } from '@fgv/ts-res-ui-components';

function ResourceBrowser() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const resourceIds = ['user.welcome', 'user.goodbye', 'error.notFound', 'button.save'];

  return (
    <div>
      <input
        type="text"
        placeholder="Search resources..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <ResourceListView
        resourceIds={resourceIds}
        selectedResourceId={selectedId}
        onResourceSelect={setSelectedId}
        searchTerm={searchTerm}
        className="h-64 border rounded"
      />
    </div>
  );
}
```

```tsx
// Using with orchestrator state
import { ResourceTools } from '@fgv/ts-res-ui-components';

function OrchestratorResourceList() {
  const { state, actions } = ResourceTools.useResourceData();
  const resourceIds = state.resources?.summary?.resourceIds || [];

  return (
    <ResourceListView
      resourceIds={resourceIds}
      selectedResourceId={state.selectedResourceId}
      onResourceSelect={(id) => actions.selectResource(id)}
      className="flex-1 min-h-0"
    />
  );
}
```

```tsx
// With search integration and custom handling
function SearchableResourceList({ resources, onResourceDetails }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleResourceSelect = (resourceId: string) => {
    setSelectedId(resourceId);
    onResourceDetails(resourceId);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <input
          type="search"
          placeholder="Filter resources..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <ResourceListView
        resourceIds={resources.map(r => r.id)}
        selectedResourceId={selectedId}
        onResourceSelect={handleResourceSelect}
        searchTerm={searchTerm}
        className="flex-1 min-h-0"
      />
    </div>
  );
}
```
