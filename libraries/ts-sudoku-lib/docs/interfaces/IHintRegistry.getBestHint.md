[Home](../README.md) > [IHintRegistry](./IHintRegistry.md) > getBestHint

## IHintRegistry.getBestHint() method

Gets the best available hint based on difficulty and confidence.

**Signature:**

```typescript
getBestHint(puzzle: Puzzle, state: PuzzleState, options?: IHintGenerationOptions): Result<IHint>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>puzzle</td><td>Puzzle</td><td>The puzzle structure containing constraints</td></tr>
<tr><td>state</td><td>PuzzleState</td><td>The current puzzle state</td></tr>
<tr><td>options</td><td>IHintGenerationOptions</td><td>Optional generation options</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IHint](IHint.md)&gt;

Result containing the best hint, or failure if no hints available
