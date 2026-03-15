[Home](../../README.md) > [LibraryRuntime](../README.md) > [ProducedRolledTruffle](./ProducedRolledTruffle.md) > setCoating

## ProducedRolledTruffle.setCoating() method

Sets the coating.
Pushes current state to undo before change, clears redo.

**Signature:**

```typescript
setCoating(coatingId: IngredientId | undefined): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>coatingId</td><td>IngredientId | undefined</td><td>Coating ingredient ID or undefined to clear</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure
