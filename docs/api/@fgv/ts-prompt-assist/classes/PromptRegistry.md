[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / PromptRegistry

# Class: PromptRegistry\<TResponse\>

Unified registry combining the three typed sub-registries per design
§17.2.1. Parameterized by the consumer's response union `TResponse`.

Consumers create an empty registry via `PromptRegistry.create<MyResponses>()`
and populate it at boot.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tresponse"></a> `TResponse` *extends* [`IPromptResponseBase`](../interfaces/IPromptResponseBase.md) | [`IPromptResponseBase`](../interfaces/IPromptResponseBase.md) |

## Implements

- [`IPromptRegistry`](../interfaces/IPromptRegistry.md)\<`TResponse`\>

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-converters"></a> `converters` | `public readonly` | [`IPromptConverterRegistry`](../interfaces/IPromptConverterRegistry.md)\<`TResponse`\> |
| <a id="property-outputvalidations"></a> `outputValidations` | `public readonly` | [`IPromptOutputValidationRegistry`](../interfaces/IPromptOutputValidationRegistry.md)\<`TResponse`\> |
| <a id="property-slotkinds"></a> `slotKinds` | `public readonly` | [`IPromptSlotKindRegistry`](../interfaces/IPromptSlotKindRegistry.md) |

## Methods

### create()

> `static` **create**\<`TResponse`\>(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`PromptRegistry`\<`TResponse`\>\>

Family-convention factory. Returns an empty registry ready to be
populated by `.converters.register(...)` / `.slotKinds.register(...)` /
`.outputValidations.register(...)`.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tresponse-1"></a> `TResponse` *extends* [`IPromptResponseBase`](../interfaces/IPromptResponseBase.md) | [`IPromptResponseBase`](../interfaces/IPromptResponseBase.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`PromptRegistry`\<`TResponse`\>\>
