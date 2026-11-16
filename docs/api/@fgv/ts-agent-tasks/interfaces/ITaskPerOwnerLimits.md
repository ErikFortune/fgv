[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskPerOwnerLimits

# Interface: ITaskPerOwnerLimits

Per-owner count limits that sit below the repository-wide dimensions.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-maxacknowledgementidspersubscription"></a> `maxAcknowledgementIdsPerSubscription` | `readonly` | `number` | Maximum exact acknowledgement/disposition IDs retained for one subscription. |
| <a id="property-maxaudienceperupdate"></a> `maxAudiencePerUpdate` | `readonly` | `number` | Maximum audience subscriptions attached to one update. |
| <a id="property-maxoperationspertask"></a> `maxOperationsPerTask` | `readonly` | `number` | Maximum stored command and catalog operations for one task. |
| <a id="property-maxoutstandingreceiptspersubscription"></a> `maxOutstandingReceiptsPerSubscription` | `readonly` | `number` | Maximum concurrently outstanding issued-receipt manifests for one subscription. |
