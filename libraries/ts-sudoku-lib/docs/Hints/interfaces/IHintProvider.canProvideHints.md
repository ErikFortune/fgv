[Home](../../README.md) > [Hints](../README.md) > [IHintProvider](./IHintProvider.md) > canProvideHints

## IHintProvider.canProvideHints() method

Determines if this provider can potentially generate hints for the given puzzle.
This should be a fast check to avoid expensive hint generation when not applicable.

**Signature:**

```typescript
canProvideHints(puzzle: Puzzle, state: PuzzleState): boolean;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>puzzle</td><td>Puzzle</td><td>The puzzle structure containing constraints</td></tr>
<tr><td>state</td><td>PuzzleState</td><td>The current puzzle state</td></tr>
</tbody></table>

**Returns:**

boolean

true if this provider might be able to generate hints
