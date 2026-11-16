[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / ChoiceResponse

# Interface: ChoiceResponse\<T\>

A selected label and its probabilities.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` *extends* [`ChoiceCriteria`](../type-aliases/ChoiceCriteria.md) | [`ChoiceCriteria`](../type-aliases/ChoiceCriteria.md) |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-choice"></a> `choice` | `readonly` | keyof `T` & `string` | The selected label. |
| <a id="property-confidence"></a> `confidence` | `readonly` | `number` | Reported confidence in the selected label. |
| <a id="property-probabilities"></a> `probabilities` | `readonly` | \{ readonly \[label in string \| number \| symbol\]: number \} | Probabilities keyed by label. |
| <a id="property-type"></a> `type` | `readonly` | `"choice"` | - |
