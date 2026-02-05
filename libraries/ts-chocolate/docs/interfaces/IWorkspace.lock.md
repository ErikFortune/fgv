[Home](../README.md) > [IWorkspace](./IWorkspace.md) > lock

## IWorkspace.lock() method

Locks the workspace.
- Locks the key store, clearing secrets from memory

**Signature:**

```typescript
lock(): Result<IWorkspace>;
```

**Returns:**

Result&lt;[IWorkspace](IWorkspace.md)&gt;

Success with the workspace, or Failure if lock fails
