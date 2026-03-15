[Home](../../README.md) > [Settings](../README.md) > [SettingsManager](./SettingsManager.md) > updateDefaultTargets

## SettingsManager.updateDefaultTargets() method

Updates the default collection targets (convenience method).

**Signature:**

```typescript
updateDefaultTargets(targets: Partial<IDefaultCollectionTargets>): Result<IDefaultCollectionTargets>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>targets</td><td>Partial&lt;IDefaultCollectionTargets&gt;</td><td>Partial default targets to merge</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IDefaultCollectionTargets](../../interfaces/IDefaultCollectionTargets.md)&gt;

Success with updated targets, or Failure
