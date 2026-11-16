[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiStreamToolUseDelta

# Interface: IAiStreamToolUseDelta

Emitted when a client-defined tool call is complete and its arguments are fully
accumulated. The `args` object is the fully parsed JSON object — no further
streaming deltas follow for this call.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args` | `readonly` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The fully accumulated and parsed tool arguments. |
| <a id="property-callid"></a> `callId?` | `readonly` | `string` | Provider-assigned call identifier. Absent for Gemini. |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | The name of the client tool being called. |
| <a id="property-type"></a> `type` | `readonly` | `"client-tool-call-done"` | - |
