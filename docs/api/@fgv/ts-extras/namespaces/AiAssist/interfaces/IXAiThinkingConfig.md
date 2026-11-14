[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IXAiThinkingConfig

# Interface: IXAiThinkingConfig

xAI-specific thinking configuration.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-effort"></a> `effort?` | `readonly` | `"none"` \| `"high"` \| `"low"` \| `"medium"` | xAI reasoning effort. Maps 1:1 to `reasoning_effort` on the wire. For grok-4, the adapter omits this field (grok-4 always reasons and rejects the parameter). |
