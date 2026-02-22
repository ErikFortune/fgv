[Home](../README.md) > initializeWorkspace

# Function: initializeWorkspace

Initializes a new workspace with default settings and directory structure.

This is the primary initialization function that tools should call.
It creates:
- Standard directory structure
- Default bootstrap settings (two-phase init)
- Default preferences settings (two-phase init)
- Default common settings (legacy, for backward compatibility)
- Default device settings (legacy, for backward compatibility)

## Signature

```typescript
function initializeWorkspace(params: IWorkspaceInitParams): Result<IWorkspaceInitResult>
```
