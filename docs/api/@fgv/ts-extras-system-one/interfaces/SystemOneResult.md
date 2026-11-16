[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-system-one](../README.md) / SystemOneResult

# Interface: SystemOneResult\<Q\>

Answers keyed by question name, with model and usage metadata.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-q"></a> `Q` *extends* [`Questions`](Questions.md) |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-answers"></a> `answers` | `readonly` | \{ readonly \[K in string \| number \| symbol\]: ResultFor\<Q\[K\]\> \} | Answers with types inferred from the supplied questions. |
| <a id="property-model"></a> `model` | `readonly` | `string` | The model used to answer the request. |
| <a id="property-usage"></a> `usage` | `readonly` | [`Usage`](Usage.md) | Token usage for the request. |
