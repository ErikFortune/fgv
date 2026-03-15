[Home](../README.md) > [EditedConfectionRecipe](./EditedConfectionRecipe.md) > setVariationShellChocolate

## EditedConfectionRecipe.setVariationShellChocolate() method

Sets the shell chocolate specification on a molded bon-bon variation.

**Signature:**

```typescript
setVariationShellChocolate(spec: ConfectionRecipeVariationSpec, shellChocolate: IChocolateSpec): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>ConfectionRecipeVariationSpec</td><td>Variation spec to update</td></tr>
<tr><td>shellChocolate</td><td>IChocolateSpec</td><td>New shell chocolate spec (ids + preferredId)</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure if spec not found or not a molded bon-bon
