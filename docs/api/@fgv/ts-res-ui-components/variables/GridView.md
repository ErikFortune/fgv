[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res-ui-components](../README.md) / GridView

# Variable: GridView

> `const` **GridView**: `React.FC`\<[`IGridViewProps`](../namespaces/GridTools/interfaces/IGridViewProps.md)\>

GridView component for displaying multiple resources in a tabular format.

Provides a grid-based interface for viewing and editing multiple resources
simultaneously, with configurable column mappings and shared context management.
Leverages the same state management and batch processing as ResolutionView.

**Key Features:**
- **Multi-resource display**: View multiple resources in rows with configurable columns
- **Column mapping**: Host-defined extraction of properties from resolved resources
- **Batch editing**: Edit multiple resource values with unified batch application
- **Context integration**: Same context management as ResolutionView
- **Resource filtering**: Flexible resource selection via built-in and custom selectors
- **Change management**: Leverages existing UnifiedChangeControls for batch operations

## Example

```tsx
import { GridView } from '@fgv/ts-res-ui-components';

// Define grid configuration
const gridConfig = {
  id: 'user-messages',
  title: 'User Messages',
  resourceSelection: { type: 'prefix', prefix: 'user.' },
  columnMapping: [{
    resourceType: 'text-resource',
    columns: [
      { id: 'text', title: 'Message Text', dataPath: 'text', editable: true },
      { id: 'locale', title: 'Locale', dataPath: 'locale' }
    ]
  }]
};

function MyGridApp() {
  return (
    <GridView
      gridConfig={gridConfig}
      resources={processedResources}
      resolutionState={resolutionState}
      resolutionActions={resolutionActions}
      availableQualifiers={['language', 'territory', 'platform']}
    />
  );
}
```
