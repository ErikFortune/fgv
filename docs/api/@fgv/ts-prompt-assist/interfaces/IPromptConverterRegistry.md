[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptConverterRegistry

# Interface: IPromptConverterRegistry\<TResponse\>

Converter sub-registry — tracks the declared response kind alongside
each registered Converter so the loader can verify a descriptor's
`outputValidations[]` are compatible at load time (see design §17.2.4)
AND so the runtime dispatch flows the narrow Converter type
end-to-end without a cast (see design §17.2.5).

## Remarks

Both `register` and `get` key off the response kind `K` rather than
a caller-asserted `T`. This makes the converter's produced type the
one source of truth — `Converter<Extract<TResponse, \{ kind: K \}>>` —
for both registration and lookup, eliminating the type-system-erasure
cast that the §17.2.5 redesign acknowledged.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tresponse"></a> `TResponse` *extends* [`IPromptResponseBase`](IPromptResponseBase.md) |

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
