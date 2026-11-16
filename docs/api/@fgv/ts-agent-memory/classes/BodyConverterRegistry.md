[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / BodyConverterRegistry

# Class: BodyConverterRegistry

Default in-memory [IBodyConverterRegistry](../interfaces/IBodyConverterRegistry.md).

## Remarks

Both `register` and `registerSchema` adapt the supplied converter/validator
into a `Converter<unknown>` via `Converters.generic`, so the heterogeneous
per-kind types are stored uniformly with no cast and no `any`. A
`Converter<T>` is not structurally a `Converter<unknown>` (the `map` callback
makes the type invariant), so the `generic` wrapper — whose callback returns
`Result<T>` (assignable to `Result<unknown>`) — is the type-safe bridge.

## Implements

- [`IBodyConverterRegistry`](../interfaces/IBodyConverterRegistry.md)

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

#### Implementation of

[`IBodyConverterRegistry`](../interfaces/IBodyConverterRegistry.md).[`convert`](../interfaces/IBodyConverterRegistry.md#convert)

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

#### Implementation of

[`IBodyConverterRegistry`](../interfaces/IBodyConverterRegistry.md).[`getConverter`](../interfaces/IBodyConverterRegistry.md#getconverter)

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

#### Implementation of

[`IBodyConverterRegistry`](../interfaces/IBodyConverterRegistry.md).[`has`](../interfaces/IBodyConverterRegistry.md#has)

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

#### Implementation of

[`IBodyConverterRegistry`](../interfaces/IBodyConverterRegistry.md).[`register`](../interfaces/IBodyConverterRegistry.md#register)

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

#### Implementation of

[`IBodyConverterRegistry`](../interfaces/IBodyConverterRegistry.md).[`registerSchema`](../interfaces/IBodyConverterRegistry.md#registerschema)

***

### create()

> `static` **create**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`BodyConverterRegistry`\>

Family-convention factory.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`BodyConverterRegistry`\>
