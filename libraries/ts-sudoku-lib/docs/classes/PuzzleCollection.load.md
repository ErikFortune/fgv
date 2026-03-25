[Home](../README.md) > [PuzzleCollection](./PuzzleCollection.md) > load

## PuzzleCollection.load() method

Creates a new puzzle from a JSON file.

**Signature:**

```typescript
static load(file: IFileTreeFileItem): Result<PuzzleCollection>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>file</td><td>IFileTreeFileItem</td><td></td></tr>
</tbody></table>

**Returns:**

Result&lt;[PuzzleCollection](PuzzleCollection.md)&gt;

`Success` with the resulting PuzzleCollection | PuzzleCollection
or `Failure` with details if an error occurs.
