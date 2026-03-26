[Home](../README.md) > [HintSystem](./HintSystem.md) > getHintStatistics

## HintSystem.getHintStatistics() method

Gets statistics about available hints for the current state.

**Signature:**

```typescript
getHintStatistics(puzzle: Puzzle, state: PuzzleState): Result<{ totalHints: number; hintsByTechnique: Map<string, number>; hintsByDifficulty: Map<string, number> }>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>puzzle</td><td>Puzzle</td><td>The puzzle structure containing constraints</td></tr>
<tr><td>state</td><td>PuzzleState</td><td>The current puzzle state</td></tr>
</tbody></table>

**Returns:**

Result&lt;{ totalHints: number; hintsByTechnique: Map&lt;string, number&gt;; hintsByDifficulty: Map&lt;string, number&gt; }&gt;

Result containing hint statistics
