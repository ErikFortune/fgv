[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / schemaOptions

# Function: schemaOptions()

> **schemaOptions**\<`T`\>(`opts`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ValidatedSchemaOptions`](../classes/ValidatedSchemaOptions.md)\<`T`\>\>

Checks the annotations every node carries and returns them as
`validated options` — the way to give a node a
`default` or `examples`.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` *extends* [`IObjectSchemaOptions`](../interfaces/IObjectSchemaOptions.md) |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | `T` & `Record`\<`Exclude`\<keyof `T`, keyof [`IObjectSchemaOptions`](../interfaces/IObjectSchemaOptions.md)\>, `never`\> | The options to check. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ValidatedSchemaOptions`](../classes/ValidatedSchemaOptions.md)\<`T`\>\>

The validated options, or a `Failure` naming the keyword.

## Remarks

`default` and each member of `examples` must be JSON values; neither is checked against the node.
The result is accepted by every factory that takes plain options (`boolean`, `enumOf`, `array`,
`object`, `record`, `anyValue`), and `additionalProperties` is carried for `object`. A key that
is not an option is a compile error, and `nullable: true` keeps its literal type, so the
factory's nullable overload still applies.

## Example

```ts
const flag = JsonSchema.boolean(JsonSchema.schemaOptions({ default: false }).shouldNotFail('flag default'));
```
