[Home](../../README.md) > [ConfigurationTools](../README.md) > useIConfigurationState

# Function: useIConfigurationState

Hook for managing system configuration state including qualifiers, qualifier types, and resource types.

Provides comprehensive configuration management with validation, change tracking, and import/export capabilities.
Supports both visual editing and JSON editing modes with real-time validation.

## Signature

```typescript
function useIConfigurationState(initialConfiguration: ISystemConfiguration, onConfigurationChange: (config: ISystemConfiguration) => void, onUnsavedChanges: (hasChanges: boolean) => void): IUseIConfigurationStateReturn
```
