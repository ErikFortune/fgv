[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res-ui-components](../README.md) / SourceView

# Variable: SourceView

> `const` **SourceView**: `React.FC`\<[`ISourceViewProps`](../namespaces/TsResTools/interfaces/ISourceViewProps.md)\>

SourceView component for browsing and managing source resource collections.

Provides an interface for browsing source resources in their original form,
viewing resource details including candidates and conditions, and exporting
the complete source resource collection.

**Key Features:**
- **Resource browsing**: Navigate through all resources with search and filtering
- **Detailed resource view**: See resource structure, candidates, conditions, and values
- **Export functionality**: Export the complete source resource collection as JSON
- **Source-specific details**: View resources in their original source form
- **Candidate analysis**: Examine resource candidates and their conditions

## Example

```tsx
import { SourceView } from '@fgv/ts-res-ui-components';

function MySourceBrowser() {
  const handleExport = () => {
    // Export source resources
    console.log('Exporting source resources...');
  };

  return (
    <SourceView
      resources={processedResources}
      onExport={handleExport}
    />
  );
}
```
