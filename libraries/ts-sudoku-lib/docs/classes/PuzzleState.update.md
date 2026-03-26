[Home](../README.md) > [PuzzleState](./PuzzleState.md) > update

## PuzzleState.update() method

Creates a new PuzzleState | PuzzleState which corresponds
to this state with updates applied.

**Signature:**

```typescript
update(updates: ICellState[]): Result<PuzzleState>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>updates</td><td>ICellState[]</td><td>An array of ICellState | CellState to be
applied.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PuzzleState](PuzzleState.md)&gt;

A new PuzzleState with updates applied.
