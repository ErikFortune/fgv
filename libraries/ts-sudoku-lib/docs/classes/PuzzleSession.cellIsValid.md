[Home](../README.md) > [PuzzleSession](./PuzzleSession.md) > cellIsValid

## PuzzleSession.cellIsValid() method

Determines if a cell is valid.

**Signature:**

```typescript
cellIsValid(spec: string | IRowColumn | ICell): boolean;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>string | IRowColumn | ICell</td><td>A `string` (CellId | CellId), IRowColumn | RowColumn or ICell | ICell
describing the cell to be tested.</td></tr>
</tbody></table>

**Returns:**

boolean

`true` if the cell value is valid, `false` if the cell value or the cell itself is invalid.
