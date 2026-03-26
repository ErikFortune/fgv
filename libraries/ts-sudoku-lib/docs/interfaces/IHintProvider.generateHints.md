[Home](../README.md) > [IHintProvider](./IHintProvider.md) > generateHints

## IHintProvider.generateHints() method

Generates all possible hints using this technique for the given puzzle.

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

Result&lt;readonly [IHint](IHint.md)[]&gt;

Result containing array of hints, or failure if generation fails
