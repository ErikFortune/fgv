[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AsyncControl](../README.md) / ScheduleTimer

# Type Alias: ScheduleTimer

> **ScheduleTimer** = (`fn`, `ms`) => [`CancelTimer`](CancelTimer.md)

Starts a one-shot timer that calls `fn` after `ms` milliseconds and returns its cancel function:
the seam a deadline is armed through, so a test can fire it deterministically.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `fn` | () => `void` |
| `ms` | `number` |

## Returns

[`CancelTimer`](CancelTimer.md)
