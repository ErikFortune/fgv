[Home](../README.md) > ZipArchiveProgressCallback

# Type Alias: ZipArchiveProgressCallback

Progress callback for ZIP operations

## Type

```typescript
type ZipArchiveProgressCallback = (stage: "reading-file" | "parsing-zip" | "loading-manifest" | "loading-config" | "extracting-files" | "processing-resources" | "creating-zip", progress: number, details: string) => void
```
