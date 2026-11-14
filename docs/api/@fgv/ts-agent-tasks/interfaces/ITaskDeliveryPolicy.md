[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskDeliveryPolicy

# Interface: ITaskDeliveryPolicy

A subscription's delivery policy, persisted with it (design § 9).

## Remarks

**The stored policy is authoritative.** It is never reconstructed from a host's current defaults
on reopen: changing the defaults changes what *new* subscriptions get, not what an existing one is
owed.

- `durability` — the checkpoint guarantee the subscription was admitted with. Delivery refuses to
  run against a repository or checkpoint store weaker than it.
- `history` — `source-replay` promises every required external revision; admitting an external
  task that cannot keep that promise into the subscription's selection is refused, never
  downgraded.
- `categories` — the update categories the subscription is owed, ascending and unique; always a
  superset of [mandatoryDeliveryCategories](../variables/mandatoryDeliveryCategories.md).

- `coalesceProgress` — the subscription accepts that routine (non-required) `progress` and
  `observation` updates it has not yet been delivered may be superseded by a newer update of the
  same category for the same task, rather than each being retained until acknowledged. Required
  categories never coalesce, and nothing an unacknowledged issued receipt names is ever superseded.
  A superseding update records the earliest revision it replaced (`ITaskUpdate.coalesced`), so the
  gap is visible rather than silent.

(T7: the design sketch's `requiredCategories` is named `categories` here, because membership in
it is what makes a subscription part of an update's audience; whether an update is *required* —
cannot be coalesced or expire — remains a property of its category.)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-categories"></a> `categories` | `readonly` | readonly [`UpdateCategory`](../type-aliases/UpdateCategory.md)[] |
| <a id="property-coalesceprogress"></a> `coalesceProgress` | `readonly` | `boolean` |
| <a id="property-durability"></a> `durability` | `readonly` | `"session"` \| `"process-crash"` |
| <a id="property-history"></a> `history` | `readonly` | [`SourceHistoryContract`](../type-aliases/SourceHistoryContract.md) |
| <a id="property-schemaversion"></a> `schemaVersion` | `readonly` | `1` |
