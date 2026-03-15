[Home](../README.md) > [EditedIngredient](./EditedIngredient.md) > applyUpdate

## EditedIngredient.applyUpdate() method

Applies a partial update to the current entity.
This is useful for bulk field updates or category-specific field changes.
Pushes current state to undo before change, clears redo.

**Signature:**

```typescript
applyUpdate(update: Partial<IngredientEntity>): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>update</td><td>Partial&lt;IngredientEntity&gt;</td><td>Partial entity fields to merge</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success
