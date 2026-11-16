[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IOpenAiThinkingConfig

# Interface: IOpenAiThinkingConfig

OpenAI-specific thinking configuration.

## Remarks

Maps to `reasoning_effort` (Chat Completions path) or `reasoning.effort`
(Responses API path) on the wire. The adapter selects the correct field.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-effort"></a> `effort?` | `readonly` | `"none"` \| `"high"` \| `"low"` \| `"medium"` \| `"minimal"` \| `"xhigh"` | OpenAI reasoning effort. Maps 1:1 to the wire field. - 'none': disables reasoning (gpt-5.x only; rejected by o-series) - 'minimal': fastest (gpt-5.x) - 'low' \| 'medium' \| 'high': standard tiers - 'xhigh': highest (select gpt-5.x models only) **Remarks** When effective effort is 'none', reasoning is disabled and temperature is accepted by gpt-5.x models. This is the only case where temperature and thinking config co-exist without a Result.fail. |
