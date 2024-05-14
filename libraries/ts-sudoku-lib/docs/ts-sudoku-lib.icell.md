<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-sudoku-lib](./ts-sudoku-lib.md) &gt; [ICell](./ts-sudoku-lib.icell.md)

## ICell interface

Describes the structure of a single cell in a [puzzle](./ts-sudoku-lib.puzzlesession.md)<!-- -->. Does not describe state.

**Signature:**

```typescript
export interface ICell 
```

## Properties

<table><thead><tr><th>

Property


</th><th>

Modifiers


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[cages](./ts-sudoku-lib.icell.cages.md)


</td><td>

`readonly`


</td><td>

readonly [ICage](./ts-sudoku-lib.icage.md)<!-- -->\[\]


</td><td>

All of the [cages](./ts-sudoku-lib.icage.md) to which this cell belongs.


</td></tr>
<tr><td>

[col](./ts-sudoku-lib.icell.col.md)


</td><td>

`readonly`


</td><td>

number


</td><td>

Column number of the cell.


</td></tr>
<tr><td>

[id](./ts-sudoku-lib.icell.id.md)


</td><td>

`readonly`


</td><td>

[CellId](./ts-sudoku-lib.cellid.md)


</td><td>

Unique identifier for the cell.


</td></tr>
<tr><td>

[immutable](./ts-sudoku-lib.icell.immutable.md)


</td><td>

`readonly`


</td><td>

boolean


</td><td>

Indicates whether this cell is a given value (immutable).


</td></tr>
<tr><td>

[immutableValue?](./ts-sudoku-lib.icell.immutablevalue.md)


</td><td>

`readonly`


</td><td>

number


</td><td>

_(Optional)_ Given value of this cell, or `undefined` if the cell is not immutable.


</td></tr>
<tr><td>

[row](./ts-sudoku-lib.icell.row.md)


</td><td>

`readonly`


</td><td>

number


</td><td>

Row number of the cell.


</td></tr>
</tbody></table>