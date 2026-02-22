[Home](../README.md) > [ISettingsManager](./ISettingsManager.md) > updatePreferencesSettings

## ISettingsManager.updatePreferencesSettings() method

Updates preferences settings with partial values.

**Signature:**

```typescript
updatePreferencesSettings(updates: Partial<Omit<IPreferencesSettings, "schemaVersion">>): Result<IPreferencesSettings>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>updates</td><td>Partial&lt;Omit&lt;IPreferencesSettings, "schemaVersion"&gt;&gt;</td><td>Partial preferences settings to merge</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IPreferencesSettings](IPreferencesSettings.md)&gt;

Success with updated preferences settings, or Failure
