[Home](../README.md) > [PuzzleDefinitionFactory](./PuzzleDefinitionFactory.md) > createKiller

## PuzzleDefinitionFactory.createKiller() method

Create killer sudoku puzzle definition with cage constraints

**Signature:**

```typescript
static createKiller(dimensions: IPuzzleDimensions, description: Omit<IPuzzleDefinition, "totalRows" | "totalColumns" | "maxValue" | "totalCages" | "basicCageTotal" | "cages" | "cageWidthInCells" | "cageHeightInCells" | "boardWidthInCages" | "boardHeightInCages"> & { killerCages: { id: string; cellPositions: { row: number; col: number }[]; sum: number }[] }): Result<IPuzzleDefinition>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>dimensions</td><td>IPuzzleDimensions</td><td></td></tr>
<tr><td>description</td><td>Omit&lt;IPuzzleDefinition, "totalRows" | "totalColumns" | "maxValue" | "totalCages" | "basicCageTotal" | "cages" | "cageWidthInCells" | "cageHeightInCells" | "boardWidthInCages" | "boardHeightInCages"&gt; &amp; { killerCages: { id: string; cellPositions: { row: number; col: number }[]; sum: number }[] }</td><td></td></tr>
</tbody></table>

**Returns:**

Result&lt;[IPuzzleDefinition](../interfaces/IPuzzleDefinition.md)&gt;
