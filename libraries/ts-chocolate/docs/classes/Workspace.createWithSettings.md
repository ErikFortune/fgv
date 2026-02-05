[Home](../README.md) > [Workspace](./Workspace.md) > createWithSettings

## Workspace.createWithSettings() method

Creates a new workspace with a pre-created settings manager.
Used by platform initialization flow after settings have been loaded.

**Signature:**

```typescript
static createWithSettings(params: IWorkspaceCreateWithSettingsParams): Result<Workspace>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IWorkspaceCreateWithSettingsParams</td><td>Workspace creation parameters with settings manager</td></tr>
</tbody></table>

**Returns:**

Result&lt;[Workspace](Workspace.md)&gt;

Success with workspace, or Failure if creation fails
