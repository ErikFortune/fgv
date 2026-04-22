[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-sudoku-lib](../../../README.md) / [Puzzles](../README.md) / IKillerConstraints

# Interface: IKillerConstraints

Constraints that can be applied when generating killer cage combinations.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="excludednumbers"></a> `excludedNumbers?` | `readonly` | readonly `number`[] | Numbers that cannot be present in the combination. Must be unique values between 1-9. |
| <a id="requirednumbers"></a> `requiredNumbers?` | `readonly` | readonly `number`[] | Numbers that must be present in the combination. Must be unique values between 1-9. |
