[Home](../README.md) > convertJsonDirectoryToMapSync

# Function: convertJsonDirectoryToMapSync

Reads and converts all JSON files from a directory, returning a
`Map<string, T>` indexed by file base name (i.e. minus the extension)
with an optional name transformation applied if present.

## Signature

```typescript
function convertJsonDirectoryToMapSync(srcPath: string, options: IJsonFsDirectoryToMapOptions<T, TC>): Result<Map<string, T>>
```
