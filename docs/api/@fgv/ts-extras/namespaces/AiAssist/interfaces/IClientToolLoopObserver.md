[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IClientToolLoopObserver

# Interface: IClientToolLoopObserver

Read-only hooks into a running loop. Both are synchronous. A hook that **throws** is isolated:
the throw is logged at `warn` through the turn's `logger` and does not change the outcome.
Neither is called after the loop has been stopped. A hook that aborts the caller's own `signal`
is not isolated from — that is a caller-driven stop, and the loop ends `'aborted'`.

## Methods

### event()?

> `optional` **event**(`round`, `event`): `void`

Called with every stream event of every round, as it arrives — for a streaming UI.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `round` | `number` |
| `event` | [`IAiStreamEvent`](../type-aliases/IAiStreamEvent.md) |

#### Returns

`void`

***

### round()?

> `optional` **round**(`round`): `void`

Called once per completed round, before the next round starts.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `round` | [`IClientToolRound`](IClientToolRound.md) |

#### Returns

`void`
