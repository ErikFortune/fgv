[Home](../../README.md) > [LibraryRuntime](../README.md) > [ProducedConfectionBase](./ProducedConfectionBase.md) > setDecoration

## ProducedConfectionBase.setDecoration() method

Sets the decoration.
Pushes current state to undo before change, clears redo.

**Signature:**

```typescript
setDecoration(id: DecorationId | undefined): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>DecorationId | undefined</td><td>Decoration ID or undefined to clear</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure
