[Home](../README.md) > createNodeWorkspace

# Function: createNodeWorkspace

Creates a workspace from filesystem directories using platform initialization.
Supports three directory layout modes:
1. Single root - all data in one directory
2. Dual root - separate installation and library directories
3. Multi-root - installation directory plus multiple library directories

## Signature

```typescript
function createNodeWorkspace(params: ICreateNodeWorkspaceParams): Promise<Result<IWorkspace>>
```
