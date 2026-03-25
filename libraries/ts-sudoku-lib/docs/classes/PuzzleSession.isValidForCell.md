[Home](../README.md) > [PuzzleSession](./PuzzleSession.md) > isValidForCell

## PuzzleSession.isValidForCell() method

Determines if supplied value is valid for a specific cell.

**Signature:**

```typescript
isValidForCell(spec: string | IRowColumn | ICell, value: number): boolean;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>string | IRowColumn | ICell</td><td>A `string` (CellId | CellId), IRowColumn | RowColumn or ICell | ICell
describing the cell to be tested.</td></tr>
<tr><td>value</td><td>number</td><td>The value to be tested.</td></tr>
</tbody></table>

**Returns:**

boolean

`true` if `value` is valid for the requested cell, `false` if the value or the cell itself is invalid.
