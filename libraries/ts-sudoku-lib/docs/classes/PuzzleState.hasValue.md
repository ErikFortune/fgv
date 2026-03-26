[Home](../README.md) > [PuzzleState](./PuzzleState.md) > hasValue

## PuzzleState.hasValue() method

Determines if some cell has an assigned value.

**Signature:**

```typescript
hasValue(id: CellId): boolean;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>CellId</td><td>The CellId | id of the cell to be tested.</td></tr>
</tbody></table>

**Returns:**

boolean

`true` if the cell has a value, `false` if the cell
is empty or invalid.
