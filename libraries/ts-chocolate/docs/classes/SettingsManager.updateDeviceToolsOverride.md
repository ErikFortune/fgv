[Home](../README.md) > [SettingsManager](./SettingsManager.md) > updateDeviceToolsOverride

## SettingsManager.updateDeviceToolsOverride() method

Updates device tool settings overrides.

**Signature:**

```typescript
updateDeviceToolsOverride(tools: Partial<IToolSettings>): Result<Partial<IToolSettings>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>tools</td><td>Partial&lt;IToolSettings&gt;</td><td>Partial tool settings to merge as device overrides</td></tr>
</tbody></table>

**Returns:**

Result&lt;Partial&lt;[IToolSettings](../interfaces/IToolSettings.md)&gt;&gt;

Success with updated device tool settings, or Failure
