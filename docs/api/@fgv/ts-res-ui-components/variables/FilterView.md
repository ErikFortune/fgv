[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res-ui-components](../README.md) / FilterView

# Variable: FilterView

> `const` **FilterView**: `React.FC`\<[`IFilterViewProps`](../namespaces/FilterTools/interfaces/IFilterViewProps.md)\>

FilterView component for context-based resource filtering and analysis.

Provides a comprehensive interface for filtering resources based on qualifier values,
displaying filtered results with candidate count comparisons, and exporting filtered
resource collections. Supports partial context matching and qualifier reduction.

**Key Features:**
- **Context-based filtering**: Filter resources using qualifier values (language, territory, etc.)
- **Candidate analysis**: Compare original vs filtered candidate counts for each resource
- **Visual indicators**: Highlight resources with reduced candidates or warnings
- **Export functionality**: Export filtered resource collections as JSON
- **Dual resource comparison**: View original and filtered resource details side-by-side
- **Qualifier reduction**: Option to remove perfectly matching qualifiers from results

## Example

```tsx
import { FilterView } from '@fgv/ts-res-ui-components';

function MyFilterTool() {
  const [filterState, setFilterState] = useState({
    enabled: false,
    values: {},
    appliedValues: {},
    hasPendingChanges: false,
    reduceQualifiers: false
  });

  return (
    <FilterView
      resources={processedResources}
      filterState={filterState}
      filterActions={{
        updateFilterEnabled: (enabled) => setFilterState(prev => ({...prev, enabled})),
        updateFilterValues: (values) => setFilterState(prev => ({...prev, values})),
        applyFilterValues: () => setFilterState(prev => ({...prev, appliedValues: prev.values})),
        resetFilterValues: () => setFilterState(prev => ({...prev, values: {}})),
        updateReduceQualifiers: (reduce) => setFilterState(prev => ({...prev, reduceQualifiers: reduce}))
      }}
      onFilterResult={(result) => console.log('Filter result:', result)}
    />
  );
}
```
