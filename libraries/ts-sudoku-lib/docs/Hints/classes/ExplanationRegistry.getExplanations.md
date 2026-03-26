[Home](../../README.md) > [Hints](../README.md) > [ExplanationRegistry](./ExplanationRegistry.md) > getExplanations

## ExplanationRegistry.getExplanations() method

Gets explanations for a specific hint.

**Signature:**

```typescript
getExplanations(hint: IHint, puzzle: Puzzle, state: PuzzleState): Result<readonly IHintExplanation[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>hint</td><td>IHint</td><td>The hint to explain</td></tr>
<tr><td>puzzle</td><td>Puzzle</td><td>The puzzle structure containing constraints</td></tr>
<tr><td>state</td><td>PuzzleState</td><td>The puzzle state context</td></tr>
</tbody></table>

**Returns:**

Result&lt;readonly [IHintExplanation](../../interfaces/IHintExplanation.md)[]&gt;

Result containing the explanations
