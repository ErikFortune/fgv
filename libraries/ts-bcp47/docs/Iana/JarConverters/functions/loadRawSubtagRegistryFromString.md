[Home](../../../README.md) > [Iana](../../README.md) > [JarConverters](../README.md) > loadRawSubtagRegistryFromString

# Function: loadRawSubtagRegistryFromString

Parses a text (JAR) format language subtag registry from string content and returns the registry format
with field names matching legacy test JSON format ("Suppress-Script", "Preferred-Value").

## Signature

```typescript
function loadRawSubtagRegistryFromString(content: string): Result<RegistryFile>
```
