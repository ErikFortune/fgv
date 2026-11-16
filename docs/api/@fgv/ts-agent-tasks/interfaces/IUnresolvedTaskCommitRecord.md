[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IUnresolvedTaskCommitRecord

# Interface: IUnresolvedTaskCommitRecord

The record of a registered external task whose first usable observation has not arrived.

## Remarks

No lifecycle is invented for it. Its registration operation is the first entry of
`operations`, so the unresolved and resolved variants carry dedup evidence the same way.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-capacityclaims"></a> `capacityClaims` | `readonly` | readonly [`ITaskCapacityClaim`](../type-aliases/ITaskCapacityClaim.md)[] |
| <a id="property-formatversion"></a> `formatVersion` | `readonly` | `1` |
| <a id="property-operations"></a> `operations` | `readonly` | readonly [`IStoredTaskOperation`](../type-aliases/IStoredTaskOperation.md)[] |
| <a id="property-recordrevision"></a> `recordRevision` | `readonly` | `number` |
| <a id="property-recordtype"></a> `recordType` | `readonly` | `"unresolved"` |
| <a id="property-reference"></a> `reference` | `readonly` | [`IUnresolvedTaskReference`](IUnresolvedTaskReference.md) |
