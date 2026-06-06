[Home](../../README.md) > [Hints](../README.md) > [HintSystem](./HintSystem.md) > validateHint

## HintSystem.validateHint() method

Validates that a hint can be applied to the current state.

**Signature:**

```typescript
validateHint(hint: IHint, puzzle: Puzzle, state: PuzzleState): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>hint</td><td>IHint</td><td>The hint to validate</td></tr>
<tr><td>puzzle</td><td>Puzzle</td><td>The puzzle structure containing constraints</td></tr>
<tr><td>state</td><td>PuzzleState</td><td>The current puzzle state</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Result indicating validation success or failure
