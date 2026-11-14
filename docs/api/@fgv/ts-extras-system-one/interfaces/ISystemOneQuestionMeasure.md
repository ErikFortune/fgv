[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / ISystemOneQuestionMeasure

# Interface: ISystemOneQuestionMeasure

The measured lengths for one question.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-criteria"></a> `criteria` | `readonly` | readonly [`ISystemOneCriterionMeasure`](ISystemOneCriterionMeasure.md)[] | One entry per candidate, in the order the backend embeds them. |
| <a id="property-questionid"></a> `questionId` | `readonly` | `string` | - |
| <a id="property-stateandinstructions"></a> `stateAndInstructions` | `readonly` | `number` | The state, the two-character separator and the instructions. |
