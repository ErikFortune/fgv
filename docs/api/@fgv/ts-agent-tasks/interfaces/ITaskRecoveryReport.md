[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskRecoveryReport

# Interface: ITaskRecoveryReport

Everything open found and did.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-completedregistrations"></a> `completedRegistrations` | `readonly` | readonly [`TaskId`](../type-aliases/TaskId.md)[] | Pending registrations whose record was present, completed (marked live) by this open. |
| <a id="property-completedsubscriptions"></a> `completedSubscriptions` | `readonly` | readonly [`SubscriptionId`](../type-aliases/SubscriptionId.md)[] | Pending subscription registrations whose record was present, activated by this open. (T7.) |
| <a id="property-issues"></a> `issues` | `readonly` | readonly [`ITaskRecoveryIssue`](ITaskRecoveryIssue.md)[] | - |
| <a id="property-pendingregistrations"></a> `pendingRegistrations` | `readonly` | readonly `object`[] | Pending registrations whose record was never written; their reservations remain held. |
| <a id="property-pendingsubscriptions"></a> `pendingSubscriptions` | `readonly` | readonly `object`[] | Pending subscription registrations whose record was never written: inactive, their activation reservation still held, until the same registration is retried. (T7.) |
| <a id="property-removedtemporaries"></a> `removedTemporaries` | `readonly` | readonly `string`[] | Working files of interrupted atomic writes, removed at exclusive open. |
| <a id="property-repositoryid"></a> `repositoryId?` | `readonly` | `string` | - |
