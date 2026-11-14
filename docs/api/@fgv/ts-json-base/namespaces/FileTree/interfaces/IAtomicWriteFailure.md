[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / IAtomicWriteFailure

# Interface: IAtomicWriteFailure

Classified detail for a failed atomic write.

## Remarks

Separates *why* the write failed from *what a reader can now see*, because
those are independent questions once a write protocol has multiple stages.
A failure at `'replace'` or later may have already changed what is durably
visible; a failure at `'validate'` never has.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-code"></a> `code` | `readonly` | `"unsupported"` \| `"not-writable"` \| `"io"` | - `unsupported`: the store or destination does not support atomic writes, or the requested guarantee exceeds what the store can honor. - `not-writable`: the destination or containing directory is not writable, or the requested name/path is not valid. - `io`: an underlying read/write/flush/rename operation failed. |
| <a id="property-stage"></a> `stage` | `readonly` | `"replace"` \| `"validate"` \| `"temporary-write"` \| `"file-flush"` \| `"directory-flush"` | The protocol stage at which the failure occurred. - `validate`: destination, guarantee and path checks, before anything is touched. Always `visibility: 'unchanged'`. - `temporary-write`: creating or writing the working file a store commits through. The destination has not been opened. - `file-flush`: flushing or closing that working file. The previous destination is still authoritative. - `replace`: the rename or assignment that makes the new contents visible. This is the stage whose `visibility` can be `'unknown'`. - `directory-flush`: establishing the durability boundary *after* the contents are already visible, so `visibility` is `'replaced'`. **Remarks** A store that replaces in one step produces only `'validate'` and `'replace'`; a store that commits through a working file produces all five. There is deliberately no `'cleanup'` stage. Removing a working file is something a store does *on the way out of* a failure, and the failure a caller has to act on is the one that caused it — so a cleanup problem is reported in the message and never replaces the classification. A successful commit leaves nothing to clean up, because the replacement consumes the working file. |
| <a id="property-visibility"></a> `visibility` | `readonly` | `"unknown"` \| `"unchanged"` \| `"replaced"` | What a subsequent reader can now see for the destination path. - `unchanged`: the destination still holds whatever it held before this call — nothing was mutated. - `replaced`: the destination was already replaced when the failure occurred (a failure during a later stage, such as directory flush). - `unknown`: the underlying operation's outcome could not be determined (for example, an ambiguous system-call result). |
