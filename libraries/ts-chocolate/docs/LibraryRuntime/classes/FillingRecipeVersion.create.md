[Home](../../README.md) > [LibraryRuntime](../README.md) > [FillingRecipeVersion](./FillingRecipeVersion.md) > create

## FillingRecipeVersion.create() method

Factory method for creating a RuntimeFillingRecipeVersion.

**Signature:**

```typescript
static create(context: VersionContext, fillingId: FillingId, version: IFillingRecipeVersionEntity): Result<FillingRecipeVersion>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>VersionContext</td><td>The runtime context</td></tr>
<tr><td>fillingId</td><td>FillingId</td><td>The parent recipe ID</td></tr>
<tr><td>version</td><td>IFillingRecipeVersionEntity</td><td>The data layer version entity</td></tr>
</tbody></table>

**Returns:**

Result&lt;[FillingRecipeVersion](../../classes/FillingRecipeVersion.md)&gt;

Success with RuntimeFillingRecipeVersion
