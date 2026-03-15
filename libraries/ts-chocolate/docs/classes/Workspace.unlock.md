[Home](../README.md) > [Workspace](./Workspace.md) > unlock

## Workspace.unlock() method

Unlocks the workspace with a password.
- Unlocks the key store
- Loads any protected collections using the now-available secrets

**Signature:**

```typescript
unlock(password: string): Promise<Result<IWorkspace>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>password</td><td>string</td><td>The master password for the key store</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IWorkspace](../interfaces/IWorkspace.md)&gt;&gt;

Success with the workspace, or Failure if unlock fails
