[Home](../README.md) > [Workspace](./Workspace.md) > state

## Workspace.state property

Current state of the workspace with respect to key store.
- `'locked'`: Key store is present but not unlocked
- `'unlocked'`: Key store is present and unlocked
- `'no-keystore'`: No key store configured

**Signature:**

```typescript
readonly state: WorkspaceState;
```
