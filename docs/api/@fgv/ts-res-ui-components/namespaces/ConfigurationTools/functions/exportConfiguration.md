[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ConfigurationTools](../README.md) / exportConfiguration

# Function: exportConfiguration()

> **exportConfiguration**(`config`, `options`): [`Result`](../../../type-aliases/Result.md)\<`string`\>

Exports a system configuration to a formatted string representation.

Converts the configuration object to a serialized format (JSON or YAML) with
optional formatting and metadata. Supports pretty-printing for human readability
and can include comments and custom filenames for enhanced usability.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | [`ISystemConfiguration`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | The configuration to export |
| `options` | `IConfigurationExportOptions` | Export formatting options |

## Returns

[`Result`](../../../type-aliases/Result.md)\<`string`\>

Result containing the formatted configuration string or error message

## Examples

```typescript
import { ConfigurationTools } from '@fgv/ts-res-ui-components';

const config = getCurrentConfiguration();

// Export as pretty-printed JSON
const jsonResult = ConfigurationTools.exportConfiguration(config, {
  format: 'json',
  pretty: true,
  includeComments: true
});

if (jsonResult.isSuccess()) {
  downloadFile(jsonResult.value, 'my-config.json');
}
```

```typescript
// Export as compact JSON for API transmission
const compactResult = ConfigurationTools.exportConfiguration(config, {
  format: 'json',
  pretty: false
});

if (compactResult.isSuccess()) {
  await sendToApi(compactResult.value);
}
```
