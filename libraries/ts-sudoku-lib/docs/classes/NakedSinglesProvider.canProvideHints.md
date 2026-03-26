[Home](../README.md) > [NakedSinglesProvider](./NakedSinglesProvider.md) > canProvideHints

## NakedSinglesProvider.canProvideHints() method

Determines if this provider can potentially generate hints for the given puzzle.
Always returns true since naked singles can potentially exist in any incomplete puzzle.

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

true if there are empty cells that might have naked singles
