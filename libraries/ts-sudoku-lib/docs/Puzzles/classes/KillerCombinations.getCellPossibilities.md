[Home](../../README.md) > [Puzzles](../README.md) > [KillerCombinations](./KillerCombinations.md) > getCellPossibilities

## KillerCombinations.getCellPossibilities() method

Determines possible values for each cell in a killer cage based on current puzzle state.

Analyzes the current state of the puzzle and cage to determine which values
are possible for each empty cell, considering both killer cage constraints
and standard sudoku constraints (row, column, section uniqueness).

**Signature:**

```typescript
static getCellPossibilities(puzzle: Puzzle, state: PuzzleState, cage: ICage): Result<Map<CellId, number[]>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>puzzle</td><td>Puzzle</td><td>The puzzle instance</td></tr>
<tr><td>state</td><td>PuzzleState</td><td>Current puzzle state</td></tr>
<tr><td>cage</td><td>ICage</td><td>The killer cage to analyze (must be of type 'killer')</td></tr>
</tbody></table>

**Returns:**

Result&lt;Map&lt;[CellId](../../type-aliases/CellId.md), number[]&gt;&gt;

Result containing map of CellId to possible number arrays
