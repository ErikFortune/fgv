[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskHostWriteGuard

# Interface: ITaskHostWriteGuard

A cooperative write gate a host gives a host helper ([TaskDeliveryPump](../classes/TaskDeliveryPump.md),
[DeferredObligations](../classes/DeferredObligations.md)) — structural, so any gate with this shape fits.

## Remarks

A helper hands the gate **one whole helper operation** — a pump pass, an acknowledgement and its
follow-up, a deferral's create and wait — and the gate runs it at most once, or refuses it. That
is a different layer from the broker's own `writeGuard` (`ITaskWriteGuard`, given to
`TaskBroker.create`), which wraps **each serialized writer section** inside the broker:

- **Helper guard only** — the gate sees helper operations whole. A pause cannot fall between a
  pump's release and its disposal, but it does not see broker writes made outside the helpers.
- **Broker `writeGuard` only** — every broker write passes the gate, the helpers' included, but a
  pause can fall between two sections of one helper operation. Every helper operation is written
  to be safe across that: each step is idempotent, or presents the work again.
- **Both, with one gate** — the helper's operation is in flight *at* the gate while its sections
  wait *behind* it. A gate that holds new writes until in-flight ones finish (a snapshot pause)
  then waits on an operation that is itself waiting on the gate, and only its own timeout ends
  the wait. Give one gate to one layer, or a gate that admits a section of an operation it has
  already admitted.

## Methods

### guard()

> **guard**\<`T`\>(`write`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>\>

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `write` | () => `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>\> |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>\>
