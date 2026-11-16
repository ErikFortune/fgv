[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IGptImageModelOptions

# Interface: IGptImageModelOptions

Options block scoped to GPT Image family models.

## Extends

- [`INamedModelFamilyConfig`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-config"></a> `config` | `readonly` | [`IGptImageGenerationConfig`](IGptImageGenerationConfig.md) |
| <a id="property-family"></a> `family` | `readonly` | `"gpt-image"` |
| <a id="property-models"></a> `models?` | `readonly` | [`GptImageModelNames`](../type-aliases/GptImageModelNames.md)[] |
| <a id="property-provider"></a> `provider` | `readonly` | `"openai"` |
