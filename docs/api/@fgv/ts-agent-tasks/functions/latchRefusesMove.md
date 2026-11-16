[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / latchRefusesMove

# Function: latchRefusesMove()

> **latchRefusesMove**(`latches`, `from`, `to`): `boolean`

Whether a lifecycle move is refused under these latches (design § 10 step 2): a move to `running`
from anything else — start, resume, a new execution attempt — or out of a latch's required stopped
set, such as `paused → waiting` under a pause. Decided on the states, not on the command, so no
command spelling can bypass it.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `latches` | readonly [`IStopLatch`](../interfaces/IStopLatch.md)[] |
| `from` | [`TaskLifecycleStatus`](../type-aliases/TaskLifecycleStatus.md) |
| `to` | [`TaskLifecycleStatus`](../type-aliases/TaskLifecycleStatus.md) |

## Returns

`boolean`
