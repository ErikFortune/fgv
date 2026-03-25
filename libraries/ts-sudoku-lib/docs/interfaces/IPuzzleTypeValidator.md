[**@fgv/ts-sudoku-lib**](../README.md)

***

[@fgv/ts-sudoku-lib](../README.md) / IPuzzleTypeValidator

# Interface: IPuzzleTypeValidator

Interface for puzzle type-specific validation

## Methods

### validateCells()

> **validateCells**(`cells`, `dimensions`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`true`\>

Validate the cells string for this puzzle type

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `cells` | `string` |
| `dimensions` | [`IPuzzleDimensions`](IPuzzleDimensions.md) |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`true`\>
