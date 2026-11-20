[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ConfigurationTools](../README.md) / cloneConfiguration

# Function: cloneConfiguration()

> **cloneConfiguration**(`config`): [`ISystemConfiguration`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)

Creates a deep copy of a system configuration object.

Performs a deep clone of the configuration to ensure complete isolation
from the original. Useful for creating editable copies, implementing undo/redo,
or preserving original state during modifications.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | [`ISystemConfiguration`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | The configuration to clone |

## Returns

[`ISystemConfiguration`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)

A deep copy of the configuration

## Example

```typescript
import { ConfigurationTools } from '@fgv/ts-res-ui-components';

const originalConfig = getSystemConfiguration();
const editableConfig = ConfigurationTools.cloneConfiguration(originalConfig);

// Modify the clone without affecting the original
editableConfig.qualifiers.push(newQualifier);
console.log('Original unchanged:', originalConfig.qualifiers.length);
console.log('Clone modified:', editableConfig.qualifiers.length);
```
