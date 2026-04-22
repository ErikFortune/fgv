[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-sudoku-ui](../README.md) / usePuzzleSession

# Function: usePuzzleSession()

> **usePuzzleSession**(`initialPuzzleDescription?`): `object`

Hook for managing puzzle session state and operations

## Parameters

| Parameter | Type |
| ------ | ------ |
| `initialPuzzleDescription?` | `IPuzzleDefinition` |

## Returns

`object`

| Name | Type |
| ------ | ------ |
| `cageDisplayInfo` | [`ICageDisplayInfo`](../interfaces/ICageDisplayInfo.md)[] |
| `canRedo` | `boolean` |
| `canUndo` | `boolean` |
| `cellDisplayInfo` | [`ICellDisplayInfo`](../interfaces/ICellDisplayInfo.md)[] |
| `clearCellNotes()` | (`cellId`) => `void` |
| `error` | `string` \| `null` |
| `exportPuzzle()` | () => `IPuzzleDefinition` \| `null` |
| `inputMode` | `InputMode` |
| `isSolved` | `boolean` |
| `isValid` | `boolean` |
| `navigateToCell()` | (`direction`, `wrap?`) => `void` |
| `redo()` | () => `void` |
| `reset()` | () => `void` |
| `selectedCell` | `CellId` \| `null` |
| `selectedCells` | `CellId`[] |
| `session` | `PuzzleSession` \| `null` |
| `setInputMode()` | (`mode`) => `void` |
| `setSelectedCell()` | (`cell`) => `void` |
| `setSelectedCells()` | (`cells`) => `void` |
| `toggleCellNote()` | (`cellId`, `note`) => `void` |
| `undo()` | () => `void` |
| `updateCellValue()` | (`cellId`, `value`) => `void` |
| `validationErrors` | [`IValidationError`](../interfaces/IValidationError.md)[] |
