[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IBodyConverterRegistry

# Interface: IBodyConverterRegistry

Registry of per-kind body Converters. Each memory [Kind](../type-aliases/Kind.md) registers the
validated shape of its body; the store dispatches an `unknown` body through
the registered Converter on every write. Type-safe — no `any`.

## Methods

### convert()

> **convert**(`kind`, `body`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`unknown`\>

Convert an `unknown` body value for the given kind. Fails with
`no converter registered for kind '<k>'` when unregistered.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | [`Kind`](../type-aliases/Kind.md) |
| `body` | `unknown` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`unknown`\>

***

### getConverter()

> **getConverter**(`kind`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`, `unknown`\>\>

Get the raw converter registered for a kind. Fails if the kind is
unregistered. Exposed for implementors that need to re-validate a patched
body (e.g. a temporal-versioned policy's `applyUpdate`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | [`Kind`](../type-aliases/Kind.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`, `unknown`\>\>

***

### has()

> **has**(`kind`): `boolean`

Returns `true` if a converter is registered for the kind.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | [`Kind`](../type-aliases/Kind.md) |

#### Returns

`boolean`

***

### register()

> **register**\<`T`\>(`kind`, `converter`): `void`

Register a Converter for a kind. Replaces any prior registration for the
same kind.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | [`Kind`](../type-aliases/Kind.md) |
| `converter` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\> |

#### Returns

`void`

***

### registerSchema()

> **registerSchema**\<`T`\>(`kind`, `schema`): `void`

Register a `JsonSchema` validator (from `@fgv/ts-json-base`) for a kind —
the schema IS a Validator. Replaces any prior registration for the same
kind.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t-1"></a> `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | [`Kind`](../type-aliases/Kind.md) |
| `schema` | [`ISchemaValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`T`\> |

#### Returns

`void`
