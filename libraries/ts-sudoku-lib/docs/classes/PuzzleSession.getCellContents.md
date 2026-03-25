[Home](../README.md) > [PuzzleSession](./PuzzleSession.md) > getCellContents

## PuzzleSession.getCellContents() method

Gets the ICellContents | contents for a specified cell.

**Signature:**

```typescript
getCellContents(spec: string | IRowColumn): Result<{ cell: ICell; contents: ICellContents }>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>string | IRowColumn</td><td>A `string` (CellId | CellId), IRowColumn | RowColumn or ICell | ICell
describing the cell to be queried.</td></tr>
</tbody></table>

**Returns:**

Result&lt;{ cell: [ICell](../interfaces/ICell.md); contents: [ICellContents](../interfaces/ICellContents.md) }&gt;

`Success` with the ICell | cell description and ICellContents | cell contents, or
`Failure` with details if an error occurs.
