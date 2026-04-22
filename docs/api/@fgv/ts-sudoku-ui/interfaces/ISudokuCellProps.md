[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-sudoku-ui](../README.md) / ISudokuCellProps

# Interface: ISudokuCellProps

Props for the SudokuCell component

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="cellinfo"></a> `cellInfo` | `readonly` | [`ICellDisplayInfo`](ICellDisplayInfo.md) |
| <a id="classname"></a> `className?` | `readonly` | `string` |
| <a id="inputmode"></a> `inputMode` | `readonly` | `InputMode` |
| <a id="isselected"></a> `isSelected` | `readonly` | `boolean` |
| <a id="onclearallnotes"></a> `onClearAllNotes` | `readonly` | () => `void` |
| <a id="ondragover"></a> `onDragOver?` | `readonly` | () => `void` |
| <a id="onlongpresstoggle"></a> `onLongPressToggle?` | `readonly` | (`event`) => `void` |
| <a id="onnotetoggle"></a> `onNoteToggle` | `readonly` | (`note`) => `void` |
| <a id="onselect"></a> `onSelect` | `readonly` | (`event?`) => `void` |
| <a id="onvaluechange"></a> `onValueChange` | `readonly` | (`value`) => `void` |
| <a id="puzzledimensions"></a> `puzzleDimensions?` | `readonly` | `object` |
| `puzzleDimensions.cageHeight` | `readonly` | `number` |
| `puzzleDimensions.cageWidth` | `readonly` | `number` |
| `puzzleDimensions.numColumns` | `readonly` | `number` |
| `puzzleDimensions.numRows` | `readonly` | `number` |
