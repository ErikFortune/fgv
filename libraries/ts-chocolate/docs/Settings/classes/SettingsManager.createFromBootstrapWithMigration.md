[Home](../../README.md) > [Settings](../README.md) > [SettingsManager](./SettingsManager.md) > createFromBootstrapWithMigration

## SettingsManager.createFromBootstrapWithMigration() method

Creates a new SettingsManager from bootstrap + preferences files,
auto-migrating from common.json if bootstrap.json doesn't exist yet.

Migration logic:
- If bootstrap.json exists: load bootstrap + preferences normally
- If bootstrap.json doesn't exist but common.json does: split common.json
  into bootstrap + preferences, write both, and proceed
- If neither exists: create defaults

**Signature:**

```typescript
static createFromBootstrapWithMigration(params: ISettingsManagerBootstrapParams): Result<SettingsManager>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>ISettingsManagerBootstrapParams</td><td>Creation parameters</td></tr>
</tbody></table>

**Returns:**

Result&lt;[SettingsManager](../../classes/SettingsManager.md)&gt;

Success with SettingsManager, or Failure
