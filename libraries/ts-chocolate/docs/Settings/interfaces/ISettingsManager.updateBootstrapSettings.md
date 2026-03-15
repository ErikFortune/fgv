[Home](../../README.md) > [Settings](../README.md) > [ISettingsManager](./ISettingsManager.md) > updateBootstrapSettings

## ISettingsManager.updateBootstrapSettings() method

Updates bootstrap settings with partial values.

**Signature:**

```typescript
updateBootstrapSettings(updates: Partial<Omit<IBootstrapSettings, "schemaVersion">>): Result<IBootstrapSettings>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>updates</td><td>Partial&lt;Omit&lt;IBootstrapSettings, "schemaVersion"&gt;&gt;</td><td>Partial bootstrap settings to merge</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IBootstrapSettings](../../interfaces/IBootstrapSettings.md)&gt;

Success with updated bootstrap settings, or Failure
