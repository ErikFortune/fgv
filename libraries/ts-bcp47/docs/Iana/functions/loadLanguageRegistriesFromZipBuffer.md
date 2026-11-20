[Home](../../README.md) > [Iana](../README.md) > loadLanguageRegistriesFromZipBuffer

# Function: loadLanguageRegistriesFromZipBuffer

Loads language registries from a ZIP buffer containing the registry JSON files (web-compatible).

## Signature

```typescript
function loadLanguageRegistriesFromZipBuffer(zipBuffer: ArrayBuffer | Uint8Array<ArrayBufferLike>, subtagsPath: string, extensionsPath: string): Result<LanguageRegistries>
```
