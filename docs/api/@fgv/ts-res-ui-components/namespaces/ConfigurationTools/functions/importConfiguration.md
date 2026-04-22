[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ConfigurationTools](../README.md) / importConfiguration

# Function: importConfiguration()

> **importConfiguration**(`data`): [`Result`](../../../type-aliases/Result.md)\<[`ISystemConfiguration`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\>

Imports and validates a system configuration from a serialized string.

Parses configuration data from JSON or YAML format and performs validation
to ensure the imported configuration is structurally sound and contains
required fields. Provides detailed error messages for parsing or validation failures.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `string` | The serialized configuration string (JSON or YAML) |

## Returns

[`Result`](../../../type-aliases/Result.md)\<[`ISystemConfiguration`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\>

Result containing the parsed configuration or error message

## Examples

```typescript
import { ConfigurationTools } from '@fgv/ts-res-ui-components';

// Import from JSON string
const jsonData = '{"qualifierTypes": [...], "qualifiers": [...]}';
const importResult = ConfigurationTools.importConfiguration(jsonData);

if (importResult.isSuccess()) {
  console.log('Configuration imported successfully');
  applyConfiguration(importResult.value);
} else {
  console.error('Import failed:', importResult.message);
}
```

```typescript
// Import from file upload
const handleFileImport = async (file: File) => {
  const text = await file.text();
  const result = ConfigurationTools.importConfiguration(text);

  if (result.isFailure()) {
    showError(`Failed to import ${file.name}: ${result.message}`);
    return;
  }

  // Validate before applying
  const validation = ConfigurationTools.validateConfiguration(result.value);
  if (!validation.isValid) {
    showWarning('Configuration has validation issues', validation.warnings);
  }

  setConfiguration(result.value);
};
```
