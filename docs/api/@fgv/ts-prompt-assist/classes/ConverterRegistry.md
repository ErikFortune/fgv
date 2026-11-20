[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / ConverterRegistry

# Class: ConverterRegistry\<TResponse\>

In-memory implementation of [IPromptConverterRegistry](../interfaces/IPromptConverterRegistry.md).

## Remarks

Per design §17.2.5: entry storage is a distributed discriminated union
over `TResponse`, so `get(id, kind)` narrows by the discriminator and
returns `Converter<Extract<TResponse, \{ kind: K \}>>` cast-free.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tresponse"></a> `TResponse` *extends* [`IPromptResponseBase`](../interfaces/IPromptResponseBase.md) |

## Implements

- [`IPromptConverterRegistry`](../interfaces/IPromptConverterRegistry.md)\<`TResponse`\>

## Methods

### get()

> **get**\<`K`\>(`id`, `kind`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Extract`\<`TResponse`, \{ `kind`: `K`; \}\>, `unknown`\>\>

Retrieves a registered Converter narrowed to the `TResponse` member
matching `kind`. Cast-free in callers: the return type is
`Converter<Extract<TResponse, \{ kind: K \}>>` directly. Fails if no
Converter is registered under `id`, or if the registered Converter's
recorded kind doesn't equal `kind`.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-k"></a> `K` *extends* `string` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | [`ConverterId`](../type-aliases/ConverterId.md) |
| `kind` | `K` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Extract`\<`TResponse`, \{ `kind`: `K`; \}\>, `unknown`\>\>

#### Implementation of

[`IPromptConverterRegistry`](../interfaces/IPromptConverterRegistry.md).[`get`](../interfaces/IPromptConverterRegistry.md#get)

***

### getKind()

> **getKind**(`id`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TResponse`\[`"kind"`\]\>

Returns the declared response kind for a registered Converter.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | [`ConverterId`](../type-aliases/ConverterId.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TResponse`\[`"kind"`\]\>

#### Implementation of

[`IPromptConverterRegistry`](../interfaces/IPromptConverterRegistry.md).[`getKind`](../interfaces/IPromptConverterRegistry.md#getkind)

***

### has()

> **has**(`id`): `boolean`

True iff the given id is registered.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | [`ConverterId`](../type-aliases/ConverterId.md) |

#### Returns

`boolean`

#### Implementation of

[`IPromptConverterRegistry`](../interfaces/IPromptConverterRegistry.md).[`has`](../interfaces/IPromptConverterRegistry.md#has)

***

### register()

> **register**\<`K`\>(`id`, `kind`, `converter`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ConverterId`](../type-aliases/ConverterId.md)\>

Registers a Converter that produces the `TResponse` member discriminated
by `kind`. The Converter's `T` is `Extract<TResponse, \{ kind: K \}>` —
no caller-asserted generic.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-k-1"></a> `K` *extends* `string` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | [`ConverterId`](../type-aliases/ConverterId.md) |
| `kind` | `K` |
| `converter` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Extract`\<`TResponse`, \{ `kind`: `K`; \}\>\> |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ConverterId`](../type-aliases/ConverterId.md)\>

#### Implementation of

[`IPromptConverterRegistry`](../interfaces/IPromptConverterRegistry.md).[`register`](../interfaces/IPromptConverterRegistry.md#register)

***

### create()

> `static` **create**\<`TResponse`\>(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ConverterRegistry`\<`TResponse`\>\>

Family-convention factory.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tresponse-1"></a> `TResponse` *extends* [`IPromptResponseBase`](../interfaces/IPromptResponseBase.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ConverterRegistry`\<`TResponse`\>\>
