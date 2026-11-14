[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptOutputValidationRegistry

# Interface: IPromptOutputValidationRegistry\<TResponse\>

Output validation sub-registry.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tresponse"></a> `TResponse` *extends* [`IPromptResponseBase`](IPromptResponseBase.md) |

## Methods

### get()

> **get**(`id`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPromptOutputValidator`](IPromptOutputValidator.md)\<`TResponse`\>\>

Returns the validator registered under `id`. Fails if not registered.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | [`ValidatorId`](../type-aliases/ValidatorId.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPromptOutputValidator`](IPromptOutputValidator.md)\<`TResponse`\>\>

***

### has()

> **has**(`id`): `boolean`

True iff a validator is registered under `id`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | [`ValidatorId`](../type-aliases/ValidatorId.md) |

#### Returns

`boolean`

***

### register()

> **register**(`id`, `validator`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ValidatorId`](../type-aliases/ValidatorId.md)\>

Registers a validator under `id`. Fails if `id` is already registered.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | [`ValidatorId`](../type-aliases/ValidatorId.md) |
| `validator` | [`IPromptOutputValidator`](IPromptOutputValidator.md)\<`TResponse`\> |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ValidatorId`](../type-aliases/ValidatorId.md)\>
