[Home](../README.md) > [FillingRecipeVersion](./FillingRecipeVersion.md) > create

## FillingRecipeVersion.create() method

Factory method for creating a LibraryRuntime.RuntimeFillingRecipeVariation.

**Signature:**

```typescript
static create(context: VariationContext, fillingId: FillingId, variation: IFillingRecipeVariationEntity): Result<FillingRecipeVersion>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>VariationContext</td><td>The runtime context</td></tr>
<tr><td>fillingId</td><td>FillingId</td><td>The parent recipe ID</td></tr>
<tr><td>variation</td><td>IFillingRecipeVariationEntity</td><td>The data layer variation entity</td></tr>
</tbody></table>

**Returns:**

Result&lt;[FillingRecipeVersion](FillingRecipeVersion.md)&gt;

Success with LibraryRuntime.RuntimeFillingRecipeVariation
