[Home](../../README.md) > [Hints](../README.md) > [HintSystem](./HintSystem.md) > hasHints

## HintSystem.hasHints() method

Checks if the puzzle state has any available hints.

**Signature:**

```typescript
hasHints(puzzle: Puzzle, state: PuzzleState): Result<boolean>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>puzzle</td><td>Puzzle</td><td>The puzzle structure containing constraints</td></tr>
<tr><td>state</td><td>PuzzleState</td><td>The current puzzle state</td></tr>
</tbody></table>

**Returns:**

Result&lt;boolean&gt;

Result containing boolean indicating if hints are available
