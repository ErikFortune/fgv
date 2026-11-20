[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiClientToolCallSummary

# Interface: IAiClientToolCallSummary

Summary of a single client tool call within a turn: the tool name, call ID,
raw arguments, execution result, and whether the execution was an error.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args` | `readonly` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The fully accumulated raw arguments object as parsed JSON. |
| <a id="property-callid"></a> `callId?` | `readonly` | `string` | Provider-assigned call identifier (absent for Gemini). |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | How long deciding and running this call took, in milliseconds on the turn's clock (`IExecuteClientToolTurnParams.clock`): from the moment its arguments were complete to the moment its result was ready, covering argument validation, the `onBeforeToolExecute` gate and `execute`. **Remarks** Required, for the same reason `toolConflicts` is: the library always knows it, so an absent value could only mean a defect. A call that was never dispatched — an unknown tool, invalid arguments, a denial, an aborted turn — still has one: the near-zero time spent deciding not to. The time a consumer spends between the call's `client-tool-call-done` and `client-tool-result` events is never included. |
| <a id="property-iserror"></a> `isError` | `readonly` | `boolean` | Whether execution failed (schema validation failure, execute error, unknown tool, or an aborted turn). |
| <a id="property-result"></a> `result` | `readonly` | `string` | The stringified result (success value or error message). |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | The name of the tool that was called. |
