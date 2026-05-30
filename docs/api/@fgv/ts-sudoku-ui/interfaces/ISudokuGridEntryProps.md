[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-sudoku-ui](../README.md) / ISudokuGridEntryProps

# Interface: ISudokuGridEntryProps

Props for the main SudokuGridEntry component

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="classname"></a> `className?` | `readonly` | `string` | Optional CSS class name for styling |
| <a id="forcelayoutmode"></a> `forceLayoutMode?` | `readonly` | [`KeypadLayoutMode`](../type-aliases/KeypadLayoutMode.md) | Optional forced layout mode for testing (overrides responsive detection) |
| <a id="initialpuzzledescription"></a> `initialPuzzleDescription?` | `readonly` | `IPuzzleDefinition` | Optional initial puzzle session to load. If not provided, an empty puzzle is created. |
| <a id="onstatechange"></a> `onStateChange?` | `readonly` | (`isValid`, `isSolved`) => `void` | Callback fired when the puzzle state changes |
| <a id="onvalidationerrors"></a> `onValidationErrors?` | `readonly` | (`errors`) => `void` | Callback fired when validation errors occur |
