[Home](../README.md) > [PuzzleSession](./PuzzleSession.md) > updateCells

## PuzzleSession.updateCells() method

Updates value & notes for multiple cells.

**Signature:**

```typescript
updateCells(updates: ICellState[]): Result<PuzzleSession>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>updates</td><td>ICellState[]</td><td>An array of ICellState | cell state objects, each describing
one cell to be updated.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PuzzleSession](PuzzleSession.md)&gt;

`Success` with `this` if the updates are applied, `Failure` with details if
an error occurs.
