[Home](../README.md) > [ISettingsManager](./ISettingsManager.md) > updateDeviceSettings

## ISettingsManager.updateDeviceSettings() method

Updates device-specific settings with partial values.

**Signature:**

```typescript
updateDeviceSettings(updates: Partial<Omit<IDeviceSettings, "schemaVersion" | "deviceId">>): Result<IDeviceSettings>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>updates</td><td>Partial&lt;Omit&lt;IDeviceSettings, "schemaVersion" | "deviceId"&gt;&gt;</td><td>Partial device settings to merge</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IDeviceSettings](IDeviceSettings.md)&gt;

Success with updated device settings, or Failure
