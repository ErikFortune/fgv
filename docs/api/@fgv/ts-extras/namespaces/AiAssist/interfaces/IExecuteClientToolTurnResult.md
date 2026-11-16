[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IExecuteClientToolTurnResult

# Interface: IExecuteClientToolTurnResult

Return value of [AiAssist.executeClientToolTurn](../functions/executeClientToolTurn.md).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-events"></a> `events` | `readonly` | `AsyncIterable`\<[`IAiStreamEvent`](../type-aliases/IAiStreamEvent.md)\> | The unified-event iterable. Callers iterate this to drive the streaming UI. **Remarks** Forwards every event the underlying adapter emits: `text-delta`, `tool-event`, `done` and `error` come through from the provider stream, and `client-tool-call-start`, `client-tool-call-done` and `client-tool-result` are the tool-dispatch events this layer adds. The `done` event is the terminal one and carries [AiAssist.IAiStreamDone.usage](IAiStreamDone.md#property-usage) when the provider reports it — this iterable is not a text-only view. A caller that only wants the token counts can read them off [AiAssist.IAiClientToolTurnResult.usage](IAiClientToolTurnResult.md#property-usage) instead of matching on events — but it must still iterate this to completion, because that is what drives `nextTurn` to resolve at all. (An earlier version of this comment listed only the five non-terminal events. It was describing the tool-dispatch subset, but it read as the complete set, and at least one consumer reasonably concluded from it that usage never crossed the package boundary on this path. It always did.) |
| <a id="property-nextturn"></a> `nextTurn` | `readonly` | `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiClientToolTurnResult`](IAiClientToolTurnResult.md)\>\> | Resolves when the stream terminates. On success, carries the [AiAssist.IAiClientToolTurnResult](IAiClientToolTurnResult.md) with the optional continuation for the next round. On failure, carries the error message. **Remarks** **You must drive `events` for this to resolve.** It is settled from inside the generator backing `events`, and an async generator does not start until something iterates it — so `await nextTurn` on its own waits forever, and the response body is never drained. Iterate `events` to completion (ignore the events if you do not want them) and then await this. |
