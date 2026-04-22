[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [GridTools](../README.md) / SharedContextControls

# Variable: SharedContextControls

> `const` **SharedContextControls**: `React.FC`\<`ISharedContextControlsProps`\>

SharedContextControls component for managing resolution context across multiple grids.

Provides a unified context management interface that is shared across all grid instances
in a MultiGridView. Changes to context values are immediately reflected in all grids,
enabling consistent administrative workflows.

## Example

```tsx
<SharedContextControls
  availableQualifiers={['language', 'territory', 'platform']}
  resolutionState={sharedResolutionState}
  resolutionActions={sharedResolutionActions}
  contextOptions={{
    qualifierOptions: {
      language: { editable: true },
      platform: { editable: false, hostValue: 'web' }
    },
    hostManagedValues: { environment: 'production' }
  }}
  resources={processedResources}
/>
```
