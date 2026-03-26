[Home](../README.md) > [PuzzleSessionHints](./PuzzleSessionHints.md) > create

## PuzzleSessionHints.create() method

Creates a new PuzzleSessionHints wrapper for an existing PuzzleSession.

**Signature:**

```typescript
static create(session: PuzzleSession, config?: IPuzzleSessionHintsConfig): Result<PuzzleSessionHints>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>session</td><td>PuzzleSession</td><td>The PuzzleSession to wrap</td></tr>
<tr><td>config</td><td>IPuzzleSessionHintsConfig</td><td>Optional configuration for the hint system</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PuzzleSessionHints](PuzzleSessionHints.md)&gt;

Result containing the new PuzzleSessionHints wrapper
