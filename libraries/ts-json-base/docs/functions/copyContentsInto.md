[Home](../README.md) > copyContentsInto

# Function: copyContentsInto

Copies every child of a source directory into a destination directory, recursing for
subdirectories. The source directory itself is not reproduced — its contents are.

## Signature

```typescript
function copyContentsInto(source: IFileTreeDirectoryItem<TCT>, destination: IMutableFileTreeDirectoryItem<TCT>, options: ICopyOptions): Result<ICopyReport>
```
