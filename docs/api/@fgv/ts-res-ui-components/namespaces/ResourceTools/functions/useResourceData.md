[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResourceTools](../README.md) / useResourceData

# Function: useResourceData()

> **useResourceData**(`params?`): `IUseResourceDataReturn`

React hook for managing ts-res resource data processing and state.

Provides comprehensive functionality for:
- Importing and processing resource files and directories
- Loading and processing pre-compiled bundles
- Resource resolution with context
- Configuration management
- Error handling and state management

## Parameters

| Parameter | Type |
| ------ | ------ |
| `params?` | `IUseResourceDataParams` |

## Returns

`IUseResourceDataReturn`

Object containing current state and available actions

## Example

```typescript
const { state, actions } = useResourceData();

// Process a FileTree
await actions.processFileTree(fileTree);

// Resolve a resource with context
const result = await actions.resolveResource('my.resource', {
  language: 'en-US',
  environment: 'production'
});

// Check processing state
if (state.isProcessing) {
  // Show loading UI
} else if (state.error) {
  // Show error message
} else if (state.processedResources) {
  // Use processed resources
}
```
