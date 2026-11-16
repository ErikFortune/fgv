[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / integerOptions

# Function: integerOptions()

> **integerOptions**\<`T`\>(`opts`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ValidatedIntegerOptions`](../classes/ValidatedIntegerOptions.md)\<`T`\>\>

Checks `integer` options for coherence and returns them as
`validated options` — the only way range keywords
reach the `integer` factory.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` *extends* [`INumberSchemaOptions`](../interfaces/INumberSchemaOptions.md) |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | `T` & `Record`\<`Exclude`\<keyof `T`, keyof [`INumberSchemaOptions`](../interfaces/INumberSchemaOptions.md)\>, `never`\> | The options to check. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ValidatedIntegerOptions`](../classes/ValidatedIntegerOptions.md)\<`T`\>\>

The validated options, or a `Failure` naming the keyword and the value.

## Remarks

Runs the `numberOptions` checks, except that the range must hold
an integer rather than merely a number: `exclusiveMinimum: 0, exclusiveMaximum: 1` is refused.
The result is also accepted by the `number` factory.

## Example

```ts
const age = JsonSchema.integer(JsonSchema.integerOptions({ minimum: 0 }).shouldNotFail('age bounds'));
```
