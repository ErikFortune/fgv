[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-sudoku-ui](../README.md) / IDualKeypadProps

# Interface: IDualKeypadProps

Props for the DualKeypad component

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="classname"></a> `className?` | `readonly` | `string` | Additional CSS class name |
| <a id="disabled"></a> `disabled?` | `readonly` | `boolean` | Whether the keypad is disabled |
| <a id="forcelayoutmode"></a> `forceLayoutMode?` | `readonly` | [`KeypadLayoutMode`](../type-aliases/KeypadLayoutMode.md) | Force a specific layout mode (overrides responsive detection) |
| <a id="hascellselection"></a> `hasCellSelection` | `readonly` | `boolean` | Whether any cells are selected |
| <a id="inputmode"></a> `inputMode` | `readonly` | `InputMode` | Current input mode |
| <a id="onclearnotes"></a> `onClearNotes` | `readonly` | () => `void` | Callback when clear notes is pressed |
| <a id="onclearvalues"></a> `onClearValues` | `readonly` | () => `void` | Callback when clear values is pressed |
| <a id="oninputmodechange"></a> `onInputModeChange` | `readonly` | (`mode`) => `void` | Callback when input mode changes |
| <a id="onnotepress"></a> `onNotePress` | `readonly` | (`number`) => `void` | Callback when a number is pressed for notes |
| <a id="onvaluepress"></a> `onValuePress` | `readonly` | (`number`) => `void` | Callback when a number is pressed for values |
| <a id="selectedcellcount"></a> `selectedCellCount` | `readonly` | `number` | Number of selected cells |
| <a id="showoverlaytoggle"></a> `showOverlayToggle?` | `readonly` | `boolean` | Whether to show the overlay toggle for desktop |
