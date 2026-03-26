[Home](../README.md) > [PuzzleSession](./PuzzleSession.md) > create

## PuzzleSession.create() method

Creates a new PuzzleSession | puzzle session from a supplied
Puzzle | puzzle.

**Signature:**

```typescript
static create(puzzle: Puzzle): Result<PuzzleSession>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>puzzle</td><td>Puzzle</td><td>The Puzzle | puzzle from which the session is to be
initialized.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PuzzleSession](PuzzleSession.md)&gt;

`Success` with the requested PuzzleSession | puzzle session,
or `Failure` with details if an error occurs.
