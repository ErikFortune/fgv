[Home](../README.md) > initializeWorkspace

# Function: initializeWorkspace

Initializes a new workspace with default settings and directory structure.

This is the primary initialization function that tools should call.
It creates:
- Standard directory structure
- Default bootstrap settings
- Default preferences settings

## Signature

```typescript
function initializeWorkspace(params: IWorkspaceInitParams): Result<IWorkspaceInitResult>
```
