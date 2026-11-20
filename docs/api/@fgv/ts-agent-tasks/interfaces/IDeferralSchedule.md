[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IDeferralSchedule

# Interface: IDeferralSchedule

How a deferred obligation is retried, in milliseconds. See [DeferredObligations.retry](../classes/DeferredObligations.md#retry).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-basems"></a> `baseMs` | `readonly` | `number` | The first backoff, and the least any retry waits. |
| <a id="property-capms"></a> `capMs` | `readonly` | `number` | The longest backoff. A retry at or past it is held by the host rather than written. |
| <a id="property-maxdeferralms"></a> `maxDeferralMs` | `readonly` | `number` | How long after its creation an obligation may still be retried; past it, it expires. |
