[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / OutputValidationRegistry

# Class: OutputValidationRegistry\<TResponse\>

In-memory implementation of [IPromptOutputValidationRegistry](../interfaces/IPromptOutputValidationRegistry.md).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tresponse"></a> `TResponse` *extends* [`IPromptResponseBase`](../interfaces/IPromptResponseBase.md) |

## Implements

- [`IPromptOutputValidationRegistry`](../interfaces/IPromptOutputValidationRegistry.md)\<`TResponse`\>

## Methods

### get()

> **get**(`id`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPromptOutputValidator`](../interfaces/IPromptOutputValidator.md)\<`TResponse`\>\>

Returns the validator registered under `id`. Fails if not registered.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | [`ValidatorId`](../type-aliases/ValidatorId.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPromptOutputValidator`](../interfaces/IPromptOutputValidator.md)\<`TResponse`\>\>

#### Implementation of

[`IPromptOutputValidationRegistry`](../interfaces/IPromptOutputValidationRegistry.md).[`get`](../interfaces/IPromptOutputValidationRegistry.md#get)

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

#### Implementation of

[`IPromptOutputValidationRegistry`](../interfaces/IPromptOutputValidationRegistry.md).[`has`](../interfaces/IPromptOutputValidationRegistry.md#has)

***

### register()

> **register**(`id`, `validator`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ValidatorId`](../type-aliases/ValidatorId.md)\>

Registers a validator under `id`. Fails if `id` is already registered.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | [`ValidatorId`](../type-aliases/ValidatorId.md) |
| `validator` | [`IPromptOutputValidator`](../interfaces/IPromptOutputValidator.md)\<`TResponse`\> |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ValidatorId`](../type-aliases/ValidatorId.md)\>

#### Implementation of

[`IPromptOutputValidationRegistry`](../interfaces/IPromptOutputValidationRegistry.md).[`register`](../interfaces/IPromptOutputValidationRegistry.md#register)

***

### create()

> `static` **create**\<`TResponse`\>(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`OutputValidationRegistry`\<`TResponse`\>\>

Family-convention factory.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tresponse-1"></a> `TResponse` *extends* [`IPromptResponseBase`](../interfaces/IPromptResponseBase.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`OutputValidationRegistry`\<`TResponse`\>\>
