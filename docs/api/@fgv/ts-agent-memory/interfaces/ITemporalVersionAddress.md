[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / ITemporalVersionAddress

# Interface: ITemporalVersionAddress

The `(entityId, version seq)` an [ITemporalIdentityCodec.decodeVersion](ITemporalIdentityCodec.md#decodeversion)
recovers from a version file address.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-entityid"></a> `entityId` | `readonly` | [`EntityId`](../type-aliases/EntityId.md) | The stable consumer-supplied domain key. |
| <a id="property-seq"></a> `seq` | `readonly` | `number` | The version's monotonic `seq` (the `v<seq>` component of the file stem). |
