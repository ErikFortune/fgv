[Home](../README.md) > initializeWorkspace

# Function: initializeWorkspace

Initializes a new workspace with default settings and directory structure.

This is the primary initialization function that tools should call.
It creates:
- Standard directory structure
- Default common settings with schemaVersion
- Default device settings with schemaVersion

## Signature

```typescript
function initializeWorkspace(params: IWorkspaceInitParams): Result<IWorkspaceInitResult>
```
