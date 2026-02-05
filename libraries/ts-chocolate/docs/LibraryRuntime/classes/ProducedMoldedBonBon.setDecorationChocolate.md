[Home](../../README.md) > [LibraryRuntime](../README.md) > [ProducedMoldedBonBon](./ProducedMoldedBonBon.md) > setDecorationChocolate

## ProducedMoldedBonBon.setDecorationChocolate() method

Sets the decoration chocolate.
Pushes current state to undo before change, clears redo.

**Signature:**

```typescript
setDecorationChocolate(chocolateId: IngredientId | undefined): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>chocolateId</td><td>IngredientId | undefined</td><td>Decoration chocolate ingredient ID or undefined to clear</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure
