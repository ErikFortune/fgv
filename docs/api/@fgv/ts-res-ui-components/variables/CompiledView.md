[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res-ui-components](../README.md) / CompiledView

# Variable: CompiledView

> `const` **CompiledView**: `React.FC`\<[`ICompiledViewProps`](../namespaces/TsResTools/interfaces/ICompiledViewProps.md)\>

CompiledView component for browsing compiled resource collections and metadata.

Provides an interface for exploring the compiled resource collection structure,
including resources, configuration metadata, qualifiers, and resource types.
Supports both filtered and unfiltered views with export functionality.

**Key Features:**
- **Compiled structure browsing**: Navigate through compiled resource collections
- **Metadata exploration**: View system configuration, qualifiers, and resource types
- **Filter integration**: Works with filtered resource collections
- **Tree-based navigation**: Hierarchical view of resources and metadata
- **Export functionality**: Export compiled collections in various formats
- **Bundle support**: View and export as ts-res bundles for distribution

## Example

```tsx
import { CompiledView } from '@fgv/ts-res-ui-components';

function MyCompiledBrowser() {
  const handleExport = (format) => {
    console.log(`Exporting compiled resources as ${format}...`);
  };

  return (
    <CompiledView
      resources={processedResources}
      filterState={filterState}
      filterResult={filterResult}
      useNormalization={true}
      onExport={handleExport}
    />
  );
}
```
