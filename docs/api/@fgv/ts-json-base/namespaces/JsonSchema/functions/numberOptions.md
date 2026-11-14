[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / numberOptions

# Function: numberOptions()

> **numberOptions**\<`T`\>(`opts`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ValidatedNumberOptions`](../classes/ValidatedNumberOptions.md)\<`T`\>\>

Checks `number` options for coherence and returns them as
`validated options` — the only way range keywords reach
the `number` factory.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` *extends* [`INumberSchemaOptions`](../interfaces/INumberSchemaOptions.md) |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | `T` & `Record`\<`Exclude`\<keyof `T`, keyof [`INumberSchemaOptions`](../interfaces/INumberSchemaOptions.md)\>, `never`\> | The options to check. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ValidatedNumberOptions`](../classes/ValidatedNumberOptions.md)\<`T`\>\>

The validated options, or a `Failure` naming the keyword and the value.

## Remarks

Refuses a non-finite bound, `minimum` above `maximum`, exclusive bounds leaving no value in
range, `multipleOf` not greater than zero, and a `default` or `examples` member that is not JSON.
An `integer` node needs `integerOptions`, whose check is
stricter; the result of this one is a compile error there.

## Example

```ts
const ratio = JsonSchema.number(JsonSchema.numberOptions({ minimum: 0, maximum: 1 }).shouldNotFail('ratio bounds'));
```
