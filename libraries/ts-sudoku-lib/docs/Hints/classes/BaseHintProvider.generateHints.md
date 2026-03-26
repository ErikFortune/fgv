[Home](../../README.md) > [Hints](../README.md) > [BaseHintProvider](./BaseHintProvider.md) > generateHints

## BaseHintProvider.generateHints() method

Abstract method to be implemented by concrete providers.
Generates all possible hints using this technique for the given puzzle.

**Signature:**

```typescript
generateHints(puzzle: Puzzle, state: PuzzleState, options?: IHintGenerationOptions): Result<readonly IHint[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>puzzle</td><td>Puzzle</td><td></td></tr>
<tr><td>state</td><td>PuzzleState</td><td></td></tr>
<tr><td>options</td><td>IHintGenerationOptions</td><td></td></tr>
</tbody></table>

**Returns:**

Result&lt;readonly [IHint](../../interfaces/IHint.md)[]&gt;
