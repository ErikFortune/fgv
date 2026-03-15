[Home](../README.md) > [SettingsManager](./SettingsManager.md) > updateDefaultStorageTargets

## SettingsManager.updateDefaultStorageTargets() method

Updates the default storage targets (convenience method).

**Signature:**

```typescript
updateDefaultStorageTargets(targets: Partial<IDefaultStorageTargets>): Result<IDefaultStorageTargets>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>targets</td><td>Partial&lt;IDefaultStorageTargets&gt;</td><td>Partial default storage targets to merge</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IDefaultStorageTargets](../interfaces/IDefaultStorageTargets.md)&gt;

Success with updated targets, or Failure
