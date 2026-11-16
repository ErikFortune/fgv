[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IResolvedTaskCommitRecord

# Interface: IResolvedTaskCommitRecord

A resolved task's single atomic commit record — current state, owed updates and dedup
evidence together (design §8.3).

## Remarks

`recordRevision` advances on every replacement, including maintenance that leaves the
task's semantic `revision` unchanged. `archived: true` makes this record the task's
tombstone: its final snapshot, source revision and operation evidence are retained.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-archived"></a> `archived` | `readonly` | `boolean` | - |
| <a id="property-capacityclaims"></a> `capacityClaims` | `readonly` | readonly [`ITaskCapacityClaim`](../type-aliases/ITaskCapacityClaim.md)[] | - |
| <a id="property-formatversion"></a> `formatVersion` | `readonly` | `1` | - |
| <a id="property-operations"></a> `operations` | `readonly` | readonly [`IStoredTaskOperation`](../type-aliases/IStoredTaskOperation.md)[] | - |
| <a id="property-recordrevision"></a> `recordRevision` | `readonly` | `number` | - |
| <a id="property-recordtype"></a> `recordType` | `readonly` | `"resolved"` | - |
| <a id="property-sourcerevision"></a> `sourceRevision?` | `readonly` | [`ISourceRevision`](ISourceRevision.md) | - |
| <a id="property-stops"></a> `stops?` | `readonly` | readonly [`IStopIntent`](IStopIntent.md)[] | The cascade stops this task is the root of, latching or not (design § 8.3, § 10). An intent is never removed: a released or settled one is retained as the stop's report. (T9: additive and optional — a record with no stop omits it. § 8.3 sketched one `stop`; overlapping intents are represented independently, so this holds up to one latching intent per mode.) |
| <a id="property-task"></a> `task` | `readonly` | [`ITaskSnapshot`](ITaskSnapshot.md) | - |
| <a id="property-updates"></a> `updates` | `readonly` | readonly [`ITaskUpdate`](ITaskUpdate.md)[] | - |
