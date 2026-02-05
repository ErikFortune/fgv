[Home](../../README.md) > [LibraryRuntime](../README.md) > [ProducedFilling](./ProducedFilling.md) > removeIngredient

## ProducedFilling.removeIngredient() method

Removes an ingredient.
Pushes current state to undo before change, clears redo.

**Signature:**

```typescript
removeIngredient(id: IngredientId): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>IngredientId</td><td>Ingredient ID to remove</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure
