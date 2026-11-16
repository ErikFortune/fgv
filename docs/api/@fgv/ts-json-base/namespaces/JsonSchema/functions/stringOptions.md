[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / stringOptions

# Function: stringOptions()

> **stringOptions**\<`T`\>(`opts`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ValidatedStringOptions`](../classes/ValidatedStringOptions.md)\<`T`\>\>

Checks `string` options for coherence and returns them as
`validated options` — the only way length keywords
reach the `string` factory.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` *extends* [`IStringSchemaOptions`](../interfaces/IStringSchemaOptions.md) |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | `T` & `Record`\<`Exclude`\<keyof `T`, keyof [`IStringSchemaOptions`](../interfaces/IStringSchemaOptions.md)\>, `never`\> | The options to check. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ValidatedStringOptions`](../classes/ValidatedStringOptions.md)\<`T`\>\>

The validated options, or a `Failure` naming the keyword and the value.

## Remarks

Refuses a length that is not a non-negative integer, `minLength` above `maxLength`, a `pattern`
that is not a `RegExp` whose only flag is `u` (the flag JSON Schema patterns are built with), and
a `default` or `examples` member that is not JSON.

A `pattern` is the host's own `RegExp` and is trusted: the node enforces it and emits its
`source`. See `IStringSchemaOptions.pattern` for the semantics and the wire.

## Example

```ts
const name = JsonSchema.string(JsonSchema.stringOptions({ minLength: 1 }).shouldNotFail('name length'));
const slug = JsonSchema.string(JsonSchema.stringOptions({ pattern: /^[a-z0-9-]+$/u }).shouldNotFail('slug'));
```
