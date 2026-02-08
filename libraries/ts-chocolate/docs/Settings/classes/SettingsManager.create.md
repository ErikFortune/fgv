[Home](../../README.md) > [Settings](../README.md) > [SettingsManager](./SettingsManager.md) > create

## SettingsManager.create() method

Creates a new SettingsManager, loading settings from the file tree.
Creates default settings files if they don't exist.

**Signature:**

```typescript
static create(params: ISettingsManagerParams): Result<SettingsManager>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>ISettingsManagerParams</td><td>Creation parameters</td></tr>
</tbody></table>

**Returns:**

Result&lt;[SettingsManager](../../classes/SettingsManager.md)&gt;

Success with SettingsManager, or Failure
