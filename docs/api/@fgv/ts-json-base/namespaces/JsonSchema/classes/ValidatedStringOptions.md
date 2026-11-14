[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / ValidatedStringOptions

# Class: ValidatedStringOptions\<T\>

Options that `stringOptions` has found coherent, which the
`string` factory accepts. The options are held privately as a frozen copy, read through
`options`.

## Remarks

A `pattern` is held separately as well, as the source and flags read when the options were
checked: what the node emits comes from that reading, and what it enforces is the same `RegExp`,
matched with the built-in `exec` and only while it still has that form.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` *extends* [`IStringSchemaOptions`](../interfaces/IStringSchemaOptions.md) | [`IStringSchemaOptions`](../interfaces/IStringSchemaOptions.md) |

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `public readonly` | `"validated-string-options"` | `'validated-string-options'` | Discriminates validated options from plain ones, which declare `kind` as `never`. |

## Accessors

### options

#### Get Signature

> **get** **options**(): `Readonly`\<`T`\>

The validated options: a frozen copy of those `stringOptions` was given.

##### Returns

`Readonly`\<`T`\>

## Methods

### \_create()

> `static` **\_create**\<`T`\>(`opts`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ValidatedStringOptions`\<`T`\>\>

**`Internal`**

Checks string options. Called by `stringOptions`.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t-1"></a> `T` *extends* [`IStringSchemaOptions`](../interfaces/IStringSchemaOptions.md) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | `T` |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ValidatedStringOptions`\<`T`\>\>

***

### \_createWithMatcher()

> `static` **\_createWithMatcher**\<`T`\>(`opts`, `source`, `matches`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ValidatedStringOptions`\<`T`\>\>

**`Internal`**

Checks string options without a `pattern` and attaches a pattern a caller compiled — the
source a schema stated and the predicate its `patternValidator` returned for it. Called by
`fromJson`, which never compiles a pattern itself.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t-2"></a> `T` *extends* [`IStringSchemaOptions`](../interfaces/IStringSchemaOptions.md) & `object` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | `T` |
| `source` | `string` |
| `matches` | (`value`) => `boolean` |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ValidatedStringOptions`\<`T`\>\>

***

### \_read()

> `static` **\_read**(`value`): `Readonly`\<`Omit`\<[`IStringSchemaOptions`](../interfaces/IStringSchemaOptions.md), `"pattern"`\> & `object`\> \| `undefined`

**`Internal`**

The options of a genuine instance — checked by an ES private brand, which neither a substituted
prototype nor a `Proxy` passes, and read from the private field rather than the getter — or
`undefined` for anything else.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

#### Returns

`Readonly`\<`Omit`\<[`IStringSchemaOptions`](../interfaces/IStringSchemaOptions.md), `"pattern"`\> & `object`\> \| `undefined`
