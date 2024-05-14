<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-sudoku-lib](./ts-sudoku-lib.md) &gt; [PuzzleSession](./ts-sudoku-lib.puzzlesession.md) &gt; [updateCells](./ts-sudoku-lib.puzzlesession.updatecells.md)

## PuzzleSession.updateCells() method

Updates value &amp; notes for multiple cells.

**Signature:**

```typescript
updateCells(updates: ICellState[]): Result<this>;
```

## Parameters

<table><thead><tr><th>

Parameter


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

updates


</td><td>

[ICellState](./ts-sudoku-lib.icellstate.md)<!-- -->\[\]


</td><td>

An array of [cell state](./ts-sudoku-lib.icellstate.md) objects, each describing one cell to be updated.


</td></tr>
</tbody></table>
**Returns:**

Result&lt;this&gt;

`Success` with `this` if the updates are applied, `Failure` with details if an error occurs.
