[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / OpenObjectStatic

# Type Alias: OpenObjectStatic\<P\>

> **OpenObjectStatic**\<`P`\> = [`ObjectStatic`](ObjectStatic.md)\<`P`\> & [`JsonObject`](../../../interfaces/JsonObject.md)

The derived static type for an **open** object — one built with
`additionalProperties: true`. The declared properties keep their derived types, and every
other key carries a `JsonValue`, which is what the validator passes through for it.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-p"></a> `P` *extends* [`ILlmProperties`](ILlmProperties.md) |

## Remarks

Every declared property type must itself be a `JsonValue` for the intersection to be
inhabitable. The built-in factories only produce such types; a caller-supplied
`ISchemaValidator` whose static type is not JSON (a `Date`, say) cannot be used here.
