[Home](../README.md) > [PuzzleSession](./PuzzleSession.md) > updateCellNotes

## PuzzleSession.updateCellNotes() method

Updates the notes on a cell.

**Signature:**

```typescript
updateCellNotes(spec: string | IRowColumn | ICell, notes: number[]): Result<PuzzleSession>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>string | IRowColumn | ICell</td><td>A `string`, IRowColumn | row and column, or ICell | cell identifying
the cell to be updated.</td></tr>
<tr><td>notes</td><td>number[]</td><td>New notes for the cell.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PuzzleSession](PuzzleSession.md)&gt;

`Success` with `this` if the update is applied, `Failure` with details if an error occurs.
