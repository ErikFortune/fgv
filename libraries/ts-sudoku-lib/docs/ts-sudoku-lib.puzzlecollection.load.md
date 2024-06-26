<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-sudoku-lib](./ts-sudoku-lib.md) &gt; [PuzzleCollection](./ts-sudoku-lib.puzzlecollection.md) &gt; [load](./ts-sudoku-lib.puzzlecollection.load.md)

## PuzzleCollection.load() method

Creates a new puzzle from a JSON file.

**Signature:**

```typescript
static load(path: string): Result<PuzzleCollection>;
```

## Parameters

<table><thead><tr><th>

Parameter


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

path


</td><td>

string


</td><td>

path to the JSON file to be loaded.


</td></tr>
</tbody></table>
**Returns:**

Result&lt;[PuzzleCollection](./ts-sudoku-lib.puzzlecollection.md)<!-- -->&gt;

`Success` with the resulting [PuzzleCollection](./ts-sudoku-lib.puzzlecollection.md) or `Failure` with details if an error occurs.

