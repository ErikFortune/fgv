[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / ValidatedSchemaOptions

# Class: ValidatedSchemaOptions\<T\>

Options whose annotations `schemaOptions` has checked: `default`
and every member of `examples` are JSON values.

## Remarks

Accepted by every factory that takes plain options (`boolean`, `enumOf`, `array`, `object`,
`record`, `anyValue`). Constructed only by `schemaOptions`. The options are held privately as a
frozen copy, read through `options`; spreading an
instance copies only its `kind`, which no factory accepts.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` *extends* [`IObjectSchemaOptions`](../interfaces/IObjectSchemaOptions.md) | [`IObjectSchemaOptions`](../interfaces/IObjectSchemaOptions.md) |

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `public readonly` | `"validated-schema-options"` | `'validated-schema-options'` | Discriminates validated options from plain ones, which declare `kind` as `never`. |

## Accessors

### options

#### Get Signature

> **get** **options**(): `Readonly`\<`T`\>

The validated options: a frozen copy of those `schemaOptions` was given.

##### Returns

`Readonly`\<`T`\>

## Methods

### \_create()

> `static` **\_create**\<`T`\>(`opts`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ValidatedSchemaOptions`\<`T`\>\>

**`Internal`**

Checks the annotations. Called by `schemaOptions`.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t-1"></a> `T` *extends* [`IObjectSchemaOptions`](../interfaces/IObjectSchemaOptions.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | `T` |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ValidatedSchemaOptions`\<`T`\>\>

***

### \_read()

> `static` **\_read**(`value`): `Readonly`\<[`IObjectSchemaOptions`](../interfaces/IObjectSchemaOptions.md)\> \| `undefined`

**`Internal`**

The options of a genuine instance — checked by an ES private brand, which neither a substituted
prototype nor a `Proxy` passes, and read from the private field rather than the getter — or
`undefined` for anything else.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

#### Returns

`Readonly`\<[`IObjectSchemaOptions`](../interfaces/IObjectSchemaOptions.md)\> \| `undefined`
