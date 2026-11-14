[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IBoundTaskDelivery

# Interface: IBoundTaskDelivery

A subscription's delivery, bound to one principal (design § 9, `IBoundTaskDelivery`).

## Remarks

`prepare` is the only operation that writes before the host has processed anything, and what it
writes is the receipt manifest — never an acknowledgement. The host keeps the receipt outside the
prompt and calls `acknowledge` after its own successful-processing boundary; an aborted call
simply never acknowledges. There is no model-facing acknowledgement.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-subscriptionid"></a> `subscriptionId` | `readonly` | [`SubscriptionId`](../type-aliases/SubscriptionId.md) |

## Methods

### abandon()

> **abandon**(`deliveryId`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`DeliveryId`](../type-aliases/DeliveryId.md)\>\>

Removes an issued manifest early. Its obligations stay owed; its history, if any, stays.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `deliveryId` | [`DeliveryId`](../type-aliases/DeliveryId.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`DeliveryId`](../type-aliases/DeliveryId.md)\>\>

***

### acknowledge()

> **acknowledge**(`receipt`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IAcknowledgementResult`](IAcknowledgementResult.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `receipt` | `unknown` |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IAcknowledgementResult`](IAcknowledgementResult.md)\>\>

***

### disposeWithheld()

> **disposeWithheld**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskWithheldDisposal`](ITaskWithheldDisposal.md)\>\>

Ends, with `reason`, the obligations this subscription is owed that this principal is
**withheld** — may no longer see or acknowledge, as each task's committed record stands — up to
`limit` (default and maximum 200) per call.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IDisposeWithheldRequest`](IDisposeWithheldRequest.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskWithheldDisposal`](ITaskWithheldDisposal.md)\>\>

#### Remarks

Not authorized per task — an obligation the principal can never be shown could otherwise never
end, and would hold its task's archive for good — but by the subscription as a whole, and only
when all of these hold: the binding's principal is one of the subscription's drain principals;
the subscription recorded a policy identity (`ISubscribeRequest.policyIdentity`) and the
binding's policy carries that same identity (`ITaskAuthorization.policyIdentity`, read when the
binding was made); every scope of the subscription's selection lies within the binding's
selectors (the rule `subscribe` applied); and the binding's policy grants both `acknowledge` and
`dispose-obligation`, each asked for those scopes with no task named — only a binding that could
have acknowledged these obligations may end them unseen. Each refusal is the same
`not-found-or-denied`; a subscription that recorded no identity refuses every binding.

**The binding's policy decides what counts as withheld**, which is why its identity must be the
one recorded: the grant checks alone cannot tell a policy that withholds a task for good from one
merely narrower about that task than the consumer's real policy. The identity is the host's
statement of which policy is the consumer's own; the broker checks that the two agree, not that
the host named them truthfully.

The drain principals and identity are decided before anything is listed and decided again, on
the record the write is conditioned on, inside the writer section.

It answers **counts only**. An update id embeds its task id and revision, so a list of the ids
ended would disclose the identity of tasks the principal may not read; the exact ids stay in the
subscription's history, for the trusted host to read through the repository.

Each id is decided on its task's committed record, and the writer section re-reads every such
record and the policy epoch before it commits, so an id that became visible meanwhile is not
ended. An id an unexpired issued receipt names is counted in `pinned` rather than ended. `more`
says the limit stopped it. Fails `conflict`, retry `safe`, when what it decided kept moving.

***

### issued()

> **issued**(): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<readonly [`ITaskIssuedReceiptSummary`](ITaskIssuedReceiptSummary.md)[]\>\>

The subscription's issued receipts not yet acknowledged, oldest first — how a host finds the
receipts a crash left behind, since a prepared context it never processed holds a manifest no
one will acknowledge, and an id that manifest names cannot be disposed of until it is abandoned
or expires.

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<readonly [`ITaskIssuedReceiptSummary`](ITaskIssuedReceiptSummary.md)[]\>\>

#### Remarks

Read under the writer, so the list is one committed state of the subscription's record. It is a
moment, not a hold: an acknowledgement or abandonment may commit right after it. Abandoning a
listed receipt that was acknowledged meanwhile removes a manifest whose history is already
committed — nothing is lost — and a later replay of that acknowledgement is then refused as an
invalid receipt. Expired manifests not yet removed are listed with their `expiresAt`.

Lists identities and times only, never what a receipt included. The read is a gated section: it
takes a writer-queue slot and passes the broker's `writeGuard`, so a paused guard holds it.

***

### pending()

> **pending**(`request?`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskDeliveryPage`](ITaskDeliveryPage.md)\>\>

One page of what this subscription is owed, as this principal may be shown it now: an update is
listed only when its task's committed record is one the principal may see and acknowledge; the
rest are counted in `withheld`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request?` | \{ `cursor?`: [`PageCursor`](../type-aliases/PageCursor.md); `limit?`: `number`; \} |
| `request.cursor?` | [`PageCursor`](../type-aliases/PageCursor.md) |
| `request.limit?` | `number` |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskDeliveryPage`](ITaskDeliveryPage.md)\>\>

#### Remarks

Fails `conflict`, retry `safe`, when a task it decided on, or the policy epoch, moved before it
answered — so a page never mixes two states. Retry the same call.

***

### prepare()

> **prepare**(`budget?`, `options?`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IPreparedTaskContext`](IPreparedTaskContext.md)\>\>

Renders a bounded context and issues its receipt. `options.currentState` chooses whether the
selection's current tasks are rendered beside what is owed — see [TaskPrepareCurrentState](../type-aliases/TaskPrepareCurrentState.md).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `budget?` | [`ITaskContextBudget`](ITaskContextBudget.md) |
| `options?` | [`ITaskPrepareOptions`](ITaskPrepareOptions.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IPreparedTaskContext`](IPreparedTaskContext.md)\>\>
