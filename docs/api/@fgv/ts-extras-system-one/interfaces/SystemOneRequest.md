[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / SystemOneRequest

# Interface: SystemOneRequest\<Q\>

State and named questions for `systemOne`.

Additional properties on a request variable are forwarded, including `null` values.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-q"></a> `Q` *extends* [`Questions`](Questions.md) | [`Questions`](Questions.md) |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-model"></a> `model?` | `string` | Model override; omitted values inherit `defaultModel`. |
| <a id="property-questions"></a> `questions` | `Q` | Nonempty questions keyed by the names used to identify their answers. |
| <a id="property-state"></a> `state` | [`EntryType`](../type-aliases/EntryType.md) | Text, a JSON object or array, or `null` to evaluate. |
