[Home](../../README.md) > [LibraryRuntime](../README.md) > [ProducedFilling](./ProducedFilling.md) > setNotes

## ProducedFilling.setNotes() method

Sets the notes.
Pushes current state to undo before change, clears redo.

**Signature:**

```typescript
setNotes(notes: ICategorizedNote[]): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>notes</td><td>ICategorizedNote[]</td><td>Categorized notes array</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure
