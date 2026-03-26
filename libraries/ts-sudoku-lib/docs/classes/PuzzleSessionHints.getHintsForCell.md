[Home](../README.md) > [PuzzleSessionHints](./PuzzleSessionHints.md) > getHintsForCell

## PuzzleSessionHints.getHintsForCell() method

Gets hints that specifically affect a given cell.

**Signature:**

```typescript
getHintsForCell(spec: string | IRowColumn | ICell, options?: IHintGenerationOptions): Result<readonly IHint[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>string | IRowColumn | ICell</td><td>Cell specification (ID, row/column, or cell object)</td></tr>
<tr><td>options</td><td>IHintGenerationOptions</td><td>Optional hint generation options</td></tr>
</tbody></table>

**Returns:**

Result&lt;readonly [IHint](../interfaces/IHint.md)[]&gt;

Result containing hints affecting the specified cell
