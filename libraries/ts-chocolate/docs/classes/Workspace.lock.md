[Home](../README.md) > [Workspace](./Workspace.md) > lock

## Workspace.lock() method

Locks the workspace.
- Locks the key store, clearing secrets from memory

**Signature:**

```typescript
lock(): Result<IWorkspace>;
```

**Returns:**

Result&lt;[IWorkspace](../interfaces/IWorkspace.md)&gt;

Success with the workspace, or Failure if lock fails
