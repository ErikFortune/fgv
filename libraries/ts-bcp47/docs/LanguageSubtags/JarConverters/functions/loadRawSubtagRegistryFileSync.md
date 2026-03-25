[Home](../../../README.md) > [LanguageSubtags](../../README.md) > [JarConverters](../README.md) > loadRawSubtagRegistryFileSync

# Function: loadRawSubtagRegistryFileSync

Loads a text (JAR) format language subtag registry file and returns the registry format
with field names matching legacy test JSON format ("Suppress-Script", "Preferred-Value")
suitable for creating test JSON files that work with JAR converters.

## Signature

```typescript
function loadRawSubtagRegistryFileSync(path: string): Result<RegistryFile>
```
