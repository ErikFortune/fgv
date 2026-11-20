[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ConfigurationTools](../README.md) / useIConfigurationState

# Function: useIConfigurationState()

> **useIConfigurationState**(`initialConfiguration?`, `onConfigurationChange?`, `onUnsavedChanges?`): `IUseIConfigurationStateReturn`

Hook for managing system configuration state including qualifiers, qualifier types, and resource types.

Provides comprehensive configuration management with validation, change tracking, and import/export capabilities.
Supports both visual editing and JSON editing modes with real-time validation.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `initialConfiguration?` | [`ISystemConfiguration`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | Optional initial configuration. Defaults to system default configuration |
| `onConfigurationChange?` | (`config`) => `void` | Optional callback invoked when configuration changes (not on first mount) |
| `onUnsavedChanges?` | (`hasChanges`) => `void` | Optional callback invoked when unsaved changes state changes |

## Returns

`IUseIConfigurationStateReturn`

Object containing:
- `state` - Current configuration state with change tracking and validation
- `actions` - Methods for modifying and managing the configuration
- `templates` - Available configuration templates for quick loading

## Examples

Basic usage:
```typescript
const { state, actions } = useIConfigurationState();

// Check for unsaved changes
if (state.hasUnsavedChanges) {
  console.log('Configuration has been modified');
}

// Add a new qualifier
actions.addQualifier({
  name: 'language',
  typeName: 'language',
  defaultPriority: 100
});
```

With change notifications:
```typescript
const { state, actions } = useIConfigurationState(
  undefined,
  (config) => console.log('Configuration changed:', config),
  (hasChanges) => console.log('Has unsaved changes:', hasChanges)
);
```

JSON import/export:
```typescript
const { actions } = useIConfigurationState();

// Export to JSON
const exportResult = actions.exportToJson({ pretty: true });
if (exportResult.isSuccess()) {
  console.log(exportResult.value); // JSON string
}

// Import from JSON
const importResult = actions.importFromJson(jsonString);
if (importResult.isFailure()) {
  console.error('Import failed:', importResult.message);
}
```
