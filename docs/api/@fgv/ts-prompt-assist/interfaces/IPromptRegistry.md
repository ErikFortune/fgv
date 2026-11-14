[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptRegistry

# Interface: IPromptRegistry\<TResponse\>

Unified registry exposing the three typed sub-registries (per OQ-4 and
design §17.2.1). `TResponse` is the consumer-extended response union;
defaults to the open `\{ kind: string \}` lower bound for consumers who
only use free-text output.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tresponse"></a> `TResponse` *extends* [`IPromptResponseBase`](IPromptResponseBase.md) | [`IPromptResponseBase`](IPromptResponseBase.md) |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-converters"></a> `converters` | `readonly` | [`IPromptConverterRegistry`](IPromptConverterRegistry.md)\<`TResponse`\> |
| <a id="property-outputvalidations"></a> `outputValidations` | `readonly` | [`IPromptOutputValidationRegistry`](IPromptOutputValidationRegistry.md)\<`TResponse`\> |
| <a id="property-slotkinds"></a> `slotKinds` | `readonly` | [`IPromptSlotKindRegistry`](IPromptSlotKindRegistry.md) |
