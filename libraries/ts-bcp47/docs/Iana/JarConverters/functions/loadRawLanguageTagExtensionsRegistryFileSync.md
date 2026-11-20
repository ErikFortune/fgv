[Home](../../../README.md) > [Iana](../../README.md) > [JarConverters](../README.md) > loadRawLanguageTagExtensionsRegistryFileSync

# Function: loadRawLanguageTagExtensionsRegistryFileSync

Loads a text (JAR) format language tag extensions registry file and returns the registry format
with field names matching legacy test JSON format ("Contact_Email", "Mailing_List") suitable for
creating test JSON files that work with JAR converters.

## Signature

```typescript
function loadRawLanguageTagExtensionsRegistryFileSync(path: string): Result<LanguageTagExtensionRegistryFile>
```
