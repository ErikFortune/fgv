[Home](../README.md) > [PuzzleSessionHints](./PuzzleSessionHints.md) > applyHint

## PuzzleSessionHints.applyHint() method

Applies a hint to the puzzle, updating the state and adding to undo history.

**Signature:**

```typescript
applyHint(hint: IHint): Result<PuzzleSessionHints>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>hint</td><td>IHint</td><td>The hint to apply</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PuzzleSessionHints](PuzzleSessionHints.md)&gt;

Result with this instance if successful
