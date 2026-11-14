[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IChatRequest

# Interface: IChatRequest

An ordered chat request: optional system instructions plus the conversation
turns. The **last** entry in `messages` is the current turn (always a `user`
turn); everything before it is prior conversation history.

## Remarks

This is the unified shape accepted by every turn entry point. Both the
completion path and the client-tool turn path linearize it identically:
`[system, ...history, current user turn, ...continuation]`. Keeping `system`
as a distinct field (rather than a `system`-role message) matches how the
per-provider request builders already separate system from the turn list
(Anthropic top-level `system`, Gemini `systemInstruction`, OpenAI a leading
`system`-role message). `messages` should therefore carry only `user` /
`assistant` turns.

## Extended by

- [`IProviderCompletionParams`](IProviderCompletionParams.md)
- [`IProviderCompletionStreamParams`](IProviderCompletionStreamParams.md)
- [`IExecuteClientToolTurnParams`](IExecuteClientToolTurnParams.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`IChatMessage`](IChatMessage.md)[] | The ordered conversation turns. Must be non-empty; the last entry is the current `user` turn and the preceding entries are history. |
| <a id="property-system"></a> `system?` | `readonly` | `string` | System instructions (schema docs, format rules, general guidance). |
