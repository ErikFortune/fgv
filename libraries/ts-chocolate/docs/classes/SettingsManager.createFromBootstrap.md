[Home](../README.md) > [SettingsManager](./SettingsManager.md) > createFromBootstrap

## SettingsManager.createFromBootstrap() method

Creates a new SettingsManager from bootstrap + preferences files.
Creates default files if they don't exist.

**Signature:**

```typescript
static createFromBootstrap(params: ISettingsManagerBootstrapParams): Result<SettingsManager>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>ISettingsManagerBootstrapParams</td><td>Creation parameters</td></tr>
</tbody></table>

**Returns:**

Result&lt;[SettingsManager](SettingsManager.md)&gt;

Success with SettingsManager, or Failure
