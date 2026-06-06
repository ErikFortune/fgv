[Home](../README.md) > [PuzzleSession](./PuzzleSession.md) > updateCellValue

## PuzzleSession.updateCellValue() method

Updates the value of a cell.

**Signature:**

```typescript
updateCellValue(spec: string | IRowColumn | ICell, value: number | undefined): Result<PuzzleSession>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>string | IRowColumn | ICell</td><td>A `string`, IRowColumn | row and column, or ICell | cell identifying
the cell to be updated.</td></tr>
<tr><td>value</td><td>number | undefined</td><td>A new value for the cell.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PuzzleSession](PuzzleSession.md)&gt;

`Success` with `this` if the update is applied, `Failure` with details if an error occurs.
