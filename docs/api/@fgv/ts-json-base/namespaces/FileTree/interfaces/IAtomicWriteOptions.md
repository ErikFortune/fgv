[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / IAtomicWriteOptions

# Interface: IAtomicWriteOptions

Options controlling an atomic write.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-guarantee"></a> `guarantee` | `readonly` | `"session"` \| `"process-crash"` \| `"os-crash"` \| `"power-loss"` | The durability guarantee the caller requires. A guarantee stronger than the store can honor fails before any mutation — there is no silent downgrade to a weaker guarantee than requested. |
