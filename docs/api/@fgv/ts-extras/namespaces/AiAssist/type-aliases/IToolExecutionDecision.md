[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IToolExecutionDecision

# Type Alias: IToolExecutionDecision

> **IToolExecutionDecision** = \{ `action`: `"proceed"`; \} \| \{ `action`: `"deny"`; `reason`: `string`; \}

Decision returned by an [IExecuteClientToolTurnParams.onBeforeToolExecute](../interfaces/IExecuteClientToolTurnParams.md#property-onbeforetoolexecute)
gate for a single client-tool call.

## Remarks

- `{ action: 'proceed' }` — run the tool's `execute` normally.
- `{ action: 'deny', reason }` — do NOT run `execute`; a synthesized tool-result
  carrying `reason` is fed into the continuation exactly like a normal result so
  the model can react, and a `client-tool-result` event is emitted for the call.
  The turn continues.

A gate that wants to signal a hard error (as opposed to a deliberate deny) should
return `Result.fail` (or reject) from the callback. Note this is NOT the same as a
`tool.execute` failure: an `execute` failure yields an `isError` tool-result and the
**turn continues**, whereas a gate `fail`/reject **terminates the turn** — it fails
`nextTurn` (and emits an inline `error` event) rather than synthesizing a deny.
