[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiEmbeddingUsage

# Interface: IAiEmbeddingUsage

Token-usage accounting for an embedding call, when the provider reports it.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-prompttokens"></a> `promptTokens?` | `readonly` | `number` | Tokens consumed by the input(s). |
| <a id="property-totaltokens"></a> `totalTokens?` | `readonly` | `number` | Total tokens billed. |
