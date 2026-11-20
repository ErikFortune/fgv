[Home](../README.md) > exportConfiguration

# Function: exportConfiguration

Exports a system configuration to a formatted string representation.

Converts the configuration object to a serialized format (JSON or YAML) with
optional formatting and metadata. Supports pretty-printing for human readability
and can include comments and custom filenames for enhanced usability.

## Signature

```typescript
function exportConfiguration(config: ISystemConfiguration, options: IConfigurationExportOptions): Result<string>
```
