<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-sudoku-lib](./ts-sudoku-lib.md) &gt; [PuzzleCollection](./ts-sudoku-lib.puzzlecollection.md) &gt; [create](./ts-sudoku-lib.puzzlecollection.create.md)

## PuzzleCollection.create() method

Creates a new puzzle from a loaded 

**Signature:**

```typescript
static create(from: FileData.Model.IPuzzlesFile): Result<PuzzleCollection>;
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

from


</td><td>

[FileData.Model.IPuzzlesFile](./ts-sudoku-lib.file_2.model.ipuzzlesfile.md)


</td><td>

The  to be loaded.


</td></tr>
</tbody></table>
**Returns:**

Result&lt;[PuzzleCollection](./ts-sudoku-lib.puzzlecollection.md)<!-- -->&gt;

`Success` with the resulting [PuzzleCollection](./ts-sudoku-lib.puzzlecollection.md) or `Failure` with details if an error occurs.
