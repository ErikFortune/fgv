[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IClientToolLoopOutcome

# Interface: IClientToolLoopOutcome

The outcome of a `runClientToolLoop` loop that did not fail.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-continuationmessages"></a> `continuationMessages?` | `readonly` | readonly [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[] | The most recent **cumulative** continuation tail, absent when no completed round produced one. **Remarks** After `'round-limit'` it is the tail the next round would have sent: pass it as `continuationMessages` to resume, or to run a final round with no tools, without re-deriving the continuation yourself. After `'completed'` it is the tail the final round was sent (the final round's own text is its `fullText`). After a stop it is the tail of the last round that completed before the stop. **Resuming after a stop may re-request tools that already ran.** The tail does not include the round that was in flight at the stop, so the model sees none of that round's calls and may make any of them again. Those calls are listed in `orphanedRoundCalls`; making a repeated call safe (idempotency, or reconciling against `orphanedRoundCalls`) is the host's responsibility. |
| <a id="property-orphanedroundcalls"></a> `orphanedRoundCalls?` | `readonly` | readonly [`IClientToolOrphanedCall`](IClientToolOrphanedCall.md)[] | Present after `'aborted'` and `'deadline'` only: every call the round in flight at the stop had handed off for dispatch, in order, settled or not. These are calls whose results the host never received in a recorded round. Empty when that round had made no call (or the stop came before any round started). See `IClientToolOrphanedCall`. |
| <a id="property-rounds"></a> `rounds` | `readonly` | readonly [`IClientToolRound`](IClientToolRound.md)[] | Every round that completed, in order. |
| <a id="property-state"></a> `state` | `readonly` | [`ClientToolLoopState`](../type-aliases/ClientToolLoopState.md) | How the loop ended. |
