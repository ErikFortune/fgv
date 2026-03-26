[Home](../README.md) > [PuzzleState](./PuzzleState.md) > getCellContents

## PuzzleState.getCellContents() method

Gets the contents of a cell specified by CellId | id.

**Signature:**

```typescript
getCellContents(id: CellId): Result<ICellContents>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>CellId</td><td>The CellId | id of the cell to be retrieved.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ICellContents](../interfaces/ICellContents.md)&gt;

A ICellContents | CellContents with the contents of
the requested cell.
