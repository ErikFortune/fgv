[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / ValidatedNumberOptions

# Class: ValidatedNumberOptions\<T\>

Options that `numberOptions` or
`integerOptions` has found coherent, which the `number`
factory accepts.

## Remarks

`ValidatedIntegerOptions` extends this class, so integer-validated options are
also number-validated: a range holding an integer holds a number. The converse does not hold, so
these are not accepted by the `integer` factory. The options are held privately as a frozen copy,
read through `options`.

## Extended by

- [`ValidatedIntegerOptions`](ValidatedIntegerOptions.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` *extends* [`INumberSchemaOptions`](../interfaces/INumberSchemaOptions.md) | [`INumberSchemaOptions`](../interfaces/INumberSchemaOptions.md) |

## Constructors

### Constructor

> `protected` **new ValidatedNumberOptions**\<`T`\>(`token`, `checked`): `ValidatedNumberOptions`\<`T`\>

**`Internal`**

Reachable only with this module's construction token; see `numberOptions`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `token` | `symbol` |
| `checked` | `T` |

#### Returns

`ValidatedNumberOptions`\<`T`\>

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `public readonly` | `"validated-number-options"` | `'validated-number-options'` | Discriminates validated options from plain ones, which declare `kind` as `never`. |

## Accessors

### options

#### Get Signature

> **get** **options**(): `Readonly`\<`T`\>

The validated options: a frozen copy of those the check was given.

##### Returns

`Readonly`\<`T`\>

## Methods

### \_create()

> `static` **\_create**\<`T`\>(`opts`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ValidatedNumberOptions`\<`T`\>\>

**`Internal`**

Checks number options. Called by `numberOptions`.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t-1"></a> `T` *extends* [`INumberSchemaOptions`](../interfaces/INumberSchemaOptions.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | `T` |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ValidatedNumberOptions`\<`T`\>\>

***

### \_read()

> `static` **\_read**(`value`): `Readonly`\<[`INumberSchemaOptions`](../interfaces/INumberSchemaOptions.md)\> \| `undefined`

**`Internal`**

The options of a genuine instance (integer-validated ones included) — checked by an ES private
brand, which neither a substituted prototype nor a `Proxy` passes, and read from the private
field rather than the getter — or `undefined` for anything else.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

#### Returns

`Readonly`\<[`INumberSchemaOptions`](../interfaces/INumberSchemaOptions.md)\> \| `undefined`
