[Home](../README.md) > [Workspace](./Workspace.md) > create

## Workspace.create() method

Creates a new workspace with the specified configuration.

**Signature:**

```typescript
static create(params?: IWorkspaceCreateParams): Result<Workspace>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IWorkspaceCreateParams</td><td>Workspace creation parameters</td></tr>
</tbody></table>

**Returns:**

Result&lt;[Workspace](Workspace.md)&gt;

Success with workspace, or Failure if creation fails
