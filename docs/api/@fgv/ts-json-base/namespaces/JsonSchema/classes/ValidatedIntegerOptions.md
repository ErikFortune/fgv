[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / ValidatedIntegerOptions

# Class: ValidatedIntegerOptions\<T\>

Options that `integerOptions` has found coherent for an
integer node — in particular, its range holds at least one integer. Accepted by both the
`integer` and the `number` factory.

## Extends

- [`ValidatedNumberOptions`](ValidatedNumberOptions.md)\<`T`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` *extends* [`INumberSchemaOptions`](../interfaces/INumberSchemaOptions.md) | [`INumberSchemaOptions`](../interfaces/INumberSchemaOptions.md) |

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `public readonly` | `"validated-number-options"` | `'validated-number-options'` | Discriminates validated options from plain ones, which declare `kind` as `never`. |

## Accessors

### holdsInteger

#### Get Signature

> **get** **holdsInteger**(): `true`

Always `true`: the range holds at least one integer.

##### Returns

`true`

***

### options

#### Get Signature

> **get** **options**(): `Readonly`\<`T`\>

The validated options: a frozen copy of those the check was given.

##### Returns

`Readonly`\<`T`\>

#### Inherited from

[`ValidatedNumberOptions`](ValidatedNumberOptions.md).[`options`](ValidatedNumberOptions.md#options)

## Methods

### \_create()

> `static` **\_create**\<`T`\>(`opts`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ValidatedNumberOptions`](ValidatedNumberOptions.md)\<`T`\>\>

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

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ValidatedNumberOptions`](ValidatedNumberOptions.md)\<`T`\>\>

#### Inherited from

[`ValidatedNumberOptions`](ValidatedNumberOptions.md).[`_create`](ValidatedNumberOptions.md#_create)

***

### \_createInteger()

> `static` **\_createInteger**\<`T`\>(`opts`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ValidatedIntegerOptions`\<`T`\>\>

**`Internal`**

Checks integer options. Called by `integerOptions`.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t-2"></a> `T` *extends* [`INumberSchemaOptions`](../interfaces/INumberSchemaOptions.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | `T` |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ValidatedIntegerOptions`\<`T`\>\>

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

#### Inherited from

[`ValidatedNumberOptions`](ValidatedNumberOptions.md).[`_read`](ValidatedNumberOptions.md#_read)

***

### \_readInteger()

> `static` **\_readInteger**(`value`): `Readonly`\<[`INumberSchemaOptions`](../interfaces/INumberSchemaOptions.md)\> \| `undefined`

**`Internal`**

The options of a genuine integer-validated instance — its own private brand, then the base
class's private field — or `undefined` for anything else.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

#### Returns

`Readonly`\<[`INumberSchemaOptions`](../interfaces/INumberSchemaOptions.md)\> \| `undefined`
