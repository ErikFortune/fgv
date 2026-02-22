[Home](../../README.md) > [Settings](../README.md) > [SettingsManager](./SettingsManager.md) > updateToolSettings

## SettingsManager.updateToolSettings() method

Updates tool settings.

**Signature:**

```typescript
updateToolSettings(tools: Partial<IToolSettings>): Result<IToolSettings>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>tools</td><td>Partial&lt;IToolSettings&gt;</td><td>Partial tool settings to merge</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IToolSettings](../../interfaces/IToolSettings.md)&gt;

Success with updated tool settings, or Failure
