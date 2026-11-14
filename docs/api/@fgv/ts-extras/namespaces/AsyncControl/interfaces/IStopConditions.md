[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AsyncControl](../README.md) / IStopConditions

# Interface: IStopConditions

The conditions under which `raceStopConditions` stops waiting for its work.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-deadlinems"></a> `deadlineMs?` | `readonly` | `number` | Stop when this many milliseconds have passed. Absent means no deadline. Must be a finite integer in `0 ≤ ms ≤ 2^31-1`, the range a platform timer honours; anything else is refused up front and never scheduled. |
| <a id="property-schedule"></a> `schedule?` | `readonly` | [`ScheduleTimer`](../type-aliases/ScheduleTimer.md) | Timer the deadline is armed through. Defaults to `setTimeout` / `clearTimeout`. |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Stop when this signal aborts. Absent means no caller cancellation. |
