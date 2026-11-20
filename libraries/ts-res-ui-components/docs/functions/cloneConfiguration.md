[Home](../README.md) > cloneConfiguration

# Function: cloneConfiguration

Creates a deep copy of a system configuration object.

Performs a deep clone of the configuration to ensure complete isolation
from the original. Useful for creating editable copies, implementing undo/redo,
or preserving original state during modifications.

## Signature

```typescript
function cloneConfiguration(config: ISystemConfiguration): ISystemConfiguration
```
