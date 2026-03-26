[Home](../../README.md) > [LanguageTagExtensions](../README.md) > loadRawLanguageTagExtensionsRegistryFromString

# Function: loadRawLanguageTagExtensionsRegistryFromString

Parses a text (JAR) format language tag extensions registry from string content and returns the registry format
with field names matching legacy test JSON format ("Contact_Email", "Mailing_List").

## Signature

```typescript
function loadRawLanguageTagExtensionsRegistryFromString(content: string): Result<LanguageTagExtensionRegistryFile>
```
