[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiStreamToolUseStart

# Interface: IAiStreamToolUseStart

Emitted when a client-defined tool call begins streaming. Carries the tool name
and optional provider-assigned call ID (Anthropic / OpenAI Responses API; absent
for Gemini which does not assign call IDs).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-callid"></a> `callId?` | `readonly` | `string` | Provider-assigned call identifier (Anthropic: `toolu_*`; OpenAI: `call_*`). Absent for Gemini (correlation by name). |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | The name of the client tool being called. |
| <a id="property-type"></a> `type` | `readonly` | `"client-tool-call-start"` | - |
