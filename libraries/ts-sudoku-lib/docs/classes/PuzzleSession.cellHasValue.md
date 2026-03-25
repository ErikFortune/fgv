[Home](../README.md) > [PuzzleSession](./PuzzleSession.md) > cellHasValue

## PuzzleSession.cellHasValue() method

Determines if a cell has a value.

**Signature:**

```typescript
cellHasValue(spec: string | IRowColumn | ICell): boolean;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>string | IRowColumn | ICell</td><td>A `string` (CellId | CellId), IRowColumn | RowColumn or ICell | ICell
describing the cell to be tested.</td></tr>
</tbody></table>

**Returns:**

boolean

`true` if the cell has a value, `false` if the cell is empty or the cell itself is invalid.
