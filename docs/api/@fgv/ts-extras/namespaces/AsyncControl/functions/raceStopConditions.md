[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AsyncControl](../README.md) / raceStopConditions

# Function: raceStopConditions()

> **raceStopConditions**\<`T`\>(`work`, `conditions`): [`AsyncDetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`StopDetail`](../type-aliases/StopDetail.md)\>

Runs `work` under an optional deadline and an optional caller signal, and settles with whichever
comes first: the work's own result, or a stop.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `work` | (`signal`) => `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>\> | The work to run. Receives a signal that aborts when either condition fires. |
| `conditions` | [`IStopConditions`](../interfaces/IStopConditions.md) | The deadline, the caller signal, and the timer seam. |

## Returns

[`AsyncDetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`StopDetail`](../type-aliases/StopDetail.md)\>

The work's result, or a stop.

## Remarks

**A stop does two things, because either alone is not enough.** It aborts the signal handed to
`work`, which is what stops work that listens (a `fetch`, a provider stream). And it settles the
race at once, with a failure whose detail is `'aborted'` or `'deadline'`, which is what releases
the caller when the work does *not* listen. The work keeps running after a stop — side effects
already in flight still happen — and only the value it later settles to is discarded.

**Which settlement wins** is decided by which is observed first. A stop that fires after the
work's settlement has been observed is ignored, even through a timer whose cancel could not take
effect; a stop that fires before then wins, and the work's value is discarded. "Observed" lags
the work's own settlement by a few microtasks, so work whose promise has already resolved can
still lose to a stop that fires inside that window.

**The work's own result passes through unchanged**: a success is a success, and a failure keeps
its message, with detail `'failed'`. A synchronous throw from `work` or a rejected promise is
captured as a `'failed'` failure, never escaped, and so is work that resolves to something that
is not a `Result`.

**Nothing is left behind.** The timer is cancelled and the signal listener removed on every path,
so a fast work leaves nothing pending. A signal already aborted on entry stops at once without
calling `work`. An invalid `deadlineMs` is a `'failed'` failure and nothing is scheduled.
