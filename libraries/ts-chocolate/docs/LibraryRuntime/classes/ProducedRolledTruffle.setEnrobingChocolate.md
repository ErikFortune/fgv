[Home](../../README.md) > [LibraryRuntime](../README.md) > [ProducedRolledTruffle](./ProducedRolledTruffle.md) > setEnrobingChocolate

## ProducedRolledTruffle.setEnrobingChocolate() method

Sets the enrobing chocolate.
Pushes current state to undo before change, clears redo.

**Signature:**

```typescript
setEnrobingChocolate(chocolateId: IngredientId | undefined): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>chocolateId</td><td>IngredientId | undefined</td><td>Enrobing chocolate ingredient ID or undefined to clear</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure
