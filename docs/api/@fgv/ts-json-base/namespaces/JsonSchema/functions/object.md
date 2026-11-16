[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / object

# Function: object()

## Call Signature

> **object**\<`P`\>(`properties`, `opts`): [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<[`OpenObjectStatic`](../type-aliases/OpenObjectStatic.md)\<`P`\> \| `null`\>

Creates a schema node for an **open** JSON `object`: typed declared properties, plus any
undeclared properties, which are carried through as `JsonValue`.

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-p"></a> `P` *extends* [`ILlmProperties`](../type-aliases/ILlmProperties.md) |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `properties` | `P` | A record mapping property names to their schemas. Wrap a property with `optional` to make it optional. |
| `opts` | `Pick`\<[`ISchemaOptions`](../interfaces/ISchemaOptions.md), `"title"` \| `"description"` \| `"nullable"`\> & `object` & `Pick`\<[`IObjectSchemaOptions`](../interfaces/IObjectSchemaOptions.md), `"additionalProperties"`\> & `object` \| [`ValidatedSchemaOptions`](../classes/ValidatedSchemaOptions.md)\<\{ `additionalProperties`: `true`; `nullable`: `true`; \}\> | Options including `additionalProperties: true` and `nullable: true`. |

### Returns

[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<[`OpenObjectStatic`](../type-aliases/OpenObjectStatic.md)\<`P`\> \| `null`\>

An `ISchemaValidator` whose `Static` type is `OpenObjectStatic<P> | null`.

## Call Signature

> **object**\<`P`\>(`properties`, `opts`): [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<[`OpenObjectStatic`](../type-aliases/OpenObjectStatic.md)\<`P`\>\>

Creates a schema node for an **open** JSON `object`: typed declared properties, plus any
undeclared properties, which are carried through as `JsonValue`.

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-p-1"></a> `P` *extends* [`ILlmProperties`](../type-aliases/ILlmProperties.md) |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `properties` | `P` | A record mapping property names to their schemas. Wrap a property with `optional` to make it optional. |
| `opts` | `Pick`\<[`ISchemaOptions`](../interfaces/ISchemaOptions.md), `"title"` \| `"description"` \| `"nullable"`\> & `object` & `Pick`\<[`IObjectSchemaOptions`](../interfaces/IObjectSchemaOptions.md), `"additionalProperties"`\> & `object` \| [`ValidatedSchemaOptions`](../classes/ValidatedSchemaOptions.md)\<\{ `additionalProperties`: `true`; \}\> | Options including `additionalProperties: true`. |

### Returns

[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<[`OpenObjectStatic`](../type-aliases/OpenObjectStatic.md)\<`P`\>\>

An `ISchemaValidator` whose `Static` type is `OpenObjectStatic<P>`.

## Call Signature

> **object**\<`P`\>(`properties`, `opts`): [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<\{ \[K in string \| number \| symbol\]: (\{ \[K in string \| number \| symbol\]: Static\<P\[K\]\> \} & \{ \[K in string \| number \| symbol\]?: OptionalPropertyStatic\<P\[K\]\> \})\[K\] \} \| `null`\>

Creates a schema node for a JSON `object` with a fixed set of typed properties.

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-p-2"></a> `P` *extends* [`ILlmProperties`](../type-aliases/ILlmProperties.md) |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `properties` | `P` | A record mapping property names to their schemas. Wrap a property with `optional` to make it optional. |
| `opts` | `Pick`\<[`ISchemaOptions`](../interfaces/ISchemaOptions.md), `"title"` \| `"description"` \| `"nullable"`\> & `object` & `Pick`\<[`IObjectSchemaOptions`](../interfaces/IObjectSchemaOptions.md), `"additionalProperties"`\> & `object` \| [`ValidatedSchemaOptions`](../classes/ValidatedSchemaOptions.md)\<\{ `nullable`: `true`; \}\> | Optional description and `additionalProperties` flag. |

### Returns

[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<\{ \[K in string \| number \| symbol\]: (\{ \[K in string \| number \| symbol\]: Static\<P\[K\]\> \} & \{ \[K in string \| number \| symbol\]?: OptionalPropertyStatic\<P\[K\]\> \})\[K\] \} \| `null`\>

An `ISchemaValidator` whose `Static` type derives the required/optional split.

## Call Signature

> **object**\<`P`\>(`properties`, `opts?`): [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<\{ \[K in string \| number \| symbol\]: (\{ \[K in string \| number \| symbol\]: Static\<P\[K\]\> \} & \{ \[K in string \| number \| symbol\]?: OptionalPropertyStatic\<P\[K\]\> \})\[K\] \}\>

Creates a schema node for a JSON `object` with a fixed set of typed properties.

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-p-3"></a> `P` *extends* [`ILlmProperties`](../type-aliases/ILlmProperties.md) |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `properties` | `P` | A record mapping property names to their schemas. Wrap a property with `optional` to make it optional, or author it `nullable` when the provider requires every property to be required. |
| `opts?` | [`PlainObjectSchemaOptions`](../type-aliases/PlainObjectSchemaOptions.md) \| [`ValidatedSchemaOptions`](../classes/ValidatedSchemaOptions.md)\<[`IObjectSchemaOptions`](../interfaces/IObjectSchemaOptions.md)\> | Plain options (description, nullability, `additionalProperties`), or `schemaOptions` for `default` or `examples`. |

### Returns

[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<\{ \[K in string \| number \| symbol\]: (\{ \[K in string \| number \| symbol\]: Static\<P\[K\]\> \} & \{ \[K in string \| number \| symbol\]?: OptionalPropertyStatic\<P\[K\]\> \})\[K\] \}\>

An `ISchemaValidator` whose `Static` type derives the required/optional split.
