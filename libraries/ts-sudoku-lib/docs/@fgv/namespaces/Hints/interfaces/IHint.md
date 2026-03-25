[**@fgv/ts-sudoku-lib**](../../../../README.md)

***

[@fgv/ts-sudoku-lib](../../../../README.md) / [Hints](../README.md) / IHint

# Interface: IHint

A complete hint with all necessary information for display and application.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="cellactions"></a> `cellActions` | `readonly` | readonly [`ICellAction`](ICellAction.md)[] |
| <a id="confidence"></a> `confidence` | `readonly` | [`ConfidenceLevel`](../type-aliases/ConfidenceLevel.md) |
| <a id="difficulty"></a> `difficulty` | `readonly` | [`DifficultyLevel`](../type-aliases/DifficultyLevel.md) |
| <a id="explanations"></a> `explanations` | `readonly` | readonly [`IHintExplanation`](IHintExplanation.md)[] |
| <a id="priority"></a> `priority` | `readonly` | `number` |
| <a id="relevantcells"></a> `relevantCells` | `readonly` | [`IRelevantCells`](IRelevantCells.md) |
| <a id="techniqueid"></a> `techniqueId` | `readonly` | [`TechniqueId`](../type-aliases/TechniqueId.md) |
| <a id="techniquename"></a> `techniqueName` | `readonly` | `string` |
