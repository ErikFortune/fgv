[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res-ui-components](../README.md) / MultiGridView

# Variable: MultiGridView

> `const` **MultiGridView**: `React.FC`\<[`IMultiGridViewProps`](../namespaces/GridTools/interfaces/IMultiGridViewProps.md)\>

MultiGridView component for managing multiple grid instances with shared context.

Provides a comprehensive interface for displaying multiple related grids that share
the same resolution context and batch operations. Perfect for administrative workflows
where users need to configure related data across multiple resource types.

**Key Features:**
- **Multiple Grids**: Display multiple grid configurations with different resource selections
- **Shared Context**: Single context management that applies to all grids simultaneously
- **Unified Changes**: Batch operations work across all grids and resource types
- **Flexible Presentation**: Support for tabs, cards, accordion, and dropdown grid selection
- **Validation Integration**: Prevents batch operations when validation errors exist

## Example

```tsx
import { MultiGridView } from '@fgv/ts-res-ui-components';

// Configure multiple grids for admin workflow
const gridConfigurations = [
  {
    id: 'languages',
    title: 'Languages',
    description: 'Language configuration settings',
    resourceSelection: { type: 'resourceTypes', types: ['language-config'] },
    columnMapping: [{
      resourceType: 'language-config',
      columns: [
        { id: 'code', title: 'Code', dataPath: 'code' },
        { id: 'name', title: 'Name', dataPath: 'displayName', editable: true, cellType: 'string' },
        { id: 'enabled', title: 'Enabled', dataPath: 'enabled', editable: true, cellType: 'boolean' }
      ]
    }]
  },
  {
    id: 'payment-methods',
    title: 'Payment Methods',
    description: 'Payment method configuration',
    resourceSelection: { type: 'prefix', prefix: 'payment.methods.' },
    columnMapping: [{
      resourceType: 'payment-config',
      columns: [
        { id: 'method', title: 'Method', dataPath: 'method' },
        { id: 'enabled', title: 'Enabled', dataPath: 'enabled', editable: true, cellType: 'tristate' },
        { id: 'priority', title: 'Priority', dataPath: 'priority', editable: true, cellType: 'dropdown',
          dropdownOptions: [
            { value: 'high', label: 'High Priority' },
            { value: 'medium', label: 'Medium Priority' },
            { value: 'low', label: 'Low Priority' }
          ]
        }
      ]
    }]
  }
];

function AdminPanel() {
  return (
    <MultiGridView
      gridConfigurations={gridConfigurations}
      resources={processedResources}
      resolutionState={resolutionState}
      resolutionActions={resolutionActions}
      availableQualifiers={['country', 'language', 'environment']}
      contextOptions={{
        qualifierOptions: {
          country: { editable: true, placeholder: 'Select country...' },
          environment: { editable: false, hostValue: 'production' }
        },
        hostManagedValues: { environment: 'production' }
      }}
      tabsPresentation="tabs"
      defaultActiveGrid="languages"
    />
  );
}
```
