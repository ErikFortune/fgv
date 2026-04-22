[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-sudoku-ui](../README.md) / ICompactControlRibbonProps

# Interface: ICompactControlRibbonProps

Props for the CompactControlRibbon component

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="canredo"></a> `canRedo` | `readonly` | `boolean` | Whether redo is available |
| <a id="canreset"></a> `canReset` | `readonly` | `boolean` | Whether reset is available |
| <a id="canshowcombinations"></a> `canShowCombinations?` | `readonly` | `boolean` | Whether combinations button should be enabled |
| <a id="canundo"></a> `canUndo` | `readonly` | `boolean` | Whether undo is available |
| <a id="classname"></a> `className?` | `readonly` | `string` | Additional CSS class name |
| <a id="issolved"></a> `isSolved` | `readonly` | `boolean` | Whether the puzzle is solved |
| <a id="isvalid"></a> `isValid` | `readonly` | `boolean` | Whether the puzzle is valid |
| <a id="oncombinations"></a> `onCombinations?` | `readonly` | () => `void` | Callback for combinations action |
| <a id="onexport"></a> `onExport` | `readonly` | () => `void` | Callback for export action |
| <a id="onredo"></a> `onRedo` | `readonly` | () => `void` | Callback for redo action |
| <a id="onreset"></a> `onReset` | `readonly` | () => `void` | Callback for reset action |
| <a id="onundo"></a> `onUndo` | `readonly` | () => `void` | Callback for undo action |
| <a id="showcombinations"></a> `showCombinations?` | `readonly` | `boolean` | Whether to show combinations button (for killer sudoku) |
| <a id="validationerrors"></a> `validationErrors` | `readonly` | readonly `object`[] | Validation errors for error count display |
