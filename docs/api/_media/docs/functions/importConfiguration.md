[Home](../README.md) > importConfiguration

# Function: importConfiguration

Imports and validates a system configuration from a serialized string.

Parses configuration data from JSON or YAML format and performs validation
to ensure the imported configuration is structurally sound and contains
required fields. Provides detailed error messages for parsing or validation failures.

## Signature

```typescript
function importConfiguration(data: string): Result<ISystemConfiguration>
```
