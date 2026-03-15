[Home](../README.md) > createWorkspaceFromPlatform

# Function: createWorkspaceFromPlatform

Creates a workspace from platform initialization results (Stage 2).

This is the common initialization logic that works the same across all platforms.
Call this after platform-specific initialization (Stage 1) has completed.

## Signature

```typescript
function createWorkspaceFromPlatform(params: ICommonWorkspaceInitParams): Result<IWorkspace>
```
