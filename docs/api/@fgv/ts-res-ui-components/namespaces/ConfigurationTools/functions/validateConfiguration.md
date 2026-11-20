[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ConfigurationTools](../README.md) / validateConfiguration

# Function: validateConfiguration()

> **validateConfiguration**(`config`): `IConfigurationValidationResult`

Validates a ts-res system configuration for completeness and correctness.

Performs comprehensive validation of configuration structure, required fields,
type relationships, and logical consistency. Returns detailed validation results
with specific error and warning messages for debugging and user feedback.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | [`ISystemConfiguration`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | The system configuration to validate |

## Returns

`IConfigurationValidationResult`

Validation result with errors, warnings, and validity status

## Example

```typescript
import { ConfigurationTools } from '@fgv/ts-res-ui-components';

const config = {
  qualifierTypes: [{ name: 'language', systemType: 'language' }],
  qualifiers: [{ name: 'en', typeName: 'language', defaultPriority: 100 }],
  resourceTypes: [{ name: 'string', defaultValue: '' }]
};

const validation = ConfigurationTools.validateConfiguration(config);
if (!validation.isValid) {
  console.error('Configuration errors:', validation.errors);
  console.warn('Configuration warnings:', validation.warnings);
}
```
