[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / IAtomicWriteReceipt

# Interface: IAtomicWriteReceipt

Receipt returned by a successful atomic write.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-guarantee"></a> `guarantee` | `readonly` | `"session"` \| `"process-crash"` \| `"os-crash"` \| `"power-loss"` | The guarantee actually honored. Always equal to the guarantee requested in [FileTree.IAtomicWriteOptions.guarantee](IAtomicWriteOptions.md#property-guarantee) — a weaker receipt is never substituted for a stronger request. |
| <a id="property-replaced"></a> `replaced` | `readonly` | `boolean` | `true` if this write replaced an existing file; `false` if it created a new one. |
