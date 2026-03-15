[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditedDecoration](./EditedDecoration.md) > updateIngredient

## EditedDecoration.updateIngredient() method

Updates an ingredient at the specified index.

**Signature:**

```typescript
updateIngredient(index: number, update: Partial<IDecorationIngredientEntity>): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>index</td><td>number</td><td>Index of ingredient to update</td></tr>
<tr><td>update</td><td>Partial&lt;IDecorationIngredientEntity&gt;</td><td>Partial ingredient fields to merge</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure if index is out of bounds
