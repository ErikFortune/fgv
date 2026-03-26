[Home](../README.md) > [HintSystem](./HintSystem.md) > applyHint

## HintSystem.applyHint() method

Applies a hint to generate cell state updates.

**Signature:**

```typescript
applyHint(hint: IHint, puzzle: Puzzle, state: PuzzleState): Result<readonly ICellState[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>hint</td><td>IHint</td><td>The hint to apply</td></tr>
<tr><td>puzzle</td><td>Puzzle</td><td>The puzzle structure containing constraints</td></tr>
<tr><td>state</td><td>PuzzleState</td><td>The current puzzle state</td></tr>
</tbody></table>

**Returns:**

Result&lt;readonly [ICellState](../interfaces/ICellState.md)[]&gt;

Result containing the cell updates
