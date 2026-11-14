[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiStreamToolUseComplete

# Interface: IAiStreamToolUseComplete

Emitted after a client-defined tool has been executed and the result is ready
to be fed back to the model in the round-trip continuation.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-callid"></a> `callId?` | `readonly` | `string` | Provider-assigned call identifier. Absent for Gemini. |
| <a id="property-iserror"></a> `isError` | `readonly` | `boolean` | Whether the tool execution failed (schema validation failure, execute error, or unknown tool). |
| <a id="property-result"></a> `result` | `readonly` | `string` | The stringified result returned by the tool's execute callback. |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | The name of the client tool that was executed. |
| <a id="property-type"></a> `type` | `readonly` | `"client-tool-result"` | - |
