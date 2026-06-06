[Home](../README.md) > [PuzzleCollection](./PuzzleCollection.md) > create

## PuzzleCollection.create() method

Creates a new puzzle from a loaded Files.Model.IPuzzlesFile | PuzzlesFile

**Signature:**

```typescript
static create(from: IPuzzlesFile): Result<PuzzleCollection>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>IPuzzlesFile</td><td>The Files.Model.IPuzzlesFile | puzzles file to be loaded.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[PuzzleCollection](PuzzleCollection.md)&gt;

`Success` with the resulting PuzzleCollection | PuzzleCollection
or `Failure` with details if an error occurs.
