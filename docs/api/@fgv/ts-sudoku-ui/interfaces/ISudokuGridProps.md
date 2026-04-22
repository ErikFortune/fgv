[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-sudoku-ui](../README.md) / ISudokuGridProps

# Interface: ISudokuGridProps

Props for the SudokuGrid component

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="cages"></a> `cages?` | `readonly` | [`ICageDisplayInfo`](ICageDisplayInfo.md)[] |
| <a id="cells"></a> `cells` | `readonly` | [`ICellDisplayInfo`](ICellDisplayInfo.md)[] |
| <a id="classname"></a> `className?` | `readonly` | `string` |
| <a id="inputmode"></a> `inputMode` | `readonly` | `InputMode` |
| <a id="isdragging"></a> `isDragging?` | `readonly` | `boolean` |
| <a id="numcolumns"></a> `numColumns` | `readonly` | `number` |
| <a id="numrows"></a> `numRows` | `readonly` | `number` |
| <a id="oncellselect"></a> `onCellSelect` | `readonly` | (`cellId`, `event?`) => `void` |
| <a id="oncellvaluechange"></a> `onCellValueChange` | `readonly` | (`cellId`, `value`) => `void` |
| <a id="onclearallnotes"></a> `onClearAllNotes` | `readonly` | (`cellId`) => `void` |
| <a id="ondragend"></a> `onDragEnd?` | `readonly` | () => `void` |
| <a id="ondragover"></a> `onDragOver?` | `readonly` | (`cellId`) => `void` |
| <a id="onlongpresstoggle"></a> `onLongPressToggle?` | `readonly` | (`cellId`, `event`) => `void` |
| <a id="onnavigate"></a> `onNavigate` | `readonly` | (`direction`) => `void` |
| <a id="onnotetoggle"></a> `onNoteToggle` | `readonly` | (`cellId`, `note`) => `void` |
| <a id="puzzledimensions"></a> `puzzleDimensions?` | `readonly` | `object` |
| `puzzleDimensions.basicCageTotal` | `readonly` | `number` |
| `puzzleDimensions.boardHeightInCages` | `readonly` | `number` |
| `puzzleDimensions.boardWidthInCages` | `readonly` | `number` |
| `puzzleDimensions.cageHeightInCells` | `readonly` | `number` |
| `puzzleDimensions.cageWidthInCells` | `readonly` | `number` |
| `puzzleDimensions.maxValue` | `readonly` | `number` |
| `puzzleDimensions.totalCages` | `readonly` | `number` |
| `puzzleDimensions.totalColumns` | `readonly` | `number` |
| `puzzleDimensions.totalRows` | `readonly` | `number` |
| <a id="puzzletype"></a> `puzzleType?` | `readonly` | `string` |
| <a id="selectedcell"></a> `selectedCell` | `readonly` | `CellId` \| `null` |
| <a id="selectedcells"></a> `selectedCells` | `readonly` | `CellId`[] |
