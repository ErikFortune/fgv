[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskDeliveryPump

# Class: TaskDeliveryPump

A host-driven pump over one subscription's delivery: one owed task revision at a time, prepared,
then acknowledged, abandoned or disposed of by the host.

## Remarks

**No timers and no resident loop.** Every method is one bounded operation the host calls.

**Only what is owed is rendered.** The pump prepares in `'owed-only'` mode
(`ITaskPrepareOptions`): each owed revision renders from its own snapshot and no current task
state is a candidate, so a task the subscription is owed nothing for — one whose attention or
outcome was already acknowledged, a waiting task with attention references — can never take the
one render slot. Owed revisions are presented by the renderer's priority: attention, then terminal
outcomes, then other changes.

**It never acknowledges on its own.** [TaskDeliveryPump.next](#next) issues a receipt; only the
host's [TaskDeliveryPump.acknowledge](#acknowledge), after its own work has committed, discharges it. An
obligation ends only by acknowledgement or by a recorded disposal — never by expiry, never by
being skipped.

**At-least-once, not exactly-once.** A prepared revision that is neither acknowledged nor
disposed of stays owed and is presented again — after an abandonment, a crash, or a host that
simply never decided. Exactly-once is not this helper's property: it is at-least-once here plus a
host whose work for a revision is findable by `(taskId, revision)`, so that a revision presented
again after its work committed (and before its acknowledgement did) is recognized and
acknowledged rather than done twice.

**Receipts a crash leaves behind — release them at start-up.** A process stopped between `next`
and its decision leaves that receipt issued, and nothing after a restart holds it. Until it expires
(the broker's `receiptLifetimeMs`, 24 hours by default) it:

- **pins every revision it names**: each is presented again and can be acknowledged, but
  [TaskDeliveryPump.dispose](#dispose) of it fails;
- **blocks the superseded disposal** after a later terminal discharge of the same task (reported in
  `issues`), so those older revisions are presented one by one instead;
- **blocks the task's archive and `cleanup`'s pruning** of what it names, even once every revision
  is acknowledged — and **expiry alone does not end that**: an expired receipt stops pinning only
  when the next receipt issue or disposal on the subscription evicts it, or when it is abandoned;
- **occupies one of the subscription's outstanding-receipt slots** (32 by default), so repeated
  crashes leave `next` refused (`backpressure`) until some expire.

Nothing is lost either way. **A host that is the subscription's only consumer should release them
at start-up**, before its first `next`:

```ts
for (const stale of (await pump.delivery.issued()).orThrow()) {
  await pump.delivery.abandon(stale.deliveryId);
}
```

**One pump per subscription.** Two pumps (or two processes) over one subscription are safe — each
id still ends in exactly one history list — but they present the same top revision, and each
one's receipt pins it against the other's disposal.

**Writes.** Every write — issuing, releasing and acknowledging receipts, disposals — goes through
the optional [ITaskHostWriteGuard](../interfaces/ITaskHostWriteGuard.md), one guarded unit per method call; the broker's own
`writeGuard`, if any, still wraps each section inside. See [ITaskHostWriteGuard](../interfaces/ITaskHostWriteGuard.md) for how
the two compose.

## Accessors

### delivery

#### Get Signature

> **get** **delivery**(): [`IBoundTaskDelivery`](../interfaces/IBoundTaskDelivery.md)

The bound delivery the pump drains — for `pending`, `issued` and start-up `abandon`.

##### Returns

[`IBoundTaskDelivery`](../interfaces/IBoundTaskDelivery.md)

## Methods

### abandon()

> **abandon**(`prepared`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`DeliveryId`](../type-aliases/DeliveryId.md)\>\>

Releases a prepared delivery unprocessed. What it named stays owed and is presented again.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `prepared` | [`IPreparedTaskDelivery`](../interfaces/IPreparedTaskDelivery.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`DeliveryId`](../type-aliases/DeliveryId.md)\>\>

***

### acknowledge()

> **acknowledge**(`prepared`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskDeliveryDischarge`](../interfaces/ITaskDeliveryDischarge.md)\>\>

Discharges a prepared delivery — only once the host's own work for it has committed — then
releases its receipt and, for a terminal revision, disposes of the task's older owed revisions.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `prepared` | [`IPreparedTaskDelivery`](../interfaces/IPreparedTaskDelivery.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskDeliveryDischarge`](../interfaces/ITaskDeliveryDischarge.md)\>\>

#### Remarks

Fails, with nothing discharged, when `prepared` is not an object this pump handed out, or the
acknowledgement does not commit — say the principal may no longer acknowledge the task. A refused
acknowledgement **releases its receipt** and spends `prepared`: the revision stays owed and comes
back from the next `next` (or, if it is now withheld, from nothing — see
[TaskDeliveryPump.disposeWithheld](#disposewithheld)). Once it commits the call succeeds, and anything after
it that did not complete is listed in [ITaskDeliveryDischarge.issues](../interfaces/ITaskDeliveryDischarge.md#property-issues).

***

### dispose()

> **dispose**(`prepared`, `reason`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskDeliveryDischarge`](../interfaces/ITaskDeliveryDischarge.md)\>\>

Ends a prepared delivery's obligations without acknowledging them, recording `reason` in the
subscription's history — the receipt released first, since the broker refuses to dispose of
what an issued receipt names; then, for a terminal revision, the task's older owed revisions
disposed of too. The disposal is made through the pump's own binding, which is a drain
principal of the subscription — the rule `TaskBroker.dispose` applies — so it fails, like every
other pump operation, once the host removes that principal.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `prepared` | [`IPreparedTaskDelivery`](../interfaces/IPreparedTaskDelivery.md) |
| `reason` | `string` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskDeliveryDischarge`](../interfaces/ITaskDeliveryDischarge.md)\>\>

#### Remarks

Fails, with nothing disposed, when `prepared` is not an object this pump handed out, or the
release or the disposal does not commit; the revision stays owed and is presented again. A
disposal that fails **after** the release has already given up the receipt: `prepared` can no
longer be decided, and the revision comes back from the next `next`. A receipt a crash left
issued over the same revision makes the disposal fail until it expires — see the class remarks.

***

### disposeWithheld()

> **disposeWithheld**(`reason`, `limit?`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskWithheldDisposal`](../interfaces/ITaskWithheldDisposal.md)\>\>

Ends, with `reason`, up to `limit` obligations the subscription is owed that this principal is
**withheld** — a task moved out of the binding's scopes, reassigned, or no longer acknowledgeable
under the policy — through `IBoundTaskDelivery.disposeWithheld`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `reason` | `string` |
| `limit?` | `number` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskWithheldDisposal`](../interfaces/ITaskWithheldDisposal.md)\>\>

#### Remarks

`next` never presents a withheld update, so it never blocks the pump; but it stays owed, and holds
its task's archive, until something ends it. The pump does **not** end them on its own: access can
come back (a policy that changes again, a task moved back), and a disposal cannot be undone. The
host decides when — on its own sweep, say — and this call is the bounded path, reporting how many
it ended, how many a receipt still pins, and whether more remain: counts, never ids, which would
name tasks the principal may not read. It is refused unless the pump's binding is a drain
principal whose policy carries the identity the subscription recorded, covers its whole
selection, and is granted `acknowledge` and `dispose-obligation` — the rule
`IBoundTaskDelivery.disposeWithheld` states.

***

### next()

> **next**(): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPreparedTaskDelivery`](../interfaces/IPreparedTaskDelivery.md) \| `undefined`\>\>

Prepares the next owed task revision — or answers `undefined` when nothing this principal may
see is owed.

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPreparedTaskDelivery`](../interfaces/IPreparedTaskDelivery.md) \| `undefined`\>\>

#### Remarks

One render of one owed revision the principal may see and acknowledge now; withheld ones are
never presented. An oversize revision is skipped while a smaller owed one fits. When none fits —
the candidate renders abbreviated or not at all — the receipt is released and the call **fails
loudly** rather than presenting it as if delivered. An abbreviated candidate is named with only
its own update ids, never another task's; one omitted outright names nothing, and the message
advises raising `maxChars`. It fails again on every call until the host raises `budget.maxChars`
or ends the candidate's ids (`TaskBroker.dispose`). At most 1,000 owed updates are read
per preparation, so a subscription whose first 1,000 are all withheld presents nothing until
[TaskDeliveryPump.disposeWithheld](#disposewithheld) ends some.

***

### create()

> `static` **create**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TaskDeliveryPump`\>

Creates a pump over one subscription's delivery. Fails when the broker refuses the binding —
including, with `not-found-or-denied`, when its principal is not one of the subscription's drain
principals.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`ITaskDeliveryPumpParams`](../interfaces/ITaskDeliveryPumpParams.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TaskDeliveryPump`\>
