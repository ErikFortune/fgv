[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / IAtomicWriteCapabilities

# Interface: IAtomicWriteCapabilities

Reports what atomic replacement a directory's backing store can actually
offer.

## Remarks

This is an inquiry, not a capability guard: a store that cannot atomically
replace anything still answers `Success` with `atomicReplace: false` and an
empty `guarantees` list, rather than `Failure` — the guard
([isAtomicAccessors](../functions/isAtomicAccessors.md) /
[isAtomicDirectoryItem](../functions/isAtomicDirectoryItem.md)) answers
*method presence*; this answers *what a write would actually achieve*, the
same relationship [getIsMutable](IMutableFileTreeFileItem.md#getismutable) has to [isMutableFileItem](../functions/isMutableFileItem.md).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-atomicreplace"></a> `atomicReplace` | `readonly` | `boolean` | `true` if this store can replace a file such that a reader never observes a torn write. |
| <a id="property-guarantees"></a> `guarantees` | `readonly` | readonly (`"session"` \| `"process-crash"` \| `"os-crash"` \| `"power-loss"`)[] | The durability guarantees this store can honor for an atomic write, weakest to strongest. Empty when `atomicReplace` is `false`. |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | Why the store answered as it did, in a form that can be shown to a caller whose durable write would be refused — for a capable store as well as an incapable one. Optional: a store that cannot say leaves it absent. |
