[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditedConfectionRecipe](./EditedConfectionRecipe.md) > setVariationEnrobingChocolate

## EditedConfectionRecipe.setVariationEnrobingChocolate() method

Sets the enrobing chocolate specification on a rolled truffle or bar truffle variation.

**Signature:**

```typescript
setVariationEnrobingChocolate(spec: ConfectionRecipeVariationSpec, enrobingChocolate: IChocolateSpec | undefined): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>ConfectionRecipeVariationSpec</td><td>Variation spec to update</td></tr>
<tr><td>enrobingChocolate</td><td>IChocolateSpec | undefined</td><td>New enrobing chocolate spec, or undefined to clear</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure if spec not found or not an enrobable type
