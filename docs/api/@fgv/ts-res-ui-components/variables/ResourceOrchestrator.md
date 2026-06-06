[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res-ui-components](../README.md) / ResourceOrchestrator

# Variable: ResourceOrchestrator

> `const` **ResourceOrchestrator**: `React.FC`\<`IResourceOrchestratorProps`\>

Main orchestrator component for ts-res resource management UI.

This component provides a centralized state management and action coordination
for all ts-res UI functionality. It uses the render props pattern to provide
state and actions to child components.

Features:
- Resource processing (files, directories, bundles)
- Filtering and context management
- Resource resolution testing
- Configuration management
- View state coordination

## Param

ResourceOrchestrator configuration

## Returns

JSX element using render props pattern

## Example

```typescript
<ResourceOrchestrator>
  {({ state, actions }) => (
    <div>
      <ImportView
        onImport={actions.importDirectory}
        onBundleImport={actions.importBundle}
      />
      {state.processedResources && (
        <SourceView
          resources={state.processedResources}
          onExport={actions.exportData}
        />
      )}
    </div>
  )}
</ResourceOrchestrator>
```
