[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiMaxOutputTokensCapability

# Interface: IAiMaxOutputTokensCapability

Maximum output tokens for one model within a provider. Used as an entry in
`IAiProviderDescriptor.maxOutputTokens`.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-maxoutputtokens"></a> `maxOutputTokens` | `readonly` | `number` | The largest `maxTokens` the provider accepts for a completion on this model. |
| <a id="property-modelid"></a> `modelId` | `readonly` | `string` | The concrete model id this limit belongs to. It matches only a resolved model id equal to it: a dated snapshot (`claude-haiku-4-5-20251001`) needs an entry of its own, and no other id inherits this one by prefix. |
