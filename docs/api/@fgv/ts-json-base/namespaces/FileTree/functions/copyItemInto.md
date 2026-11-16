[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / copyItemInto

# Function: copyItemInto()

> **copyItemInto**\<`TCT`\>(`source`, `destination`, `options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ICopyReport`](../interfaces/ICopyReport.md)\>

Copies an item into a destination directory as a child of the same name, recursing for
directories.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | [`FileTreeItem`](../type-aliases/FileTreeItem.md)\<`TCT`\> | The file or directory to copy. |
| `destination` | [`IMutableFileTreeDirectoryItem`](../interfaces/IMutableFileTreeDirectoryItem.md)\<`TCT`\> | The directory to copy it into. Narrow with [isMutableDirectoryItem](isMutableDirectoryItem.md). |
| `options?` | [`ICopyOptions`](../interfaces/ICopyOptions.md) | Optional [options](../interfaces/ICopyOptions.md). |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ICopyReport`](../interfaces/ICopyReport.md)\>

`Success` with an [ICopyReport](../interfaces/ICopyReport.md), or `Failure` with
a message naming the path that could not be copied.

## Remarks

**Every file that lands is byte-identical to its source, or the copy says so.** Where
the destination store is byte-native the bytes are carried verbatim; where it persists
text they are carried as text only after verifying that the text re-encodes to exactly
the source bytes. A file that survives neither route is failed or skipped per
[onUnfaithfulFile](../interfaces/ICopyOptions.md#property-onunfaithfulfile) — it is never written
in a form that differs from the source.

That verification is not ceremony: a UTF-8 BOM is stripped on decode and not restored on
encode, so a BOM-prefixed file copied through text loses three bytes while decoding
without error. Reasoning about which files are "just text" is exactly what produces that
class of bug, which is why the check is unconditional rather than advisory.

The copy reads bytes and only bytes. Falling back to a text read when a source cannot
produce them would yield a file whose faithfulness nothing had established, so a source
store with no byte capability is a `Failure` rather than a quiet text copy.

**"Its source" means what the source item's `getRawBytes` reports**, which is only as
faithful as that store's own custody of the original bytes — the same line
[the strict-text capability](../interfaces/IStrictTextFileTreeAccessors.md) draws. A store
whose transport already decoded the bytes (an `HttpTreeAccessors` under its default
encoding, a `localStorage` tree, an in-memory tree seeded with a `string`) hands back a
re-encode, and a copy reproduces that faithfully and reports success. This copy cannot
improve on the custody its source has; what it will not do is *downgrade* a source that
has custody into a text write.

Existing destination files of the same name are overwritten, matching
[createChildFile](../interfaces/IMutableFileTreeDirectoryItem.md#createchildfile).

**A copy is not atomic and does not roll back.** Every file is attempted, so a failure
names *every* path that could not be carried rather than only the first — which is the
useful form when the answer is "these files should not have been in the set" — and the
destination is left holding whatever did succeed. There is no mode in which a failed
copy leaves the destination untouched.

Copying a directory into a location beneath its own source is not supported: the walk
would re-read a subtree it is concurrently growing. That cannot be detected from the
items alone, so it surfaces as a failure once the recursion passes a fixed depth bound
far beyond any real tree.
