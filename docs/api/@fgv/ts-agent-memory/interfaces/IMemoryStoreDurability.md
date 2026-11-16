[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryStoreDurability

# Interface: IMemoryStoreDurability

What a [FileTreeMemoryStore](../classes/FileTreeMemoryStore.md) established about its writes when it opened.

## Remarks

When `atomic` is `true`, every record write either replaces the whole file or leaves the
previous one in place: a crash mid-write cannot leave a torn record that would fail the next
open. The guarantee is chosen once; a later write that cannot honour it — a scope directory on
another mount, say — fails rather than falling back to a plain write.

This covers single files only. An operation that touches several files is not atomic as a whole:
a versioned put writes the new version and invalidates the previous current version in
separate writes, and a cap-cull admission writes one record and deletes others. A crash between
them leaves each file whole, and the open-time walk tolerates the mix: current-version
selection takes the highest `seq`, so a stale "current" sibling loses, and a cap that a crash
left exceeded is culled again by the next admission.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-atomic"></a> `atomic` | `readonly` | `boolean` | Whether record writes are atomic. |
| <a id="property-guarantee"></a> `guarantee?` | `readonly` | `"session"` \| `"process-crash"` \| `"os-crash"` \| `"power-loss"` | The guarantee every record write honours. Present exactly when `atomic` is `true`. |
| <a id="property-reason"></a> `reason` | `readonly` | `string` | Why, as the root answered it — the qualification on a qualified root, the refusal otherwise. |
| <a id="property-removedtemporaries"></a> `removedTemporaries` | `readonly` | readonly `string`[] | Working files of interrupted atomic writes that the open removed, as paths relative to the root. Usually empty; non-empty means an earlier writer stopped mid-write. |
