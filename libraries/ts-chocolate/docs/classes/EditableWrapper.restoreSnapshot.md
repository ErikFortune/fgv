[Home](../README.md) > [EditableWrapper](./EditableWrapper.md) > restoreSnapshot

## EditableWrapper.restoreSnapshot() method

Restores state from a snapshot.
Pushes current state to undo stack and clears redo stack.

**Signature:**

```typescript
restoreSnapshot(snapshot: T): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>snapshot</td><td>T</td><td>Snapshot to restore</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success
