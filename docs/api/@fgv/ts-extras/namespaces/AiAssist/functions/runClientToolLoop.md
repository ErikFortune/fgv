[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / runClientToolLoop

# Function: runClientToolLoop()

> **runClientToolLoop**(`params`): [`AsyncDetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IClientToolLoopOutcome`](../interfaces/IClientToolLoopOutcome.md), [`IClientToolLoopFailureDetail`](../interfaces/IClientToolLoopFailureDetail.md)\>

Drives a multi-round client-tool conversation over `executeClientToolTurn`: call the provider,
let the model request tools (dispatched while the round's stream is drained), feed the results
back through the continuation, and repeat until the model stops, the round cap is reached, the
caller aborts, or the deadline expires.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IClientToolLoopParams`](../interfaces/IClientToolLoopParams.md) | The turn parameters plus the loop's bounds. |

## Returns

[`AsyncDetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IClientToolLoopOutcome`](../interfaces/IClientToolLoopOutcome.md), [`IClientToolLoopFailureDetail`](../interfaces/IClientToolLoopFailureDetail.md)\>

The loop's outcome, or a failure carrying the rounds that completed.

## Remarks

- **The continuation is replaced, never appended.** Each turn returns a cumulative tail, so each
  round sends exactly the tail the previous round returned.
- **Stops and the cap are outcomes, not failures.** `'round-limit'`, `'aborted'` and
  `'deadline'` succeed with every completed round; a failed round fails the call, with the
  completed rounds as detail. A failed round is not retried.
- **A stop releases the caller at once.** The whole loop and each round run under
  `raceStopConditions`, so a tool that ignores its signal cannot hold the caller.
  On a stop the orphaned round's event stream is no longer drained past the event in hand and
  its next turn is never awaited, and no further round starts. **Side effects already in flight
  may still land**: a tool that was running keeps running unless it honours its signal, and its
  writes stand; only its result is discarded. Every call that round handed off — settled or
  not — is reported in the outcome's `orphanedRoundCalls`, and a host that resumes from
  `continuationMessages` may see the model request any of them again; idempotency is the host's
  responsibility.
- **Every round carries the same parameters**; duplicate tool names, schema pre-flight and model
  choice are `executeClientToolTurn`'s, so they surface as a failure of round 1.
- **Truncation is reported per round, never resolved.**
