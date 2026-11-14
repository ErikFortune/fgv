[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / Static

# Type Alias: Static\<S\>

> **Static**\<`S`\> = `S` *extends* [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<infer T\> ? `T` : `never`

Recover the derived static type `T` from a schema value.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-s"></a> `S` *extends* [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`unknown`\> |

## Remarks

`Static<typeof MySchema>` resolves to the TypeScript type that `schema.validate()` produces
and that `schema.toJson()` describes — derived, never asserted. No user-supplied `T` is ever
required.
