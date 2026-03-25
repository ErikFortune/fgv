[Home](../../README.md) > [Hints](../README.md) > [PuzzleSessionHints](./PuzzleSessionHints.md) > getHintStatistics

## PuzzleSessionHints.getHintStatistics() method

Gets statistics about available hints.

**Signature:**

```typescript
getHintStatistics(options?: IHintGenerationOptions): Result<{ totalHints: number; hintsByTechnique: Map<string, number>; hintsByDifficulty: Map<string, number> }>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>IHintGenerationOptions</td><td>Optional hint generation options</td></tr>
</tbody></table>

**Returns:**

Result&lt;{ totalHints: number; hintsByTechnique: Map&lt;string, number&gt;; hintsByDifficulty: Map&lt;string, number&gt; }&gt;

Result containing hint statistics
