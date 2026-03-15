[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditedConfectionRecipe](./EditedConfectionRecipe.md) > setVariationMolds

## EditedConfectionRecipe.setVariationMolds() method

Sets the molds specification on a molded bon-bon variation.

**Signature:**

```typescript
setVariationMolds(spec: ConfectionRecipeVariationSpec, molds: IOptionsWithPreferred<IConfectionMoldRef, MoldId>): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>ConfectionRecipeVariationSpec</td><td>Variation spec to update</td></tr>
<tr><td>molds</td><td>IOptionsWithPreferred&lt;IConfectionMoldRef, MoldId&gt;</td><td>New molds entity with options and preferred selection</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure if spec not found or not a molded bon-bon
