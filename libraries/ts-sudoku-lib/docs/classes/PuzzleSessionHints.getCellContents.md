[Home](../README.md) > [PuzzleSessionHints](./PuzzleSessionHints.md) > getCellContents

## PuzzleSessionHints.getCellContents() method

Gets cell contents.

**Signature:**

```typescript
getCellContents(spec: string | IRowColumn): Result<{ cell: ICell; contents: ICellContents }>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>string | IRowColumn</td><td>Cell specification</td></tr>
</tbody></table>

**Returns:**

Result&lt;{ cell: [ICell](../interfaces/ICell.md); contents: [ICellContents](../interfaces/ICellContents.md) }&gt;

Result containing cell and contents
