[Home](../README.md) > [PuzzleSession](./PuzzleSession.md) > getCellNeighbor

## PuzzleSession.getCellNeighbor() method

Gets the neighbor for a cell in a given direction using specified wrapping rules.

**Signature:**

```typescript
getCellNeighbor(spec: string | IRowColumn | ICell, direction: NavigationDirection, wrap: NavigationWrap): Result<ICell>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>string | IRowColumn | ICell</td><td>A `string` (CellId | CellId), IRowColumn | RowColumn or ICell | ICell
describing the cell to be tested.</td></tr>
<tr><td>direction</td><td>NavigationDirection</td><td>The direction of the desired neighbor.</td></tr>
<tr><td>wrap</td><td>NavigationWrap</td><td>Wrapping rules to be applied.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ICell](../interfaces/ICell.md)&gt;

`Success` with the requested ICell | cell, or `Failure` with details if an error occurs.
