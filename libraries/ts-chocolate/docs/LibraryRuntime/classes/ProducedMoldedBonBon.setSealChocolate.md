[Home](../../README.md) > [LibraryRuntime](../README.md) > [ProducedMoldedBonBon](./ProducedMoldedBonBon.md) > setSealChocolate

## ProducedMoldedBonBon.setSealChocolate() method

Sets the seal chocolate.
Pushes current state to undo before change, clears redo.

**Signature:**

```typescript
setSealChocolate(chocolateId: IngredientId | undefined): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>chocolateId</td><td>IngredientId | undefined</td><td>Seal chocolate ingredient ID or undefined to clear</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure
