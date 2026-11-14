[Home](../../README.md) > [FileTreeHelpers](../README.md) > fromFileList

# Function: fromFileList

Helper function to create a new FileTree instance
from a browser FileList (e.g., from input[type="file"]).

## Signature

```typescript
function fromFileList(fileList: FileList, params: IFileTreeInitParams<string>): Promise<Result<FileTree_2<string>>>
```
