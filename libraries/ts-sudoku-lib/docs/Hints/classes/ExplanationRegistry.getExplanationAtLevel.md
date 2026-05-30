[Home](../../README.md) > [Hints](../README.md) > [ExplanationRegistry](./ExplanationRegistry.md) > getExplanationAtLevel

## ExplanationRegistry.getExplanationAtLevel() method

Gets a specific explanation at the requested level.

**Signature:**

```typescript
getExplanationAtLevel(hint: IHint, level: ExplanationLevel, puzzle: Puzzle, state: PuzzleState): Result<IHintExplanation>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>hint</td><td>IHint</td><td>The hint to explain</td></tr>
<tr><td>level</td><td>ExplanationLevel</td><td>The desired explanation level</td></tr>
<tr><td>puzzle</td><td>Puzzle</td><td></td></tr>
<tr><td>state</td><td>PuzzleState</td><td>The puzzle state context</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IHintExplanation](../../interfaces/IHintExplanation.md)&gt;

Result containing the explanation at the specified level
