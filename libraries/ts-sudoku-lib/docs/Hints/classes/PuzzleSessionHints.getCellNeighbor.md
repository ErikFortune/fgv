[Home](../../README.md) > [Hints](../README.md) > [PuzzleSessionHints](./PuzzleSessionHints.md) > getCellNeighbor

## PuzzleSessionHints.getCellNeighbor() method

Gets a cell neighbor.

**Signature:**

```typescript
getCellNeighbor(spec: string | IRowColumn | ICell, direction: NavigationDirection, wrap: NavigationWrap): Result<ICell>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>string | IRowColumn | ICell</td><td>Cell specification</td></tr>
<tr><td>direction</td><td>NavigationDirection</td><td>Navigation direction</td></tr>
<tr><td>wrap</td><td>NavigationWrap</td><td>Wrap behavior</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ICell](../../interfaces/ICell.md)&gt;

Result containing neighbor cell
