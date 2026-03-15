[Home](../README.md) > [EditedConfectionRecipe](./EditedConfectionRecipe.md) > setVariationCoatings

## EditedConfectionRecipe.setVariationCoatings() method

Sets the coatings specification on a rolled truffle variation.

**Signature:**

```typescript
setVariationCoatings(spec: ConfectionRecipeVariationSpec, coatings: ICoatingsEntity | undefined): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>ConfectionRecipeVariationSpec</td><td>Variation spec to update</td></tr>
<tr><td>coatings</td><td>ICoatingsEntity | undefined</td><td>New coatings entity, or undefined to clear</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure if spec not found or not a rolled truffle
