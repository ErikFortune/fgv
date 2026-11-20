[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskPromptHandoff

# Interface: ITaskPromptHandoff

A checked prompt over a delivery's issued context, and the only handle that can acknowledge it.

## Remarks

The issued receipt is not on this object. The host sends `prompt.system` with `prompt.cacheRequest`,
and after its own successful-processing boundary calls [ITaskPromptHandoff.acknowledge](#acknowledge) with
the system text it actually sent.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-context"></a> `context` | `readonly` | [`TaskContextView`](../type-aliases/TaskContextView.md) |
| <a id="property-deliveryid"></a> `deliveryId` | `readonly` | [`DeliveryId`](../type-aliases/DeliveryId.md) |
| <a id="property-expiresat"></a> `expiresAt` | `readonly` | [`Instant`](../type-aliases/Instant.md) |
| <a id="property-prompt"></a> `prompt` | `readonly` | [`ITaskPromptCheck`](ITaskPromptCheck.md) |

## Methods

### abandon()

> **abandon**(): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`DeliveryId`](../type-aliases/DeliveryId.md)\>\>

Abandons the delivery's manifest without acknowledging: for a host whose call did not complete.
Every later `acknowledge` is refused, whether or not abandoning succeeded.

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`DeliveryId`](../type-aliases/DeliveryId.md)\>\>

***

### acknowledge()

> **acknowledge**(`sentSystem`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IAcknowledgementResult`](IAcknowledgementResult.md)\>\>

Acknowledges the issued receipt — only if `sentSystem` is exactly `prompt.system`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sentSystem` | `string` |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IAcknowledgementResult`](IAcknowledgementResult.md)\>\>

#### Remarks

If the text sent differs in any way, the delivery's manifest is abandoned before this returns,
so the receipt can never be acknowledged by any path, and the failure is `invalid-receipt` —
unless this handoff already acknowledged it, in which case the mismatch is refused and the
acknowledged manifest is left alone, so a replay of the exact text stays idempotent. A refusal
is terminal in the handoff itself, set before the abandonment is attempted: if abandoning fails,
every later call is still refused. Calls on one handoff run one at a time. Its
obligations stay owed, for a later prepare. A matching text is acknowledged by the delivery
exactly as `IBoundTaskDelivery.acknowledge` would, replay included.
