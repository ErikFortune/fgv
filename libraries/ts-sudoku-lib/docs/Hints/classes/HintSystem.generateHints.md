[Home](../../README.md) > [Hints](../README.md) > [HintSystem](./HintSystem.md) > generateHints

## HintSystem.generateHints() method

Generates all available hints for the current puzzle state.

**Signature:**

```typescript
generateHints(puzzle: Puzzle, state: PuzzleState, options?: IHintGenerationOptions): Result<readonly IHint[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>puzzle</td><td>Puzzle</td><td>The puzzle structure containing constraints</td></tr>
<tr><td>state</td><td>PuzzleState</td><td>The current puzzle state</td></tr>
<tr><td>options</td><td>IHintGenerationOptions</td><td>Optional generation options</td></tr>
</tbody></table>

**Returns:**

Result&lt;readonly [IHint](../../interfaces/IHint.md)[]&gt;

Result containing array of hints
