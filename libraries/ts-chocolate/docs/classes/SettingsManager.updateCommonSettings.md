[Home](../README.md) > [SettingsManager](./SettingsManager.md) > updateCommonSettings

## SettingsManager.updateCommonSettings() method

Updates common settings with partial values.

**Signature:**

```typescript
updateCommonSettings(updates: Partial<Omit<ICommonSettings, "schemaVersion">>): Result<ICommonSettings>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>updates</td><td>Partial&lt;Omit&lt;ICommonSettings, "schemaVersion"&gt;&gt;</td><td>Partial common settings to merge</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ICommonSettings](../interfaces/ICommonSettings.md)&gt;

Success with updated common settings, or Failure
