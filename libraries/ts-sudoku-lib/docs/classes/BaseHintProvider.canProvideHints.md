[Home](../README.md) > [BaseHintProvider](./BaseHintProvider.md) > canProvideHints

## BaseHintProvider.canProvideHints() method

Abstract method to be implemented by concrete providers.
Determines if this provider can potentially generate hints for the given puzzle.

**Signature:**

```typescript
canProvideHints(puzzle: Puzzle, state: PuzzleState): boolean;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>puzzle</td><td>Puzzle</td><td></td></tr>
<tr><td>state</td><td>PuzzleState</td><td></td></tr>
</tbody></table>

**Returns:**

boolean
