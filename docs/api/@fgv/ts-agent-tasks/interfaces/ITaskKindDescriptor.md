[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskKindDescriptor

# Interface: ITaskKindDescriptor\<T\>

Registration of one `(kind, detailVersion)` pair.

## Remarks

`details` is the runtime converter and is authoritative for domain invariants — it is
what `convert`, `decode` and `encode` all run.

`detailSchema`, when present, is additionally the wire schema a model is offered.
**Registration does not check that the two agree**, and cannot: agreement is a claim
about every value, which no signature-level check can settle. It is a *fixture*
obligation — a registration's tests assert that the schema and the converter accept and
reject the same things, which is how the built-in kinds' agreement is established here.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-commands"></a> `commands?` | `readonly` | readonly [`ITaskCommandHandle`](ITaskCommandHandle.md)[] |
| <a id="property-details"></a> `details` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\> |
| <a id="property-detailschema"></a> `detailSchema?` | `readonly` | [`ISchemaValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`T`\> |
| <a id="property-detailversion"></a> `detailVersion` | `readonly` | `number` |
| <a id="property-encode"></a> `encode` | `readonly` | (`value`) => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\> |
| <a id="property-kind"></a> `kind` | `readonly` | [`TaskKind`](../type-aliases/TaskKind.md) |
